# MoodTracker 🧠💜

**AI-powered anonymous mood tracker for students**

A free, privacy-first web app that helps students track their wellbeing using AI. Students can express their mood through text, voice, photos, or quick emoji selection. Schools get anonymous location-based insights to better support student mental health.

---

## ✨ Key Features

- **100% Anonymous** - No names or personal data collected
- **AI-Driven** - Natural language understanding, no forced categories
- **Multiple Input Methods** - Text, voice recording, photo capture, or quick emoji
- **Privacy-First** - Schools only see aggregate location data, never individual entries
- **Free for Students** - No cost, no sign-up required

---

## 🚀 Build & Run Locally (PWA)

### Prerequisites
- Node.js 18 or higher
- Modern web browser

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/moodspace.git
cd moodspace

# Install dependencies
npm install

# Install required packages
npm install lucide-react

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Configure Tailwind

Create or update `tailwind.config.js`:

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Update `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Add Storage Mock

Create `src/storage-mock.js`:

```javascript
const storage = new Map();

window.storage = {
  async get(key) {
    const value = storage.get(key);
    return value ? { key, value, shared: false } : null;
  },
  async set(key, value) {
    storage.set(key, value);
    return { key, value, shared: false };
  },
  async delete(key) {
    storage.delete(key);
    return { key, deleted: true, shared: false };
  },
  async list(prefix = '') {
    const keys = Array.from(storage.keys()).filter(k => k.startsWith(prefix));
    return { keys, prefix, shared: false };
  }
};
```

Import in `src/main.jsx`:

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './storage-mock.js'  // Add this line

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Build for Production (PWA)

### Build

```bash
npm run build
```

This creates optimized files in the `dist` folder.

### Test Production Build

```bash
# Install serve
npm install -g serve

# Serve production build
serve -s dist -p 3000
```

Open [http://localhost:3000](http://localhost:3000)

### Deploy on Network

Find your computer's IP address:

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig
```

Then access from any device on the same WiFi:
```
http://YOUR_IP:3000
```

### Install as PWA on Android

1. Open the URL in Chrome on your Android phone
2. Tap the menu (three dots)
3. Select "Add to Home screen"
4. The app now works like a native app!

---

## 🧪 Testing Features

### Test Text Analysis
1. Click "Write It Out"
2. Type something like "I'm feeling overwhelmed with exams"
3. Select a location
4. Submit - AI will analyze and detect mood

### Test Voice Recording
1. Click "Voice Note"
2. Allow microphone access when prompted
3. Click "Start Recording"
4. Speak for a few seconds
5. Click "Stop Recording"
6. Review and submit

### Test Photo Capture
1. Click "Share a Moment"
2. Allow camera access when prompted
3. Click "Open Camera"
4. Click "Capture Photo"
5. Review and submit

### Test Quick Check-in
1. Click "Quick Check-in"
2. Tap an emoji mood
3. Select location
4. Submit

---

## 🔧 Browser Permissions

The app needs browser permissions for:
- **Microphone** - for voice recording
- **Camera** - for photo capture

Grant these when prompted for full functionality.

---

## 🏗️ Tech Stack

- React 18+ with Hooks
- Tailwind CSS for styling
- Lucide React for icons
- Anthropic Claude API for AI mood analysis
- Web APIs: MediaRecorder, getUserMedia
- Browser Storage API for persistence

---

## 📁 Project Structure

```
moodspace/
├── src/
│   ├── App.jsx           # Main component with all features
│   ├── index.css         # Tailwind imports
│   ├── main.jsx          # Entry point
│   └── storage-mock.js   # Local storage simulation
├── public/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## 🔒 Privacy Design

**What's collected:**
- Mood state (happy, stressed, etc.)
- Location (Library, Cafeteria, etc.)
- Timestamp

**What's NOT collected:**
- Names or student IDs
- Audio recordings (analyzed then discarded)
- Photos (analyzed then discarded)
- Any personally identifiable information

Schools only see aggregate data like: "60% of students in the Library reported feeling stressed this week"

---

## 📄 License

MIT License - Free to use and modify

---

**Made with 💜 for student wellbeing**