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

import {
  IDGResponse,
  ICoinbaseLink,
  CoinbasePaymentStatusData,
} from "../interfaces";
import * as coinbaseService from "../services/coinbase.service";
import axios, { AxiosResponse } from "axios";
import { isAddress } from "../utils";
// import * as coinmarketcapService from "../services/coinmarketcap.service";

dotenv.config();

const { COINBASE_API_KEY } = process.env;
@Tags("Coinbase")
@Route("coinbase")
export class Coinbase extends Controller {
  @Get("/payment-link")
  // @Middlewares(tokeActive)
  public async getCoinbasePaymentLink(
    @Query() nftAddress: string,
    @Query() tokenIds: string[],
    @Query() buyerAddress: string,
    @Query() email?: string
  ): Promise<IDGResponse<ICoinbaseLink>> {
    if (!nftAddress) {
      const fields: FieldErrors = {
        address: {
          message: "Nft address its required",
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
      const data = await coinbaseService.createPaymentLink(
        nftAddress,
        tokenIds,
        buyerAddress,
        email
      );
      return {
        status: 200,
        data,
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
  // ): Promise<IDGResponse<ICoinbaseLink>> {
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
  //     const paymentUrl = await coinbaseService.createPaymentLinkMultiple(
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
  public async getPaymentStatus(
    @Query() code: string
  ): Promise<IDGResponse<CoinbasePaymentStatusData>> {
    try {
      if (!code) {
        const fields: FieldErrors = {
          tokenId: {
            message: "code is required",
            value: code,
          },
        };
        throw new ValidateError(fields, "Error generating payment status");
      }
      const config = {
        maxBodyLength: Infinity,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CC-Version": "2018-03-22",
          "X-CC-api-key": COINBASE_API_KEY || "",
        },
      };
      const res = await axios.get<AxiosResponse<CoinbasePaymentStatusData>>(
        `https://api.commerce.coinbase.com/charges/${code}`,
        config
      );
      return {
        status: 200,
        data: res.data.data,
        message: "Payment status",
      };
      // let data: CoinbasePaymentStatusRes = { status: "Awaiting payment" };
      // if (res.data.data.payments.length) {
      //   const payment = res.data.data.payments.pop();
      //   const paymentCompleted = res.data.data.payments.find(
      //     (p) => p.status === "CONFIRMED"
      //   );
      //   if (paymentCompleted) data.status = "Payment complete";
      //   else if (payment.status === "PENDING") data.status = "Awaiting payment";
      //   else data.status = "Processing payment";
      // }
      // return {
      //   status: 200,
      //   data,
      //   message: "Payment status",
      // };
    } catch (e) {
      throw new ValidateError({}, e.message);
    }
  }
}
