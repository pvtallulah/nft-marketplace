import axios, { AxiosResponse } from "axios";
import { config } from "dotenv";
config();

const { SUBGRAPH_ENDPOINT, SUBGRAPH_VERSION } = process.env;

const http = axios.create({
  baseURL: `${SUBGRAPH_ENDPOINT}/${SUBGRAPH_VERSION}`,
});

interface GraphTransactionData {
  blockId: string;
  buyerId: string;
  hash: string;
  nftAddress: string;
  price: string;
  recipientId: string;
  sellerId: string;
  timestamp: string;
  tokenId: string;
  transactionId: string;
  type: string;
}

interface GraphTransactionsCount {
  count: string;
}

const fetchTransactions = async ({
  start,
  count,
  order,
  orderBy = "idNumber",
}: {
  start: number;
  count: number;
  order: string;
  orderBy?: string;
}): Promise<any> => {
  const query = `
                  {
                    transactions(first: ${count}, skip: ${start}, orderBy: ${orderBy}, orderDirection: ${order}) {
                      id
                      hash
                      blockNumber
                      idNumber
                      timestamp
                      type
                      blockNumber
                      buyer {
                        id
                      }
                      recipient {
                        id
                      }
                      seller {
                        id
                      }
                      price
                      nft {
                        id
                        nftAddress {
                          id
                        }
                        tokenId
                        tokenURI
                      }  
                    }
                  }`;
  // const query = `
  //   {
  //     transactions(first: ${count}, skip: ${start}, orderBy: ${orderBy}, orderDirection: ${order}) {
  //       id
  //       hash
  //       timestamp
  //       type
  //       blockNumber
  //       buyer {
  //         id
  //       }
  //       recipient {
  //         id
  //       }
  //       seller {
  //         id
  //       }
  //       price
  //       nft {
  //         id
  //         nftAddress {
  //           id
  //         }
  //         tokenId
  //         tokenURI
  //       }
  //     }
  //   }`;
  try {
    const res = await http.post<
      AxiosResponse<{ transactions: GraphTransactionData[] }>
    >("", {
      query,
    });
    return res.data.data.transactions.map((transaction: any) => {
      return {
        transactionId: transaction.id,
        idNumber: transaction.idNumber,
        hash: transaction.hash,
        timestamp: transaction.timestamp,
        type: transaction.type,
        blockId: transaction.blockNumber,
        sellerId: transaction.seller.id,
        price: transaction.price,
        nftAddress: transaction.nft.id.split("-")[0],
        tokenId: transaction.nft.tokenId,
        tokenURI: transaction.nft.tokenURI,
        buyerId: transaction.buyer ? transaction.buyer.id : "None",
        recipientId: transaction.recipient ? transaction.recipient.id : "None",
      };
    }) as any;
  } catch (err) {
    console.log(err);
    throw new Error(err);
  }
};

export const fetchAllTransactions = async ({
  start = 0,
  count = 1000,
  order = "asc",
}: {
  start: number;
  count?: number;
  order?: string;
}) => {
  const transactions: any = await fetchTransactions({ start, count, order });

  if (transactions.length === count) {
    const nextTransactions = await fetchAllTransactions({
      start: start + count,
      count,
      order,
    });
    transactions.push(...nextTransactions);
  }
  return transactions;
};

export const fetchTransactionCount = async (): Promise<number> => {
  try {
    const query = `
    {
      transactionCounter(id:"global") {
        count
      }
    }`;
    const res = await http.post<
      AxiosResponse<{ transactionCounter: { count: number } }>
    >("", {
      query,
    });
    return +res.data.data.transactionCounter.count;
  } catch (err) {
    throw err;
  }
};
