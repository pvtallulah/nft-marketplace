const axios = require("axios");
const dotenv = require("dotenv");
const SocksProxyAgent = require("socks-proxy-agent");
dotenv.config();

const { PROXY_PROTOCOL, PROXY_HOST, PROXY_PORT, PROXY_USER, PROXY_PASSWORD } =
  process.env;
const proxyUrl = `${PROXY_PROTOCOL}://${PROXY_USER}:${PROXY_PASSWORD}@${PROXY_HOST}:${PROXY_PORT}`;

const httpsAgent = new SocksProxyAgent(proxyUrl);
const baseUrl = "https://google.com";
const client = axios.create({ baseUrl, httpsAgent });
