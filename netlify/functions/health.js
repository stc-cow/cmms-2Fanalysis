exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "ok",
      message: "Netlify Functions are working (JS)",
      timestamp: new Date().toISOString(),
    }),
  };
};
