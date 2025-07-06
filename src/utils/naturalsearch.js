import nlp from "compromise";

export function convertToGitHubSearchQuery(input) {
  const clean = input.trim().toLowerCase();
  const params = [];

  const doc = nlp(clean);
  const nounTerms = doc.nouns().out("array");
  const verbTerms = doc.verbs().out("array");

  const QUESTION_WORDS = new Set(["how", "what", "which", "can", "could", "should", "would", "is", "are", "do", "does", "did"]);

  const tokens = [...nounTerms, ...verbTerms]
    .map(t => t.toLowerCase())
    .map(normalize)
    .filter(Boolean)
    .filter(w => !QUESTION_WORDS.has(w));

  const matchedTopics = new Set();
  const matchedLanguages = new Set();

  // Stars
  const starMatch = clean.match(/stars?\s*[:>=<]+\s*\d+/);
  if (starMatch) {
    const cleanedStar = starMatch[0].replace(/\s+/g, "").replace("stars", "stars");
    params.push(cleanedStar.includes(":") ? cleanedStar : `stars:${cleanedStar.split(/[:>=<]+/)[1]}`);
  } else if (clean.includes("popular") || clean.includes("trending")) {
    params.push("stars:>500");
  }

  // Synonyms
  tokens.forEach(token => {
    const mapped = SYNONYMS[token];
    if (mapped && TOPIC_KEYWORDS[mapped]) {
      matchedTopics.add(mapped);
    }
  });

  // Fuzzy language
  tokens.forEach(token => {
    const match = closestMatch(token, LANGUAGES);
    if (LANGUAGES.includes(match)) {
      matchedLanguages.add(match);
    }
  });

  // Fuzzy topic
  const allKeywords = Object.entries(TOPIC_KEYWORDS).flatMap(([topic, list]) =>
    list.map(keyword => ({ keyword, topic }))
  );
  tokens.forEach(token => {
    const match = allKeywords.find(({ keyword }) => levenshtein(token, normalize(keyword)) <= 1);
    if (match) {
      matchedTopics.add(match.topic);
    }
  });

  // Keywords filtering
  const knownWords = new Set([
    ...LANGUAGES,
    ...Object.keys(SYNONYMS),
    ...Object.values(SYNONYMS),
    ...Object.values(TOPIC_KEYWORDS).flat()
  ]);

  const finalKeywords = tokens.filter(
    w => w.length > 2 && !STOP_WORDS.has(w) && !knownWords.has(w)
  );

  if (finalKeywords.length) {
    params.unshift(finalKeywords.slice(0, 2).join(" "));
  }

  matchedLanguages.forEach(lang => params.push(`language:${lang}`));
  matchedTopics.forEach(topic => params.push(`topic:${topic}`));

  return params.filter(Boolean).join(" ");
}
