export interface IAlchemyNftData {
  contract: Contract;
  id: ID;
  title: string;
  description: string;
  tokenUri: TokenURI;
  media: TokenURI[];
  metadata: AlchemyMetadata;
  timeLastUpdated: Date;
  contractMetadata: ContractMetadata;
}

export interface Contract {
  address: string;
}

export interface ContractMetadata {
  name: string;
  symbol: string;
  totalSupply: string;
  tokenType: string;
  openSea: OpenSea;
}

export interface OpenSea {
  lastIngestedAt: Date;
}

export interface ID {
  tokenId: string;
  tokenMetadata: TokenMetadata;
}

export interface TokenMetadata {
  tokenType: string;
}

export interface TokenURI {
  raw: string;
  gateway: string;
}

export interface AlchemyMetadata {
  image: string;
  thumbnail: string;
  name: string;
  description: string;
  language: string;
  attributes: Attribute[];
  id: string;
}

export interface Attribute {
  value: string;
  trait_type: string;
}
