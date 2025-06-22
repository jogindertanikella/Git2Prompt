import { useEffect, useRef, useState } from "react";
import { fallbackRepos } from "./constants/fallbackRepos";
import { baseCategories } from "./constants/baseCategories";
import { API_URLS } from "./constants/apicalls";
import { fetchSpinCount } from "./utils/fetchSpinCount";
import { fetchRepos } from "./utils/fetchRepos";
import { handlePrompt } from "./utils/handlePrompt";
import { spin } from "./utils/spin";
import { timeAgo } from "./utils/timeAgo";
import { uiuxoptions } from "./constants/uiuxoptions";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
import { useRotatingQuery } from "./utils/useRotatingQuery";
import { useTypingEffect } from "./utils/useTypingEffect";
import { isValidGithubUrl } from "./utils/isValidGithubUrl";
import { readableToTopicMap } from "./constants/readableToTopicMap";

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [repos, setRepos] = useState(fallbackRepos);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [spinCount, setSpinCount] = useState(null);
  const [rateLimit, setRateLimit] = useState(null);
  const [modalPrompt, setModalPrompt] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [disabledRepoId, setDisabledRepoId] = useState(null);
  const [hoveredRepoId, setHoveredRepoId] = useState(null);
  const [infoMessage, setInfoMessage] = useState("");


  const inputRef = useRef(null);

  const categories = [
    { name: "Random", stack: baseCategories.flatMap((c) => c.stack) },
    ...baseCategories,
  ];
  const starOptions = [0, 100, 500, 1000, 5000];

  const rotatingQuery = useRotatingQuery();
  const typedQuery = useTypingEffect(rotatingQuery, uiuxoptions.enableTypingEffect);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    fetchSpinCount(setSpinCount);
  }, []);

useEffect(() => {
  const handleKey = (e) => {
    if (e.key === "/" && document.activeElement !== inputRef.current) {
      e.preventDefault();
      inputRef.current?.focus();
    } else if (e.key === "Enter" && document.activeElement === inputRef.current) {
      e.preventDefault();
      triggerSearch(searchQuery);
    }
  };

  window.addEventListener("keydown", handleKey);
  return () => window.removeEventListener("keydown", handleKey);
}, [searchQuery]);


const triggerSearch = async (input) => {
  const clean = input?.trim();
  if (!clean || clean.length < 3) return;

  setSearchQuery(clean);
  setSearchLoading(true);

  try {
    // 🧠 GitHub URL → Generate prompt
    if (isValidGithubUrl(clean)) {
      await handlePrompt({
        id: Date.now(),
        url: clean,
        setDisabledRepoId,
        setModalPrompt,
        setShowModal,
      });

      // ✅ Skip rest of search flow
      return;
    }

    // 🔁 checkqueryhistory (cache → NLP → GitHub search → store)
const res = await fetch(`${API_URLS.QUERY}/api/checkqueryhistory`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: clean }),
});


    const data = await res.json();
// console.log(data);
    if (!data.items || data.items.length === 0) {
    //  toast.info("❌ No results found.");
       setInfoMessage("❌ No results found.");
  setRepos([]); // ✅ clear grid
  setSearchQuery("");
    // Auto-clear after 3 seconds
  setTimeout(() => setInfoMessage(""), 3000);
    } else {
      setRepos(data.items);
      setRateLimit(data.rate || {});
    }
  } catch (err) {
  //  console.error("Search error:", err);
//    toast.error("⚠️ Something went wrong. Please try again.");
       setInfoMessage("⚠️ Something went wrong. Please try again.");
  setRepos([]); // ✅ clear grid
  setSearchQuery("");
    // Auto-clear after 3 seconds
  setTimeout(() => setInfoMessage(""), 3000);
  } finally {
    setSearchLoading(false);
  }
};





  return (
    <div className="min-h-screen flex flex-col bg-white text-black dark:bg-zinc-900 dark:text-white px-4 py-6">
      <header className="flex items-center justify-between max-w-6xl mx-auto mb-6">
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <img src="/images/git2prompt.png" className="w-12 h-12 rounded-lg" alt="Logo" />
            Git2Prompt
          </h1>
        </div>
        <button
          onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          className="text-2xl ml-6"
        >
          {theme === "dark" ? "🌙" : "☀️"}
        </button>
      </header>

      <div className="w-full flex flex-col items-center mb-6 px-4">
<div className="relative w-full max-w-3xl">
  <input
    ref={inputRef}
    type="text"
    placeholder="🔍 Ask anything... or paste a GitHub repo URL"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    disabled={searchLoading || loading}
    className={`w-full px-6 py-3 pr-20 rounded-full border bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-opacity duration-300 ${
      searchLoading || loading ? "opacity-50 blur-[1px] cursor-not-allowed" : ""
    }`}
  />

  {searchQuery && (
    <button
      onClick={() => setSearchQuery("")}
      disabled={searchLoading || loading}
      className={`absolute right-12 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-red-500 text-xl transition-opacity duration-300 ${
        searchLoading || loading ? "opacity-50 blur-[1px] cursor-not-allowed" : ""
      }`}
    >
      ❌
    </button>
  )}

  <button
    disabled={searchLoading || loading || !searchQuery.trim()}
    onClick={() => triggerSearch(searchQuery)}
    className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-xl transition-opacity duration-300 ${
      searchLoading || loading ? "opacity-50 blur-[1px] cursor-not-allowed" : ""
    }`}
  >
    {searchLoading || loading ? (
      <svg
        className="animate-spin h-5 w-5 text-yellow-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 2h8m-8 20h8M8 2v2a6 6 0 006 6v0a6 6 0 01-6 6v2m8-16v2a6 6 0 01-6 6v0a6 6 0 006 6v2"
        />
      </svg>
    ) : (
      "🚀"
    )}
  </button>
</div>




<div className="text-center text-sm mt-2 text-zinc-500 dark:text-zinc-400">
  <p>

    <span
      onClick={() => triggerSearch(rotatingQuery)}
      className="italic text-blue-500 cursor-pointer hover:underline"
    >
      "{typedQuery}"
    </span>
  </p>
<p className="mt-1">💡 Based on what others are exploring - Try it out ↑ </p>


</div>
        <div className="mt-4 flex justify-center gap-4">
          <button
            disabled={searchLoading || loading}
onClick={async () => {
  const selectedCategory = categories[categoryIndex];
  const stack = selectedCategory.stack;

  const selectedTags = Array.from(
    new Set(Array.from({ length: 3 }, () => stack[Math.floor(Math.random() * stack.length)]))
  );

  const tagsText = selectedTags
    .map((t) => t.replace(/^topic:/, ""))
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .join(", ")
    .replace(/, ([^,]*)$/, " and $1");

  const starLabel = stars === 0 ? "any star count" : `${stars}+ stars`;
  const readable = `${tagsText} projects with ${starLabel}`;
  setSearchQuery(readable);

  try {
    const result = await spin({
      categoryIndex,
      categories,
      stars,
      setRepos,
      setRateLimit,
      setLoading,
    });

    if (!result.repos || result.repos.length === 0) {
     // toast.info("❌ No results found.");
 setInfoMessage("❌ No results found.");
  setSearchQuery("");
  setRepos([]); // ✅ clear grid
  // Auto-clear after 3 seconds
  setTimeout(() => setInfoMessage(""), 3000);
    }
  } catch (err) {
    //console.error("Spin search error:", err);
   // toast.error("⚠️ Something went wrong during spin.");
 setInfoMessage("⚠️ Something went wrong during spin.");
  setSearchQuery("");
  setRepos([]); // ✅ clear grid
  // Auto-clear after 3 seconds
  setTimeout(() => setInfoMessage(""), 3000);
  }
}}


            className={`${
              searchLoading || loading ? "opacity-50 cursor-not-allowed" : ""
            } btn-shimmer bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full text-sm font-medium`}
          >
{loading ? (
  <span className="flex items-center gap-2">
    <svg
      className="animate-spin h-5 w-5 text-white"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M6 2a1 1 0 000 2v2a6 6 0 003 5.2A6 6 0 006 16v2a1 1 0 000 2h12a1 1 0 000-2v-2a6 6 0 00-3-4.8A6 6 0 0018 6V4a1 1 0 000-2H6zm2 2h8v2a4 4 0 01-2.3 3.6 1 1 0 00-.2.2 1 1 0 01-1.5 0 1 1 0 00-.2-.2A4 4 0 018 6V4zm8 14H8v-2a4 4 0 012.3-3.6 1 1 0 00.2-.2 1 1 0 011.5 0 1 1 0 00.2.2A4 4 0 0116 16v2z" />
    </svg>
    Rolling...
  </span>
) : (
  "🎲 Surprise me!"
)}

          </button>
        </div>

<div className="flex gap-2 mt-4">
  {starOptions.map((s) => (
    <button
      key={s}
      onClick={() => {
        setStars(s); // ✅ Always update stars
        if (searchQuery.trim()) {
          triggerSearch(searchQuery); // ✅ Only trigger search if query exists
        }
      }}
      className={`px-3 py-1 rounded-full border text-sm transition ${
        stars === s
          ? "bg-yellow-500 text-black font-semibold"
          : "bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white"
      }`}
    >
      {s === 0 ? "⭐ Any" : `⭐ ${s}+`}
    </button>
  ))}
</div>

      </div>

      {spinCount !== null && (
        <div className="text-center text-sm mb-4 text-zinc-400">
          🎯 {spinCount.toLocaleString()} spins and counting!
        </div>
      )}

<div className="relative min-h-[200px] max-w-6xl mx-auto transition-all duration-200">
{infoMessage ? (
  <div className="flex justify-center items-center">
    <div className="animate-fade-in bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 text-sm px-4 py-2 rounded-md shadow-md transition-all duration-300">
      {infoMessage}
    </div>
  </div>
) : (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${
        loading || searchLoading ? "opacity-40 pointer-events-none blur-sm" : ""
      }`}
    >
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
          <div className="text-yellow-600 dark:text-yellow-400 text-sm mt-2">
            ⭐ {repo.stargazers_count.toLocaleString()}
            {repo.updated_at && uiuxoptions.showFreshness && (
              <span className="ml-2 text-xs text-zinc-500">
                • {timeAgo(repo.updated_at)}
              </span>
            )}
          </div>
          <div className="mt-3 flex gap-2 z-20 relative">
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
              onClick={() =>
                handlePrompt({
                  id: repo.id,
                  url: repo.html_url,
                  setDisabledRepoId,
                  setModalPrompt,
                  setShowModal,
                })
              }
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
                  <img src="/images/git2prompt.png" alt="Git2Prompt" className="w-4 h-4 mr-1 rounded-lg" />
                  Git2Prompt
                </>
              )}
            </button>
          </div>

          {hoveredRepoId === repo.id && repo.description && (
            <div className="absolute inset-0 bg-zinc-900/90 text-white p-4 rounded-xl z-10 overflow-y-auto overflow-x-hidden backdrop-blur-md">
              <p className="text-sm whitespace-pre-line">{repo.description}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )}
</div>


      {rateLimit && uiuxoptions.showRateLimit && (
        <p className="text-center text-xs text-zinc-400 mt-4">
          ⏱ GitHub API: {rateLimit.remaining} left – resets at{" "}
          {new Date(rateLimit.reset * 1000).toLocaleTimeString()}
        </p>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white dark:bg-zinc-900 text-black dark:text-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6 relative transition-all duration-300 ease-out scale-95 opacity-0 animate-fadeIn">
            <h3 className="text-2xl font-bold mb-4">📋 Generated Prompt</h3>
            <textarea
              readOnly
              className="w-full h-64 p-4 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 focus:outline-none resize-none"
              value={modalPrompt}
            />
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(modalPrompt);
                  toast.success("✅ Prompt copied!");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-medium shadow"
              >
                📎 Copy Prompt
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="text-sm text-zinc-500 hover:underline"
              >
                Close
              </button>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xl text-zinc-600 dark:text-white hover:scale-105 transition"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* <ToastContainer position="top-center" autoClose={1500} hideProgressBar theme={theme} /> */}

      <footer className="fixed bottom-0 left-0 w-full z-50 text-center text-sm text-zinc-600 dark:text-zinc-400 backdrop-blur-sm bg-white/80 dark:bg-zinc-900/80 py-4">
        Made with ❤️ by Joginder Tanikella. © 2025{" "}
        <a href="https://x.com/jogitanikella" target="_blank" className="ml-3 inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 hover:scale-105 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M20.9 3.6L13.6 12l7.3 8.4h-3.3L12 13.8 6 20.4H3.1l7.6-8.7L3.1 3.6H6l6.2 6.9 5.7-6.9h3z" /></svg>
        </a>
        <a href="https://www.linkedin.com/in/jogindertanikella/" target="_blank" className="ml-3 inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 hover:scale-105 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M20.45 20.45h-3.55v-5.6c0-1.33-.02-3.04-1.86-3.04-1.86 0-2.15 1.45-2.15 2.94v5.7h-3.55V9h3.4v1.56h.05c.47-.89 1.6-1.83 3.29-1.83 3.52 0 4.17 2.32 4.17 5.34v6.38zM5.34 7.43c-1.14 0-2.07-.93-2.07-2.08 0-1.15.93-2.07 2.07-2.07s2.07.92 2.07 2.07c0 1.15-.93 2.08-2.07 2.08zm1.78 13.02H3.56V9h3.56v11.45z" /></svg>
        </a>
      </footer>
    </div>
  );
}
