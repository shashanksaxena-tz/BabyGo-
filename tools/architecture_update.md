# Architecture Updates

## 1. Current State (React SPA)
- The application is a React Single Page Application (SPA).
- **Routing:** Handled manually via a state variable `step` (enum `AppStep`) in `App.tsx`.
- **State:** Managed locally in `App.tsx` and passed down via props.
- **Backend:** Node.js/Express API with MongoDB, communicating via `apiService.ts`.

## 2. Identified Issues
- **Scalability:** The `App.tsx` file is bloated and difficult to maintain. Adding new screens requires modifying the core switch statement.
- **Deep Linking:** Impossible with the current manual routing. Users cannot bookmark or share specific reports or insights.
- **Performance:** All components are imported statically in `App.tsx`, leading to a large initial bundle size.

## 3. Proposed Architecture Changes

### Phase 1: Routing & State (Immediate/Medium Term)
1.  **Introduce `react-router-dom`:**
    - Replace the `step` state with a standard `BrowserRouter`.
    - Define clear routes: `/`, `/onboarding`, `/dashboard`, `/analysis/new`, `/analysis/:id/results`, `/insights`, `/report`, etc.
2.  **Implement Context API:**
    - Create a `ChildContext` to manage `currentChild`, `allChildren`, and child-switching logic.
    - Create an `AuthContext` to manage authentication state.

### Phase 2: Workflow Refactoring (Medium Term)
1.  **Component Reusability:** Break down monolithic views (like `HomeDashboard.tsx`) into smaller, reusable widget components (e.g., `ProgressWidget`, `ActionCarousel`).
2.  **API Layer Enhancement:** Implement a caching mechanism (like `react-query` or SWR) in `apiService.ts` to reduce redundant calls to the backend, especially for static resources or frequently accessed data like milestones.

### Phase 3: Advanced Capabilities (Long Term)
1.  **PWA (Progressive Web App):** Add service workers to cache core assets and allow the app to function offline, syncing data when connectivity is restored.
2.  **Micro-frontend architecture (Optional):** If the application grows significantly, consider splitting domains (Health, Education, Community) into separate modules.

## 4. Updates to Documentation
- **ARCHITECTURE.md:** Needs to be updated to reflect the transition from manual state-based routing to proper URL-based routing (React Router) once implemented.
- **Technical_Execution_Implementation_Plan.md:** Should be appended with tasks to refactor `App.tsx` and introduce global state management.
