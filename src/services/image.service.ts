import fs from "fs";
import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
import pngParser from "pngjs";
import { ExifParserFactory } from "ts-exif-parser";
import probe from "probe-image-size";
import {
  IImagesDimensionsRequest,
  IImagesDimensionsResponse,
} from "../interfaces";
import { In } from "typeorm";
import { map } from "lodash";
import { AppDataSource } from "../db/data-source";
import { MarketListing, RawResourceData } from "../db/entity";
import { getCloudflareIPFSUrl } from "./ipfs.service";
import { newErrorV2 } from "./discord.service";

dotenv.config();
const { IMAGE_CHUNK_SIZE } = process.env;
const chunkSize: number = parseInt(IMAGE_CHUNK_SIZE) || 65635;

const marketListingRepository = AppDataSource.getRepository(MarketListing);
const rawResourceDataRepository = AppDataSource.getRepository(RawResourceData);

const getImageDimensionsAndResourceIdDefault = async ({
  name,
  nftAddress,
  imageUrl,
  defaultImageUrl,
  bytesData,
}: {
  name: string;
  nftAddress: string;
  imageUrl: string;
  defaultImageUrl: string;
  bytesData?: Buffer;
}) => {
  return new Promise<{ resourceId: string; width: number; height: number }>(
    async (resolve, reject) => {
      const imageData: {
        resourceId: string;
        width: number;
        height: number;
      } = {
        resourceId: "",
        width: 0,
        height: 0,
      };
      const nftBuf: Buffer = Buffer.from(`${name}-${nftAddress}`, "utf8");
      let currentBuf: Buffer = Buffer.alloc(0);
      let resultBuf: Buffer = Buffer.alloc(0);
      if (bytesData) {
        imageData.resourceId = crypto
          .createHash("md5")
          .update(Buffer.concat([nftBuf, bytesData]))
          .digest("hex");
        try {
          const metadata = probe.sync(bytesData);
          if (!metadata) {
            const asyncMetadata = await probe(imageUrl);
            return resolve({ ...imageData, ...asyncMetadata });
          } else {
            return resolve({ ...imageData, ...metadata });
          }
        } catch (err) {
          console.log(err);
        }
        try {
          const metadata = await getImageMetadata(bytesData);
          resolve({ ...imageData, ...metadata });
        } catch (err) {
          resolve(imageData);
        }
      } else {
        try {
          const { data, headers } = await axios({
            url: imageUrl,
            method: "GET",
            responseType: "stream",
            timeout: 120000,
          });
          const contentType = headers["content-type"];
          let remainingLength = parseInt(headers["content-length"]);
          const dataCb = (chunk: Buffer) => {
            currentBuf = Buffer.concat([currentBuf, chunk]);
            remainingLength -= chunk.length;
            if (currentBuf.length > chunkSize) {
              resultBuf = currentBuf.slice(0, chunkSize);
              data.destroy();
            } else if (remainingLength <= 0) {
              resultBuf = currentBuf;
            }
          };
          data.on("data", dataCb);
          data.on("close", async () => {
            if (isNotSupportedContentType(contentType)) {
              const resourceIdBuf = Buffer.from(nftAddress + imageUrl, "utf8");
              imageData.resourceId = crypto
                .createHash("md5")
                .update(resourceIdBuf)
                .digest("hex");
              return resolve(imageData);
            }
            const newRawResourceData = new RawResourceData();
            newRawResourceData.data = resultBuf;
            newRawResourceData.resourceHash = crypto
              .createHash("md5")
              .update(defaultImageUrl)
              .digest("hex");

            imageData.resourceId = crypto
              .createHash("md5")
              .update(Buffer.concat([nftBuf, resultBuf]))
              .digest("hex");
            if (contentType === "image/jpeg") {
              newRawResourceData.mime = "image/jpeg";
              await rawResourceDataRepository.save(newRawResourceData);
              const parsedData = ExifParserFactory.create(resultBuf).parse();
              if (parsedData.imageSize) {
                imageData.height = parsedData?.imageSize?.height ?? 0;
                imageData.width = parsedData?.imageSize?.width ?? 0;
                resolve(imageData);
              }
            } else {
              try {
                const metadata = probe.sync(resultBuf);
                newRawResourceData.mime = metadata?.mime ?? "";
                await rawResourceDataRepository.save(newRawResourceData);
                if (!metadata) {
                  const asyncMetadata = await probe(imageUrl);
                  return resolve({ ...imageData, ...asyncMetadata });
                } else {
                  return resolve({ ...imageData, ...metadata });
                }
              } catch (err) {
                console.log(err);
              }
              try {
                const metadata = await getImageMetadata(resultBuf);
                resolve({ ...imageData, ...metadata });
              } catch (err) {
                resolve(imageData);
              }
            }
          });
        } catch (err) {
          imageData.resourceId = crypto
            .createHash("md5")
            .update(nftBuf)
            .digest("hex");
          console.error(
            "Something went wrong while getting image dimensions!!"
          );
          console.log(err);
          return resolve(imageData);
        }
      }
    }
  );
};

export const getImageDimensionsAndResourceId = async ({
  name,
  nftAddress,
  imageUrl,
}: {
  name: string;
  nftAddress: string;
  imageUrl: string;
}) => {
  const resourceHash = crypto.createHash("md5").update(imageUrl).digest("hex");
  let bytesData: Buffer = null;
  const foundRawData = await rawResourceDataRepository.findOne({
    where: { resourceHash },
  });
  if (foundRawData) bytesData = foundRawData.data;
  const data = await getImageDimensionsAndResourceIdDefault({
    name,
    nftAddress,
    imageUrl: getCloudflareIPFSUrl(imageUrl),
    defaultImageUrl: imageUrl,
    bytesData,
  });
  if (data) {
    return data;
  }
  return null;
};
const notSupportedContentTypes = ["video/mp4"];
const isNotSupportedContentType = (contentType: string): boolean => {
  return notSupportedContentTypes.includes(contentType);
};

const getImageMetadata = async (
  buf: Buffer
): Promise<{ width: number; height: number; mime: string }> => {
  return new Promise((resolve, reject) => {
    try {
      if (fs.existsSync("temp.png")) {
        fs.unlinkSync("temp.png");
      }
      fs.writeFileSync("temp.png", buf);
      const rs = fs.createReadStream("temp.png");
      const pipedPng = rs.pipe(new pngParser.PNG({}));
      const metadata: { width: number; height: number; mime: string } = {
        width: 0,
        height: 0,
        mime: "image/png",
      };
      pipedPng.on("metadata", (meta) => {
        if (meta) {
          metadata.height = meta.height ?? 0;
          metadata.width = meta.width ?? 0;
        }
        resolve(metadata);
      });
      pipedPng.on("error", (err) => {
        resolve(metadata);
      });
    } catch (err) {
      reject(err);
    }
  });
};

export const getImagesDimensions = async ({
  images,
}: IImagesDimensionsRequest): Promise<IImagesDimensionsResponse> => {
  try {
    const foundItems = await marketListingRepository.find({
      select: {
        tokenId: true,
        resourceGroup: {
          width: true,
          height: true,
          imageUrl: true,
          nftAddress: {
            nftAddress: true,
          },
        },
      },
      relations: {
        resourceGroup: {
          nftAddress: true,
        },
      },
      where: {
        tokenId: In(map(images, (image) => image.tokenId)),
        resourceGroup: {
          nftAddress: {
            nftAddress: In(map(images, (image) => image.nftAddress)),
          },
        },
      },
    });
    const imagesDimensions = map(foundItems, (image) => {
      const { tokenId, resourceGroup } = image;
      const { width, height, imageUrl } = resourceGroup;
      const { nftAddress } = resourceGroup.nftAddress;
      return {
        tokenId,
        nftAddress,
        width,
        height,
        imageUrl,
      };
    });
    return { imagesDimensions } as IImagesDimensionsResponse;
  } catch (err) {
    console.log("getImagesDimensions error: ", err);
    throw err;
  }
};

export const getImageData = async (
  imageUrl: string
): Promise<Buffer | undefined> => {
  try {
    const response = await axios.get(getCloudflareIPFSUrl(imageUrl), {
      responseType: "arraybuffer",
      timeout: 30000,
    });
    return response.data;
  } catch (err) {
    throw err;
  }
};
