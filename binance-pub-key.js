/* eslint-disable */
const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

const { BINANCE_API_KEY, BINANCE_API_SECRET } = process.env;

const BINANCE_API_URL =
  "https://bpay.binanceapi.com/binancepay/openapi/certificates";

function getUnixTimestamp() {
  return Date.now();
}

const hashSignature = (queryString, secret) => {
  return crypto.createHmac("sha512", secret).update(queryString).digest("hex");
};

function generateNonce(length = 32) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function hashApiKeyMd5(apiKey) {
  return crypto.createHash("md5").update(apiKey).digest("hex");
}

async function fetchPublicKey() {
  try {
    const timestamp = getUnixTimestamp();
    const nonce = generateNonce();

    const payloadToSign =
      timestamp + "\n" + nonce + "\n" + JSON.stringify({}) + "\n";
    const signature = hashSignature(
      payloadToSign,
      BINANCE_API_SECRET
    ).toUpperCase();

    const response = await fetch(BINANCE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "BinancePay-Timestamp": timestamp.toString(),
        "BinancePay-Nonce": nonce,
        "BinancePay-Certificate-SN": BINANCE_API_KEY,
        "BinancePay-Signature": signature,
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!data.data || data.data.length === 0) {
      throw new Error("No certificates found");
    }

    const certificate = data.data[0];

    console.log(`certSerial: ${certificate.certSerial}`);
    console.log(`certPublic: ${convertPemToPublicKey(certificate.certPublic)}`);
  } catch (err) {
    throw new Error(`Failed to fetch public key: ${err.message}`);
  }
}

// Example usage
fetchPublicKey()
  .then(() => console.log("Public key fetched successfully"))
  .catch((err) => console.error(err));
