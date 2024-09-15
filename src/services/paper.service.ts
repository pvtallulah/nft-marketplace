import dotenv from "dotenv";
import { Request, Response } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import axios from "axios";
import { AppDataSource } from "../db/data-source";
import { PaperPaymentId } from "../db/entity";

import { newEventV2, newErrorV2 } from "./discord.service";
import { getTransactionDataParsed } from "./events.service";
import {
  getNftdata,
  toggleFreezeNft,
  getSellerAddress,
  getResourceId,
  validatePublishedNft,
} from "./marketplace.service";
import { convertTo } from "./coinmarketcap.service";

import { buildTxDataByType } from "../utils";
import { IPaperWebhook, IPaperPaymentLink } from "../interfaces";
dotenv.config();

const { PAPER_API_KEY, PAPER_CONTRACT_ID } = process.env;

export const createPaymentLink = async (
  nftAddress: string,
  tokenId: string,
  resourceId: string,
  buyerWallet: string,
  email?: string
): Promise<IPaperPaymentLink> => {
  try {
    const isValidNft = await validatePublishedNft({
      nftAddress,
      tokenId,
      resourceId,
    });
    if (!isValidNft.isValid) {
      newErrorV2({
        title: "[Paper createPaymentLink] nft not available for sale",
        description: `NFT its not on the contract anymore. maybe it was sold or removed?`,
        nftAddress,
        tokenId,
        resourceId,
      });
      throw new Error(
        `[Paper createPaymentLink] NFT its not on the contract anymore. maybe it was sold or removed?`
      );
    }

    const nftData = await getNftdata({
      nftAddress,
      resourceId,
      tokenId,
    });
    if (!nftData) {
      await newErrorV2({
        title: "Paper::createPaymentLink",
        description: `NFT not found`,
        nftAddress,
        tokenId,
        resourceId,
      });
      throw new Error("NFT not found");
    }
    const {
      name,
      price: icePrice,
      sellerAddress,
      description,
      imageUrl,
    } = nftData || {};
    // const iceAmount = utils.formatUnits(nftPriceBig, 18);
    const priceData = await convertTo(13133, "USDC", icePrice.toString());
    const price = (+priceData.data.quote["USDC"].price * 1.05).toFixed(2);
    const paperPaymentIdRepository =
      AppDataSource.getRepository(PaperPaymentId);
    let paymentId: number;
    const paperPaymentId = await paperPaymentIdRepository.findOne({
      where: { id: 1 },
    });
    if (!paperPaymentId) {
      const _paperPaymentId = new PaperPaymentId();
      _paperPaymentId.id = 1;
      _paperPaymentId.number = 1;
      paymentId = 1;
      await paperPaymentIdRepository.save(_paperPaymentId);
    } else {
      paymentId = paperPaymentId.number += 1;
    }
    const data = {
      metadata: {
        paymentId,
      },
      imageUrl,
      expiresInMinutes: 15,
      usePaperKey: true,
      hideNativeMint: false,
      hidePaperWallet: false,
      hideExternalWallet: false,
      hidePayWithCard: false,
      hideApplePayGooglePay: false,
      hidePayWithCrypto: false,
      sendEmailOnTransferSucceeded: true,
      limitPerTransaction: 5,
      redirectAfterPayment: false,
      contractId: PAPER_CONTRACT_ID,
      title: name,
      walletAddress: buyerWallet,
      email,
      quantity: 1,
      mintMethod: {
        name: "paperCallback",
        args: {
          paymentId,
          _transferTo: "$WALLET",
          _nftAddress: nftAddress,
          tokenId,
          _nonce: "$NONCE",
          _signature: "$SIGNATURE",
        },
        payment: { value: `${price} * $QUANTITY`, currency: "USDC" },
      },
      feeBearer: "BUYER",
      description,
      successCallbackUrl: "https://dglive.org/marketplace",
      cancelCallbackUrl: "https://dglive.org/marketplace",
    };
    try {
      const res = await axios.post(
        "https://paper.xyz/api/2022-08-12/checkout-link-intent",
        data,
        {
          headers: {
            "content-type": "application/json",
            accept: "application/json",
            Authorization: `Bearer ${PAPER_API_KEY}`,
          },
        }
      );
      if (paperPaymentId) {
        await paperPaymentIdRepository.save(paperPaymentId);
      }
      // await thirdParyTransaction.saveThirdPartyTransaction({
      //   paymentId: paymentId.toString(),
      //   totalPriceFiat: `${price} MATIC`,
      //   totalPriceBag: icePrice.toString(),
      //   conversionRate: "0",
      //   nftAddress,
      //   tokenId,
      //   resourceId,
      //   buyerWallet,
      //   sellerAddress,
      //   status: "paymentlink_created",
      //   type: "paper",
      // });
      newEventV2({
        title: "Paper-createPaymentLink",
        description: `Payment link created successfully, paymentId: ${paymentId}`,
        nftAddress,
        tokenId,
        resourceId,
        to: buyerWallet,
      });
      return res.data.checkoutLinkIntentUrl;
    } catch (error) {
      console.error("paper::createPaymentLink::error ", error);
    }
  } catch (error) {
    if (error?.response?.data?.errorMessage)
      throw new Error(error?.response?.data?.errorMessage);
    throw error;
  }
};

export const paperWebhook = async (req: Request, res: Response) => {
  try {
    const _sig = req.headers["x-paper-signature"];
    const body = req.body.toString();
    const hash = createHmac("sha256", PAPER_API_KEY).update(body).digest("hex");
    const signature = typeof _sig === "string" ? _sig : _sig[0];
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(hash))) {
      return res.status(403).json({
        status: 403,
        data: {
          message: "Wrong signature",
        },
      });
    } else {
      const payload: IPaperWebhook = JSON.parse(body);
      const { event, result } = payload;
      result.claimedTokens.transactionHashes;
      let data: {
        paymentId: string;
        to: string;
        nftAddress: string;
        tokenId: string;
      } | null = null;
      for (const key in result.claimedTokens.transactionHashes) {
        const transactionData = await getTransactionDataParsed(key);
        data = buildTxDataByType({
          type: transactionData.name,
          args: transactionData.args,
        });
      }
      const { nftAddress, tokenId, to, paymentId } = data;
      switch (event) {
        case "payment:succeeded":
          newEventV2({
            title: "Paper payment:succeeded",
            description: `Payment succeeded with paymentId: ${paymentId}. Freeze NFT`,
            nftAddress,
            tokenId,
            to,
          });
          await toggleFreezeNft({
            nftAddress,
            tokenId,
            freeze: true,
          });
          const _sellerAddress = await getSellerAddress({
            nftAddress,
            tokenId,
          });
          // const wssNextNft = await nextNft({
          //   tokenId,
          //   nftAddress,
          //   sellerAddress: _sellerAddress,
          // });
          // notifyToMarketplace({
          //   status: "success",
          //   type: "buy",
          //   wssNextNft,
          // });
          break;
        case "transfer:failed":
          newEventV2({
            title: "Paper transfer:failed",
            description: `Nft transfer failed for paymentId: ${paymentId}. Unfreeze NFT`,
            nftAddress: data.nftAddress,
            tokenId: data.tokenId,
            to: data.to,
          });
          const resourceId = await getResourceId({ nftAddress, tokenId });
          const marketListing = await toggleFreezeNft({
            nftAddress: data.nftAddress,
            tokenId: data.tokenId,
            freeze: false,
          });
          // Checkme
          // notifyToMarketplace({
          //   status: "success",
          //   type: "sell",
          //   wssNextNft: {
          //     previousNft: {
          //       nftAddress: marketListing.nft,
          //       tokenId: marketListing.token,
          //       resourceId,
          //     },
          //   },
          // });
          break;
      }
      return res.status(200).json({
        status: 200,
        data: {
          message: "Webhook received",
        },
      });
    }
  } catch (error) {
    console.error("paperWebhook::Webhook::error ", error);
    throw new Error("paperWebhook: Webhook error");
  }
};
