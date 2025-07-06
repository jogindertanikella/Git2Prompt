import nlp from "compromise";

// Assume these constants exist as before:
const STOP_WORDS = new Set([
  "i", "want", "to", "make", "build", "create", "develop", "an", "a", "the", "for",
  "with", "using", "based", "on", "of", "project", "app", "application", "tool", "idea"
]);

const LANGUAGES = [
  "javascript", "typescript", "python", "java", "go", "rust", "c++", "c#", "php", "ruby", "swift", "kotlin"
];

const TOPIC_KEYWORDS = {
  cli: ["cli", "commandline", "terminal", "cmd"],
  web: ["web", "frontend", "front-end", "front end", "website", "ui", "interface"],
  api: ["api", "rest", "graphql", "endpoint"],
  "machine-learning": ["machinelearning", "ml", "tensorflow", "pytorch", "scikit", "sklearn"],
  ai: ["ai", "gpt", "chatgpt", "openai", "llm", "bert", "transformer"],
  mobile: ["mobile", "android", "ios", "kotlin", "swift", "reactnative", "flutter"],
  backend: ["backend", "server", "express", "node", "api", "django", "rails", "springboot"],
  security: ["security", "auth", "authentication", "jwt", "oauth", "encryption"],
  devops: ["devops", "docker", "kubernetes", "ci", "cd", "infrastructure", "ansible", "terraform"],
  database: ["database", "sql", "nosql", "postgres", "mysql", "mongodb", "redis", "sqlite"]
};

const SYNONYMS = {
  react: "web",
  vue: "web",
  angular: "web",
  svelte: "web",
  reactnative: "mobile",
  flask: "backend",
  django: "backend",
  node: "backend",
  express: "backend",
  fastapi: "backend",
  mongodb: "database",
  postgres: "database",
  mysql: "database",
  tensorflow: "machine-learning",
  pytorch: "machine-learning",
  langchain: "ai",
  huggingface: "ai"
};

function normalize(word) {
  return word.toLowerCase().replace(/[^\w+#]+/g, "");
}

// Exact match only for languages
function exactMatch(word, choices) {
  return choices.includes(word) ? word : null;
}

// --- Main function ---
export function convertToGitHubSearchQuery(input) {
  const clean = input.trim().toLowerCase();
  const params = [];

  // Use compromise to extract nouns and verbs
  const doc = nlp(clean);
  const nounTerms = doc.nouns().out("array");
  const verbTerms = doc.verbs().out("array");

  const QUESTION_WORDS = new Set([
    "how", "what", "which", "can", "could", "should", "would", "is", "are", "do", "does", "did"
  ]);

  const tokens = [...nounTerms, ...verbTerms]
    .map(t => t.toLowerCase())
    .map(normalize)
    .filter(Boolean)
    .filter(w => !QUESTION_WORDS.has(w))
    .filter(w => w.length >= 3); // Remove short words

  const matchedTopics = new Set();
  const matchedLanguages = new Set();

  // --- Stars ---
  const starMatch = clean.match(/stars?\s*[:>=<]+\s*\d+/);
  if (starMatch) {
    const cleanedStar = starMatch[0].replace(/\s+/g, "").replace("stars", "stars");
    params.push(
      cleanedStar.includes(":")
        ? cleanedStar
        : `stars:${cleanedStar.split(/[:>=<]+/)[1]}`
    );
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

  // --- Exact match language ---
  tokens.forEach(token => {
    const match = exactMatch(token, LANGUAGES);
    if (match) {
      matchedLanguages.add(match);
    }
  });

  // --- Exact topic keywords ---
  const allKeywords = Object.entries(TOPIC_KEYWORDS).flatMap(([topic, list]) =>
    list.map(keyword => ({ keyword, topic }))
  );
  tokens.forEach(token => {
    const match = allKeywords.find(({ keyword }) => token === normalize(keyword));
    if (match) {
      matchedTopics.add(match.topic);
    }
  });

  // --- Final keywords ---
  const knownWords = new Set([
    ...LANGUAGES,
    ...Object.keys(SYNONYMS),
    ...Object.values(SYNONYMS),
    ...Object.values(TOPIC_KEYWORDS).flat()
  ]);

  const finalKeywords = tokens.filter(
    w => !STOP_WORDS.has(w) && !knownWords.has(w)
  );

  if (finalKeywords.length) {
    params.unshift(finalKeywords.slice(0, 2).join(" "));
  }

  matchedLanguages.forEach(lang => params.push(`language:${lang}`));
  matchedTopics.forEach(topic => params.push(`topic:${topic}`));

  return params.filter(Boolean).join(" ");
}
