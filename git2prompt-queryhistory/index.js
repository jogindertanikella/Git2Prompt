export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // ⚙️ Handle preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // 🚀 Store query POST
    if (request.method === "POST" && url.pathname === "/api/store-query") {
      try {
        const { query } = await request.json();
        const cleanQuery = query?.trim().toLowerCase();

        if (!cleanQuery || cleanQuery.length < 3) {
          return new Response("Invalid or too short query", {
            status: 400,
            headers: corsHeaders,
          });
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
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } catch (err) {
        return new Response("Error storing query", {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    // 🔍 Fetch last distinct 6 queries (most recent)
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
        .slice(0, 6)
        .map((v) => v.query);

      return new Response(JSON.stringify(uniqueRecent), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
};
