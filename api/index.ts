import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createRequestHandler } from "react-router";

const BUILD_PATH = "../dist/server.js";

let handler: any;

async function getHandler() {
  if (!handler) {
    try {
      const { default: build } = await import(BUILD_PATH);
      handler = createRequestHandler(build, process.env.NODE_ENV || "production");
    } catch (error) {
      console.error("Failed to load server build:", error);
      throw error;
    }
  }
  return handler;
}

export default async function (req: VercelRequest, res: VercelResponse) {
  try {
    const handler = await getHandler();

    const url = new URL(`https://${req.headers.host || "localhost"}${req.url}`);
    const request = new Request(url, {
      method: req.method,
      headers: new Headers(req.headers as Record<string, string>),
      body: req.body && req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
    });

    const response = await handler(request);

    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const body = await response.text();
    res.send(body);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
