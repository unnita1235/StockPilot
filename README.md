# StockPilot 📦

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-3.4-38bdf8)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success)

> **A production-grade, full-stack inventory management system designed for scalability, reliability, and offline resilience.**

StockPilot demonstrates a modern **Hybrid Architecture** that bridges the gap between web applications and native reliability. It features a Next.js frontend that gracefully degrades to offline mode and a robust Express/MongoDB backend for complex data operations.

---

## 🚀 Live Demonstration

### [View the Live Deployment](https://stock-pilot-wheat.vercel.app)

![StockPilot Dashboard](/public/screenshots/offline-dashboard.png)

### ⚡ Engineered for Reliability

StockPilot is built to handle real-world network instability. One of its core architectural features is **"Smart Fallback"**:

*   **Offline Authentication**: Users can log in and access the dashboard even when the backend API is unreachable.
*   **Circuit Breaker**: The application detects connection failures and automatically switches to a low-latency "Offline Mode", preventing UI freezes and console error loops.
*   **Zero-Issue Runtime**: The codebase is optimized to run without hydration mismatches or unhandled network rejections, ensuring a clean developer console and stable user experience.

---

## 🛠️ Technical Capabilities

### 1. Robust Frontend (`/src`)
*   **Next.js 15 (App Router)**: Utilizing Server Components for performance and Client Components for interactivity.
*   **Type-Safe Hooks**: Custom hooks (`useInventory`, `useDashboard`) encapsulate data fetching logic and offline fallback state management.
*   **UI/UX Excellence**: Built with `shadcn/ui` and `Recharts` for a responsive, accessible, and data-rich interface.

### 2. Scalable Backend (`/server`)
*   **Express.js REST API**: A strictly typed API layer handling complex inventory logic.
*   **Data Integrity**: Mongoose schemas ensure data validation for SKUs, categorization, and stock alerts.
*   **Security**: JWT-based stateless authentication with Bcrypt password hashing.

---

## ✨ Core Features

| Feature | Description |
| :--- | :--- |
| **Real-Time Dashboard** | Visualizes stock movement, value distribution, and critical alerts. |
| **Inventory Control** | Full CRUD operations with instant search and category filtering. |
| **Low Stock Alerts** | Automated monitoring of stock levels against custom thresholds. |
| **Offline resilience** | Seamlessly functions in demo mode without backend connectivity. |
| **Data Export** | One-click CSV export for external auditing and reporting. |

---

## 👨‍💻 Getting Started (Local Development)

Follow these steps to run the complete Full-Stack system on your machine.

### Prerequisites
*   Node.js 18+
*   MongoDB installed and running locally

### Installation & Run

1.  **Clone the repository**
    ```bash
    git clone https://github.com/unnita1235/StockPilot.git
    cd StockPilot
    ```

2.  **Install All Dependencies**
    ```bash
    npm run install:all
    ```

3.  **Seed Database** (Populate with initial pro-grade data)
    ```bash
    npm run seed
    ```

4.  **Start the System**
    ```bash
    npm run dev
    ```

    *   **Frontend**: `http://localhost:9002`
    *   **Backend API**: `http://localhost:3001`

---

## 🧪 Code Quality Standards

The project follows strict engineering guidelines:
*   **Linting**: Zero ESLint warnings/errors (Verified in CI/CD).
*   **Typing**: Strict TypeScript configuration (no `any`).
*   **Performance**: Optimized fonts, images, and dynamic imports.

---

*Developed by [Unni T A](https://github.com/unnita1235) - 2026*
