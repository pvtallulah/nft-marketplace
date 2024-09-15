import dotenv from "dotenv";
import axios, { AxiosResponse } from "axios";
import { Request, Response } from "express";
import { Webhook, ChargeResource, CreateCharge } from "coinbase-commerce-node";
import * as cbn from "coinbase-commerce-node";
import {
  getNftdata,
  getResourceIdByNftTokenId,
  validatePublishedNft,
} from "./marketplace.service";
import { getNftPrice } from "./coinmarketcap.service";
import * as thirdParyTransaction from "./thirdParyTransaction.service";
import { getBagPrice } from "./coinmarketcap.service";
import {
  ICoinbaseLink,
  ICoinmarketcapPrice,
  IFlattenResponse,
} from "../interfaces";
import { newError, newEvent, newErrorV2, newEventV2 } from "./discord.service";
import { getBackendWalletBalances } from "./contract.service";
dotenv.config();

const { COINBASE_API_KEY, COINBASE_WH_SECRET } = process.env;

const http = axios.create({
  baseURL: "https://api.commerce.coinbase.com/",
  headers: {
    "X-CC-Api-Key": COINBASE_API_KEY,
    "content-type": "application/json",
    "X-CC-Version": "2018-03-22",
  },
});

// export const createPaymentLink = async (
//   nftAddress: string,
//   tokenId: string,
//   resourceId: string,
//   buyerWallet: string,
//   currency: "USDC" | "USDT"
// ): Promise<ICoinbaseLink> => {
//   try {
//     newEvent(
//       `[Coinbase createPaymentLink]
//       nftAddress: ${nftAddress}
//       tokenId: ${tokenId}
//       resourceId: ${resourceId}
//       buyerWallet: ${buyerWallet}
//       currency: ${currency}`
//     );
//     const isValidNft = await validatePublishedNft({
//       nftAddress,
//       tokenId,
//       resourceId,
//     });
//     if (!isValidNft.isValid) {
//       newErrorV2({
//         title: "[Coinbase createPaymentLink] nft not available for sale",
//         description: `NFT its not on the contract anymore. maybe it was sold or removed?`,
//         nftAddress,
//         tokenId,
//         resourceId,
//       });
//       throw new Error(
//         `[Coinbase createPaymentLink] NFT its not on the contract anymore. maybe it was sold or removed?`
//       );
//     }
//     const nftData = await getNftdata({
//       nftAddress,
//       resourceId,
//       tokenId,
//     });
//     const { name, price, sellerAddress, description } = nftData;

//     const amount = await getNftPrice(price.toString());
//     const backendWalletBalances = await getBackendWalletBalances();
//     if (backendWalletBalances.status !== "success") {
//       newErrorV2({
//         title:
//           "[Coinbase createPaymentLink] unable to get backend wallet balances",
//         description: `unable to get backend wallet balances`,
//         nftAddress,
//         tokenId,
//         resourceId,
//       });
//       throw new Error(
//         `[Coinbase createPaymentLink] unable to get backend wallet balances`
//       );
//     }
//     if (+backendWalletBalances.maticBalance < 1) {
//       newErrorV2({
//         title: "[Coinbase createPaymentLink] Not enough MATIC",
//         description: `Not enough MATIC, needed: 1, available: ${backendWalletBalances.maticBalance}`,
//         nftAddress,
//         tokenId,
//         resourceId,
//       });
//       throw new Error(
//         `Not enough MATIC, needed: 1, available: ${backendWalletBalances.maticBalance}`
//       );
//     }

//     if (+price > +backendWalletBalances.bagBalance) {
//       newErrorV2({
//         title: "[Coinbase createPaymentLink] Not enough BAG",
//         description: `Not enough BAG, needed: ${price}, available: ${backendWalletBalances.bagBalance}`,
//         nftAddress,
//         tokenId,
//         resourceId,
//       });
//       throw new Error(
//         `Not enough BAG, needed: ${price}, available: ${backendWalletBalances.bagBalance}`
//       );
//     }

//     const body: CreateCharge = {
//       name,
//       description,
//       pricing_type: "fixed_price",
//       local_price: {
//         amount: (+amount * 1.05).toString(),
//         currency: "USD",
//       },
//       redirect_url: "https://dglive.org/marketplace",
//     };
//     const res: AxiosResponse<{ data: ICoinbaseLink }> = await http.post(
//       "/charges",
//       body
//     );
//     const conversionRate: ICoinmarketcapPrice = await getBagPrice();
//     const { data } = res;
//     const { data: cbData } = data;
//     if (res.status === 201 || res.status === 200) {
//       await thirdParyTransaction.saveThirdPartyTransaction({
//         paymentId: cbData.code.toString(),
//         amountFiat: cbData.pricing.local.amount,
//         amountIce: price.toString(),
//         conversionRate: conversionRate.data.quote.USD.price.toString(),
//         buyerWallet,
//         sellerAddress,
//         status: "paymentlink_created",
//         type: "coinbase",
//       });
//       return cbData;
//     } else throw new Error("Error generating payment link");
//   } catch (err) {
//     newError(`[Coinbase createPaymentLink]
//     Error: ${err}`);
//     if (err?.response?.data?.errorMessage)
//       throw new Error(err?.response?.data?.errorMessage);
//     throw err;
//   }
// };

export const createPaymentLink = async (
  nftAddress: string,
  tokenIds: string[],
  buyerWallet: string,
  email?: string
): Promise<ICoinbaseLink> => {
  let nftData: IFlattenResponse[] = [];
  try {
    newEventV2({
      title: "Coinbase createPaymentLink",
      description: `nftAddress: ${nftAddress}, tokenIds: ${tokenIds.join(
        ", "
      )}`,
      to: buyerWallet,
      extraData: JSON.stringify({ email }),
    });
    for (const tokenId of tokenIds) {
      const resourceId = await getResourceIdByNftTokenId({
        nftAddress,
        tokenId,
      });
      const isValidNft = await validatePublishedNft({
        nftAddress,
        tokenId,
        resourceId,
      });

      if (!isValidNft.isValid) {
        newErrorV2({
          title: "[Coinbase createPaymentLink] nft not available for sale",
          description: `NFT its not on the contract anymore. maybe it was sold or removed?`,
          nftAddress,
          tokenId,
        });
        throw new Error(
          `[Coinbase createPaymentLink] NFT its not on the contract anymore. maybe it was sold or removed?`
        );
      }
      const foundData = await getNftdata({
        nftAddress,
        resourceId,
        tokenId,
      });
      if (!foundData)
        throw new Error(
          `NFT not found on contract, ${nftAddress} - ${tokenId}`
        );
      else nftData.push(foundData);
    }

    const totalPrice = nftData.reduce((acc, curr) => {
      return acc + +curr.price;
    }, 0);

    const bagToUsd = (await getNftPrice(totalPrice.toString())) * 1.05;
    const conversionRate: ICoinmarketcapPrice = await getBagPrice();
    const { name, sellerAddress, description } = nftData[0];
    const backendWalletBalances = await getBackendWalletBalances();
    if (backendWalletBalances.status !== "success") {
      newErrorV2({
        title:
          "[Coinbase createPaymentLinkMultiple] unable to get backend wallet balances",
        description: `unable to get backend wallet balances`,
        nftAddress,
        tokenId: tokenIds.join(","),
      });
      throw new Error(
        `[Coinbase createPaymentLinkMultiple] unable to get backend wallet balances`
      );
    }
    if (+backendWalletBalances.maticBalance < 0.005) {
      newErrorV2({
        title: "[Coinbase createPaymentLinkMultiple] Not enough ETH",
        description: `Not enough ETH, needed: 0.005, available: ${backendWalletBalances.maticBalance}`,
        nftAddress,
        tokenId: tokenIds.join(","),
      });
      throw new Error(
        `Not enough ETH, needed: 0.005, available: ${backendWalletBalances.maticBalance}`
      );
    }

    if (+totalPrice > +backendWalletBalances.bagBalance) {
      newErrorV2({
        title: "[Coinbase createPaymentLink] Not enough BAG",
        description: `Not enough BAG, needed: ${totalPrice}, available: ${backendWalletBalances.bagBalance}`,
        nftAddress,
        tokenId: tokenIds.join(","),
      });
      throw new Error(
        `Not enough BAG, needed: ${totalPrice}, available: ${backendWalletBalances.bagBalance}`
      );
    }
    const body: CreateCharge = {
      name,
      description,
      pricing_type: "fixed_price",
      local_price: {
        amount: bagToUsd.toString(),
        currency: "USD",
      },
      redirect_url: "https://dglive.org/marketplace",
      metadata: {
        is_marketplace: "true",
      },
    };
    const res: AxiosResponse<{ data: ICoinbaseLink }> = await http.post(
      "/charges",
      body
    );
    const { data } = res;
    const { data: cbData } = data;
    if (res.status === 201 || res.status === 200) {
      await thirdParyTransaction.saveThirdPartyTransaction({
        paymentId: cbData.code.toString(),
        totalPriceFiat: cbData.pricing.local.amount,
        totalPriceBag: totalPrice.toString(),
        conversionRate: conversionRate.data.quote.USD.price.toString(),
        nftData,
        buyerWallet,
        sellerAddress,
        status: "paymentlink_created",
        type: "coinbase",
        email,
      });
      return cbData;
    } else throw new Error("Error generating payment link");
  } catch (err) {
    newError(`[Coinbase createPaymentLink]
    Error: ${err}`);
    if (err?.response?.data?.errorMessage)
      throw new Error(err?.response?.data?.errorMessage);
    throw err;
  }
};

export const coinbaseWebhook = async (req: Request, res: Response) => {
  res.status(200).json({
    status: 200,
    data: {
      message: "Webhook received",
    },
  });
  const endpointSecret = COINBASE_WH_SECRET;
  try {
    const _sig = req.headers["x-cc-webhook-signature"];
    const body = req.body;

    const sig = typeof _sig === "string" ? _sig : _sig[0];
    const cbEvent: cbn.resources.Event = Webhook.verifyEventBody(
      body,
      sig,
      endpointSecret
    );
    const cbData: ChargeResource = cbEvent.data as ChargeResource;
    if (cbData.metadata?.is_ecommerce === "true") return;
    if (!cbEvent) throw new Error("Invalid signature");

    const { type } = cbEvent;
    const eventData = cbEvent.data as ChargeResource;
    switch (type) {
      case "charge:created":
        await thirdParyTransaction.updateThirdPartyTransaction({
          paymentId: eventData.code,
          status: "pending",
        });
        break;

      case "charge:pending":
        await thirdParyTransaction.updateThirdPartyTransaction({
          paymentId: eventData.code,
          status: "paid",
        });
        break;
      case "charge:failed":
        await thirdParyTransaction.updateThirdPartyTransaction({
          paymentId: eventData.code,
          status: "failed",
        });
        break;
      default:
        console.log(`Unhandled event type ${type}`);
    }
    newEvent(
      `[Coinbase coinbaseWebhook]
        paymentId:${eventData.code}
        status:${type}`
    );
  } catch (err) {
    res.status(400).json({
      error: err.message,
    });
    newError(`[Coinbase coinbaseWebhook]
      Error:${err}`);
    console.log(err.message);
  }
};
