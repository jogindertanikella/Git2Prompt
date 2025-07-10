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
  setLoading,
  setLoadingMessage,
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
          onClick={() => {
            setLoading(true);
            setLoadingMessage("Generating prompt...");
            handlePrompt({
              id: repo.id,
              url: repo.html_url,
              setDisabledRepoId,
              setModalPrompt,
              setShowModal,
            }).finally(() => {
              setLoading(false);
              setLoadingMessage("");
            });
          }}
          className="px-3 py-1 rounded text-sm flex items-center gap-1 bg-yellow-500 text-black hover:bg-yellow-400"
        >
          <img
            src="/images/git2prompt.png"
            alt="Git2Prompt"
            className="w-4 h-4 mr-1 rounded-lg"
          />
          Git2Prompt
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
