import dotenv from "dotenv";
import fs from "fs";
import child_process from "child_process";

dotenv.config();

const { GH_TOKEN } = process.env;
const repo = "dg-arena";
const ghUser = "gabrielmellace1";

export const cloneAndPullRepo = async (): Promise<void> => {
  const path = `${__dirname}/../repos/${repo}`;
  const repoExists = fs.existsSync(path);
  const confirmation = repoExists ? `Pulling ${repo}...` : `Cloning ${repo}...`;
  console.log(confirmation);

  try {
    if (!repoExists) {
      child_process.execSync(
        `git clone https://${ghUser}:${GH_TOKEN}@github.com/decentralgames/${repo}.git ${path}`
      );
    } else {
      const lockPath = `${path}/.git/index.lock`;
      const lockExist = fs.existsSync(lockPath);
      if (lockExist) fs.unlinkSync(lockPath);
      child_process.execSync(
        `cd ${path} && git reset --hard HEAD && git pull origin feature/dynamic-slots`
      );
    }
  } catch (error) {
    console.log("Error:ghClonePullRepo: ", error);
  }
};
