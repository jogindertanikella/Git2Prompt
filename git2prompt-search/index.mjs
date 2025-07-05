import { convertToGitHubSearchQuery } from "../src/utils/naturalsearch.js";

const ALLOWED_ORIGINS = [
  "https://git2prompt.com",
  "https://www.git2prompt.com",
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    // Validate origin
    let allowedOrigin = "";
    if (ALLOWED_ORIGINS.includes(origin)) {
      allowedOrigin = origin;
    }

    const baseCorsHeaders = {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...baseCorsHeaders,
          ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
        },
      });
    }

    // Accept only POST
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: {
          ...baseCorsHeaders,
          ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
        },
      });
    }

    // /searchfromspintext — uses preformatted GitHub search query
    if (url.pathname === "/searchfromspintext") {
      try {
        const { query } = await request.json();
        if (!query || query.trim().length < 3) {
          return new Response(JSON.stringify({ error: "Invalid or too short query" }), {
            status: 400,
            headers: {
              ...baseCorsHeaders,
              ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
            },
          });
        }

        const githubApiUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(
          query.trim()
        )}&sort=stars&order=desc&per_page=6`;

        const response = await fetch(githubApiUrl, {
          headers: {
            Authorization: `Bearer ${env.GITHUB_SEARCH_TOKEN}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "Git2Prompt/1.0",
          },
        });

        const data = await response.json();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: {
            ...baseCorsHeaders,
            "Content-Type": "application/json",
            ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Server error", detail: err.message }), {
          status: 500,
          headers: {
            ...baseCorsHeaders,
            ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
          },
        });
      }
    }

    // /search — standard NLP → GitHub query
    if (url.pathname === "/search") {
      try {
        const { query } = await request.json();
        if (!query || query.trim().length < 3) {
          return new Response(JSON.stringify({ error: "Invalid or too short query" }), {
            status: 400,
            headers: {
              ...baseCorsHeaders,
              ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
            },
          });
        }

        const githubQuery = convertToGitHubSearchQuery(query);

        const githubApiUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(
          githubQuery
        )}&sort=stars&order=desc&per_page=6`;

        const response = await fetch(githubApiUrl, {
          headers: {
            Authorization: `Bearer ${env.GITHUB_SEARCH_TOKEN}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "Git2Prompt/1.0",
          },
        });

        const data = await response.json();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: {
            ...baseCorsHeaders,
            "Content-Type": "application/json",
            ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Server error", detail: err.message }), {
          status: 500,
          headers: {
            ...baseCorsHeaders,
            ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
          },
        });
      }
    }

    // Fallback
    return new Response("Not Found", {
      status: 404,
      headers: {
        ...baseCorsHeaders,
        ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
      },
    });
  },
};
