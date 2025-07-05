import { useState } from "react";
import { timeAgo } from "../utils/timeAgo";
import { uiuxoptions } from "../constants/uiuxoptions";
import { handlePrompt } from "../utils/handlePrompt";

export default function RepoCard({
  repo,
  disabledRepoId,
  setDisabledRepoId,
  setModalPrompt,
  setShowModal,
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      key={repo.id}
      className="bg-zinc-100 dark:bg-zinc-800 p-5 rounded-xl shadow-md relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Loading...
            </>
          ) : (
            <>
              <img
                src="/images/git2prompt.png"
                alt="Git2Prompt"
                className="w-4 h-4 mr-1 rounded-lg"
              />
              Git2Prompt
            </>
          )}
        </button>
      </div>

      {hovered && repo.description && (
        <div className="absolute inset-0 bg-zinc-900/90 text-white p-4 rounded-xl z-10 overflow-y-auto overflow-x-hidden backdrop-blur-md">
          <p className="text-sm whitespace-pre-line">{repo.description}</p>
        </div>
      )}
    </div>
  );
}
