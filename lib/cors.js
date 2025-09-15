// lib/cors.js
import { NextResponse } from "next/server";

export function withCors(handler) {
  return async (req) => {
    // handle OPTIONS preflight request
    if (req.method === "OPTIONS") {
      const res = NextResponse.json({});
      res.headers.set("Access-Control-Allow-Origin", "*");
      res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      return res;
    }

    // call the original handler
    const res = await handler(req);

    // add CORS headers to actual response
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    return res;
  };
}
