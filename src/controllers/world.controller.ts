import {
  Controller,
  Post,
  Route,
  Path,
  ValidateError,
  Tags,
  Get,
  FieldErrors,
  Body,
} from "tsoa";

import * as webSocketService from "../services/webSocket.service";
import {
  notifyToDashboardSlotData,
  notifyToDashboardBannerData,
} from "../services/dashboard.service";
import {
  IDGResponse,
  IWSNotifyMarketplace,
  IJoystickSlotData,
  IJoystickBannerData,
  IWSNotifyDashboard,
} from "../interfaces";

@Route("world")
@Tags("World")
export class WorldController extends Controller {
  @Post("slot-joystick/{slotId}")
  public async updateSlotNftJoystickData(
    @Path() slotId: string,
    @Body() requestBody: IJoystickSlotData
  ): Promise<IDGResponse<any>> {
    try {
      if (!slotId) {
        const fields: FieldErrors = {
          sellerAddress: {
            message: "SlotId its required",
            value: slotId,
          },
        };
        throw new ValidateError(fields, "Error posting slot joystick data");
      }
      webSocketService.notifyToWorldJoystick({
        ...requestBody,
        slotId,
      });
      if (requestBody.save)
        notifyToDashboardSlotData({ payload: requestBody, slotId });
      return {
        status: 201,
        data: "",
        message: "Succesfully updated slot joystick data",
      };
    } catch (e) {
      throw new ValidateError({}, e.message);
    }
  }

  @Post("banner-joystick/{bannerId}")
  public async updateBannerJoystickData(
    @Path() bannerId: string,
    @Body() requestBody: IJoystickBannerData
  ): Promise<IDGResponse<any>> {
    try {
      if (!bannerId) {
        const fields: FieldErrors = {
          sellerAddress: {
            message: "BannerId its required",
            value: bannerId,
          },
        };
        throw new ValidateError(fields, "Error posting slot joystick data");
      }
      webSocketService.notifyToWorldJoystick({
        ...requestBody,
        bannerId,
      });
      let res: any = {};
      if (requestBody.save)
        res = await notifyToDashboardBannerData({
          payload: requestBody,
          bannerId,
        });
      return {
        status: 201,
        data: res,
        message: "Succesfully updated slot joystick data",
      };
    } catch (e) {
      throw new ValidateError({}, e.message);
    }
  }

  @Get("joystick-open/{zoneId}")
  public async joystickOpened(
    @Path() zoneId: string
  ): Promise<IDGResponse<any>> {
    try {
      if (!zoneId) {
        const fields: FieldErrors = {
          sellerAddress: {
            message: "ZoneId its required",
            value: zoneId,
          },
        };
        throw new ValidateError(fields, "Error notifying joystick opened");
      }
      const payload: IWSNotifyDashboard = {
        status: "success",
        type: "joystickOpened",
      };
      webSocketService.notifyToDashboardv2(payload);
      return {
        status: 201,
        data: "",
        message: "Succesfully notified joystick opened",
      };
    } catch (e) {
      throw new ValidateError({}, e.message);
    }
  }
}
