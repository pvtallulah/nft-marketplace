import { AppDataSource } from "../db/data-source";
import { SelectQueryBuilder } from "typeorm";
import {
  NftAddress,
  Seller,
  TransactionLog,
  Calendar,
  TransactionType,
  TransactionStatus,
} from "../db/entity";

// import { getAnalyticsDate } from "../utils";
import {
  IAnalyticsDates,
  IAnalyticsDatesWallet,
  IAnalyticsNftAddressTokenId,
  IAnalyticsNftAddress,
  IAnalyticsSellerAddress,
  IWalletRevenuePerDay,
  IWalletNftSoldPerDay,
  IWalletTotalRevenue,
  IWalletTotalNftSold,
  IWalletNftSoldRanking,
  IWalletRecentSales,
  IMarketplaceSalesPerDay,
  IMarketplaceNftSoldPerDay,
  IMarketplaceTotalSales,
  IMarketplaceTotalNftSold,
  IMarketplaceNftSoldRanking,
  IMarketplaceRecentSales,
  IMarketplaceGeneralActivity,
  ITokenActivity,
  ITradeVolume,
  IRecentActivity,
} from "../interfaces";

/*
   SELECT 
  calendarDate as date, 
  IFNULL(sales, 0) as sales 
FROM 
  (
    SELECT 
      calendarDate 
    FROM 
      calendar 
    WHERE 
      calendarDate BETWEEN '2022-12-01' 
      AND '2022-12-30'
  ) a 
  LEFT JOIN (
    SELECT 
      SUM(price) as sales, 
      dateCalendarDate
    FROM 
      `transaction_log` as t 
    WHERE 
      transactionTypeId = 1 
      AND fromWalletId = (
        SELECT 
          seller.id 
        FROM 
          seller 
        WHERE 
          seller.sellerAddress = "0x4F9FeB711b6C05DEd8751763B249bd782815f1CA"
      ) 
      AND transactionStatusId = 2 
      AND dateCalendarDate BETWEEN '2022-12-01' 
      AND '2022-12-30' 
    GROUP BY 
      dateCalendarDate
  ) b ON a.calendarDate = b.dateCalendarDate;

*/
export const getWalletRevenuePerDay = async ({
  from,
  to,
  walletAddress,
}: IAnalyticsDatesWallet): Promise<IWalletRevenuePerDay[]> => {
  try {
    const qb = AppDataSource.createQueryBuilder()
      .select([
        "calendarTable.date as date",
        "IFNULL(salesTable.sales, 0) as sales",
      ])
      .from((sq) => {
        return sq
          .select("calendarDate", "date")
          .from(Calendar, "calendar")
          .where("calendarDate >= :from")
          .andWhere("calendarDate <= :to");
      }, "calendarTable")
      .leftJoin(
        (sq) => {
          return sq
            .select("SUM(t.price)", "sales")
            .addSelect("t.dateCalendarDate", "date")
            .from(TransactionLog, "t")
            .where("t.transactionTypeId = 1")
            .andWhere((sq) => {
              const subQuery = sq
                .subQuery()
                .select("seller.id")
                .from(Seller, "seller")
                .where("seller.sellerAddress = :fromWalletId")
                .getQuery();
              return "t.fromWalletId = (" + subQuery + ")";
            })
            .andWhere("t.transactionStatusId = 2")
            .andWhere("t.dateCalendarDate")
            .andWhere("t.dateCalendarDate >= :from")
            .andWhere("t.dateCalendarDate <= :to")
            .groupBy("t.dateCalendarDate");
        },
        "salesTable",
        "calendarTable.date = salesTable.date"
      )
      .setParameters({
        from,
        to,
        fromWalletId: walletAddress,
      });
    const result = await qb.getRawMany<IWalletRevenuePerDay>();
    return result;
  } catch (err) {
    console.log(err);
  }
};

/*
SELECT calendarDate AS date,
       IFNULL(amountSold, 0) AS amountSold
FROM
  (SELECT calendarDate
   FROM calendar
   WHERE calendarDate BETWEEN '2022-12-01' AND '2022-12-30') a
LEFT JOIN
  (SELECT count(tokenId) AS amountSold,
  dateCalendarDate
   FROM `transaction_log` AS t
   WHERE transactionTypeId = 1
     AND fromWalletId =
       (SELECT seller.id
        FROM seller
        WHERE seller.sellerAddress = "0x4F9FeB711b6C05DEd8751763B249bd782815f1CA")
     AND transactionStatusId = 2
     AND dateCalendarDate BETWEEN '2022-12-01' AND '2022-12-30'
   GROUP BY dateCalendarDate) b ON a.calendarDate = b.dateCalendarDate;
*/
export const getWalletNftSoldPerDay = async ({
  from,
  to,
  walletAddress,
}: IAnalyticsDatesWallet): Promise<IWalletNftSoldPerDay[]> => {
  try {
    const qb = AppDataSource.createQueryBuilder()
      .select([
        "calendarTable.date as date",
        "IFNULL(salesTable.amountSold, 0) as amountSold",
      ])
      .from((sq) => {
        return sq
          .select("calendarDate", "date")
          .from(Calendar, "calendar")
          .where("calendarDate >= :from")
          .andWhere("calendarDate <= :to");
      }, "calendarTable")
      .leftJoin(
        (sq) => {
          return sq
            .select("COUNT(t.tokenId)", "amountSold")
            .addSelect("t.dateCalendarDate", "date")
            .from(TransactionLog, "t")
            .where("t.transactionTypeId = 1")
            .andWhere((sq) => {
              const subQuery = sq
                .subQuery()
                .select("seller.id")
                .from(Seller, "seller")
                .where("seller.sellerAddress = :fromWalletId")
                .getQuery();
              return "t.fromWalletId = (" + subQuery + ")";
            })
            .andWhere("t.transactionStatusId = 2")
            .andWhere("t.dateCalendarDate")
            .andWhere("t.dateCalendarDate >= :from")
            .andWhere("t.dateCalendarDate <= :to")
            .groupBy("t.dateCalendarDate");
        },
        "salesTable",
        "calendarTable.date = salesTable.date"
      )
      .setParameters({
        from,
        to,
        fromWalletId: walletAddress,
      });
    const result = await qb.getRawMany<IWalletNftSoldPerDay>();
    return result;
  } catch (err) {
    console.log(err);
  }
};

/*


SELECT SUM(price) AS sales
FROM `transaction_log`
WHERE transactionTypeId = 1
  AND fromWalletId =
    (SELECT seller.id
     FROM seller
     WHERE seller.sellerAddress = "0x4F9FeB711b6C05DEd8751763B249bd782815f1CA")
  AND transactionStatusId = 2
  AND date BETWEEN '2022-12-01' AND '2022-12-30';
*/
export const getWalletTotalRevenue = async ({
  from,
  to,
  walletAddress,
}: IAnalyticsDatesWallet): Promise<IWalletTotalRevenue> => {
  try {
    const qb = AppDataSource.getRepository(TransactionLog)
      .createQueryBuilder("transactionLog")
      .select("SUM(transactionLog.price)", "totalRevenue")
      .where("transactionLog.transactionTypeId = 1")
      .andWhere("transactionLog.transactionStatusId = 2")
      .andWhere("transactionLog.date >= :from")
      .andWhere("transactionLog.date <= :to")
      .andWhere((sq) => {
        const subQuery = sq
          .subQuery()
          .select("seller.id")
          .from(Seller, "seller")
          .where("seller.sellerAddress = :fromWalletId")
          .getQuery();
        return "transactionLog.fromWalletId = (" + subQuery + ")";
      })
      .setParameters({
        from,
        to,
        fromWalletId: walletAddress,
      });
    const result = await qb.getRawOne<IWalletTotalRevenue>();
    return result;
  } catch (err) {
    console.log(err);
  }
};

/*
SELECT COUNT(tokenId) AS sales
FROM `transaction_log`
WHERE transactionTypeId = 1
  AND fromWalletId =
    (SELECT seller.id
     FROM seller
     WHERE seller.sellerAddress = "0x4F9FeB711b6C05DEd8751763B249bd782815f1CA")
  AND transactionStatusId = 2
  AND date BETWEEN '2022-12-01' AND '2022-12-30';
*/
export const getWalletTotalNftSold = async ({
  from,
  to,
  walletAddress,
}: IAnalyticsDatesWallet): Promise<IWalletTotalNftSold> => {
  try {
    const qb = AppDataSource.getRepository(TransactionLog)
      .createQueryBuilder("transactionLog")
      .select("COUNT(transactionLog.tokenId)", "sales")
      .where("transactionLog.transactionTypeId = 1")
      .andWhere("transactionLog.transactionStatusId = 2")
      .andWhere("transactionLog.date >= :from")
      .andWhere("transactionLog.date <= :to")
      .andWhere((sq) => {
        const subQuery = sq
          .subQuery()
          .select("seller.id")
          .from(Seller, "seller")
          .where("seller.sellerAddress = :fromWalletId")
          .getQuery();
        return "transactionLog.fromWalletId = (" + subQuery + ")";
      })
      .setParameters({
        from,
        to,
        fromWalletId: walletAddress,
      });
    const result = await qb.getRawOne<IWalletTotalNftSold>();
    return result;
  } catch (err) {
    console.log(err);
  }
};

/*
SELECT nftAddress,
       name,
       revenue,
       amount
FROM
  (SELECT nftAddressId,
          SUM(price) AS revenue,
          count(tokenId) AS amount
   FROM `transaction_log` AS t
   WHERE transactionTypeId = 1
     AND fromWalletId =
       (SELECT seller.id
        FROM seller
        WHERE seller.sellerAddress = "0x4F9FeB711b6C05DEd8751763B249bd782815f1CA")
     AND transactionStatusId = 2
     AND dateCalendarDate BETWEEN '2022-12-01' AND '2022-12-30'
   GROUP BY nftAddressId
   ORDER BY revenue DESC
   LIMIT 10) a
LEFT JOIN nft_address ON a.nftAddressId = nft_address.id;
*/
export const getWalletNftSoldRanking = async ({
  from,
  to,
  walletAddress,
}: IAnalyticsDatesWallet): Promise<IWalletNftSoldRanking[]> => {
  try {
    const qb = AppDataSource.createQueryBuilder();
    qb.select(["nftAddress", "name", "revenue", "amount"])
      .from((sq) => {
        return sq
          .select([
            "nftAddressId",
            "SUM(price) AS revenue",
            "count(tokenId) AS amount",
          ])
          .from(TransactionLog, "t")
          .where("transactionTypeId = 1")
          .andWhere("transactionStatusId = 2")
          .andWhere("dateCalendarDate >= :from")
          .andWhere("dateCalendarDate <= :to")
          .andWhere((sq) => {
            const subQuery = sq
              .subQuery()
              .select("seller.id")
              .from(Seller, "seller")
              .where("seller.sellerAddress = :fromWalletId")
              .getQuery();
            return "t.fromWalletId = (" + subQuery + ")";
          })
          .groupBy("nftAddressId")
          .orderBy("revenue", "DESC")
          .limit(10);
      }, "rankingTable")
      .leftJoin(
        NftAddress,
        "nftAddress",
        "rankingTable.nftAddressId = nftAddress.id"
      )
      .setParameters({
        from,
        to,
        fromWalletId: walletAddress,
      });
    const result = await qb.getRawMany<IWalletNftSoldRanking>();
    return result;
  } catch (err) {
    console.log(err);
  }
};

/*
SELECT name,
       price,
       nftAddress,
       dateCalendarDate
FROM
  (SELECT nftAddressId,
          price,
          dateCalendarDate
   FROM `transaction_log` AS t
   WHERE transactionTypeId = 1
     AND fromWalletId =
       (SELECT seller.id
        FROM seller
        WHERE seller.sellerAddress = "0x4F9FeB711b6C05DEd8751763B249bd782815f1CA")
     AND transactionStatusId = 2
     AND dateCalendarDate BETWEEN '2022-12-01' AND '2022-12-30'
   ORDER BY dateCalendarDate DESC) a
LEFT JOIN nft_address ON a.nftAddressId = nft_address.id
ORDER BY dateCalendarDate DESC
LIMIT 10;
*/
export const getWalletRecentSales = async ({
  from,
  to,
  walletAddress,
}: IAnalyticsDatesWallet): Promise<IWalletRecentSales[]> => {
  try {
    const qb = AppDataSource.createQueryBuilder();
    qb.select(["name", "price", "nftAddress", "dateCalendarDate as date"])
      .from((sq) => {
        sq.select(["nftAddressId", "price", "dateCalendarDate"])
          .from(TransactionLog, "t")
          .where("transactionTypeId = 1")
          .andWhere("transactionStatusId = 2")
          .andWhere("dateCalendarDate >= :from")
          .andWhere("dateCalendarDate <= :to")
          .andWhere((sq) => {
            const subQuery = sq
              .subQuery()
              .select("seller.id")
              .from(Seller, "seller")
              .where("seller.sellerAddress = :fromWalletId")
              .getQuery();
            return "t.fromWalletId = (" + subQuery + ")";
          })
          .orderBy("dateCalendarDate", "DESC");
        return sq;
      }, "recentSalesTable")
      .leftJoin(
        NftAddress,
        "nftAddress",
        "recentSalesTable.nftAddressId = nftAddress.id"
      )
      .orderBy("dateCalendarDate", "DESC")
      .limit(10)
      .setParameters({
        from,
        to,
        fromWalletId: walletAddress,
      });
    const result = await qb.getRawMany<IWalletRecentSales>();
    return result;
  } catch (err) {
    console.log(err);
  }
};

// SELECT
//   calendarDate as date,
//   IFNULL(sales, 0) as sales
// FROM
//   (
//     SELECT
//       calendarDate
//     FROM
//       calendar
//     WHERE
//       calendarDate BETWEEN '2022-12-01'
//       AND '2022-12-30'
//   ) a
//   LEFT JOIN (
//     SELECT
//       SUM(price) as sales,
//       date
//     FROM
//       `transaction_log` as t
//     WHERE
//       transactionTypeId = 1
//       AND transactionStatusId = 2
//       AND date BETWEEN '2022-12-01'
//       AND '2022-12-30'
//     GROUP BY
//       date
//   ) b ON a.calendarDate = b.date;

// const analyticsDatesSql = ({
//   fromDate,
//   toDate,
// }: IAnalyticsDates): SelectQueryBuilder<Calendar> => {
//   const qb = AppDataSource.createQueryBuilder();
//   return qb
//     .select("calendarDate")
//     .from(Calendar, "calendar")
//     .where(`calendarDate >= ${fromDate}`)
//     .andWhere(`calendarDate <= ${toDate}`);
// };

export const getMarketplaceSalesPerDay = async ({
  from,
  to,
}: IAnalyticsDates): Promise<IMarketplaceSalesPerDay[]> => {
  try {
    const qb = AppDataSource.createQueryBuilder();
    qb.select(["calendarDate as date", "IFNULL(sales, 0) as sales"])
      .from((sq) => {
        return sq
          .select("calendarDate")
          .from(Calendar, "calendar")
          .where("calendarDate >= :from")
          .andWhere("calendarDate <= :to");
      }, "calendarTable")
      .leftJoin(
        (sq) => {
          return sq
            .select(["SUM(price) as sales", "dateCalendarDate as date"])
            .from(TransactionLog, "t")
            .where("t.transactionTypeId = 1")
            .andWhere("t.transactionStatusId = 2")
            .andWhere("t.dateCalendarDate >= :from")
            .andWhere("t.dateCalendarDate <= :to")
            .groupBy("dateCalendarDate");
        },
        "transactionTable",
        "calendarTable.calendarDate = transactionTable.date"
      )
      .setParameters({
        from,
        to,
      });
    const result = await qb.getRawMany<IMarketplaceSalesPerDay>();
    return result;
  } catch (err) {
    console.log(err);
  }
};

/*
SELECT 
  calendarDate as date, 
  IFNULL(amountSold, 0) as amountSold 
FROM 
  (
    SELECT 
      calendarDate 
    FROM 
      calendar 
    WHERE 
      calendarDate BETWEEN '2022-12-01' 
      AND '2022-12-30'
  ) a 
  LEFT JOIN (
    SELECT 
      count(tokenId) as amountSold, 
      dateCalendarDate 
    FROM 
      `transaction_log` as t 
    WHERE 
      transactionTypeId = 1 
      AND transactionStatusId = 2 
      AND dateCalendarDate BETWEEN '2022-12-01' 
      AND '2022-12-30' 
    GROUP BY 
      dateCalendarDate
  ) b ON a.calendarDate = b.dateCalendarDate;

*/
export const getMarketplaceNftSoldPerDay = async ({
  from,
  to,
}: IAnalyticsDates): Promise<IMarketplaceNftSoldPerDay[]> => {
  try {
    const qb = AppDataSource.createQueryBuilder();
    qb.select(["calendarDate as date", "IFNULL(amountSold, 0) as amountSold"])
      .from((sq) => {
        return sq
          .select("calendarDate")
          .from(Calendar, "calendar")
          .where("calendarDate >= :from")
          .andWhere("calendarDate <= :to");
      }, "calendarTable")
      .leftJoin(
        (sq) => {
          return sq
            .select([
              "count(tokenId) as amountSold",
              "dateCalendarDate as date",
            ])
            .from(TransactionLog, "t")
            .where("t.transactionTypeId = 1")
            .andWhere("t.transactionStatusId = 2")
            .andWhere("t.dateCalendarDate >= :from")
            .andWhere("t.dateCalendarDate <= :to")
            .groupBy("t.dateCalendarDate");
        },
        "transactionTable",
        "calendarTable.calendarDate = transactionTable.date"
      )
      .setParameters({
        from,
        to,
      });
    const result = await qb.getRawMany<IMarketplaceNftSoldPerDay>();
    return result;
  } catch (err) {
    console.log(err);
  }
};

/*
SELECT 
  SUM(price) as sales 
FROM 
  `transaction_log` 
WHERE 
  transactionTypeId = 1 
  AND transactionStatusId = 2 
  AND dateCalendarDate BETWEEN '2022-12-01' 
  AND '2022-12-30';

*/
export const getMarketplaceTotalSales = async ({
  from,
  to,
}: IAnalyticsDates): Promise<IMarketplaceTotalSales> => {
  try {
    const qb = AppDataSource.createQueryBuilder();
    qb.select("sum(price)", "sales")
      .from(TransactionLog, "t")
      .where("t.transactionTypeId = 1")
      .andWhere("t.transactionStatusId = 2")
      .andWhere("t.dateCalendarDate >= :from")
      .andWhere("t.dateCalendarDate <= :to")
      .setParameters({
        from,
        to,
      });
    const result = await qb.getRawOne<IMarketplaceTotalSales>();
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

/*
SELECT 
  COUNT(tokenId) as sales 
FROM 
  `transaction_log` 
WHERE 
  transactionTypeId = 1 
  AND transactionStatusId = 2 
  AND date BETWEEN '2022-12-01' 
  AND '2022-12-30';

*/
export const getMarketplaceTotalNftSold = async ({
  from,
  to,
}: IAnalyticsDates): Promise<IMarketplaceTotalNftSold> => {
  try {
    const qb = AppDataSource.createQueryBuilder();
    qb.select("count(tokenId)", "sales")
      .from(TransactionLog, "t")
      .where("t.transactionTypeId = 1")
      .andWhere("t.transactionStatusId = 2")
      .andWhere("t.dateCalendarDate >= :from")
      .andWhere("t.dateCalendarDate <= :to")
      .setParameters({
        from,
        to,
      });
    const result = await qb.getRawMany<IMarketplaceTotalNftSold>();
    return result[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
};

/*
SELECT 
  nftAddress, 
  name, 
  revenue, 
  amount 
FROM 
  (
    SELECT 
      nftAddressId, 
      SUM(price) as revenue, 
      count(tokenId) as amount 
    FROM 
      `transaction_log` as t 
    WHERE 
      transactionTypeId = 1 
      AND transactionStatusId = 2 
      AND dateCalendarDate BETWEEN '2022-12-01' 
      AND '2022-12-30' 
    GROUP BY 
      nftAddressId 
    ORDER BY 
      revenue DESC 
    LIMIT 
      10
  ) a 
  LEFT JOIN nft_address ON a.nftAddressId = nft_address.id;
*/
export const getMarketplaceNftSoldRanking = async ({
  from,
  to,
}: IAnalyticsDates): Promise<IMarketplaceNftSoldRanking[]> => {
  try {
    const qb = AppDataSource.createQueryBuilder();
    qb.select(["nftAddress", "name", "revenue", "amount"])
      .from((sq) => {
        return sq
          .select([
            "nftAddressId",
            "SUM(price) as revenue",
            "COUNT(tokenId) as amount",
          ])
          .from(TransactionLog, "t")
          .where("t.transactionTypeId = 1")
          .andWhere("t.transactionStatusId = 2")
          .andWhere("t.dateCalendarDate >= :from")
          .andWhere("t.dateCalendarDate <= :to")
          .groupBy("nftAddressId")
          .orderBy("revenue", "DESC")
          .limit(10);
      }, "transactionTable")
      .leftJoin(NftAddress, "n", "n.id = transactionTable.nftAddressId")
      .setParameters({
        from,
        to,
      });
    const results = await qb.getRawMany<IMarketplaceNftSoldRanking>();
    return results;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

/*
SELECT 
  name, 
  price, 
  nftAddress, 
  date 
FROM 
  (
    SELECT 
      nftAddressId, 
      price, 
      date 
    FROM 
      `transaction_log` as t 
    WHERE 
      transactionTypeId = 1 
      AND transactionStatusId = 2 
      AND date BETWEEN '2022-12-01' 
      AND '2022-12-30' 
    ORDER BY 
      date DESC
  ) a 
  LEFT JOIN nft_address ON a.nftAddressId = nft_address.id 
ORDER BY 
  date DESC 
LIMIT 
  10;

  */
export const getMarketplaceRecentSales = async ({
  from,
  to,
}: IAnalyticsDates): Promise<IMarketplaceRecentSales[]> => {
  try {
    const qb = AppDataSource.createQueryBuilder();
    qb.select(["name", "price", "nftAddress", "date"])
      .from((sq) => {
        return sq
          .select(["nftAddressId", "price", "dateCalendarDate as date"])
          .from(TransactionLog, "t")
          .where("t.transactionTypeId = 1")
          .andWhere("t.transactionStatusId = 2")
          .andWhere("t.dateCalendarDate >= :from")
          .andWhere("t.dateCalendarDate <= :to")
          .orderBy("date", "DESC");
      }, "transactionTable")
      .leftJoin(NftAddress, "n", "n.id = transactionTable.nftAddressId")
      .orderBy("date", "DESC")
      .limit(10)
      .setParameters({
        from,
        to,
      });
    const results = await qb.getRawMany<IMarketplaceRecentSales>();
    return results;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

/*
SELECT 
  name, 
  price, 
  nftAddress, 
  date, 
  type, 
  created_at, 
  fromWallet, 
  toWallet 
FROM 
  (
    SELECT 
      nftAddressId, 
      price, 
      dateCalendarDate as date, 
      created_at, 
      transaction_type.type as type, 
      transactionTypeId, 
      s.sellerAddress as fromWallet, 
      seller.sellerAddress as toWallet, 
      toWalletId 
    FROM 
      `transaction_log` as t 
      LEFT JOIN transaction_type ON transaction_type.id = transactionTypeId 
      LEFT JOIN seller s ON fromWalletId = s.id 
      LEFT JOIN seller ON toWalletId = seller.id 
    WHERE 
      transactionStatusId = 2 
      AND dateCalendarDate BETWEEN '2022-12-01' 
      AND '2022-12-30' 
    ORDER BY 
      date DESC
  ) a 
  LEFT JOIN nft_address ON a.nftAddressId = nft_address.id 
ORDER BY 
  created_at DESC 
LIMIT 
  10;
*/

export const getMarketplaceGeneralActivity = async ({
  from,
  to,
}: IAnalyticsDates): Promise<IMarketplaceGeneralActivity[]> => {
  try {
    const qb = AppDataSource.createQueryBuilder();
    qb.select([
      "name",
      "price",
      "nftAddress",
      "date",
      "type",
      "createdAt",
      "fromWallet",
      "toWallet",
    ])
      .from((sq) => {
        return sq
          .select([
            "nftAddressId",
            "price",
            "dateCalendarDate as date",
            "createdAt",
            "tt.type as type",
            "transactionTypeId",
            "sellerFrom.sellerAddress as fromWallet",
            "sellerTo.sellerAddress as toWallet",
            "toWalletId",
          ])
          .from(TransactionLog, "t")
          .leftJoin(TransactionType, "tt", "tt.id = t.transactionTypeId")
          .leftJoin(Seller, "sellerFrom", "sellerFrom.id = t.fromWalletId")
          .leftJoin(Seller, "sellerTo", "sellerTo.id = t.toWalletId")
          .where("t.transactionStatusId = 2")
          .andWhere("t.dateCalendarDate >= :from")
          .andWhere("t.dateCalendarDate <= :to")
          .orderBy("date", "ASC");
      }, "transactionTable")
      .leftJoin(NftAddress, "n", "n.id = transactionTable.nftAddressId")
      .orderBy("createdAt", "DESC")
      .limit(10)
      .setParameters({
        from,
        to,
      });
    const results = await qb.getRawMany<IMarketplaceGeneralActivity>();
    return results;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

/*
SELECT 
  transactionHash, 
  price, 
  createdAt, 
  type, 
  s.sellerAddress as fromWallet, 
  t.sellerAddress as toWallet 
FROM 
  (
    SELECT 
      * 
    FROM 
      `transaction_log` 
    WHERE 
      nftAddressId = (
        SELECT 
          id 
        FROM 
          nft_address 
        WHERE 
          nft_address.nftAddress = "0xd26df4a1b2823cf3b703177cc691314c45177016"
      ) 
      AND tokenId = 20 
      AND transactionStatusId = 2
  ) a 
  LEFT JOIN transaction_type ON a.transactionTypeId = transaction_type.id 
  LEFT JOIN seller s ON s.id = a.fromWalletId 
  LEFT JOIN seller t ON t.id = a.toWalletId 
ORDER BY 
  createdAt DESC 
LIMIT 
  10;
*/
export const getTokenActivity = async ({
  nftAddress,
  tokenId,
}: IAnalyticsNftAddressTokenId): Promise<ITokenActivity[]> => {
  try {
    const qb = AppDataSource.createQueryBuilder();
    qb.select([
      "transactionHash",
      "price",
      "createdAt",
      "type",
      "sellerFrom.sellerAddress as fromWallet",
      "sellerTo.sellerAddress as toWallet",
    ])
      .from((sq) => {
        return sq
          .select()
          .from(TransactionLog, "transactionTable")
          .where((sq) => {
            const subQuery = sq
              .subQuery()
              .select("id")
              .from(NftAddress, "nftAddress")
              .where("nftAddress.nftAddress = :nftAddress")
              .setParameter("nftAddress", nftAddress)
              .getQuery();
            return "transactionTable.nftAddressId = (" + subQuery + ")";
          })
          .andWhere("transactionTable.tokenId = :tokenId")
          .andWhere("transactionTable.transactionStatusId = 2");
      }, "transactionTable")
      .leftJoin(
        TransactionType,
        "tt",
        "tt.id = transactionTable.transactionTypeId"
      )
      .leftJoin(
        Seller,
        "sellerFrom",
        "sellerFrom.id = transactionTable.fromWalletId"
      )
      .leftJoin(Seller, "sellerTo", "sellerTo.id = transactionTable.toWalletId")
      .orderBy("createdAt", "DESC")
      .limit(10)
      .setParameters({
        tokenId,
      });
    const results = await qb.getRawMany<ITokenActivity>();
    return results;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

/*
SELECT 
  SUM(price) as volume 
FROM 
  `transaction_log` 
WHERE 
  transactionTypeId = 1 
  AND transactionStatusId = 2 
  AND nftAddressId = (
    SELECT 
      nft_address.id 
    FROM 
      nft_address 
    WHERE 
      nft_address.nftAddress = "0xd26df4a1b2823cf3b703177cc691314c45177016"
  );

*/
export const getNftCollectionTradedVolume = async ({
  nftAddress,
}: IAnalyticsNftAddress): Promise<ITradeVolume> => {
  try {
    const qb = AppDataSource.createQueryBuilder();
    qb.select("SUM(price) as volume")
      .from(TransactionLog, "transactionTable")
      .where("transactionTable.transactionTypeId = 1")
      .andWhere("transactionTable.transactionStatusId = 2")
      .andWhere((sq) => {
        const subQuery = sq
          .subQuery()
          .select("id")
          .from(NftAddress, "nftAddress")
          .where("nftAddress.nftAddress = :nftAddress")
          .setParameter("nftAddress", nftAddress)
          .getQuery();
        return "transactionTable.nftAddressId = (" + subQuery + ")";
      });
    const result = await qb.getRawOne<ITradeVolume>();
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
};
/*
SELECT 
  transactionHash, 
  price, 
  createdAt, 
  type, 
  s.sellerAddress as fromWallet, 
  t.sellerAddress as toWallet, 
  status 
FROM 
  (
    SELECT 
      * 
    FROM 
      `transaction_log` 
    WHERE 
      fromWalletId = (
        SELECT 
          id 
        FROM 
          seller 
        WHERE 
          sellerAddress = "0xEA5Fed1D0141F14DE11249577921b08783d6A360"
      ) 
      OR toWalletId = (
        SELECT 
          id 
        FROM 
          seller 
        WHERE 
          sellerAddress = "0xEA5Fed1D0141F14DE11249577921b08783d6A360"
      )
  ) a 
  LEFT JOIN transaction_type ON a.transactionTypeId = transaction_type.id 
  LEFT JOIN seller s ON s.id = a.fromWalletId 
  LEFT JOIN seller t ON t.id = a.toWalletId 
  LEFT JOIN transaction_status ON a.transactionStatusId = transaction_status.id 
ORDER BY 
  createdAt DESC 
LIMIT 
  500;

*/
export const getWalletRecentActivity = async ({
  sellerAddress,
}: IAnalyticsSellerAddress): Promise<IRecentActivity[]> => {
  try {
    const qb = AppDataSource.createQueryBuilder();
    qb.select([
      "transactionHash",
      "price",
      "createdAt",
      "type",
      "sellerFrom.sellerAddress as fromWallet",
      "sellerTo.sellerAddress as toWallet",
      "status",
    ])
      .from((sq) => {
        return sq
          .select()
          .from(TransactionLog, "transactionTable")
          .where((sq) => {
            const subQuery = sq
              .subQuery()
              .select("id")
              .from(Seller, "seller")
              .where("seller.sellerAddress = :sellerAddress")
              .setParameter("sellerAddress", sellerAddress)
              .getQuery();
            return (
              "transactionTable.fromWalletId = (" +
              subQuery +
              ") OR transactionTable.toWalletId = (" +
              subQuery +
              ")"
            );
          });
      }, "activityTable")
      .leftJoin(
        TransactionType,
        "tt",
        "tt.id = activityTable.transactionTypeId"
      )
      .leftJoin(
        Seller,
        "sellerFrom",
        "sellerFrom.id = activityTable.fromWalletId"
      )
      .leftJoin(Seller, "sellerTo", "sellerTo.id = activityTable.toWalletId")
      .leftJoin(
        TransactionStatus,
        "ts",
        "ts.id = activityTable.transactionStatusId"
      )
      .orderBy("createdAt", "DESC")
      .limit(500);
    const results = await qb.getRawMany<IRecentActivity>();
    return results;
  } catch (err) {
    console.log(err);
    throw err;
  }
};
