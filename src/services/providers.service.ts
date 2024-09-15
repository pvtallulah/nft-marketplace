import dotenv from "dotenv";
import { providers } from "ethers";

dotenv.config();

const { INFURA_KEY, ALCHEMY_API_KEY, ETHERSCAN_API_KEY, NETWORK, BLAST_RPC } =
  process.env;

// const infuraProvider = new providers.InfuraProvider(
//   NETWORK || "matic",
//   INFURA_KEY
// );

// const alchemyProvider = new providers.AlchemyProvider(
//   NETWORK || "matic",
//   ALCHEMY_API_KEY
// );

// const polygonProvider = new providers.JsonRpcProvider(BLAST_RPC);

const blastProvider = new providers.JsonRpcProvider(BLAST_RPC);

export const supportedProviders = [blastProvider];

export const getRandomProvider = () => {
  const randomIndex = Math.floor(Math.random() * supportedProviders.length);
  return supportedProviders[randomIndex];
};

export const getInfuraProvider = (): providers.JsonRpcProvider => blastProvider;

// export const getAlchemyProvider = (): providers.JsonRpcProvider =>
//   blastProvider;

// export const getPolygonProvider = (): providers.JsonRpcProvider =>
//   polygonProvider;

export const getBlastProvider = (): providers.JsonRpcProvider => blastProvider;
