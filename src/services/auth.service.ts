import { randomBytes } from "crypto";
import { User } from "../db/entity/";
import { AppDataSource } from "../db/data-source";
import Web3 from "web3";
import dotenv from "dotenv";

dotenv.config();

const userRepository = AppDataSource.getRepository(User);
const {
  BACKEND_WALLET,
  BACKEND_WALLET_KEY,
  ALCHEMY_API_KEY,
  MARKETPLACE_ADDRESS,
  INFURA_KEY,
  // ICE_CONTRACT_ADDRESS,
  BAG_CONTRACT_ADDRESS,
} = process.env;

export const generateAndStoreApiKey = async (
  address: string
): Promise<User> => {
  const userEntity = await userRepository.findOne({
    where: { address },
  });
  const newUser = new User();
  const currentDate = new Date();

  if (userEntity) {
    // Check if the existing API key is expired
    const expirationDate = new Date(userEntity.apiExpiration);
    if (expirationDate > currentDate) {
      // The API key is still valid, return it
      return userEntity;
    }
    // The API key is expired, generate a new one
    userEntity.apiKey = randomBytes(32).toString("hex");
    userEntity.apiExpiration = new Date(
      currentDate.setFullYear(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() + 30
      )
    );
  } else {
    // Create a new User
    newUser.address = address;
    newUser.apiKey = randomBytes(32).toString("hex");
    newUser.apiExpiration = new Date(
      currentDate.setFullYear(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() + 30
      )
    );
  }

  try {
    return await userRepository.save(userEntity || newUser);
  } catch (err) {
    throw err;
  }
};

export const getApiKeyByValue = async (
  apiKeyValue: string
): Promise<User | undefined> => {
  try {
    return await userRepository.findOne({ where: { apiKey: apiKeyValue } });
  } catch (err) {
    throw err;
  }
};

export const verifySignature = async (
  signature: string,
  message: string,
  address: string
): Promise<boolean> => {
  // Initialize Web3 with a provider (replace with your provider URL)

  const web3 = new Web3(new Web3.providers.HttpProvider(process.env.BLAST_RPC));

  const signer = web3.eth.accounts.recover(message, signature);
  return signer.toLowerCase() === address.toLowerCase();
};
