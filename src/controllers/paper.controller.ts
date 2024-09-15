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

import { isAddress } from "../utils";

import { IDGResponse, IPaperPaymentLink } from "../interfaces";
import { createPaymentLink } from "../services/paper.service";

dotenv.config();

@Tags("Paper")
@Route("paper")
export class Paper extends Controller {
  @Get("/payment-link")
  public async getPaperPaymentLink(
    @Query() nftAddress: string,
    @Query() tokenId: string,
    @Query() resourceId: string,
    @Query() buyerAddress: string
  ): Promise<IDGResponse<IPaperPaymentLink>> {
    if (!nftAddress) {
      const fields: FieldErrors = {
        address: {
          message: "NftAddress its required",
          value: nftAddress,
        },
      };
      throw new ValidateError(fields, "Error generating payment link");
    }
    if (!tokenId) {
      const fields: FieldErrors = {
        tokenId: {
          message: "Token Id its required",
          value: tokenId,
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
      const link = await createPaymentLink(
        nftAddress,
        tokenId,
        resourceId,
        buyerAddress
      );
      return {
        status: 200,
        data: link,
        message: "Payment link generated succesfully",
      };
    } catch (e) {
      throw new ValidateError({}, e.message);
    }
  }
}
