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

    let cachedPrompt = await env.PROMPT_CACHE.get(cacheKey);
    if (cachedPrompt) {
      return new Response(JSON.stringify({ prompt: cachedPrompt, cached: true }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

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

    const promptToLLM = `Given the following README from a GitHub repository:

${readmeText}

Generate a developer-oriented prompt that:
- Summarizes the purpose and tech stack.
- Proposes a modular folder structure.
- Suggests improvements or missing components.
- If incomplete, scaffolds an MVP structure with placeholders.
- Format the response as a prompt ready to paste into any AI coding assistant.`;

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

      // === 🧼 Clean up fluff from model response ===
      generatedPrompt = generatedPrompt
        // Remove common preambles
        .replace(/^.*(Here('?s)? the prompt:?|Sure!?|Okay,?|Prompt:)\s*/i, "")
        // Remove trailing disclaimers or suggestions
        .replace(/\n*Feel free to.*$/i, "")
        .replace(/\n*You can customize.*$/i, "")
        .replace(/\n*Let me know.*$/i, "")
        // Remove repeated newlines
        .replace(/\n{3,}/g, "\n\n")
        .trim();

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
