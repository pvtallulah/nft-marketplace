import { NftAddress } from "../db/entity";
import { AppDataSource } from "../db/data-source";

export const addIceCollection = async (
  nftAddress: string
): Promise<NftAddress> => {
  const nftAddressCollectionRepository =
    AppDataSource.getRepository(NftAddress);
  const foundNftAddress = await nftAddressCollectionRepository.findOne({
    where: { nftAddress },
  });
  if (foundNftAddress) {
    foundNftAddress.isIceCollection = true;
    try {
      return await nftAddressCollectionRepository.save(foundNftAddress);
    } catch (err) {
      console.error("addIceCollection::err ", err);
      throw err;
    }
  }
  return foundNftAddress;
};

export const removeIceCollection = async (
  nftAddress: string
): Promise<NftAddress> => {
  const nftAddressCollectionRepository =
    AppDataSource.getRepository(NftAddress);
  const foundNftAddress = await nftAddressCollectionRepository.findOne({
    where: { nftAddress },
  });
  if (foundNftAddress) {
    foundNftAddress.isIceCollection = false;
    try {
      return await nftAddressCollectionRepository.save(foundNftAddress);
    } catch (err) {
      console.error("addIceCollection::err ", err);
      throw err;
    }
  }
  return foundNftAddress;
};
