import dotenv from "dotenv";
import Web3 from "web3";
import axios, { AxiosResponse } from "axios";
import { Contract as eContract, providers as ethProviders } from "ethers";

import Contract from "web3-eth-contract";
import abi from "../abi/DGMarketplaceAbi";
import { ERC721 } from "../abi/ERC722";
// import { dgMoralisApi, dgAlchemyApi } from "../dg-api/dg-api";
import { INftData, ITokenMetadata } from "../interfaces/index";

import { mapNftData } from "../utils";
import { getBlastProvider, getRandomProvider } from "./providers.service";
import { getCloudflareIPFSUrl } from "./ipfs.service";
import { newErrorV2 } from "./discord.service";
import { AppDataSource } from "../db/data-source";
import { Uri } from "../db/entity";

const uriRepository = AppDataSource.getRepository(Uri);

dotenv.config();

const { MARKETPLACE_ADDRESS } = process.env;

const provider = getBlastProvider();
// @ts-ignore
provider.on("error", (err) => {
  console.error("WS Error: ", err);
});

// @ts-ignore
Contract.setProvider(provider);

// @ts-ignore
const contract = new Contract(abi, MARKETPLACE_ADDRESS);

// export const getTokenFromAddress = async (
//   address: string
// ): Promise<IWSSResponse> => {
//   try {
//     const url =
//       API_PROVIDER === "MORALIS"
//         ? `/v2/${address}/nft?chain=polygon&format=decimal`
//         : `/getNFTs?owner=${address}`;
//     const resp =
//       API_PROVIDER === "MORALIS"
//         ? await dgMoralisApi.get(url)
//         : await dgAlchemyApi.get(url);
//     return resp.data;
//   } catch (error) {
//     throw error;
//   }
// };

export const getNftPrice = async (
  nftAddress: string,
  tokenId: string
): Promise<string> => {
  try {
    //@ts-ignore
    if (contract.currentProvider.connected) {
      const price = await contract.methods.getPrice(nftAddress, tokenId).call();
      return price;
    }
    throw new Error("getNftPrice:: Not connected");
  } catch (error) {
    console.error("not connected to moralis provider: ", error);
    throw new Error("not connected to moralis provider");
  }
};

// const moralisFetchNftData = async ({
//   nftAddress,
//   tokenId,
// }: INftDataReq): Promise<INftData> => {
//   const url = `/v2/nft/${nftAddress}/${tokenId}?chain=polygon&format=decimal`;
//   const resp = await dgMoralisApi.get(url);
//   return resp.data;
// };

// const alchemyFetchNftData = async ({
//   nftAddress,
//   tokenId,
// }: INftDataReq): Promise<IAlchemyNftData> => {
//   const url = `/getNFTMetadata?contractAddress=${nftAddress}&tokenId=${tokenId}`;
//   const rawResp = await dgAlchemyApi.get(url);
//   return rawResp.data;
// };

// const enum ipfsProviders {
//   NFT_STORAGE = "nftstorage",
//   CLOUDFLARE_IPFS = "cloudflareIpfs",
//   IPFS = "ipfs",
// }

export const getTokenData = async ({
  nftAddress,
  tokenId,
  token_uri,
}: {
  nftAddress: string;
  tokenId: string;
  token_uri?: string;
}): Promise<INftData> => {
  try {
    const providers: ethProviders.JsonRpcProvider[] = [];
    const blastProvider = getBlastProvider();
    providers.push(blastProvider);
    let nftData: INftData = {
      token_address: nftAddress,
      token_id: tokenId,
      metadata: "",
      collectionName: "",
      contract_type: "ERC721",
      symbol: "",
      token_uri: "",
    };
    for (const prov of providers) {
      const contract = new eContract(nftAddress, ERC721, prov);
      let tokenUri = token_uri || "NO_URI";
      let url = "";
      let symbol = "";
      let collectionName = "";

      try {
        symbol = await contract.symbol();
        collectionName = await contract.name();
        tokenUri = await contract.tokenURI(tokenId);
        nftData["symbol"] = symbol;
        nftData["collectionName"] = collectionName;
        nftData["token_uri"] = tokenUri;
      } catch (error) {
        console.log(error);

        continue;
      }

      if (tokenUri !== "NO_URI") url = getCloudflareIPFSUrl(tokenUri);

      try {
        const hasStoredData = await uriRepository.findOne({
          where: {
            uriUrl: tokenUri,
          },
        });
        if (hasStoredData) {
          try {
            const parsedMetadata = JSON.parse(hasStoredData.metadata);
            const nftData = mapNftData({
              token_address: nftAddress,
              token_id: tokenId,
              metadata: parsedMetadata || {},
              contract_type: "ERC721",
              symbol,
              token_uri: tokenUri,
              name: collectionName,
            });
            return nftData;
          } catch (error) {
            console.log("Error parsing metadata from storedDB: ", error);
            newErrorV2({
              title: "Error parsing metadata from storedDB",
              description: `Error parsing metadata from storedDB for nftAddress: ${nftAddress} tokenId: ${tokenId}\n error: ${error}`,
              extraData: `url: ${url}, tokenUri: ${tokenUri}`,
            });
          }
        }

        let res: AxiosResponse<AxiosResponse<ITokenMetadata, any>, any> = null;
        try {
          res = await axios.get<AxiosResponse<ITokenMetadata>>(url, {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 10000,
          });
        } catch (error) {
          newErrorV2({
            title: "Error fetching token data with jsonrpc provider",
            description: `Error fetching token data for nftAddress: ${nftAddress} tokenId: ${tokenId}\n error: ${error}`,
            extraData: `url: ${url}, tokenUri: ${tokenUri}`,
          });
          console.log("no uri");
        }
        const metadata = res ? (res.data as ITokenMetadata) : {};
        const additionalNftData = mapNftData({
          token_address: nftAddress,
          token_id: tokenId,
          metadata,
          contract_type: "ERC721",
          symbol,
          token_uri: tokenUri,
          name: collectionName,
        });
        if (additionalNftData) {
          return { ...nftData, ...additionalNftData };
        } else {
          console.log("nftData is null");
        }
      } catch (error) {
        console.error("getTokenData2::error: ", error);
      }
    }
  } catch (err) {
    newErrorV2({
      title: `Critical error`,
      description: `Error fetching token data for nftAddress: ${nftAddress} tokenId: ${tokenId}\n error: ${err}`,
    });
    return null;
  }
};

export const getTokenDataWithProviders = async ({
  nftAddress,
  tokenId,
}: {
  nftAddress: string;
  tokenId: string;
}): Promise<INftData> => {
  try {
    const rndProvider = getRandomProvider();
    const contract = new eContract(nftAddress, ERC721, rndProvider);
    const symbol = await contract.symbol();
    let tokenUri = "NO_URI";
    let url = "";
    try {
      tokenUri = await contract.tokenURI(tokenId);
    } catch (error) {
      console.log("no token uri, ban collection");
    }
    const name = await contract.name();
    if (tokenUri !== "NO_URI") url = getCloudflareIPFSUrl(tokenUri);
    try {
      const hasStoredData = await uriRepository.findOne({
        where: {
          uriUrl: tokenUri,
        },
      });
      if (hasStoredData) {
        try {
          const parsedMetadata = JSON.parse(hasStoredData.metadata);
          const nftData = mapNftData({
            token_address: nftAddress,
            token_id: tokenId,
            metadata: parsedMetadata || {},
            contract_type: "ERC721",
            symbol,
            token_uri: tokenUri,
            name,
          });
          return nftData;
        } catch (error) {
          console.log("Error parsing metadata from storedDB: ", error);
          newErrorV2({
            title: "Error parsing metadata from storedDB",
            description: `Error parsing metadata from storedDB for nftAddress: ${nftAddress} tokenId: ${tokenId}\n error: ${error}`,
            extraData: `url: ${url}, tokenUri: ${tokenUri}`,
          });
        }
      }
      let res: AxiosResponse<AxiosResponse<ITokenMetadata, any>, any> = null;
      if (url) {
        try {
          res = await axios.get<AxiosResponse<ITokenMetadata>>(url, {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 10000,
          });
        } catch (error) {
          console.log("no uri");
        }
      }
      const nftData = mapNftData({
        token_address: nftAddress,
        token_id: tokenId,
        metadata: res ? (res.data as ITokenMetadata) : {},
        contract_type: "ERC721",
        symbol,
        token_uri: tokenUri,
        name,
      });
      if (nftData) {
        return nftData;
      } else {
        console.log("nftData is null");
      }
    } catch (error) {
      console.error("getTokenData2::error: ", error);
    }

    return null;
  } catch (err) {
    throw new Error("err");
  }
};

// export const getTokenDataWithApi = async ({
//   nftAddress,
//   tokenId,
// }: INftDataReq): Promise<INftData> => {
//   try {
//     if (API_PROVIDER === "MORALIS") {
//       let res = null;
//       try {
//         res = await moralisFetchNftData({ nftAddress, tokenId });
//       } catch (error) {
//         console.error("getTokenData::error: ", error);
//       }
//       if (!res || !res.metadata) {
//         const alchemyData = await alchemyFetchNftData({ nftAddress, tokenId });
//         if (alchemyData) return mapNftData(alchemyData);
//         throw new Error("No metadata found");
//       }
//       return res;
//     } else {
//       const res = await alchemyFetchNftData({ nftAddress, tokenId });
//       return mapNftData(res);
//     }
//   } catch (error) {
//     throw error;
//   }
// };
