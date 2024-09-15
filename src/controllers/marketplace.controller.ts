import dotenv from "dotenv";
import {
  Controller,
  Get,
  Route,
  Query,
  Path,
  Body,
  Response,
  ValidateError,
  Tags,
  Post,
} from "tsoa";
import * as marketplaceService from "../services/marketplace.service";
import Abi from "../abi/DGMarketplaceAbi";

import { validateQueryParams } from "../utils";
import {
  IDGResponse,
  IMarketListings,
  IMarketplaceCollection,
  IFlattenResponse,
  IValidatePublishedNftReq,
  IValidatePublishedNftRes,
  IMarketplaceCollection2,
  IMarketValidatePublishedNftReq,
  IMarketListingsDict,
  INextNft,
} from "../interfaces";

dotenv.config();
const { MARKETPLACE_ADDRESS } = process.env;

@Route("marketplace")
@Tags("Marketplace")
export class MarketplaceController extends Controller {
  @Get("/")
  @Response<Error>(400, "Unexpected error")
  public async getMarketListingsGrouped(
    // @Res() customError: TsoaResponse<400, { reason: string }>,
    @Query() nftAddress?: string,
    @Query() limit?: string,
    @Query() offset?: string,
    @Query() price?: string,
    @Query() verifiedCollection?: string,
    @Query() isDecentraland?: string,
    @Query() isIceCollection?: string,
    @Query() name?: string,
    @Query() sellerAddress?: string
  ): Promise<IDGResponse<IMarketListings>> {
    try {
      const marketListingsGrouped =
        await marketplaceService.getMarketListingsGrouped({
          nftAddress,
          limit,
          offset,
          verifiedCollection,
          price: price
            ? price === "desc" || price === "DESC"
              ? "DESC"
              : "ASC"
            : "ASC",
          isDecentraland,
          isIceCollection,
          name,
          sellerAddress,
        });
      return {
        data: marketListingsGrouped,
        status: 200,
        message: "Succesfully Listing Seller Nfts",
      };
    } catch (e) {
      throw e;
    }
  }
  @Get("/user-listings-by-collection/{sellerAddress}/{nftAddress}")
  @Response<Error>(400, "Unexpected error")
  public async getUserListingsByCollection(
    // @Res() customError: TsoaResponse<400, { reason: string }>,
    @Path() nftAddress: string,
    @Path() sellerAddress: string,
    @Query() limit?: string,
    @Query() offset?: string,
    @Query() price?: string,
    @Query() verifiedCollection?: string,
    @Query() isDecentraland?: string,
    @Query() isIceCollection?: string,
    @Query() name?: string
  ): Promise<IDGResponse<IMarketListings>> {
    try {
      const marketListingsGrouped =
        await marketplaceService.getUserListingsByCollection({
          nftAddress,
          limit,
          offset,
          verifiedCollection,
          price: price
            ? price === "desc" || price === "DESC"
              ? "DESC"
              : "ASC"
            : "ASC",
          isDecentraland,
          isIceCollection,
          name,
          sellerAddress,
        });
      return {
        data: marketListingsGrouped,
        status: 200,
        message: "Succesfully Listing Seller Nfts",
      };
    } catch (e) {
      throw e;
    }
  }

  @Response<Error>(400, "Unexpected error")
  @Get("listings/{resourceId}")
  public async getMarketListingsResourceId(
    @Path() resourceId: string,
    @Query() verifiedCollection?: string
  ): Promise<IDGResponse<IMarketListings>> {
    try {
      const marketListings =
        await marketplaceService.getMarketListingsResourceId({
          verifiedCollection,
          resourceId,
        });
      return {
        data: marketListings,
        status: 200,
        message: "Succesfully Listings Retrieved",
      };
    } catch (e) {
      throw e;
    }
  }

  // public async collectionNames(): Promise<IDGResponse<any>> {
  //   try {
  //     const collectionNames = await marketplaceService.collectionNames();
  //     return {
  //       data: collectionNames,
  //       status: 200,
  //       message: "Collection names",
  //     };
  //   } catch (e) {
  //     throw new ValidateError({}, e.message);
  //   }
  // }

  @Response<Error>(400, "Unexpected error")
  @Get("contract-data")
  public getContractData(): IDGResponse<{ abi: Array<any>; address: string }> {
    try {
      return {
        data: {
          abi: Abi,
          address: MARKETPLACE_ADDRESS,
        },
        status: 200,
        message: "Contract Data",
      };
    } catch (e) {
      throw new ValidateError({}, e.message);
    }
  }

  @Response<Error>(400, "Unexpected error")
  @Get("collections")
  public async getCollections(
    @Query() verifiedCollection?: string,
    @Query() name?: string,
    @Query() limit?: string,
    @Query() offset?: string,
    @Query() sellerAddress?: string,
    @Query() nftAddress?: string
  ): Promise<IDGResponse<IMarketplaceCollection>> {
    try {
      const collections = await marketplaceService.getCollections({
        verifiedCollection,
        name,
        limit,
        offset,
        sellerAddress,
        nftAddress: nftAddress ? nftAddress.split(",") : undefined,
      });
      return {
        data: collections,
        status: 200,
        message: "Succesfully Listings Collections",
      };
    } catch (e) {
      throw e;
    }
  }
  @Response<Error>(400, "Unexpected error")
  @Get("collection/{nftAddress}")
  public async getCollectionByAddress(
    @Path() nftAddress: string,
    @Query() verifiedCollection?: string,
    @Query() name?: string,
    @Query() limit?: string,
    @Query() offset?: string,
    @Query() sellerAddress?: string
  ): Promise<IDGResponse<IMarketplaceCollection>> {
    try {
      const collections = await marketplaceService.getCollections({
        nftAddress: nftAddress ? nftAddress.split(",") : undefined,
        verifiedCollection,
        name,
        limit,
        offset,
        sellerAddress,
      });
      return {
        data: collections,
        status: 200,
        message: "Succesfully Listings Collections",
      };
    } catch (e) {
      throw e;
    }
  }
  @Response<Error>(400, "Unexpected error")
  @Get("collection/{nftAddress}/{resourceId}")
  public async getCollectionByAddressResourceId(
    @Path() nftAddress: string,
    @Path() resourceId: string,
    @Query() verifiedCollection?: string,
    @Query() sellerAddress?: string,
    @Query() name?: string,
    @Query() limit?: string,
    @Query() offset?: string
  ): Promise<IDGResponse<IMarketplaceCollection2>> {
    try {
      const collections =
        await marketplaceService.getCollectionByNftAddressResourceId({
          nftAddress,
          resourceId,
          verifiedCollection,
          name,
          sellerAddress,
          limit,
          offset,
        });
      return {
        data: collections,
        status: 200,
        message: "Succesfully Listings Collections",
      };
    } catch (e) {
      throw e;
    }
  }
  @Response<Error>(400, "Unexpected error")
  @Get("nft/{resourceId}/{tokenId}")
  public async getNftData(
    @Path() resourceId: string,
    @Path() tokenId: string
  ): Promise<IDGResponse<IFlattenResponse>> {
    try {
      const collections = await marketplaceService.getDataByResourceIdTokenId({
        resourceId,
        tokenId,
      });
      return {
        data: collections,
        status: 200,
        message: "Succesfully Listing Nft Data",
      };
    } catch (e) {
      throw e;
    }
  }

  @Response<Error>(400, "Unexpected error")
  @Post("listings/valiadate-published-nft")
  public async validatePublishedNft(
    @Body() requestBody: IValidatePublishedNftReq
  ): Promise<IDGResponse<IValidatePublishedNftRes>> {
    try {
      const { nftAddress, tokenId, resourceId, price, sellerAddress } =
        requestBody;
      validateQueryParams({
        nftAddress,
        tokenId,
        resourceId,
        sellerAddress,
      });
      const validatedData = await marketplaceService.validatePublishedNft({
        nftAddress,
        tokenId,
        resourceId,
        price,
        sellerAddress,
      });
      return {
        data: validatedData,
        status: 200,
        message: "Nft validated",
      };
    } catch (e) {
      throw e;
    }
  }
  @Response<Error>(400, "Unexpected error")
  @Post("listings/market-validate-published-nft")
  public async marketValidatePublishedNft(
    @Body() requestBody: IMarketValidatePublishedNftReq
  ): Promise<IDGResponse<IValidatePublishedNftRes>> {
    try {
      const { nftAddress, tokenId } = requestBody;
      validateQueryParams({
        nftAddress,
        tokenId,
      });
      const validatedData = await marketplaceService.marketValidatePublishedNft(
        {
          nftAddress,
          tokenId,
        }
      );
      return {
        data: validatedData,
        status: 200,
        message: "Market Nft validated",
      };
    } catch (e) {
      throw e;
    }
  }

  @Response<Error>(400, "Unexpected error")
  @Get("nft-sellers-by-resource-group/{resourceId}")
  public async nftSellersByResourceGroup(
    @Path() resourceId: string,
    @Query() sellerAddress?: string
  ): Promise<IDGResponse<INextNft>> {
    try {
      const nfts = await marketplaceService.nftSellersByResourceGroup({
        resourceId,
        sellerAddress,
      });
      return {
        data: nfts,
        status: 200,
        message: "Succesfully Listing Nft Data",
      };
    } catch (e) {
      throw e;
    }
  }
}
