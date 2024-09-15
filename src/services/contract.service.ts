import { TransactionReceipt } from "@alch/alchemy-web3";
import dotenv from "dotenv";
import { ethers, providers, utils, Wallet, Signer } from "ethers";
import abi from "../abi/DGMarketplaceAbi";
import ERC721Abi from "../abi/ERC721";
import iceAbi from "../abi/ICEAbi";

import { AppDataSource } from "../db/data-source";
import { RefundIce } from "../db/entity";
import { wsNotifyBlockchainEvents } from "./webSocket.service";
import { hex2Dec } from "../utils";
import * as binanceService from "./binance.service";

import { IThirdPartyTransactionReceipt } from "../interfaces";
import { newErrorV2, newEventV2 } from "./discord.service";
import { getBlastProvider } from "./providers.service";

dotenv.config();

const refundIceRepo = AppDataSource.getRepository(RefundIce);
const {
  BACKEND_WALLET,
  BACKEND_WALLET_KEY,
  ALCHEMY_API_KEY,
  MARKETPLACE_ADDRESS,
  INFURA_KEY,
  // ICE_CONTRACT_ADDRESS,
  BAG_CONTRACT_ADDRESS,
} = process.env;

const provider = getBlastProvider();

const wallet = new ethers.Wallet(BACKEND_WALLET_KEY, provider);
const marketplaceContract = new ethers.Contract(
  MARKETPLACE_ADDRESS,
  abi,
  wallet
);
// const iceContract = new ethers.Contract(ICE_CONTRACT_ADDRESS, iceAbi, wallet);
const bagContract = new ethers.Contract(BAG_CONTRACT_ADDRESS, iceAbi, wallet);

export const sendNftAsGift = async ({
  nftAddress,
  tokenIds,
  recipientWallet,
  tokensPrice,
  wsNotificationPayload,
  paymentId,
  service,
}: {
  nftAddress: string;
  tokenIds: string[];
  recipientWallet: string;
  tokensPrice: number[];
  wsNotificationPayload: {
    type: "buy" | "sell" | "cancel";
    status: string;
    address: string;
  };
  paymentId: string;
  service: string;
}): Promise<IThirdPartyTransactionReceipt> => {
  const totalAmount = tokensPrice
    .reduce((acc, curr) => {
      return acc + +curr;
    }, 0)
    .toString();
  try {
    let refundResult: TransactionReceipt = null;
    if (!(await areOrdersActive({ nftAddress, tokenIds }))) {
      if (service === "binance") {
        const res = await binanceService.refundOrder(paymentId);
        if (res.status === "SUCCESS") {
          newEventV2({
            title: "ThirdPartyTransaction::sendNftAsGift",
            description: `Start - Refunding user for inactive token`,
            nftAddress,
            tokenId: tokenIds.join(","),
            extraData: "paymentId: " + paymentId,
          });
        } else {
          newErrorV2({
            title: "ThirdPartyTransaction::sendNftAsGift",
            description: `Error refunding user for inactive token`,
            nftAddress,
            tokenId: tokenIds.join(","),
            extraData: "paymentId: " + paymentId,
          });
        }
      } else {
        newEventV2({
          title: "ThirdPartyTransaction::sendNftAsGift",
          description: `Start - Refunding user for inactive token`,
          nftAddress,
          tokenId: tokenIds.join(","),
        });
        refundResult = await refundIce({
          amount: totalAmount,
          to: recipientWallet,
        });
        newEventV2({
          title: "ThirdPartyTransaction::sendNftAsGift",
          description: `End - Refunding user for inactive token`,
          nftAddress,
          tokenId: tokenIds.join(","),
          transactionHash: refundResult?.transactionHash || "no tx hash!",
          extraData: "Refund transaction extra data: " + refundResult,
        });
      }
      return {
        receipt: refundResult,
        status: "refund",
      };
    }
    const chainId = await wallet.getChainId();
    const tokenPriceInWei = tokensPrice.map((price) =>
      ethers.utils.parseUnits(price.toString(), 18).toString()
    );

    const unsignedTx = await marketplaceContract.populateTransaction[
      "buyForGift(address,uint256[],address,uint256[])"
    ](nftAddress, tokenIds, recipientWallet, tokenPriceInWei);
    const estimatedGas = await marketplaceContract.estimateGas[
      "buyForGift(address,uint256[],address,uint256[])"
    ](nftAddress, tokenIds, recipientWallet, tokenPriceInWei);

    unsignedTx.chainId = chainId;
    unsignedTx.gasLimit = estimatedGas;
    unsignedTx.gasPrice = await provider.getGasPrice();
    unsignedTx.nonce = await provider.getTransactionCount(BACKEND_WALLET);
    unsignedTx.to = MARKETPLACE_ADDRESS;
    const signedTx = await wallet.signTransaction(unsignedTx);
    const submittedTx = await provider.sendTransaction(signedTx);
    wsNotifyBlockchainEvents({
      ...wsNotificationPayload,
      transactionHash: submittedTx.hash,
    });
    const approveReceipt = await submittedTx.wait();
    if (approveReceipt.status === 0) {
      const owner = await getOwnerOfToken({ nftAddress, tokenId: tokenIds[0] });
      if (!owner.includes(recipientWallet)) {
        newErrorV2({
          title: "ThirdPartyTransaction::sendNftAsGift",
          description: `Token is not active`,
          nftAddress,
          tokenId: tokenIds[0].toString(),
          extraData: "Proceeding to refund the user.",
        });
        if (service === "binance") {
          const res = await binanceService.refundOrder(paymentId);
          if (res.status === "SUCCESS") {
            newEventV2({
              title: "ThirdPartyTransaction::sendNftAsGift",
              description: `Refunding user for inactive token`,
              nftAddress,
              tokenId: tokenIds[0].toString(),
              extraData: "paymentId: " + paymentId,
            });
          } else {
            newErrorV2({
              title: "ThirdPartyTransaction::sendNftAsGift",
              description: `Error refunding user for inactive token`,
              nftAddress,
              tokenId: tokenIds[0].toString(),
              extraData: "paymentId: " + paymentId,
            });
          }
        } else {
          const refundIceReceipt: TransactionReceipt = await refundIce({
            amount: totalAmount,
            to: recipientWallet,
          });
          const refundedTx = new RefundIce();
          refundedTx.wallet = recipientWallet;
          refundedTx.transactionHash = refundIceReceipt.transactionHash;
          refundedTx.price = parseFloat(totalAmount);
          await refundIceRepo.save(refundedTx);
          newEventV2({
            title: "ThirdPartyTransaction::sendNftAsGift",
            description: `Refunding user for inactive token`,
            nftAddress,
            tokenId: tokenIds[0].toString(),
            transactionHash: refundIceReceipt?.transactionHash || "no tx hash!",
            extraData: "Refund transaction extra data: " + refundIceReceipt,
          });
          wsNotifyBlockchainEvents({
            ...wsNotificationPayload,
            status: "refund",
            message: `Something went wrong, we are refunding your ${refundedTx.price} BAG back to your wallet: ${recipientWallet}`,
            transactionHash: refundedTx.transactionHash,
          });
          return {
            receipt: refundIceReceipt,
            status: "refund",
          };
        }
      }
      // throw new Error("Something went wrong with the sendAsGift Tx, check!");
    }
    return {
      receipt: approveReceipt,
      status: "sent",
    };
  } catch (error) {
    console.log("error sending token as a gift: ", error);
    const beforeTxOwner = await getOwnerOfToken({
      nftAddress,
      tokenId: tokenIds[0],
    });
    if (!beforeTxOwner.includes(recipientWallet)) {
      if (service === "binance") {
        binanceService.refundOrder(paymentId);
      } else {
        const refundResult = await refundIce({
          amount: totalAmount,
          to: recipientWallet,
        });
        return {
          receipt: refundResult,
          status: "refund",
        };
      }
    }
    throw new Error(error);
  }
};

export const isTokeActive = async ({
  nftAddress,
  tokenId,
}: {
  nftAddress: string;
  tokenId: string;
}): Promise<boolean> => {
  try {
    if (
      (await marketplaceContract.getOrderActive(nftAddress, tokenId)) &&
      (await marketplaceContract.getOrderBeneficiary(nftAddress, tokenId)) ==
        (await getOwnerOfToken({ nftAddress, tokenId }))
    )
      return true;
    return false;
  } catch (error) {
    throw new Error("Error while checking if token is active");
  }
};

export const areOrdersActive = async ({
  nftAddress,
  tokenIds,
}: {
  nftAddress: string;
  tokenIds: string[];
}): Promise<boolean> => {
  try {
    return await marketplaceContract.areOrdersActive(nftAddress, tokenIds);
  } catch (error) {
    newErrorV2({
      title: "Checking if orders are active",
      description: "Error checking if orders are active",
      nftAddress,
      tokenId: tokenIds.join(","),
      extraData: error.message || error,
    });
    return false;
  }
};

export const refundIce = async ({
  amount,
  to,
}: {
  amount: string;
  to: string;
}): Promise<TransactionReceipt> => {
  try {
    const iceAmount = utils.parseUnits(amount, 18).toString();
    const estimatedGas = await bagContract.estimateGas[
      "transfer(address,uint256)"
    ](to, iceAmount);
    const gasPrice = await provider.getGasPrice();
    const submittedTx = await bagContract.transfer(to, iceAmount, {
      gasLimit: estimatedGas.mul(130).div(100),
      gasPrice,
    });
    const approveReceipt: TransactionReceipt = await submittedTx.wait();
    if (+approveReceipt.status === 0) {
      throw new Error("Refund transaction failed");
    }
    return approveReceipt;
  } catch (error) {
    console.log("error refunding ice: ", error);
    throw new Error("Error refunding ice");
  }
};

export const getBackendWalletBalances = async (): Promise<{
  bagBalance: string;
  maticBalance: string;
  status: string;
}> => {
  const backendWalletBalances = {
    bagBalance: "",
    maticBalance: "",
    status: "success",
  };
  try {
    const balance = await provider.getBalance(BACKEND_WALLET);
    if (balance) {
      const balanceInMatic = utils.formatEther(hex2Dec(balance._hex));
      backendWalletBalances.maticBalance = balanceInMatic;
    }
    const bagBalance = await bagContract.balanceOf(BACKEND_WALLET);
    backendWalletBalances.bagBalance = utils.formatEther(bagBalance);
    return backendWalletBalances;
  } catch (error) {
    backendWalletBalances.status = "error";
    return backendWalletBalances;
  }
};

export const getOwnerOfToken = async ({
  nftAddress,
  tokenId,
}: {
  nftAddress: string;
  tokenId: string;
}): Promise<string> => {
  const nftContract = new ethers.Contract(nftAddress, ERC721Abi, wallet);
  const owner = await nftContract.ownerOf(tokenId);
  return owner;
};
