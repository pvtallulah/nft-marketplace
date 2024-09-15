import {
  ISellerNft,
  IFlattenResponse,
  IUser,
  IUserUpdate,
} from "../interfaces";
import { MarketListing, User } from "../db/entity";
import { AppDataSource } from "../db/data-source";
import { groupBy, map } from "lodash";
import { flatten } from "../utils";
import fetch from "node-fetch";

const userRepository = AppDataSource.getRepository(User);

const marketListingRepository = AppDataSource.getRepository(MarketListing);
const allRelations = {
  uri: true,
  description: true,
  seller: true,
  youtube: true,
  animation: true,
  resourceGroup: {
    nftAddress: {
      nftType: true,
    },
  },
};

export const getSellerNfts = async (
  sellerAddress: string
): Promise<IFlattenResponse[]> => {
  try {
    const marketListings = await marketListingRepository.find({
      relations: {
        seller: true,
        resourceGroup: {
          nftAddress: {
            nftType: true,
          },
        },
      },
      where: {
        seller: {
          sellerAddress,
        },
      },
    });
    if (marketListings.length)
      return map(marketListings, (x: MarketListing) => flatten(x));
    return [];
    // const qb = AppDataSource.createQueryBuilder(
    //   MarketListing,
    //   "market_listing"
    // );
    // const marketListing = await qb
    //   .innerJoinAndSelect("market_listing.nft", "nft")
    //   .innerJoinAndSelect("market_listing.token", "token")
    //   .where("market_listing.sellerAddress = :sellerAddress", { sellerAddress })
    //   .select([
    //     "market_listing.price",
    //     "market_listing.sellerAddress",
    //     "nft.address",
    //     "nft.symbol",
    //     "token.id",
    //     "token.uri",
    //     "token.name",
    //     "token.nftAddress",
    //     "token.imageUrl",
    //     "token.resourceId",
    //     "token.description",
    //   ])
    //   .groupBy(
    //     `market_listing.id,
    //   market_listing.price,
    //   market_listing.sellerAddress,
    //   nft.address,
    //   nft.symbol,
    //   token.uri,
    //   token.name,
    //   token.nftAddress,
    //   token.imageUrl,
    //   token.resourceId,
    //   token.description`
    //   )
    //   .getMany();

    // const res = marketListing.map((ml: any) => {
    //   return {
    //     tokenId: ml.token.id,
    //     nftAddress: ml.nft.address,
    //     name: ml.token.name,
    //     symbol: ml.nft.symbol,
    //     resourceId: ml.token.resourceId,
    //     imageUrl: ml.token.imageUrl,
    //     price: ml.price,
    //     description: ml.token.description,
    //     sellerAddress: ml.sellerAddress,
    //   };
    // });
    // return res;
  } catch (err) {
    console.log("getSellerNfts::err ", err);
    throw err;
  }
};

export const getSellerNftsGrouped = async (
  sellerAddress: string
): Promise<ISellerNft[]> => {
  const res = await getSellerNfts(sellerAddress);
  return groupBy(res, "resourceId") as any;
};

export const getUserByAddress = async (address: string): Promise<IUser> => {
  const user = await userRepository.findOne({ where: { address: address } });

  if (!user) {
    throw new Error("User not found");
  }

  // Create a new user object and copy all properties
  const filteredUser = new User();
  filteredUser.idUser = user.idUser;
  filteredUser.address = user.address;
  filteredUser.username = user.username;
  filteredUser.bio = user.bio;
  filteredUser.profileHash = user.profileHash;
  filteredUser.portraitHash = user.portraitHash;
  filteredUser.email = user.email;
  filteredUser.emailEnabled = user.emailEnabled;

  // Copy all social media and other fields along with their enabled status
  filteredUser.spotifyUser = user.spotifyUser;
  filteredUser.spotifyEnabled = user.spotifyEnabled;
  filteredUser.youtubeUser = user.youtubeUser;
  filteredUser.youtubeEnabled = user.youtubeEnabled;
  filteredUser.twitchUser = user.twitchUser;
  filteredUser.twitchEnabled = user.twitchEnabled;
  filteredUser.kickUser = user.kickUser;
  filteredUser.kickEnabled = user.kickEnabled;
  filteredUser.soundCloudUser = user.soundCloudUser;
  filteredUser.soundCloudEnabled = user.soundCloudEnabled;
  filteredUser.decentralandEnabled = user.decentralandEnabled;
  filteredUser.decentralGamesEnabled = user.decentralGamesEnabled;
  filteredUser.instagramUser = user.instagramUser;
  filteredUser.instagramEnabled = user.instagramEnabled;
  filteredUser.tiktokUser = user.tiktokUser;
  filteredUser.tiktokEnabled = user.tiktokEnabled;
  filteredUser.twitterUser = user.twitterUser;
  filteredUser.twitterEnabled = user.twitterEnabled;
  filteredUser.tipsEnabled = user.tipsEnabled;
  filteredUser.footerEnabled = user.footerEnabled;
  filteredUser.collectionsEnabled = user.collectionsEnabled;
  filteredUser.forSaleEnabled = user.forSaleEnabled;
  filteredUser.defaultProfile = user.defaultProfile;

  // If defaultProfile is true, return default values for certain fields
  if (user.defaultProfile) {
    filteredUser.primaryColor = "0";
    filteredUser.secondaryColor = "0";
    filteredUser.backgroundHash = "0";
    filteredUser.backgroundRepeat = false;
    filteredUser.fontType = "0";
    filteredUser.titleSize = 0;
    filteredUser.descriptionSize = 0;
    filteredUser.titleColor = "0";
    filteredUser.descriptionColor = "0";
  } else {
    filteredUser.primaryColor = user.primaryColor;
    filteredUser.secondaryColor = user.secondaryColor;
    filteredUser.backgroundHash = user.backgroundHash;
    filteredUser.backgroundRepeat = user.backgroundRepeat;
    filteredUser.fontType = user.fontType;
    filteredUser.titleSize = user.titleSize;
    filteredUser.descriptionSize = user.descriptionSize;
    filteredUser.titleColor = user.titleColor;
    filteredUser.descriptionColor = user.descriptionColor;
  }

  return <IUser>filteredUser;
};

export const updateUser = async (
  address: string,
  userData: IUserUpdate
): Promise<User> => {
  const user = await userRepository.findOne({ where: { address: address } });

  if (!user) {
    throw new Error("User not found");
  }

  Object.assign(user, userData);

  try {
    return await userRepository.save(user);
  } catch (err) {
    throw err;
  }
};

export const getNFTsContractsForUser = async (
  userWalletAddress: string
): Promise<string[]> => {
  if (!userWalletAddress || typeof userWalletAddress !== "string") {
    throw new Error("Invalid user wallet address.");
  }

  const subgraphUrl = process.env.SUBGRAPH_ENDPOINT.concat("/").concat(
    process.env.SUBGRAPH_VERSION
  );
  const lowercaseAddress = userWalletAddress.toLowerCase();
  const query = `
  {
  nftholdersBalances(where: {holder: "${lowercaseAddress}", balance_gt: "0"}) {
    collection {
      nftAddress
    }
  }
}
  `;

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  };

  const response = await fetch(subgraphUrl, options);
  const responseBody = await response.json();

  console.dir(responseBody, { depth: null });

  if (
    !response.ok ||
    !responseBody ||
    !responseBody.data ||
    !responseBody.data.nftholdersBalances
  ) {
    throw new Error("Error fetching data from subgraph.");
  }

  const nftholdersBalances = responseBody.data.nftholdersBalances;
  const contractAddresses = nftholdersBalances.map(
    (entry) => entry.collection.nftAddress
  );

  return contractAddresses;
};

export const getTokensForUserCollection = async (
  userWalletAddress: string,
  collectionAddress: string
): Promise<string[]> => {
  // Validate input parameters
  if (!userWalletAddress || typeof userWalletAddress !== "string") {
    throw new Error("Invalid user wallet address.");
  }

  if (!collectionAddress || typeof collectionAddress !== "string") {
    throw new Error("Invalid collection address.");
  }

  const subgraphUrl = process.env.SUBGRAPH_ENDPOINT.concat("/").concat(
    process.env.SUBGRAPH_VERSION
  );

  // Convert addresses to lowercase
  const lowercaseUserAddress = userWalletAddress.toLowerCase();
  const lowercaseCollectionAddress = collectionAddress.toLowerCase();

  const query = `
  {
    nfts(where: { owner: "${lowercaseUserAddress}", nftAddress: "${lowercaseCollectionAddress}" }) {
      tokenId
    }
  }`;

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  };

  const response = await fetch(subgraphUrl, options);
  const responseBody = await response.json();

  if (
    !response.ok ||
    !responseBody ||
    !responseBody.data ||
    !responseBody.data.nfts
  ) {
    throw new Error("Error fetching data from subgraph.");
  }

  const nfts = responseBody.data.nfts;
  const tokenIds = nfts.map((entry) => entry.tokenId);

  return tokenIds;
};
