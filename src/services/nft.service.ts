import { In } from "typeorm";
import { AppDataSource } from "../db/data-source";
import { Uri } from "../db/entity";

const uriRepository = AppDataSource.getRepository(Uri);

export const getNftExtraData = async (requestBody: any): Promise<any> => {
  const tokenURIs = collectTokenURIs(requestBody);
  const mappedResults = await fetchAllMetadataAndImages(tokenURIs);
  const updatedResult = requestBody.map((item: any) => {
    const newItem = { ...item };
    assignMetadataAndImage(newItem, mappedResults);
    return newItem;
  });

  return updatedResult;
};

function collectTokenURIs(obj: any, tokenURIs = []) {
  if (obj !== null && typeof obj === "object") {
    Object.keys(obj).forEach((key) => {
      if (key === "tokenURI") {
        tokenURIs.push(obj[key]);
      } else {
        collectTokenURIs(obj[key], tokenURIs);
      }
    });
  }
  return tokenURIs;
}

async function fetchAllMetadataAndImages(tokenURIs: string[]) {
  const foundUris = await uriRepository.find({
    where: {
      uriUrl: In(tokenURIs),
    },
  });
  const mappedResults = {};
  foundUris.forEach((result) => {
    mappedResults[result.uriUrl] = {
      metadata: result.metadata,
      image: result.s3Url,
    };
  });
  return mappedResults;
}

function assignMetadataAndImage(obj: any, metadataImagesMap: any) {
  if (obj !== null && typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      if (key === "tokenURI") {
        if (metadataImagesMap.hasOwnProperty(obj[key])) {
          obj.metadata = metadataImagesMap[obj[key]].metadata;
          obj.image = metadataImagesMap[obj[key]].image;
        } else {
          obj.metadata = null;
          obj.image = null;
        }
      } else {
        assignMetadataAndImage(obj[key], metadataImagesMap);
      }
    }
  }
}
