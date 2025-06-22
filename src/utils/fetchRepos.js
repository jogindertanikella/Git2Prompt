import { API_URLS } from "../constants/apicalls";

export async function fetchRepos({ query, stars, setRepos, setRateLimit, setLoading }) {
  setLoading(true);
  const params = new URLSearchParams({ q: query, ...(stars > 0 ? { stars } : {}) });

  try {
    const res = await fetch(`${API_URLS.SEARCH}?${params}`);
    const data = await res.json();

    const items = data.items || [];
    setRepos(items);
    setRateLimit(data.rate || null);
    return items; // ✅ return items to caller
  } catch {
    setRepos([]);
    return []; // ✅ return empty array on failure
  } finally {
    setLoading(false);
  }
}
