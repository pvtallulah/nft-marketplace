import crypto from "crypto";
import axios from "axios";
import { Not, LessThan, IsNull } from "typeorm";
import { AppDataSource } from "../db/data-source";
import {
  MarketListing,
  NftAddress,
  NftType,
  ResourceGroup,
  Uri,
  Description,
  Youtube,
  Audio,
  Animation,
} from "../db/entity";
import { getTokenData } from "./wss.service";
import { getImageDimensionsAndResourceId } from "./image.service";
import { newErrorV2 } from "./discord.service";
import { fileTypeApi } from "../dg-api/dg-api";

const marketListingRepository = AppDataSource.getRepository(MarketListing);
const resourceGroupRepository = AppDataSource.getRepository(ResourceGroup);
const descriptionRepository = AppDataSource.getRepository(Description);
const nftAddressRepository = AppDataSource.getRepository(NftAddress);
const animationRepository = AppDataSource.getRepository(Animation);
const youtubeRepository = AppDataSource.getRepository(Youtube);
const nftTypeRepository = AppDataSource.getRepository(NftType);
const audioRepository = AppDataSource.getRepository(Audio);
const uriRepository = AppDataSource.getRepository(Uri);

export const getAdditionalData = async ({
  nftAddress,
  tokenId,
  token_uri,
}: {
  nftAddress?: string;
  tokenId?: string;
  token_uri?: string;
} = {}): Promise<any> => {
  let unprocessedItems: MarketListing[] = [];
  if (nftAddress && tokenId) {
    unprocessedItems = await marketListingRepository.find({
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
  } else {
    unprocessedItems = await marketListingRepository.find({
      relations: {
        resourceGroup: {
          nftAddress: true,
        },
      },
      where: {
        preprocessedId: Not(IsNull()),
        preprocessedCount: LessThan(5),
        resourceGroup: {
          name: "unprocessed",
        },
      },
    });
  }
  for (const item of unprocessedItems) {
    item.preprocessedCount = item.preprocessedCount + 1;
    await marketListingRepository.save(item);
    const description = new Description();
    const nftType = new NftType();
    const uri = new Uri();
    const tokenData = await getTokenData({
      nftAddress: item.resourceGroup.nftAddress.nftAddress,
      tokenId: item.tokenId,
      token_uri,
    });
    if (tokenData) {
      const {
        metadata,
        token_address: collectionAddress,
        symbol,
        contract_type: collectionType,
        token_uri: tokenUri,
        collectionName,
      } = tokenData;
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
      if (foundNftAddress) {
        foundNftAddress.nftAddress = collectionAddress;
        foundNftAddress.symbol = symbol;
        foundNftAddress.name = collectionName;
        foundNftAddress.isDecentraland = await isDecentralandNft(
          collectionAddress
        );
        foundNftAddress.isWearable = await isWearable(collectionAddress);
        foundNftAddress.nftType = foundNftType || nftTypeSaved;
        await nftAddressRepository.save(foundNftAddress);
      } else {
        continue;
      }

      let savedUri: Uri = null;
      const foundUri = await uriRepository.findOne({
        where: {
          uriUrl: tokenUri,
        },
      });
      if (foundUri) {
        item.uri = foundUri;
      } else {
        uri.uriUrl = tokenUri;
        savedUri = await uriRepository.save(uri);
      }
      item.uri = foundUri || savedUri;
      marketListingRepository.save(item);
      if (metadata !== "{}") {
        const parsedMetadata = JSON.parse(metadata);
        const {
          image = "",
          description: fullTokenDescription = "",
          youtube_url: youtubeUrl,
          audio_url: audioUrl,
          animation_url: animationUrl,
          name: tokenName = "",
        } = parsedMetadata;
        item.uri.metadata = metadata || null;
        await uriRepository.save(item.uri);
        const tokenDescription =
          fullTokenDescription.length > 500
            ? fullTokenDescription.substring(0, 500)
            : fullTokenDescription || "";
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
        item.description = foundDescription || savedDescription;
        marketListingRepository.save(item);

        try {
          await saveMediaData({
            marketListing: item,
            youtubeUrl,
            animationUrl,
            audioUrl,
          });
        } catch (error) {
          console.log("====================================");
          console.log("error saving media data");
          console.log(error);
          console.log("====================================");
          throw error;
        }

        // Save new resource group
        let resourceGroupSaved: ResourceGroup = null;
        const resourceGroup = new ResourceGroup();
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
              name: tokenName || "No name",
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
          const getImageDimensionsAndResourceIdData =
            await getImageDimensionsAndResourceId({
              name: tokenName || "No name",
              imageUrl: image,
              nftAddress:
                foundNftAddress?.nftAddress || nftAddressSaved.nftAddress,
            });
          const { resourceId, width, height } =
            getImageDimensionsAndResourceIdData;
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
            resourceGroup.name = tokenName || "No name";
            resourceGroup.nftAddress = foundNftAddress || nftAddressSaved;
            resourceGroup.imageUrl = image;
            resourceGroup.resourceId = resourceId;
            resourceGroup.width = width;
            resourceGroup.height = height;
            resourceGroupSaved = await resourceGroupRepository.save(
              resourceGroup
            );
          }
        }
        let tempResourceId: string = "";

        try {
          tempResourceId = crypto
            .createHash("md5")
            .update(item.resourceGroup.nftAddress.nftAddress + item.tokenId)
            .digest("hex");
        } catch (error) {
          console.log(error);
          newErrorV2({
            title: "Error creating tempResourceId",
            description: `Error creating tempResourceId for nftAddress: ${item.resourceGroup.nftAddress.nftAddress} tokenId: ${item.tokenId}\n error: ${error}`,
          });
        }
        if (tempResourceId) {
          item.resourceGroup =
            foundResourceGroup?.resourceGroup || resourceGroupSaved;
          item.preprocessedId = null;
          await marketListingRepository.save(item);
          await resourceGroupRepository.delete({
            resourceId: tempResourceId,
          });
        }
      } else {
        return await marketListingRepository.save(item);
      }
    }
    // if (!nftData.metadata) // dejar para volver a llamarlo
    // else inserto ok
  }
};

const saveMediaData = async ({
  marketListing,
  youtubeUrl,
  animationUrl,
  audioUrl,
}: {
  marketListing: MarketListing;
  youtubeUrl?: string;
  animationUrl?: string;
  audioUrl?: string;
}) => {
  try {
    const youtube = new Youtube();
    const animation = new Animation();
    const audio = new Audio();
    let savedYoutube: Youtube = null;
    let savedAnimation: Animation = null;
    let savedAudio: Audio = null;
    // Save Youtube
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
    if (animationUrl) {
      let animationType = null;
      try {
        animationType = await fileTypeApi(`/file-type?url=${animationUrl}`);
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
        if (isAudioMimeType(animationType.data.mime)) {
          const foundAudio = await audioRepository.findOne({
            where: { url: animationUrl },
          });
          if (!foundAudio) {
            audio.url = animationUrl;
            audio.validated = true;
            savedAudio = await audioRepository.save(audio);
          } else {
            savedAudio = foundAudio;
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
    }

    // Save Audio

    if (audioUrl) {
      let audioType = null;
      try {
        audioType = await fileTypeApi(`/file-type?url=${audioUrl}`);
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

    marketListing.youtube = savedYoutube;
    marketListing.animation = savedAnimation;
    marketListing.audio = savedAudio;
    await marketListingRepository.save(marketListing);
  } catch (error) {
    throw error;
  }
};

const isAudioMimeType = (mimeType: string) => {
  return mimeType.startsWith("audio/");
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
