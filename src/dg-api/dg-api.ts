import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const {
  MORALIS_BASE_URL,
  MORALIS_API_KEY,
  API_PROVIDER,
  ALCHEMY_BASE_URL,
  ALCHEMY_API_KEY,
  FILETYPE_SERVICE_URL,
} = process.env;

// const moralisAxiosConfig = {
//   baseURL: MORALIS_BASE_URL,
//   headers: {
//     "Content-Type": "application/json",
//     "X-API-Key": MORALIS_API_KEY,
//   },
// };

// const alchemyAxiosConfig = {
//   baseURL: ALCHEMY_BASE_URL + ALCHEMY_API_KEY,
// };

const dashboardConfig = {
  baseURL: "https://business.dglive.org/api",
};

// const dgMoralisApi = axios.create(moralisAxiosConfig);
// const dgAlchemyApi = axios.create(alchemyAxiosConfig);

const dashboardApi = axios.create(dashboardConfig);

const fileTypeApi = axios.create({ baseURL: FILETYPE_SERVICE_URL });

// const fileType = await axios.get(
//   `${FILETYPE_SERVICE_URL}/file-type?url=https://ipfs.io/ipfs/QmPyfsYnV5AD1sHrMWDH81fCuyse1XanibzMHdWGdW7uSK`
// );

export { dashboardApi, fileTypeApi };
