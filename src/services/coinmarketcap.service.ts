import axios, { AxiosResponse } from "axios";
import dotenv from "dotenv";
import { ICoinmarketcapPrice } from "../interfaces/ICoinmarketcapPrice";

dotenv.config();
const { COINMARKETCAP_API_KEY } = process.env;

export const getNftPrice = async (amount: string): Promise<any> => {
  try {
    const res = await axios.get(
      `https://pro-api.coinmarketcap.com/v2/tools/price-conversion?id=29487&amount=${amount}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-CMC_PRO_API_KEY": COINMARKETCAP_API_KEY,
        },
      }
    );
    return res.data.data.quote.USD.price;
  } catch (error) {
    throw error;
  }
};

export const getBagPrice = async (): Promise<ICoinmarketcapPrice> => {
  try {
    const res: AxiosResponse<ICoinmarketcapPrice> = await axios.get(
      `https://pro-api.coinmarketcap.com/v2/tools/price-conversion?id=29487&amount=1`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-CMC_PRO_API_KEY": COINMARKETCAP_API_KEY,
        },
      }
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getMaticPrice = async (): Promise<ICoinmarketcapPrice> => {
  try {
    const res: AxiosResponse<ICoinmarketcapPrice> = await axios.get(
      `https://pro-api.coinmarketcap.com/v2/tools/price-conversion?id=3890&amount=1`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-CMC_PRO_API_KEY": COINMARKETCAP_API_KEY,
        },
      }
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getPriceById = async (
  id: string
): Promise<ICoinmarketcapPrice> => {
  try {
    const res: AxiosResponse<ICoinmarketcapPrice> = await axios.get(
      `https://pro-api.coinmarketcap.com/v2/tools/price-conversion?id=${id}&amount=1`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-CMC_PRO_API_KEY": COINMARKETCAP_API_KEY,
        },
      }
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const convertTo = async (
  id: number,
  to: string,
  amount: string
): Promise<any> => {
  try {
    const res: AxiosResponse<any> = await axios.get(
      `https://pro-api.coinmarketcap.com/v2/tools/price-conversion?id=${id}&amount=${amount}&convert=${to}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-CMC_PRO_API_KEY": COINMARKETCAP_API_KEY,
        },
      }
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};
