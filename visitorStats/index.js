export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const origin = request.headers.get("Origin");

    // Only allow these domains
    const ALLOWED_ORIGINS = [
      "https://git2prompt.com",
      "https://www.git2prompt.com",
    ];

    let allowedOrigin = "";
    if (ALLOWED_ORIGINS.includes(origin)) {
      allowedOrigin = origin;
    }

    if (pathname === "/api/getOnlineVisitors") {
      return await getOnlineVisitors(env, allowedOrigin);
    }

    if (pathname === "/api/getAllVisitorStats") {
      return await getAllVisitorStats(env, allowedOrigin);
    }

    if (pathname === "/api/ping") {
      return await trackVisitor(request, env, allowedOrigin);
    }

    return new Response("Not found", { status: 404 });
  }
};

async function trackVisitor(request, env, allowedOrigin) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const country = request.cf?.country || "??";
  const now = Date.now();

  // Increment total visits
  const totalKey = "total";
  let total = await env.VISITOR_STATS.get(totalKey);
  let totalCount = parseInt(total || "0", 10) + 1;
  await env.VISITOR_STATS.put(totalKey, totalCount.toString());

  // Increment per-country count
  const countryKey = `country:${country}`;
  let countryCountRaw = await env.VISITOR_STATS.get(countryKey);
  let countryCount = parseInt(countryCountRaw || "0", 10) + 1;
  await env.VISITOR_STATS.put(countryKey, countryCount.toString());

  // Mark this IP as online (timestamp)
  const onlineKey = `online:${ip}`;
  await env.VISITOR_STATS.put(onlineKey, now.toString(), { expirationTtl: 300 }); // expires in 5 min

  // Log visit (for future analytics)
  const logKey = `log:${now}:${ip}`;
  const logData = {
    ip,
    country,
    timestamp: now,
    userAgent: request.headers.get("user-agent") || ""
  };
  await env.VISITOR_STATS.put(logKey, JSON.stringify(logData));

  // Count currently online visitors
  const onlineList = await env.VISITOR_STATS.list({ prefix: "online:" });
  const onlineCount = onlineList.keys.length;

  return new Response(
    JSON.stringify({
      total: totalCount,
      currentlyOnline: Math.max(1, onlineCount) // never show less than 1
    }),
    {
      headers: {
        "Content-Type": "application/json",
        ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {})
      }
    }
  );
}

async function getOnlineVisitors(env, allowedOrigin) {
  const onlineList = await env.VISITOR_STATS.list({ prefix: "online:" });
  const onlineCount = onlineList.keys.length;

  return new Response(
    JSON.stringify({
      currentlyOnline: Math.max(1, onlineCount) // never show less than 1
    }),
    {
      headers: {
        "Content-Type": "application/json",
        ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {})
      }
    }
  );
}

async function getAllVisitorStats(env, allowedOrigin) {
  // Get total count
  const total = await env.VISITOR_STATS.get("total");
  const totalCount = parseInt(total || "0", 10);

  // Get all country counts
  const list = await env.VISITOR_STATS.list({ prefix: "country:" });
  const countries = {};
  for (const item of list.keys) {
    const code = item.name.replace("country:", "");
    const value = await env.VISITOR_STATS.get(item.name);
    countries[code] = parseInt(value || "0", 10);
  }

  // Get all logs (be careful: potentially big)
  const logsList = await env.VISITOR_STATS.list({ prefix: "log:", limit: 1000 });
  const logs = [];
  for (const item of logsList.keys) {
    const value = await env.VISITOR_STATS.get(item.name);
    if (value) logs.push(JSON.parse(value));
  }

  return new Response(
    JSON.stringify({
      total: totalCount,
      countries,
      logs
    }),
    {
      headers: {
        "Content-Type": "application/json",
        ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {})
      }
    }
  );
}
