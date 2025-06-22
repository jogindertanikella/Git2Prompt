import { API_URLS } from "../src/constants/apicalls.js";

const NUM_RECENT_QUERIES = 12;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // ✅ Store Query
    if (request.method === "POST" && url.pathname === "/api/store-query") {
      try {
        const { query } = await request.json();
        const cleanQuery = query?.trim().toLowerCase();
        if (!cleanQuery || cleanQuery.length < 3) {
          return new Response("Invalid or too short query", { status: 400, headers: corsHeaders });
        }

        const queryKey = `query-${cleanQuery}`;
        const now = new Date().toISOString();
        const geo = request.cf || {};
        const origin = request.headers.get("cf-connecting-ip") || "unknown";

        const metadata = {
          timestamp: now,
          lastSeen: now,
          origin,
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
          headers: corsHeaders,
        });
      } catch {
        return new Response("Error storing query", { status: 500, headers: corsHeaders });
      }
    }

    // ✅ Get Last Queries (query strings only)
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
        headers: corsHeaders,
      });
    }

    // ✅ Check Query History: returns items if cached, otherwise fallback
    if (request.method === "POST" && url.pathname === "/api/checkqueryhistory") {
      try {
        const { query } = await request.json();
        if (!query || query.length < 3) {
          return new Response(JSON.stringify({ error: "Invalid query" }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        const queryKey = `query-${query}`;
        const cached = await env.query_history_kv.get(queryKey, { type: "json" });

        if (cached && cached.items) {
          return new Response(JSON.stringify({
            from: "cache",
            items: cached.items,
            timestamp: cached.timestamp,
            query: cached.query,
          }), {
            headers: corsHeaders,
          });
        }

        // ➡ Fallback to GitHub search
        const githubRes = await fetch(`${API_URLS.SEARCH}/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        const data = await githubRes.json();
        const items = data.items || [];

        // 💾 Store with results
        const now = new Date().toISOString();
        const geo = request.cf || {};
        const origin = request.headers.get("cf-connecting-ip") || "unknown";

        const record = {
          query,
          count: 1,
          timestamp: now,
          lastSeen: now,
          origin,
          items,
          geo: {
            country: geo.country || "unknown",
            region: geo.region || "unknown",
            city: geo.city || "unknown",
            colo: geo.colo || "unknown",
          },
        };

        await env.query_history_kv.put(queryKey, JSON.stringify(record));

        return new Response(JSON.stringify({ from: "fresh", items }), {
          headers: corsHeaders,
        });
      } catch (err) {
        console.error("checkqueryhistory fallback failed:", err);
        return new Response(JSON.stringify({ error: "Server error", detail: err.message }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    // ✅ Fallback (no NLP): always search GitHub and store results
    if (request.method === "POST" && url.pathname === "/api/fallback") {
      try {
        const { query } = await request.json();
        if (!query || query.length < 3) {
          return new Response(JSON.stringify({ error: "Invalid query" }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        const queryKey = `query-${query}`;
        const existing = await env.query_history_kv.get(queryKey, { type: "json" });

        if (existing) {
          return new Response(JSON.stringify({ from: "cache", query: existing.query }), {
            headers: corsHeaders,
          });
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
        const origin = request.headers.get("cf-connecting-ip") || "unknown";

        const record = {
          query,
          count: 1,
          timestamp: now,
          lastSeen: now,
          origin,
          items,
          geo: {
            country: geo.country || "unknown",
            region: geo.region || "unknown",
            city: geo.city || "unknown",
            colo: geo.colo || "unknown",
          },
        };

        await env.query_history_kv.put(queryKey, JSON.stringify(record));

        return new Response(JSON.stringify({ from: "fresh", items }), {
          headers: corsHeaders,
        });
      } catch (err) {
        console.error("Fallback failed:", err);
        return new Response(JSON.stringify({ error: "Fallback failed" }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    // ✅ New: Full Admin Dump of All Queries and Results
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
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        console.error("all-query-data error:", err);
        return new Response(JSON.stringify({ error: "Failed to load KV data" }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    // ❌ Default: 404
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: corsHeaders,
    });
  },
};
