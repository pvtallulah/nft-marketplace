import AWS from "aws-sdk"; // Using AWS SDK for R2's S3-compatible API
import * as crypto from "crypto";
import { AppDataSource } from "../db/data-source";
import { Uri } from "../db/entity";
import { IsNull, Not } from "typeorm";
import { getImageData } from "./image.service";
import { newErrorV2, newEventV2 } from "./discord.service";
import { findMimeType } from "../middlewares";
import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";
dotenv.config();
const uriRepository = AppDataSource.getRepository(Uri);
let batchToken: {
  token: string;
  expiresAt: string;
} | null = null;

let refetchImages = true;
let allImages: ImageData[] = [];
let isFetchingImages = false;

const {
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_ACCESS_KEY,
  CLOUDFLARE_R2_BUCKET,
  CLOUDFLARE_ACCESS_KEY_SECRET,
  CLOUDFLARE_R2_ENDPOINT,
  CLOUDFARE_IMAGE_API_TOKEN,
} = process.env;

const baseURL = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}`;

interface CloudflareError {
  code: number;
  message: string;
}

interface CloudflareMessage {
  code: number;
  message: string;
}
interface ImageUploadResponse {
  result: ImageData;
  success: boolean;
  errors: CloudflareError[];
  messages: CloudflareMessage[];
}

interface ImageData {
  id: string;
  filename: string;
  meta: {
    key: string;
  };
  uploaded: string;
  requireSignedURLs: boolean;
  variants: string[];
}

const cloudflareHttp = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    authorization: `Bearer ${CLOUDFARE_IMAGE_API_TOKEN}`,
  },
});

const s3 = new AWS.S3({
  endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: CLOUDFLARE_ACCESS_KEY,
  secretAccessKey: CLOUDFLARE_ACCESS_KEY_SECRET,
  signatureVersion: "v4",
  region: "auto",
  s3ForcePathStyle: true,
});

export const createReadStream = (
  key: string,
  bucket: string = CLOUDFLARE_R2_BUCKET
) => {
  const s3Params = {
    Bucket: bucket,
    Key: key,
  };

  return s3.getObject(s3Params).createReadStream();
};

export const uploadMediaR2 = async (
  key: string,
  file: Express.Multer.File,
  bucket: string = CLOUDFLARE_R2_BUCKET
) => {
  const params = {
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
    metadata: {
      filename: file.originalname,
    },
  };
  // findMimeType(file.buffer)
  // si imagen -> image service
  // else -> bucket
  try {
    return await s3
      .headObject({ Bucket: CLOUDFLARE_R2_BUCKET, Key: key })
      .promise();
  } catch (error) {
    return await s3.upload(params).promise();
  }
};

const getBatchToken = async () => {
  try {
    const res = await cloudflareHttp.get<{
      result: {
        token: string;
        expiresAt: string;
      };
    }>("/images/v1/batch_token");
    batchToken = res.data.result;
  } catch (error) {
    newErrorV2({
      title: "Error getting batch token",
      description: "Error getting batch token",
      extraData: error.message || error,
    });
    throw error;
  }
};

async function fetchAllImages() {
  try {
    let continuationToken = null;
    allImages = [];
    do {
      const response = await cloudflareHttp.get<{
        result: {
          images: ImageData[];
          continuation_token: string | null;
        };
      }>(`/images/v2`, {
        params: {
          continuation_token: continuationToken,
          per_page: 10000,
        },
      });

      allImages = [...allImages, ...response.data.result.images];
      continuationToken = response.data.result.continuation_token;
    } while (continuationToken);

    newEventV2({
      title: "Fetch all images",
      description: `Fetched ${allImages.length} images`,
    });
    refetchImages = false;
    return allImages;
  } catch (error) {
    newErrorV2({
      title: "Error fetching all images",
      description: `${baseURL}/images/v2`,
      extraData: error.message || error,
    });
  }
}

const imageExists = (imgKey: string) => {
  return allImages.find((image) => image.meta.key === imgKey);
};

export const populateUri = async () => {
  const startTime = new Date().toISOString();
  try {
    let image = null;
    const urisToPopulate = await uriRepository.find({
      where: {
        s3Url: IsNull(),
        metadata: Not(IsNull()),
        badUri: false,
      },
    });
    if (!urisToPopulate.length) return;
    if (refetchImages) await fetchAllImages();
    if (!batchToken || new Date(batchToken.expiresAt) < new Date()) {
      await getBatchToken();
    }
    for (const uriToPopulate of urisToPopulate) {
      const rawMetadata = uriToPopulate.metadata;
      let key = "";
      try {
        const parsedMetadata = JSON.parse(rawMetadata);
        if (parsedMetadata) {
          image = parsedMetadata.image || null;
          if (image) {
            if (image.startsWith("https://api.dglive.org/media/")) {
              const imageKey = image.split("https://api.dglive.org/media/")[1];
              image = `https://pub-d74340d79d8e4ff6953ce683be56feac.r2.dev/marketplace/${imageKey}`;
            }
            const imageData = await getImageData(image);
            if (imageData) {
              const fileType = findMimeType(imageData);
              const hash = crypto
                .createHash("md5")
                .update(imageData)
                .digest("hex");
              key = `marketplace-${hash}${fileType.extensions[0]}`;
              const imgExist = imageExists(key);
              if (imgExist) {
                uriToPopulate.imgUUID = imgExist.id;
                uriToPopulate.key = key;
                const variant = imgExist.variants.find((x) =>
                  x.includes("public")
                );
                uriToPopulate.s3Url = variant;
                await uriRepository.save(uriToPopulate);
                continue;
              }

              try {
                const data = new FormData();
                data.append("metadata", JSON.stringify({ key }));
                data.append("file", imageData, {
                  filename: `${key}`,
                  contentType: fileType.extensions[0],
                });
                data.append("requireSignedURLs", "false");
                const res = await cloudflareHttp.post<ImageUploadResponse>(
                  "/images/v1",
                  data,
                  {
                    headers: {
                      ...data.getHeaders(),
                      "Content-Type": "multipart/form-data",
                      authorization: `Bearer ${CLOUDFARE_IMAGE_API_TOKEN}`,
                    },
                  }
                );
                const {
                  success,
                  errors,
                  messages,
                  result: { id: imgUUID, variants },
                } = res.data;
                if (!success) {
                  let errMessage =
                    "Errors: " +
                    errors.map((err) => "* " + err.message).join("\n");
                  errMessage =
                    "Messages: " +
                    messages.map((msg) => "* " + msg.message).join("\n");
                  newErrorV2({
                    title: "Error uploading image to img service",
                    description: `Filetype: ${fileType.extensions[0]} | key: ${key}`,
                    extraData: errMessage,
                  });
                  continue;
                }
                uriToPopulate.imgUUID = imgUUID;
                uriToPopulate.key = key;
                const variant = variants.find((x) => x.includes("public"));
                uriToPopulate.s3Url = variant;
                refetchImages = true;
                newEventV2({
                  title: "Image uploaded to img service",
                  description: `New image added, refetching images details`,
                });
                await uriRepository.save(uriToPopulate);
              } catch (error) {
                console.log("Error checking object existence for key: ", error);
                newErrorV2({
                  title: "Error checking object existence",
                  description: `Error checking object existence for key: ${key}, uriId ${uriToPopulate.id} uriUrl: ${uriToPopulate.uriUrl}`,
                  extraData: error.message || error,
                });
              }
            }
          }
        }
      } catch (error) {
        let errMessage = error.message || error;
        errMessage += `\n uriToPopulate: ${uriToPopulate.id}`;
        errMessage += `\n uri: ${uriToPopulate.uriUrl}`;
        errMessage += `\n image: ${image}`;
        errMessage += `\n key: ${key}`;
        newErrorV2({
          title: "Error parsing metadata to r2 uri",
          description: `Error parsing metadata for uri: ${uriToPopulate.id} - Will remove bad image and continue to next uri`,
          extraData: errMessage,
        });
        uriToPopulate.badUri = true;
        await uriRepository.save(uriToPopulate);
      }
    }
    isFetchingImages = false;
  } catch (error) {
    newErrorV2({
      title: "Error populating uri",
      description: "An unexpected error occurred while populating uri",
      extraData: error.message || error,
    });

    const errMessage = error?.message ?? "" + "\n error:" + error;
    newErrorV2({
      title: "Error populating uri",
      description: "An unexpected error occurred while populating uri",
      extraData: errMessage,
    });
  } finally {
    // newEventV2({
    //   title: `Populating uris`,
    //   description: `Time spent: ${
    //     new Date().getTime() - new Date(startTime).getTime()
    //   }ms`,
    // });
  }
};
