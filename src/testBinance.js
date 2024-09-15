const axios = require("axios");
const dotenv = require("dotenv");
const crypto = require("crypto");

dotenv.config();

const { BINANCE_API_KEY, BINANCE_API_SECRET } = process.env;
const http = axios.create({
  baseURL: "https://bpay.binanceapi.com",
});

function randomString() {
  return crypto.randomBytes(32).toString("hex").substring(0, 32);
}

function hashSignature(queryString) {
  return crypto
    .createHmac("sha512", BINANCE_API_SECRET)
    .update(queryString)
    .digest("hex");
}

const createPaymentLink = async () => {
  const timestamp = new Date().getTime();
  const nonce = randomString();
  const body = {
    env: {
      terminalType: "WEB",
    },
    merchantTradeNo: "000000001",
    orderAmount: 25.17,
    currency: "BUSD",
    goods: {
      goodsType: "02",
      goodsCategory: "Z000",
      referenceGoodsId: "7876763A3B",
      goodsName: "Ice Cream",
      goodsDetail: "Greentea ice cream cone",
    },
  };

  const payload = timestamp + "\n" + nonce + "\n" + JSON.stringify(body) + "\n";

  const signature = hashSignature(payload).toUpperCase();

  try {
    const res = await axios
      .create({
        baseURL: "https://bpay.binanceapi.com",
        headers: {
          "Content-Type": "application/json",
          "BinancePay-Timestamp": timestamp,
          "BinancePay-Nonce": nonce,
          "BinancePay-Certificate-SN": BINANCE_API_KEY,
          "BinancePay-Signature": signature,
        },
      })
      .request({
        method: "POST",
        url: "/binancepay/openapi/v2/order",
        data: body,
      });
    // const res = await http.post(
    //   "/binancepay/openapi/v2/order",
    //   { data: payload },
    //   {
    //     headers,
    //   }
    // );
  } catch (error) {
    console.log(error);
  }
};

createPaymentLink();
