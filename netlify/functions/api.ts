import "dotenv/config";
import { Handler } from "@netlify/functions";
import serverless from "serverless-http";
import { createServer } from "../../server";

const app = createServer();

// Use serverless-http to convert Express app to Netlify Function
export const handler: Handler = serverless(app, {
  basePath: "/.netlify/functions/api",
});
