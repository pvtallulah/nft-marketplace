import dotenv from "dotenv";
import { utils } from "ethers";
import { ValidateError, FieldErrors } from "tsoa";
import crypto from "crypto";
import { ValueTransformer } from "typeorm";
import { isEmpty } from "lodash";

import {
  IFlattenResponse,
  INftData,
  IAlchemyNftData,
  ITokenMetadata,
  ITokenData,
} from "../interfaces";
import {
  MarketListing,
  MarketListingGrouped,
  Init,
  TransactionLog,
  TransactionStatus,
  TransactionType,
  Calendar,
  MarketListingNotGrouped,
  ResourceGroup,
} from "../db/entity";
import { format, lastDayOfMonth, parse, isBefore } from "date-fns";

import { AppDataSource } from "../db/data-source";
dotenv.config();
const { DG_TOKEN } = process.env;

export const isValidDgToken = (dgToken: string): boolean => {
  if (!dgToken) {
    const fields: FieldErrors = {
      dgToken: {
        message: "dgToken its required ",
        value: dgToken,
      },
    };
    throw new ValidateError(fields, "Error with dgToken");
  }
  if (dgToken !== DG_TOKEN) {
    const fields: FieldErrors = {
      dgToken: {
        message: "Invalid dgToken ",
        value: dgToken,
      },
    };
    throw new ValidateError(fields, "Error with dgToken");
  }
  return true;
};

export const isValidAddressRequest = (
  address: string,
  dgToken: string
): boolean => {
  if (!dgToken) {
    const fields: FieldErrors = {
      dgToken: {
        message: "dgToken its required ",
        value: dgToken,
      },
    };
    throw new ValidateError(fields, "Error with address params");
  }
  if (dgToken !== DG_TOKEN) {
    const fields: FieldErrors = {
      dgToken: {
        message: "Invalid dgToken ",
        value: dgToken,
      },
    };
    throw new ValidateError(fields, "Error with address params");
  }
  if (!address) {
    const fields: FieldErrors = {
      iceCollectionAddress: {
        message: "Address its required",
        value: address,
      },
    };
    throw new ValidateError(fields, "Error with address params");
  } else if (!isAddress(address)) {
    const fields: FieldErrors = {
      iceCollectionAddress: {
        message: "Invalid address",
        value: address,
      },
    };
    throw new ValidateError(fields, "Error with address params");
  }
  return true;
};

export const randomString = (): string =>
  crypto.randomBytes(32).toString("hex").substring(0, 32);

export const hashSignature = (queryString: string, secret: string): string => {
  return crypto.createHmac("sha512", secret).update(queryString).digest("hex");
};

export const buildTxDataByType = ({
  type,
  args,
}: {
  type: string;
  args: any;
}): {
  paymentId: string;
  to: string;
  nftAddress: string;
  tokenId: string;
} => {
  switch (type) {
    case "paperCallback":
      const [paymentId, to, nftAddress, tokenId] = args;
      return {
        paymentId: hex2Dec(paymentId._hex),
        to,
        nftAddress,
        tokenId: hex2Dec(tokenId._hex),
      };

    default:
      throw new Error(`buildTxDataByType::${type}::Not implemented yet`);
  }
};

export const hex2Dec = (s: string): string => {
  function add(x: string, y: string): string {
    let c = 0;
    const r = [];
    let _x = x.split("").map(Number);
    let _y = y.split("").map(Number);
    while (_x.length || _y.length) {
      const s = (_x.pop() || 0) + (_y.pop() || 0) + c;
      r.unshift(s < 10 ? s : s - 10);
      c = s < 10 ? 0 : 1;
    }
    if (c) r.unshift(c);
    return r.join("");
  }

  let dec = "0";
  s.split("").forEach((chr) => {
    var n = parseInt(chr, 16);
    for (let t = 8; t; t >>= 1) {
      dec = add(dec, dec);
      if (n & t) dec = add(dec, "1");
    }
  });
  return dec;
};

export const stringToBool: ValueTransformer = {
  from: (dbValue) => {
    return dbValue === "1" || dbValue === 1 || dbValue === true;
  },
  to: (entityValue) => {
    return entityValue;
  },
};

export const fixedPrice: ValueTransformer = {
  from: (dbValue) => {
    if (!dbValue) return dbValue;
    const dbValLength = dbValue.split(".")[0].length;
    if (dbValLength > 19) return dbValue.replace(/\.0000$/, "");
    return Number.parseFloat(dbValue)
      .toFixed(4)
      .replace(/\.0000$/, "");
  },
  to: (entityValue) => entityValue,
};

export const isAddress = (address: string): boolean =>
  utils.isAddress(address.toLowerCase());

export const stringToMD5: ValueTransformer = {
  from: (dbValue) => dbValue,
  to: (entityValue) => {
    return crypto.createHash("md5").update(entityValue).digest("hex");
  },
};

export const flatten = (
  marketListing: MarketListing | null
): IFlattenResponse | null => {
  if (!marketListing) return null;
  const {
    id,
    tokenId,
    active,
    price,
    description: descriptionData,
    resourceGroup,
    seller,
    animation,
    youtube,
    audio,
    uri,
  } = marketListing || {};

  const {
    id: idResourceGroup,
    resourceId,
    nftAddress: nftAddressData,
    imageUrl,
    width,
    height,
    name: tokenName,
  } = resourceGroup || {};
  const {
    id: idDescription,
    hashDescription,
    description,
  } = descriptionData || {};

  const {
    id: idNftAddress,
    nftAddress,
    name: collectionName,
    symbol,
    isWearable,
    isIceCollection,
    isDecentraland,
    nftType,
    isVerifiedCollection,
    totalSales,
    iceAmount,
  } = nftAddressData;
  const { id: idAnimation, url: animationUrl } = animation || {};
  const { id: idYoutube, url: youtubeUrl } = youtube || {};
  const { id: idAudio, url: audioUrl } = audio || {};
  const { id: idUri, uriUrl, s3Url } = uri || {};
  const { id: idSeller, sellerAddress } = seller || {};
  const { id: idNftType, type: contractType } = nftType || {};

  return {
    id,
    tokenId,
    active,
    price,
    idResourceGroup,
    resourceId,
    imageUrl,
    width,
    height,
    idNftAddress,
    nftAddress,
    collectionName,
    name: tokenName,
    symbol,
    isWearable,
    isIceCollection,
    isDecentraland,
    idDescription,
    hashDescription,
    description,
    idAnimation,
    animationUrl,
    idUri,
    uriUrl,
    s3Url,
    idYoutube,
    youtubeUrl,
    idAudio,
    audioUrl,
    idSeller,
    sellerAddress,
    isVerifiedCollection,
    idNftType,
    contractType,
    totalSales,
    iceAmount,
  };
};

export const flattenMarketListingGroupped = (
  marketListingGrouped: MarketListingGrouped | MarketListingNotGrouped | null
): IFlattenResponse | null => {
  if (!marketListingGrouped) return null;
  return {
    id: marketListingGrouped.market_listing_id,
    tokenId: marketListingGrouped.market_listing_tokenId,
    active: marketListingGrouped.market_listing_active,
    price: marketListingGrouped.market_listing_price,
    hashDescription: marketListingGrouped.description_hashDescription,
    idDescription: marketListingGrouped.description_id,
    description: marketListingGrouped.description_description,
    idSeller: marketListingGrouped.seller_id,
    sellerAddress: marketListingGrouped.seller_sellerAddress,
    idYoutube: marketListingGrouped.youtube_id,
    youtubeUrl: marketListingGrouped.youtube_youtubeUrl,
    idAnimation: marketListingGrouped.animation_id,
    animationUrl: marketListingGrouped.animation_animationUrl,
    idAudio: marketListingGrouped.audio_id,
    audioUrl: marketListingGrouped.audio_audioUrl,
    idResourceGroup: marketListingGrouped.resource_group_id,
    resourceId: marketListingGrouped.resource_group_resourceId,
    idNftAddress: marketListingGrouped.nft_address_id,
    nftAddress: marketListingGrouped.nft_address_nftAddress,
    collectionName: marketListingGrouped.resource_group_collectionName,
    name: marketListingGrouped.nft_address_name,
    symbol: marketListingGrouped.nft_address_symbol,
    idNftType: marketListingGrouped.nft_type_id,
    contractType: marketListingGrouped.nft_type_type,
    isVerifiedCollection: marketListingGrouped.nft_address_isVerifiedCollection,
    isWearable: marketListingGrouped.nft_address_isWearable,
    isIceCollection: marketListingGrouped.nft_address_isIceCollection,
    isDecentraland: marketListingGrouped.nft_address_isDecentraland,
    imageUrl:
      marketListingGrouped.uri_s3Url ||
      marketListingGrouped.resource_group_imageUrl,
    width: marketListingGrouped.resource_group_width,
    height: marketListingGrouped.resource_group_height,
    idUri: marketListingGrouped.uri_id,
    uriUrl: marketListingGrouped.uri_uriUrl,
    totalSales: marketListingGrouped.nft_address_totalSales,
    iceAmount: marketListingGrouped.nft_address_iceAmount,
  };
};

export const mapProviderNftData = (nftRawData: IAlchemyNftData): INftData => {
  return {
    token_id: nftRawData.id.tokenId,
    token_address: nftRawData.contract.address,
    contract_type: nftRawData.contractMetadata.tokenType,
    collectionName: nftRawData.contractMetadata.name,
    symbol: nftRawData.contractMetadata.symbol,
    token_uri: nftRawData.metadata.id,
    metadata: JSON.stringify(nftRawData.metadata),
    synced_at: nftRawData.timeLastUpdated.toString(),
  };
};

export const isAlchemyNftData = (
  nftRawData: any
): nftRawData is IAlchemyNftData => {
  return nftRawData.contractMetadata !== undefined;
};
export const mapNftData = (
  nftRawData: IAlchemyNftData | ITokenData
): INftData => {
  if (isAlchemyNftData(nftRawData))
    return {
      token_id: nftRawData.id.tokenId,
      token_address: nftRawData.contract.address,
      contract_type: nftRawData.contractMetadata.tokenType,
      collectionName: nftRawData.contractMetadata.name,
      symbol: nftRawData.contractMetadata.symbol,
      token_uri: nftRawData.metadata.id,
      metadata: JSON.stringify(nftRawData.metadata),
      synced_at: nftRawData.timeLastUpdated.toString(),
    };
  return {
    token_id: nftRawData.token_id,
    token_address: nftRawData.token_address,
    contract_type: nftRawData.contract_type,
    collectionName: nftRawData.name,
    symbol: nftRawData.symbol,
    token_uri: nftRawData.token_uri,
    metadata: JSON.stringify(nftRawData.metadata),
    synced_at: "",
  };
};

export const initDb = async (): Promise<Init> => {
  const initRepository = AppDataSource.getRepository(Init);
  const transactionTypeRepository =
    AppDataSource.getRepository(TransactionType);
  const transactionStatusRepository =
    AppDataSource.getRepository(TransactionStatus);
  // const calendarRepository = AppDataSource.getRepository(Calendar);
  const resourceGroupRepository = AppDataSource.getRepository(ResourceGroup);
  const init = await initRepository.find();
  const transactionTypeData = [
    "buy",
    "buyforgift",
    "sell",
    "cancel",
    "paperpurchase",
    "setprice",
  ];
  const transactionStatusData = ["pending", "success", "failed"];
  if (!init.length) {
    for (const tType of transactionTypeData) {
      const transactionType = new TransactionType();
      transactionType.type = tType;
      await transactionTypeRepository.save(transactionType);
    }
    for (const tStatus of transactionStatusData) {
      const transactionStatus = new TransactionStatus();
      transactionStatus.status = tStatus;
      await transactionStatusRepository.save(transactionStatus);
    }
    const datesArr: any[] = [];
    let startDate = new Date(2022, 0, 1);
    const endDate = new Date(2030, 11, 31);
    const unprocessedResourceGroup = new ResourceGroup();
    unprocessedResourceGroup.resourceId = "unprocessed";
    unprocessedResourceGroup.height = 0;
    unprocessedResourceGroup.width = 0;
    unprocessedResourceGroup.imageUrl = "";
    unprocessedResourceGroup.name = "unprocessed";
    await resourceGroupRepository.save(unprocessedResourceGroup);
    while (startDate <= endDate) {
      const newDate = startDate.setDate(startDate.getDate() + 1);
      startDate = new Date(newDate);
      datesArr.push(startDate.toISOString().split("T")[0]);
    }
    // for (const dateKey of datesArr) {
    //   const calendar = new Calendar();
    //   calendar.calendarDate = [dateKey as Date];
    //   await calendarRepository.save(calendar);
    // }
    const init = new Init();
    init.generated = true;
    return await initRepository.save(init);
  }
  return init[0];
};

export const getAnalyticsDate = (
  from?: string,
  to?: string
): {
  fromDate: string;
  toDate: string;
} => {
  const today = new Date();
  let fromDate = format(today, "yyyy-MM-01");
  let toDate = format(lastDayOfMonth(today), "yyyy-MM-dd");
  if (from) {
    fromDate = from;
  }
  if (to) {
    toDate = to;
  }
  return { fromDate, toDate };
};

export const validateAnalyticsDate = (from: string, to: string): boolean => {
  if (
    isBefore(
      parse(to, "yyyy-mm-dd", new Date()),
      parse(from, "yyyy-mm-dd", new Date())
    )
  ) {
    const fields: FieldErrors = {
      walletAddress: {
        message: "TO date must be greater than from DATE",
        value: `from: ${from} - to: ${to}`,
      },
    };
    throw new ValidateError(fields, "Error with dates params");
  }
  return true;
};

interface IMarketplaceParams {
  nftAddress?: string;
  limit?: string;
  offset?: string;
  price?: string;
  verifiedCollection?: string;
  isDecentraland?: string;
  isIceCollection?: string;
  name?: string;
  sellerAddress?: string;
  buyerAddress?: string;
  resourceId?: string;
  tokenId?: string;
}

export const validateQueryParams = ({
  nftAddress,
  limit,
  offset,
  price,
  verifiedCollection,
  isDecentraland,
  isIceCollection,
  name,
  sellerAddress,
  buyerAddress,
  resourceId,
  tokenId,
}: IMarketplaceParams): void => {
  const fields: FieldErrors = {};
  if (nftAddress) {
    const nftAddresses = nftAddress.split(",");
    const badNftAddresses: string[] = [];
    for (const nftAddr of nftAddresses) {
      if (!isAddress(nftAddr)) {
        badNftAddresses.push(nftAddr);
      }
    }
    if (badNftAddresses.length)
      fields["nftAddress"] = {
        message: "Invalid nftAddress address",
        value: badNftAddresses.join(" - "),
      };
  }
  if (sellerAddress && !isAddress(sellerAddress)) {
    fields["sellerAddress"] = {
      message: "Invalid sellerAddress address",
      value: sellerAddress,
    };
  }
  if (buyerAddress && !isAddress(buyerAddress)) {
    fields["buyerAddress"] = {
      message: "Invalid buyerAddress address",
      value: buyerAddress,
    };
  }
  if (limit) {
    const limitNumber = Number(limit);
    if (isNaN(limitNumber)) {
      fields["limit"] = {
        message: "Invalid limit, must be a number",
        value: limit,
      };
    } else if (limitNumber < 0) {
      fields["limit"] = {
        message: "Invalid limit, must be greater than 0",
        value: limit,
      };
    } else if (limitNumber > 100) {
      fields["limit"] = {
        message: "Invalid limit, must be less than 100",
        value: limit,
      };
    }
  }
  if (offset) {
    const offsetNumber = Number(offset);
    if (isNaN(offsetNumber)) {
      fields["offset"] = {
        message: "Invalid offset, must be a number",
        value: offset,
      };
    } else if (offsetNumber < 0) {
      fields["offset"] = {
        message: "Invalid offset, must be greater or equal than 0",
        value: offset,
      };
    }
  }
  if (price) {
    if (price.toUpperCase() !== "ASC" && price.toUpperCase() !== "DESC") {
      fields["price"] = {
        message: "Invalid price, must be ASC or DESC",
        value: price,
      };
    }
  }
  if (verifiedCollection) {
    if (verifiedCollection !== "true" && verifiedCollection !== "false") {
      fields["verifiedCollection"] = {
        message: "Invalid verifiedCollection, must be true or false",
        value: verifiedCollection,
      };
    }
  }
  if (isDecentraland) {
    if (isDecentraland !== "true" && isDecentraland !== "false") {
      fields["isDecentraland"] = {
        message: "Invalid isDecentraland, must be true or false",
        value: isDecentraland,
      };
    }
  }
  if (isIceCollection) {
    if (isIceCollection !== "true" && isIceCollection !== "false") {
      fields["isIceCollection"] = {
        message: "Invalid isIceCollection, must be true or false",
        value: isIceCollection,
      };
    }
  }
  if (name && name.length > 100) {
    fields["name"] = {
      message: "Invalid name, must be less than 100 characters",
      value: name,
    };
  }
  if (resourceId && resourceId.length !== 32) {
    fields["resourceId"] = {
      message: "Invalid resourceId, must be equal 32 characters",
      value: resourceId,
    };
  }
  if (tokenId) {
    const tokenIdNumber = Number(tokenId);
    if (isNaN(tokenIdNumber)) {
      fields["tokenId"] = {
        message: "Invalid tokenId, must be a number",
        value: tokenId,
      };
    } else if (tokenIdNumber < 0) {
      fields["tokenId"] = {
        message: "Invalid tokenId, must be greater than 0",
        value: tokenId,
      };
    }
  }
  if (!isEmpty(fields)) {
    throw new ValidateError(fields, "Error on query params");
  }
};
