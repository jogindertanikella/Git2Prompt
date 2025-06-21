import { useEffect, useState } from "react";

const baseCategories = [
  { name: "AI / ML", stack: ["topic:tensorflow", "topic:pytorch", "topic:scikit-learn", "topic:fastapi", "topic:pandas"] },
  { name: "Web Dev", stack: ["topic:react", "topic:nextjs", "topic:express", "topic:tailwindcss", "topic:nodejs"] },
  { name: "DevOps / CI/CD", stack: ["topic:docker", "topic:github-actions", "topic:kubernetes", "topic:helm", "topic:terraform"] },
  { name: "Security", stack: ["topic:oauth", "topic:owasp", "topic:keycloak", "topic:snyk"] },
  { name: "Database", stack: ["topic:postgresql", "topic:mongodb", "topic:mysql", "topic:redis"] },
  { name: "Mobile", stack: ["topic:flutter", "topic:react-native", "topic:kotlin", "topic:swift"] }
];

const categories = [{ name: "Random", stack: baseCategories.flatMap(c => c.stack) }, ...baseCategories];
const starOptions = [0, 100, 500, 1000, 5000];

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState([]);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [spinCount, setSpinCount] = useState(null);
  const [rateLimit, setRateLimit] = useState(null);
  const [modalPrompt, setModalPrompt] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [disabledRepoId, setDisabledRepoId] = useState(null);
  const [hoveredRepoId, setHoveredRepoId] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    fetchSpinCount();
  }, []);

  const fetchSpinCount = async () => {
    try {
      const res = await fetch("https://search.git2promptapi.com");
      const data = await res.json();
      setSpinCount(data.spins);
    } catch {
      setSpinCount(null);
    }
  };

  const spin = () => {
    const stack = categories[categoryIndex].stack;
    const selected = Array.from({ length: 5 }, () => stack[Math.floor(Math.random() * stack.length)]);
    setTags(selected);
    fetchRepos(selected);
  };

  const fetchRepos = async (tags) => {
    setLoading(true);
    const query = [...new Set(tags)].join(" ");
    const params = new URLSearchParams({ q: query, ...(stars > 0 ? { stars } : {}) });

    try {
      const res = await fetch(`https://search.git2promptapi.com?${params}`);
      const data = await res.json();
      setRepos(data.items || []);
      setRateLimit(data.rate || null);
    } catch {
      setRepos([]);
    }

    setLoading(false);
  };

  const handlePrompt = async (id, url) => {
    setDisabledRepoId(id);
    try {
      const res = await fetch("https://prompt.git2promptapi.com/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      const data = await res.json();
      setModalPrompt(data.prompt || "⚠️ Failed to fetch prompt.");
      setShowModal(true);
    } catch {
      setModalPrompt("⚠️ Error generating prompt.");
      setShowModal(true);
    }
    setDisabledRepoId(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-black dark:bg-zinc-900 dark:text-white px-4 py-6">
      <header className="flex items-center justify-between max-w-5xl mx-auto mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <img src="/images/git2prompt.png" className="w-12 h-12 rounded-lg" alt="Logo" />
          Git2Prompt&nbsp;
        </h1>
        <button
          onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          className="text-2xl"
        >
          {theme === "dark" ? "🌙" : "☀️"}
        </button>
      </header>

      <div className="text-center text-sm mb-4">
        🎯 {spinCount !== null ? `${spinCount.toLocaleString()} spins and counting!` : "Loading..."}
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <select
          value={categoryIndex}
          onChange={(e) => setCategoryIndex(Number(e.target.value))}
          className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-4 py-2 rounded"
        >
          {categories.map((c, i) => (
            <option key={c.name} value={i}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={stars}
          onChange={(e) => setStars(Number(e.target.value))}
          className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-4 py-2 rounded"
        >
          {starOptions.map((s) => (
            <option key={s} value={s}>
              {s === 0 ? "Any Stars" : `${s}+ Stars`}
            </option>
          ))}
        </select>

<button
  onClick={spin}
  className="btn-shimmer bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-bold"
>
  🎲 Roll
</button>


      </div>

      {loading ? (
        <p className="text-center">🔄 Fetching repositories...</p>
      ) : repos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="bg-zinc-100 dark:bg-zinc-800 p-5 rounded-xl shadow-md relative"
              onMouseEnter={() => setHoveredRepoId(repo.id)}
              onMouseLeave={() => setHoveredRepoId(null)}
            >
              <h2 className="text-blue-600 dark:text-blue-400 font-semibold text-lg truncate">
                {repo.full_name}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2 min-h-[3em]">
                {repo.description || "No description"}
              </p>
              <div className="text-yellow-600 dark:text-yellow-400 text-sm mt-2">⭐ {repo.stargazers_count.toLocaleString()}</div>
              <div className="mt-3 flex gap-2">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 px-3 py-1 rounded text-sm hover:bg-emerald-700 text-white"
                >
                  GitHub ↗
                </a>
                <button
                  disabled={!!disabledRepoId}
                  onClick={() => handlePrompt(repo.id, repo.html_url)}
                  className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
                    disabledRepoId === repo.id
                      ? "bg-yellow-400 text-black"
                      : "bg-yellow-500 text-black hover:bg-yellow-400"
                  }`}
                >
                  {disabledRepoId === repo.id ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      🧠 Git2Prompt
                    </>
                  )}
                </button>
              </div>

              {hoveredRepoId === repo.id && repo.description && (
                <div className="absolute inset-0 bg-black bg-opacity-80 text-white p-4 rounded-xl z-10 overflow-auto">
                  <p className="text-sm">{repo.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-zinc-500">😕 No repositories found for your tags and filters.</p>
      )}

      {rateLimit && (
        <p className="text-center text-xs text-zinc-400 mt-4">
          ⏱ GitHub API: {rateLimit.remaining} left – resets at{" "}
          {new Date(rateLimit.reset * 1000).toLocaleTimeString()}
        </p>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white text-black rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-2">Generated Prompt</h3>
            <textarea
              readOnly
              className="w-full h-40 border p-2 rounded"
              value={modalPrompt}
            />
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(modalPrompt);
                  alert("✅ Prompt copied!");
                }}
                className="bg-blue-600 text-white px-4 py-1 rounded"
              >
                📋 Copy
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-600 underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-auto text-center text-sm text-zinc-600 dark:text-zinc-400 backdrop-blur-sm bg-white/80 dark:bg-zinc-900/80 w-full py-4 sticky bottom-0">
        Made with ❤️ by Joginder Tanikella. © 2025{" "}
        <a
          href="https://x.com/jogitanikella"
          className="text-blue-600 dark:text-blue-400 ml-2"
          target="_blank"
        >
          x
        </a>
        <a
          href="https://www.linkedin.com/in/jogindertanikella/"
          className="text-blue-600 dark:text-blue-400 ml-2"
          target="_blank"
        >
          in
        </a>
      </footer>
    </div>
  );
}
