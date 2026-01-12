import { RequestHandler } from "express";

/**
 * @deprecated Demo route - no longer used
 * The application focuses on real data from Google Sheets only
 */
export const handleDemo: RequestHandler = (req, res) => {
  res.status(410).json({
    error: "This endpoint has been deprecated",
    message: "Demo route is no longer available",
    message_detail:
      "The application now uses real data from Google Sheets as the single source of truth",
  });
};
