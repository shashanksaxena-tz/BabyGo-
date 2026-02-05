# BabyGo / TinySteps AI Documentation Index

## Overview
Welcome to the technical documentation for TinySteps AI. This directory contains detailed architectural and design documents used by developers and AI agents to understand the system.

---

## Documentation Structure

```
docs/
├── ARCHITECTURE.md       # High-level system design and stack
├── DATA_FLOW.md          # How data moves through the system
├── SEQUENCE_DIAGRAMS.md  # Interaction flows for key features
├── PII_DATA.md           # Privacy and Data Handling
├── DATA_SECURITY.md      # Security measures and architecture
├── FEATURES_LIST.md      # Inventory of features and status
├── MODULES_LIST.md       # Codebase organization
├── CONFIGURABLE_DESIGN.md # Configuration guide
└── README.md             # This file
```

---

## Quick Reference Guide

### For Developers
| Document | Purpose | When to Use |
|----------|---------|-------------|
| **ARCHITECTURE.md** | Big picture | Onboarding, Understanding the stack |
| **MODULES_LIST.md** | Code navigation | Finding specific files or logic |
| **CONFIGURABLE_DESIGN.md** | Setup | Configuring local env or deployment |
| **SEQUENCE_DIAGRAMS.md** | Logic flow | Debugging or implementing new features |

### For Security/Compliance
| Document | Purpose | When to Use |
|----------|---------|-------------|
| **PII_DATA.md** | Privacy audit | Understanding what data is stored |
| **DATA_SECURITY.md** | Security audit | Reviewing auth, encryption, and networks |

---

## Document Summaries

### ARCHITECTURE.md
Defines the client-server architecture, including React Web, Flutter Mobile, Node.js Backend, and MongoDB.

### DATA_FLOW.md
Visualizes how user inputs (like milestone logs) traverse the system, are validated, processed by AI, and stored.

### FEATURES_LIST.md
A checklist of what the app does, tracking the status of features like "Milestone Tracking" and "AI Insights".

### CONFIGURABLE_DESIGN.md
Explains the environment variables needed to run the app, including API keys and database drivers.
