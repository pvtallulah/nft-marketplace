import multer from "multer";
import { fileTypes, maxFileSize, FileType } from "../configs/media.config";

const storage = multer.memoryStorage();
const upload = multer({ storage });

export function findMimeType(buffer: Buffer): FileType | null {
  for (const fileType of fileTypes) {
    const magicNumbers = fileType.magicNumbers;
    if (magicNumbers[0] === "skip") continue;

    if (magicNumbers[0] === "svg") {
      const fileContent = buffer.toString("utf8", 0, 1024);
      if (fileContent.includes("<svg")) {
        return fileType;
      }
      continue;
    }

    // Special case for mp4 files
    if (fileType.mimeType === "video/mp4") {
      const fileContent = buffer.toString("utf8", 4, 8);
      if (fileContent === "ftyp") {
        return fileType;
      }
      continue;
    }

    let isMatch = true;
    for (let i = 0; i < magicNumbers.length; i++) {
      if (buffer[i] !== magicNumbers[i]) {
        isMatch = false;
        break;
      }
    }
    if (isMatch) {
      return fileType;
    }
  }
  return null;
}

function validateFile(file): { isValid: boolean; error: string | null } {
  const detectedMimeType = findMimeType(file.buffer)?.mimeType || "";
  if (!detectedMimeType || file.mimetype.toLowerCase() !== detectedMimeType) {
    return { isValid: false, error: "Invalid file format" };
  }
  if (file.size > maxFileSize) {
    return { isValid: false, error: "File size exceeds the maximum limit" };
  }
  return { isValid: true, error: null };
}

export const fileValidation =
  (mode: "single" | "multiple") => (req, res, next) => {
    const callback = (err) => {
      if (err) {
        console.log("Multer error:", err); // Log error from multer
        return res.status(400).send(err.message);
      }

      const files = mode === "single" ? [req.file] : req.files;

      console.log("Files processed by multer:", files); // Log the files processed by multer

      if (!files || files.length === 0) {
        return res.status(400).send("No files were uploaded");
      }

      for (const file of files) {
        const { isValid, error } = validateFile(file);
        if (!isValid) {
          // Sending error response and returning immediately
          return res.status(400).send(error);
        }
      }

      next();
    };

    if (mode === "single") {
      upload.single("file")(req, res, callback); // Single file with field name 'file'
    } else if (mode === "multiple") {
      upload.array("files")(req, res, callback); // Multiple files with field name 'files'
    }
  };
