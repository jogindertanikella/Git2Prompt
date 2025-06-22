// src/utils/spin.js

import { baseCategories } from "../constants/baseCategories";
import { fetchRepos } from "./fetchRepos";
import { uiuxoptions } from "../constants/uiuxoptions";

export const spin = async ({ categoryIndex, stars, setRepos, setRateLimit, setLoading }) => {
  const categories = uiuxoptions.showCategories
    ? [{ name: "Random", stack: baseCategories.flatMap(c => c.stack) }, ...baseCategories]
    : [{ name: "Random", stack: baseCategories.flatMap(c => c.stack) }];

  const stack = categories[categoryIndex]?.stack;

  if (!stack || stack.length === 0) {
    console.error("Invalid category index or empty stack.");
    return { tags: [] };
  }

  const shuffled = [...stack].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3); // ensure uniqueness

  const repos = await fetchRepos({ query: selected, stars, setRepos, setRateLimit, setLoading });

  return { tags: selected, repos }; // ✅ now includes actual results
};
