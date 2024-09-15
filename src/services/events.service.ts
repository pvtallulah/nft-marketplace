import dotenv from "dotenv";
import { Contract, ethers } from "ethers";
import abi from "../abi/DGMarketplaceAbi";
import { isEmpty } from "lodash";
import { AppDataSource } from "../db/data-source";

import { getBlastProvider } from "./providers.service";
import {
  nftSold,
  nftBought,
  nftCancel,
  nftPrice,
  nextNft,
  getSellerAddress,
  getResourceId,
  safeNftSold,
} from "./marketplace.service";

import * as thirdParyTransaction from "./thirdParyTransaction.service";

import {
  wsNotifyBlockchainEvents,
  notifyToMarketplace,
  notifyToDashboard,
} from "./webSocket.service";

import {
  TransactionLog,
  Seller,
  TransactionType,
  TransactionStatus,
  NftAddress,
  Calendar,
} from "../db/entity/index";

import { newError, newEvent, newErrorV2, newEventV2 } from "./discord.service";

import { ITransactionLog, IDgTransactionInfo } from "../interfaces";

import { TransactionDescription } from "ethers/lib/utils";
import { fetchAllTransactions, fetchTransactionCount } from "./graph.service";
import { getAdditionalData } from "./additionalData.service";
import { populateUri } from "./r2.Service";
dotenv.config();
const { LIVE_EVENTS_TIMESPAN } = process.env;

const liveEventsTimespan = LIVE_EVENTS_TIMESPAN
  ? +LIVE_EVENTS_TIMESPAN * 1000
  : 10000;

const transactionLogRepository = AppDataSource.getRepository(TransactionLog);
const sellerRepository = AppDataSource.getRepository(Seller);
const transactionTypeRepository = AppDataSource.getRepository(TransactionType);
const transactionStatusRepository =
  AppDataSource.getRepository(TransactionStatus);
const nftAddressRepository = AppDataSource.getRepository(NftAddress);
const calendarRepository = AppDataSource.getRepository(Calendar);

const blastProvider = getBlastProvider();

const IContract = new ethers.utils.Interface(abi);
let liveEventsDelay = new Date().getTime();

export const rebuildLostTransactions = async (
  isPolling = false
): Promise<void> => {
  try {
    const foundToDelete = await transactionLogRepository.find({
      where: {
        isValidated: false,
      },
    });
    if (foundToDelete.length > 0) {
      newEventV2({
        title: "Rebuild Transactions",
        description: `Found ${foundToDelete.length} transactions to delete`,
      });
      await transactionLogRepository.remove(foundToDelete);
    }
    const foundLastTx = await transactionLogRepository.find({
      select: ["id"],
      order: {
        id: "DESC",
      },
      take: 1,
    });
    const lastTxId = foundLastTx[0]?.id || 0;
    const allTx = await fetchAllTransactions({
      start: lastTxId || 0,
    });
    let currentTx = 0;
    const totalTx = allTx.length;
    for (const tx of allTx) {
      currentTx++;
      const {
        idNumber,
        blockId,
        buyerId,
        hash,
        nftAddress,
        price,
        recipientId,
        sellerId,
        timestamp,
        tokenId,
        transactionId,
        type,
        tokenURI,
      } = tx;
      const lowerType = type.toLowerCase();
      const transactionData: ITransactionLog = {
        id: idNumber,
        transactionHash: hash,
        blockNumber: +blockId,
        type: lowerType,
        timestamp: new Date(+timestamp * 1000),
        tokenId: tokenId,
        price: price,
        from: sellerId,
        to:
          buyerId !== "0x0000000000000000000000000000000000000000"
            ? buyerId
            : "",
        recipient:
          recipientId !== "0x0000000000000000000000000000000000000000"
            ? recipientId
            : "",
      };
      // Handle concurrent thegraph events
      const skipTransaction = await transactionLogRepository.findOne({
        where: {
          transactionHash: hash,
          tokenId,
          transactionType: {
            type: "cancel",
          },
        },
        relations: {
          transactionType: true,
        },
      });
      if (skipTransaction) {
        await transactionStarted(transactionData);
        await transactionCompleted({
          id: transactionData.id,
          nftAddress,
          isValidated: true,
        });
        continue;
      }
      await transactionStarted(transactionData);
      newEventV2({
        title: "Rebuild Transactions",
        description: `Transaction: ${currentTx} of ${totalTx} - Type: ${type} `,
        tokenId: tokenId,
        nftAddress: nftAddress,
      });
      switch (lowerType) {
        case "sell":
          const insertedNft = await safeNftSold({
            nftAddress,
            tokenId,
            from: sellerId,
            price,
          });
          if (!isEmpty(insertedNft)) {
            if (isPolling)
              handleSellNotifications({
                nftAddress,
                tokenId,
                from: sellerId,
              });
            try {
              await getAdditionalData({
                nftAddress,
                tokenId,
                token_uri: tokenURI,
              });
              await transactionCompleted({
                id: transactionData.id,
                nftAddress,
                isValidated: true,
              });
            } catch (error) {
              newErrorV2({
                title: "rebuildLostTransactions::getAdditionalData",
                description: `Could not get additional data for nftAddress: ${nftAddress} - tokenId ${tokenId} Error: ${error.message}`,
              });
              await transactionFailed({
                id: transactionData.id,
                nftAddress,
              });
            }
          } else {
            await transactionFailed({
              id: transactionData.id,
              nftAddress,
            });
          }
          break;
        case "buy":
          try {
            const resourceId = await getResourceId({
              nftAddress,
              tokenId,
            });
            const boughtedNft = await nftBought({
              nftAddress: nftAddress,
              tokenId: tokenId,
              to: recipientId,
              from: sellerId,
            });
            if (!isEmpty(boughtedNft)) {
              if (isPolling)
                handleBuyNotifications({
                  resourceId,
                  nftAddress,
                  tokenId,
                  from: sellerId,
                  to: recipientId,
                  transactionHash: hash,
                });
              await transactionCompleted({
                id: transactionData.id,
                nftAddress,
                isValidated: true,
              });
            } else {
              newErrorV2({
                title:
                  "NftBought - There were no listed nft for this transaction",
                description: `Could not do buy for nftAddress: ${nftAddress} - tokenId ${tokenId} Error: no nft listed`,
              });
              await transactionFailed({
                id: transactionData.id,
                nftAddress,
              });
            }
          } catch (error) {
            newErrorV2({
              title: "Rebuild Transactions - nftBought",
              description: `Could not do buy for nftAddress: ${nftAddress} - tokenId ${tokenId} Error: ${error.message}`,
            });
            await transactionFailed({
              id: transactionData.id,
              nftAddress,
            });
          }
          break;
        case "cancel":
          try {
            const resourceId = await getResourceId({
              nftAddress,
              tokenId,
            });
            const cancelledNft = await nftCancel({
              nftAddress: nftAddress,
              tokenId: tokenId,
            });
            if (!isEmpty(cancelledNft)) {
              if (isPolling)
                handleCancelNotifications({
                  nftAddress,
                  tokenId,
                  from: sellerId,
                  to: recipientId,
                  transactionHash: hash,
                  resourceId,
                });
              await transactionCompleted({
                id: transactionData.id,
                nftAddress: nftAddress,
                isValidated: true,
              });
            } else {
              newErrorV2({
                title:
                  "NftCancel - There were no listed nft for this transaction",
                description: `Could not do cancel for nftAddress: ${nftAddress} - tokenId ${tokenId} Error: no nft listed`,
              });
              await transactionFailed({
                id: transactionData.id,
                nftAddress: nftAddress,
              });
            }
          } catch (error) {
            newErrorV2({
              title:
                "NftCancel - There were no listed nft for this transaction",
              description: `Could not do cancel for nftAddress: ${nftAddress} - tokenId ${tokenId} Error: ${error.message}`,
            });
            await transactionFailed({
              id: transactionData.id,
              nftAddress: nftAddress,
            });
          }
          break;
        case "buyforgift":
          try {
            const resourceId = await getResourceId({
              nftAddress,
              tokenId,
            });
            const boughtedNft = await nftBought({
              nftAddress: nftAddress,
              tokenId: tokenId,
              to: recipientId,
              from: sellerId,
            });
            if (!isEmpty(boughtedNft)) {
              await transactionCompleted({
                id: transactionData.id,
                nftAddress,
                isValidated: true,
              });
              handleBuyNotifications({
                resourceId,
                nftAddress,
                tokenId,
                from: sellerId,
                to: recipientId,
                transactionHash: hash,
              });
            } else {
              newErrorV2({
                title:
                  "NftBought - There were no listed nft for this transaction",
                description: `Could not do buy for nftAddress: ${nftAddress} - tokenId ${tokenId} Error: no nft listed`,
              });
              await transactionFailed({
                id: transactionData.id,
                nftAddress,
              });
            }
          } catch (error) {
            newErrorV2({
              title: "Rebuild Transactions - nftBought",
              description: `Could not do buy for nftAddress: ${nftAddress} - tokenId ${tokenId} Error: ${error.message}`,
            });
            await transactionFailed({
              id: transactionData.id,
              nftAddress,
            });
          }
          break;
        default:
          console.log(lowerType);
          newErrorV2({
            title: `Rebuild Transactions - ${lowerType}`,
            description: `${lowerType} not implemented`,
          });
          break;
      }
    }
  } catch (err) {
    newError(`rebuildLostTransactions
    Error: ${err}`);
    console.error("rebuildLostTransactions::error: ", err);
  }
};

export const getTransactionDataParsed = async (
  txHash: string
): Promise<TransactionDescription> => {
  try {
    const tx = await blastProvider.getTransaction(txHash);
    return IContract.parseTransaction(tx as any);
  } catch (err) {
    console.error("getTransactionDataParsed::err ", err);
    newError(`getTransactionDataParsed
    Error: ${err}`);
    throw new Error("getTransactionDataParsed::err: " + err);
  }
};

const transactionStarted = async ({
  id,
  transactionHash,
  blockNumber,
  type,
  timestamp,
  from,
  to,
  recipient,
  price,
  tokenId,
  isValidated = false,
}: ITransactionLog): Promise<TransactionLog> => {
  try {
    const transactionLog = new TransactionLog();

    const foundFrom = await sellerRepository.findOne({
      where: {
        sellerAddress: from,
      },
    });
    let fromAddress: Seller;
    let foundTo: Seller;
    let toAddress: Seller;
    if (!foundFrom) {
      fromAddress = new Seller();
      fromAddress.sellerAddress = from;
      await sellerRepository.save(fromAddress);
    }
    if (type !== "sell") {
      const foundTo = await sellerRepository.findOne({
        where: {
          sellerAddress: to,
        },
      });
      if (!foundTo) {
        toAddress = new Seller();
        toAddress.sellerAddress = to;
        await sellerRepository.save(toAddress);
      }
    }

    let recipientAddress: Seller;
    let foundRecipient: Seller;
    if (recipient) {
      foundRecipient = await sellerRepository.findOne({
        where: {
          sellerAddress: recipient,
        },
      });
      if (!foundRecipient) {
        recipientAddress = new Seller();
        recipientAddress.sellerAddress = recipient;
        await sellerRepository.save(recipientAddress);
      }
    }

    const foundType = await transactionTypeRepository.findOne({
      where: {
        type,
      },
    });
    if (!foundType) {
      throw new Error(`Type not found: ${type}`);
    }
    const foundStatus = await transactionStatusRepository.findOne({
      where: {
        status: "pending",
      },
    });
    if (!foundStatus) {
      throw new Error(`Status not found: pending`);
    }
    const timestampDate = timestamp;
    const calDate = timestampDate.toISOString().split("T")[0];
    const foundCalendar = await calendarRepository.findOne({
      where: {
        calendarDate: calDate as any,
      },
    });
    transactionLog.id = id;
    transactionLog.transactionHash = transactionHash;
    transactionLog.blockNumber = blockNumber;
    // transactionLog.nftAddress = foundNftaddress;
    transactionLog.fromWallet = foundFrom || fromAddress;
    if (type !== "sell") transactionLog.toWallet = foundTo || toAddress;
    transactionLog.price = price;
    transactionLog.tokenId = tokenId;
    transactionLog.transactionType = foundType;
    transactionLog.transactionStatus = foundStatus;
    transactionLog.date = foundCalendar;
    transactionLog.createdAt = new Date(timestampDate);
    transactionLog.isValidated = isValidated;
    if (recipient)
      transactionLog.recipientWallet = foundRecipient || recipientAddress;
    // transactionLog.date = timestampDate;
    return await transactionLogRepository.save(transactionLog);
  } catch (err) {
    newErrorV2({
      title: "transactionStarted",
      description: `Error: ${err.message}`,
      tokenId: tokenId,
      extraData: JSON.stringify(
        {
          transactionHash,
          blockNumber,
          type,
          timestamp,
          from,
          to,
          recipient,
          price,
          tokenId,
          isValidated,
        },
        null,
        2
      ),
    });
    console.log("transactionStarted::err ", err);
    throw err;
  }
};

const transactionCompleted = async ({
  id,
  nftAddress,
  isValidated = false,
}: {
  id: number;
  nftAddress: string;
  isValidated?: boolean;
}): Promise<TransactionLog> => {
  try {
    const transactionLog = await transactionLogRepository.findOne({
      where: { id },
    });
    const foundStatus = await transactionStatusRepository.findOne({
      where: {
        status: "success",
      },
    });
    if (!foundStatus) {
      throw new Error(`Status not found: success`);
    }
    const foundNftaddress = await nftAddressRepository.findOne({
      where: {
        nftAddress,
      },
    });
    if (!foundNftaddress) {
      throw new Error(`NFT Address not found: ${nftAddress}`);
    }

    if (transactionLog) {
      transactionLog.transactionStatus = foundStatus;
      transactionLog.nftAddress = foundNftaddress;
      transactionLog.isValidated = isValidated;
    }
    return await transactionLogRepository.save(transactionLog);
  } catch (err) {
    newError(`transactionCompleted
    Error: ${err}`);
    console.error("transactionCompleted::err ", err);
    throw err;
  }
};

const transactionFailed = async ({
  id,
  nftAddress,
}: {
  id: number;
  nftAddress: string;
}): Promise<TransactionLog> => {
  try {
    const transactionLog = await transactionLogRepository.findOne({
      where: { id },
    });
    const foundStatus = await transactionStatusRepository.findOne({
      where: {
        status: "failed",
      },
    });
    if (!foundStatus) {
      throw new Error(`Status not found: fail`);
    }
    const foundNftaddress = await nftAddressRepository.findOne({
      where: {
        nftAddress,
      },
    });

    if (transactionLog) {
      transactionLog.transactionStatus = foundStatus;
      transactionLog.nftAddress = foundNftaddress || null;
    }
    return await transactionLogRepository.save(transactionLog);
  } catch (err) {
    newError(`transactionFaild
    Error: ${err}`);
    console.error("transactionFaild::err ", err);
  }
};

const validateTxWithGraph = async () => {
  try {
    const currentTime = new Date().getTime();
    if (currentTime >= liveEventsDelay + liveEventsTimespan) {
      liveEventsDelay = currentTime;
      const localTransactionsCount = await transactionLogRepository.count();
      const graphTransactionsCount = await fetchTransactionCount();
      if (localTransactionsCount < graphTransactionsCount) {
        newErrorV2({
          title: "Discrepancy between local and graph transactions count",
          description: `localTransactionsCount: ${localTransactionsCount}, graphTransactionsCount: ${graphTransactionsCount} - Will rebuild transactions`,
        });
        // rebuildLostTransactions();
      } else {
        await transactionLogRepository.update(
          {
            isValidated: false,
          },
          {
            isValidated: true,
          }
        );
      }
    }
  } catch (error) {
    newErrorV2({
      title: "Error on validateTxWithGraph",
      description: `Error on validateTxWithGraph: ${error.message}`,
    });
  }
};

// const handlePaperPurchaseNotifications = async ({
//   nftAddress,
//   tokenId,
//   from,
//   to,
//   transactionHash,
//   resourceId,
// }: {
//   nftAddress: string;
//   tokenId: string;
//   from: string;
//   to: string;
//   transactionHash: string;
//   resourceId: string;
// }) => {
//   try {
//     await thirdParyTransaction.updateThirdPartyTransaction({
//       status: "paid",
//       isPaper: true,
//       txHash: transactionHash,
//     });

//     const _sellerAddress = await getSellerAddress({
//       nftAddress,
//       tokenId,
//     });
//     await nftBought({
//       nftAddress,
//       tokenId,
//       to,
//       from,
//     });
//     await transactionCompleted({
//       transactionHash,
//       tokenId,
//       nftAddress,
//     });
//     // validateTxWithGraph();

//     const payload = await nextNft({
//       eventType: "buy",
//       resourceId,
//       sellerAddress: _sellerAddress,
//       tokenId,
//     });
//     notifyToMarketplace({
//       status: "success",
//       type: "buy",
//       payload,
//     });
//     notifyToDashboard({
//       status: "success",
//       type: "buy",
//       payload,
//     });
//     wsNotifyBlockchainEvents({
//       address: to,
//       status: "success",
//       type: "buy",
//       transactionHash,
//     });
//   } catch (err) {
//     newErrorV2({
//       title: "handlePaperPurchaseNotifications",
//       description: `failedTxHash: ${transactionHash} error: ${err.message}`,
//       tokenId: tokenId,
//       nftAddress: nftAddress,
//     });
//   }
// };

const handleSellNotifications = async ({
  nftAddress,
  tokenId,
  from,
}: {
  nftAddress: string;
  tokenId: string;
  from: string;
}) => {
  try {
    const resourceId = await getResourceId({
      nftAddress,
      tokenId,
    });
    const payload = await nextNft({
      eventType: "sell",
      resourceId,
      sellerAddress: from,
      tokenId: tokenId,
    });
    notifyToMarketplace({
      status: "success",
      type: "sell",
      payload,
    });
    notifyToDashboard({ status: "success", type: "sell", payload });
  } catch (err) {
    newErrorV2({
      title: "handleSellNotifications",
      description: `error: ${err.message}`,
      tokenId: tokenId,
      nftAddress: nftAddress,
    });
  }
};

// const handleBuyForGiftNotifications = async ({
//   nftAddress,
//   tokenId,
//   from,
//   to,
//   buyer,
//   transactionHash,
//   resourceId,
// }: {
//   nftAddress: string;
//   tokenId: string;
//   from: string;
//   to: string;
//   buyer: string;
//   transactionHash: string;
//   resourceId: string;
// }) => {
//   const _sellerAddress = await getSellerAddress({
//     tokenId,
//     nftAddress,
//   });
//   await nftBought({
//     nftAddress,
//     tokenId,
//     to,
//     from,
//   });

//   const payload = await nextNft({
//     eventType: "buyForGift",
//     resourceId,
//     sellerAddress: _sellerAddress,
//     tokenId,
//   });
//   notifyToMarketplace({
//     status: "success",
//     type: "buy",
//     payload,
//   });
//   notifyToDashboard({
//     status: "success",
//     type: "buy",
//     payload,
//   });
//   wsNotifyBlockchainEvents({
//     address: buyer,
//     status: "success",
//     type: "buy",
//     transactionHash,
//   });
// };

const handleBuyNotifications = async ({
  nftAddress,
  tokenId,
  from,
  to,
  transactionHash,
  resourceId,
}: {
  nftAddress: string;
  tokenId: string;
  from: string;
  to: string;
  transactionHash: string;
  resourceId: string;
}) => {
  await nftBought({
    nftAddress,
    tokenId,
    to,
    from,
  });
  const payload = await nextNft({
    eventType: "buy",
    resourceId,
    tokenId,
    sellerAddress: from,
  });
  notifyToMarketplace({
    status: "success",
    type: "buy",
    payload,
  });
  notifyToDashboard({
    status: "success",
    type: "buy",
    payload,
  });
  wsNotifyBlockchainEvents({
    address: to,
    status: "success",
    type: "buy",
    transactionHash,
  });
};

const handleCancelNotifications = async ({
  nftAddress,
  tokenId,
  from,
  to,
  transactionHash,
  resourceId,
}: {
  nftAddress: string;
  tokenId: string;
  from: string;
  to: string;
  transactionHash: string;
  resourceId: string;
}) => {
  wsNotifyBlockchainEvents({
    address: to,
    status: "success",
    type: "cancel",
    transactionHash,
  });
  const payload = await nextNft({
    eventType: "cancel",
    resourceId,
    sellerAddress: to,
    tokenId: tokenId,
  });
  notifyToDashboard({ status: "success", type: "sell", payload });
  notifyToMarketplace({
    status: "success",
    type: "cancel",
    payload,
  });
};

let isPolling = false;

export const startGraphPolling = () => {
  return new Promise((resolve, reject) => {
    setInterval(async () => {
      if (!isPolling) {
        isPolling = !isPolling;
        try {
          await rebuildLostTransactions(true);
          try {
          } catch (error) {
            newErrorV2({
              title: "populateUri",
              description: `Error: ${error.message}`,
            });
          }
          resolve(true);
        } catch (error) {
          newErrorV2({
            title: "Error on startGraphPolling",
            description: `Error: ${error.message}`,
          });
          reject(error);
          console.log("startGraphPolling::error: ", error);
        } finally {
          isPolling = !isPolling;
        }
      }
    }, 15000);
  });
};

export const startValidatePreprocessNfts = () => {
  return new Promise((resolve, reject) => {
    setInterval(async () => {
      if (!isPolling) {
        try {
          isPolling = !isPolling;
          await getAdditionalData();
          resolve(true);
        } catch (error) {
          newErrorV2({
            title: "getAdditionalData",
            description: `Error: ${error.message}`,
          });
          reject(error);
          console.log("startValidatePreprocessNfts::error: ", error);
        } finally {
          isPolling = !isPolling;
        }
      }
    }, 15000);
  });
};

export const initPopulateTokenUri = () => {
  setInterval(async () => {
    populateUri();
  }, 15000);
};
