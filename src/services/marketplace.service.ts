import crypto from "crypto";
import dotenv from "dotenv";
import { DeleteResult, Like, Not, SelectQueryBuilder, In } from "typeorm";
import axios from "axios";
import { filter, map, groupBy, forEach, sortBy, orderBy } from "lodash";
import { utils } from "ethers";
import { v4 as uuid4 } from "uuid";
import {
  getNftPrice,
  getTokenDataWithProviders,
  // getTokenDataWithApi,
} from "./wss.service";
import { notifyToDashboard } from "./webSocket.service";
import { newErrorV2 } from "./discord.service";
import { AppDataSource } from "../db/data-source";
import {
  MarketListing,
  NftAddress,
  NftType,
  ResourceGroup,
  Seller,
  Uri,
  Description,
  MarketListingGrouped,
  MarketListingNotGrouped,
  Youtube,
  Audio,
  Animation,
} from "../db/entity";

import {
  IWSSResponse,
  INftSoldReq,
  IDgTransactionInfo,
  IUpdateNftDbPrice,
  INftData,
  INftBoughtReq,
  INftPrice,
  IMarketListingsGroupedParams,
  IMarketListings,
  INftDataReq,
  INextNft,
  IMarketplaceCollection,
  IFlattenResponse,
  IValidatePublishedNftReq,
  IValidatePublishedNftRes,
  IMarketplaceCollection2,
  IMarketplaceCollections,
  IMarketplaceCollections2,
  INftCancelReq,
  IMarketValidatePublishedNftReq,
  IMarketListingsDict,
  INftDataSafe,
} from "../interfaces";
import { flatten, flattenMarketListingGroupped } from "../utils";
import {
  // getImageHash,
  getImageDimensionsAndResourceId,
} from "./image.service";

import { fileTypeApi } from "../dg-api/dg-api";
import { getOwnerOfToken } from "./contract.service";
import { getCloudflareIPFSUrl } from "./ipfs.service";

dotenv.config();

const { MARKETPLACE_ADDRESS } = process.env;
const marketListingRepository = AppDataSource.getRepository(MarketListing);
const resourceGroupRepository = AppDataSource.getRepository(ResourceGroup);
const descriptionRepository = AppDataSource.getRepository(Description);
const nftAddressRepository = AppDataSource.getRepository(NftAddress);
const animationRepository = AppDataSource.getRepository(Animation);
const youtubeRepository = AppDataSource.getRepository(Youtube);
const nftTypeRepository = AppDataSource.getRepository(NftType);
const sellerRepository = AppDataSource.getRepository(Seller);
const audioRepository = AppDataSource.getRepository(Audio);
const uriRepository = AppDataSource.getRepository(Uri);
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

export const getMarketListingsGrouped = async ({
  nftAddress,
  limit,
  offset,
  verifiedCollection,
  price,
  isIceCollection,
  isDecentraland,
  name,
  sellerAddress,
}: IMarketListingsGroupedParams): Promise<IMarketListings> => {
  const take = parseInt(limit || "10");
  const skip = parseInt(offset || "0");
  const groupedNftQuery = AppDataSource.createQueryBuilder(
    MarketListingGrouped,
    "market_listing"
  );
  if (isIceCollection === "true" || isIceCollection === "false") {
    groupedNftQuery.andWhere("nft_address_isIceCollection = :isIceCollection", {
      isIceCollection,
    });
  }

  if (verifiedCollection === "true" || verifiedCollection === "false") {
    groupedNftQuery.andWhere(
      "nft_address_isVerifiedCollection = :verifiedCollection",
      {
        verifiedCollection,
      }
    );
  }

  if (isDecentraland) {
    groupedNftQuery.andWhere("nft_address_isDecentraland = :isDecentraland", {
      isDecentraland,
    });
  }

  if (name) {
    groupedNftQuery.andWhere("nft_address_name LIKE :name", {
      name: `%${name}%`,
    });
  }

  if (nftAddress) {
    groupedNftQuery.andWhere("nft_address_nftAddress = :nftAddress", {
      nftAddress,
    });
  }
  if (sellerAddress) {
    groupedNftQuery.andWhere("seller_sellerAddress = :sellerAddress", {
      sellerAddress,
    });
  }

  groupedNftQuery.andWhere("nft_address_banned = :banned", {
    banned: false,
  });

  groupedNftQuery.orderBy("market_listing_price", price);
  groupedNftQuery.take(Number(take)).skip(Number(skip));
  groupedNftQuery.skip(skip);
  const [marketplaceListingsRaw, total] =
    await groupedNftQuery.getManyAndCount();
  const marketplaceListings: IFlattenResponse[] = map(
    marketplaceListingsRaw,
    (x: MarketListingGrouped) => flattenMarketListingGroupped(x)
  );
  return {
    marketplaceListings,
    total,
  };
};

export const getUserListingsByCollection = async ({
  nftAddress,
  limit,
  offset,
  verifiedCollection,
  price,
  isIceCollection,
  isDecentraland,
  name,
  sellerAddress,
}: IMarketListingsGroupedParams): Promise<IMarketListings> => {
  const take = parseInt(limit) || 10;
  const skip = parseInt(offset) || 0;

  const foundItems = await marketListingRepository.find({
    relations: allRelations,
    where: {
      seller: {
        sellerAddress: sellerAddress,
      },
      resourceGroup: {
        nftAddress: {
          nftAddress,
          name: name ? Like(`%${name}%`) : undefined,
          isDecentraland:
            isDecentraland === "true" || isDecentraland === "false"
              ? isDecentraland === "true"
              : undefined,
          isIceCollection:
            isIceCollection === "true" || isIceCollection === "false"
              ? isIceCollection === "true"
              : undefined,
          isVerifiedCollection:
            verifiedCollection === "true" || verifiedCollection === "false"
              ? verifiedCollection === "true"
              : undefined,
        },
      },
    },
    take,
    skip,
    order: {
      price: price === "ASC" ? "ASC" : "DESC",
    },
  });
  const flattenedItems = map(foundItems, (item) => flatten(item));

  const groupedItems = groupBy(flattenedItems, "resourceId");

  const uniqueResultListing: IFlattenResponse[] = [];

  for (const key in groupedItems) {
    const item = groupedItems[key][0];
    uniqueResultListing.push(item);
  }

  return {
    marketplaceListings: uniqueResultListing,
    total: uniqueResultListing.length,
  };
};

export const getMarketListingsResourceId = async ({
  verifiedCollection,
  resourceId,
}): Promise<IMarketListings> => {
  try {
    const foundItems = await marketListingRepository.findAndCount({
      relations: { ...allRelations },
      where: {
        resourceGroup: {
          resourceId,
          nftAddress: {
            isVerifiedCollection: verifiedCollection
              ? verifiedCollection === "true"
              : undefined,
          },
        },
      },
    });
    const marketplaceListings: IFlattenResponse[] = map(
      foundItems[0],
      (x: MarketListing) => flatten(x)
    );
    return {
      marketplaceListings,
      total: foundItems[1],
    };
  } catch (err) {
    throw err;
  }
};

const safeInsertNftToMarket = async (nftData: INftDataSafe) => {
  try {
    const seller = new Seller();
    const newNftAddress = new NftAddress();
    const marketListing = new MarketListing();

    const { nftAddress, tokenId, price, from } = nftData;
    const foundMarketListing = await marketListingRepository.find({
      relations: {
        resourceGroup: {
          nftAddress: {},
        },
      },
      where: {
        tokenId: tokenId,
        resourceGroup: {
          nftAddress: {
            nftAddress: nftAddress,
          },
        },
      },
    });
    let sellerSaved: Seller = null;
    const foundSeller = await sellerRepository.findOne({
      where: { sellerAddress: from },
    });
    if (!foundSeller) {
      seller.sellerAddress = from;
      sellerSaved = await sellerRepository.save(seller);
    }
    marketListing.seller = foundSeller || sellerSaved;
    marketListing.tokenId = tokenId;
    marketListing.price = parseFloat(utils.formatUnits(price, 18));
    marketListing.preprocessedId = uuid4();

    //Save new nft address
    let nftAddressSaved: NftAddress = null;
    const foundNftAddress = await nftAddressRepository.findOne({
      relations: {
        nftType: true,
      },
      where: { nftAddress },
    });
    if (!foundNftAddress) {
      newNftAddress.nftAddress = nftAddress;
      newNftAddress.isDecentraland = await isDecentralandNft(nftAddress);
      newNftAddress.isWearable = await isWearable(nftAddress);
      nftAddressSaved = await nftAddressRepository.save(newNftAddress);
    }

    const unprocessedResourceGroup = new ResourceGroup();
    let savedResourceGroup: ResourceGroup = null;
    const resourceId = crypto
      .createHash("md5")
      .update(nftAddress + tokenId)
      .digest("hex");

    const foundResourceGroup = await resourceGroupRepository.findOne({
      where: {
        resourceId,
      },
    });
    if (!foundResourceGroup) {
      unprocessedResourceGroup.resourceId = resourceId;
      unprocessedResourceGroup.height = 0;
      unprocessedResourceGroup.width = 0;
      unprocessedResourceGroup.imageUrl = "";
      unprocessedResourceGroup.name = "unprocessed";
      unprocessedResourceGroup.nftAddress = nftAddressSaved || foundNftAddress;
      savedResourceGroup = await resourceGroupRepository.save(
        unprocessedResourceGroup
      );
    }

    marketListing.resourceGroup = savedResourceGroup || foundResourceGroup;
    if (!foundMarketListing.length) {
      marketListing.validated = false;
      return await marketListingRepository.save(marketListing);
    } else {
      foundMarketListing[0].validated = false;

      return await marketListingRepository.upsert(
        { ...foundMarketListing[0], ...marketListing },
        ["id"]
      );
    }
  } catch (error) {
    console.log(error);

    throw error;
  }
};

const insertNftToMarket = async (nftData: INftData) => {
  const marketListing = new MarketListing();
  const resourceGroup = new ResourceGroup();
  const description = new Description();
  const nftAddress = new NftAddress();
  const nftType = new NftType();
  const youtube = new Youtube();
  const animation = new Animation();
  const audio = new Audio();
  const seller = new Seller();
  const uri = new Uri();
  const {
    metadata,
    token_id: tokenId,
    collectionName,
    token_address: collectionAddress,
    symbol,
    contract_type: collectionType,
    price,
    token_uri: tokenUri,
    from,
    timestamp,
  } = nftData;
  const parsedMetadata = JSON.parse(metadata);
  // we dont have an metadata, need to get it from token uri.
  let tokenUriData: any = {};
  if (!parsedMetadata && tokenUri !== "NO_URI") {
    try {
      tokenUriData = await axios.get(tokenUri);
    } catch (error) {
      throw new Error("Token URI error: " + error);
    }
  }
  const {
    image = "",
    description: fullTokenDescription = "",
    youtube_url: youtubeUrl = "",
    audio_url: audioUrl = "",
    animation_url: animationUrl = "",
    name: tokenName = "",
  } = parsedMetadata || tokenUriData.data;
  const tokenDescription =
    fullTokenDescription.length > 500
      ? fullTokenDescription.substring(0, 500)
      : fullTokenDescription || "";
  const foundMarketListing = await marketListingRepository.find({
    relations: {
      uri: true,
      description: true,
      seller: true,
      resourceGroup: {
        nftAddress: {
          nftType: true,
        },
      },
    },
    where: {
      tokenId,
      resourceGroup: {
        nftAddress: {
          nftAddress: collectionAddress,
        },
      },
    },
  });
  try {
    // Save new NFT type
    let nftTypeSaved: NftType = null;
    const foundNftType = await nftTypeRepository.findOne({
      where: {
        type: collectionType,
      },
    });
    if (!foundNftType) {
      nftType.type = collectionType;
      nftTypeSaved = await nftTypeRepository.save(nftType);
    }

    //Save new nft address
    let nftAddressSaved: NftAddress = null;
    const foundNftAddress = await nftAddressRepository.findOne({
      relations: {
        nftType: true,
      },
      where: { nftAddress: collectionAddress },
    });
    if (!foundNftAddress) {
      nftAddress.nftAddress = collectionAddress;
      nftAddress.symbol = symbol;
      nftAddress.name = collectionName;
      nftAddress.isDecentraland = await isDecentralandNft(collectionAddress);
      nftAddress.isWearable = await isWearable(collectionAddress);
      nftAddress.nftType = foundNftType || nftTypeSaved;
      nftAddressSaved = await nftAddressRepository.save(nftAddress);
    }

    // Save new resource group
    let resourceGroupSaved: ResourceGroup = null;

    let foundResourceGroup = await marketListingRepository.findOne({
      relations: {
        resourceGroup: {
          nftAddress: {
            nftType: true,
          },
        },
      },
      where: {
        resourceGroup: {
          name: tokenName || collectionName,
          imageUrl: image,
          nftAddress: {
            nftAddress: foundNftAddress
              ? foundNftAddress.nftAddress
              : nftAddressSaved.nftAddress,
          },
        },
      },
    });
    if (!foundResourceGroup) {
      const { resourceId, width, height } =
        await getImageDimensionsAndResourceId({
          name: tokenName || collectionName,
          imageUrl: image,
          nftAddress: foundNftAddress?.nftAddress || nftAddressSaved.nftAddress,
        });
      const isRedundatnImage = await resourceGroupRepository.findOne({
        relations: {
          nftAddress: {
            nftType: true,
          },
        },
        where: {
          resourceId,
        },
      });
      if (isRedundatnImage) {
        resourceGroupSaved = isRedundatnImage;
      } else {
        resourceGroup.name = tokenName || collectionName;
        resourceGroup.nftAddress = foundNftAddress || nftAddressSaved;
        resourceGroup.imageUrl = image;
        resourceGroup.resourceId = resourceId;
        resourceGroup.width = width;
        resourceGroup.height = height;
        resourceGroupSaved = await resourceGroupRepository.save(resourceGroup);
      }
    }

    // Save new seller
    let sellerSaved: Seller = null;
    const foundSeller = await sellerRepository.findOne({
      where: { sellerAddress: from },
    });
    if (!foundSeller) {
      seller.sellerAddress = from;
      sellerSaved = await sellerRepository.save(seller);
    }

    // Save new uri
    let savedUri: Uri = null;
    const foundUri = await uriRepository.findOne({
      where: { uriUrl: tokenUri },
    });
    if (!foundUri) {
      uri.uriUrl = tokenUri;
      savedUri = await uriRepository.save(uri);
    }

    // Save new description
    let savedDescription: Description = null;
    const hashDescription = crypto
      .createHash("md5")
      .update(tokenDescription)
      .digest("hex");
    const foundDescription = await descriptionRepository.findOne({
      where: {
        hashDescription,
      },
    });
    if (!foundDescription) {
      description.description = tokenDescription;
      description.hashDescription = hashDescription;
      savedDescription = await descriptionRepository.save(description);
    }

    // Save Youtube
    let savedYoutube: Youtube = null;
    if (youtubeUrl) {
      const foundYoutube = await youtubeRepository.findOne({
        where: { url: youtubeUrl },
      });
      if (!foundYoutube) {
        youtube.url = youtubeUrl;
        savedYoutube = await youtubeRepository.save(youtube);
      } else {
        savedYoutube = foundYoutube;
      }
    }

    // Save Animation
    let savedAnimation: Animation = null;
    if (animationUrl) {
      let animationType = null;
      try {
        animationType = await fileTypeApi(
          `/file-type?url=${getCloudflareIPFSUrl(animationUrl)}`
        );
      } catch (error) {
        newErrorV2({
          title: "Animation file type error",
          description: error.message,
        });
      }
      const foundAnimation = await animationRepository.findOne({
        where: { url: animationUrl },
      });

      if (!animationType) {
        if (!foundAnimation) {
          animation.url = animationUrl;
          savedAnimation = await animationRepository.save(animation);
        } else {
          savedAnimation = foundAnimation;
        }
      } else {
        const isAnimationFile =
          animationType.data.mime.includes("video") ||
          animationType.data.ext === "gif";
        if (isAnimationFile) {
          if (!foundAnimation) {
            animation.url = animationUrl;
            animation.validated = true;
            savedAnimation = await animationRepository.save(animation);
          } else {
            savedAnimation = foundAnimation;
          }
        }
      }
    }

    // Save Audio
    let savedAudio: Audio = null;
    if (audioUrl) {
      let audioType = null;
      try {
        audioType = await fileTypeApi(
          `/file-type?url=${getCloudflareIPFSUrl(audioUrl)}`
        );
      } catch (error) {
        newErrorV2({
          title: "Audio file type error",
          description: error.message,
        });
      }
      const foundAudio = await audioRepository.findOne({
        where: { url: audioUrl },
      });
      if (!audioType) {
        if (!foundAudio) {
          audio.url = audioUrl;
          savedAudio = await audioRepository.save(audio);
        } else {
          savedAudio = foundAudio;
        }
      } else {
        const isAudioFile = audioType.data.mime.includes("audio");
        if (isAudioFile) {
          if (!foundAudio) {
            audio.url = audioUrl;
            audio.validated = true;
            savedAudio = await audioRepository.save(audio);
          } else {
            savedAudio = foundAudio;
          }
        }
      }
    }
    // Assign values to market listing
    marketListing.resourceGroup =
      foundResourceGroup?.resourceGroup || resourceGroupSaved;
    marketListing.tokenId = tokenId;
    marketListing.seller = foundSeller || sellerSaved;
    marketListing.uri = foundUri || savedUri;
    marketListing.description = foundDescription || savedDescription;
    marketListing.price = parseFloat(utils.formatUnits(price, 18));
    marketListing.youtube = savedYoutube;
    marketListing.animation = savedAnimation;
    marketListing.audio = savedAudio;
    if (!foundMarketListing.length) {
      return await marketListingRepository.save(marketListing);
    } else {
      foundMarketListing[0].description = marketListing.description;
      foundMarketListing[0].active = marketListing.active;
      foundMarketListing[0].price = marketListing.price;
      foundMarketListing[0].resourceGroup = marketListing.resourceGroup;
      foundMarketListing[0].seller = marketListing.seller;
      foundMarketListing[0].tokenId = marketListing.tokenId;
      foundMarketListing[0].uri = marketListing.uri;
      foundMarketListing[0].animation = marketListing.animation;
      foundMarketListing[0].youtube = marketListing.youtube;
      foundMarketListing[0].audio = marketListing.audio;
      await marketListingRepository.upsert(foundMarketListing[0], ["id"]);
      return foundMarketListing[0];
    }
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};

export const updateNftPrice = async ({
  nftAddress,
  tokenId,
  price,
}: IUpdateNftDbPrice) => {
  try {
    const founditem = await marketListingRepository.findOne({
      relations: {
        resourceGroup: {
          nftAddress: true,
        },
      },
      where: {
        tokenId,
        resourceGroup: {
          nftAddress: {
            nftAddress,
          },
        },
      },
    });
    if (founditem) {
      founditem.price = parseFloat(utils.formatUnits(price, 18));
      return await marketListingRepository.save(founditem);
    }
    throw new Error("[updateNftPrice]: Nft not found");
  } catch (err) {
    throw new Error(err);
  }
};

export const safeNftSold = async ({
  nftAddress,
  tokenId,
  price,
  from,
}: INftDataSafe) => {
  const nftData: INftDataSafe = {
    nftAddress,
    tokenId,
    price,
    from,
  };
  try {
    const inserted = await safeInsertNftToMarket(nftData);
    return inserted;
  } catch (err) {
    console.log(err);
  }
};

export const nftSold = async ({
  nftAddress,
  tokenId,
  price,
  to,
  from,
  timestamp,
}: IDgTransactionInfo): Promise<IFlattenResponse> => {
  let nftData: INftData = null;
  try {
    nftData = await getTokenDataWithProviders({ nftAddress, tokenId });
    if (!nftData) {
      throw new Error("No data found");
    }
  } catch (err) {
    newErrorV2({
      title: "NftSold::getTokenDataWithProviders::error",
      description:
        "Fail get nft data with providers. will try via api \n" + err.message,
      nftAddress,
      tokenId,
    });
  }
  nftData.price = price;
  nftData.to = to;
  nftData.from = from;
  nftData.timestamp = timestamp;
  try {
    const insertedNft = await insertNftToMarket(nftData);
    return flatten(insertedNft);
  } catch (err) {
    newErrorV2({
      title: "NftSold::insertNftToMarket::error",
      description: `Error inserting nft to market will insertit as notValidated\n ${err.message}`,
      nftAddress,
      tokenId,
    });
    // const insertedNft = await insertNftNotValidated(nftData);
    // return flatten(insertedNft);
  }
};

const findItemByNftAddressTokenId = async (
  nftAddress: string,
  tokenId: string
): Promise<MarketListing> => {
  const foundItem = await marketListingRepository.find({
    relations: {
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
    },
    where: {
      tokenId,
      resourceGroup: {
        nftAddress: {
          nftAddress: nftAddress,
        },
      },
    },
  });
  if (foundItem && foundItem.length === 1) return foundItem[0];
  if (foundItem.length > 1) throw new Error("More than one item found");
  return null;
};

const deleteListing = async (
  nftAddress: string,
  tokenId: string
): Promise<MarketListing> => {
  try {
    const foundMarketListing = await findItemByNftAddressTokenId(
      nftAddress,
      tokenId
    );
    if (foundMarketListing) {
      const deleted = await marketListingRepository.remove(foundMarketListing);
      return deleted;
    }
  } catch (err) {
    console.error("deleteListing::err ", err);
    throw err;
  }
};

export const nftCancel = async ({
  nftAddress,
  tokenId,
}: INftCancelReq): Promise<MarketListing> => {
  try {
    return await deleteListing(nftAddress, tokenId);
  } catch (err) {
    console.error("nftCancel::err ", err);
    newErrorV2({
      title: "[nftCancel] Error",
      description: err,
      nftAddress,
      tokenId,
    });
  }
};
// 0xDF28751EA2c62CaBE45c31B71432b0D41D2A6aad
// [tokenId: 13]
// 0x6e75b94D2a94d16B4861940D31FA5C42E6aDb906
// [tokenId: 12]
export const nftBought = async ({
  nftAddress,
  tokenId,
}: INftBoughtReq): Promise<MarketListing> => {
  try {
    const boughtedNft = await deleteListing(nftAddress, tokenId);
    const foundCollection = await nftAddressRepository.findOne({
      where: {
        nftAddress,
      },
    });
    if (foundCollection) {
      foundCollection.iceAmount =
        +foundCollection.iceAmount + +boughtedNft.price;
      foundCollection.totalSales++;
      await nftAddressRepository.save(foundCollection);
    }
    return boughtedNft;
  } catch (err) {
    console.error("nftBought::err ", err);
    newErrorV2({
      title: "[nftBought] Error",
      description: err,
      nftAddress,
      tokenId,
    });
  }
};

export const nftPrice = async ({
  nftAddress,
  tokenId,
}: INftPrice): Promise<string> => {
  try {
    const foundMarketListing = await marketListingRepository.findOne({
      relations: {
        uri: true,
        description: true,
        seller: true,
        resourceGroup: {
          nftAddress: {
            nftType: true,
          },
        },
      },
      where: {
        tokenId,
        resourceGroup: {
          nftAddress: {
            nftAddress: nftAddress,
          },
        },
      },
    });
    if (foundMarketListing) {
      return foundMarketListing.price.toString();
    }
    return null;
  } catch (err) {
    console.error("nftPrice::err ", err);
    throw err;
  }
};

// export const collectionNames = async (): Promise<Nft[]> => {
// export const collectionNames = async (): Promise<any> => {
//   return null;
// };

export const getNftdata = async ({
  nftAddress,
  tokenId,
  resourceId,
}: INftDataReq): Promise<IFlattenResponse> => {
  const foundItem = await marketListingRepository.findOne({
    relations: {
      seller: true,
      resourceGroup: {
        nftAddress: true,
      },
    },
    where: {
      tokenId,
      resourceGroup: {
        resourceId,
        nftAddress: {
          nftAddress,
        },
      },
    },
  });
  return flatten(foundItem);
};

export const nextNft = async ({
  eventType,
  tokenId,
  resourceId,
  sellerAddress,
}: {
  eventType: string;
  tokenId: string;
  resourceId: string;
  sellerAddress?: string;
}): Promise<INextNft> => {
  const nextMarketplaceNft = await marketListingRepository.findOne({
    relations: {
      resourceGroup: {
        nftAddress: true,
      },
      seller: true,
    },
    where: {
      resourceGroup: {
        resourceId,
      },
      tokenId: eventType === "sell" ? null : Not(tokenId),
    },
    order: {
      price: "ASC",
    },
  });
  let nextSelletNft: MarketListing;
  if (sellerAddress) {
    nextSelletNft = await marketListingRepository.findOne({
      relations: {
        resourceGroup: {
          nftAddress: true,
        },
        seller: true,
      },
      where: {
        resourceGroup: {
          resourceId,
        },
        tokenId: eventType === "sell" ? null : Not(tokenId),
        seller: {
          sellerAddress,
        },
      },
      order: {
        price: "ASC",
      },
    });
  }

  const res = {
    resourceId,
    tokenId,
    nextMarketplaceNft: flatten(nextMarketplaceNft),
    nextSellerNft: flatten(nextSelletNft),
    newMarketplaceNft: null,
  };
  return res;
};

export const getSellerAddress = async ({
  nftAddress,
  tokenId,
}: {
  nftAddress: string;
  tokenId: string;
}): Promise<string> => {
  try {
    const foundSellerAddress = await marketListingRepository.findOne({
      select: {
        seller: {
          sellerAddress: true,
        },
      },
      relations: {
        seller: true,
        resourceGroup: {
          nftAddress: true,
        },
      },
      where: {
        tokenId,
        resourceGroup: {
          nftAddress: {
            nftAddress,
          },
        },
      },
    });
    return foundSellerAddress.seller.sellerAddress || null;
  } catch (err) {
    throw err;
  }
};

export const toggleFreezeNft = async ({
  nftAddress,
  tokenId,
  freeze,
}: {
  nftAddress: string;
  tokenId: string;
  freeze: boolean;
}): Promise<IFlattenResponse> => {
  try {
    const foundItem = await marketListingRepository.findOne({
      relations: {
        resourceGroup: {
          nftAddress: true,
        },
      },
      where: {
        tokenId,
        resourceGroup: {
          nftAddress: {
            nftAddress,
          },
        },
      },
    });
    if (foundItem) {
      foundItem.active = freeze;
      return flatten(await marketListingRepository.save(foundItem));
    }
    return null;
  } catch (error) {
    await newErrorV2({
      title: "[toggleFreezeNft error]",
      description: error,
      nftAddress,
      tokenId,
    });
    throw new Error("toggleFreezeNft::" + error);
  }
};

export const getCollections = async ({
  nftAddress,
  verifiedCollection,
  name,
  limit,
  offset,
  sellerAddress,
}: {
  nftAddress?: string[];
  verifiedCollection?: string;
  name?: string;
  limit?: string;
  offset?: string;
  sellerAddress?: string;
}): Promise<IMarketplaceCollection> => {
  try {
    // nftAddress,
    // limit,
    // offset,
    // verifiedCollection,
    // price,
    // isIceCollection,
    // isDecentraland,
    // name,
    // sellerAddress,

    const take = parseInt(limit || "10");
    const skip = parseInt(offset || "0");
    const foundItems = await marketListingRepository.find({
      select: {
        tokenId: false,
        price: false,
        id: false,
        uri: {
          s3Url: true,
        },
        resourceGroup: {
          id: true,
          resourceId: true,
          name: true,
          nftAddress: {
            nftAddress: true,
            name: true,
            isVerifiedCollection: true,
            totalSales: true,
            iceAmount: true,
            nftType: {
              type: true,
            },
            banned: true,
          },
          imageUrl: true,
        },
      },
      relations: {
        uri: true,
        resourceGroup: {
          nftAddress: {
            nftType: true,
          },
        },
        seller: true,
        description: true,
      },
      where: {
        resourceGroup: {
          nftAddress: {
            nftAddress: nftAddress ? In(nftAddress) : undefined,
            isVerifiedCollection: verifiedCollection
              ? verifiedCollection === "true"
              : undefined,
            name: name ? Like(`%${name}%`) : undefined,
            banned: false,
          },
        },
        seller: {
          sellerAddress: sellerAddress ? sellerAddress : undefined,
        },
      },
      order: {
        price: "ASC",
        resourceGroup: {
          nftAddress: {
            isVerifiedCollection: "DESC",
            iceAmount: "DESC",
          },
        },
      },
    });
    if (!foundItems.length)
      return {
        total: 0,
        marketplaceCollections: [],
      };
    const flattenedItems = map(foundItems, (item) => flatten(item));

    const groupedItems = groupBy(flattenedItems, "nftAddress");
    const marketplaceCollections: IMarketplaceCollections[] = [];
    forEach(groupedItems, (item, value) => {
      marketplaceCollections.push({
        nftAddress: nftAddress ? item[0].nftAddress : value,
        iceAmount: item[0].iceAmount,
        totalSales: item[0].totalSales,
        resourceId: item[0].resourceId,
        collectionName: item[0].collectionName,
        name: item[0].name,
        description: item[0].description,
        contractType: item[0].contractType,
        isVerified: item[0].isVerifiedCollection,
        price: item[0].price,
        sellerAddress: item[0].sellerAddress,
        images: map(item, (x: IFlattenResponse) => x.imageUrl),
      });
    });
    const verifiedItems = filter(
      marketplaceCollections,
      (item) => item.isVerified
    );
    const notVerifiedItems = filter(
      marketplaceCollections,
      (item) => !item.isVerified
    );
    const sortedItems = [
      ...orderBy(verifiedItems, ["iceAmount", "name"], ["desc", "asc"]),
      ...orderBy(notVerifiedItems, ["iceAmount", "name"], ["desc", "asc"]), // ...notVerifiedItems, //...sortBy(, ["name"]),
    ];
    return {
      marketplaceCollections: sortedItems.slice(skip, take + skip),
      total: sortedItems.length,
    };
  } catch (err) {
    newErrorV2({
      title: "[getCollections error]",
      description: err,
    });
    throw err;
  }
};

export const getCollectionByNftAddressResourceId = async ({
  nftAddress,
  resourceId,
  verifiedCollection,
  name,
  sellerAddress,
  limit,
  offset,
}: {
  nftAddress: string;
  resourceId: string;
  verifiedCollection?: string;
  name?: string;
  sellerAddress?: string;
  limit?: string;
  offset?: string;
}): Promise<IMarketplaceCollection2> => {
  try {
    const take = parseInt(limit || "10");
    const skip = parseInt(offset || "0");
    const foundItems = await marketListingRepository.find({
      select: {
        tokenId: true,
        price: true,
        id: false,
        uri: {
          s3Url: true,
        },
        resourceGroup: {
          id: true,
          resourceId: true,
          name: true,
          nftAddress: {
            nftAddress: true,
            name: true,
            symbol: true,
            nftType: {
              type: true,
            },
          },
          imageUrl: true,
        },
      },
      relations: {
        uri: true,
        resourceGroup: {
          nftAddress: {
            nftType: true,
          },
        },
        seller: true,
        description: true,
      },
      where: {
        resourceGroup: {
          resourceId,
          nftAddress: {
            nftAddress,
            name: name ? Like(`%${name}%`) : undefined,
            isVerifiedCollection: verifiedCollection
              ? verifiedCollection === "true"
              : undefined,
            banned: false,
          },
        },
        seller: {
          sellerAddress: sellerAddress ? sellerAddress : undefined,
        },
      },
      order: {
        price: "ASC",
      },
    });
    if (!foundItems.length)
      return {
        total: 0,
        marketplaceCollections: [],
      };
    const flattenedItems = map(foundItems, (item) => flatten(item));
    const marketplaceCollections: IMarketplaceCollections2[] = [];
    forEach(flattenedItems, (item, value) => {
      marketplaceCollections.push({
        tokenId: item.tokenId,
        resourceId: item.resourceId,
        nftAddress: item.nftAddress,
        collectionName: item.collectionName,
        name: item.name,
        description: item.description,
        contractType: item.contractType,
        isVerified: verifiedCollection === "true",
        image: item.s3Url || item.imageUrl,
        sellerAddress: item.sellerAddress,
        symbol: item.symbol,
        price: item.price,
      });
    });
    return {
      total: marketplaceCollections.length,
      marketplaceCollections: marketplaceCollections.slice(skip, take + skip),
    };
  } catch (err) {
    newErrorV2({
      title: "[getCollectionsByNftAddress error]",
      description: err,
    });
    throw err;
  }
};

export const getDataByResourceIdTokenId = async ({
  resourceId,
  tokenId,
}: {
  resourceId: string;
  tokenId: string;
}): Promise<IFlattenResponse> => {
  const foundItem = await marketListingRepository.find({
    relations: {
      description: true,
      resourceGroup: {
        nftAddress: true,
      },
      youtube: true,
      audio: true,
      animation: true,
    },
    where: {
      tokenId,
      resourceGroup: {
        resourceId: resourceId,
        nftAddress: {
          banned: false,
        },
      },
    },
  });
  return flatten(foundItem[0]);
};

const isWearable = async (nftAddress: string): Promise<boolean> => {
  try {
    const res = await axios.get(
      `https://peer.decentraland.org/content/entities/wearables?pointer=urn:decentraland:matic:collections-v2:${nftAddress}:0`
    );
    return res.data.length > 0;
  } catch (error) {
    console.error("isWearable::error ", error);
    return false;
  }
};

const isDecentralandNft = async (nftAddress: string): Promise<boolean> => {
  try {
    const res = await axios.get(
      `https://nft-api.decentraland.org/v1/items?contractAddress=${nftAddress}`
    );
    return res.data.total > 0;
  } catch (error) {
    console.error("isDecentralandNft::error ", error);
    return false;
  }
};

export const getResourceId = async ({
  nftAddress,
  tokenId,
}): Promise<string> => {
  try {
    const foundItem = await marketListingRepository.find({
      select: {
        resourceGroup: {
          resourceId: true,
        },
      },
      relations: {
        resourceGroup: {
          nftAddress: true,
        },
      },
      where: {
        tokenId,
        resourceGroup: {
          nftAddress: {
            nftAddress,
          },
        },
      },
    });
    if (foundItem && foundItem.length === 1) {
      return foundItem[0].resourceGroup.resourceId;
    }
    newErrorV2({
      title: "[getResourceId error]",
      description: `Token not found or more than one token found, foundItems: ${
        foundItem?.length || 0
      }`,
      nftAddress,
      tokenId,
    });
    throw new Error("Token not found or more than one token found");
  } catch (err) {
    throw err;
  }
};

export const validatePublishedNft = async ({
  nftAddress,
  tokenId,
  resourceId,
  price,
  sellerAddress,
}: IValidatePublishedNftReq): Promise<IValidatePublishedNftRes> => {
  // const currentOwner = await getOwnerOfToken({ nftAddress, tokenId });
  const isContractOwner = true;
  // currentOwner.toLowerCase() === MARKETPLACE_ADDRESS.toLowerCase();

  let res: IValidatePublishedNftRes = { isValid: true };
  const baseQuery = AppDataSource.createQueryBuilder(
    MarketListing,
    "market_listing"
  )
    .leftJoinAndSelect("market_listing.uri", "uri")
    .leftJoinAndSelect("market_listing.description", "description")
    .leftJoinAndSelect("market_listing.seller", "seller")
    .leftJoinAndSelect("market_listing.youtube", "youtube")
    .leftJoinAndSelect("market_listing.animation", "animation")
    .leftJoinAndSelect("market_listing.resourceGroup", "resource_group")
    .leftJoinAndSelect("resource_group.nftAddress", "nft_address")
    .leftJoinAndSelect("nft_address.nftType", "nft_type")
    .andWhere("market_listing.tokenId = :tokenId", { tokenId })
    .andWhere("nft_address.nftAddress = :nftAddress", { nftAddress })
    .andWhere("resource_group.resourceId = :resourceId", {
      resourceId,
    })
    .groupBy("resource_group.resourceId")
    .take(1);
  let groupedNftQueryBySellerAddress: SelectQueryBuilder<MarketListing>;
  let foundNftByUser: MarketListing[] = [];
  let foundNftMarket: MarketListing[] = [];
  try {
    if (sellerAddress) {
      groupedNftQueryBySellerAddress = baseQuery.clone();
      foundNftByUser = await groupedNftQueryBySellerAddress
        .andWhere("seller.sellerAddress = :sellerAddress", {
          sellerAddress,
        })
        .getMany();
    } else {
      foundNftMarket = await baseQuery.getMany();
    }
    if (foundNftByUser.length && isContractOwner) {
      const payload = await nextNft({
        eventType: "buy",
        resourceId: foundNftByUser[0].resourceGroup.resourceId,
        tokenId: foundNftByUser[0].tokenId,
        sellerAddress,
      });
      foundNftByUser = await baseQuery.getMany();
      if (price && foundNftByUser[0].price != price) {
        res.isValid = false;
        res.price = foundNftByUser[0].price;
        res.tokenId = foundNftByUser[0].tokenId;
        notifyToDashboard({
          status: "success",
          type: "buy",
          payload,
        });
        return res;
      }
      return res;
    }
    if (foundNftMarket.length && isContractOwner) {
      const payload = await nextNft({
        eventType: "buy",
        resourceId: foundNftMarket[0].resourceGroup.resourceId,
        tokenId: foundNftMarket[0].tokenId,
      });
      if (price && foundNftMarket[0].price != price) {
        res.isValid = false;
        res.price = foundNftMarket[0].price;
        res.tokenId = foundNftMarket[0].tokenId;
        notifyToDashboard({
          status: "success",
          type: "buy",
          payload,
        });
        return res;
      }
      return res;
    } else {
      notifyToDashboard({
        status: "success",
        type: "cancel",
        payload: {
          resourceId,
          tokenId,
        },
      });
      await nftCancel({ nftAddress, tokenId });
      res.isValid = false;
      res.price = null;
      res.tokenId = null;
      return res;
    }
  } catch (err) {
    console.error("validatePublishedNft::error ", err);
    throw err;
  }
};

export const marketValidatePublishedNft = async ({
  nftAddress,
  tokenId,
}: IMarketValidatePublishedNftReq): Promise<IValidatePublishedNftRes> => {
  let res: IValidatePublishedNftRes = { isValid: true };
  //const currentOwner = await getOwnerOfToken({ nftAddress, tokenId });
  const isContractOwner = true;
  //currentOwner.toLowerCase() === MARKETPLACE_ADDRESS.toLowerCase();
  const baseQuery = AppDataSource.createQueryBuilder(
    MarketListing,
    "market_listing"
  )
    .leftJoinAndSelect("market_listing.uri", "uri")
    .leftJoinAndSelect("market_listing.description", "description")
    .leftJoinAndSelect("market_listing.seller", "seller")
    .leftJoinAndSelect("market_listing.youtube", "youtube")
    .leftJoinAndSelect("market_listing.animation", "animation")
    .leftJoinAndSelect("market_listing.resourceGroup", "resource_group")
    .leftJoinAndSelect("resource_group.nftAddress", "nft_address")
    .leftJoinAndSelect("nft_address.nftType", "nft_type")
    .andWhere("market_listing.tokenId = :tokenId", { tokenId })
    .andWhere("nft_address.nftAddress = :nftAddress", { nftAddress })
    .groupBy("resource_group.resourceId")
    .take(1);
  let foundNftMarket: MarketListing[] = [];
  try {
    foundNftMarket = await baseQuery.getMany();
    if (foundNftMarket.length && isContractOwner) {
      return res;
    } else {
      notifyToDashboard({
        status: "success",
        type: "cancel",
        payload: {
          // resourceId: foundNftMarket[0].resourceGroup.resourceId,
          tokenId,
          nftAddress,
        },
      });
      await nftCancel({ nftAddress, tokenId });
      res.isValid = false;
      return res;
    }
  } catch (err) {
    console.error("marketValidatePublishedNft::error ", err);
    throw err;
  }
};

export const setPrice = async ({
  nftAddress,
  tokenId,
  price,
  sellerAddress,
}) => {
  const foundItem = await marketListingRepository.findOne({
    relations: {
      resourceGroup: {
        nftAddress: true,
      },
      seller: true,
    },
    where: {
      tokenId,
      resourceGroup: {
        nftAddress: {
          nftAddress,
        },
      },
      seller: {
        sellerAddress,
      },
    },
  });
  if (!foundItem) {
    throw new Error("Token not found");
  }
  foundItem.price = price;
  return await marketListingRepository.save(foundItem);
};

export const nftSellersByResourceGroup = async ({
  resourceId,
  sellerAddress,
}): Promise<INextNft> => {
  const nextMarketplaceNft = await marketListingRepository.findOne({
    relations: {
      resourceGroup: {
        nftAddress: true,
      },
      seller: true,
    },
    where: {
      resourceGroup: {
        resourceId,
      },
    },
    order: {
      price: "ASC",
    },
  });
  let nextSelletNft: MarketListing;
  if (sellerAddress) {
    nextSelletNft = await marketListingRepository.findOne({
      relations: {
        resourceGroup: {
          nftAddress: true,
        },
        seller: true,
      },
      where: {
        resourceGroup: {
          resourceId,
        },
        seller: {
          sellerAddress,
        },
      },
      order: {
        price: "ASC",
      },
    });
  }

  const res = {
    resourceId,
    nextMarketplaceNft: flatten(nextMarketplaceNft),
    nextSellerNft: flatten(nextSelletNft),
    newMarketplaceNft: null,
    tokenId: "",
  };
  return res;
};

export const getResourceIdByNftTokenId = async ({
  nftAddress,
  tokenId,
}: {
  nftAddress: string;
  tokenId: string;
}): Promise<string> => {
  try {
    const found = await marketListingRepository.findOne({
      select: {
        resourceGroup: {
          resourceId: true,
        },
      },
      relations: {
        resourceGroup: {
          nftAddress: true,
        },
      },
      where: {
        tokenId,
        resourceGroup: {
          nftAddress: {
            nftAddress,
          },
        },
      },
    });
    if (found) {
      return found.resourceGroup.resourceId;
    }
    throw new Error("Resource not found");
  } catch (err) {
    throw err;
  }
};
