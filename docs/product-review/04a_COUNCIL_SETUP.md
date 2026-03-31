# TinySteps AI - Product Council: Formation & Charter

**Document Version:** 1.0
**Date:** March 30, 2026
**Session Type:** Strategic Product Review
**Classification:** Internal - Leadership Eyes Only

---

## 1. Council Purpose

This council was convened to conduct a thorough review of every feature in the TinySteps AI platform. The objective is to determine the strategic fate of each feature — whether to invest further, maintain, consolidate, rethink, or sunset — and to identify new opportunities for growth.

The council reviews each feature through the lens of:
- **Business viability** (revenue, market fit)
- **User value** (does it solve a real problem?)
- **Strategic fit** (does it align with the product vision?)
- **Economic efficiency** (cost to build/maintain vs. return)
- **Market differentiation** (does it set us apart?)
- **User experience** (is it well-designed and intuitive?)

---

## 2. Council Members

### Priya Sharma — CEO & Founder
- **Background:** Former product lead at a leading Indian edtech company. Mother of two. Started TinySteps AI after struggling to find evidence-based developmental guidance for her first child.
- **Perspective:** Vision-driven. Thinks in terms of mission, brand identity, and long-term product direction. Will protect features that define "who we are" even if they're not immediately profitable.
- **Decision Style:** Bold but disciplined. Will sunset features that dilute the brand.

### Arjun Mehta — Product Owner
- **Background:** 8 years in product management across health-tech and consumer apps. Deep expertise in user journey optimization and feature prioritization.
- **Perspective:** User-first. Every feature must earn its place through demonstrable user value. Obsessed with activation rates, retention loops, and feature adoption metrics.
- **Decision Style:** Data-informed. Will push back on "nice-to-have" features that inflate scope.

### Dr. Kavitha Rajan — Domain Expert & Medical Advisor
- **Background:** Pediatrician with 15 years of clinical experience. Consultant to UNICEF on child development programs in South Asia. Published researcher on early childhood developmental screening.
- **Perspective:** Clinical accuracy and evidence-based practice. Will champion features that align with WHO standards and flag anything that could mislead parents.
- **Decision Style:** Cautious, evidence-first. Will veto anything that risks clinical harm.

### Rohan Kapoor — Market Analyst
- **Background:** Former analyst at a top-tier consulting firm covering healthcare and consumer tech in India. Deep knowledge of the parenting app market, competitor landscape, and Indian parent demographics.
- **Perspective:** Market-driven. Understands what Indian parents will pay for, what competitors offer, and where white space exists.
- **Decision Style:** Numbers-focused. Will bring competitive benchmarks and TAM estimates to every discussion.

### Neha Desai — Strategist & Growth Lead
- **Background:** Growth strategist who scaled two D2C brands from seed to Series B. Expert in go-to-market, partnerships, and feature bundling for maximum LTV.
- **Perspective:** Growth loops and monetization. How does each feature contribute to acquisition, activation, retention, revenue, or referral?
- **Decision Style:** Framework-driven. Will map every feature to the AARRR funnel.

### Vikram Iyer — Economist & Business Model Advisor
- **Background:** Health economics consultant. Has built pricing models for health-tech SaaS platforms across Asia. Understands unit economics, willingness-to-pay, and cost optimization.
- **Perspective:** Unit economics and sustainability. Every feature has a cost — server, AI API calls, maintenance. Is the return worth it?
- **Decision Style:** ROI-focused. Will challenge features with high cost and low monetization potential.

### Ananya Krishnan — UI/UX Lead
- **Background:** 10 years in product design, previously at a major ride-hailing app. Specialist in designing for diverse literacy levels and multilingual audiences in India.
- **Perspective:** Usability, accessibility, and emotional design. A feature is only as good as its interface. Will advocate for simplification and consolidation where the UX is fragmented.
- **Decision Style:** User-empathy driven. Will push to reduce cognitive load and consolidate overlapping experiences.

---

## 3. Review Process

Each feature goes through the following structured discussion:

```
Step 1: Feature Presentation
   → Product Owner summarizes the feature, its current state, and adoption

Step 2: Domain Validation
   → Medical Advisor validates clinical relevance and accuracy

Step 3: Market Context
   → Market Analyst provides competitive landscape and demand data

Step 4: Strategic Assessment
   → Strategist maps to growth framework (acquisition/retention/revenue)

Step 5: Economic Review
   → Economist evaluates cost structure and ROI

Step 6: UX Assessment
   → UI/UX Lead evaluates design quality and user friction

Step 7: CEO Synthesis
   → CEO makes final call, incorporating all perspectives

Step 8: Council Vote
   → Unanimous or majority decision recorded
```

### Decision Categories

| Decision | Meaning |
|---|---|
| **KEEP & INVEST** | Core feature. Allocate engineering and design resources for enhancement. |
| **KEEP AS-IS** | Working well. Maintain but don't allocate new resources. |
| **CLUB** | Merge with another feature to reduce fragmentation and improve UX. |
| **RETHINK** | The concept has value but the current approach needs a strategic pivot. |
| **SUNSET** | Remove from the product. Not worth the maintenance cost. |

---

## 4. Market Context Briefing (by Rohan Kapoor)

> *Before we dive into individual features, let me set the stage with market context.*

### Indian Parenting App Market (2026)

| Metric | Value |
|---|---|
| India's annual births | ~24 million |
| Smartphone penetration (parents 25-40) | ~78% |
| Parenting app market size (India) | ~$180M (growing 22% YoY) |
| Key competitors | BabyChakra, Parentlane, Healofy, Tinystep (different company), FirstCry (content arm) |
| Willingness to pay (premium parenting tools) | 8-12% of users, $3-8/month |
| Most valued features (surveys) | Milestone tracking, growth charts, doctor access, feeding/sleep guidance |
| Underserved segment | Evidence-based AI developmental assessment (our white space) |
| Language preference | 65% of target users prefer non-English Indian language |

### Competitive Advantage Assessment

| Competitor | Strength | Our Edge Over Them |
|---|---|---|
| BabyChakra | Large community, content | AI analysis (they don't have it) |
| Parentlane | Doctor consultations | WHO-based scoring + reports |
| Healofy | Vernacular content, community | Multi-modal AI analysis |
| FirstCry | Brand, commerce | Development tracking depth |

### Key Insight
> *"No competitor in India offers AI-powered developmental analysis against WHO standards. This is our moat. Every feature decision should protect and deepen this moat."*

---

## 5. Strategic Framework (by Neha Desai)

> *I'll be mapping every feature to our growth funnel. Here's the framework:*

```
ACQUISITION ──> ACTIVATION ──> RETENTION ──> REVENUE ──> REFERRAL
(Get users)    (First value)  (Keep them)  (Monetize)  (Spread word)
```

### Feature-to-Funnel Mapping (Preview)

| Funnel Stage | Key Features |
|---|---|
| **Acquisition** | Multi-language, Community (SEO), Free tier features |
| **Activation** | Child profile setup, First analysis, First milestone marked |
| **Retention** | Timeline, Stories, Recipes, Milestone reminders |
| **Revenue** | Reports (premium), Unlimited analysis (premium), Product recs (affiliate) |
| **Referral** | Shareable reports, Community posts, Story sharing |

---

## 6. Economic Framework (by Vikram Iyer)

> *Every feature has a cost. Let me outline the cost structure we're working with:*

### Cost Categories per Feature

| Cost Type | Description | High-Cost Features |
|---|---|---|
| **AI API Costs** | Gemini API calls per user action | Analysis, Stories, Recipes, Tips, Activities, Resources |
| **Storage Costs** | MinIO storage for media | Stories (illustrations), Photos, Reports (PDFs) |
| **Compute Costs** | Server processing time | PDF generation, image processing |
| **Maintenance Cost** | Engineering hours to maintain | Multi-platform (3 codebases), Community (moderation) |
| **Data Costs** | WHO data licensing, doctor data | Growth charts, Health Hub |

### Unit Economics Estimate

| Metric | Estimate |
|---|---|
| Gemini API cost per analysis | ~$0.02-0.05 |
| Gemini API cost per story (with illustrations) | ~$0.08-0.15 |
| Storage cost per user/month | ~$0.01-0.03 |
| Server cost per 1000 users/month | ~$15-25 |
| Engineering cost per feature/month (maintenance) | ~$2,000-5,000 |

> *"Our biggest variable cost is Gemini API. Features that make heavy AI calls need to either be premium-gated or have clear retention value."*

---

## 7. Session Agenda

The council will review features in four clusters over the following documents:

| Document | Cluster | Features |
|---|---|---|
| **04b** | Core Tracking Features | F01 Authentication, F02 Child Profiles, F03 Milestones, F04 AI Analysis, F05 Growth Charts |
| **04c** | Content & Engagement | F06 Stories, F07 Activities, F08 Recipes, F09 Products, F10 Tips, F11 Timeline |
| **04d** | Support & Platform | F12 Reports, F13 Resources, F14 Health Hub, F15 Community, F16 Multi-Language, F17 Baby Sounds, F18 Sarvam, F19 Photo Upload, F20 Multi-Platform |
| **04e** | Final Verdicts | Consolidated decisions, new feature proposals, workflow bundles, brand strategy |

---

*Let the review begin.*

*— Council Secretary*
