import React, { useState } from "react";

export default function DeleteAllQueries() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "⚠️ Are you sure you want to delete ALL queries? This action cannot be undone."
    );
    if (!confirmed) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
  const res = await fetch(`${API_URLS.QUERY}/api/delete-all-queries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: clean }),
  });
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Delete failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-4 border rounded shadow">
      <h1 className="text-xl font-bold mb-4">Delete All Query History</h1>

      <button
        onClick={handleDelete}
        disabled={loading}
        className="btn btn-error"
      >
        {loading ? "Deleting..." : "Delete All Queries"}
      </button>

      {result && (
        <div className="mt-4 text-success">
          ✅ Deleted {result.deletedCount} records.
        </div>
      )}

      {error && (
        <div className="mt-4 text-error">
          ⚠️ Error: {error}
        </div>
      )}
    </div>
  );
}
