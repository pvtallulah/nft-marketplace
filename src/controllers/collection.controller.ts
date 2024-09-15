import {
  Controller,
  Route,
  Post,
  Put,
  Get,
  Body,
  Tags,
  Query,
  FieldErrors,
  ValidateError,
  Path,
  Middlewares,
  Header,
  Request,
} from "tsoa";
import * as minterService from "../services/minter.service";
import { IDGResponse, ICollectionPost, ICollectionPut, IMedia, IMediaRequest, IMediaAccess } from "../interfaces";
import { Collection, CollectionMediaAccess, NftAddress } from "../db/entity";
import { isAddress, isValidAddressRequest } from "../utils";
import { addMediaToCollection, getCollectionMedia, getMatchingRevealedContentCollections, getMediaAccessForTokens, getRevelableContent, removeMediaFromCollection, setMediaAccessForTokens } from "../services/collection.service";
import { authenticateApiKey, collectionAuthMiddleware } from "../middlewares";

@Route("collection")
@Tags("Collection")
export class CollectionData extends Controller {
  @Post("/")
  public async postCollectionData(
    @Body() requestBody: ICollectionPost
  ): Promise<IDGResponse<Collection>> {
    try {
      const { walletAddress, collectionAddress, collectionName, type } =
        requestBody;
      if (!isAddress(walletAddress)) {
        const fields: FieldErrors = {
          walletAddress: {
            message: "Invalid address",
            value: walletAddress,
          },
        };
        throw new ValidateError(fields, "Error with walletAddress params");
      }
      if (!isAddress(collectionAddress)) {
        const fields: FieldErrors = {
          collectionAddress: {
            message: "Invalid address",
            value: collectionAddress,
          },
        };
        throw new ValidateError(fields, "Error with address param");
      }

      if (!collectionName) {
        const fields: FieldErrors = {
          collectionAddress: {
            message: "Invalid collection name",
            value: collectionName,
          },
        };
        throw new ValidateError(fields, "Error with collectionName param");
      }
      const mintedCollection = await minterService.postCollectionData({
        collectionAddress,
        collectionName,
        walletAddress,
        type,
      });
      return {
        status: 200,
        data: mintedCollection,
        message: "Collection minted successfully",
      };
    } catch (e) {
      throw e;
    }
  }

  @Post("/ban")
  public async banCollection(
    @Body()
    requestBody: {
      collectionAddress: string;
      ban: boolean;
      dgToken: string;
    }
  ): Promise<IDGResponse<NftAddress[]>> {
    try {
      const { collectionAddress, dgToken, ban } = requestBody;
      isValidAddressRequest(collectionAddress, dgToken);
      if (typeof ban !== "boolean") {
        const fields: FieldErrors = {
          collectionAddress: {
            message: "Invalid ban param",
            value: ban,
          },
        };
        throw new ValidateError(fields, "Error with ban param");
      }
      const bannedCollections = await minterService.banCollection({
        collectionAddress,
        ban,
      });
      return {
        status: 200,
        data: bannedCollections,
        message: `Collection ${ban ? "banned" : "unbanned"} successfully`,
      };
    } catch (e) {
      throw e;
    }
  }

  @Put("/")
  public async putCollectionData(
    @Body() requestBody: ICollectionPut
  ): Promise<IDGResponse<Collection>> {
    try {
      const { walletAddress, collectionAddress, visible, collectionImage } =
        requestBody;
      if (!isAddress(walletAddress)) {
        const fields: FieldErrors = {
          walletAddress: {
            message: "Invalid address",
            value: walletAddress,
          },
        };
        throw new ValidateError(fields, "Error with walletAddress params");
      }
      if (!isAddress(collectionAddress)) {
        const fields: FieldErrors = {
          collectionAddress: {
            message: "Invalid address",
            value: collectionAddress,
          },
        };
        throw new ValidateError(fields, "Error with address param");
      }
      const mintedCollection = await minterService.putCollectionData({
        walletAddress,
        collectionAddress,
        visible,
        collectionImage,
      });
      return {
        status: 200,
        data: mintedCollection,
        message: "Collection updated successfully",
      };
    } catch (e) {
      throw e;
    }
  }
  @Get("/")
  public async getCollectionData(
    @Query() walletAddress: string,
    @Query() visible: string = "true"
  ): Promise<IDGResponse<Collection[]>> {
    try {
      if (!isAddress(walletAddress)) {
        const fields: FieldErrors = {
          walletAddress: {
            message: "Invalid address",
            value: walletAddress,
          },
        };
        throw new ValidateError(fields, "Error with walletAddress params");
      }
      const listedCollections = await minterService.getCollectionDataByWallet({
        walletAddress,
        visible,
      });
      return {
        status: 200,
        data: listedCollections,
        message: "Collections listed successfully",
      };
    } catch (e) {
      throw e;
    }
  }


  /* Methods for final user */
  @Get("getRevelableCollections")
  public async getRevelableCollections(
    @Query() userAddress: string,
  ): Promise<IDGResponse<string[]>> {
    return {
      status: 200,
      data: await getMatchingRevealedContentCollections(userAddress),
      message: "Sucessfully retrieved matching collections",
    };
  }

  @Get("getRevelableContent")
  @Middlewares([authenticateApiKey])
  public async getRevelableContent(
    @Header("x-api-key") apiKey: string,
    @Request() req: any,
    @Query() contractAddress: string,
  ): Promise<IDGResponse<IMedia[]>> {
    return {
      status: 200,
      data: await getRevelableContent(req.userAddress,contractAddress),
      message: "Sucessfully listed revelable content",
    };
  }
  /* Methods for final user */

  /* Methods for content creator */

  @Get('getCollectionMedia')
  @Middlewares([authenticateApiKey, collectionAuthMiddleware])
  public async getCollectionMedia(
    @Header("x-api-key") apiKey: string,
    @Query() contractAddress: string
  ): Promise<IDGResponse<IMedia[]>> {
    return {
      status: 200,
      data: await getCollectionMedia(contractAddress),
      message: "Sucessfully listed collection media",
    };
  }

  @Post("/addMediaToCollection")
  @Middlewares([authenticateApiKey, collectionAuthMiddleware])
  public async addMediaToCollection(
    @Header("x-api-key") apiKey: string,
    @Body() requestBody: IMediaRequest
  ): Promise<IDGResponse<{media_id: number}>> {
    return await addMediaToCollection(requestBody.media_hash, requestBody.contractAddress);
  }


  @Post("/removeMediaFromCollection")
@Middlewares([authenticateApiKey, collectionAuthMiddleware])
public async removeMediaFromCollection(
  @Header("x-api-key") apiKey: string,
  @Body() requestBody: IMediaRequest
): Promise<IDGResponse<{media_id: number}>> {
  return await removeMediaFromCollection(requestBody.media_hash, requestBody.contractAddress);
}

@Middlewares([authenticateApiKey, collectionAuthMiddleware])
@Post("/getMediaAccessForTokens")
  public async getMediaAccess(
    @Header("x-api-key") apiKey: string,
    @Body() request: IMediaAccess
  ): Promise<IDGResponse<IMedia[]>> {
    try {
      return {
        status: 200,
        data: await getMediaAccessForTokens(request.contractAddress, request.tokenIds),
        message: "Sucessfully listed collection media",
      };

    } catch (err) {
      return {
        status: 500,
        data: [],
        message: err,
      };
     
    }
  }


@Middlewares([authenticateApiKey, collectionAuthMiddleware])
@Post('setMediaAccess')
  public async setMediaAccess(
    @Header("x-api-key") apiKey: string,
    @Body() request: IMediaAccess
  ): Promise<IDGResponse<string>> {
    return {
      status: 200,
      data: await setMediaAccessForTokens(request.contractAddress, request.tokenIds, request.mediaHashes),
      message: "Sucessfully listed collection media",
    };
 
  }

/* Methods for content creator */


  /**
   *
   * El usuario debe poder: Listar las colecciones que tienen contenido revelable
   *    * El usuario debe poder añadir media a una colección
   * El usuario debe poder quitar media de una coleccion
   * El usuario debe poder ver el contenido revelable de una coleccion
   * 
   * 
   * El usuario debe poder listar la media de una colección
   * El usuario debe poder establecer que tokens tienen acceso a que media de una colección
   *
   */
}
