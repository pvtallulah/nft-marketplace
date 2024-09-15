export interface ICollectionPost {
  collectionAddress: string;
  collectionName: string;
  walletAddress: string;
  type: "music" | "art";
}

export interface ICollectionPut {
  collectionAddress: string;
  walletAddress: string;
  collectionImage?: string;
  visible?: boolean;
}

export interface ICollectionGet {
  walletAddress: string;
  visible?: string;
}
