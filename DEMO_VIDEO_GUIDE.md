# 🎥 StockPilot Demo Video Guide

A step-by-step script for creating a professional 2-3 minute demo video of StockPilot.

## 🎯 Goal

Create a concise, engaging demo video that shows key features and demonstrates real-world usage. Perfect for:
- README.md
- Portfolio website
- LinkedIn/Twitter shares
- Job applications

## 📋 Pre-Recording Checklist

- [ ] Deploy to Vercel (or run locally with clean data)
- [ ] Seed database with realistic data (`npm run seed`)
- [ ] Close unnecessary browser tabs
- [ ] Set browser zoom to 100%
- [ ] Clear browser history/autocomplete
- [ ] Test audio levels
- [ ] Choose recording tool (see options below)
- [ ] Prepare a glass of water (you'll be talking!)

## 🎬 Recording Tools

### Free Options:
- **Loom** (loom.com) - 5 min limit on free tier, great quality
- **OBS Studio** - Free, unlimited, requires setup
- **QuickTime** (Mac) - Built-in screen recording
- **Windows Game Bar** (Win+G) - Built-in on Windows 10/11

### Paid Options:
- **Camtasia** - Professional editing features
- **ScreenFlow** (Mac) - High quality, easy to use
- **Snagit** - Simple and effective

## 📝 Video Script (2:30 minutes)

### Introduction (0:00 - 0:15)
**[Show dashboard in browser]**

> "Hi! This is StockPilot, a full-stack inventory management system I built with Next.js, Express, and MongoDB. It helps businesses track inventory, forecast demand, and manage stock movements. Let me show you how it works."

**Key Points**:
- Keep it conversational
- Mention tech stack briefly
- Set expectations

---

### Feature 1: Dashboard Overview (0:15 - 0:45)
**[Scroll through dashboard]**

> "The dashboard gives you an at-a-glance view of your inventory health. You can see total items, low stock alerts, and category breakdowns. The weekly activity shows stock movements, and recent changes are displayed here."

**Actions to Perform**:
1. Point to total items count
2. Highlight low stock percentage
3. Hover over category chart
4. Scroll to recent movements

**Duration**: 30 seconds

---

### Feature 2: Inventory Management (0:45 - 1:20)
**[Navigate to inventory table]**

> "Here's the main inventory table. I can search for items, filter by category, and see stock levels at a glance. Items below their threshold are highlighted in red."

**Actions to Perform**:
1. Use search bar to find an item
2. Filter by category
3. Point out low stock highlighting
4. Click "Add Item" button

> "Adding a new item is straightforward - just enter the name, category, initial stock, and low stock threshold."

**Actions to Perform**:
5. Fill in the form (use realistic data)
6. Submit the form
7. Show the new item appearing in the table

**Duration**: 35 seconds

---

### Feature 3: Stock Movements (1:20 - 1:50)
**[Click on an item's actions menu]**

> "Stock movements are the heart of inventory management. I can add stock when shipments arrive, remove stock when items are sold, or adjust levels for corrections."

**Actions to Perform**:
1. Click "Add Stock" on an item
2. Enter quantity and reason
3. Submit
4. Show the updated stock level
5. Click "History" to show movement log

> "Every change is tracked with timestamps, quantities, and reasons - perfect for auditing."

**Duration**: 30 seconds

---

### Feature 4: Demand Forecasting (1:50 - 2:20)
**[Click "Analyze" on an item with movement history]**

> "The forecasting feature uses weighted moving averages to predict future demand. It shows trend analysis, days until stockout, and suggests optimal reorder points based on historical usage."

**Actions to Perform**:
1. Show the forecast chart
2. Point to average daily usage
3. Highlight trend indicator
4. Show suggested threshold vs current threshold
5. Scroll to 14-day forecast

> "This helps prevent both stockouts and overstocking."

**Duration**: 30 seconds

---

### Feature 5: Export & Real-time Updates (2:20 - 2:30)
**[Show export functionality]**

> "You can export inventory data to CSV for reporting, and the dashboard updates in real-time as changes are made."

**Actions to Perform**:
1. Click "Export CSV"
2. Show the downloaded file briefly

**Duration**: 10 seconds

---

### Conclusion (2:30 - 2:45)
**[Return to dashboard]**

> "That's StockPilot! It's built with production-ready features like JWT authentication, rate limiting, and security headers. The backend is deployed on Railway, frontend on Vercel, with MongoDB Atlas for the database. Check out the GitHub repo for full documentation and deployment guides. Thanks for watching!"

**Actions to Perform**:
1. Briefly show URL in browser
2. Fade out

**Duration**: 15 seconds

---

## 🎨 Video Editing Tips

### Essential Edits:
1. **Add Intro Title** (0:00-0:03)
   - "StockPilot - Inventory Management System"
   - Your name/GitHub handle

2. **Add Text Overlays** at key moments:
   - "Built with Next.js + Express + MongoDB"
   - "Real-time forecasting"
   - "Production-ready security"

3. **Add Subtle Background Music** (optional)
   - Keep it quiet (20-30% volume)
   - Use royalty-free music (YouTube Audio Library, Epidemic Sound)
   - Fade in/out

4. **Add Outro** (2:45-3:00)
   - GitHub link
   - Live demo link
   - Your contact/portfolio

### Optional Enhancements:
- Zoom in on important UI elements
- Add smooth transitions between sections
- Highlight cursor clicks
- Add "chapter markers" for YouTube

---

## 📱 Recording Settings

**Resolution**: 1920x1080 (1080p)
**Frame Rate**: 30 fps (60 fps if smooth scrolling)
**Audio**:
- Use external mic if possible
- Record in quiet room
- Do a test recording first

**Browser Setup**:
- Hide bookmarks bar
- Clear address bar history
- Use incognito/private mode (optional)
- Disable extensions that show in toolbar

---

## 🎤 Voiceover Tips

1. **Speak Clearly**: Enunciate, don't rush
2. **Be Enthusiastic**: Show genuine excitement
3. **Pause Between Sections**: Makes editing easier
4. **Avoid Filler Words**: "Um", "uh", "like"
5. **Practice First**: Do a dry run without recording

**Pro Tip**: Write your script, record audio separately, then match actions to audio in editing.

---

## 📤 Publishing Your Video

### YouTube
```
Title: StockPilot - Full-Stack Inventory Management System | Next.js + Express + MongoDB

Description:
StockPilot is a production-ready inventory management system built with Next.js, Express, and MongoDB.

Features:
✅ Real-time inventory tracking
✅ Demand forecasting with moving averages
✅ Stock movement history & analytics
✅ Low stock alerts
✅ CSV export
✅ JWT authentication
✅ Production security (helmet, rate limiting)

Tech Stack:
• Frontend: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
• Backend: Express, Node.js, Mongoose
• Database: MongoDB Atlas
• Deployment: Vercel (frontend), Railway (backend)

🔗 Links:
GitHub: https://github.com/yourusername/StockPilot
Live Demo: https://stockpilot.vercel.app
Documentation: Full deployment guide in README

Timestamps:
0:00 - Introduction
0:15 - Dashboard Overview
0:45 - Inventory Management
1:20 - Stock Movements
1:50 - Demand Forecasting
2:30 - Conclusion

Tags: inventory management, nextjs, typescript, mongodb, express, full stack development, web development, portfolio project
```

### Loom
- Keep it under 5 minutes (free tier limit)
- Enable password protection if needed
- Get shareable link
- Add to README

### LinkedIn
- Upload natively (better engagement than YouTube link)
- Keep under 10 minutes
- Add captions (LinkedIn auto-generates)
- Tag relevant skills in post

---

## 🔗 Adding Video to README

```markdown
## 🎥 Demo Video

[![StockPilot Demo](https://img.youtube.com/vi/YOUR_VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)

*Click to watch a 3-minute walkthrough of StockPilot's key features*

**Or watch on:**
- [Loom](https://loom.com/share/YOUR_LOOM_ID) (Detailed walkthrough)
- [LinkedIn](https://linkedin.com/posts/YOUR_POST) (Quick overview)
```

---

## ✅ Post-Recording Checklist

- [ ] Trim dead air at start/end
- [ ] Add intro title card
- [ ] Add text overlays for key features
- [ ] Check audio levels (not too quiet/loud)
- [ ] Add background music (optional)
- [ ] Add outro with links
- [ ] Export at 1080p, 30fps
- [ ] Upload to YouTube/Loom
- [ ] Add to README.md
- [ ] Share on social media

---

## 🎓 What Makes a Great Demo Video

**DO**:
- ✅ Show real features, not Lorem Ipsum
- ✅ Keep it under 3 minutes
- ✅ Show actual value/use cases
- ✅ Highlight unique features (forecasting!)
- ✅ Mention tech stack briefly
- ✅ Use realistic data

**DON'T**:
- ❌ Read the code line by line
- ❌ Show bugs or errors
- ❌ Ramble or go off-script
- ❌ Use awkward silence
- ❌ Forget to include links
- ❌ Use copyrighted music

---

## 📊 Success Metrics

A good demo video should:
- Be watchable without sound (captions help)
- Load fast (< 50MB file size)
- Show features in action, not just explain
- Leave viewers wanting to try it
- Clearly communicate value

---

Good luck with your demo! Remember: imperfect and published beats perfect and never done. You can always record a new version later.
