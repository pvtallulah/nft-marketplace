import path from "path";
import fs from "fs";
import express, { Application, Request, Response } from "express";
import {
  Response as ExResponse,
  Request as ExRequest,
  NextFunction,
} from "express";
import { ValidateError } from "tsoa";
import swaggerUI from "swagger-ui-express";
import dotenv from "dotenv";
import { AppDataSource, MongoDataSource } from "./db/data-source";

import bodyParser from "body-parser";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
// import { rateLimiterMiddleware } from "./middlewares/rateLimiterMySql";
import "reflect-metadata";
import {
  initPopulateTokenUri,
  rebuildLostTransactions,
  startGraphPolling,
  startValidatePreprocessNfts,
} from "./services/events.service";
import "./services/webSocket.service";
import { wsNotifyBlockchainEvents } from "./services/webSocket.service";
import { stripeWebhook } from "./services/stripe.service";
import { coinbaseWebhook } from "./services/coinbase.service";
import { binanceWebhook } from "./services/binance.service";
import {
  initDiscordService,
  newErrorV2,
  newEventV2,
} from "./services/discord.service";
import { paperWebhook } from "./services/paper.service";
import { initDb, validateQueryParams } from "./utils";
import { createReadStream } from "./services/r2.Service";
import { RegisterRoutes } from "./routes/routes";
dotenv.config();

const app: Application = express();

const { PORT, MORGAN_LOG, S3_BUCKET_NAME } = process.env;

// app.use(function (req, res, next) {
//   res.setHeader(
//     "Content-Security-Policy",
//     "default-src 'self'; font-src 'self'; img-src 'self'; script-src 'self' https://cdn.jsdelivr.net/npm/es-module-shims@1/dist/es-module-shims.min.js; style-src 'self' https://fonts.googleapis.com https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css; frame-src 'self';"
//   );
//   next();
// });
// stripe listen --events payment_intent.created --forward-to localhost:8085/v1/stripe/webhook
// app.post("/v1/stripe/webhook", express.raw({ type: "*/*" }), (req, res) => {
//   try {
//     stripeWebhook(req, res);
//   } catch (error) {
//     console.log(error);
//     res
//       .status(500)
//       .send("Stripe-WH-Error: " + error?.message || "Unknown error");
//   }
// });
// https://df98-181-118-69-221.ngrok.io/v1/coinbase/webhook

app.post("/v1/coinbase/webhook", express.raw({ type: "*/*" }), (req, res) => {
  try {
    coinbaseWebhook(req, res);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send("coinbase-WH-Error: " + error?.message || "Unknown error");
  }
});
//https://backend-dg-ice.ddns.net/v1/binance/webhook
app.post("/v1/binance/webhook", express.raw({ type: "*/*" }), (req, res) => {
  try {
    binanceWebhook(req, res);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send("binance-WH-Error: " + error?.message || "Unknown error");
  }
});

// https://61dc-181-169-111-177.sa.ngrok.io/v1/paper/webhook
// app.post(
//   "/v1/paper/webhook",
//   express.raw({ type: "*/*" }),
//   async (req, res) => {
//     try {
//       await paperWebhook(req, res);
//     } catch (err) {
//       console.log(err);
//       res.status(500).send("Error");
//     }
//   }
// );
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use((_, res: Response, next: NextFunction) => {
  res.setHeader("charset", "utf-8");
  next();
});
// app.use(rateLimiterMiddleware);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
if (MORGAN_LOG === "true") app.use(morgan("combined"));

app.use("/public", express.static("public/images"));
app.get("/healthcheck", async (_: Request, res: Response) => {
  res.send("Ok");
});
app.use("/docs", swaggerUI.serve, async (_req: ExRequest, res: ExResponse) => {
  try {
    return res.send(
      swaggerUI.generateHTML(await import("../public/swagger.json"))
    );
  } catch (error) {
    return res.send("An error occurred: " + error?.message);
  }
});

app.get("/joystick", (req, res) => {
  fs.readFile(path.resolve("./public/joystick.html"), "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("An error occurred");
    }
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; connect-src 'self' *; font-src 'self'; img-src 'self' data:; script-src 'self' blob: https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.6/dist/umd/popper.min.js 'unsafe-inline'; style-src 'self' https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css 'unsafe-inline'; frame-src 'self';"
    );
    return res.send(data);
  });
});

app.get("/allowance", (req, res) => {
  fs.readFile(path.resolve("./public/allowance.html"), "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("An error occurred");
    }
    res.setHeader(
      "Content-Security-Policy",
      "default-src *; connect-src *; font-src *; img-src * data:; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; frame-src *;"
    );
    return res.send(data);
  });
});

app.get("/test-auth", (req, res) => {
  fs.readFile(path.resolve("./public/test-auth.html"), "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("An error occurred");
    }
    // res.setHeader(
    //   "Content-Security-Policy",
    //   "default-src 'self'; connect-src 'self' *; font-src 'self'; img-src 'self' data:; script-src 'self' blob: https://cdn.ethers.io/lib/ethers-5.4.6.umd.min.js 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-src 'self';"
    // );
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; connect-src 'self' *; font-src 'self'; img-src 'self' data:; script-src 'self' blob: https://cdn.ethers.io/lib/ethers-5.4.6.umd.min.js https://cdnjs.cloudflare.com/ajax/libs/ethers/5.4.6/ethers.umd.min.js 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-src 'self';"
    );

    return res.send(data);
  });
});
let isServerRebuilding = false;
app.use((req: ExRequest, res: ExResponse, next: NextFunction) => {
  const isMetadata = req.path.includes("v1/metadata");
  if (isServerRebuilding && !isMetadata) {
    res.setHeader("Content-Type", "application/json");
    return res.sendStatus(400).json({
      error: "Server is rebuilding the transactions. Please try again later",
    });
  }
  next();
});

app.use((req: ExRequest, _, next: NextFunction) => {
  validateQueryParams({ ...req.query });
  next();
});

app.use("/media", (req: ExRequest, res: ExResponse) => {
  let key: string;
  try {
    key = "marketplace" + req.path;

    const readStream = createReadStream(key);

    readStream.on("error", (err: Error) => {
      console.error(err);
      return res.status(500).send("Error reading file from S3");
    });

    readStream.pipe(res);
  } catch (error) {
    newErrorV2({
      title: "Error getting media",
      description: "Error getting media for hash: " + key,
      extraData: error?.message,
    });
  }
});

app.get("/testUpload", (req, res) => {
  res.sendFile(__dirname + "/testUpload.html");
});
RegisterRoutes(app);

app.use(function errorHandler(
  err: unknown,
  req: ExRequest,
  res: ExResponse,
  next: NextFunction
): ExResponse | void {
  if (err instanceof ValidateError) {
    console.warn(`Caught Validation Error for ${req.path}:`, err.fields);
    return res.status(422).json({
      message: err.message || "Validation Failed",
      details: err?.fields || {},
    });
  }
  if (err instanceof Error) {
    return res.status(500).json({
      message: err.message || "Somthing went wrong",
    });
  }
  console.log("unknown error,", err);
  next();
});
// Must BE!
// innodb-default-row-format=DYNAMIC
// AppDataSource.query("CREATE DATABASE IF NOT EXISTS")
//   .then((db) => {
//

MongoDataSource.initialize()
  .then(() => {
    console.log("MongoDB Initialized");
    AppDataSource.initialize()
      .then(async () => {
        const init = await initDb();
        if (!init?.generated) {
          throw new Error(
            `DB not initialized! \n eg: \n npx typeorm-ts-node-esm migration:run -d ./src/db/data-source.ts \n or check initDb() in index.ts`
          );
        }
        console.log("DB Initialized, now starting the server.");
        app.listen(PORT, async () => {
          console.log(`Server is running at http://localhost:${PORT}`);
          initDiscordService(async () => {
            try {
              newEventV2({
                title: "Server started",
                description: "Init rebuild",
              });
              await rebuildLostTransactions(false);
              newEventV2({
                title: "Server started",
                description: "Finish rebuild, starting polling",
              });
              await startGraphPolling();
              await startValidatePreprocessNfts();
              initPopulateTokenUri();
            } catch (error) {
              newErrorV2({
                title: "Server Error",
                description: "Error initializing server rebuild and polling",
                extraData: error?.message,
              });
            } finally {
              isServerRebuilding = false;
            }
          });
        });
      })
      .catch((error) => console.log(error));
  })
  .catch((error) => {
    console.error("MongoDB initialization error:", error);
  });

//Test me before using it!
/*
  ['log', 'warn', 'error'].forEach((methodName) => {
  const originalMethod = console[methodName];
  console[methodName] = (...args) => {
    let initiator = 'unknown place';
    try {
      throw new Error();
    } catch (e) {
      if (typeof e.stack === 'string') {
        let isFirst = true;
        for (const line of e.stack.split('\n')) {
          const matches = line.match(/^\s+at\s+(.*)/);
          if (matches) {
            if (!isFirst) { // first line - current function
                            // second line - caller (what we are looking for)
              initiator = matches[1];
              break;
            }
            isFirst = false;
          }
        }
      }
    }
    originalMethod.apply(console, [...args, '\n', `  at ${initiator}`]);
  };
});
*/
// })
// .catch((err) => {
//   console.log("Error creating DB:");
//   console.log(err);
// });
process.on("uncaughtException", function (err) {
  console.error("uncaughtException::", err);
});
