getMarketplaceSalesPerDay

SELECT calendarDate as date,IFNULL(sales, 0) as sales  FROM 
(SELECT calendarDate FROM calendar WHERE calendarDate BETWEEN '2022-12-01' AND '2022-12-30') a 
LEFT JOIN
(SELECT SUM(price) as sales,date FROM `transaction_log` as t WHERE transactionTypeId = 1   AND transactionStatusId = 2 AND date BETWEEN '2022-12-01' AND '2022-12-30' GROUP BY date) b 
ON a.calendarDate = b.date;



getMarketplaceNftSoldPerDay

SELECT calendarDate as date,IFNULL(amountSold, 0) as amountSold  FROM 
(SELECT calendarDate FROM calendar WHERE calendarDate BETWEEN '2022-12-01' AND '2022-12-30') a 
LEFT JOIN
(SELECT count(tokenId) as amountSold,date FROM `transaction_log` as t WHERE transactionTypeId = 1  AND transactionStatusId = 2 AND date BETWEEN '2022-12-01' AND '2022-12-30' GROUP BY date) b 
ON a.calendarDate = b.date;



getMarketplaceTotalSales

SELECT SUM(price) as sales FROM `transaction_log` WHERE transactionTypeId = 1   AND transactionStatusId = 2 AND date BETWEEN '2022-12-01' AND '2022-12-30';


getMarketplaceTotalNftSold

SELECT COUNT(tokenId) as sales FROM `transaction_log` WHERE transactionTypeId = 1   AND transactionStatusId = 2 AND date BETWEEN '2022-12-01' AND '2022-12-30';



getMarketplaceNftSoldRanking

SELECT nftAddress,name,revenue,amount FROM 
(SELECT nftAddressId,SUM(price) as revenue, count(tokenId) as amount FROM `transaction_log` as t WHERE transactionTypeId = 1   AND transactionStatusId = 2 AND date BETWEEN '2022-12-01' AND '2022-12-30' GROUP BY nftAddressId ORDER BY revenue DESC LIMIT 10) a 
LEFT JOIN 
nft_address ON a.nftAddressId = nft_address.id;


getMarketplaceRecentSales

SELECT name, price,nftAddress,date FROM 
(SELECT nftAddressId,price,date FROM `transaction_log` as t WHERE transactionTypeId = 1   AND transactionStatusId = 2 AND date BETWEEN '2022-12-01' AND '2022-12-30' ORDER BY date DESC) a
LEFT JOIN nft_address ON a.nftAddressId = nft_address.id ORDER BY date DESC LIMIT 10;


getMarketplaceGeneralActivity

SELECT name, price,nftAddress,date,type,created_at,fromWallet,toWallet FROM 
(SELECT nftAddressId,price,date,created_at,transaction_type.type as type,transactionTypeId,s.sellerAddress as fromWallet, seller.sellerAddress as toWallet,toWalletId FROM `transaction_log` as t LEFT JOIN transaction_type ON transaction_type.id = transactionTypeId LEFT JOIN seller s ON fromWalletId = s.id LEFT JOIN seller ON toWalletId = seller.id WHERE  transactionStatusId = 2 AND date BETWEEN '2022-12-01' AND '2022-12-30' ORDER BY date DESC ) a
LEFT JOIN nft_address ON a.nftAddressId = nft_address.id ORDER BY created_at DESC LIMIT 10;



getTokenActivity

SELECT transactionHash,price,created_at, type,s.sellerAddress as fromWallet, t.sellerAddress as toWallet FROM 
(SELECT * FROM `transaction_log` WHERE nftAddressId = (SELECT id FROM nft_address WHERE nft_address.nftAddress = "0xd26df4a1b2823cf3b703177cc691314c45177016") AND tokenId = 20 AND transactionStatusId = 2) a 
LEFT JOIN transaction_type ON a.transactionTypeId = transaction_type.id 
LEFT JOIN seller s ON s.id = a.fromWalletId
LEFT JOIN seller t ON t.id = a.toWalletId
ORDER BY created_at DESC LIMIT 10;


getNftCollectionTradedVolume

SELECT SUM(price) as volume FROM `transaction_log` WHERE transactionTypeId = 1   AND transactionStatusId = 2 AND nftAddressId = (SELECT nft_address.id FROM nft_address WHERE nft_address.nftAddress = "0xd26df4a1b2823cf3b703177cc691314c45177016");



getWalletRecentActivity

SELECT transactionHash,price,created_at, type,s.sellerAddress as fromWallet, t.sellerAddress as toWallet,status FROM 
(SELECT * FROM `transaction_log` WHERE fromWalletId = (SELECT id FROM seller WHERE sellerAddress = "0xEA5Fed1D0141F14DE11249577921b08783d6A360") OR toWalletId = (SELECT id FROM seller WHERE sellerAddress = "0xEA5Fed1D0141F14DE11249577921b08783d6A360") ) a 
LEFT JOIN transaction_type ON a.transactionTypeId = transaction_type.id 
LEFT JOIN seller s ON s.id = a.fromWalletId
LEFT JOIN seller t ON t.id = a.toWalletId
LEFT JOIN transaction_status ON a.transactionStatusId = transaction_status.id
ORDER BY created_at DESC LIMIT 500;