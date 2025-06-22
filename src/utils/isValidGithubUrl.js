export function isValidGithubUrl(input) {
  const regex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+(\/)?$/i;
  return regex.test(input.trim());
}
