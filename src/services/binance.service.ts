import dotenv from "dotenv";
import axios, { AxiosResponse } from "axios";
import { Request, Response } from "express";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

import {
  getNftdata,
  getResourceIdByNftTokenId,
  validatePublishedNft,
} from "./marketplace.service";
import { getNftPrice } from "./coinmarketcap.service";
import * as thirdParyTransaction from "./thirdParyTransaction.service";
import { getBagPrice } from "./coinmarketcap.service";
import {
  IBinanceLink,
  IBinanceQueryOrder,
  IBinanceRefundResponse,
  IFlattenResponse,
  IWebSocketEvent,
} from "../interfaces";
import { hashSignature, randomString } from "../utils";
import { newError, newEvent, newErrorV2, newEventV2 } from "./discord.service";
import { getBackendWalletBalances } from "./contract.service";
import { wsNotifyBlockchainEvents } from "./webSocket.service";
dotenv.config();

const { BINANCE_API_KEY, BINANCE_API_SECRET } = process.env;
const BINANCE_API_URL = "https://bpay.binanceapi.com";
const http = axios.create({
  baseURL: BINANCE_API_URL,
});

export const refundOrder = async (
  prepayId: string
): Promise<IBinanceRefundResponse> => {
  let orderToRefund: IBinanceQueryOrder;
  const refundRequestId = uuidv4();
  try {
    orderToRefund = await orderStatus({ prepayId });
    if (orderToRefund.data.status !== "PAID") {
      newErrorV2({
        title: "[Binance refundOrder] Order not paid",
        description: `Order not paid, status: ${orderToRefund.data.status}`,
        extraData: JSON.stringify({ prepayId }),
      });
      throw new Error("Order not paid");
    }
  } catch (error) {
    newErrorV2({
      title: "[Binance refundOrder] Error",
      description: error.message || error,
      extraData: JSON.stringify({ prepayId }),
    });
    throw error;
  }

  const timestamp = Date.now();
  const nonce = randomString();
  const payload = JSON.stringify({
    refundRequestId,
    prepayId,
    refundAmount: orderToRefund.data.orderAmount,
    refundReason: "Refund, order not completed",
  });

  const signature = hashSignature(
    `${timestamp}\n${nonce}\n${payload}\n`,
    BINANCE_API_SECRET
  ).toUpperCase();
  const headers = {
    "Content-Type": "application/json",
    "BinancePay-Timestamp": timestamp,
    "BinancePay-Nonce": nonce,
    "BinancePay-Certificate-SN": BINANCE_API_KEY,
    "BinancePay-Signature": signature,
  };

  try {
    const { data: response }: AxiosResponse<IBinanceRefundResponse> =
      await http.post("/binancepay/openapi/order/refund", payload, { headers });
    if (response.status === "SUCCESS") {
      await thirdParyTransaction.updateThirdPartyTransactionRefund({
        paymentId: prepayId,
        uuid: refundRequestId,
      });
      return response;
    } else {
      newErrorV2({
        title: "[Binance refundOrder] Error",
        description: 'Error refunding order, status: "FAILED"',
        extraData: JSON.stringify({ prepayId }),
      });
    }
  } catch (error) {
    console.error("Refund error:", error);
    throw error;
  }
};

export const orderStatus = async ({
  merchantTradeNo,
  prepayId,
}: {
  merchantTradeNo?: string;
  prepayId?: string;
}): Promise<IBinanceQueryOrder> => {
  const timestamp = Date.now();
  const nonce = randomString();
  let payload = {};
  if (prepayId) {
    payload["prepayId"] = prepayId;
  } else if (merchantTradeNo) {
    payload["merchantTradeNo"] = merchantTradeNo;
  } else throw new Error("No merchantTradeNo or prepaidId provided");
  const payloadToSign =
    timestamp + "\n" + nonce + "\n" + JSON.stringify({ ...payload }) + "\n";
  const signature = hashSignature(
    payloadToSign,
    BINANCE_API_SECRET
  ).toUpperCase();
  const headers = {
    "Content-Type": "application/json",
    "BinancePay-Timestamp": timestamp,
    "BinancePay-Nonce": nonce,
    "BinancePay-Certificate-SN": BINANCE_API_KEY,
    "BinancePay-Signature": signature,
  };
  try {
    const { data: binanceLinkRes }: AxiosResponse<IBinanceQueryOrder> =
      await http.post(
        "/binancepay/openapi/v2/order/query",
        { ...payload },
        {
          headers,
        }
      );
    return binanceLinkRes;
  } catch (error) {
    newErrorV2({
      title: "[Binance orderStatus] Error",
      description: error.message || error,
      extraData: JSON.stringify({ prepayId, merchantTradeNo }),
    });
    console.log(error);
  }
};

export const queryOrder = async (merchantTradeNo: string): Promise<any> => {
  const timestamp = new Date().getTime();
  const nonce = randomString();
  const payloadToSign =
    timestamp +
    "\n" +
    nonce +
    "\n" +
    JSON.stringify({ merchantTradeNo }) +
    "\n";
  const signature = hashSignature(
    payloadToSign,
    BINANCE_API_SECRET
  ).toUpperCase();
  const headers = {
    "Content-Type": "application/json",
    "BinancePay-Timestamp": timestamp,
    "BinancePay-Nonce": nonce,
    "BinancePay-Certificate-SN": BINANCE_API_KEY,
    "BinancePay-Signature": signature,
  };
  let errorData: IBinanceQueryOrder;
  try {
    const { data: binanceLinkRes }: AxiosResponse<IBinanceQueryOrder> =
      await http.post(
        "/binancepay/openapi/v2/order/query",
        { merchantTradeNo },
        {
          headers,
        }
      );
    await thirdParyTransaction.updateThirdPartyTransaction({
      paymentId: binanceLinkRes.data.prepayId,
      status: binanceLinkRes.data.status === "PAID" ? "paid" : "failed",
    });
    newEvent(
      `[Binance]::queryOrder::paymentId:${
        binanceLinkRes.data.prepayId
      }::status:${binanceLinkRes.data.status === "PAID" ? "paid" : "failed"}`
    );
    return binanceLinkRes;
  } catch (error) {
    const wsEvent: IWebSocketEvent = {
      status: "failed",
      type: "buy",
    };
    if (errorData) {
      wsEvent.message = JSON.stringify(errorData);
    }
    wsEvent.error = error;
    wsNotifyBlockchainEvents(wsEvent);
    newError(`[Binance queryOrder]
    Error: ${JSON.stringify(errorData)}`);
    console.log(error);
  }
};

export const createPaymentLink = async (
  nftAddress: string,
  tokenIds: string[],
  buyerWallet: string,
  email?: string
): Promise<IBinanceLink> => {
  try {
    let nftData: IFlattenResponse[] = [];

    newEventV2({
      title: "[Binance createPaymentLinkMultiple] multiple",
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
          title: "[Binance createPaymentLink] nft not available for sale",
          description: `NFT its not on the contract anymore. maybe it was sold or removed?`,
          nftAddress,
          tokenId,
        });
        throw new Error(
          `[Binance createPaymentLink] NFT its not on the contract anymore. maybe it was sold or removed?`
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
    const timestamp = new Date().getTime();
    const nonce = randomString();

    const totalPrice = nftData.reduce((acc, curr) => {
      return acc + +curr.price;
    }, 0);
    const bagToUsd = (await getNftPrice(totalPrice.toString())) * 1.05;
    const conversionRate: any = await getBagPrice();
    const { sellerAddress } = nftData[0];
    const backendWalletBalances = await getBackendWalletBalances();
    if (backendWalletBalances.status !== "success") {
      newErrorV2({
        title:
          "[Binance createPaymentLink] unable to get backend wallet balances",
        description: `unable to get backend wallet balances`,
        nftAddress,
        tokenId: tokenIds.join(","),
      });
      throw new Error(
        `[Binance createPaymentLink] unable to get backend wallet balances`
      );
    }
    if (+backendWalletBalances.maticBalance < 0.005) {
      newErrorV2({
        title: "[Binance createPaymentLink] Not enough ETH",
        description: `Not enough ETH, needed: 0.005, available: ${backendWalletBalances.maticBalance}`,
        nftAddress,
        tokenId: tokenIds.join(","),
      });
      throw new Error(
        `Not enough ETH, needed: 1, available: ${backendWalletBalances.maticBalance}`
      );
    }

    if (+totalPrice > +backendWalletBalances.bagBalance) {
      newErrorV2({
        title: "[Binance createPaymentLink] Not enough BAG",
        description: `Not enough BAG, needed: ${totalPrice}, available: ${backendWalletBalances.bagBalance}`,
        nftAddress,
        tokenId: tokenIds.join(","),
      });
      throw new Error(
        `Not enough BAG, needed: ${totalPrice}, available: ${backendWalletBalances.bagBalance}`
      );
    }

    const formattedPrice = Number(bagToUsd).toFixed(0);
    const formattedPrice2 = Number(bagToUsd).toFixed(2);
    const merchantTradeNo = new Date().getTime().toString();

    const body = {
      env: {
        terminalType: "APP",
      },
      merchantTradeNo,
      orderAmount: formattedPrice2,
      currency: "USDT",
      description: "Onlybags - Marketplace",
      goodsDetails: nftData.map((nft) => ({
        goodsType: "02",
        goodsCategory: "Z000",
        referenceGoodsId: `${nft.nftAddress}-${nft.tokenId}`,
        goodsName: nft.name,
        goodsDetail: nft.description,
      })),
    };

    const payload =
      timestamp + "\n" + nonce + "\n" + JSON.stringify(body) + "\n";
    const signature = hashSignature(payload, BINANCE_API_SECRET).toUpperCase();
    const headers = {
      "Content-Type": "application/json",
      "BinancePay-Timestamp": timestamp,
      "BinancePay-Nonce": nonce,
      "BinancePay-Certificate-SN": BINANCE_API_KEY,
      "BinancePay-Signature": signature,
    };
    const binanceLinkRes: any = await http.post(
      "/binancepay/openapi/v3/order",
      body,
      {
        headers,
      }
    );
    if (binanceLinkRes.data.status === "SUCCESS") {
      const res: IBinanceLink = binanceLinkRes.data.data;
      await thirdParyTransaction.saveThirdPartyTransaction({
        paymentId: res.prepayId.toString(),
        totalPriceFiat: formattedPrice,
        totalPriceBag: totalPrice.toString(),
        conversionRate: conversionRate.data.quote.USD.price.toString(),
        nftData,
        buyerWallet,
        sellerAddress,
        status: "paymentlink_created",
        type: "binance",
        email,
      });
      return res;
    } else throw new Error("Error generating payment link");
  } catch (error) {
    let errMsg = error;
    if (error.message) errMsg += `\n Error Message: ${error.message}`;
    if (error?.response?.data?.errorMessag)
      errMsg += `\n Response Error Message: ${error.response.data.errorMessage}`;
    newErrorV2({
      title: "Binance createPaymentLink",
      description: errMsg,
    });
    if (error?.response?.data?.errorMessage)
      throw new Error(error?.response?.data?.errorMessage);
    throw error;
  }
};

// const publicKey = `-----BEGIN PUBLIC KEY-----\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAwuF7PgDsNBuJVZ6HeVoH\nT2Tqj22+eWLQ/kZbYj3CTgdvedFymj0Kqvxtwy3InVbU6t6g5UkjL+dMOAkt5GxL\nNYI1uNy9g3+mifCDRXDArwvcKkB5jYu0R3WTNtf1ODicjpOf1NUqMZ+0t3jNwVAy\nawvxlyxpX8gMa6OAMbzMtH3iskM52nu5mS57Xh4ryibwjIxd0ssb63gD2qH8jy60\nAK/qgkijlysgEQDzYTk6X2x4t9BfVoOL3+yxkIiwnfL/KY9xkvSmWuAFIZqu4pY7\ng+GXFiG50sSCe2BkBcSzIS56L1Qp/tSzDUl1+fQCGhA3BFY42/zTpvdjLLUgbRYZ\npJCu9Z4w0HsM118rKCxBZNveoc12oHXEbDMDy7y/c39KYNyniCH6iKPNzu6Zi8tb\nXXN7KG9mUHUzstnafVd5QpqIumQUgE+JVTSrdx0YJy7OQeqeSoQeBeI7pr1gsRuH\nx0pcniYOIRwmtZ27Ybkbk0zOu1vBmzE8hC8RAkE8Yz06T7quoa547FicUYQBvtkR\nYLJDbSIjFLkfTFNOgV5VU92JfJvFji3F/nDVQ0gI6iuDktKYB0FNe1LZvKbDgPs+\nJ8/Pssd1DOW8XJbQXmJz8VCrubv/SdOYsy0lP0m/ZybEFjSVSWKT3xCpHVSDVJNm\nrTUypediX9eeNMlfs0x/vmkCAwEAAQ==-----END PUBLIC KEY-----`;

export const binanceWebhook = async (req: Request, res: Response) => {
  try {
    res.status(200).json({ returnCode: "SUCCESS", returnMessage: null });
    const body = JSON.parse(req.body);
    const data = JSON.parse(JSON.parse(req.body).data);
    const { merchantTradeNo } = data;

    try {
      const headers = req.headers;
      const timestamp = headers["binancepay-timestamp"] as string;
      const nonce = headers["binancepay-nonce"] as string;
      const signature = headers["binancepay-signature"] as string;
      const certificateSN = headers["binancepay-certificate-sn"] as string;
      console.log("====================================");
      console.log("certificateSN", certificateSN);
      console.log("====================================");

      const payload = `${timestamp}\n${nonce}\n${JSON.stringify(body)}\n`;
      const decodedSignature = Buffer.from(signature, "base64");
      let pubKey = "";
      let pubKey2 = "";
      try {
        pubKey = await fetchPublicKey();
      } catch (error) {
        console.log(error);
      }
      try {
        pubKey2 = await fetchPublicKeyNew({
          nonce,
          timestamp,
          body,
        });
      } catch (error) {
        console.log(error);
      }
      try {
        const isValid = verifySignature(payload, decodedSignature, pubKey);
        console.log("====================================");
        console.log(isValid);
        console.log("====================================");
      } catch (error) {
        console.log(error);
      }

      try {
        const isValid2 = verifySignature2(payload, signature, pubKey);
        console.log("====================================");
        console.log(isValid2);
        console.log("====================================");
      } catch (error) {
        console.log(error);
      }
      try {
        if (body.bizIdStr) {
          body.bizId = body.bizIdStr;
        }
        const payload: string = `${timestamp}\n${nonce}\n${JSON.stringify(
          body
        )}\n`.replace(/"bizId":"([^"]*)"/g, '"bizId":$1');
        const isValid3 = verifySignature2(payload, signature, pubKey);
        console.log("====================================");
        console.log(isValid3);
        console.log("====================================");
      } catch (error) {
        console.log(error);
      }
      if (pubKey2) {
        try {
          const isValid = verifySignature(payload, decodedSignature, pubKey2);
          console.log("====================================");
          console.log(isValid);
          console.log("====================================");
        } catch (error) {
          console.log(error);
        }

        try {
          const isValid2 = verifySignature2(payload, signature, pubKey2);
          console.log("====================================");
          console.log(isValid2);
          console.log("====================================");
        } catch (error) {
          console.log(error);
        }
        try {
          if (body.bizIdStr) {
            body.bizId = body.bizIdStr;
          }
          const payload: string = `${timestamp}\n${nonce}\n${JSON.stringify(
            body
          )}\n`.replace(/"bizId":"([^"]*)"/g, '"bizId":$1');
          const isValid3 = verifySignature2(payload, signature, pubKey2);
          console.log("====================================");
          console.log(isValid3);
          console.log("====================================");
        } catch (error) {
          console.log(error);
        }
      }
    } catch (error) {
      console.log(error);
    }

    if (body.bizType !== "PAY_REFUND") {
      await queryOrder(merchantTradeNo);
    }
  } catch (err) {
    console.error(`[Binance binanceWebhook] Error: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
};

const cache = {
  publicKey: null as string | null,
  fetchedAt: null as number | null,
  expiry: 24 * 60 * 60 * 1000,
};

async function fetchPublicKey() {
  try {
    const timestamp = Date.now().toString();
    const nonce = randomString();

    const payloadToSign =
      timestamp + "\n" + nonce + "\n" + JSON.stringify({}) + "\n";
    const signature = hashSignature(
      payloadToSign,
      BINANCE_API_SECRET
    ).toUpperCase();

    const res = await http.post(
      "/binancepay/openapi/certificates",
      JSON.stringify({}),
      {
        headers: {
          "Content-Type": "application/json",
          "BinancePay-Timestamp": timestamp,
          "BinancePay-Nonce": nonce,
          "BinancePay-Certificate-SN": BINANCE_API_KEY,
          "BinancePay-Signature": signature,
        },
      }
    );

    let pubKey = "";
    res.data.data.forEach((cert: any) => {
      console.log(`certSerial: ${cert.certSerial}`);
      pubKey = cert.certPublic;
      console.log(`certPublic: ${cert.certPublic}`);
    });

    return pubKey;
  } catch (err) {
    throw new Error(`Failed to fetch public key: ${err.message}`);
  }
}

async function fetchPublicKeyNew({
  nonce,
  timestamp,
  body,
}: {
  nonce: string;
  timestamp: string;
  body: Object;
}) {
  try {
    const payloadToSign =
      timestamp + "\n" + nonce + "\n" + JSON.stringify(body) + "\n";
    const signature = hashSignature(
      payloadToSign,
      BINANCE_API_SECRET
    ).toUpperCase();

    const res = await http.post("/binancepay/openapi/certificates", body, {
      headers: {
        "Content-Type": "application/json",
        "BinancePay-Timestamp": timestamp,
        "BinancePay-Nonce": nonce,
        "BinancePay-Certificate-SN": BINANCE_API_KEY,
        "BinancePay-Signature": signature,
      },
    });

    let pubKey = "";
    res.data.data.forEach((cert: any) => {
      console.log(`certSerial: ${cert.certSerial}`);
      pubKey = cert.certPublic;
      console.log(`certPublic: ${cert.certPublic}`);
    });

    return pubKey;
  } catch (err) {
    throw new Error(`Failed to fetch public key: ${err.message}`);
  }
}

function verifySignature(
  payload: string,
  decodedSignature: Buffer,
  publicKey: string
): boolean {
  const verifier = crypto.createVerify("SHA256");
  verifier.update(Buffer.from(payload));
  verifier.end();

  return verifier.verify(publicKey, decodedSignature);
}

const verifySignature2 = (
  payload: string,
  decodedSignature: string,
  publicKey: string
) => {
  const data: Buffer = Buffer.from(payload);
  const signature: Buffer = Buffer.from(decodedSignature);
  return crypto.verify(
    "sha256",
    data,
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    signature
  );
};

export const binanceWebhookOld = async (req: Request, res: Response) => {
  {
    try {
      const body = JSON.parse(req.body);
      const data = JSON.parse(JSON.parse(req.body).data);
      const { merchantTradeNo } = data;
      res.status(200).json({ returnCode: "SUCCESS", returnMessage: null });

      console.log(JSON.stringify(data, null, 2));

      if (body.bizType !== "PAY_REFUND") {
        await queryOrder(merchantTradeNo);
      }
    } catch (err) {
      wsNotifyBlockchainEvents;
      newError(`[Binance binanceWebhook]
      Error: ${err}`);
      res.status(400).json({
        error: err.message,
      });
      console.log(err.message);
    }
  }
};
