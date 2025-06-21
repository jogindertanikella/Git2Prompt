export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Only allow root path
    if (url.pathname !== "/") {
      return new Response("Not Found", { status: 404 });
    }

    const q = url.searchParams.get("q") || "";
    const stars = url.searchParams.get("stars") || "";
    const perPage = url.searchParams.get("per_page") || "6";

    const apiUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}${stars ? `+stars:>=${stars}` : ""}&sort=stars&order=desc&per_page=${perPage}`;

    // 🎯 Track spin count in KV
    try {
      const current = await env.SPIN_KV.get("spins");
      const count = parseInt(current || "0") + 1;
      await env.SPIN_KV.put("spins", count.toString());
    } catch (kvErr) {
      console.error("KV spin tracking failed:", kvErr);
    }

    try {
      const res = await fetch(apiUrl, {
        headers: { "User-Agent": "Git2Prompt" },
      });
      const data = await res.json();

      return new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "GitHub fetch failed" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  }
}
