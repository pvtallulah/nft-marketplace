import { ICollectionPost, ICollectionPut, ICollectionGet } from "../interfaces";
import { Collection, MarketListing, NftAddress } from "../db/entity";
import { AppDataSource } from "../db/data-source";

const collectionRepository = AppDataSource.getRepository(Collection);
const nftAddressRepository = AppDataSource.getRepository(NftAddress);

export const postCollectionData = async ({
  collectionName,
  collectionAddress,
  walletAddress,
  type,
}: ICollectionPost): Promise<Collection> => {
  const foundCollection = await collectionRepository.findOne({
    where: { collectionAddress, walletAddress },
  });
  if (foundCollection) {
    throw new Error("Collection already exists");
  }
  try {
    const collection = new Collection();
    collection.walletAddress = walletAddress;
    collection.collectionAddress = collectionAddress;
    collection.type = type;
    collection.collectionName = collectionName;
    return await collectionRepository.save(collection);
  } catch (err) {
    throw err;
  }
};

export const putCollectionData = async ({
  walletAddress,
  collectionAddress,
  collectionImage,
  visible,
}: ICollectionPut): Promise<Collection> => {
  const foundCollection = await collectionRepository.findOne({
    where: { collectionAddress, walletAddress },
  });
  if (!foundCollection) {
    throw new Error("Collection not found");
  }
  try {
    if (collectionImage) foundCollection.collectionImage = collectionImage;
    if (typeof visible === "boolean") foundCollection.visible = visible;
    return await collectionRepository.save(foundCollection);
  } catch (err) {
    throw err;
  }
};

export const getCollectionDataByWallet = async ({
  walletAddress,
  visible,
}: ICollectionGet): Promise<Collection[]> => {
  try {
    return await collectionRepository.find({
      where: { walletAddress, visible: visible === "true" ? true : false },
    });
  } catch (err) {
    throw err;
  }
};

export const banCollection = async ({
  collectionAddress,
  ban,
}: {
  collectionAddress: string;
  ban: boolean;
}): Promise<NftAddress[]> => {
  try {
    const foundCollections = await nftAddressRepository.find({
      where: {
        nftAddress: collectionAddress,
      },
    });
    if (foundCollections.length) {
      foundCollections.forEach(async (collection) => {
        collection.banned = ban;
        await nftAddressRepository.save(collection);
      });
      return foundCollections;
    } else
      throw new Error(`Collection not found for address: ${collectionAddress}`);
  } catch (err) {
    throw err;
  }
};
