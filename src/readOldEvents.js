const dotenv = require("dotenv");
const ethers = require("ethers");
const abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_nftAddress",
        type: "address",
      },
      {
        internalType: "uint256[]",
        name: "_tokenIds",
        type: "uint256[]",
      },
    ],
    name: "buy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_nftAddress",
        type: "address",
      },
      {
        internalType: "uint256[]",
        name: "_tokenIds",
        type: "uint256[]",
      },
    ],
    name: "cancel",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20",
        name: "_acceptedToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_feeOwner",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_fee",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_nftAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256[]",
        name: "_tokenIds",
        type: "uint256[]",
      },
    ],
    name: "Buy",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_nftAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256[]",
        name: "_tokenIds",
        type: "uint256[]",
      },
    ],
    name: "Cancel",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "userAddress",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "functionSignature",
        type: "bytes",
      },
      {
        internalType: "bytes32",
        name: "sigR",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "sigS",
        type: "bytes32",
      },
      {
        internalType: "uint8",
        name: "sigV",
        type: "uint8",
      },
    ],
    name: "executeMetaTransaction",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "userAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address payable",
        name: "relayerAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "functionSignature",
        type: "bytes",
      },
    ],
    name: "MetaTransactionExecuted",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "onERC721Received",
    outputs: [
      {
        internalType: "bytes4",
        name: "",
        type: "bytes4",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_nftAddress",
        type: "address",
      },
      {
        internalType: "uint256[]",
        name: "_tokenIds",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "_prices",
        type: "uint256[]",
      },
    ],
    name: "sell",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_nftAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256[]",
        name: "_tokenIds",
        type: "uint256[]",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "_prices",
        type: "uint256[]",
      },
    ],
    name: "Sell",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_newFee",
        type: "uint256",
      },
    ],
    name: "setFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "_oldFee",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_newFee",
        type: "uint256",
      },
    ],
    name: "SetFee",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_newFeeOwner",
        type: "address",
      },
    ],
    name: "setFeeOwner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_oldFeeOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_newFeeOwner",
        type: "address",
      },
    ],
    name: "SetFeeOwner",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "fallback",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "withdrawERC20",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_nftAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "withdrawERC721",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "acceptedToken",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "BASE_FEE",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "fee",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feeOwner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_user",
        type: "address",
      },
    ],
    name: "getNonce",
    outputs: [
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_nftAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_tokenId",
        type: "uint256",
      },
    ],
    name: "getPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_nftAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_tokenId",
        type: "uint256",
      },
    ],
    name: "isActive",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "orderbook",
    outputs: [
      {
        internalType: "bool",
        name: "active",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "beneficiary",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
c = console.log;
dotenv.config();

const { ALCHEMY_API_KEY, MARKETPLACE_ADDRESS } = process.env;

const provider = new ethers.providers.AlchemyProvider("matic", ALCHEMY_API_KEY);
const contract = new ethers.Contract(MARKETPLACE_ADDRESS, abi, provider);

let iface = new ethers.utils.Interface(abi);
const buyEventTopic = ethers.utils.id("Buy(address,uint256[])");
const sellEventTopic = ethers.utils.id("Sell(address,uint256[],uint256[])");
const cancelEventTopic = ethers.utils.id("Cancel(address,uint256[])");

const metaTransactionExecutedEventTopic = ethers.utils.id(
  "MetaTransactionExecuted(address,address,bytes)"
);

const IExecuteMetaTransaction = new ethers.utils.Interface([
  "function executeMetaTransaction(address,bytes,bytes32,bytes32,uint8)",
]);
// contract.filters.Transfer(MARKETPLACE_ADDRESS);

const initEvts = async () => {
  // try {
  //   // And query:
  //   let filterAll = {
  //     address: MARKETPLACE_ADDRESS,
  //     fromBlock: provider.getBlockNumber().then((b) => b - 10000),
  //     toBlock: "latest",
  //   };
  //   provider.getLogs(filterAll).then((logs) => {
  //     console.log(logs);
  //   });
  //   // let tst = await contract.filters.Buy(MARKETPLACE_ADDRESS);
  //   // let events = await contract.queryFilter(tst);
  //   // c(events);
  //   // c(tst);
  //   //
  // } catch (error) {
  //   c.log("error", error);
  // }
  let filter = {
    topics: [
      metaTransactionExecutedEventTopic,
      ethers.utils.hexZeroPad(MARKETPLACE_ADDRESS, 32),
    ],
  };
  let res2 = await contract.queryFilter(filter, 0, "latest");
  c(res2);
  return;
  contract.on("MetaTransactionExecuted", async (_, __, ____, event) => {
    console.log("NEW MetaTransactionExecuted: ");
    try {
      const { transactionHash, blockNumber } = event;
    } catch (error) {
      console.log("Sell event error: ", error);

      throw new Error(error);
    }
  });

  contract.on("Sell", async (_, __, ____, event) => {
    console.log(event);
  });

  contract.on("Buy", async (_, __, event) => {
    console.log(event);
  });

  contract.on("Cancel", async (_, tokenIdHexa, event) => {
    console.log(event);
    const { transactionHash, blockNumber } = event;
  });
  let res = await provider.resetEventsBlock(0);
  console.log(res);
};

initEvts();

const initevt2 = async () => {
  const iface = new ethers.utils.Interface(abi);
  const logs = await provider.getLogs({
    fromBlock: 0,
    toBlock: "latest",
    address: contract.address,
    topics: [metaTransactionExecutedEventTopic],
  });
  for (const log of logs) {
    try {
      const parsedlog = iface.parseLog(log);
      const logData = log.data;
      const { topic, eventFragment } = parsedlog;
      const asd = iface.decodeEventLog(eventFragment, logData, [topic]);
      console.log(asd);
      c(parsedlog);
    } catch (error) {
      console.log(error);
    }
    const { type, transactionHash, blockNumber } = log;
    const txData = await getTransactionData(transactionHash);
    const { from, to, data } = txData;
    const ddata = decodeMetaTxData(data);
    c(txData);
    c(ddata);
  }
  return [fromAddresses, toAddresses, amounts];
};

const decodeMetaTxData = (data) => {
  const res = IExecuteMetaTransaction.decodeFunctionData(
    "executeMetaTransaction",
    data
  );
  return res;
};
const getTransactionData = async (txHash) => {
  try {
    return await provider.getTransaction(txHash);
  } catch (err) {
    console.log("getTransactionData::err ", err);
    throw new Error("getTransactionData::err: " + err);
  }
};

initevt2();
// provider.resetEventsBlock(0);
// provider.poll();

// const filterSell = {
//   address: tokenAddress,
//   topics: [
//     utils.id("Transfer(address,address,uint256)"),
//     hexZeroPad(myAddress, 32),
//   ],
// };

// // List all token transfers  *to*  myAddress:
// const filterSBuy = {
//   address: tokenAddress,
//   topics: [
//     utils.id("Transfer(address,address,uint256)"),
//     null,
//     hexZeroPad(myAddress, 32),
//   ],
// };
// let events = provider.allEvents({ fromBlock: 0, toBlock: "latest" });
// console.log(events);
