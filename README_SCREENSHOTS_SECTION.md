# Screenshots Section for README.md

Copy and paste this section into your README.md after you've taken screenshots.

---

## 📸 Screenshots

### Dashboard Overview
![Dashboard](./screenshots/dashboard.png)
*Real-time inventory dashboard showing total items, low stock alerts, category breakdown, and weekly activity trends*

### Inventory Management
![Inventory Table](./screenshots/inventory-table.png)
*Comprehensive inventory table with search, category filters, and bulk actions. Low stock items are highlighted for immediate attention.*

### Demand Forecasting
![Forecast Analysis](./screenshots/forecast.png)
*14-day demand forecast powered by weighted moving averages. Shows trend analysis, days to stockout, and intelligent reorder point suggestions.*

### Stock Movement Tracking
![Movement History](./screenshots/movement-history.png)
*Complete audit trail of all stock movements with timestamps, quantities, reasons, and user tracking for compliance.*

### Stock Operations
![Stock In/Out](./screenshots/stock-operations.png)
*Intuitive dialogs for adding stock (shipments received), removing stock (sales/usage), or making adjustments with full reason tracking.*

### Category Analytics
![Category Breakdown](./screenshots/category-analytics.png)
*Visual breakdown of inventory by category with real-time charts showing distribution and value analysis.*

<details>
<summary>📱 Mobile Responsive Views</summary>

### Mobile Dashboard
![Mobile Dashboard](./screenshots/mobile-dashboard.png)
*Fully responsive design optimized for tablets and smartphones*

### Mobile Inventory
![Mobile Inventory](./screenshots/mobile-inventory.png)
*Touch-friendly inventory management on mobile devices*

</details>

---

## Alternative Format (Horizontal Layout)

If you prefer a more compact layout:

---

## 📸 Screenshots

<table>
  <tr>
    <td width="50%">
      <h3 align="center">Dashboard</h3>
      <img src="./screenshots/dashboard.png" alt="Dashboard" />
      <p align="center"><i>Real-time analytics and alerts</i></p>
    </td>
    <td width="50%">
      <h3 align="center">Inventory Management</h3>
      <img src="./screenshots/inventory-table.png" alt="Inventory" />
      <p align="center"><i>Complete inventory control</i></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3 align="center">Demand Forecasting</h3>
      <img src="./screenshots/forecast.png" alt="Forecasting" />
      <p align="center"><i>Smart reorder predictions</i></p>
    </td>
    <td width="50%">
      <h3 align="center">Stock Movement History</h3>
      <img src="./screenshots/movement-history.png" alt="History" />
      <p align="center"><i>Full audit trail</i></p>
    </td>
  </tr>
</table>

---

## Alternative Format (Collapsible with Sections)

For a cleaner README that doesn't overwhelm:

---

## 📸 Screenshots

<details open>
<summary><b>🖼️ Click to view application screenshots</b></summary>

<br/>

### Dashboard & Analytics
The main dashboard provides at-a-glance insights into inventory health, low stock alerts, and recent activity.

![Dashboard](./screenshots/dashboard.png)

---

### Inventory Management
Browse, search, and manage your entire inventory with powerful filtering and bulk operations.

![Inventory Table](./screenshots/inventory-table.png)

---

### Demand Forecasting
AI-powered forecasting predicts future demand using weighted moving averages and trend analysis.

![Forecast](./screenshots/forecast.png)

---

### Stock Movement Tracking
Every stock change is recorded with complete audit trails for compliance and investigation.

![Movement History](./screenshots/movement-history.png)

---

</details>

---

## Format with Badges (Most Professional)

For a polished, portfolio-ready README:

---

## 📸 Application Preview

<div align="center">

### 🎯 Main Dashboard
*Real-time inventory analytics with low stock alerts*

![Dashboard](./screenshots/dashboard.png)

---

### 📦 Inventory Management
[![Items](https://img.shields.io/badge/View-Inventory_Table-blue?style=for-the-badge)](#)

![Inventory](./screenshots/inventory-table.png)

*Advanced search, filters, and category organization*

---

### 📈 Demand Forecasting
[![Forecasting](https://img.shields.io/badge/View-Forecast_Analysis-green?style=for-the-badge)](#)

![Forecast](./screenshots/forecast.png)

*14-day demand forecast with intelligent reorder suggestions*

---

### 📊 Stock Movement History
[![History](https://img.shields.io/badge/View-Audit_Trail-orange?style=for-the-badge)](#)

![History](./screenshots/movement-history.png)

*Complete audit trail with timestamps and user tracking*

</div>

---

## Quick Copy-Paste (Minimal)

The absolute minimum for a professional README:

---

## 📸 Screenshots

| Dashboard | Inventory | Forecasting | History |
|-----------|-----------|-------------|---------|
| ![Dashboard](./screenshots/dashboard.png) | ![Inventory](./screenshots/inventory-table.png) | ![Forecast](./screenshots/forecast.png) | ![History](./screenshots/movement-history.png) |
| Real-time analytics | Full inventory control | Demand predictions | Audit trail |

---

## Instructions:

1. **Create screenshots folder:**
   ```bash
   mkdir screenshots
   ```

2. **Take screenshots** using the SCREENSHOTS_GUIDE.md

3. **Save screenshots as:**
   - `screenshots/dashboard.png`
   - `screenshots/inventory-table.png`
   - `screenshots/forecast.png`
   - `screenshots/movement-history.png`
   - `screenshots/stock-operations.png` (optional)
   - `screenshots/category-analytics.png` (optional)
   - `screenshots/mobile-dashboard.png` (optional)
   - `screenshots/mobile-inventory.png` (optional)

4. **Choose your favorite format** from above

5. **Copy and paste** into README.md (recommended after "## What It Does" section)

6. **Optimize images** before committing:
   ```bash
   # Using ImageOptim (Mac)
   imageoptim screenshots/*.png

   # Or TinyPNG.com (web-based)
   # Or Squoosh.app (Google)
   ```

7. **Commit and push:**
   ```bash
   git add screenshots/
   git commit -m "docs: add application screenshots"
   git push
   ```

---

**Pro Tip:** Take screenshots from your **live deployment** (Vercel URL) rather than localhost - it looks more professional and shows the app actually works in production!
