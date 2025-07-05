import { API_URLS } from "../src/constants/apicalls.js";

const ALLOWED_ORIGINS = [
  "https://git2prompt.com",
  "https://www.git2prompt.com",
];

const NUM_RECENT_QUERIES = 12;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    // Validate origin against allowed list
    let allowedOrigin = "";
    if (ALLOWED_ORIGINS.includes(origin)) {
      allowedOrigin = origin;
    }

    const baseCorsHeaders = {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...baseCorsHeaders,
          ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
        },
      });
    }

    // ✅ Store Query
    if (request.method === "POST" && url.pathname === "/api/store-query") {
      try {
        const { query } = await request.json();
        const cleanQuery = query?.trim().toLowerCase();
        if (!cleanQuery || cleanQuery.length < 3) {
          return new Response("Invalid or too short query", {
            status: 400,
            headers: {
              ...baseCorsHeaders,
              ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
            },
          });
        }

        const queryKey = `query-${cleanQuery}`;
        const now = new Date().toISOString();
        const geo = request.cf || {};
        const originIp = request.headers.get("cf-connecting-ip") || "unknown";

        const metadata = {
          timestamp: now,
          lastSeen: now,
          origin: originIp,
          geo: {
            country: geo.country || "unknown",
            region: geo.region || "unknown",
            city: geo.city || "unknown",
            colo: geo.colo || "unknown",
          },
        };

        const existing = await env.query_history_kv.get(queryKey, { type: "json" });
        if (existing) {
          existing.count += 1;
          existing.lastSeen = now;
          await env.query_history_kv.put(queryKey, JSON.stringify(existing));
        } else {
          await env.query_history_kv.put(
            queryKey,
            JSON.stringify({ query: cleanQuery, count: 1, ...metadata })
          );
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: {
            ...baseCorsHeaders,
            ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
          },
        });
      } catch {
        return new Response("Error storing query", {
          status: 500,
          headers: {
            ...baseCorsHeaders,
            ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
          },
        });
      }
    }

    // ✅ Get Last Queries
    if (request.method === "GET" && url.pathname === "/api/last-queries") {
      const list = await env.query_history_kv.list({ prefix: "query-" });
      const values = await Promise.all(
        list.keys.slice(-50).reverse().map((entry) =>
          env.query_history_kv.get(entry.name, { type: "json" })
        )
      );

      const uniqueRecent = values
        .filter(Boolean)
        .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))
        .slice(0, NUM_RECENT_QUERIES)
        .map((v) => v.query);

      return new Response(JSON.stringify(uniqueRecent), {
        headers: {
          ...baseCorsHeaders,
          "Content-Type": "application/json",
          ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
        },
      });
    }

    // ✅ Check Query History
    if (request.method === "POST" && url.pathname === "/api/checkqueryhistory") {
      try {
        const { query } = await request.json();
        if (!query || query.length < 3) {
          return new Response(JSON.stringify({ error: "Invalid query" }), {
            status: 400,
            headers: {
              ...baseCorsHeaders,
              ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
            },
          });
        }

        const queryKey = `query-${query}`;
        const cached = await env.query_history_kv.get(queryKey, { type: "json" });

        if (cached && cached.items) {
          return new Response(
            JSON.stringify({
              from: "cache",
              items: cached.items,
              timestamp: cached.timestamp,
              query: cached.query,
            }),
            {
              headers: {
                ...baseCorsHeaders,
                "Content-Type": "application/json",
                ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
              },
            }
          );
        }

        // Fallback to GitHub search
        const githubRes = await fetch(`${API_URLS.SEARCH}/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        const data = await githubRes.json();
        const items = data.items || [];

        // Store result
        const now = new Date().toISOString();
        const geo = request.cf || {};
        const originIp = request.headers.get("cf-connecting-ip") || "unknown";

        const record = {
          query,
          count: 1,
          timestamp: now,
          lastSeen: now,
          origin: originIp,
          items,
          geo: {
            country: geo.country || "unknown",
            region: geo.region || "unknown",
            city: geo.city || "unknown",
            colo: geo.colo || "unknown",
          },
        };

        await env.query_history_kv.put(queryKey, JSON.stringify(record));

        return new Response(
          JSON.stringify({ from: "fresh", items }),
          {
            headers: {
              ...baseCorsHeaders,
              "Content-Type": "application/json",
              ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
            },
          }
        );
      } catch (err) {
        console.error("checkqueryhistory fallback failed:", err);
        return new Response(
          JSON.stringify({ error: "Server error", detail: err.message }),
          {
            status: 500,
            headers: {
              ...baseCorsHeaders,
              ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
            },
          }
        );
      }
    }

    // ✅ Fallback search
    if (request.method === "POST" && url.pathname === "/api/fallback") {
      try {
        const { query } = await request.json();
        if (!query || query.length < 3) {
          return new Response(JSON.stringify({ error: "Invalid query" }), {
            status: 400,
            headers: {
              ...baseCorsHeaders,
              ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
            },
          });
        }

        const queryKey = `query-${query}`;
        const existing = await env.query_history_kv.get(queryKey, { type: "json" });

        if (existing) {
          return new Response(
            JSON.stringify({ from: "cache", query: existing.query }),
            {
              headers: {
                ...baseCorsHeaders,
                "Content-Type": "application/json",
                ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
              },
            }
          );
        }

        const githubRes = await fetch(`${API_URLS.SEARCH}/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        const data = await githubRes.json();
        const items = data.items || [];

        const now = new Date().toISOString();
        const geo = request.cf || {};
        const originIp = request.headers.get("cf-connecting-ip") || "unknown";

        const record = {
          query,
          count: 1,
          timestamp: now,
          lastSeen: now,
          origin: originIp,
          items,
          geo: {
            country: geo.country || "unknown",
            region: geo.region || "unknown",
            city: geo.city || "unknown",
            colo: geo.colo || "unknown",
          },
        };

        await env.query_history_kv.put(queryKey, JSON.stringify(record));

        return new Response(
          JSON.stringify({ from: "fresh", items }),
          {
            headers: {
              ...baseCorsHeaders,
              "Content-Type": "application/json",
              ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
            },
          }
        );
      } catch (err) {
        console.error("Fallback failed:", err);
        return new Response(
          JSON.stringify({ error: "Fallback failed" }),
          {
            status: 500,
            headers: {
              ...baseCorsHeaders,
              ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
            },
          }
        );
      }
    }

    // ✅ All query data dump
    if (request.method === "GET" && url.pathname === "/api/all-query-data") {
      try {
        const list = await env.query_history_kv.list({ prefix: "query-" });
        const records = await Promise.all(
          list.keys.map(entry =>
            env.query_history_kv.get(entry.name, { type: "json" })
          )
        );

        const filtered = records
          .filter(Boolean)
          .sort((a, b) => new Date(b.lastSeen || b.timestamp) - new Date(a.lastSeen || a.timestamp));

        return new Response(JSON.stringify(filtered, null, 2), {
          headers: {
            ...baseCorsHeaders,
            "Content-Type": "application/json",
            ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
          },
        });
      } catch (err) {
        console.error("all-query-data error:", err);
        return new Response(
          JSON.stringify({ error: "Failed to load KV data" }),
          {
            status: 500,
            headers: {
              ...baseCorsHeaders,
              ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
            },
          }
        );
      }
    }

    // ❌ Default 404
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: {
        ...baseCorsHeaders,
        "Content-Type": "application/json",
        ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
      },
    });
  },
};
