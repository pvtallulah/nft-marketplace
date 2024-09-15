import { WalletActivity, WalletActivityResponse } from "interfaces";
import { AppDataSource } from "../db/data-source";
import { TransactionLog } from "../db/entity";

export const walletActivity = async (
  address: string,
  skip: string = "0",
  take: string = "10"
): Promise<WalletActivityResponse> => {
  const activityQuery = AppDataSource.createQueryBuilder(
    TransactionLog,
    "transaction_log"
  )
    .innerJoinAndSelect("transaction_log.transactionType", "transactionType")
    .innerJoinAndSelect("transaction_log.nftAddress", "nftAddress")
    .leftJoinAndSelect("transaction_log.fromWallet", "seller")
    .leftJoinAndSelect("transaction_log.recipientWallet", "recipient")
    .where(
      "seller.sellerAddress = :address OR recipient.sellerAddress = :address",
      { address }
    )
    .orderBy("transaction_log.createdAt", "DESC")
    .skip(parseInt(skip))
    .take(parseInt(take));

  const [activities, total] = await activityQuery.getManyAndCount();
  const walletActivity: WalletActivity[] = activities.map((activity) => {
    const {
      fromWallet,
      recipientWallet,
      transactionType,
      nftAddress,
      ...rest
    } = activity;
    return {
      ...rest,
      nftAddress: nftAddress.nftAddress,
      from: fromWallet?.sellerAddress || "",
      to: recipientWallet?.sellerAddress || "",
      type: transactionType.type,
    };
  });
  return { walletActivity, total };
};
