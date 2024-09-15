import { Request, Response, NextFunction } from "express";
import { FieldErrors, ValidateError } from "tsoa";

import { isTokeActive } from "../services/contract.service";
export const tokeActive = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { address: nftAddress, tokenId } = req.query as {
    address: string;
    tokenId: string;
  };
  if (!nftAddress) {
    const fields: FieldErrors = {
      resourceId: {
        message: "Resource Id its required",
        value: tokenId,
      },
    };
    throw new ValidateError(fields, "Error validating token");
  }
  if (!tokenId) {
    const fields: FieldErrors = {
      resourceId: {
        message: "Resource Id its required",
        value: tokenId,
      },
    };
    throw new ValidateError(fields, "Error validating token");
  }
  try {
    const isActive = await isTokeActive({ nftAddress, tokenId: tokenId });
    if (!isActive) {
      return res.status(400).json({
        status: 400,
        data: {
          message: "token is not active",
        },
      });
    }
    next();
  } catch (error) {
    return res.status(400).json({
      status: 400,
      data: {
        message: "There was an error trying to validate the token",
      },
    });
  }
};
