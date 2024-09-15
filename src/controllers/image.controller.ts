import { Controller, Post, Route, ValidateError, Tags, Body } from "tsoa";

import * as imageService from "../services/image.service";
import { notifyToDashboardSlotData } from "../services/dashboard.service";
import {
  IDGResponse,
  IImagesDimensionsRequest,
  IImagesDimensionsResponse,
} from "../interfaces";

@Route("image")
@Tags("Image")
export class ImageController extends Controller {
  @Post("dimensions/")
  public async getImagesDimensions(
    @Body() requestBody: IImagesDimensionsRequest
  ): Promise<IDGResponse<IImagesDimensionsResponse>> {
    try {
      const imagesDimensions = await imageService.getImagesDimensions(
        requestBody
      );
      return {
        status: 200,
        data: imagesDimensions,
        message: "Succesfully fetched images dimensions",
      };
    } catch (e) {
      throw new ValidateError({}, e.message);
    }
  }
}
