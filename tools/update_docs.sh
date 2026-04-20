#!/bin/bash

# Update README.md
sed -i 's/## What is this?/## What is this?\nTinySteps AI (the MVP foundation for GrowthTrack AI) allows parents to track their child'"'"'s growth using guided workflows rather than a disconnected dashboard. It leverages Google'"'"'s Gemini AI to analyze data and provide personalized recommendations and status updates for parents.\n\n### UX Philosophy\nWe believe in a "Guided Path" approach. Parents are busy; the application should present the next logical action (e.g., a monthly check-in) rather than a complex grid of standalone tools./g' README.md

# Update ARCHITECTURE.md
cat << 'ARCHEOF' >> ARCHITECTURE.md

## 🚀 Proposed Architecture Enhancements (Next Phase)
To improve performance and UX, the following architectural updates are planned:

### 1. Caching Layer
- **Implementation**: Introduce Redis (or an in-memory cache for MVP) to store frequently accessed data and cache Gemini AI responses for identical queries.
- **Benefit**: Reduces API costs, lowers latency, and improves perceived performance for the user.

### 2. Asynchronous AI Processing
- **Implementation**: Move long-running AI tasks (e.g., generating comprehensive pediatrician reports) to a message queue (like BullMQ or RabbitMQ).
- **Benefit**: Unblocks the main API thread, prevents UI freezing, and allows the user to continue using the app while the report is generated in the background.

### 3. Workflow-Driven State Management
- **Implementation**: Refactor frontend state to support step-by-step "wizards" (Check-in flows) rather than isolated screen states.
- **Benefit**: Supports the new UX paradigm of guided journeys.
ARCHEOF

echo "Documentation updated."
