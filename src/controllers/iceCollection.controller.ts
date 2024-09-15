import { Controller, Route, Post, Delete, Body, Tags } from "tsoa";
import * as iceCollectionService from "../services/iceCollection.service";
import { IDGResponse, IAddressParams } from "../interfaces";
import { NftAddress } from "../db/entity";
import { isValidAddressRequest } from "../utils";
@Route("ice-collection")
@Tags("ICE Collection")
export class iceCollection extends Controller {
  @Post("/")
  public async addIceCollection(
    @Body() requestBody: IAddressParams
  ): Promise<IDGResponse<NftAddress>> {
    try {
      const { address, dgToken } = requestBody;
      isValidAddressRequest(address, dgToken);
      const iceCollection = await iceCollectionService.addIceCollection(
        address
      );
      return {
        status: 200,
        data: iceCollection,
        message: "BAG Collection upserted successfully",
      };
    } catch (e) {
      throw e;
    }
  }

  @Delete("/")
  public async removeIceCollection(
    @Body() requestBody: IAddressParams
  ): Promise<IDGResponse<NftAddress>> {
    try {
      const { address, dgToken } = requestBody;
      isValidAddressRequest(address, dgToken);
      const iceCollection = await iceCollectionService.removeIceCollection(
        address
      );
      return {
        status: 200,
        data: iceCollection,
        message: "BAG Collection deleted successfully",
      };
    } catch (e) {
      throw e;
    }
  }
}
