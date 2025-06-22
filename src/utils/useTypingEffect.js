import { useEffect, useState } from "react";

export function useTypingEffect(fullText, enabled = true, speed = 50) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!enabled || !fullText || typeof fullText !== "string") {
      setDisplayed(fullText || "");
      return;
    }

    setDisplayed(""); // reset before typing starts

    let i = 0;
    const interval = setInterval(() => {
      setDisplayed((prev) => {
        const next = fullText.slice(0, i + 1);
        i++;
        if (i >= fullText.length) clearInterval(interval);
        return next;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [fullText, enabled]);

  return displayed;
}
