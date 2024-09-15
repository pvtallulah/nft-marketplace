export const maxFileSize = 100 * 1024 * 1024; // Maximum file size in bytes (e.g. 100MB)
export type FileType = {
  mimeType: string;
  magicNumbers: Array<number | "skip" | "svg">;
  extensions: string[];
};
export const fileTypes: FileType[] = [
  {
    mimeType: "image/jpeg",
    magicNumbers: [0xff, 0xd8, 0xff],
    extensions: [".jpg", ".jpeg"],
  },
  {
    mimeType: "image/png",
    magicNumbers: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    extensions: [".png"],
  },
  {
    mimeType: "image/gif",
    magicNumbers: [0x47, 0x49, 0x46, 0x38],
    extensions: [".gif"],
  },
  { mimeType: "image/bmp", magicNumbers: [0x42, 0x4d], extensions: [".bmp"] },
  {
    mimeType: "image/webp",
    magicNumbers: [0x52, 0x49, 0x46, 0x46],
    extensions: [".webp"],
  },
  {
    mimeType: "image/tiff",
    magicNumbers: [0x49, 0x49, 0x2a, 0x00],
    extensions: [".tiff"],
  },
  {
    mimeType: "video/mp4",
    magicNumbers: [
      0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
    ],
    extensions: [".mp4"],
  },
  {
    mimeType: "video/mpeg",
    magicNumbers: [0x00, 0x00, 0x01, 0xba],
    extensions: [".mpeg"],
  },
  {
    mimeType: "video/quicktime",
    magicNumbers: [0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20],
    extensions: [".mov"],
  },
  {
    mimeType: "video/avi",
    magicNumbers: [0x52, 0x49, 0x46, 0x46],
    extensions: [".avi"],
  },
  {
    mimeType: "video/x-ms-wmv",
    magicNumbers: [0x30, 0x26, 0xb2, 0x75, 0x8e, 0x66, 0xcf, 0x11, 0xa6, 0xd9],
    extensions: [".wmv"],
  },
  {
    mimeType: "video/x-flv",
    magicNumbers: [0x46, 0x4c, 0x56, 0x01],
    extensions: [".flv"],
  },
  {
    mimeType: "video/3gpp",
    magicNumbers: [0x00, 0x00, 0x00, 0x0c, 0x66, 0x74, 0x79, 0x70, 0x33, 0x67],
    extensions: [".3gp"],
  },
  {
    mimeType: "video/webm",
    magicNumbers: [0x1a, 0x45, 0xdf, 0xa3],
    extensions: [".webm"],
  },
  {
    mimeType: "application/pdf",
    magicNumbers: [0x25, 0x50, 0x44, 0x46],
    extensions: [".pdf"],
  },
  { mimeType: "audio/mpeg", magicNumbers: [0xff, 0xfb], extensions: [".mp3"] },
  {
    mimeType: "audio/wav",
    magicNumbers: [0x52, 0x49, 0x46, 0x46],
    extensions: [".wav"],
  },
  { mimeType: "audio/aac", magicNumbers: [0xff, 0xf1], extensions: [".aac"] },
  {
    mimeType: "audio/ogg",
    magicNumbers: [0x4f, 0x67, 0x67, 0x53],
    extensions: [".ogg"],
  },
  {
    mimeType: "audio/flac",
    magicNumbers: [0x66, 0x4c, 0x61, 0x43],
    extensions: [".flac"],
  },
  {
    mimeType: "audio/midi",
    magicNumbers: [0x4d, 0x54, 0x68, 0x64],
    extensions: [".mid", ".midi"],
  },
  {
    mimeType: "application/zip",
    magicNumbers: [0x50, 0x4b, 0x03, 0x04],
    extensions: [".zip"],
  },
  {
    mimeType: "application/x-rar-compressed",
    magicNumbers: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x00],
    extensions: [".rar"],
  },
  {
    mimeType: "application/msword",
    magicNumbers: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
    extensions: [".doc"],
  },
  {
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    magicNumbers: [0x50, 0x4b, 0x03, 0x04],
    extensions: [".docx"],
  },
  {
    mimeType: "application/vnd.ms-excel",
    magicNumbers: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
    extensions: [".xls"],
  },
  {
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    magicNumbers: [0x50, 0x4b, 0x03, 0x04],
    extensions: [".xlsx"],
  },
  {
    mimeType: "application/vnd.ms-powerpoint",
    magicNumbers: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
    extensions: [".ppt"],
  },
  {
    mimeType:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    magicNumbers: [0x50, 0x4b, 0x03, 0x04],
    extensions: [".pptx"],
  },
  {
    mimeType: "application/vnd.ableton.abl",
    magicNumbers: ["skip"],
    extensions: [".abl"],
  },
  {
    mimeType: "audio/x-ableton-live-set",
    magicNumbers: ["skip"],
    extensions: [".als"],
  },
  {
    mimeType: "application/vnd.fruityloops.flp",
    magicNumbers: ["skip"],
    extensions: [".flp"],
  },
  {
    mimeType: "audio/x-fl-studio-project",
    magicNumbers: ["skip"],
    extensions: [".flp"],
  },
  {
    mimeType: "image/svg+xml",
    magicNumbers: ["svg"],
    extensions: [".svg"],
  },

  // Additional types and magic numbers go here
];
