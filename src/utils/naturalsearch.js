export function convertToGitHubSearchQuery(input) {
  const clean = input.trim().toLowerCase();
  const params = [];
  const tokens = clean.split(/\W+/).map(normalize).filter(Boolean);

  const matchedTopics = new Set();
  const matchedLanguages = new Set();

  // --- Stars ---
  const starMatch = clean.match(/stars?\s*[:>=<]+\s*\d+/);
  if (starMatch) {
    const cleanedStar = starMatch[0].replace(/\s+/g, "").replace("stars", "stars");
    params.push(cleanedStar.includes(":") ? cleanedStar : `stars:${cleanedStar.split(/[:>=<]+/)[1]}`);
  } else if (clean.includes("popular") || clean.includes("trending")) {
    params.push("stars:>500");
  }

  // --- Synonym-based mapping ---
  tokens.forEach(token => {
    const mapped = SYNONYMS[token];
    if (mapped && TOPIC_KEYWORDS[mapped]) {
      matchedTopics.add(mapped);
    }
  });

  // --- Fuzzy match language ---
  tokens.forEach(token => {
    const match = closestMatch(token, LANGUAGES);
    if (LANGUAGES.includes(match)) {
      matchedLanguages.add(match);
    }
  });

  // --- Fuzzy match topics ---
  const allKeywords = Object.entries(TOPIC_KEYWORDS).flatMap(([topic, list]) =>
    list.map(keyword => ({ keyword, topic }))
  );
  tokens.forEach(token => {
    const match = allKeywords.find(({ keyword }) => levenshtein(token, normalize(keyword)) <= 1);
    if (match) {
      matchedTopics.add(match.topic);
    }
  });

  // --- Remove generic question words ---
  const QUESTION_WORDS = new Set(["how", "what", "which", "can", "could", "should", "would", "is", "are", "do", "does", "did"]);

  // --- Keywords ---
  const knownWords = new Set([
    ...LANGUAGES,
    ...Object.keys(SYNONYMS),
    ...Object.values(SYNONYMS),
    ...Object.values(TOPIC_KEYWORDS).flat()
  ]);

  const finalKeywords = tokens.filter(
    w =>
      !STOP_WORDS.has(w) &&
      !knownWords.has(w) &&
      !QUESTION_WORDS.has(w)
  );

  // --- Build final query ---
  if (finalKeywords.length) {
    // Only keep up to 2 keywords to avoid noise
    params.unshift(finalKeywords.slice(0, 2).join(" "));
  }

  matchedLanguages.forEach(lang => params.push(`language:${lang}`));
  matchedTopics.forEach(topic => params.push(`topic:${topic}`));

  return params.filter(Boolean).join(" ");
}
