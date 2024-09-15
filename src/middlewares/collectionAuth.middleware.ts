import { Request, Response, NextFunction } from "express";
import fetch from "node-fetch";
import { authenticateApiKey } from "./auth.middleware";

export const collectionAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If the user is authenticated, proceed to check authorization
  const userAddress = req.userAddress; // This is set by the auth.middleware
  const contractAddress = req.body.contractAddress || req.query.contractAddress; // assuming contractAddress is in the request body

  if (!userAddress || !contractAddress) {
    return res
      .status(400)
      .json({ message: "Missing user address or contract address" });
  }

  const subgraph = process.env.SUBGRAPH_ENDPOINT.concat("/").concat(
    process.env.SUBGRAPH_VERSION
  );

  const query = `
      {
        nftaddressOwners(
          where: {nftAddress: "${contractAddress}"}
        ) {
          owner {
            id
          }
        }
      }
    `;

  const response = await fetch(subgraph, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  const authorizedAddresses =
    data?.data?.nftaddressOwners?.map((entry: any) => entry.owner.id) || [];

  if (authorizedAddresses.includes(userAddress.toLowerCase())) {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "User not authorized for this collection" });
  }
};
