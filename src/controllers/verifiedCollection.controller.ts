import { Controller, Route, Post, Delete, Body, Tags } from "tsoa";
import * as verifiedCollectionService from "../services/verifiedCollection.service";
import { NftAddress } from "../db/entity";
import { IDGResponse, IAddressParams } from "../interfaces";
import { isValidAddressRequest } from "../utils";

@Route("verified-collection")
@Tags("Verified Collection")
export class VerifiedCollectionController extends Controller {
  @Post("/")
  public async addVerifiedCollection(
    @Body() requestBody: IAddressParams
  ): Promise<IDGResponse<NftAddress>> {
    try {
      const { address, dgToken } = requestBody;
      isValidAddressRequest(address, dgToken);
      const verifiedCollection =
        await verifiedCollectionService.addVerifiedCollection(address);
      return {
        status: 200,
        data: verifiedCollection,
        message: "Verified collection upserted successfully",
      };
    } catch (e) {
      throw e;
    }
  }

  @Delete("/")
  public async removeVerifiedCollection(
    @Body() requestBody: IAddressParams
  ): Promise<IDGResponse<NftAddress>> {
    try {
      const { address, dgToken } = requestBody;
      isValidAddressRequest(address, dgToken);
      const verifiedCollection =
        await verifiedCollectionService.removeVerifiedCollection(address);
      return {
        status: 200,
        data: verifiedCollection,
        message: "Verified collection deleted successfully",
      };
    } catch (e) {
      throw e;
    }
  }
}
