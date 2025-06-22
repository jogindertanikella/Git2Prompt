import { API_URLS } from "../constants/apicalls";

export async function fetchSpinCount(setSpinCount) {
  try {
    const res = await fetch(API_URLS.SPIN_COUNT);
    const data = await res.json();
    setSpinCount(data.spins);
  } catch {
    setSpinCount(null);
  }
}
