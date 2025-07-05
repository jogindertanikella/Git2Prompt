export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname === "/api/getOnlineVisitors") {
      return await getOnlineVisitors(env);
    }

    if (pathname === "/api/getAllVisitorStats") {
      return await getAllVisitorStats(env);
    }

    return await trackVisitor(request, env);
  }
};

async function trackVisitor(request, env) {
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
      currentlyOnline: onlineCount
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    }
  );
}

async function getOnlineVisitors(env) {
  const onlineList = await env.VISITOR_STATS.list({ prefix: "online:" });
  const onlineCount = onlineList.keys.length;

  return new Response(
    JSON.stringify({
      currentlyOnline: onlineCount
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    }
  );
}

async function getAllVisitorStats(env) {
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
        "Access-Control-Allow-Origin": "*"
      }
    }
  );
}
