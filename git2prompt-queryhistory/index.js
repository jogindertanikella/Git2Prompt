import { API_URLS } from "../src/constants/apicalls.js";
import { ALLOWED_ORIGINS } from "../src/constants/allowedOrigins.js";

const NUM_RECENT_QUERIES = 12;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    const baseCorsHeaders = {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    const corsHeaders = { ...baseCorsHeaders };
    if (ALLOWED_ORIGINS.includes(origin)) {
      corsHeaders["Access-Control-Allow-Origin"] = origin;
    }

    // Preflight CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      // Store Query
      if (request.method === "POST" && url.pathname === "/api/store-query") {
        const { query } = await request.json();
        const cleanQuery = query?.trim().toLowerCase();
        if (!cleanQuery || cleanQuery.length < 3) {
          return new Response(JSON.stringify({ error: "Invalid or too short query" }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
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
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }

      // Get Last Queries
      if (request.method === "GET" && url.pathname === "/api/last-queries") {
        try {
          const list = await env.query_history_kv.list({ prefix: "query-" });
          const values = await Promise.all(
            list.keys.slice(-50).reverse().map((entry) =>
              env.query_history_kv.get(entry.name, { type: "json" })
            )
          );

          const uniqueRecent = values
            .filter(Boolean)
            .sort(
              (a, b) =>
                new Date(b.lastSeen || b.timestamp) - new Date(a.lastSeen || a.timestamp)
            )
            .slice(0, NUM_RECENT_QUERIES)
            .map((v) => v.query);

          return new Response(JSON.stringify(uniqueRecent), {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          });
        } catch (err) {
          console.error("last-queries error:", err);
          return new Response(
            JSON.stringify({ error: "Failed to load last queries" }),
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

      // Check Query History
      if (request.method === "POST" && url.pathname === "/api/checkqueryhistory") {
        const { query } = await request.json();
        if (!query || query.length < 3) {
          return new Response(JSON.stringify({ error: "Invalid query" }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
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
                "Content-Type": "application/json",
                ...corsHeaders,
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
          JSON.stringify({ from: "fresh", items, query }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      // Fallback Search
      if (request.method === "POST" && url.pathname === "/api/fallback") {
        const { query } = await request.json();
        if (!query || query.length < 3) {
          return new Response(JSON.stringify({ error: "Invalid query" }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
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
                "Content-Type": "application/json",
                ...corsHeaders,
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
          JSON.stringify({ from: "fresh", items, query }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      // All query data dump
      if (request.method === "GET" && url.pathname === "/api/all-query-data") {
        try {
          const list = await env.query_history_kv.list({ prefix: "query-" });
          const records = await Promise.all(
            list.keys.map((entry) =>
              env.query_history_kv.get(entry.name, { type: "json" })
            )
          );

          const filtered = records
            .filter(Boolean)
            .sort(
              (a, b) =>
                new Date(b.lastSeen || b.timestamp) - new Date(a.lastSeen || a.timestamp)
            );

          return new Response(JSON.stringify(filtered, null, 2), {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          });
        } catch (err) {
          console.error("all-query-data error:", err);
          return new Response(
            JSON.stringify({ error: "Failed to load KV data" }),
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

      // 404 Fallback
      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } catch (err) {
      console.error("Unexpected error:", err);
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
