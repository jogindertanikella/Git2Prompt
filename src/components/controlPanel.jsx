export default function ControlsPanel({
  categories,
  categoryIndex,
  stars,
  setStars,
  spin,
  triggerSearch,
  loading,
  searchLoading,
  setSearchQuery,
  setRepos,
  setRateLimit,
  setLoading,
  setInfoMessage
}) {
  const starOptions = [0, 100, 500, 1000, 5000];

  return (
    <div className="mt-4 flex flex-col items-center">
      <div className="flex justify-center gap-4">
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


          console.log("Spin result:", result); // <-- Here is the log

              if (!result.repos || result.repos.length === 0) {
                setInfoMessage("❌ No results found.");
                setSearchQuery("");
                setRepos([]);
                setTimeout(() => setInfoMessage(""), 3000);
              }
            } catch (error) {
                console.error("Spin error:", error); // <-- Also logs any error details
              setInfoMessage("⚠️ Something went wrong during spin.");
              setSearchQuery("");
              setRepos([]);
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
              setStars(s);
              if (searchQuery.trim()) {
                triggerSearch(searchQuery);
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
  );
}
