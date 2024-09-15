import { In } from "typeorm";
import { AppDataSource, MongoDataSource } from "../db/data-source";

import {
  CollectionMedia,
  CollectionMediaAccess,
  CollectionsRevelableContent,
  Media,TokenAccess
} from "../db/entity";
import { getNFTsContractsForUser, getTokensForUserCollection } from "./user.service";
import { IDGResponse, IMedia } from "interfaces";


export const getMatchingRevealedContentCollections = async (
  userWalletAddress: string
): Promise<string[]> => {
  // Get the user's collections
  const userCollections = await getNFTsContractsForUser(userWalletAddress);

  const matchingCollections = await AppDataSource.getRepository(
    CollectionsRevelableContent
  ).find({
    where: {
      contractAddress: In(userCollections),
    },
  });

  const contractAddresses = matchingCollections.map(
    (collection) => collection.contractAddress
  );

  return contractAddresses;
};

export const getRevelableContent = async (
  userWalletAddress: string,
  contractAddress: string
): Promise<IMedia[]> => {

  const tokenIds = await getTokensForUserCollection(userWalletAddress, contractAddress);
  console.log(tokenIds);
  // Get repositories
  const collectionMediaRepository = await MongoDataSource.getRepository(CollectionMedia);
  const collectionMediaAccessRepository = await MongoDataSource.getRepository(CollectionMediaAccess);
  const mediaRepository = await AppDataSource.getRepository(Media);

  const [userMedia, collectionTokenAccess] = await Promise.all([
    collectionMediaRepository.findOne({ where:{_id: contractAddress }}),
    collectionMediaAccessRepository.findOne({ where:{_id: contractAddress }}),
  ]);

  if (!userMedia || !Array.isArray(userMedia.media_ids)) {
    console.log("No user media data found or not in expected format.");
    return [];
  }

  if (!collectionTokenAccess || !Array.isArray(collectionTokenAccess.token_access)) {
    console.log("No token access data found or not in expected format.");
    return [];
  }

  let accessibleMediaIds = [];

  for (const access of collectionTokenAccess.token_access) {
    for (const tokenId of tokenIds) {
      if (access.token_ids.includes(Number(tokenId))) {
        accessibleMediaIds.push(...access.media_ids);
      }
    }
  }

  console.log(accessibleMediaIds);

  // Filter duplicates
  accessibleMediaIds = [...new Set(accessibleMediaIds)];

  // Filter accessibleMediaIds to only include those assigned to the collection address in collection_media
  accessibleMediaIds = accessibleMediaIds.filter(mediaId => userMedia.media_ids.includes(mediaId));

  // Check if there are any accessible media IDs
  if (accessibleMediaIds.length === 0) {
    return [];
  }

  const accessibleMedia = await mediaRepository.find({
    where: {
      media_id: In(accessibleMediaIds)
    }
  });

  return accessibleMedia;
};

export const getCollectionMedia = async (
  contractAddress: string
): Promise<IMedia[]> => {
  
  // Get repositories
  const collectionMediaRepository = await MongoDataSource.getRepository(CollectionMedia);
  const mediaRepository = await AppDataSource.getRepository(Media);

  // Retrieve the collection media document for the specified contract address
  const collectionMediaDoc = await collectionMediaRepository.findOne({ where:{_id: contractAddress }});

  if (!collectionMediaDoc || !Array.isArray(collectionMediaDoc.media_ids)) {
    throw new Error("No media data found for the provided contract address.");
  }

  // Retrieve media from MySQL using the media_ids from the collectionMediaDoc
  const collectionMedia = await mediaRepository.find({
    where: {
      media_id: In(collectionMediaDoc.media_ids)
    }
  });

  return collectionMedia;
};


export const addMediaToCollection = async (
  mediaHash: string,
  contractAddress: string
): Promise<IDGResponse<{media_id: number}>> => {
  const mediaRepository = await AppDataSource.getRepository(Media);
  const collectionMediaRepository = await MongoDataSource.getRepository(CollectionMedia);

  const [media, document] = await Promise.all([
    mediaRepository.findOne({ where: { media_hash: mediaHash } }),
    collectionMediaRepository.findOne({ where: { _id: contractAddress } })
  ]);

  if (!media) {
    return { 
      data: null,
      status: 404, 
      message: "Media not found" 
    };
  }

  if (!document) {
    // Document does not exist, perform an insert
    await collectionMediaRepository.insert({
      _id: contractAddress,
      media_ids: [media.media_id]
    });
  } else if (!document.media_ids.includes(media.media_id)) {
    // Document exists and media not in collection, perform an update
    document.media_ids.push(media.media_id);
    await collectionMediaRepository.update({_id: contractAddress}, {media_ids: document.media_ids});
  } else {
    return { 
      data: null,
      status: 400, 
      message: "Media is already in the collection" 
    };
  }

  return { 
    data: {media_id: media.media_id}, 
    status: 200, 
    message: "Media successfully added to collection" 
  };
};



export const removeMediaFromCollection = async (
  mediaHash: string,
  contractAddress: string
): Promise<IDGResponse<{media_id: number}>> => {
  const mediaRepository = await AppDataSource.getRepository(Media);
  const collectionMediaRepository = await MongoDataSource.getRepository(CollectionMedia);

  const media = await mediaRepository.findOne({ where: { media_hash: mediaHash } });
  const document = await collectionMediaRepository.findOne({ where: { _id: contractAddress } });

  if (!media) {
    return { 
      data: null,
      status: 400, 
      message: "Media not found" 
    };
  }

  if (!document) {
    return { 
      data: null,
      status: 404, 
      message: "Collection not found" 
    };
  }

  if (!document.media_ids.includes(media.media_id)) {
    return { 
      data: null,
      status: 400, 
      message: "Media not in the collection" 
    };
  } 

// Remove media from collection
document.media_ids = document.media_ids.filter(id => id !== media.media_id);
await collectionMediaRepository.update({_id: contractAddress}, {media_ids: document.media_ids});

return { 
  data: {media_id: media.media_id}, 
  status: 200, 
  message: "Media successfully removed from collection" 
};
};





export async function setMediaAccessForTokens(
  contractAddress: string,
  tokenIds: number[],
  mediaHashes: string[]
): Promise<string> {
  const mediaRepository = await AppDataSource.getRepository(Media);
  const collectionMediaAccessRepository = await MongoDataSource.getRepository(CollectionMediaAccess);
  const collectionMediaRepository = await MongoDataSource.getRepository(CollectionMedia);
  const collectionsRevealableContentRepository = await AppDataSource.getRepository(CollectionsRevelableContent);

  const mediaEntities = await mediaRepository.find({
    where: {
      media_hash: In(mediaHashes)
    }
  });

  const mediaIds = mediaEntities.map(media => media.media_id);

  const collectionMediaDoc = await collectionMediaRepository.findOne({
    where: {
      _id: contractAddress
    }
  });

  if (!collectionMediaDoc || !mediaIds.every(mediaId => collectionMediaDoc.media_ids.includes(mediaId))) {
    throw new Error(`Some or all of the provided media hashes are not associated with the provided collection address.`);
  }

  const newTokenMediaMappings = tokenIds.map(tokenId => ({
    token_ids: [Number(tokenId)],
    media_ids: mediaIds,
  }));

  const existingConfig = await collectionMediaAccessRepository.findOne({
    where: {
      _id: contractAddress
    }
  });

  let updatedTokenAccess: TokenAccess[] = existingConfig ? existingConfig.token_access : [];

  for (let newMapping of newTokenMediaMappings) {
    newMapping.media_ids.sort((a, b) => a - b);
    let isMatchFound = false;

    for (let existingMapping of updatedTokenAccess) {
      existingMapping.token_ids = existingMapping.token_ids.filter(tokenId => !newMapping.token_ids.includes(tokenId));
    }

    for (let existingMapping of updatedTokenAccess) {
      existingMapping.media_ids.sort((a, b) => a - b);

      if (
        JSON.stringify(existingMapping.media_ids) === JSON.stringify(newMapping.media_ids) &&
        newMapping.media_ids.length > 0
      ) {
        existingMapping.token_ids = Array.from(new Set([...existingMapping.token_ids, ...newMapping.token_ids]));
        isMatchFound = true;
        break;
      }
    }

    if (!isMatchFound && newMapping.media_ids.length > 0) {
      updatedTokenAccess.push(newMapping);
    }
  }

  updatedTokenAccess = updatedTokenAccess.filter(record => record.token_ids.length > 0);

  // If the document doesn't exist, use `insert`
  if (!existingConfig) {
    await collectionMediaAccessRepository.insert({
      _id: contractAddress,
      token_access: updatedTokenAccess,
    });
  }
  // If the document does exist, use `update`
  else {
    await collectionMediaAccessRepository.update({ _id: contractAddress }, { token_access: updatedTokenAccess });
  }


  
  // Manage the CollectionsRevealableContent
  const existingRevealableContent = await collectionsRevealableContentRepository.findOne({
    where: {
      contractAddress: contractAddress
    }
  });
  if (updatedTokenAccess.length > 0 && !existingRevealableContent) {
    // If tokenAccess has entries and the collection address does not exist in CollectionsRevealableContent, insert it
    await collectionsRevealableContentRepository.insert({ contractAddress });
  } else if (updatedTokenAccess.length === 0 && existingRevealableContent) {
    // If tokenAccess has no entries and the collection address does exist in CollectionsRevealableContent, remove it
    await collectionsRevealableContentRepository.delete({ contractAddress });
  }

  return "ok";
}



export async function getMediaAccessForTokens(
  contractAddress: string,
  tokenIds: number[]
): Promise<Media[]> {
  const collectionMediaAccessRepository = await MongoDataSource.getRepository(CollectionMediaAccess);
  const mediaRepository = await AppDataSource.getRepository(Media);

  const config = await collectionMediaAccessRepository.findOne({
    where: {
      _id: contractAddress
    }
  });

  if (!config) {
    return [];
  }

  const tokenAccessRecords = config.token_access;

  let mediaIdsForTokens: number[] = [];
  
  tokenIds.forEach((tokenId) => {
    tokenAccessRecords.forEach((record) => {
      if (record.token_ids.includes(tokenId)) {
        mediaIdsForTokens.push(...record.media_ids);
      }
    });
  });

  const mediaEntities = await mediaRepository.find({
    where: {
      media_id: In(mediaIdsForTokens)
    }
});
  return mediaEntities;
}



