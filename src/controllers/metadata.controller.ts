import {
  Controller,
  Route,
  Post,
  Body,
  Tags,
  Get,
  Path,
  Middlewares,
  Header,
} from "tsoa";
import { saveMetadata, retrieveMetadata } from "../services/metadata.service";
import {
  CollectionTokenMetadata,
  CollectionMetadata,
  IDGResponse,
} from "../interfaces";
import { collectionAuthMiddleware, authenticateApiKey } from "../middlewares";

@Route("metadata")
@Tags("Metadata")
export class MetadataController extends Controller {
  @Post("/")
  @Middlewares([authenticateApiKey, collectionAuthMiddleware])
  public async saveMetadata(
    @Header("x-api-key") apiKey: string,
    @Body() requestBody: CollectionMetadata
  ): Promise<IDGResponse<string>> {
    try {
      const { contractAddress, tokens, metadata } = requestBody;

      // Validate the input here (if needed, service can also perform validations)

      await saveMetadata(contractAddress, tokens, metadata);

      return {
        status: 200,
        data: "ok",
        message: "Successfully saved metadata",
      };
    } catch (error) {
      return {
        status: 200,
        data: error,
        message: error,
      };
    }
  }

  @Get("{contractAddress}/{tokenId}")
  public async retrieveMetadata(
    @Path() contractAddress: string,
    @Path() tokenId: number
  ): Promise<any> {
    try {
      // Validate the input here (if needed, service can also perform validations)

      const metadata = await retrieveMetadata(contractAddress, tokenId);

      if (metadata) {
        return metadata;
      } else {
        // You can customize the error response here
        throw new Error("Metadata not found");
      }
    } catch (error) {
      // You can use a custom error format or throw as it is
      throw error;
    }
  }
}
