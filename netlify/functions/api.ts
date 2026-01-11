import serverless from "serverless-http";
import express from "express";
import cors from "cors";
import { handleDemo } from "../../server/routes/demo";
import dataRoutes from "../../server/routes/data";

// Create Express app directly instead of importing createServer
// This ensures better compatibility with Netlify's esbuild bundler
function createServerApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Data import routes
  app.use("/api/data", dataRoutes);

  return app;
}

const app = createServerApp();

export const handler = serverless(app, {
  basePath: "/.netlify/functions/api",
});
