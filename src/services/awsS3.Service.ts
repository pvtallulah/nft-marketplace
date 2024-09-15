import AWS from "aws-sdk";
import * as crypto from "crypto";
import { AppDataSource } from "../db/data-source";
import { Uri } from "../db/entity";
import { IsNull } from "typeorm";
import { getImageData } from "./image.service";
import { newErrorV2 } from "./discord.service";
import { findMimeType } from "middlewares";

const uriRepository = AppDataSource.getRepository(Uri);

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME } =
  process.env;

AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: "us-east-1",
});

const s3 = new AWS.S3();

export const createReadStream = (
  key: string,
  bucket: string = S3_BUCKET_NAME
) => {
  const s3Params = {
    Bucket: bucket,
    Key: key,
  };

  return s3.getObject(s3Params).createReadStream();
};

export const uploadMediaS3 = async (
  key: string,
  file: Express.Multer.File,
  bucket: string = S3_BUCKET_NAME
) => {
  const params = {
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
  };

  return await s3.upload(params).promise();
};

export const populateUri = async () => {
  const urisToPopulate = await uriRepository.find({
    where: {
      s3Url: IsNull(),
    },
  });

  for (const uriToPopulate of urisToPopulate) {
    const rawMetadata = uriToPopulate.metadata;
    try {
      const parsedMetadata = JSON.parse(rawMetadata);
      if (parsedMetadata) {
        const { image } = parsedMetadata;
        const fileType = findMimeType(image);
        if (image) {
          const imageData = await getImageData(image);
          if (imageData) {
            const hash = crypto
              .createHash("md5")
              .update(imageData)
              .digest("hex");
            const key = `marketplace/${hash}${fileType.extensions[0]}`;

            try {
              await s3
                .headObject({ Bucket: S3_BUCKET_NAME, Key: key })
                .promise();
              uriToPopulate.s3Url = `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
              await uriRepository.save(uriToPopulate);
            } catch (error) {
              if (error.code === "NotFound") {
                const params = {
                  Bucket: S3_BUCKET_NAME,
                  Key: key,
                  Body: imageData,
                };

                const s3Result = await s3.upload(params).promise();
                uriToPopulate.s3Url = s3Result.Location;
                await uriRepository.save(uriToPopulate);
                console.log(
                  `File uploaded successfully at ${s3Result.Location}`
                );
              } else {
                console.log(
                  `Error checking object existence for key ${key}:`,
                  error
                );
              }
            }
          }
        }
      }
    } catch (error) {
      newErrorV2({
        title: "Error parsing metadata to s3 uri",
        description: `Error parsing metadata for uri: ${uriToPopulate.id}`,
      });
      console.log("Error parsing metadata: ", error);
    }
  }
};
