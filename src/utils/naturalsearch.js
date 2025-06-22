// utils/naturalsearch.js

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

// --- Synonyms ---
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

// --- Levenshtein Distance (fuzzy) ---
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function closestMatch(word, choices, threshold = 2) {
  let minDist = Infinity;
  let bestMatch = word;
  for (const choice of choices) {
    const dist = levenshtein(word, choice);
    if (dist < minDist && dist <= threshold) {
      minDist = dist;
      bestMatch = choice;
    }
  }
  return bestMatch;
}

// --- Normalize token ---
function normalize(word) {
  return word.toLowerCase().replace(/[^\w+#]+/g, "");
}

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

  // --- Push detected metadata ---
  matchedLanguages.forEach(lang => params.push(`language:${lang}`));
  matchedTopics.forEach(topic => params.push(`topic:${topic}`));

  // --- Keywords ---
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
    params.unshift(finalKeywords.join(" "));
  }

  return params.filter(Boolean).join(" ");
}
