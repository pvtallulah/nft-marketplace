import { Repository, getConnection, getRepository } from "typeorm";
import crypto from "crypto";
import { CollectionMetadata } from "../db/entity";
import { CollectionTokenMetadata, TokensMetadataEntry } from "../interfaces";
import { MongoDataSource } from "../db/data-source";
const metadataRepository = MongoDataSource.getRepository(CollectionMetadata);

export const saveMetadata = async (
  contractAddress: string,
  tokens: number[],
  metadata: CollectionTokenMetadata
): Promise<any> => {
  const metadataHash = crypto
    .createHash("md5")
    .update(JSON.stringify(metadata))
    .digest("hex");

  let document = await metadataRepository.findOne({
    where: { _id: contractAddress },
  });

  if (document) {
    // Document exists, perform an update
    document.tokensMetadata.forEach((entry) => {
      entry.tokens = entry.tokens.filter((token) => !tokens.includes(token));
    });

    const metadataEntry = document.tokensMetadata.find(
      (entry) => entry.hash === metadataHash
    );

    if (metadataEntry) {
      metadataEntry.tokens = Array.from(
        new Set([...metadataEntry.tokens, ...tokens])
      );
    } else {
      document.tokensMetadata.push({ tokens, metadata, hash: metadataHash });
    }

    document.tokensMetadata = document.tokensMetadata.filter(
      (entry) => entry.tokens.length > 0
    );

    await metadataRepository.update(
      { _id: contractAddress },
      { tokensMetadata: document.tokensMetadata }
    );
  } else {
    // Document does not exist, perform an insert
    document = {
      _id: contractAddress,
      tokensMetadata: [{ tokens, metadata, hash: metadataHash }],
    };

    return await metadataRepository.insert(document);
  }
};

export const retrieveMetadata = async (
  contractAddress: string,
  tokenId: number
): Promise<CollectionTokenMetadata | null> => {
  const document = await metadataRepository.findOne({
    where: { _id: contractAddress },
  });

  if (document) {
    let foundMetadata = null;

    for (let entry of document.tokensMetadata) {
      if (entry.tokens.includes(tokenId)) {
        foundMetadata = entry.metadata;
        break;
      }
    }

    return foundMetadata;
  } else {
    return null;
  }
};
