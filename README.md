# MSIT – Master of Science in Information Technology | IIIT Hyderabad

Official student-centric announcement and programme website for the revamped AI-Native MSIT programme at IIIT Hyderabad, starting January 2027.

---

## 🚀 Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite 6
- **Styling**: Vanilla CSS (curated IIIT-H blue design system)
- **Data Architecture**: Centralized JSON (`src/data/msitData.json`) for zero-code content updates
- **Deployment**: Vercel / Netlify ready

---

## 📁 Project Structure

```
├── index.html                   # HTML entry point with SEO metadata
├── vite.config.js               # Vite bundler configuration
├── package.json                 # Project dependencies & scripts
├── public/
│   └── assets/                  # High-performance static assets (campus photo, logo)
├── src/
│   ├── App.jsx                  # Main single-page application
│   ├── main.jsx                 # React root mount point
│   ├── components/              # 17 modular React components
│   ├── data/
│   │   └── msitData.json        # Centralized programme information
│   └── styles/
│       └── styles.css           # Global design system & responsive styling
```

---

## 💻 Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run local dev server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000/` in your browser.

3. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🔐 Environment Configuration

This project uses Supabase for email OTP authentication.

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. (Optional) Set the application portal URL when available:
   ```
   VITE_APPLICATION_PORTAL_URL=https://apply.msit.ac.in
   ```

**Note:** The website functions without Supabase credentials — authentication
features will show a "coming soon" message. The public "Know About MSIT"
experience works without any configuration.

---

## 🌐 Production Deployment (https://msit.ac.in)

This repository is maintained by **IIIT Hyderabad (iiit-msit)**:
- **Repository**: `https://github.com/iiit-msit/MSIT-Webpage`
- **Live Production URL**: [https://msit.ac.in](https://msit.ac.in)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

---

## 📄 License & Attribution

© IIIT Hyderabad. All rights reserved. MSIT is an initiative founded by Turing Award laureate Prof. Raj Reddy.
