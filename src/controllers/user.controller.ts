import {
  Controller,
  Get,
  Route,
  Path,
  ValidateError,
  Tags,
  FieldErrors,
  Put,
  Body,
  Middlewares,
  Header,
  Request,
} from "tsoa";

import * as userService from "../services/user.service";
import {
  ISellerNft,
  IDGResponse,
  IFlattenResponse,
  IUser,
  IUserUpdate,
} from "../interfaces";
import { authenticateApiKey } from "../middlewares";
import { isAddress } from "../utils";

@Route("user")
@Tags("User")
export class UserController extends Controller {
  @Get("getNfts/{address}")
  public async getNFTsContractsForUser(
    @Path() address: string
  ): Promise<IDGResponse<string[]>> {
    try {
      const contractAddresses = await userService.getNFTsContractsForUser(
        address
      );
      return {
        status: 200,
        data: contractAddresses,
        message: "Successfully retrieved NFT contracts for user",
      };
    } catch (error) {
      return {
        status: 404,
        data: null,
        message: error.message,
      };
    }
  }

  @Get("nfts/{sellerAddress}")
  public async getSellerNfts(
    @Path() sellerAddress: string
  ): Promise<IDGResponse<IFlattenResponse[]>> {
    try {
      if (!sellerAddress) {
        const fields: FieldErrors = {
          sellerAddress: {
            message: "Seller address its required",
            value: sellerAddress,
          },
        };
        throw new ValidateError(fields, "Error getting seller nfts");
      } else if (!isAddress(sellerAddress)) {
        const fields: FieldErrors = {
          sellerAddress: {
            message: "Invalid Seller address",
            value: sellerAddress,
          },
        };
        throw new ValidateError(fields, "Error getting seller nfts");
      }
      const sellerNfts = await userService.getSellerNfts(sellerAddress);
      return {
        status: 200,
        data: sellerNfts,
        message: "Succesfully Listing Seller Nfts",
      };
    } catch (e) {
      throw new ValidateError({}, e.message);
    }
  }

  @Get("nfts-grouped/{sellerAddress}")
  public async getSellerNftsGrouped(
    @Path() sellerAddress: string
  ): Promise<IDGResponse<ISellerNft[]>> {
    try {
      if (!sellerAddress) {
        const fields: FieldErrors = {
          sellerAddress: {
            message: "Seller address its required",
            value: sellerAddress,
          },
        };
        throw new ValidateError(fields, "Error getting seller nfts grouped");
      } else if (!isAddress(sellerAddress)) {
        const fields: FieldErrors = {
          sellerAddress: {
            message: "Invalid Seller address",
            value: sellerAddress,
          },
        };
        throw new ValidateError(fields, "Error getting seller nfts");
      }
      const sellerNftsGrouped = await userService.getSellerNftsGrouped(
        sellerAddress
      );
      return {
        status: 200,
        data: sellerNftsGrouped,
        message: "Succesfully Listing Seller Nfts grouped",
      };
    } catch (e) {
      throw new ValidateError({}, e.message);
    }
  }

  @Get("info/{address}")
  public async getUser(@Path() address: string): Promise<IDGResponse<IUser>> {
    try {
      const user = await userService.getUserByAddress(address);
      return {
        status: 200,
        data: user,
        message: "Successfully retrieved user information",
      };
    } catch (error) {
      return {
        status: 404,
        data: null,
        message: "User not found",
      };
    }
  }

  @Put("updateInfo/{address}")
  @Middlewares(authenticateApiKey)
  public async updateUser(
    @Header("x-api-key") apiKey: string,
    @Path() address: string,
    @Body() userData: IUserUpdate
  ): Promise<IDGResponse<IUser>> {
    try {
      const updatedUser = await userService.updateUser(address, userData);
      return {
        status: 200,
        data: updatedUser,
        message: "Successfully updated user information",
      };
    } catch (error) {
      throw error;
      // return {
      //   status: 404,
      //   data: null,
      //   message: "User not found",
      // };
    }
  }
}
