import dotenv from "dotenv";
import WebSocket from "ws";
import Url from "url-parse";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { forOwn, each } from "lodash";

import {
  saveMessage,
  getMessagesForConversation,
  createNewConversation,
  getParticipantsForConversation,
} from "../services/chat.service"; // Replace with your actual import
import {
  saveNotificationIntent,
  getNotificationsIntent,
  deleteNotificationIntent,
} from "../services/dashboard.service";
import {
  IWebSocketEvent,
  IDCGWebSocketClient,
  IDCGWebSocket,
  IWSNotifyMarketplace,
  IWSChannels,
  IJoystickSlotData,
  IJoystickBannerData,
  IWSNotifyDashboard,
} from "../interfaces";

dotenv.config();
const { DG_DASHBOARD_URL, WS_PORT } = process.env;

const wss = new WebSocket.Server({ port: parseInt(WS_PORT) });
console.log("socket opened on port: ", WS_PORT);

function heartbeat() {
  this.isAlive = true;
}

const channels: IWSChannels = {
  marketplace: {
    clients: {},
  },
  marketplaceEvents: {
    clients: {},
  },
  world: {
    clients: {},
  },
  joystick: {
    clients: {},
  },
  dashboard: {
    clients: {},
  },
  chat: {
    clients: {},
  },
};

wss.on("connection", (ws: IDCGWebSocket, req) => {
  ws.isAlive = true;
  const {
    query: {
      address,
      isMarketplace,
      isWorld,
      zoneId,
      isDashboard,
      isChat,
      walletAddress,
    },
  } = Url(req.url, true);
  const lowerClientAddress = address?.toString().toLowerCase();
  // Used for emit events to client on the marketplace page
  const uuid = uuidv4();
  if (
    lowerClientAddress &&
    !isMarketplace &&
    !isWorld &&
    !isDashboard &&
    !isChat
  ) {
    const id = `${lowerClientAddress}|${uuid}`;
    channels.marketplaceEvents.clients[id] = ws;
    ws.address = id;
    ws.send(
      JSON.stringify({ message: `Welcome to dcg wss: ${lowerClientAddress}` })
    );
    ws.on("pong", heartbeat);
    ws.on("close", () => {
      console.log("close me!");
      channels.marketplaceEvents.clients[id] &&
        delete channels.marketplaceEvents.clients[id];
    });
    // used as a global comunication between the marketplace and the blockchain
  } else if (
    !lowerClientAddress &&
    isMarketplace &&
    !isWorld &&
    !isDashboard &&
    !isChat
  ) {
    channels.marketplace.clients[uuid] = ws;
    ws.marketplaceUUID = uuid;
    ws.on("pong", heartbeat);
    ws.on("close", () => {
      console.log("close me!");
      channels.marketplace.clients[uuid] &&
        delete channels.marketplace.clients[uuid];
    });
    // used as a global comunication between the world and the blockchain
  } else if (
    lowerClientAddress &&
    !isMarketplace &&
    isWorld &&
    !zoneId &&
    !isDashboard &&
    !isChat
  ) {
    const id = `${lowerClientAddress}|${uuid}`;
    channels.world.clients[id] = ws;
    ws.wordlUserId = id;
    ws.on("pong", heartbeat);
    ws.on("close", () => {
      console.log("close me!");
      channels.world.clients[id] && delete channels.world.clients[id];
    });
    // used to comunicate the joystick events
  } else if (
    !lowerClientAddress &&
    !isMarketplace &&
    isWorld &&
    zoneId &&
    !isDashboard &&
    !isChat
  ) {
    const id = `${zoneId}|${uuid}`;
    channels.joystick.clients[id] = ws;
    ws.zone = id;
    ws.on("pong", heartbeat);
    ws.on("close", () => {
      console.log("close me!");
      channels.joystick.clients[id] && delete channels.joystick.clients[id];
    });
  } else if (
    !lowerClientAddress &&
    !isMarketplace &&
    !isWorld &&
    zoneId &&
    isDashboard &&
    !isChat
  ) {
    const id = `${zoneId}|${uuid}`;
    channels.dashboard.clients[id] = ws;
    ws.dashboard = id;
    ws.on("pong", heartbeat);
    ws.on("close", () => {
      console.log("close me!");
      channels.dashboard.clients[id] && delete channels.dashboard.clients[id];
    });
  } else if (isChat && walletAddress) {
    const id = `${walletAddress.toLowerCase()}|${uuidv4()}`;
    channels.chat.clients[id] = ws;
    ws.chatId = id;
    ws.on("message", async (message) => {
      const parsedMessage = JSON.parse(message.toString());
      await handleChatMessage(ws, parsedMessage);
    });
    ws.on("pong", heartbeat);
    ws.on("close", () => {
      console.log("close me!");
      channels.chat.clients[id] && delete channels.chat.clients[id];
    });
  } else {
    ws.send(`{error: "Invalid request"}`);
    ws.close();
    ws.terminate();
  }
  return;
});

const interval = setInterval(function ping() {
  if (!wss.clients.size) {
    channels.marketplaceEvents.clients = {};
    channels.marketplace.clients = {};
    channels.world.clients = {};
    channels.joystick.clients = {};
    channels.dashboard.clients = {};
  } else {
    wss.clients.forEach(function each(ws: IDCGWebSocket) {
      if (ws.isAlive === false && ws.address) {
        delete channels.marketplaceEvents.clients[ws.address];
        return ws.terminate();
      }
      if (ws.isAlive === false && ws.marketplaceUUID) {
        delete channels.marketplace.clients[ws.marketplaceUUID];
        return ws.terminate();
      }
      if (ws.isAlive === false && ws.wordlUserId) {
        delete channels.world.clients[ws.wordlUserId];
        return ws.terminate();
      }
      if (ws.isAlive === false && ws.zone) {
        console.log(channels.joystick.clients[ws.zone]);
        delete channels.joystick.clients[ws.zone];
        return ws.terminate();
      }
      if (ws.isAlive === false && ws.dashboard) {
        console.log(channels.dashboard.clients[ws.dashboard]);
        delete channels.dashboard.clients[ws.dashboard];
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }
}, 30000);

wss.on("close", function close() {
  clearInterval(interval);
});

export const wsNotifyBlockchainEvents = (data: IWebSocketEvent) => {
  const lowerClientAddress = data.address.toLowerCase();
  const marketplaceUsers: WebSocket[] = [];
  const worldClients: WebSocket[] = [];
  forOwn(channels.marketplaceEvents.clients, (value, key) => {
    if (key.indexOf(lowerClientAddress) !== -1) {
      marketplaceUsers.push(value);
    }
  });
  forOwn(channels.world.clients, (value, key) => {
    if (key.indexOf(lowerClientAddress) !== -1) {
      worldClients.push(value);
    }
  });
  if (marketplaceUsers.length) {
    each(marketplaceUsers, (marketplaceUser) => {
      if (marketplaceUser && marketplaceUser.readyState === WebSocket.OPEN) {
        marketplaceUser.send(JSON.stringify(data), (err) => {
          console.log("err: ", err);
          if (err) {
            console.error("err: ", err);
          }
        });
      }
    });
  }
  if (worldClients.length) {
    each(worldClients, (worldClient) => {
      if (worldClient && worldClient.readyState === WebSocket.OPEN) {
        worldClient.send(JSON.stringify(data));
      }
    });
  }
};

export const notifyToWorld = (payload: IWSNotifyMarketplace) => {
  for (const client in channels.world.clients) {
    channels.world.clients[client].send(JSON.stringify(payload));
  }
};

export const notifyToMarketplace = (payload: IWSNotifyMarketplace) => {
  for (const marketplaceClient in channels.marketplace.clients) {
    channels.marketplace.clients[marketplaceClient].send(
      JSON.stringify(payload)
    );
  }
};

export const notifyToDashboard = async (payload: IWSNotifyMarketplace) => {
  try {
    const pendingIntents = await getNotificationsIntent();
    const savedIntent = await saveNotificationIntent(payload);
    pendingIntents.push(savedIntent);
    for (const pendingIntent of pendingIntents) {
      const res = await axios.post(DG_DASHBOARD_URL, payload);
      if (res && res.status === 200) {
        await deleteNotificationIntent(pendingIntent.id);
      }
    }
  } catch (err) {
    throw err;
  }
};

export const notifyToWorldJoystick = (
  payload: IJoystickSlotData | IJoystickBannerData
) => {
  const { zoneId } = payload;
  const joystickUsers: WebSocket[] = [];
  forOwn(channels.joystick.clients, (value, key) => {
    if (key.indexOf(`${zoneId}|`) !== -1) {
      joystickUsers.push(value);
    }
  });
  each(joystickUsers, (joystickUser) => {
    if (joystickUser && joystickUser.readyState === WebSocket.OPEN) {
      joystickUser.send(JSON.stringify(payload));
    }
  });
};

export const notifyToDashboardv2 = async (payload: IWSNotifyDashboard) => {
  try {
    for (const client in channels.dashboard.clients) {
      channels.dashboard.clients[client].send(JSON.stringify(payload));
    }
  } catch (err) {
    throw err;
  }
};

// Method to send chat messages
const notifyToChat = (conversationId: string, message: any) => {
  for (const client in channels.chat.clients) {
    const ws: WebSocket = channels.chat.clients[client];
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ conversationId, message }));
    }
  }
};

interface IMessageRequest {
  fromUserId: string;
  toUserId: string;
  messageContent: string;
  conversationId?: string;
}

const handleChatMessage = async (
  ws: IDCGWebSocket,
  message: IMessageRequest
) => {
  const { fromUserId, toUserId, messageContent, conversationId } = message;
  if (!conversationId) {
    ws.send(JSON.stringify({ status: "error", message: "No conversationId" }));
    return;
  }
  try {
    const savedMessage = await saveMessage(
      fromUserId,
      toUserId,
      messageContent,
      conversationId
    );

    const broadcastMessage = {
      id: savedMessage.id,
      fromUserId,
      toUserId,
      messageContent,
      timestamp: savedMessage.timestamp,
      conversationId,
    };

    const participants = await getParticipantsForConversation(conversationId);

    participants.forEach((participant) => {
      Object.keys(channels.chat.clients).forEach((clientKey) => {
        const clientWs = channels.chat.clients[clientKey];
        if (clientKey.startsWith(participant.address.toLowerCase())) {
          clientWs.send(
            JSON.stringify({
              status: "success",
              message: broadcastMessage,
            })
          );
        }
      });
    });
  } catch (error) {
    ws.send(JSON.stringify({ status: "error", message: error.message }));
  }
};
export default wss;
