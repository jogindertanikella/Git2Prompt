// src/utils/nlpSearch.js
import nlp from "compromise";

export function convertToGitHubSearchQueryWithNLP(input) {
  const STOP_WORDS = new Set([
    "i","want","to","make","build","create","develop","an","a","the","for",
    "with","using","based","on","of","project","app","application","tool","idea"
  ]);

  const LANGUAGES = [
    "javascript","typescript","python","java","go","rust","c++","c#","php","ruby","swift","kotlin"
  ];

  const TOPIC_KEYWORDS = {
    cli: ["cli","commandline","terminal","cmd"],
    web: ["web","frontend","website","ui","interface"],
    api: ["api","rest","graphql","endpoint"],
    "machine-learning": ["machinelearning","ml","tensorflow","pytorch"],
    ai: ["ai","gpt","chatgpt","openai"],
    mobile: ["mobile","android","ios","flutter"],
    backend: ["backend","server","express","django"],
    security: ["security","auth","jwt","oauth"],
    devops: ["devops","docker","kubernetes","ci","cd"],
    database: ["database","sql","postgres","mysql","mongodb"]
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
    tensorflow: "machine-learning",
    pytorch: "machine-learning",
    huggingface: "ai"
  };

  function normalize(word) {
    return word.toLowerCase().replace(/[^\w+#]+/g, "");
  }

  function exactMatch(word, choices) {
    return choices.includes(word) ? word : null;
  }

  const clean = input.trim().toLowerCase();
  const params = [];

  const doc = nlp(clean);
  const nounTerms = doc.nouns().out("array");
  const verbTerms = doc.verbs().out("array");

  const QUESTION_WORDS = new Set([
    "how","what","which","can","could","should","would","is","are","do","does","did"
  ]);

  const tokens = [...nounTerms, ...verbTerms]
    .flatMap(t => t.split(/\s+/))     // IMPORTANT SPLIT!
    .map(t => normalize(t))
    .filter(Boolean)
    .filter(w => !QUESTION_WORDS.has(w))
    .filter(w => w.length >=3);

  const matchedTopics = new Set();
  const matchedLanguages = new Set();

  tokens.forEach(token => {
    const mapped = SYNONYMS[token];
    if (mapped && TOPIC_KEYWORDS[mapped]) {
      matchedTopics.add(mapped);
    }
  });

  tokens.forEach(token => {
    const match = exactMatch(token, LANGUAGES);
    if (match) {
      matchedLanguages.add(match);
    }
  });

  const allKeywords = Object.entries(TOPIC_KEYWORDS).flatMap(([topic, list]) =>
    list.map(keyword => ({ keyword, topic }))
  );
  tokens.forEach(token => {
    const match = allKeywords.find(({ keyword }) => token === normalize(keyword));
    if (match) {
      matchedTopics.add(match.topic);
    }
  });

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
    params.push(finalKeywords.slice(0, 2).join(" "));
  }

  matchedLanguages.forEach(lang => params.push(`language:${lang}`));
  matchedTopics.forEach(topic => params.push(`topic:${topic}`));

  return params.filter(Boolean).join(" ");
}
