import dotenv from "dotenv";
import {
  Controller,
  Route,
  Get,
  Tags,
  Query,
  FieldErrors,
  ValidateError,
} from "tsoa";

import { IDGResponse, IBinanceLink } from "../interfaces";
import * as binanceService from "../services/binance.service";
import { isAddress } from "../utils";
import { getThirdPartyTransaction } from "../services/thirdParyTransaction.service";
dotenv.config();

@Route("binance")
@Tags("binance")
export class Binance extends Controller {
  @Get("/payment-link")
  public async getBinancePaymentLink(
    @Query() nftAddress: string,
    @Query() tokenIds: string[],
    @Query() buyerAddress: string,
    @Query() email?: string
  ): Promise<IDGResponse<IBinanceLink>> {
    if (!nftAddress) {
      const fields: FieldErrors = {
        address: {
          message: "Nft nftAddress its required",
          value: nftAddress,
        },
      };
      throw new ValidateError(fields, "Error generating payment link");
    }
    if (!tokenIds || !tokenIds.length) {
      const fields: FieldErrors = {
        tokenId: {
          message: "Tokens Ids are required",
          value: tokenIds,
        },
      };
      throw new ValidateError(fields, "Error generating payment link");
    }
    if (!isAddress(buyerAddress)) {
      const fields: FieldErrors = {
        buyerAddress: {
          message: "Invalid buyerAddress address",
          value: buyerAddress,
        },
      };
      throw new ValidateError(fields, "Error generating payment link");
    }

    try {
      const paymentUrl = await binanceService.createPaymentLink(
        nftAddress,
        tokenIds,
        buyerAddress,
        email
      );
      return {
        status: 200,
        data: paymentUrl,
        message: "Payment link generated succesfully",
      };
    } catch (e) {
      throw new ValidateError({}, e.message);
    }
  }

  // @Get("/payment-link-multipe")
  // public async getBinancePaymentLinkMultiple(
  //   @Query() nftAddress: string,
  //   @Query() tokenIds: string[],
  //   @Query() buyerAddress: string,
  //   @Query() email?: string
  // ): Promise<IDGResponse<IBinanceLink>> {
  //   if (!nftAddress) {
  //     const fields: FieldErrors = {
  //       address: {
  //         message: "Nft nftAddress its required",
  //         value: nftAddress,
  //       },
  //     };
  //     throw new ValidateError(fields, "Error generating payment link");
  //   }
  //   if (!tokenIds || !tokenIds.length) {
  //     const fields: FieldErrors = {
  //       tokenId: {
  //         message: "Token Id its required",
  //         value: nftAddress,
  //       },
  //     };
  //     throw new ValidateError(fields, "Error generating payment link");
  //   }
  //   if (!isAddress(buyerAddress)) {
  //     const fields: FieldErrors = {
  //       buyerAddress: {
  //         message: "Invalid buyerAddress address",
  //         value: buyerAddress,
  //       },
  //     };
  //     throw new ValidateError(fields, "Error generating payment link");
  //   }
  //   try {
  //     const paymentUrl = await binanceService.createPaymentLinkMultiple(
  //       nftAddress,
  //       tokenIds,
  //       buyerAddress,
  //       email
  //     );
  //     return {
  //       status: 200,
  //       data: paymentUrl,
  //       message: "Payment link generated succesfully",
  //     };
  //   } catch (e) {
  //     throw new ValidateError({}, e.message);
  //   }
  // }

  @Get("/payment-status")
  public async getBinancePaymentStatus(
    @Query() prepayId: string
  ): Promise<IDGResponse<any>> {
    try {
      const data = await getThirdPartyTransaction(prepayId);
      return {
        status: 200,
        data: data,
        message: "Payment status fetched succesfully",
      };
    } catch (e) {
      throw new ValidateError({}, e.message);
    }
  }
}
