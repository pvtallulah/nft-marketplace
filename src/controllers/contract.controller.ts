import dotenv from "dotenv";
import { Controller, Route, Get, Tags, ValidateError } from "tsoa";

import { IDGResponse } from "../interfaces";
import { getBackendWalletBalances } from "../services/contract.service";

dotenv.config();

@Tags("Backend Wallet")
@Route("backend-wallet")
export class BackendWallet extends Controller {
  @Get("/balance")
  public async getBalance(): Promise<
    IDGResponse<{
      bagBalance: string;
      maticBalance: string;
      status: string;
    }>
  > {
    try {
      const data = await getBackendWalletBalances();
      return {
        status: 200,
        data,
        message: "Balance of backend wallet",
      };
    } catch (e) {
      throw new ValidateError({}, e.message);
    }
  }
}
