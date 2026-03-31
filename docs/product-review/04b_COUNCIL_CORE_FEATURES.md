# TinySteps AI - Council Discussion: Core Features (F01-F05)

**Session:** Council Review Day 1 — Morning Session
**Date:** March 30, 2026
**Facilitator:** Priya Sharma (CEO)

---

## Opening Remarks

**Priya (CEO):** *"Good morning everyone. Today we tackle the foundation — the five features that define what TinySteps AI fundamentally is. Authentication, child profiles, milestones, AI analysis, and growth charts. These are non-negotiable in concept, but how we invest in them matters. Let's be rigorous."*

**Arjun (Product Owner):** *"Quick context — based on our analytics, 94% of users who complete child profile setup and run their first analysis are retained at Day 7. The activation funnel is the story here."*

---

## F01: User Authentication

### Feature Summary (Arjun)

> *"Standard email/password auth with JWT tokens. We store user preferences — language, theme, notifications. We also let power users bring their own Gemini API key. It works. No crashes, no complaints. But it's bare bones."*

### Council Discussion

**Dr. Kavitha (Medical Advisor):** *"From a clinical perspective, the security of child health data is paramount. Parents are sharing sensitive developmental information, photos, and medical measurements. I need to ask — do we have email verification? Password reset? Two-factor auth?"*

**Arjun:** *"No to all three."*

**Dr. Kavitha:** *"That's a concern. If someone gains access to an account, they see detailed developmental assessments, growth data, photos of children. This is sensitive data. We need at minimum email verification and password reset."*

**Rohan (Market Analyst):** *"Competitively, every parenting app in India offers Google and phone number login. BabyChakra, Healofy, Parentlane — all of them. In India, phone number + OTP is actually preferred over email by 60% of our target demographic. Not having it is a friction point at the top of funnel."*

**Neha (Strategist):** *"This is an acquisition gate. Every step of friction at signup costs us 15-20% of potential users. Social login (Google) cuts signup time from 2 minutes to 10 seconds. Phone OTP is even faster. This isn't a feature — it's plumbing that directly impacts our CAC."*

**Vikram (Economist):** *"The cost of implementing social login and phone OTP is low — maybe 2-3 engineering days. The cost of NOT having it is ongoing user drop-off at signup. Easy ROI."*

**Ananya (UI/UX):** *"I want to add — the 'bring your own API key' feature is interesting for power users but creates confusion for 95% of users. It should be buried deep in settings, not part of the visible auth flow. Also, the preference management (language, theme) should be part of onboarding, not something users discover later."*

**Priya (CEO):** *"Clear. Auth works but it's incomplete for our market. The feature itself stays as-is — it's table stakes. But we need to invest in Google login, phone OTP, email verification, and password reset. These aren't 'nice to haves' — they're blocking our growth in India."*

### Council Decision: F01 Authentication

| Aspect | Decision |
|---|---|
| **Verdict** | **KEEP AS-IS + Invest in Auth Upgrades** |
| **Priority** | P0 (foundation) |
| **Immediate Actions** | Add Google OAuth, Phone OTP, email verification, password reset |
| **Future** | Consider 2FA for users with sensitive medical data sharing |
| **Vote** | Unanimous |

---

## F02: Child Profile Management

### Feature Summary (Arjun)

> *"Users can create multiple child profiles with name, DOB, gender, measurements, WHO region, interests, favorites, and a profile photo. Auto-computes age in months. This is the data spine — everything else depends on it."*

### Council Discussion

**Dr. Kavitha:** *"The inclusion of WHO region is excellent — growth standards vary significantly between regions. I want to flag something missing: birth context. Was the child premature? What was birth weight? Gestational age? For premature babies, we need to use corrected age for milestone assessments, not chronological age. Without this, we could be flagging perfectly normal preemie development as 'delayed.'"*

**Arjun:** *"That's a significant gap. How many users would this affect?"*

**Dr. Kavitha:** *"In India, the preterm birth rate is approximately 13% — that's about 3.5 million babies per year. If we're telling parents of a 10-month-old preemie born at 32 weeks that their child is 'behind' on milestones, when actually they're right on track for their corrected age of 8 months, we're causing unnecessary anxiety. This could be harmful."*

**Rohan:** *"From a market perspective, parents of preemies are actually a HIGH-value segment. They're more anxious, more engaged with developmental tracking, and more willing to pay for premium features. Serving them correctly is both ethical and strategic."*

**Neha:** *"I also want to raise profile sharing. In Indian families, grandparents, other family members, and domestic help are often caregivers. The inability to share a child's profile with a co-parent or family member limits our viral coefficient. Every shared profile is a potential new user."*

**Vikram:** *"Sharing is low cost to implement but has high growth implications. The preterm correction is more complex but addresses a real clinical need. Both are worth the investment."*

**Ananya:** *"On the UX side, the profile creation asks for a lot of information upfront — name, DOB, gender, weight, height, head circumference, region, interests, favorites, photo. That's overwhelming for a first-time parent who just downloaded the app. I'd recommend progressive disclosure: start with just name, DOB, and gender. Collect measurements and interests during the first analysis or at natural touchpoints."*

**Arjun:** *"Ananya makes a great point. Our drop-off data shows 22% of users abandon during profile creation. Simplifying the initial form could directly improve activation."*

**Priya:** *"Three clear actions: (1) Add premature birth support with corrected age — Dr. Kavitha, this is a clinical imperative. (2) Enable profile sharing for co-parents and family. (3) Simplify the initial profile form — progressive disclosure. The feature is solid at its core but needs these enhancements."*

### Council Decision: F02 Child Profile Management

| Aspect | Decision |
|---|---|
| **Verdict** | **KEEP & INVEST** |
| **Priority** | P0 (foundation) |
| **Immediate Actions** | (1) Add preterm/corrected age support, (2) Simplify onboarding form (progressive disclosure) |
| **Near-Term** | Profile sharing with co-parents and family members |
| **Future** | Medical history fields (allergies, conditions), import from other apps |
| **Vote** | Unanimous |

---

## F03: Developmental Milestone Tracking

### Feature Summary (Arjun)

> *"We have approximately 300 WHO milestones across Motor, Language, Cognitive, and Social domains. Parents can view age-appropriate milestones, mark them as achieved with dates, add milestones to a watch list, and see progress percentages by domain. The milestone database is pre-seeded from WHO sources."*

### Council Discussion

**Dr. Kavitha:** *"The milestone database is clinically sound — it's based on WHO standards, which is the gold standard. However, I notice the schema includes a 'sensory' domain but it's underutilized. Sensory processing is increasingly important in developmental screening. I'd recommend either properly populating it or removing it to avoid confusion."*

*"Also, milestone tracking today is passive — the parent manually checks off milestones. The real power would be connecting this to the AI analysis. When a parent runs an analysis, the AI should automatically suggest which milestones appear to be achieved based on what it observes in the media."*

**Arjun:** *"That's a significant UX improvement. Right now, milestone tracking and AI analysis are somewhat disconnected experiences. Parents track milestones manually, and separately they run analyses. Connecting them would create a flywheel."*

**Rohan:** *"Milestone tracking is the #1 feature parents look for in parenting apps — it appears in every competitor. But most competitors offer basic checklists. Our WHO backing and domain-specific progress visualization is a differentiator. The AI-assisted milestone detection would be a moat nobody else has."*

**Neha:** *"From a growth perspective, milestones are the primary retention mechanism. The 'what's next' anticipation keeps parents coming back. I'd invest in milestone notifications — 'Your child is approaching the age for [milestone]. Want to check?' This is a proven re-engagement trigger."*

**Vikram:** *"Milestones are essentially free to operate — no AI costs, minimal server load. The ROI on investing in milestone notifications and AI-assisted detection is extremely high because the cost is almost entirely upfront engineering."*

**Ananya:** *"I'd love to see milestone achievements become celebratory moments. When a parent marks a milestone, give them a beautiful animation, let them add a photo, and prompt them to share. This is an emotional product — we should design for emotion, not just data entry. Also, I'd recommend clubbing the Activities feature (F07) directly into milestones. When a parent sees an upcoming milestone, show them activities that help their child get there. Don't make them navigate to a separate screen."*

**Priya:** *"Strong consensus here. Milestones are core to who we are. Three investments: (1) AI-assisted milestone detection from analyses, (2) Milestone notifications for re-engagement, (3) Emotional celebration UX with photo attachment. And I like Ananya's idea of integrating activities into the milestone view — we'll discuss that more when we get to F07."*

### Council Decision: F03 Milestone Tracking

| Aspect | Decision |
|---|---|
| **Verdict** | **KEEP & INVEST** |
| **Priority** | P0 (core) |
| **Immediate Actions** | (1) AI-assisted milestone detection from analysis, (2) Add celebratory UX + photo attachment |
| **Near-Term** | Milestone notifications/reminders, integrate activities into milestone view |
| **Future** | Sensory domain expansion, peer comparison (anonymized), shareable milestone cards |
| **Vote** | Unanimous |

---

## F04: AI-Powered Development Analysis

### Feature Summary (Arjun)

> *"This is our flagship. Parents upload photos and videos of their child, optionally record audio, and our AI (Google Gemini) analyzes developmental progress across all four domains. It returns an overall score (0-100), individual domain scores, status assignment (Ahead through Needs Support), personalized tips, activity profiles, warnings, and WHO source citations. Full analysis history is maintained. This is what no competitor offers."*

### Council Discussion

**Dr. Kavitha:** *"Let me be direct — this feature is both the most powerful and the most dangerous thing in our product. Powerful because developmental screening typically requires a trained professional, and we're democratizing access. Dangerous because AI can be wrong, and parents will treat these scores as medical diagnoses."*

*"Specific concerns: (1) We need prominent disclaimers that this is a screening tool, NOT a diagnosis. (2) The 5-tier status system (Ahead to Needs Support) is clinically sound, but the 0-100 score is problematic. Parents will obsess over the number. A score of 72 vs 68 is meaningless variance, but parents will panic over a 4-point drop. I'd recommend moving to broader bands or removing the numeric score entirely in the parent-facing UI."*

**Arjun:** *"That's a strong opinion. The score is one of our most engaging UI elements — parents understand numbers intuitively."*

**Dr. Kavitha:** *"They understand numbers, but they misinterpret them. In clinical practice, we use developmental screening categories, not scores. The ASQ-3 (Ages & Stages Questionnaire) uses 'above cutoff,' 'monitoring zone,' and 'below cutoff.' Our 5-tier status system is essentially doing this. The numeric score adds false precision."*

**Rohan:** *"Market data: parents in our surveys rated 'getting a clear score' as the #2 reason they'd use TinySteps (after 'milestone tracking'). Removing the score would hurt perceived value. However, Dr. Kavitha's point about anxiety is valid — our support inbox has multiple messages from parents worried about score fluctuations."*

**Neha:** *"Can we compromise? Keep the score but frame it differently. Instead of '72/100,' show 'On Track' prominently with the score as secondary context. Think of it like a credit score — the category matters more than the number, but people still want to see the number."*

**Dr. Kavitha:** *"I can accept that framing. Status first, score second. And add educational context: 'Scores can vary 5-10 points between assessments. What matters is the overall trend and status category.'"*

**Vikram:** *"On economics — this is our most expensive feature per use. Each analysis costs $0.02-0.05 in Gemini API calls. If a free user runs 10 analyses/month, that's $0.50/month in API costs alone — potentially our entire margin. We need to gate this. I'd recommend: 2 free analyses/month, unlimited on premium."*

**Neha:** *"Agreed, but the first analysis MUST be free and frictionless. It's our activation moment. The 'aha moment' is seeing your child's developmental profile for the first time. Gate the 3rd analysis, not the 1st."*

**Ananya:** *"The analysis flow is currently: upload media → wait → see results. The wait time (up to 30 seconds) is a UX dead zone. I'd invest in a beautiful loading experience — show what the AI is doing ('Analyzing motor skills...', 'Comparing to WHO standards...', 'Generating personalized tips...'). Also, the results page is dense. I'd break it into tabs or a scrollable story format rather than one massive page."*

**Priya:** *"This feature IS TinySteps AI. It's our identity, our moat, and our primary conversion mechanism. The investments are clear: (1) Reframe scoring — status first, score secondary, add educational disclaimers. (2) Improve the analysis UX — loading experience and results presentation. (3) Implement usage gating for monetization. (4) Add trend tracking — show how scores change over time. And Dr. Kavitha, I want you to review every prompt we send to Gemini for clinical accuracy."*

**Dr. Kavitha:** *"Gladly. I'd also recommend adding a confidence indicator. If the AI only received one blurry photo, the confidence should be low and we should tell the parent to upload more media for a more accurate assessment."*

**Priya:** *"Excellent addition."*

### Council Decision: F04 AI Development Analysis

| Aspect | Decision |
|---|---|
| **Verdict** | **KEEP & INVEST (Maximum Priority)** |
| **Priority** | P0 (flagship, identity-defining) |
| **Immediate Actions** | (1) Reframe scoring: status-first, score-secondary, (2) Add clinical disclaimers, (3) Add confidence indicator based on input quality |
| **Near-Term** | (1) Usage gating (2 free/month, unlimited premium), (2) Trend tracking across analyses, (3) Loading UX improvement, (4) Results page redesign |
| **Future** | (1) Side-by-side analysis comparison, (2) Dr. Kavitha to audit all Gemini prompts, (3) Professional review option (paid) |
| **Vote** | Unanimous |

---

## F05: Growth Tracking & WHO Charts

### Feature Summary (Arjun)

> *"Parents log weight, height, and head circumference measurements over time. We calculate WHO percentiles by gender, age, and region. Interactive growth curves show the child's trajectory against WHO reference bands. Alerts flag when measurements fall outside normal ranges."*

### Council Discussion

**Dr. Kavitha:** *"This is textbook pediatric monitoring, and it's done well. The WHO growth curves are the standard we use in clinical practice. The regional support (6 WHO regions) is a nice touch — growth patterns do vary by region. Two gaps I want to flag: (1) No BMI calculation — BMI-for-age is part of WHO growth standards and important for children over 2 years. (2) No preterm correction on growth charts, which ties back to our F02 discussion."*

**Rohan:** *"Growth charts are the second most-used feature in parenting apps after milestones. Every competitor has them. Our differentiation is the WHO backing and regional standards. Parentlane has growth charts but they're basic — no regional adjustment, no percentile tracking. This is a quiet competitive advantage."*

**Neha:** *"Growth tracking is a retention goldmine. Parents measure their child at pediatric visits (every 1-3 months in the first year). Each measurement is a reason to open the app. We should prompt users: 'Time for a measurement? Most pediatricians recommend monthly check-ups in the first year.' This is a re-engagement trigger."*

**Vikram:** *"Growth tracking is extremely cheap to operate — no AI costs, minimal storage, simple calculations. The ROI is excellent. Every dollar invested in improving this feature pays for itself in retention."*

**Ananya:** *"The growth chart visualization is functional but not beautiful. I've seen competitors use animated, colorful charts that parents love sharing on social media. 'My baby is in the 75th percentile!' with a beautiful chart graphic is shareable content. I'd invest in making the charts visually stunning and easily shareable — it's a free acquisition channel."*

**Priya:** *"Solid feature, cost-effective, retention-driving. Investments: (1) BMI-for-age tracking for children over 2. (2) Preterm-corrected growth charts. (3) Visual upgrade of charts for shareability. (4) Measurement reminders tied to pediatric visit schedules."*

### Council Decision: F05 Growth Tracking & WHO Charts

| Aspect | Decision |
|---|---|
| **Verdict** | **KEEP & INVEST** |
| **Priority** | P0 (core) |
| **Immediate Actions** | (1) Add BMI-for-age (2+ years), (2) Preterm-corrected growth charts |
| **Near-Term** | (1) Visual chart upgrade for shareability, (2) Measurement reminders |
| **Future** | Integration with smart scales/devices, pediatric visit schedule alignment |
| **Vote** | Unanimous |

---

## Morning Session Summary

**Priya (CEO):** *"Strong morning. All five core features are confirmed P0. The theme I'm hearing is: our foundation is solid but we need to (1) reduce onboarding friction, (2) add clinical safeguards to the AI analysis, (3) build re-engagement triggers into milestones and growth tracking, and (4) address preterm babies across the board. Let's break for lunch and reconvene for content and engagement features."*

### Decisions at a Glance

| Feature | Verdict | Priority | Key Investment |
|---|---|---|---|
| F01 Authentication | KEEP AS-IS + Auth Upgrades | P0 | Google OAuth, Phone OTP, password reset |
| F02 Child Profiles | KEEP & INVEST | P0 | Preterm support, progressive onboarding, sharing |
| F03 Milestones | KEEP & INVEST | P0 | AI-assisted detection, notifications, celebration UX |
| F04 AI Analysis | KEEP & INVEST (Max) | P0 | Scoring reframe, disclaimers, gating, trends |
| F05 Growth Charts | KEEP & INVEST | P0 | BMI tracking, preterm correction, shareable charts |

---

*End of Core Features Session*
*Next: 04c — Content & Engagement Features (F06-F11)*
