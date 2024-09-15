import {
  Controller,
  Route,
  Post,
  Body,
  Tags,
  ValidateError,
  FieldErrors,
} from "tsoa";
import { IDGResponse } from "../interfaces";
import * as nftService from "../services/nft.service";

@Route("nft-service")
@Tags("Nft Srvice")
export class NftServiceController extends Controller {
  @Post("/")
  public async getNftExtraData(
    @Body() requestBody: any
  ): Promise<IDGResponse<any>> {
    if (typeof requestBody !== "object") {
      const fields: FieldErrors = {
        sellerAddress: {
          message: "requestBody",
          value: requestBody,
        },
      };
      throw new ValidateError(fields, "Error getting nft extra data");
    }
    const nftExtraData = await nftService.getNftExtraData(requestBody);
    return nftExtraData;
  }
}
