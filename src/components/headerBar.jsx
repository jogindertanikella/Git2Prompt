export default function HeaderBar({ theme, setTheme }) {
  return (
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
  );
}
