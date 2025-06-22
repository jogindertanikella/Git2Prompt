import { API_URLS } from "../constants/apicalls";
import { fallbackPrompts } from "../constants/fallbackPrompts";

export async function handlePrompt({ id, url, setDisabledRepoId, setModalPrompt, setShowModal }) {
  setDisabledRepoId(id);
  const key = url.replace("https://github.com/", "");

  // Step 1: Check fallback prompts
  if (fallbackPrompts[key]) {
    setModalPrompt(fallbackPrompts[key]);
    setShowModal(true);
    setDisabledRepoId(null);
    return;
  }

  try {
    // Step 2: Check if prompt already exists on server
    const checkRes = await fetch(`${API_URLS.PROMPT}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (checkRes.ok) {
      const checkData = await checkRes.json();
      if (checkData.prompt) {
        setModalPrompt(checkData.prompt);
        setShowModal(true);
        setDisabledRepoId(null);
        return;
      }
    }

    // Step 3: Prompt not found, generate new one
    const genRes = await fetch(API_URLS.PROMPT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await genRes.json();
    const finalPrompt = data.prompt || "⚠️ Failed to fetch prompt.";
    setModalPrompt(finalPrompt);
    setShowModal(true);

    // Step 4: Save new prompt to server
    if (data.prompt) {
      await fetch(`${API_URLS.PROMPT}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, prompt: data.prompt }),
      });
    }
  } catch (error) {
    console.error("Prompt error:", error);
    setModalPrompt("⚠️ Error generating prompt.");
    setShowModal(true);
  }

  setDisabledRepoId(null);
}
