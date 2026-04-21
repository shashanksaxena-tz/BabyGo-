# TinySteps AI (BabyGo)

> A smart parenting assistant to track child development milestones and provide AI-powered insights.

## What is this?
TinySteps AI (the MVP foundation for GrowthTrack AI) allows parents to track their child's growth using guided workflows rather than a disconnected dashboard. It leverages Google's Gemini AI to analyze data and provide personalized recommendations and status updates for parents.

### UX Philosophy
We believe in a "Guided Path" approach. Parents are busy; the application should present the next logical action (e.g., a monthly check-in) rather than a complex grid of standalone tools.

The system consists of:
- A **Web Dashboard** for easy access.
- A **Mobile App** (Flutter) for on-the-go tracking.
- A **Backend API** that manages data and connects to AI services.

## 🚀 Getting Started

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Recommended)
- [Node.js](https://nodejs.org/) (v18+) - for local dev without Docker
- [Android Studio](https://developer.android.com/studio) - for Mobile App development

### Quick Start (Docker)
The easiest way to run the full stack (Web + Backend + DB) is via Docker Compose.

1. **Clone and Setup Env**:
   Ensure you have a `.env` file or environment variables set (especially `GEMINI_API_KEY`).

2. **Configuration (.env)**:
   The project requires environment variables to run.
   
   **Root / Backend**:
   Create a `.env` file in the root `BabyGo-/` directory (or inside `backend/` if running manually) with the following content:
   ```bash
   PORT=3001
   NODE_ENV=development
   MONGODB_URI=mongodb://mongo:27017/tinysteps
   JWT_SECRET=change_this_to_a_secure_random_string
   GEMINI_API_KEY=your_google_gemini_api_key_here
   WEB_APP_URL=http://localhost:3000
   ```
   > **Note**: You can get a Gemini API key from [Google AI Studio](https://aistudio.google.com/).

3. **Run the App**:
   ```bash
   docker-compose up -d --build
   ```

3. **Access Services**:
   - **Web App**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:3001](http://localhost:3001)
   - **MongoDB**: `localhost:27017`

### Running Locally (Manual)

#### Backend
```bash
cd backend
npm install
npm run dev
# Server starts at http://localhost:3001
```

#### Web App
```bash
cd tinysteps-ai
npm install
npm run dev
# App starts at http://localhost:5173 (usually, unless configured to 3000)
```

#### Mobile App
1. Open `tinysteps_flutter` in Android Studio or VS Code.
2. Start an Emulator or connect a device.
3. Run `flutter pub get`.
4. Run `flutter run`.

## 📂 Project Structure
- `backend/`: Node.js Express API service.
- `tinysteps-ai/`: React Web Application.
- `tinysteps_flutter/`: Flutter Mobile Application.
- `docker-compose.yml`: Orchestration for local development.

## 📚 Documentation
- See [CLAUDE.md](./CLAUDE.md) for AI Context.
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for System Design.


Future prompt :
From the Home Dashboard (Quick Actions grid):                                                                                                                            
  ┌──────────────────────┬───────────────────────────────────────────┬───────────────┐                                                                                       
  │        Screen        │               How to reach                │ Card position │                                                                                       
  ├──────────────────────┼───────────────────────────────────────────┼───────────────┤
  │ Health Hub           │ "Health Hub" card (Stethoscope icon, red) │ Row 3, left   │
  ├──────────────────────┼───────────────────────────────────────────┼───────────────┤
  │ Resources Library    │ "Resources" card (Library icon, teal)     │ Row 3, right  │
  ├──────────────────────┼───────────────────────────────────────────┼───────────────┤
  │ Pediatrician Report  │ "Reports" card (FileText icon, gray)      │ Row 4, left   │
  ├──────────────────────┼───────────────────────────────────────────┼───────────────┤
  │ Development Insights │ "Insights" card (BarChart3 icon, purple)  │ Row 4, right  │
  └──────────────────────┴───────────────────────────────────────────┴───────────────┘
  Also from the Development Overview section at the top of the home page:
  - "View Report" link (top right) → Pediatrician Report (only if an analysis exists)
  - Click the score circle → Development Insights (only if an analysis exists)

  From inside the new screens (deeper navigation):
  ┌──────────────────┬────────────────────────────────────────────────────────┐
  │      Screen      │                      How to reach                      │
  ├──────────────────┼────────────────────────────────────────────────────────┤
  │ Generated Report │ Click a report inside Pediatrician Report screen       │
  ├──────────────────┼────────────────────────────────────────────────────────┤
  │ Improve Domain   │ Click a domain card inside Development Insights screen │
  ├──────────────────┼────────────────────────────────────────────────────────┤
  │ WHO Evidence     │ Links from within some new screens                     │
  └──────────────────┴────────────────────────────────────────────────────────┘

 none of this is visible atlest in the react app.. think logically in workflow which screen makes sense where... think link an experineced PO    
  and UX designer for the app and advocate changes suggestions based on workflow, think as a parent as well... what would like the workflow too be...  