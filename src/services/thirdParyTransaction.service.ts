import { AppDataSource } from "../db/data-source";
import { ThirdPartyTransaction } from "../db/entity/ThirdPartyTransaction";
import { sendNftAsGift } from "../services/contract.service";
import {
  ISaveThirPartyTransactionReq,
  IThirdPartyTransactionReceipt,
} from "../interfaces";
import { newErrorV2, newEventV2 } from "./discord.service";
import { wsNotifyBlockchainEvents } from "./webSocket.service";
import { getBagPrice } from "./coinmarketcap.service";

const mapNewThirdPartyTransaction = (
  tx: ThirdPartyTransaction,
  status: string,
  transactionHash?: string,
  notes?: string
): ThirdPartyTransaction => {
  const newThirdPartyTransaction = new ThirdPartyTransaction();
  newThirdPartyTransaction.paymentId = tx.paymentId;
  newThirdPartyTransaction.amountFiat = tx.amountFiat;
  newThirdPartyTransaction.amountIce = tx.amountIce;
  newThirdPartyTransaction.conversionRate = tx.conversionRate;
  newThirdPartyTransaction.nftAddress = tx.nftAddress;
  newThirdPartyTransaction.tokenId = tx.tokenId;
  newThirdPartyTransaction.resourceId = tx.resourceId;
  newThirdPartyTransaction.buyerWallet = tx.buyerWallet;
  newThirdPartyTransaction.sellerAddress = tx.sellerAddress;
  newThirdPartyTransaction.status = status;
  newThirdPartyTransaction.notes = tx.notes;
  newThirdPartyTransaction.type = tx.type;
  newThirdPartyTransaction.email = tx.email;
  newThirdPartyTransaction.transactionHash =
    transactionHash || tx.transactionHash;
  newThirdPartyTransaction.notes = notes;
  return newThirdPartyTransaction;
};

export const updateThirdPartyTransaction = async ({
  paymentId,
  status,
  notes = "",
}: {
  paymentId?: string;
  status: "paid" | "failed" | "expired" | "pending";
  notes?: string;
  isPaper?: boolean;
  txHash?: string;
}): Promise<ThirdPartyTransaction> => {
  const thirdPartyTransactionRepository = AppDataSource.getRepository(
    ThirdPartyTransaction
  );
  const foundThirdPartyPendingTransaction =
    await thirdPartyTransactionRepository.find({
      where: { paymentId },
      order: { id: "DESC" },
    });
  if (
    !foundThirdPartyPendingTransaction ||
    !foundThirdPartyPendingTransaction.length
  ) {
    throw Error("No transactions found for id: " + paymentId);
  }
  const thirdPartyPendingTransaction = foundThirdPartyPendingTransaction[0];
  const isRefunded = foundThirdPartyPendingTransaction.some(
    (x) => x.status === "refund"
  );
  const isPaid = foundThirdPartyPendingTransaction.some(
    (x) => x.status === "paid"
  );

  if (isRefunded) {
    newErrorV2({
      title: "ThirdPartyTransaction::updateThirdPartyTransaction",
      description: `Transaction already refunded`,
      transactionHash: thirdPartyPendingTransaction.transactionHash,
    });
    throw new Error(
      `Transaction already refunded: ${paymentId || ""} - ${
        thirdPartyPendingTransaction.transactionHash
      }`
    );
  } else if (isPaid) {
    wsNotifyBlockchainEvents({
      type: "buy",
      address: thirdPartyPendingTransaction.buyerWallet,
      status: "failed",
      message: `Nft transaction was paid for: ${paymentId}`,
    });
    throw Error("Nft transaction was paid for: " + paymentId);
  }
  if (status === "pending") {
    const newThirdPartyTransaction = mapNewThirdPartyTransaction(
      thirdPartyPendingTransaction,
      "waiting_blockchain_confirmation"
    );
    newEventV2({
      title: "ThirdPartyTransaction::waiting_blockchain_confirmation",
      description: `Transaction is pending`,
      extraData: `paymentId: ${paymentId} - status: ${status}}`,
    });
    wsNotifyBlockchainEvents({
      type: "buy",
      address: thirdPartyPendingTransaction.buyerWallet,
      status: "waiting_blockchain_confirmation",
      message: `Waiting for blockchain confirmation for paymentId:, ${paymentId}`,
    });
    return await thirdPartyTransactionRepository.save(newThirdPartyTransaction);
  } else if (status === "paid") {
    let thirdPartyTransactionReceipt: IThirdPartyTransactionReceipt = null;
    newEventV2({
      title: "ThirdPartyTransaction::preSendNftAsGift",
      description: `Transaction paid | will try to send nft as gift`,
      extraData: `paymentId: ${paymentId}} - status: ${status}`,
    });
    thirdPartyTransactionReceipt = await sendNftAsGift({
      nftAddress: thirdPartyPendingTransaction.nftAddress,
      tokenIds: [thirdPartyPendingTransaction.tokenId],
      recipientWallet: thirdPartyPendingTransaction.buyerWallet,
      tokensPrice: [+thirdPartyPendingTransaction.amountIce],
      wsNotificationPayload: {
        type: "buy",
        status,
        address: thirdPartyPendingTransaction.buyerWallet,
      },
      paymentId: thirdPartyPendingTransaction.paymentId,
      service: thirdPartyPendingTransaction.type,
    });

    if (thirdPartyTransactionReceipt?.status === "refund") {
      const newThirdPartyTransaction = mapNewThirdPartyTransaction(
        thirdPartyPendingTransaction,
        "refund",
        thirdPartyTransactionReceipt?.receipt?.transactionHash || "no tx hash!"
      );
      newEventV2({
        title: "ThirdPartyTransaction::postSendNftAsGift",
        description: `Send as gift failed, refunding payment`,
        extraData: `paymentId: ${paymentId}} - status: refund - txHash: ${
          thirdPartyTransactionReceipt?.receipt?.transactionHash ||
          "no tx hash!"
        } receipt: ${JSON.stringify(thirdPartyTransactionReceipt?.receipt)}`,
      });
      wsNotifyBlockchainEvents({
        type: "buy",
        address: thirdPartyPendingTransaction.buyerWallet,
        status: "refund",
        message: `Something went wrong, we are refunding your payment to your account. paymentId: ${paymentId}`,
        transactionHash:
          thirdPartyTransactionReceipt?.receipt?.transactionHash ||
          "no tx hash!",
      });
      return await thirdPartyTransactionRepository.save(
        newThirdPartyTransaction
      );
    } else if (thirdPartyTransactionReceipt.status === "sent") {
      newEventV2({
        title: "ThirdPartyTransaction::postSendNftAsGift",
        description: `Sent as gift successfully`,
        extraData: `paymentId: ${paymentId}} - status: refund - txHash: ${
          thirdPartyTransactionReceipt?.receipt?.transactionHash ||
          "no tx hash!"
        } receipt: ${JSON.stringify(thirdPartyTransactionReceipt?.receipt)}`,
      });
      const newThirdPartyTransaction = mapNewThirdPartyTransaction(
        thirdPartyPendingTransaction,
        "paid",
        thirdPartyTransactionReceipt?.receipt?.transactionHash || "no tx hash!",
        notes
      );
      await thirdPartyTransactionRepository.save(newThirdPartyTransaction);
    } else {
      newErrorV2({
        title: "ThirdPartyTransaction::postSendNftAsGift",
        description: `Send as gift failed, no reason found`,
        extraData: `paymentId: ${paymentId}} - status: failed - txHash: ${
          thirdPartyTransactionReceipt?.receipt?.transactionHash ||
          "no tx hash!"
        } receipt: ${JSON.stringify(thirdPartyTransactionReceipt?.receipt)}`,
      });
      const newThirdPartyTransaction = mapNewThirdPartyTransaction(
        thirdPartyPendingTransaction,
        "failed"
      );
      wsNotifyBlockchainEvents({
        type: "buy",
        address: thirdPartyPendingTransaction.buyerWallet,
        status: "failed",
        message: `Something went wrong:, ${paymentId}`,
      });
      return await thirdPartyTransactionRepository.save(
        newThirdPartyTransaction
      );
    }
  } else if (status === "failed") {
    const newThirdPartyTransaction = mapNewThirdPartyTransaction(
      thirdPartyPendingTransaction,
      status
    );
    wsNotifyBlockchainEvents({
      type: "buy",
      address: thirdPartyPendingTransaction.buyerWallet,
      status: "failed",
      message: `Something went wrong:, ${paymentId}`,
    });
    newEventV2({
      title: "ThirdPartyTransaction::updateThirdPartyTransaction",
      description: `Transaction failed`,
      extraData: `paymentId: ${paymentId} - status: ${status}}`,
    });
    return await thirdPartyTransactionRepository.save(newThirdPartyTransaction);
  } else {
    const newThirdPartyTransaction = mapNewThirdPartyTransaction(
      thirdPartyPendingTransaction,
      "failed"
    );
    wsNotifyBlockchainEvents({
      type: "buy",
      address: thirdPartyPendingTransaction.buyerWallet,
      status: "failed",
      message: `Something went wrong:, ${paymentId}`,
    });
    newEventV2({
      title: "ThirdPartyTransaction::updateThirdPartyTransaction",
      description: `Transaction failed`,
      extraData: `paymentId: ${paymentId} - status: ${status}}`,
    });
    return await thirdPartyTransactionRepository.save(newThirdPartyTransaction);
  }
};

export const saveThirdPartyTransaction = async ({
  paymentId,
  conversionRate,
  totalPriceBag,
  totalPriceFiat,
  nftData,
  buyerWallet,
  sellerAddress,
  status,
  type,
  email,
}: ISaveThirPartyTransactionReq): Promise<ThirdPartyTransaction> => {
  const thirdPartyTransactionRepository = AppDataSource.getRepository(
    ThirdPartyTransaction
  );
  try {
    const bagPrice = await getBagPrice();
    const { nftAddress, tokenId, resourceId } = nftData[0];
    const thirdPartyTransaction = new ThirdPartyTransaction();
    thirdPartyTransaction.paymentId = paymentId;
    thirdPartyTransaction.amountFiat = totalPriceFiat;
    thirdPartyTransaction.amountIce = totalPriceBag;
    thirdPartyTransaction.conversionRate = conversionRate;
    thirdPartyTransaction.nftAddress = nftAddress;
    thirdPartyTransaction.tokenId = tokenId;
    thirdPartyTransaction.resourceId = resourceId;
    thirdPartyTransaction.buyerWallet = buyerWallet;
    thirdPartyTransaction.sellerAddress = sellerAddress;
    thirdPartyTransaction.status = status;
    thirdPartyTransaction.type = type;
    thirdPartyTransaction.email = email;
    return await thirdPartyTransactionRepository.save(thirdPartyTransaction);
  } catch (error) {
    throw error;
  }
};

export const updateThirdPartyTransactionRefund = async ({
  paymentId,
  uuid,
}: {
  paymentId: string;
  uuid: string;
}) => {
  const thirdPartyTransactionRepository = AppDataSource.getRepository(
    ThirdPartyTransaction
  );
  const foundThirdPartyPendingTransaction =
    await thirdPartyTransactionRepository.find({
      where: { paymentId },
      order: { id: "DESC" },
    });
  if (foundThirdPartyPendingTransaction.length) {
    const thirdPartyPendingTransactionsToSave: ThirdPartyTransaction[] = [];
    for (const thirdPartyPendingTransaction of foundThirdPartyPendingTransaction) {
      const thirdPartyPendingTransactionToSave = new ThirdPartyTransaction();
      thirdPartyPendingTransactionToSave.paymentId =
        thirdPartyPendingTransaction.paymentId;
      thirdPartyPendingTransactionToSave.amountFiat =
        thirdPartyPendingTransaction.amountFiat;
      thirdPartyPendingTransactionToSave.amountIce =
        thirdPartyPendingTransaction.amountIce;
      thirdPartyPendingTransactionToSave.conversionRate =
        thirdPartyPendingTransaction.conversionRate;
      thirdPartyPendingTransactionToSave.nftAddress =
        thirdPartyPendingTransaction.nftAddress;
      thirdPartyPendingTransactionToSave.tokenId =
        thirdPartyPendingTransaction.tokenId;
      thirdPartyPendingTransactionToSave.resourceId =
        thirdPartyPendingTransaction.resourceId;
      thirdPartyPendingTransactionToSave.buyerWallet =
        thirdPartyPendingTransaction.buyerWallet;
      thirdPartyPendingTransactionToSave.sellerAddress =
        thirdPartyPendingTransaction.sellerAddress;
      thirdPartyPendingTransactionToSave.status = "refund";
      thirdPartyPendingTransactionToSave.notes = "Refunded by admin";
      thirdPartyPendingTransactionToSave.type =
        thirdPartyPendingTransaction.type;
      thirdPartyPendingTransactionToSave.notes = uuid;
      thirdPartyPendingTransactionsToSave.push(
        thirdPartyPendingTransactionToSave
      );
    }
    await thirdPartyTransactionRepository.save(
      thirdPartyPendingTransactionsToSave
    );
  }
};

// const updateThirdPartyTransactionMultiple = async (
//   foundThirdPartyPendingTransaction: ThirdPartyTransaction[],
//   status: string,
//   notes: string,
//   isPaper: boolean,
//   txHash: string
// ) => {
//   const thirdPartyTransactionRepository = AppDataSource.getRepository(
//     ThirdPartyTransaction
//   );
//   const firstThirdPartyPendingTransaction =
//     foundThirdPartyPendingTransaction[0];
//   if (firstThirdPartyPendingTransaction.status === "refund") {
//     newErrorV2({
//       title: "ThirdPartyTransaction::updateMultipleThirdPartyTransaction",
//       description: `Transaction already refunded`,
//       transactionHash: firstThirdPartyPendingTransaction.transactionHash,
//     });
//     throw new Error(
//       `Transaction already refunded: ${
//         firstThirdPartyPendingTransaction.paymentId || ""
//       } - ${firstThirdPartyPendingTransaction.transactionHash}`
//     );
//   } else if (firstThirdPartyPendingTransaction.status === "paid") {
//     try {
//       wsNotifyBlockchainEvents({
//         type: "buy",
//         address: firstThirdPartyPendingTransaction.buyerWallet,
//         status: "failed",
//         message: `Nft transaction was paid for: ${firstThirdPartyPendingTransaction.paymentId}`,
//       });
//       throw Error(
//         "Nft transaction was paid for: " +
//           firstThirdPartyPendingTransaction.paymentId
//       );
//     } catch (error) {
//       throw error;
//     }
//   }
//   if (status === "pending") {
//     const thirdPartyPendingTransactionToSave: ThirdPartyTransaction[] = [];
//     for (const thirdPartyPendingTransaction of foundThirdPartyPendingTransaction) {
//       const newThirdPartyTransaction = new ThirdPartyTransaction();
//       newThirdPartyTransaction.paymentId =
//         thirdPartyPendingTransaction.paymentId;
//       newThirdPartyTransaction.amountFiat =
//         thirdPartyPendingTransaction.amountFiat;
//       newThirdPartyTransaction.amountIce =
//         thirdPartyPendingTransaction.amountIce;
//       newThirdPartyTransaction.conversionRate =
//         thirdPartyPendingTransaction.conversionRate;
//       newThirdPartyTransaction.nftAddress =
//         thirdPartyPendingTransaction.nftAddress;
//       newThirdPartyTransaction.tokenId = thirdPartyPendingTransaction.tokenId;
//       newThirdPartyTransaction.resourceId =
//         thirdPartyPendingTransaction.resourceId;
//       newThirdPartyTransaction.buyerWallet =
//         thirdPartyPendingTransaction.buyerWallet;
//       newThirdPartyTransaction.sellerAddress =
//         thirdPartyPendingTransaction.sellerAddress;
//       newThirdPartyTransaction.status = "waiting_blockchain_confirmation";
//       newThirdPartyTransaction.notes = notes;
//       newThirdPartyTransaction.type = thirdPartyPendingTransaction.type;
//       thirdPartyPendingTransactionToSave.push(newThirdPartyTransaction);
//     }
//     await thirdPartyTransactionRepository.save(
//       thirdPartyPendingTransactionToSave
//     );
//     wsNotifyBlockchainEvents({
//       type: "buy",
//       address: firstThirdPartyPendingTransaction.buyerWallet,
//       status: "waiting_blockchain_confirmation",
//       message: `Waiting for blockchain confirmation for paymentId:, ${firstThirdPartyPendingTransaction.paymentId}`,
//     });
//   } else if (status === "paid") {
//     let thirdPartyTransactionReceipt: IThirdPartyTransactionReceipt = null;
//     thirdPartyTransactionReceipt = await sendNftAsGift({
//       nftAddress: firstThirdPartyPendingTransaction.nftAddress,
//       tokenIds: [firstThirdPartyPendingTransaction.tokenId],
//       recipientWallet: firstThirdPartyPendingTransaction.buyerWallet,
//       tokensPrice: [+firstThirdPartyPendingTransaction.amountIce],
//       wsNotificationPayload: {
//         type: "buy",
//         status,
//         address: firstThirdPartyPendingTransaction.buyerWallet,
//       },
//       paymentId: firstThirdPartyPendingTransaction.paymentId,
//       service: firstThirdPartyPendingTransaction.type,
//     });

//     if (thirdPartyTransactionReceipt?.status === "refund") {
//       const thirdPartyPendingTransactionToSave: ThirdPartyTransaction[] = [];
//       for (const thirdPartyPendingTransaction of foundThirdPartyPendingTransaction) {
//         const newThirdPartyTransaction = new ThirdPartyTransaction();
//         newThirdPartyTransaction.paymentId =
//           thirdPartyPendingTransaction.paymentId;
//         newThirdPartyTransaction.amountFiat =
//           thirdPartyPendingTransaction.amountFiat;
//         newThirdPartyTransaction.amountIce =
//           thirdPartyPendingTransaction.amountIce;
//         newThirdPartyTransaction.conversionRate =
//           thirdPartyPendingTransaction.conversionRate;
//         newThirdPartyTransaction.nftAddress =
//           thirdPartyPendingTransaction.nftAddress;
//         newThirdPartyTransaction.tokenId = thirdPartyPendingTransaction.tokenId;
//         newThirdPartyTransaction.resourceId =
//           thirdPartyPendingTransaction.resourceId;
//         newThirdPartyTransaction.buyerWallet =
//           thirdPartyPendingTransaction.buyerWallet;
//         newThirdPartyTransaction.sellerAddress =
//           thirdPartyPendingTransaction.sellerAddress;
//         newThirdPartyTransaction.status = "refund";
//         newThirdPartyTransaction.notes = notes;
//         newThirdPartyTransaction.type = thirdPartyPendingTransaction.type;
//         newThirdPartyTransaction.transactionHash =
//           thirdPartyTransactionReceipt?.receipt?.transactionHash ||
//           "no tx hash!";
//         thirdPartyPendingTransactionToSave.push(newThirdPartyTransaction);
//       }
//       await thirdPartyTransactionRepository.save(
//         thirdPartyPendingTransactionToSave
//       );
//       wsNotifyBlockchainEvents({
//         type: "buy",
//         address: firstThirdPartyPendingTransaction.buyerWallet,
//         status: "refund",
//         message: `Something went wrong, we are refunding your payment to your account. paymentId: ${firstThirdPartyPendingTransaction.paymentId}`,
//         transactionHash:
//           thirdPartyTransactionReceipt?.receipt?.transactionHash ||
//           "no tx hash!",
//       });
//     } else if (thirdPartyTransactionReceipt.status === "sent") {
//       const thirdPartyPendingTransactionToSave: ThirdPartyTransaction[] = [];
//       for (const thirdPartyPendingTransaction of foundThirdPartyPendingTransaction) {
//         const newThirdPartyTransaction = new ThirdPartyTransaction();
//         newThirdPartyTransaction.paymentId =
//           thirdPartyPendingTransaction.paymentId;
//         newThirdPartyTransaction.amountFiat =
//           thirdPartyPendingTransaction.amountFiat;
//         newThirdPartyTransaction.amountIce =
//           thirdPartyPendingTransaction.amountIce;
//         newThirdPartyTransaction.conversionRate =
//           thirdPartyPendingTransaction.conversionRate;
//         newThirdPartyTransaction.nftAddress =
//           thirdPartyPendingTransaction.nftAddress;
//         newThirdPartyTransaction.tokenId = thirdPartyPendingTransaction.tokenId;
//         newThirdPartyTransaction.resourceId =
//           thirdPartyPendingTransaction.resourceId;
//         newThirdPartyTransaction.buyerWallet =
//           thirdPartyPendingTransaction.buyerWallet;
//         newThirdPartyTransaction.sellerAddress =
//           thirdPartyPendingTransaction.sellerAddress;
//         newThirdPartyTransaction.status = "paid";
//         newThirdPartyTransaction.notes = notes;
//         newThirdPartyTransaction.type = thirdPartyPendingTransaction.type;
//         newThirdPartyTransaction.transactionHash =
//           thirdPartyTransactionReceipt?.receipt?.transactionHash ||
//           "no tx hash!";
//         thirdPartyPendingTransactionToSave.push(newThirdPartyTransaction);
//       }
//       return await thirdPartyTransactionRepository.save(
//         thirdPartyPendingTransactionToSave
//       );
//     } else {
//       const thirdPartyPendingTransactionToSave: ThirdPartyTransaction[] = [];
//       for (const thirdPartyPendingTransaction of foundThirdPartyPendingTransaction) {
//         const newThirdPartyTransaction = new ThirdPartyTransaction();
//         newThirdPartyTransaction.paymentId =
//           thirdPartyPendingTransaction.paymentId;
//         newThirdPartyTransaction.amountFiat =
//           thirdPartyPendingTransaction.amountFiat;
//         newThirdPartyTransaction.amountIce =
//           thirdPartyPendingTransaction.amountIce;
//         newThirdPartyTransaction.conversionRate =
//           thirdPartyPendingTransaction.conversionRate;
//         newThirdPartyTransaction.nftAddress =
//           thirdPartyPendingTransaction.nftAddress;
//         newThirdPartyTransaction.tokenId = thirdPartyPendingTransaction.tokenId;
//         newThirdPartyTransaction.resourceId =
//           thirdPartyPendingTransaction.resourceId;
//         newThirdPartyTransaction.buyerWallet =
//           thirdPartyPendingTransaction.buyerWallet;
//         newThirdPartyTransaction.sellerAddress =
//           thirdPartyPendingTransaction.sellerAddress;
//         newThirdPartyTransaction.status = "failed";
//         newThirdPartyTransaction.notes = notes;
//         newThirdPartyTransaction.type = thirdPartyPendingTransaction.type;
//         thirdPartyPendingTransactionToSave.push(newThirdPartyTransaction);
//       }
//       return await thirdPartyTransactionRepository.save(
//         thirdPartyPendingTransactionToSave
//       );
//     }
//   } else {
//     const thirdPartyPendingTransactionToSave: ThirdPartyTransaction[] = [];
//     for (const thirdPartyPendingTransaction of foundThirdPartyPendingTransaction) {
//       const newThirdPartyTransaction = new ThirdPartyTransaction();
//       newThirdPartyTransaction.paymentId =
//         thirdPartyPendingTransaction.paymentId;
//       newThirdPartyTransaction.amountFiat =
//         thirdPartyPendingTransaction.amountFiat;
//       newThirdPartyTransaction.amountIce =
//         thirdPartyPendingTransaction.amountIce;
//       newThirdPartyTransaction.conversionRate =
//         thirdPartyPendingTransaction.conversionRate;
//       newThirdPartyTransaction.nftAddress =
//         thirdPartyPendingTransaction.nftAddress;
//       newThirdPartyTransaction.tokenId = thirdPartyPendingTransaction.tokenId;
//       newThirdPartyTransaction.resourceId =
//         thirdPartyPendingTransaction.resourceId;
//       newThirdPartyTransaction.buyerWallet =
//         thirdPartyPendingTransaction.buyerWallet;
//       newThirdPartyTransaction.sellerAddress =
//         thirdPartyPendingTransaction.sellerAddress;
//       newThirdPartyTransaction.status = "failed";
//       newThirdPartyTransaction.notes = notes;
//       newThirdPartyTransaction.type = thirdPartyPendingTransaction.type;
//       thirdPartyPendingTransactionToSave.push(newThirdPartyTransaction);
//     }
//     return await thirdPartyTransactionRepository.save(
//       thirdPartyPendingTransactionToSave
//     );
//   }
// };

// export const saveThirdPartyTransactionMultiple = async ({
//   paymentId,
//   conversionRate,
//   nftData,
//   buyerWallet,
//   sellerAddress,
//   status,
//   type,
//   email,
// }: ISaveThirPartyTransactionReqMultiple): Promise<ThirdPartyTransaction[]> => {
//   const thirdPartyTransactionRepository = AppDataSource.getRepository(
//     ThirdPartyTransaction
//   );

//   try {
//     let res: ThirdPartyTransaction[] = [];
//     let txTSave: ThirdPartyTransaction[] = [];
//     const bagPrice = await getBagPrice();
//     for (const nft of nftData) {
//       const amountFiat = nft.price * bagPrice.data.quote.USD.price;
//       const thirdPartyTransaction = new ThirdPartyTransaction();
//       thirdPartyTransaction.paymentId = paymentId;
//       thirdPartyTransaction.amountFiat = amountFiat.toString();
//       thirdPartyTransaction.amountIce = nft.price.toString();
//       thirdPartyTransaction.conversionRate = conversionRate;
//       thirdPartyTransaction.nftAddress = nft.nftAddress;
//       thirdPartyTransaction.tokenId = nft.tokenId;
//       thirdPartyTransaction.resourceId = nft.resourceId;
//       thirdPartyTransaction.buyerWallet = buyerWallet;
//       thirdPartyTransaction.sellerAddress = sellerAddress;
//       thirdPartyTransaction.status = status;
//       thirdPartyTransaction.type = type;
//       thirdPartyTransaction.email = email;
//       txTSave.push(thirdPartyTransaction);
//     }
//     res = await thirdPartyTransactionRepository.save(txTSave);
//     return res;
//   } catch (error) {
//     throw error;
//   }
// };

export const getThirdPartyTransaction = async (paymentId: string) => {
  const thirdPartyTransactionRepository = AppDataSource.getRepository(
    ThirdPartyTransaction
  );
  return await thirdPartyTransactionRepository.find({
    where: { paymentId },
  });
};
