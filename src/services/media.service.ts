import * as fs from "fs";
import * as crypto from "crypto";
import * as path from "path";
import { AppDataSource } from "../db/data-source";
import { Media } from "../db/entity";
import { IMedia } from "interfaces";
import { newErrorV2 } from "./discord.service";
import { uploadMediaR2 } from "./r2.Service";

export async function uploadMedia(file: Express.Multer.File): Promise<IMedia> {
  // Create MD5 hash of the file directly from the buffer
  const hash = crypto.createHash("md5").update(file.buffer).digest("hex");

  // Check if the file already exists in the database
  const mediaRepository = AppDataSource.getRepository(Media);
  const existingMedia = await mediaRepository.findOne({
    where: { media_hash: hash },
  });

  if (existingMedia) {
    // File already exists in database, return the existing media info
    return {
      media_id: existingMedia.media_id,
      media_hash: existingMedia.media_hash,
      mime_type: existingMedia.mime_type,
      file_extension: existingMedia.file_extension,
      file_name: existingMedia.file_name,
    };
  } else {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const key = `marketplace/${hash}${fileExtension}`;

    let data = null;
    try {
      data = await uploadMediaR2(key, file);
      console.log(`File uploaded successfully at ${data.Location}`);
    } catch (err) {
      console.log("Error uploading data: ", err);
      throw err; // Rethrow or handle error as needed
    }
    if (!data) {
      newErrorV2({
        title: "Error uploading data",
        description: "Error uploading data",
      });
      throw new Error("Error uploadMedia");
    }
    // If file does not exist, move the file to the permanent directory
    // const fileExtension = path.extname(file.originalname).toLowerCase();
    // Record it in the media table
    const media = new Media();
    media.media_hash = hash;
    media.mime_type = file.mimetype; // Set media type using detected mimetype
    media.file_extension = fileExtension; // Set file extension
    media.file_name = file.originalname || "no-name"; // Set file extension
    const savedMedia = await mediaRepository.save(media);

    return {
      media_id: savedMedia.media_id,
      media_hash: hash,
      mime_type: file.mimetype,
      file_extension: fileExtension,
      file_name: file.originalname,
    };
  }
}
