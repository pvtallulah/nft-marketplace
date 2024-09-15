import { Controller, Route, Get, Tags } from "tsoa";
import * as wearablesService from "../services/wearables.service";
import { IDGResponse } from "../interfaces";

@Route("wearables")
@Tags("Wearables")
export class WearablesController extends Controller {
  @Get("/wearables")
  public async getSlot(): Promise<IDGResponse<Array<string>>> {
    try {
      const wearable = await wearablesService.getWearables();
      return {
        status: 200,
        data: wearable,
        message: "Wearable retrieved successfully",
      };
    } catch (e) {
      throw e;
    }
  }
}
