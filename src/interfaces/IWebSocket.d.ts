import WebSocket from "ws";
import { IFlattenResponse } from "../interfaces";

export interface IWebSocketEvent {
  address?: string;
  status: string;
  type: "buy" | "sell" | "cancel";
  transactionHash?: string;
  message?: string;
  error?: any;
}

export interface IDCGWebSocket extends WebSocket {
  isAlive: boolean;
  address: string;
  marketplaceUUID: string;
  wordlUserId: string;
  zone: string;
  dashboard: string;
  chatId: string;
}

export interface IDCGWebSocketClient {
  [key: string]: WebSocket;
}

export interface IJoystickBaseData {
  posX: number;
  posY: number;
  posZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  key: string;
  zoneId: number;
  save: boolean;
  // type: 'slot' | 'banner'
}

export interface IJoystickSlotData extends IJoystickBaseData {
  type: "slot";
  resourceId: string;
  tokenId: string;
  slotId: string;
}

export interface IJoystickBannerData extends IJoystickBaseData {
  type: "banner";
  bannerId?: string;
}

export interface IWSNotifyMarketplace {
  status: "success";
  type: "buy" | "sell" | "cancel" | "joystick";
  payload: {
    resourceId?: string;
    nftAddress?: string;
    tokenId: string;
    nextSellerNft?: IFlattenResponse; //para el evento cancel esto te llega null
    nextMarketplaceNft?: IFlattenResponse; //para el evento cancel esto te llega null
    newMarketplaceNft?: IFlattenResponse; // solot te llega cuando es un evento sell
  };
}

export interface IWSNotifyDashboard {
  status: "success" | "error";
  type: "joystickOpened";
  payload?: any;
}

export interface IWSChannels {
  marketplace: {
    clients: IDCGWebSocketClient;
  };
  marketplaceEvents: {
    clients: IDCGWebSocketClient;
  };
  world: {
    clients: IDCGWebSocketClient;
  };
  joystick: {
    clients: IDCGWebSocketClient;
  };
  dashboard: {
    clients: IDCGWebSocketClient;
  };
  chat: {
    clients: IDCGWebSocketClient;
  };
}
