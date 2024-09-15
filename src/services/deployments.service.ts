import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const { VERCEL_TOKEN, VERCEL_TEAM_ID, VERCEL_PROJECT_ID } = process.env;

const baseUrl = "https://api.vercel.com/v6/deployments";

export const getDeploymentsStatus = async (): Promise<any> => {
  try {
    debugger;
    const { data } = await axios.get(
      `${baseUrl}?limit=10&projectId=${VERCEL_PROJECT_ID}`,
      {
        headers: {
          Authorization: "Bearer " + VERCEL_TOKEN,
        },
      }
    );
    return data;
  } catch (err) {
    throw err;
  }
};
