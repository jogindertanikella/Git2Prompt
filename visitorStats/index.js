import { ALLOWED_ORIGINS } from "../src/constants/allowedOrigins.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const origin = request.headers.get("Origin") || "";

    // Base CORS headers
    const baseCorsHeaders = {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    const corsHeaders = { ...baseCorsHeaders };
    if (ALLOWED_ORIGINS.includes(origin)) {
      corsHeaders["Access-Control-Allow-Origin"] = origin;
    }

    // OPTIONS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      if (pathname === "/api/getOnlineVisitors") {
        return await getOnlineVisitors(env, corsHeaders);
      }

      if (pathname === "/api/getAllVisitorStats") {
        return await getAllVisitorStats(env, corsHeaders);
      }

      if (pathname === "/api/ping") {
        return await trackVisitor(request, env, corsHeaders);
      }

      return new Response(
        JSON.stringify({ error: "Not found" }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } catch (err) {
      console.error("Unexpected server error:", err);
      return new Response(
        JSON.stringify({ error: "Unexpected server error", detail: err.message }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
  },
};

async function trackVisitor(request, env, corsHeaders) {
  try {
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

    // Mark this IP as online
    const onlineKey = `online:${ip}`;
    await env.VISITOR_STATS.put(onlineKey, now.toString(), { expirationTtl: 300 });

    // Log visit
    const logKey = `log:${now}:${ip}`;
    const logData = {
      ip,
      country,
      timestamp: now,
      userAgent: request.headers.get("user-agent") || "",
    };
    await env.VISITOR_STATS.put(logKey, JSON.stringify(logData));

    // Count currently online
    const onlineList = await env.VISITOR_STATS.list({ prefix: "online:" });
    const onlineCount = onlineList.keys.length;

    return new Response(
      JSON.stringify({
        total: totalCount,
        currentlyOnline: Math.max(1, onlineCount),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (err) {
    console.error("trackVisitor error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to track visitor", detail: err.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
}

async function getOnlineVisitors(env, corsHeaders) {
  try {
    const onlineList = await env.VISITOR_STATS.list({ prefix: "online:" });
    const onlineCount = onlineList.keys.length;

    return new Response(
      JSON.stringify({
        currentlyOnline: Math.max(1, onlineCount),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (err) {
    console.error("getOnlineVisitors error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to get online visitors", detail: err.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
}

async function getAllVisitorStats(env, corsHeaders) {
  try {
    const total = await env.VISITOR_STATS.get("total");
    const totalCount = parseInt(total || "0", 10);

    const list = await env.VISITOR_STATS.list({ prefix: "country:" });
    const countries = {};
    for (const item of list.keys) {
      const code = item.name.replace("country:", "");
      const value = await env.VISITOR_STATS.get(item.name);
      countries[code] = parseInt(value || "0", 10);
    }

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
        logs,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (err) {
    console.error("getAllVisitorStats error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to get visitor stats", detail: err.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
}
