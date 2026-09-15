# 📱 HealDroid Mobile — React Native (Expo) Client

HealDroid Mobile is a native iOS and Android security assessment application sharing the exact same design tokens, visual aesthetics, and OWASP analysis pipeline as the web application.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Start Expo Development Server
```bash
# Start interactive QR development server
npm start

# Or launch directly on Android Emulator / Device
npm run android

# Or launch directly on iOS Simulator
npm run ios
```

---

## 🎨 Design & Architecture
- **Identical Design Tokens**: Shared color palette (`#13B8A6` accent, `#F2F4F8` canvas, `#F04438` critical severity).
- **Universal Component Model**: Uses native `View`, `Text`, `TouchableOpacity`, `ScrollView`, and `Modal` primitives.
- **Backend Connectivity**: Communicates with the Next.js API endpoints (`/api/upload`, `/api/jobs/:id`, `/api/health`).
