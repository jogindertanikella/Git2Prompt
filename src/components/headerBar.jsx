export default function HeaderBar({ theme, setTheme }) {
  return (
    <header className="max-w-6xl mx-auto mb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <img src="/images/git2prompt.png" className="w-12 h-12 rounded-lg" alt="Logo" />
          Git2Prompt
        </h1>
        <button
          onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          className="text-2xl ml-6"
        >
          {theme === "dark" ? "🌙" : "☀️"}
        </button>
      </div>
<p className="text-center text-sm text-blue-500 font-medium mt-2">
  Don’t Just Clone It. Own It.
</p>





    </header>
  );
}
