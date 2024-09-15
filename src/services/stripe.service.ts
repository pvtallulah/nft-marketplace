import Stripe from "stripe";
import dotenv from "dotenv";
import { utils } from "ethers";
import { Request, Response } from "express";
import { differenceInMinutes } from "date-fns";
import { v4 as uuidv4 } from "uuid";

import { getNftdata } from "./marketplace.service";
import { getNftPrice } from "./coinmarketcap.service";
import { AppDataSource } from "../db/data-source";
import { StripeRateLimit } from "../db/entity/StripeRateLimit";
import { getBagPrice } from "./coinmarketcap.service";
import * as thirdParyTransaction from "./thirdParyTransaction.service";

dotenv.config();

const {
  STRIPE_SECRET_KEY,
  STRIPE_PAYMENTLINK_EXPIRES_IN,
  STRIPE_WH_SECRET,
  STRIPE_PAYMENTLINK_EXPIRES,
  STRIPE_MINIMUM_PRICE,
  STRIPE_BAN_TIME,
} = process.env;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2022-08-01",
});

export const createProduct = async (
  address: string,
  tokenId: string,
  buyer: string,
  name: string,
  imageUrl: string
): Promise<Stripe.Product> => {
  const product = await stripe.products.create({
    name,
    images: [imageUrl],
    metadata: {
      address,
      tokenId,
      buyer,
      imageUrl,
    },
  });
  return product;
};

export const createPrice = async (
  product: string,
  unitAmountDecimal: string
): Promise<Stripe.Price> => {
  const price = await stripe.prices.create({
    currency: "usd",
    unit_amount_decimal: unitAmountDecimal,
    product,
  });

  return price;
};

export const createPaymentLink = async (
  address: string,
  tokenId: string,
  resourceId: string,
  buyerWallet: string
): Promise<string> => {
  try {
    const nftData = await getNftdata({
      nftAddress: address,
      resourceId,
      tokenId,
    });
    const { imageUrl, name, price: nftPriceBig, sellerAddress } = nftData;
    const isBanned = await isUserBanned(buyerWallet);
    if (isBanned)
      throw new Error(
        "You are banned for making 3 payment links and not using the service, please wait 1 hr"
      );

    const iceAmount = utils.formatUnits(nftPriceBig, 16);
    const iceToUsd = await getNftPrice(iceAmount);
    const product = await createProduct(
      address,
      tokenId,
      buyerWallet,
      name,
      imageUrl
    );
    const formattedPrice = Number(iceToUsd).toFixed(0);
    if (Number(formattedPrice) < Number(STRIPE_MINIMUM_PRICE || 500))
      throw new Error("Price must be greater than $5");
    const price = await createPrice(product.id, formattedPrice);
    const conversionRate: any = await getBagPrice();
    // const uuid = uuidv4();
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: {
        imageUrl,
        sellerAddress,
        address,
        tokenId,
        buyerWallet,
        resourceId,
        name,
      },
    });
    // await thirdParyTransaction.saveThirdPartyTransaction({
    //   paymentId: paymentLink.id,
    //   amountFiat: formattedPrice,
    //   amountIce: iceAmount,
    //   conversionRate: conversionRate.data.quote.USD.price.toString(),
    //   nftAddress: address,
    //   tokenId,
    //   resourceId,
    //   buyerWallet,
    //   sellerAddress,
    //   status: "paymentlink_created",
    //   type: "stripe",
    // });
    if (STRIPE_PAYMENTLINK_EXPIRES === "true")
      expirePaymentLink(paymentLink.id);
    return paymentLink.url;
  } catch (error) {
    throw error;
  }
};

export const stripeWebhook = async (req: Request, res: Response) => {
  {
    console.log("stripe webhook", req.body);
    // Remove old, deprecated secret
    const endpointSecret = ""; // STRIPE_WH_SECRET;
    try {
      const sig = req.headers["stripe-signature"];
      const body = req.body;

      let event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
      }
      const session = event.data.object;
      const {
        id: paymentId,
        payment_link,
        last_payment_error: { message: notes } = { message: "" },
      } = session;
      // Handle the event
      switch (event.type) {
        // case "payment_intent.created":
        //   console.log("payment_intent.created");
        //   break;
        // case "payment_intent.processing":
        //   console.log("payment_intent.created");
        //   break;
        // case "payment_intent.succeeded":
        //   console.log("payment_intent.created");
        //   break;
        // case "payment_intent.canceled":
        //   console.log("payment_intent.created");
        //   break;

        case "payment_intent.payment_failed":
          await thirdParyTransaction.updateThirdPartyTransaction({
            paymentId,
            status: "failed",
            notes,
          });
          break;
        case "checkout.session.completed":
          await thirdParyTransaction.updateThirdPartyTransaction({
            paymentId,
            status: "paid",
          });
          break;
        case "checkout.session.expired":
          await thirdParyTransaction.updateThirdPartyTransaction({
            paymentId: payment_link,
            status: "expired",
          });
          break;
        default:
          console.warn(`Unhandled event type ${event.type}`);
      }

      // Return a 200 response to acknowledge receipt of the event
      return res.status(200).json({
        status: 200,
        data: {
          message: "Webhook received",
          body,
          sig,
          event,
        },
      });
    } catch (e) {
      res.status(400).json({
        error: e.message,
      });
      console.log(e.message);
    }
  }
};

const expirePaymentLink = async (paymentLinkId: string): Promise<void> => {
  const expiresIn = !!STRIPE_PAYMENTLINK_EXPIRES_IN
    ? Number(STRIPE_PAYMENTLINK_EXPIRES_IN) * 1000 * 60
    : 120000;
  setTimeout(async () => {
    await stripe.paymentLinks.update(paymentLinkId, { active: false });
  }, expiresIn);
};

const isUserBanned = async (recipientWallet: string): Promise<boolean> => {
  const stripeRateLimitRepository =
    AppDataSource.getRepository(StripeRateLimit);
  const found = await stripeRateLimitRepository.findOne({
    where: { address: recipientWallet },
  });
  if (!found) {
    const newStripeRateLimit = new StripeRateLimit();
    newStripeRateLimit.address = recipientWallet;
    newStripeRateLimit.count = 1;
    await stripeRateLimitRepository.save(newStripeRateLimit);
    return false;
  }
  if (found.count >= 3) {
    const difference = differenceInMinutes(new Date(), found.created_at);
    if (difference > Number(STRIPE_BAN_TIME)) {
      await stripeRateLimitRepository.delete(found.id);
      const newStripeRateLimit = new StripeRateLimit();
      newStripeRateLimit.address = recipientWallet;
      newStripeRateLimit.count = 1;
      await stripeRateLimitRepository.save(newStripeRateLimit);
      return false;
    }
    return true;
  } else {
    found.count = found.count + 1;
    await stripeRateLimitRepository.save(found);
    return false;
  }
};
