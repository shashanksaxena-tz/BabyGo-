# Council Discussion: Product, UX, and Architecture Review

**Date:** April 20, 2026
**Topic:** Transitioning from "TinySteps AI" (MVP) to the "GrowthTrack" vision, analyzing features, workflows, and architecture.

## The Council
*   **Product Owner (PO):** 30 years experience specializing in medical and childcare products. Focuses on workflows, compliance, user value, and product vision. Has launched dozens of FDA-cleared products.
*   **UX Expert (UX):** 25 years experience. Focuses on user journey, cognitive load, intuitive design, and accessibility for parents. Understands the psychology of sleep-deprived parents.
*   **Technical Architect (TA):** 20 years experience. Focuses on scalable, optimized solutions, resource utilization, solid architecture, and technical feasibility.

---

## Session 1: The Reality Check & Overall Philosophy

**PO:** Alright team, let's look at what we have. We've got a grand vision documented in the BRD and TRD as "GrowthTrack AI" — a massive platform with EMR integrations, smart device syncing, and a dedicated healthcare provider portal. But what we *actually* have right now is "TinySteps AI", a basic MVP built with React, Node.js, and direct calls to the Gemini API. We need a reality check.

**TA:** Exactly. The TRD mentions microservices and React Native, but our current codebase is a monolithic Express app with a React web frontend and a separate Flutter mobile app. We are lightyears away from the microservices architecture described in the documents. We need to focus on what we can optimize *now*.

**UX:** And from a user perspective, it's a mess. The prompt correctly points out that it feels "a la carte". A parent logs in and sees a grid of options: Health Hub, Resources, Reports, Insights. They have to decide what to do. Parents of toddlers don't want to make decisions; they are tired. They want to be guided.

**PO:** Yes, the "a la carte" model is a failure for consumer health products. It assumes the user knows what they need. We need to shift to a "Guided Path" or a "Journey" model. Think of it like a pediatrician visit. You don't walk into a clinic and pick a room. The nurse guides you: weight, height, questions, doctor consultation. Our app needs to be that nurse.

**UX:** I strongly advocate for a dynamic feed or a "Timeline" as the home screen, not a static dashboard of buttons. When a parent logs in, the screen should say: "Welcome back. Leo is 6 months old today! It's time for his 6-month check-in." with a huge, undeniable primary button.

**TA:** From a technical perspective, that's doable, but it means we need to pre-calculate the "next best action" for the user. We can't query the entire database on every login. We'll need a robust caching strategy and potentially a background worker to calculate the state of each user's "Journey" so the home screen loads instantly.

---

## Session 2: Deep Dive - Feature FR-2.1 & FR-2.2 (Growth Tracking & WHO Charts)

**PO:** Let's look at the core feature: Growth Tracking (Weight, Height, Head Circumference). Right now, they are separate input forms.

**UX:** This is the lowest of the low-hanging fruit. We need a unified "Check-in" wizard.
*   **Step 1:** "Let's update Leo's measurements." (Show previous values as placeholders).
*   **Step 2:** "Any new milestones achieved?" (Show only the milestones relevant to his exact age).
*   **Step 3:** "Any concerns you'd like to ask the AI?"

**TA:** Wait, putting everything in a wizard means holding state across multiple screens before submitting to the database. We need to ensure the React/Flutter state management handles this smoothly without losing data if the user closes the app halfway. We should probably auto-save drafts to local storage.

**UX:** Absolutely. And regarding the WHO Growth Charts (FR-2.2), they are currently just static charts. We need to make them interactive and contextual. Instead of just showing a dot on a curve, we need a plain-English translation: "Leo is in the 75th percentile for weight. This means he weighs more than 75% of boys his age. He is following his curve perfectly."

**PO:** Good point. Medical data without interpretation causes anxiety. The AI should generate that plain-English summary immediately after the Check-in wizard is completed.

---

## Session 3: Deep Dive - Feature FR-7 (Comprehensive AI Assessment)

**PO:** Phase 2 of the BRD talks about a "Comprehensive 5-domain assessment". Currently, we just fire off a generic prompt to Gemini based on whatever the parent types. This is neither comprehensive nor scalable.

**TA:** It's also expensive and slow. Hitting the Gemini API synchronously for every interaction is bad architecture. If Gemini takes 10 seconds to respond, the user is staring at a loading spinner.

**UX:** A 10-second spinner means the user closes the app. We need asynchronous processing.

**TA:** Exactly. Here is my proposed architecture for this:
1.  User submits the "Check-in" data.
2.  The API immediately returns a "202 Accepted" status and a success message.
3.  The API drops a job onto a message queue (e.g., BullMQ backed by Redis).
4.  A background worker picks up the job, gathers the child's full history from MongoDB, constructs a highly specific prompt, and calls Gemini.
5.  When Gemini responds, the worker saves the insight to the database and sends a push notification/WebSocket event to the client: "Your detailed assessment is ready!"

**PO:** That's much better. It sets the right expectation. Like waiting for lab results.

**UX:** While they wait, we can show them curated content from the "Resource Library" (FR-14.1) based on their child's age. "While we generate your report, read about sleep regression at 6 months."

**PO:** Brilliant. But let's talk about the prompt itself. We can't just send raw data. We need to structure the prompt to evaluate the specific domains: motor, cognitive, language, sensory, social. The AI must return structured JSON, not a block of text, so we can render it beautifully in the UI.

**TA:** I will update the `ARCHITECTURE.md` to mandate structured JSON output from Gemini and outline the asynchronous queue system.

---

## Session 4: Deep Dive - Feature FR-8 (Healthcare Provider Portal)

**PO:** The BRD mentions a Healthcare Provider Portal. Is this realistic right now?

**TA:** No. Building a HIPAA-compliant portal with multi-tenant data access, audit logs, and EMR integration is a massive undertaking. Our current MVP stack is not ready for that level of compliance and security routing.

**PO:** I agree. We need to cut this from the immediate roadmap. Instead of a portal, let's focus on FR-8.6: "Clinical report generation."

**UX:** Yes! Parents want to take something to their doctor. Instead of a portal, let's provide a "Generate PDF for Pediatrician" button. It should strip out the "AI advice" and just present the raw, verified data (growth charts, achieved milestones) in a clean, professional format.

**TA:** Generating PDFs on the server can be CPU-intensive. We can use a library like Puppeteer or a dedicated service, but again, this needs to be asynchronous.

---

## Session 5: Stitch API & UI Implementations

**UX:** The user mentioned using the "Stitch API" for UI suggestions. Assuming Stitch is our internal UI component library/design system tool, we need to standardize the new components.

*   **Component 1: The Journey Card.** A large, prominent card on the home screen dictating the next action. Needs strong drop shadows, clear typography, and an primary action button.
*   **Component 2: The Assessment Wizard.** A stepped progress bar at the top, clear input fields, and "Next" / "Previous" navigation.
*   **Component 3: The Insight Pill.** Small, color-coded badges (Green for "On Track", Yellow for "Monitor") that attach to specific data points.

**TA:** If we are standardizing UI, we need to ensure the React (Web) and Flutter (Mobile) implementations share the exact same design tokens (colors, spacing, typography). We should extract these into a shared configuration file.

---

## Session 6: Actionable Plan & Low Hanging Fruits Summary

**PO:** Let's summarize the immediate action items. The "GrowthTrack" vision is great, but we are executing on "TinySteps 2.0".

**1. Immediate UX Overhaul (The Low Hanging Fruit):**
*   Kill the grid dashboard. Implement the "Timeline/Journey" view.
*   Combine separate data entries into the "Check-in Wizard".
*   Always provide context alongside raw data (e.g., explaining the WHO charts).

**2. Architecture Optimization (Required for Scale):**
*   **Caching:** Implement Redis immediately. Cache WHO chart calculations and common resource articles.
*   **Async Processing:** Move all Gemini API calls to a background queue. Never block the main thread waiting for an LLM.
*   **Structured AI:** Force Gemini to return JSON, not markdown, so the frontend can render specific components (Insights, Warnings, Recommendations).

**3. Feature Re-prioritization:**
*   Delay the Provider Portal (FR-8). Focus on generating exportable PDFs for parents instead.
*   Delay Smart Device Integration (FR-13). Manual entry via the new Wizard is sufficient for now.

**UX:** I will start wireframing the "Check-in Wizard" immediately. It needs to feel lightweight, not like filling out tax forms.

**TA:** I will start setting up BullMQ in the Node backend and adjusting the React/Flutter apps to handle asynchronous updates via WebSockets or polling.

**PO:** Excellent. This council agrees that the current "a la carte" design is a dead end. The future is guided, contextual, and asynchronous. I will update the project roadmap to reflect these decisions.

---

## Session 7: Content, Community, and Premium Features Discussion

**PO:** The BRD mentions a Resource Library (FR-14) and Community Features (FR-15). It also details Premium features like unlimited comprehensive assessments and multi-child support (FR-9). How do we integrate these without falling back into the "a la carte" trap?

**UX:** The Resource Library shouldn't be a separate tab that users have to proactively search. It needs to be contextual. If the "Check-in Wizard" determines the child is at the 18-month mark, the final "Status Report" screen should automatically surface articles about the 18-month sleep regression or potty training readiness. The content finds the user, not the other way around.

**TA:** This requires a solid tagging system for the articles in the backend. When the AI generates insights, it should also return relevant tags. We can then query our CMS for articles matching those tags.

**PO:** What about the Community features? Forums can get toxic very quickly, especially in the parenting space.

**UX:** We should restrict community access to verified users, perhaps only premium users initially, to maintain quality. The forums should be strictly age-gated. A parent of a 3-month-old doesn't need to see discussions about 4-year-old behavior issues.

**TA:** Technically, we need to implement aggressive content moderation. We can use a lightweight ML model (like a toxicity API) before any post goes live. But building a full forum system from scratch is a huge undertaking. For the MVP, can we integrate a third-party service like Discourse and use SSO?

**PO:** That's a smart compromise. Let's update the TRD to reflect using a managed forum solution for MVP rather than building it in-house.

---

## Session 8: EMR Integration and Security (FR-12 & Security NFRs)

**TA:** The Phase 3 features mention EMR Integration (HL7 FHIR API). Given our current monolithic Express backend, adding a FHIR server is a massive scope increase. We need to start structuring our data models now so they can be easily mapped to FHIR resources later.

**PO:** Security is paramount here. The NFRs demand HIPAA compliance (NFR-3.1). Are we encrypting data at rest (NFR-2.2)?

**TA:** Currently, MongoDB encrypts the entire volume at the filesystem level. For true HIPAA compliance, we should consider application-level encryption for specific fields like patient names or medical notes. Also, we are storing Gemini API keys in `.env` files. We need a proper secrets manager like AWS Secrets Manager or HashiCorp Vault before we scale.

**UX:** From a UX perspective on security, we need to make sure the user understands their data is safe without throwing massive legal disclaimers at them constantly. A simple "HIPAA Compliant" badge on the login and settings screens goes a long way.

**PO:** Let's ensure the onboarding flow includes a clear, plain-English consent screen regarding AI analysis of their child's data. Trust is our primary currency.

---

## Session 9: Stitch API Mockup Planning

**UX:** Returning to the user's request to use the Stitch API for mockups. While we don't have direct access to a "Stitch UI Generator" here, I am outlining the specific components we need to build for the next sprint. We need to create design tokens for:
-   **The Journey Feed:** A vertically scrolling feed replacing the home dashboard.
-   **Contextual Cards:** Cards that appear in the feed (e.g., "New Milestone Recommended: Walking").
-   **The Check-in Wizard Modals:** Clean, distraction-free overlays for data entry.

**TA:** Once the UI team provides those components (via Stitch or Figma), the engineering team will build them out in React and Flutter, ensuring they consume the new asynchronous API endpoints we discussed earlier.

**PO:** Perfect. This council has successfully realigned the project. We are moving from a disconnected set of tools ("TinySteps") to a cohesive, guided, intelligent platform ("GrowthTrack"). Let's get to work.
