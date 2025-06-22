// src/utils/spin.js

import { baseCategories } from "../constants/baseCategories";
import { fetchRepos } from "./fetchRepos";
import { uiuxoptions } from "../constants/uiuxoptions";

export const spin = ({ categoryIndex, stars, setRepos, setRateLimit, setLoading }) => {
  const categories = uiuxoptions.showCategories
    ? [{ name: "Random", stack: baseCategories.flatMap(c => c.stack) }, ...baseCategories]
    : [{ name: "Random", stack: baseCategories.flatMap(c => c.stack) }];

  const stack = categories[categoryIndex]?.stack;

  if (!stack || stack.length === 0) {
    console.error("Invalid category index or empty stack.");
    return;
  }

  const selected = Array.from({ length: 5 }, () =>
    stack[Math.floor(Math.random() * stack.length)]
  );

  fetchRepos({ query: selected, stars, setRepos, setRateLimit, setLoading });
};
