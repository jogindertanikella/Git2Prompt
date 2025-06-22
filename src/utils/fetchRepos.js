import { API_URLS } from "../constants/apicalls";

export async function fetchRepos({ query, stars, setRepos, setRateLimit, setLoading }) {
  setLoading(true);

  // Ensure query is a space-separated string
  const safeQuery = Array.isArray(query) ? query.join(" ") : (query || "").toString().trim();

  // Apply stars filter if needed
  const fullQuery = stars > 0 ? `${safeQuery} stars:>=${stars}` : safeQuery;

  try {
    const res = await fetch(`${API_URLS.SEARCH}/searchfromspintext`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: fullQuery }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Repo fetch failed:", text);
      setRepos([]);
      return [];
    }

    const data = await res.json();
    const items = data.items || [];

    setRepos(items);
    setRateLimit(data.rate || null);
    return items;
  } catch (err) {
    console.error("Repo fetch failed:", err);
    setRepos([]);
    return [];
  } finally {
    setLoading(false);
  }
}
