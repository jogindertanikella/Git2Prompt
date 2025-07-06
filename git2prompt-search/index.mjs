//git2prompt-search

import { convertToGitHubSearchQueryWithNLP } from "../src/utils/nlpSearch.js";
import { getCorsHeaders } from "../src/constants/corsHeaders.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const corsHeaders = getCorsHeaders(origin);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      // Accept only POST
      if (request.method !== "POST") {
        return new Response(
          JSON.stringify({ error: "Method Not Allowed", step: "method check" }),
          {
            status: 405,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // /searchfromspintext — uses preformatted GitHub search query
      if (url.pathname === "/searchfromspintext") {
        const { query } = await request.json();
        if (!query || query.trim().length < 3) {
          return new Response(
            JSON.stringify({ error: "Invalid or too short query", step: "searchfromspintext validation" }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
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
        return new Response(JSON.stringify({
          ...data,
          step: "searchfromspintext success",
          originalQuery: query,
          convertedQuery: query.trim()
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        });
      }

      // /search — standard NLP → GitHub query
      if (url.pathname === "/search") {
        const { query } = await request.json();
        if (!query || query.trim().length < 3) {
          return new Response(
            JSON.stringify({ error: "Invalid or too short query", step: "search validation" }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }

        const githubQuery = convertToGitHubSearchQueryWithNLP(query);

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
        return new Response(JSON.stringify({
          ...data,
          step: "search success",
          originalQuery: query,
          convertedQuery: githubQuery
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        });
      }

      // Fallback for other POST routes
      return new Response(
        JSON.stringify({ error: "Not Found", step: "fallback not found" }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (err) {
      console.error("Unexpected server error:", err);
      return new Response(
        JSON.stringify({ error: "Server error", detail: err.message, step: "catch block" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
  },
};
