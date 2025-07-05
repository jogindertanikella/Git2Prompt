export function getCorsHeaders(origin) {
  const allowedOrigins = [
    "https://git2prompt.com",
    "https://www.git2prompt.com",
    "https://git2promptapi.com",
    "https://www.git2promptapi.com"
  ];

  if (allowedOrigins.includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
  }
  // If not allowed, don't send Access-Control-Allow-Origin (request will fail)
  return {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
