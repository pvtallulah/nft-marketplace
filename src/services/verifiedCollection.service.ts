import { NftAddress } from "../db/entity/index";
import { AppDataSource } from "../db/data-source";
const nftAddressRepository = AppDataSource.getRepository(NftAddress);

export const addVerifiedCollection = async (
  nftAddress: string
): Promise<NftAddress> => {
  const foundCollection = await nftAddressRepository.findOne({
    where: { nftAddress },
  });
  if (foundCollection) {
    try {
      foundCollection.isVerifiedCollection = true;
      return await nftAddressRepository.save(foundCollection);
    } catch (err) {
      console.error("addVerifiedCollection::err ", err);
      throw err;
    }
  }
  return foundCollection;
};

export const removeVerifiedCollection = async (
  nftAddress: string
): Promise<NftAddress> => {
  const foundCollection = await nftAddressRepository.findOne({
    where: { nftAddress },
  });
  if (foundCollection) {
    try {
      foundCollection.isVerifiedCollection = false;
      return await nftAddressRepository.save(foundCollection);
    } catch (err) {
      console.error("removeVerifiedCollection::err ", err);
      throw err;
    }
  }
  return foundCollection;
};
