import dotenv from "dotenv";

import { AppDataSource } from "../db/data-source";
import { fileTypeApi } from "../dg-api/dg-api";
import {
  MarketListing,
  Audio,
  Animation,
  ResourceGroup,
} from "../db/entity/index";
import { newErrorV2, newEventV2 } from "./discord.service";
import { getImageDimensionsAndResourceId } from "./image.service";

dotenv.config();

const { VALIDATE_DATA_INTERVAL } = process.env;
const marketListingRepository = AppDataSource.getRepository(MarketListing);
const audioRepository = AppDataSource.getRepository(Audio);
const animationRepository = AppDataSource.getRepository(Animation);
const resourceGroupRepository = AppDataSource.getRepository(ResourceGroup);

const validateAudio = async (): Promise<void> => {
  const audioToValidate = await audioRepository.find({
    where: {
      validated: false,
    },
  });
  const audioToValidateLength = audioToValidate.length;
  let counter = 0;
  for (const audio of audioToValidate) {
    newEventV2({
      title: "Validating Audio",
      description: `Validating resource group ${counter} of ${audioToValidateLength}`,
    });
    counter++;
    const { url } = audio;
    let fileType = null;
    try {
      fileType = await fileTypeApi(`/file-type?url=${url}`);
    } catch (err) {
      console.error("error validating audio: ", err);
    }
    if (fileType) {
      if (fileType.data.mime.includes("audio")) {
        audio.validated = true;
        await audioRepository.save(audio);
      } else {
        const foundMarketListings = await marketListingRepository.find({
          relations: {
            audio: true,
          },
          where: {
            audio: {
              id: audio.id,
            },
          },
        });
        for (const foundMarketListing of foundMarketListings) {
          foundMarketListing.audio = null;
          await marketListingRepository.save(foundMarketListing);
          await audioRepository.delete(audio.id);
        }
      }
    }
  }
};

const validateAnimation = async (): Promise<void> => {
  const animationToValidate = await animationRepository.find({
    where: {
      validated: false,
    },
  });
  const animationToValidateLength = animationToValidate.length;
  let counter = 0;
  for (const animation of animationToValidate) {
    newEventV2({
      title: "Validating animation",
      description: `Validating resource group ${counter} of ${animationToValidateLength}`,
    });
    counter++;
    const { url } = animation;
    let fileType = null;
    try {
      fileType = await fileTypeApi(`/file-type?url=${url}`);
    } catch (err) {
      console.error("error validating animation: ", err);
    }
    if (fileType) {
      const isAnimationFile =
        fileType.data.mime.includes("video") || fileType.data.ext === "gif";
      if (isAnimationFile) {
        animation.validated = true;
        await animationRepository.save(animation);
      } else {
        const foundMarketListings = await marketListingRepository.find({
          relations: {
            animation: true,
          },
          where: {
            animation: {
              id: animation.id,
            },
          },
        });
        if (foundMarketListings.length) {
          for (const foundMarketListing of foundMarketListings) {
            foundMarketListing.animation = null;
            await marketListingRepository.save(foundMarketListing);
            await animationRepository.delete(animation.id);
          }
        } else {
          await animationRepository.delete(animation.id);
        }
      }
    }
  }
};

const validateResourceGroup = async (): Promise<void> => {
  const resourceGroupsToValidate = await resourceGroupRepository.find({
    relations: {
      nftAddress: {
        nftType: true,
      },
    },
    where: {
      width: 0,
      height: 0,
    },
  });
  const resourceGroupsToValidateLength = resourceGroupsToValidate.length;
  let counter = 0;
  for (const resourceGroup of resourceGroupsToValidate) {
    newEventV2({
      title: "Validating resource group",
      description: `Validating resource group ${counter} of ${resourceGroupsToValidateLength}`,
    });
    counter++;
    try {
      const nftAddress = resourceGroup.nftAddress.nftAddress;
      const {
        id: oldResourceId,
        name,
        imageUrl,
        resourceId: oldResourceGroupId,
      } = resourceGroup;
      const { resourceId, width, height } =
        await getImageDimensionsAndResourceId({ name, nftAddress, imageUrl });
      if (width && height) {
        resourceGroup.width = width;
        resourceGroup.height = height;
        resourceGroup.resourceId = resourceId;
        const savedResourceGroup = await resourceGroupRepository.save(
          resourceGroup
        );
        const marketListingsToUpdate = await marketListingRepository.find({
          relations: {
            resourceGroup: true,
          },
          where: {
            resourceGroup: {
              id: oldResourceId,
            },
          },
        });
        if (resourceGroup.resourceId === oldResourceGroupId) continue;
        for (const marketListing of marketListingsToUpdate) {
          try {
            marketListing.resourceGroup = savedResourceGroup;
            await marketListingRepository.save(marketListing);
            newEventV2({
              title: "Resource group updated",
              description: `Resource group updated, old ResourceGroupId: ${oldResourceGroupId} new ResourceGroupId: ${resourceGroup.resourceId}`,
              nftAddress,
            });
            resourceGroupRepository.delete(oldResourceId);
          } catch (error) {
            newErrorV2({
              title: "Error updating  market listing",
              description: `Error updating market listing with new resource group Error: ${error}`,
              nftAddress,
            });
          }
        }
      }
    } catch (err) {
      newErrorV2({
        title: "Error validating resource group",
        description: `Error validating resource group, id: ${resourceGroup.id} \n  resourceGroupId: ${resourceGroup.resourceId} \n Error: ${err}`,
      });
    }
  }
};

export const startDataValidationInterval = (): void => {
  setInterval(async () => {
    try {
      await validateAudio();
      await validateAnimation();
      await validateResourceGroup();
    } catch (error) {
      console.error("validateData.service.ts: ", error);
    }
  }, (+VALIDATE_DATA_INTERVAL || 5) * 1000 * 60);
};
