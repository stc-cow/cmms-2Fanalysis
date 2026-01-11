// Minimal function with absolutely no dependencies
exports.handler = async (event, context) => {
  try {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        message: "Ping successful",
        time: new Date().toISOString(),
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(error) }),
    };
  }
};
