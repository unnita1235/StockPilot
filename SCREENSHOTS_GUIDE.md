# 📸 StockPilot Screenshots Guide

This guide helps you capture professional screenshots for your README and portfolio.

## When to Take Screenshots

**After deployment** - Take screenshots from your live Vercel deployment for best quality and to show real production features.

## Required Screenshots (Priority Order)

### 1. Dashboard View (CRITICAL)
**Filename**: `screenshots/dashboard.png`

**What to Capture**:
- Full dashboard with all metrics
- Category breakdown chart
- Weekly activity stats
- Recent stock movements
- Low stock alerts

**Tips**:
- Seed database first (`npm run seed`)
- Use 1920x1080 resolution
- Zoom browser to 100%
- Hide browser toolbars (F11 fullscreen)
- Make sure data looks realistic

**Screenshot Checklist**:
- [ ] Total items count visible
- [ ] Low stock percentage showing
- [ ] Category chart displaying data
- [ ] Recent movements list populated
- [ ] Clean, professional appearance

---

### 2. Inventory Management Table (CRITICAL)
**Filename**: `screenshots/inventory-table.png`

**What to Capture**:
- Full inventory table with items
- Search/filter functionality visible
- Category filters
- Action buttons (Add, Edit, Delete, Export CSV)
- Low stock indicators

**Tips**:
- Show at least 5-7 items
- Include items from different categories
- Show some low stock items (highlighted)
- Demonstrate the SKU, price, and stock columns

**Screenshot Checklist**:
- [ ] Multiple items visible
- [ ] Low stock highlighting works
- [ ] Category badges showing
- [ ] Action buttons visible
- [ ] Clean table layout

---

### 3. Stock Movement Dialog (HIGH PRIORITY)
**Filename**: `screenshots/stock-movement.png`

**What to Capture**:
- Stock In/Out dialog open
- Form fields populated
- Quantity input
- Reason field
- Reference number (optional)

**Tips**:
- Open "Add Stock" or "Remove Stock" dialog
- Fill in realistic data
- Show the form validation

**Screenshot Checklist**:
- [ ] Dialog clearly visible
- [ ] Form fields labeled
- [ ] Action buttons present
- [ ] Professional modal styling

---

### 4. Analytics/Forecast Display (HIGH PRIORITY)
**Filename**: `screenshots/forecast.png`

**What to Capture**:
- Forecast analysis dialog
- 14-day forecast chart
- Trend indicators
- Days to stockout
- Reorder point suggestion

**Tips**:
- Click "Analyze" on an item
- Choose item with good movement history
- Chart should show clear data

**Screenshot Checklist**:
- [ ] Forecast chart visible
- [ ] Metrics displayed (avg usage, trend)
- [ ] Professional chart styling
- [ ] Actionable insights shown

---

### 5. Stock Movement History (MEDIUM PRIORITY)
**Filename**: `screenshots/movement-history.png`

**What to Capture**:
- Item's movement history
- Timeline of stock changes
- Movement types (in/out/adjustment)
- Previous/new stock levels

**Tips**:
- Choose item with several movements
- Show different movement types
- Display timestamps

---

### 6. Add/Edit Item Form (MEDIUM PRIORITY)
**Filename**: `screenshots/add-item.png`

**What to Capture**:
- Add item dialog
- All form fields
- Category dropdown
- Validation working

---

### 7. Category Analysis (OPTIONAL)
**Filename**: `screenshots/category-analysis.png`

**What to Capture**:
- Category breakdown view
- Pie chart or bar chart
- Category statistics

---

### 8. Mobile Responsive View (OPTIONAL)
**Filename**: `screenshots/mobile-view.png`

**What to Capture**:
- Mobile layout (375px width)
- Responsive design
- Mobile navigation

**Tips**:
- Use browser DevTools (F12)
- Toggle device toolbar
- Choose iPhone or Android preset

---

## How to Take Screenshots

### Option 1: Browser Full Page Screenshot (Recommended)

**Chrome/Edge**:
1. Press F12 to open DevTools
2. Press Ctrl+Shift+P (Cmd+Shift+P on Mac)
3. Type "screenshot"
4. Choose "Capture full size screenshot"

**Firefox**:
1. Press F12
2. Click "..." menu → "Take a screenshot"
3. Choose "Save full page"

### Option 2: Third-Party Tools

- **Windows**: Snipping Tool, ShareX, Greenshot
- **Mac**: Cmd+Shift+4 (native), CleanShot X, Skitch
- **Linux**: Flameshot, Shutter, GNOME Screenshot

### Option 3: Browser Extensions

- GoFullPage (Chrome/Firefox)
- Fireshot (Chrome/Firefox)
- Awesome Screenshot (All browsers)

---

## Screenshot Optimization

After capturing, optimize images:

```bash
# Install imagemin CLI
npm install -g imagemin-cli imagemin-pngquant

# Optimize PNGs
imagemin screenshots/*.png --out-dir=screenshots/optimized --plugin=pngquant

# Or use online tools:
# - TinyPNG.com
# - Squoosh.app (Google)
# - ImageOptim (Mac)
```

---

## Adding Screenshots to README

Once you have screenshots, update README.md:

```markdown
## 📸 Screenshots

### Dashboard Overview
![Dashboard](screenshots/dashboard.png)
*Real-time inventory dashboard with analytics and low stock alerts*

### Inventory Management
![Inventory Table](screenshots/inventory-table.png)
*Comprehensive inventory table with search, filters, and bulk actions*

### Demand Forecasting
![Forecast Analysis](screenshots/forecast.png)
*14-day demand forecast with trend analysis and reorder suggestions*

### Stock Movement Tracking
![Movement History](screenshots/movement-history.png)
*Complete audit trail of all stock movements*
```

---

## Pro Tips for Great Screenshots

1. **Clean Data**: Use seeded data, not random gibberish
2. **Realistic Content**: Use real-sounding product names and categories
3. **Consistent Styling**: All screenshots should have same browser/theme
4. **No Personal Info**: Don't show real emails or sensitive data
5. **Proper Lighting**: Dark mode vs light mode - choose one and stick with it
6. **No Clutter**: Close unnecessary browser tabs and bookmarks
7. **High Resolution**: Minimum 1920x1080, but not too large for README
8. **Annotations**: Add arrows or highlights to key features (optional)

---

## Checklist for README

- [ ] Create `screenshots/` directory
- [ ] Capture all 4 critical screenshots
- [ ] Optimize images (< 500KB each)
- [ ] Add screenshots to README.md
- [ ] Add descriptive captions
- [ ] Commit and push to GitHub
- [ ] Verify images display correctly on GitHub

---

## Example Screenshot Section for README

```markdown
## 📸 Application Screenshots

<details>
<summary>Click to view screenshots</summary>

### Dashboard Analytics
![Dashboard](screenshots/dashboard.png)

### Inventory Management
![Inventory](screenshots/inventory-table.png)

### Demand Forecasting
![Forecast](screenshots/forecast.png)

### Stock Movement History
![History](screenshots/movement-history.png)

</details>
```

---

## Next Steps After Screenshots

1. Create demo video (see `DEMO_VIDEO_GUIDE.md`)
2. Write blog post about the project
3. Share on social media (Twitter, LinkedIn)
4. Add to portfolio website

---

Need help with any of these steps? Check the deployment guide first to get your app running!
