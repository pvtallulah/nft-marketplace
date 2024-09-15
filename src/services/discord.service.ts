import dotenv from "dotenv";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { format } from "date-fns";
dotenv.config();

let client: Client;

const channels = {
  contractEvents: "1022220998419951716",
  errorLog: "1022221022260367441",
};

const { NODE_ENV, DISCORD_BOT_TOKEN, DISCORD_BACKEND_NAME } = process.env;
const eol = `\`\`\``;

export const initDiscordService = (cb: Function): void => {
  client = new Client({
    intents: [GatewayIntentBits.Guilds],
    partials: [Partials.Channel],
  });

  client.login(DISCORD_BOT_TOKEN);

  client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
    cb();
  });

  client.on("error", (error) => {
    console.log("Discord client error: ", error);
    cb();
  });
};

export const newEvent = async (text: string): Promise<void> => {
  const contractEventsChannel = await client.channels.fetch(
    channels.contractEvents
  );
  if (contractEventsChannel.isTextBased()) {
    contractEventsChannel.send(text);
  }
};

export const newEventV2 = async ({
  title,
  description,
  nftAddress,
  tokenId,
  resourceId,
  from,
  to,
  transactionHash,
  price,
  extraData,
  date = new Date(),
}: {
  title: string;
  description?: string;
  nftAddress?: string;
  tokenId?: string;
  resourceId?: string;
  from?: string;
  to?: string;
  transactionHash?: string;
  price?: string;
  extraData?: string;
  date?: Date;
}): Promise<void> => {
  const contractEventsChannel = await client.channels.fetch(
    channels.contractEvents
  );
  if (contractEventsChannel.isTextBased()) {
    contractEventsChannel.send(
      formatText({
        title,
        description,
        nftAddress,
        tokenId,
        resourceId,
        date,
        from,
        to,
        price,
        transactionHash,
        extraData,
      })
    );
  }
};

export const newError = async (text: string): Promise<void> => {
  const errorLogChannel = await client.channels.fetch(channels.errorLog);
  if (errorLogChannel.isTextBased()) {
    errorLogChannel.send(text);
  }
};

export const newErrorV2 = async ({
  title,
  description,
  nftAddress,
  tokenId,
  resourceId,
  transactionHash,
  paymentId,
  date = new Date(),
  extraData,
}: {
  title: string;
  description: string;
  nftAddress?: string;
  tokenId?: string;
  resourceId?: string;
  transactionHash?: string;
  paymentId?: string;
  date?: Date;
  extraData?: string;
}): Promise<void> => {
  const errorLogChannel = await client.channels.fetch(channels.errorLog);
  if (errorLogChannel.isTextBased()) {
    try {
      const res = await errorLogChannel.send(
        formatText({
          title,
          description,
          nftAddress,
          tokenId,
          resourceId,
          transactionHash,
          paymentId,
          date,
          extraData,
        })
      );
      // console.log(res);
    } catch (error) {
      console.log("error", error);
    }
  }
};

const formatText = ({
  title,
  description,
  nftAddress,
  tokenId,
  resourceId,
  from,
  to,
  transactionHash,
  price,
  date,
  paymentId,
  extraData,
}: {
  title?: string;
  description?: string;
  nftAddress?: string;
  tokenId?: string;
  resourceId?: string;
  from?: string;
  to?: string;
  transactionHash?: string;
  price?: string;
  date: Date;
  paymentId?: string;
  extraData?: string;
}) => {
  // const env = NODE_ENV === "development" ? "development" : "production";
  const backendName = DISCORD_BACKEND_NAME || "";
  let text = "";
  text += `\`\`\`css
  ${`[${backendName}]`}[${title}]
  ${eol}`;

  if (description) {
    text += `\`\`\`
    [description: ${description}]
    ${eol}`;
  }

  if (nftAddress) {
    text += `\`\`\`yaml
    [nftAddress: ${nftAddress}]
    ${eol}`;
  }
  if (tokenId) {
    text += `\`\`\`yaml
    [tokenId: ${tokenId}]
    ${eol}`;
  }
  if (resourceId) {
    text += `\`\`\`yaml
    [resourceId: ${resourceId}]
    ${eol}`;
  }
  if (from) {
    text += `\`\`\`yaml
    [from: ${from}]
    ${eol}`;
  }
  if (to) {
    text += `\`\`\`yaml
    [to: ${to}]
    ${eol}`;
  }
  if (transactionHash) {
    text += `\`\`\`ini
    [transactionHash: ${transactionHash}]
    ${eol}`;
  }
  if (paymentId) {
    text += `\`\`\`ini
    [paymentId: ${paymentId}]
    ${eol}`;
  }
  if (price) {
    price += `\`\`\`ini
    [price: ${price}]
    ${eol}`;
  }
  if (date) {
    text += `\`\`\`http
    [date: ${format(date, "yyyy-MM-dd HH:mm:ss")}]
    ${eol}`;
  }
  if (extraData) {
    text += `\`\`\`http
    [extraData: ${extraData}]
    ${eol}`;
  }
  return text;
};
