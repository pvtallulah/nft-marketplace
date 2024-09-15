import { IDGResponse, IMedia } from "../interfaces";
import { fileValidation } from "../middlewares";
import { uploadMedia } from "../services/media.service";
import {
  Controller,
  Post,
  UploadedFile,
  Route,
  Tags,
  UploadedFiles,
  Middlewares,
} from "tsoa";

@Route("media")
@Tags("Media")
export class MediaController extends Controller {
  @Post("uploadSingleMedia")
  @Middlewares(fileValidation("single"))
  public async uploadSingleMedia(
    @UploadedFile() file: Express.Multer.File
  ): Promise<IDGResponse<IMedia>> {
    try {
      return {
        status: 200,
        data: await uploadMedia(file),
        message: "",
      };
    } catch (error) {
      console.error(error); // Log the error to the console
      // Something went wrong, return an error response
      this.setStatus(500);
      return {
        status: 500,
        data: null,
        message: error.message,
      };
    }
  }

  // TODO: Queda deshabilitado porque no se porque el middleware aca no valida bien cuando son multiples archivos

  /*@Post("uploadMultipleMedia")
  @Middlewares(fileValidation("multiple"))
  public async uploadMultipleMedia(
    @UploadedFiles() files: Express.Multer.File[]
  ): Promise<any> {
    try {
      return await Promise.all(files.map((file) => uploadMedia(file)));
    } catch (error) {
      console.error(error); // Log the error to the console
      // Something went wrong, return an error response
      this.setStatus(500);
      return {
        status: "error",
        message: "An error occurred while uploading the files",
        errorMessage: error.message, // Optionally, return the error message in the response
      };
    }
  }*/
}
