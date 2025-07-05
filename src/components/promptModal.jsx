export default function promptModal({
  modalPrompt,
  setShowModal,
  theme
}) {
  return (
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
              // You can integrate your toast logic here if you re-enable react-toastify
              alert("✅ Prompt copied!");
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
  );
}
