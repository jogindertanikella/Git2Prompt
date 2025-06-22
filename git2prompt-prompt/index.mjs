const ALLOWED_ORIGINS = [
  "https://git2prompt.com",
  "https://www.git2prompt.com",
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Debug endpoint: list all prompts
    if (request.method === "GET" && url.pathname === "/api/all-prompts") {
      const list = await env.PROMPT_CACHE.list();
      const data = {};
      for (const entry of list.keys) {
        const value = await env.PROMPT_CACHE.get(entry.name);
        data[entry.name] = value;
      }
      return new Response(JSON.stringify(data, null, 2), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Use POST method", { status: 405, headers: corsHeaders });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON body", { status: 400, headers: corsHeaders });
    }

    const repoUrl = body.url;
    if (!repoUrl || !repoUrl.startsWith("https://github.com/")) {
      return new Response("Missing or invalid GitHub URL", { status: 400, headers: corsHeaders });
    }

    const [_, owner, repo] = repoUrl.split("/").slice(-3);
    const cacheKey = `${owner}/${repo}`;

    // Check KV cache first
    let cachedPrompt = await env.PROMPT_CACHE.get(cacheKey);
    if (cachedPrompt) {
      return new Response(JSON.stringify({ prompt: cachedPrompt, cached: true }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Fetch README from GitHub
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
    let readmeText = "";
    try {
      const res = await fetch(apiUrl, {
        headers: {
          "User-Agent": "Git2Prompt-Worker",
          "Accept": "application/vnd.github.v3.raw",
          Authorization: `Bearer ${env.GITHUB_PROMPT_TOKEN}`,
        },
      });
      readmeText = res.ok ? await res.text() : "README could not be fetched.";
    } catch {
      readmeText = "Error fetching README.";
    }

    const promptToLLM = `You are a senior software engineer working with the Cursor code editor.

Analyze the GitHub repo at ${repoUrl}.

Here is the README:
---
${readmeText}
---

Please generate a Cursor-compatible prompt that:
1. Summarizes the purpose and tech stack.
2. Proposes a modular folder structure.
3. Suggests any improvements or missing components.
4. If the project is incomplete, scaffold an MVP structure with placeholder components.
5. Write this as a prompt someone can paste into Cursor to get to work immediately.`;

    let generatedPrompt = "⚠️ No response from model.";
    try {
      const cohereRes = await fetch("https://api.cohere.ai/v1/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.COHERE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "command-r-plus",
          message: promptToLLM,
          temperature: 0.5,
        }),
      });

      const result = await cohereRes.json();
      console.log("Cohere result:", JSON.stringify(result));

      if (result.text) {
        generatedPrompt = result.text;
      } else if (result.generations?.length > 0) {
        generatedPrompt = result.generations[0].text;
      } else {
        generatedPrompt = JSON.stringify(result, null, 2);
      }

      await env.PROMPT_CACHE.put(cacheKey, generatedPrompt);
    } catch (err) {
      console.error("Cohere error:", err);
      generatedPrompt = "⚠️ Failed to fetch prompt from model.";
    }

    return new Response(JSON.stringify({ prompt: generatedPrompt, cached: false }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  },
};
