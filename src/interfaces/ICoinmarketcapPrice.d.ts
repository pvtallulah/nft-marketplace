export interface USD {
  price: number;
  last_updated: Date;
}

export interface Quote {
  USD: USD;
}

export interface ICoinmarketcapPrice {
  data: {
    id: number;
    symbol: string;
    name: string;
    amount: number;
    last_updated: Date;
    quote: Quote;
  };
}
