import { useEffect, useState } from "react";
import { communityQueries } from "../constants/communityQueries";

export const useRotatingQuery = (interval = 4000) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex(prev => (prev + 1) % communityQueries.length);
    }, interval);
    return () => clearInterval(id);
  }, [interval]);

  return communityQueries[index];
};
