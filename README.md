# Git2Prompt

Convert any GitHub repository into a prompt-ready MVP idea.  
Explore open-source projects, remix them with AI, and build faster.

## 🌟 What is Git2Prompt?

**Git2Prompt** helps you turn GitHub repositories into AI-friendly prompts.  
Whether you're exploring ideas, generating MVPs, or searching for inspiration, Git2Prompt helps you:

- 🔍 Search trending or niche repos by topic
- ⚡ Instantly convert repos into prompts for tools like [Cursor](https://cursor.so), [ChatGPT](https://chat.openai.com), etc.
- 💡 Discover unexpected project ideas and remix them

## 🚀 Live Demo

👉 [git2prompt.com](https://git2prompt.com/)

## 🛠️ Tech Stack

- **Frontend**: React + Vite + TailwindCSS (hosted on Cloudflare Pages)
- **Backend**: Cloudflare Workers + GitHub API
- **Edge Store**: Cloudflare KV (for visit/prompt tracking)

## 📦 Local Development

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/git2prompt.git
cd git2prompt

# Install frontend dependencies
npm install

# Start the frontend
npm run dev

# (In another terminal) start the Worker locally
wrangler dev worker/index.js
