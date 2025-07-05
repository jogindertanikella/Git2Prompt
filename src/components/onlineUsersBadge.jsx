import React, { useEffect, useState } from "react";

export default function OnlineUsersBadge({ mode = "full" }) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let intervalId;

    async function fetchStats() {
      try {
        const res = await fetch("https://visitorstats.joginder-tanikella.workers.dev/api/getOnlineVisitors");
        const json = await res.json();
        setCount(json.currentlyOnline || 0);
      } catch (e) {
        console.error("Error fetching visitor count:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
    intervalId = setInterval(fetchStats, 30000);
    return () => clearInterval(intervalId);
  }, []);

  if (mode === "minimal") {
    return (
      <span className="inline-flex items-center text-sm text-zinc-600 dark:text-zinc-400">
        {loading ? "Loading users..." : `👥 ${count} people using Git2Prompt now.`}
      </span>
    );
  }

  return (
    <div className="w-full text-center">
      {loading ? (
        <div className="text-xs opacity-70">Loading users...</div>
      ) : (
        <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
          👥 {count} people using Git2Prompt right now.
        </p>
      )}
    </div>
  );
}
