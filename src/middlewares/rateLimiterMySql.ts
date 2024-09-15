import mysql, { Pool } from "mysql2";
import dotenv from "dotenv";
import {
  RateLimiterMySQL,
  IRateLimiterStoreOptions,
  ICallbackReady,
  RateLimiterRes,
} from "rate-limiter-flexible";
import { Request, Response, NextFunction } from "express";
dotenv.config();

const {
  DB_USERNAME,
  DB_PASSWORD,
  DB_SCHEMA,
  DB_HOST,
  RATE_LIMIT_POINTS,
  RATE_LIMIT_DURATION,
  DB_CONNECTION_TIMEOUT,
} = process.env;

const pool: Pool = mysql.createPool({
  connectionLimit: Number(DB_CONNECTION_TIMEOUT || 2500),
  host: DB_HOST,
  user: DB_USERNAME,
  password: DB_PASSWORD,
});

const opts: IRateLimiterStoreOptions = {
  storeClient: pool,
  dbName: DB_SCHEMA,
  tableName: "rate-limit",
  points: Number(RATE_LIMIT_POINTS || 5),
  duration: Number(RATE_LIMIT_DURATION || 10),
};

const ready: ICallbackReady = (err: Error) => {
  if (err) {
    console.log("rate limit error");
    console.error(err);
  } else {
    console.log("rate limit started succesfully");
  }
};
const rateLimiter = new RateLimiterMySQL(opts, ready);

export const rateLimiterMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  rateLimiter
    .consume(req.ip)
    .then((rateLimiterRes: RateLimiterRes) => {
      const headers = {
        "Retry-After": rateLimiterRes.msBeforeNext / 1000,
        "X-RateLimit-Limit": opts.points,
        "X-RateLimit-Remaining": rateLimiterRes.remainingPoints,
        "X-RateLimit-Reset": new Date(Date.now() + rateLimiterRes.msBeforeNext),
      };
      res.set(headers);
      next();
    })
    .catch((rateLimiterRes: RateLimiterRes) => {
      const headers = {
        "Retry-After": rateLimiterRes.msBeforeNext / 1000,
        "X-RateLimit-Limit": opts.points,
        "X-RateLimit-Remaining": rateLimiterRes.remainingPoints,
        "X-RateLimit-Reset": new Date(Date.now() + rateLimiterRes.msBeforeNext),
      };
      res.set(headers);
      res.status(429).send("Too Many Requests");
    });
};
