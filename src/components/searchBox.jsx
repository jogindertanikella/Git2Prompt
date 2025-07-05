export default function SearchBox({
  inputRef,
  searchQuery,
  setSearchQuery,
  triggerSearch,
  loading,
  searchLoading,
  rotatingQuery,
  typedQuery
}) {
  return (
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
    </div>
  );
}
