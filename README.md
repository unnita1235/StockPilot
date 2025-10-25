# StockPilot

[![Live Demo](https://img.shields.io/badge/demo-online-brightgreen)](https://stock-pilot-wheat.vercel.app/)
[![Vercel](https://img.shields.io/badge/deploy-vercel-black?logo=vercel)](https://vercel.com/unni-t-as-projects/stockpilot)
![Status](https://img.shields.io/badge/status-active-blue)

> **StockPilot** — Lightweight inventory management for small teams. Track stock, set low-stock thresholds, categorize items, export CSV and add items quickly using a clean, modern UI.

---

## 🚀 Live Demo
**Production:** https://stock-pilot-wheat.vercel.app/

---

## 🖼️ Screenshots
**Inventory list (Products overview)**  
![Inventory overview](public/screenshots/stock-pilot.png) 

**Add Item modal (create new inventory item)**  
![Add Item modal](public/screenshots/stock-pilot1.png)

---

## ✨ Key Features

- Inventory list with category filters and search
- Add / Edit / Delete inventory items via modal forms
- Stock level display and low-stock threshold
- Export inventory as CSV
- Responsive and accessible UI (desktop & tablet ready)
- Deployed on Vercel with preview environments

---

## 🧰 Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **Optional Backend (examples):** Node/Express, Firebase, Supabase, or custom API

---

## ⚙️ Quick Start (Local)

> Requirements: Node.js v18+, npm or yarn

1. Clone repo:
```bash
git clone https://github.com/unnita1235/StockPilot.git
cd StockPilot
Install dependencies:

bash
Copy code
npm install
# or
yarn
Create .env.local from the example (if required):

bash
Copy code
cp .env.example .env.local
Run development server:

bash
Copy code
npm run dev
# or
yarn dev
Open http://localhost:3000

🌍 Example .env.example
If your project integrates with an API or database, use this template:

env
Copy code
# Example .env.example
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
DATABASE_URL=postgres://user:pass@host:5432/dbname
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here
Add actual keys in .env.local (do not commit secrets).

🧱 Build & Production
bash
Copy code
npm run build
npm run start
☁️ Deploy to Vercel (copy/paste)
Go to https://vercel.com/ → New Project → Import unnita1235/StockPilot.

Set Build Command: npm run build and Output Directory: (default for Next.js).

Add environment variables in the Vercel dashboard (if using APIs/db).

Click Deploy — Vercel will create preview deployments for PRs and auto-deploy main.

📁 Project Structure (example)
csharp
Copy code
StockPilot/
├── public/
│   └── screenshots/
│       ├── inventory.png
│       └── add-item-modal.png
├── src/
│   ├── app/            # Next.js App Router pages
│   ├── components/     # Reusable UI components
│   ├── lib/            # API clients, utils
│   └── styles/         # Tailwind/CSS
├── package.json
├── next.config.js
├── tailwind.config.js
└── README.md
🧩 NPM Scripts
json
Copy code
// package.json (scripts)
"dev": "next dev",
"build": "next build",
"start": "next start",
"lint": "next lint",
"format": "prettier --write ."
Run scripts with:

bash
Copy code
npm run dev
npm run build
npm run start
✅ How to add screenshots to GitHub (if you don’t have the repo locally)
In your GitHub repo, click Add file → Create new file.

In the filename field type: public/screenshots/placeholder.txt and commit (this creates the folder).

Open the folder public/screenshots/ then click Add file → Upload files.

Upload inventory.png and add-item-modal.png and commit.

Now your README image links will show on GitHub.

📣 Open Graph / Social Preview (optional)
Add a share image public/og-image.png (1200×630) then add meta tags in your Next head:

jsx
Copy code
/* app/head.tsx (or pages/_app.js/_document.js) */
export default function Head() {
  return (
    <>
      <meta property="og:title" content="StockPilot — Inventory made simple" />
      <meta property="og:description" content="Lightweight inventory management for small teams." />
      <meta property="og:image" content="/og-image.png" />
      <meta name="twitter:card" content="summary_large_image" />
    </>
  );
}
Upload og-image.png and set it as the repo Social Preview in GitHub Settings → Social preview.

🤝 Contributing
Fork the repo

Create feature branch:

bash
Copy code
git checkout -b feat/your-feature
Commit changes:

bash
Copy code
git commit -m "feat: add new feature"
git push origin feat/your-feature
Open a Pull Request

Please follow code style and include a short description of your change.

🪪 License
MIT License — see LICENSE file.

👤 Author
Unni T A

GitHub: https://github.com/unnita1235

Live demo: https://stock-pilot-wheat.vercel.app/
