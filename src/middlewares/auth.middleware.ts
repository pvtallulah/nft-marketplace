// auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import { ValidateError } from "tsoa";
import { getApiKeyByValue } from "../services/auth.service";

declare global {
  namespace Express {
    interface Request {
      userAddress?: string;
    }
  }
}

export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKeyValue = req.headers["x-api-key"] as string;

  if (!apiKeyValue) {
    return res.status(401).json({ message: "API key is required" });
  }

  try {
    const userEntity = await getApiKeyByValue(apiKeyValue);

    if (!userEntity) {
      return res.status(401).json({ message: "Invalid API key" });
    }

    const currentDate = new Date();
    const expirationDate = new Date(userEntity.apiExpiration);

    if (expirationDate < currentDate) {
      return res.status(401).json({ message: "API key has expired" });
    }

    // Attach the user's address to the request object
    req.userAddress = userEntity.address;

    next();
  } catch (error) {
    return res.status(400).json({
      status: 400,
      data: {
        message: "There was an error trying to validate the API key",
      },
    });
  }
};
