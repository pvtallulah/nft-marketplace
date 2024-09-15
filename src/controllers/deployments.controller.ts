import dotenv from "dotenv";
import { Controller, Route, Get, Tags, ValidateError } from "tsoa";

import { IDGResponse } from "../interfaces";
import { getDeploymentsStatus } from "../services/deployments.service";

dotenv.config();

@Tags("Deployments")
@Route("deployments")
export class Deployments extends Controller {
  @Get("/")
  public async getDeployments(): Promise<
    IDGResponse<{
      bagBalance: string;
      maticBalance: string;
      status: string;
    }>
  > {
    try {
      const data = await getDeploymentsStatus();
      return {
        status: 200,
        data,
        message: "Asd",
      };
    } catch (e) {
      throw new ValidateError({}, e.message);
    }
  }
}
