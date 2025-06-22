// utils/nlSearch.js

export const resolveNaturalLanguageSearch = async (query) => {
  try {
    const res = await fetch("https://prompt.git2promptapi.com/nlsearch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    const data = await res.json();

    // Expecting: { tags: ["topic:react", "topic:nextjs"], stars: 500 }
    return {
      tags: data.tags || [],
      stars: data.stars || 0
    };
  } catch (err) {
    console.error("Natural language search failed:", err);
    return { tags: [], stars: 0 };
  }
};
