import { useEffect, useState } from "react";
import { communityQueries } from "../constants/communityQueries";
import { API_URLS } from "../constants/apicalls";

export const useRotatingQuery = (interval = 4000) => {
  const [queries, setQueries] = useState(communityQueries);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const fetchQueries = async () => {
      try {
        const res = await fetch(`${API_URLS.QUERY}/api/last-queries`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setQueries(data);
          }
        }
      } catch (err) {
        console.warn("Fallback to community queries due to error:", err);
        // No need to set communityQueries since it's already default
      }
    };

    fetchQueries();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex(prev => (prev + 1) % queries.length);
    }, interval);
    return () => clearInterval(id);
  }, [interval, queries]);

  return queries[index];
};
