export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json"
    };

    // Handle OPTIONS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (url.pathname !== "/") {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: corsHeaders
      });
    }

    const q = url.searchParams.get("q") || "";
    const stars = url.searchParams.get("stars") || "";
    const perPage = url.searchParams.get("per_page") || "6";

    const apiUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}${stars ? `+stars:>=${stars}` : ""}&sort=stars&order=desc&per_page=${perPage}`;

    // 🎯 Spin counter update
    let newSpinCount = 0;
    try {
      const current = await env.visitor_count_kv.get("spins");
      const count = parseInt(current || "0", 10);
      newSpinCount = count + 1;
      await env.visitor_count_kv.put("spins", newSpinCount.toString());
    } catch (kvErr) {
      console.error("KV access failed:", kvErr);
    }

    try {
      const githubRes = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${env.GITHUB_SEARCH_TOKEN}`,
          "User-Agent": "Git2Prompt-Search"
        }
      });

      const data = await githubRes.json();

      return new Response(JSON.stringify({
        items: data.items || [],
        rate: {
          limit: githubRes.headers.get("X-RateLimit-Limit"),
          remaining: githubRes.headers.get("X-RateLimit-Remaining"),
          reset: githubRes.headers.get("X-RateLimit-Reset")
        },
        spins: newSpinCount
      }), {
        headers: corsHeaders
      });

    } catch (err) {
      console.error("GitHub fetch failed:", err);
      return new Response(JSON.stringify({
        error: "GitHub fetch failed",
        details: err.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};
