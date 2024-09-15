import { Controller, Route, Post, Body, Tags, Get, Query } from "tsoa";
import * as activityService from "../services/activity.service";
import { FieldErrors, ValidateError } from "tsoa";
import { IDGResponse, WalletActivityResponse } from "../interfaces";
import { isAddress } from "../utils";
@Route("activity")
@Tags("Activity")
export class ActivityController extends Controller {
  @Get("/")
  public async activity(
    @Query() address: string,
    @Query() skip?: string,
    @Query() take?: string
  ): Promise<IDGResponse<WalletActivityResponse>> {
    try {
      if (!address || !isAddress(address)) {
        this.setStatus(400);
        throw new Error("Invalid address format");
      }

      const { walletActivity, total } = await activityService.walletActivity(
        address,
        skip,
        take
      );

      return {
        status: 200,
        data: { walletActivity, total },
        message: "Activity retrieved successfully",
      };
    } catch (e) {
      throw e;
    }
  }
}
