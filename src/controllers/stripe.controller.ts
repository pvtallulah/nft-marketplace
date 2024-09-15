import dotenv from "dotenv";
import {
  Controller,
  Route,
  Get,
  Tags,
  Query,
  FieldErrors,
  ValidateError,
  Middlewares,
} from "tsoa";

import { IDGResponse } from "../interfaces";
import * as stripeService from "../services/stripe.service";
import * as coinmarketcapService from "../services/coinmarketcap.service";
import { tokeActive } from "../middlewares/contract.middleware";
import { isAddress } from "../utils";

dotenv.config();
@Route("stripe")
@Tags("Stripe")
export class Stripe extends Controller {
  @Middlewares(tokeActive)
  @Get("/payment-link")
  public async getSellerNfts(
    @Query() address: string,
    @Query() tokenId: string,
    @Query() resourceId: string,
    @Query() buyerAddress: string
  ): Promise<IDGResponse<string>> {
    if (!address) {
      const fields: FieldErrors = {
        address: {
          message: "Nft address its required",
          value: address,
        },
      };
      throw new ValidateError(fields, "Error generating payment link");
    }
    if (!tokenId) {
      const fields: FieldErrors = {
        tokenId: {
          message: "Token Id its required",
          value: address,
        },
      };
      throw new ValidateError(fields, "Error generating payment link");
    }
    if (!resourceId) {
      const fields: FieldErrors = {
        resourceId: {
          message: "Resource Id its required",
          value: resourceId,
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
      const paymentUrl = await stripeService.createPaymentLink(
        address,
        tokenId,
        resourceId,
        buyerAddress
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
  @Get("/ice-price")
  public async getBagPrice() {
    try {
      return await coinmarketcapService.getBagPrice();
    } catch (e) {
      throw new ValidateError({}, e.message);
    }
  }
}
