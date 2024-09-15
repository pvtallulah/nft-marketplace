const repo = "dg-arena";
const path = `${__dirname}/../repos/${repo}/models/wearables/`;
import fs from "fs";

export const getWearables = async (): Promise<string[]> => {
  const files = fs.readdirSync(path);
  return files;
};
