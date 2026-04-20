# From MVP to Production: The GrowthTrack Roadmap

**Objective:** Transition the current "TinySteps AI" MVP into a highly scalable, production-ready application ("GrowthTrack") with a cohesive, guided user experience.

---

## 1. Functional Recommendations (UX & Workflow)

### The Problem: The "A La Carte" Dashboard
The current `HomeDashboard.tsx` exposes 13+ actionable elements simultaneously. The user is presented with isolated modules: "Health Hub", "Resources", "Reports", "Insights", "Add Milestone", etc. This forces the user to navigate and make cognitive decisions about what to do next.

### The Solution: The "Guided Path" (Timeline Workflow)
We must replace the grid dashboard with a **Dynamic Timeline/Feed**.

**Workflow Definition:**
1.  **Authentication/Entry:** User logs in.
2.  **State Evaluation (Background):** The system evaluates the child's age, last check-in date, and missing profile data.
3.  **The Primary Action (The "Next Best Action"):**
    *   *If a monthly check-in is due:* The entire top half of the screen is a single card: "Leo is 6 Months Old! Start his 6-Month Check-in."
    *   *If check-in is complete, but data is missing:* "Complete Leo's profile to get better AI insights."
    *   *If everything is up to date:* "Daily Activity: Try this sensory game with Leo today."
4.  **The "Check-In" Wizard:** Clicking the primary action opens a stepped wizard, NOT a standalone form.
    *   *Step 1:* Physical Stats (Height/Weight validation).
    *   *Step 2:* Age-specific milestones checklist.
    *   *Step 3:* Open-ended Q&A for the AI.
5.  **The Contextual Result:** Submitting the wizard does not return the user to the dashboard. It takes them to a **"Status Report"** screen specific to that check-in. This screen presents the newly calculated percentiles, AI insights, and curated resources *directly related* to what was just entered.

---

## 2. Technical Recommendations & Architecture Shift

### The Problem: Synchronous, Direct AI Calls
The code review reveals direct AI (Gemini) calls inside synchronous Express routes (e.g., `backend/src/routes/analysis.js`). If the AI takes 15 seconds, the HTTP request hangs, blocking the Node event loop and providing a terrible UX.

### The Solution: Asynchronous Event-Driven Architecture
1.  **Message Queue:** Implement Redis and BullMQ.
2.  **Workflow:**
    *   Frontend submits wizard data.
    *   Backend saves raw data to MongoDB, enqueues a `generate_analysis` job, and immediately returns a `202 Accepted` response.
    *   Frontend shows a "Generating your report..." state.
    *   A separate Node.js worker process picks up the job, gathers context, calls Gemini, and saves the result to the DB.
    *   Backend sends a WebSocket event (via Socket.io) to the frontend: "Report Ready".

---

## 3. Level of Effort (LOE) & Major Blockers

### Effort Estimation (Medium to High)
Converting an MVP is often harder than building from scratch because we are refactoring state while maintaining functionality.

*   **UX/UI Redesign (Frontend):** *High Effort (4-6 weeks)*. Requires completely tearing down `HomeDashboard.tsx` and rebuilding the state management to support the stepped "Wizard" flow across React and Flutter.
*   **Asynchronous Backend (Node.js):** *High Effort (3-5 weeks)*. Requires setting up Redis, creating worker processes, rewriting the API endpoints to be asynchronous, and implementing WebSockets for real-time client updates.
*   **Data Migration:** *Low Effort (1 week)*. The underlying MongoDB schema for users/children is mostly fine, but we need to add "status" fields for asynchronous jobs.

### Major Blockers & Risks
1.  **State Management Spagetti:** The current React app likely uses local component state for the isolated forms. The new "Wizard" requires complex global state (Redux or Context API) to hold data across steps before submitting.
2.  **Infrastructure Complexity:** We are introducing Redis and Worker processes. This breaks the simple "Node + Mongo" deployment. We need to update Docker Compose and our cloud deployment strategy (e.g., AWS ECS or Render background workers).
3.  **AI Prompt Consistency:** Moving to asynchronous processing is great, but if Gemini returns unpredictable text formats, the frontend will break when trying to render the "Status Report". We *must* enforce structured JSON output from Gemini.
