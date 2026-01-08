# StockPilot

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-3.4-38bdf8)
![Express](https://img.shields.io/badge/Express-Backend-green)

**A production-grade, full-stack inventory management system designed for scalability and reliability.**

StockPilot demonstrates a modern **Hybrid Architecture**:
1.  **Cloud Frontend**: A highly responsive Next.js application deployed on the edge.
2.  **Robust Backend**: A complete Express.js/MongoDB REST API for complex business logic.

---

## 🚀 Live Demonstration

### [View the Live Demo](https://stock-pilot-wheat.vercel.app)

![StockPilot Dashboard](/public/screenshots/dashboard.png)

> **Note on the Demo Environment**:
> The live URL runs in **"Preview Mode"**. To ensure high availability and zero-cost maintenance for this portfolio showcase, the frontend detects that the backend is offline and seamlessy switches to using **Mock Data** and local state.
>
> To experience the full **Production Mode** (with real database persistence, JWT authentication, and live stock updates), please run the application locally.

---

## 🛠️ Technical Architecture

This repository contains a complete distinct Separation of Concerns (SoC):

### 1. The Frontend (`/src`)
*   **Next.js 15 (App Router)**: Utilizing Server Components for performance and Client Components for interactivity.
*   **Smart Fallback Hooks**: Custom hooks like `useInventory.ts` implemented with the **Circuit Breaker** pattern—automatically gracefully degrading to offline mode if the API is unreachable.
*   **Strict Typing**: 100% Type-Safe communication between UI and Logic layers.

### 2. The Backend (`/server`)
*   **Express.js REST API**: Standardized endpoints for CRUD operations.
*   **MongoDB & Mongoose**: Complex schema modeling for Inventory Items, Stock Movements, and Alert configurations.
*   **Security**: Implements JWT-based Stateless Authentication and Bcrypt password hashing.

---

## ✨ Key Features

*   **Real-Time Analytics Dashboard**: Visualizes stock trends, low-stock alerts, and value aggregations using `Recharts`.
*   **Inventory Tracking**: Add, edit, and audit full stock history.
*   **Responsive Design**: Mobile-first UI built with `Tailwind CSS` and `shadcn/ui` for a native-app feel.
*   **Search & Filtering**: Instant client-side filtering for thousands of SKUs.
*   **Export Capabilities**: CSV data export for external reporting.

---

## 👨‍💻 Getting Started (Full Stack)

Follow these steps to run the complete system (Frontend + Backend + Database) on your machine.

### Prerequisites
*   Node.js 18+
*   MongoDB installed and running locally

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/unnita1235/StockPilot.git
    cd StockPilot
    ```

2.  **Install Dependencies** (Root, Frontend, and Backend)
    ```bash
    npm run install:all
    ```

3.  **Seed Database** (Populate with initial data)
    ```bash
    npm run seed
    ```

4.  **Start Development Environment**
    ```bash
    npm run dev
    ```

    *   **Frontend**: `http://localhost:9002`
    *   **Backend API**: `http://localhost:3001`

---

## 🧪 Quality Assurance

The project adheres to strict code quality standards:
*   **Linting**: ESLint + Prettier configuration.
*   **Testing**: Jest implementation for critical logic.
*   **Performance**: Optimized fonts (`next/font`) and dynamic imports.

---

*Developed by [Unni T A](https://github.com/unnita1235)*
