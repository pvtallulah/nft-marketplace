getWalletRevenuePerDay

SELECT calendarDate as date,IFNULL(sales, 0) as sales  FROM 
(SELECT calendarDate FROM calendar WHERE calendarDate BETWEEN '2022-12-01' AND '2022-12-30') a 
LEFT JOIN
(SELECT SUM(price) as sales, date FROM `transaction_log` as t WHERE transactionTypeId = 1 AND fromWalletId = (SELECT seller.id FROM seller WHERE seller.sellerAddress = "0x4F9FeB711b6C05DEd8751763B249bd782815f1CA")  AND transactionStatusId = 2 AND date BETWEEN '2022-12-01' AND '2022-12-30' GROUP BY date) b 
ON a.calendarDate = b.date;



getWalletNftSoldPerDay

SELECT calendarDate as date,IFNULL(amountSold, 0) as amountSold  FROM 
(SELECT calendarDate FROM calendar WHERE calendarDate BETWEEN '2022-12-01' AND '2022-12-30') a 
LEFT JOIN
(SELECT SUM(price) as sales, date FROM `transaction_log` as t WHERE transactionTypeId = 1 AND fromWalletId = (SELECT seller.id FROM seller WHERE seller.sellerAddress = "0x4F9FeB711b6C05DEd8751763B249bd782815f1CA")  AND transactionStatusId = 2 AND date BETWEEN '2022-12-01' AND '2022-12-30' GROUP BY date) b 
ON a.calendarDate = b.date;



getWalletTotalRevenue

SELECT SUM(price) as sales FROM `transaction_log` WHERE transactionTypeId = 1 AND fromWalletId = (SELECT seller.id FROM seller WHERE seller.sellerAddress = "0x4F9FeB711b6C05DEd8751763B249bd782815f1CA")  AND transactionStatusId = 2 AND date BETWEEN '2022-12-01' AND '2022-12-30';



getWalletTotalNftSold

SELECT COUNT(tokenId) as sales FROM `transaction_log` WHERE transactionTypeId = 1 AND fromWalletId = (SELECT seller.id FROM seller WHERE seller.sellerAddress = "0x4F9FeB711b6C05DEd8751763B249bd782815f1CA")  AND transactionStatusId = 2 AND date BETWEEN '2022-12-01' AND '2022-12-30';



getWalletNftSoldRanking

SELECT nftAddress,name,revenue,amount FROM 
(SELECT nftAddressId,SUM(price) as revenue, count(tokenId) as amount FROM `transaction_log` as t WHERE transactionTypeId = 1 AND fromWalletId = (SELECT seller.id FROM seller WHERE seller.sellerAddress = "0x4F9FeB711b6C05DEd8751763B249bd782815f1CA")  AND transactionStatusId = 2 AND date BETWEEN '2022-12-01' AND '2022-12-30' GROUP BY nftAddressId ORDER BY revenue DESC LIMIT 10) a 
LEFT JOIN 
nft_address ON a.nftAddressId = nft_address.id;



getWalletRecentSales
SELECT name, price,nftAddress,date FROM 
(SELECT nftAddressId,price,date FROM `transaction_log` as t WHERE transactionTypeId = 1 AND fromWalletId = (SELECT seller.id FROM seller WHERE seller.sellerAddress = "0x4F9FeB711b6C05DEd8751763B249bd782815f1CA")  AND transactionStatusId = 2 AND date BETWEEN '2022-12-01' AND '2022-12-30' ORDER BY date DESC) a
LEFT JOIN nft_address ON a.nftAddressId = nft_address.id ORDER BY date DESC LIMIT 10;

