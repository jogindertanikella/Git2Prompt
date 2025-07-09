import { useEffect, useRef, useState } from "react";
import { fallbackRepos } from "./constants/fallbackRepos";
import { baseCategories } from "./constants/baseCategories";
import { API_URLS } from "./constants/apicalls";
import { fetchSpinCount } from "./utils/fetchSpinCount";
import { handlePrompt } from "./utils/handlePrompt";
import { spin } from "./utils/spin";
import { uiuxoptions } from "./constants/uiuxoptions";
import { useRotatingQuery } from "./utils/useRotatingQuery";
import { useTypingEffect } from "./utils/useTypingEffect";
import { isValidGithubUrl } from "./utils/isValidGithubUrl";
import OnlineUsersBadge from "./components/onlineUsersBadge";
import RepoCard from "./components/repoCard";
import PromptModal from "./components/promptModal";
import StickyFooter from "./components/stickyFooter";
import SearchBox from "./components/searchBox";
import HeaderBar from "./components/headerBar";
import ControlPanel from "./components/controlPanel";
import GlobalLoadingOverlay from "./components/GlobalLoadingOverlay";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DeleteAllQueries from "./pages/DeleteAllQueries";

function MainApp() {
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
  const [infoMessage, setInfoMessage] = useState("");

  const inputRef = useRef(null);

  const categories = [
    { name: "Random", stack: baseCategories.flatMap((c) => c.stack) },
    ...baseCategories,
  ];

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

  useEffect(() => {
    const ping = () =>
      fetch("https://visitorstats.joginder-tanikella.workers.dev/api/ping").catch(() => {});
    ping();
    const intervalId = setInterval(ping, 2 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (loading || searchLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [loading, searchLoading]);

  const triggerSearch = async (input) => {
    const clean = input?.trim();
    if (!clean || clean.length < 3) return;

    setSearchQuery(clean);
    setSearchLoading(true);

    try {
      if (isValidGithubUrl(clean)) {
        await handlePrompt({
          id: Date.now(),
          url: clean,
          setDisabledRepoId,
          setModalPrompt,
          setShowModal,
        });
        return;
      }

      const res = await fetch(`${API_URLS.QUERY}/api/checkqueryhistory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: clean }),
      });
      const data = await res.json();

      console.log("Search result:", data);

      if (!data.items || data.items.length === 0) {
        setInfoMessage("❌ No results found.");
        setRepos([]);
        setTimeout(() => setInfoMessage(""), 3000);
      } else {
        let items = data.items;

        if (items.length < 9) {
          const existingIds = new Set(items.map((r) => r.id));
          const needed = 9 - items.length;
          const fallbacks = fallbackRepos
            .filter((r) => !existingIds.has(r.id))
            .slice(0, needed);
          items = [...items, ...fallbacks];
        }

        setRepos(items.slice(0, 9));
        setRateLimit(data.rate || {});
      }
    } catch (error) {
      console.error("Search error:", error);
      setInfoMessage("⚠️ Something went wrong. Please try again.");
      setRepos([]);
      setTimeout(() => setInfoMessage(""), 3000);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-black dark:bg-zinc-900 dark:text-white px-4 py-6">
      <HeaderBar theme={theme} setTheme={setTheme} />

      <SearchBox
        inputRef={inputRef}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        triggerSearch={triggerSearch}
        loading={loading}
        searchLoading={searchLoading}
        rotatingQuery={rotatingQuery}
        typedQuery={typedQuery}
      />

      <ControlPanel
        categories={categories}
        categoryIndex={categoryIndex}
        stars={stars}
        setStars={setStars}
        spin={spin}
        triggerSearch={triggerSearch}
        loading={loading}
        searchLoading={searchLoading}
        setSearchQuery={setSearchQuery}
        setRepos={setRepos}
        setRateLimit={setRateLimit}
        setLoading={setLoading}
        setInfoMessage={setInfoMessage}
      />

      <div className="h-4" />

      <div className="relative min-h-[200px] max-w-6xl mx-auto transition-all duration-200">
        {infoMessage ? (
          <div className="flex justify-center items-center">
            <div className="animate-fade-in bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 text-sm px-4 py-2 rounded-md shadow-md transition-all duration-300">
              {infoMessage}
            </div>
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`}
          >
            {repos.map((repo) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                disabledRepoId={disabledRepoId}
                setDisabledRepoId={setDisabledRepoId}
                setModalPrompt={setModalPrompt}
                setShowModal={setShowModal}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <PromptModal
          modalPrompt={modalPrompt}
          setShowModal={setShowModal}
          theme={theme}
        />
      )}

      <StickyFooter>
        <OnlineUsersBadge mode="minimal" />
      </StickyFooter>

      {(loading || searchLoading) && (
        <GlobalLoadingOverlay message="Fetching repositories..." />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/delete-all-queries" element={<DeleteAllQueries />} />
      </Routes>
    </BrowserRouter>
  );
}
