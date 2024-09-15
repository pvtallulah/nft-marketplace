import { Controller, Route, Post, Body, Tags } from "tsoa";
import * as authService from "../services/auth.service";
import { FieldErrors, ValidateError } from "tsoa";
import { IDGResponse } from "../interfaces";
import { isAddress } from "../utils";
@Route("authenticate")
@Tags("Authentication")
export class AuthenticationController extends Controller {
  @Post("/")
  public async authenticate(
    @Body() requestBody: { signature: string; message: string; address: string }
  ): Promise<IDGResponse<string>> {
    try {
      const { signature, message, address } = requestBody;
      if (!signature || typeof signature !== "string") {
        this.setStatus(400);
        throw new Error("Invalid signature format");
      }

      if (!message || typeof message !== "string") {
        this.setStatus(400);
        throw new Error("Invalid message format");
      }

      if (!address || !isAddress(address)) {
        this.setStatus(400);
        throw new Error("Invalid address format");
      }

      const isValidSignature = await authService.verifySignature(
        signature,
        message,
        address
      );

      if (!isValidSignature) {
        const fields: FieldErrors = {
          signature: {
            message: "Invalid signature",
            value: signature,
          },
        };
        throw new ValidateError(fields, "Error with signature validation");
      }

      const userEntity = await authService.generateAndStoreApiKey(address);

      return {
        status: 200,
        data: userEntity.apiKey,
        message: "Successfully generated api key",
      };
    } catch (e) {
      throw e;
    }
  }
}
