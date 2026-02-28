# TinySteps AI — Complete Screen Specifications
*Version 1.0 | Date: 2026-02-28 | UX Designer output for engineering team*

**Design System**: Emerald/Teal gradient | Nunito font | Warm, reassuring tone
**Platforms**: Mobile (Flutter, 390x844) | Web (React, responsive 360-1280px)
**Core Loop**: Analyze -> Review -> Act -> Track -> Share -> Repeat

## Design System Reference

| Token | Value |
|-------|-------|
| Primary gradient | #10b981 (Emerald) -> #14b8a6 (Teal), 90deg |
| Font family | Nunito (all weights) |
| Card radius | 16px |
| Button radius | 12px |
| Pill/chip radius | 20px |
| Shadow | 0 2px 8px rgba(0,0,0,0.06) |
| Motor domain | #3b82f6 (Blue) |
| Cognitive domain | #8b5cf6 (Purple) |
| Language domain | #ec4899 (Pink) |
| Social domain | #f59e0b (Amber) |
| Success | #10b981 |
| Warning | #f59e0b |
| Error | #ef4444 |
| Text primary | #1f2937 |
| Text secondary | #6b7280 |
| Background | #f9fafb |
| Card background | #ffffff |

## Navigation Architecture

**Mobile bottom nav (5 tabs):**
| Tab | Icon | Label |
|-----|------|-------|
| 1 | house | Home |
| 2 | compass | Discover |
| 3 (center, elevated) | plus-circle | Analyze |
| 4 | clock | Timeline |
| 5 | user | Profile |

**Web top nav:**
`Logo | Dashboard | Analyze | Discover | Timeline | Profile avatar`

---

## ONBOARDING & AUTH

---

## 1. Splash / App Launch Screen
**Purpose**: Brand introduction and session bootstrapping while checking auth state.
**Route/Navigation**: First screen on cold launch. Auto-redirects after 2s.
**Platform**: Both

### Layout
1. Full-screen emerald-to-teal gradient background (top-to-bottom).
2. Centered vertically: TinySteps logo (stylized baby footprint icon) + app name "TinySteps" in Nunito Bold 28px white.
3. Below logo: tagline "Watch them grow, one tiny step at a time" in Nunito Regular 14px white/80% opacity.
4. Bottom: subtle loading indicator (3 bouncing dots, white).

### Components
- **Logo**: SVG baby footprint icon, 80x80px, white fill.
- **App name**: Text, Nunito Bold 28px, white, centered.
- **Tagline**: Text, Nunito Regular 14px, white at 80% opacity, centered, max-width 280px.
- **Loading indicator**: 3 dots bouncing animation, 6px each, white.

### Data
- On mount: check for stored JWT token via local storage / secure storage.
- `GET /api/auth/me` with stored token to validate session.

### User Actions
- None (auto-advances).
- If token valid -> navigate to Home Dashboard (screen 6).
- If token invalid/missing -> navigate to Onboarding Slides (screen 2).
- If first launch ever (no onboarding-complete flag) -> Onboarding Slides.
- If onboarding complete but no token -> Login (screen 3).

### States
- **Empty**: N/A (always shows brand).
- **Loading**: The default state. Shows bouncing dots for 1.5-2s minimum (branding moment).
- **Error**: If network check fails, still route to cached state or Login screen. No error UI shown.

### Mobile Notes
- Full-screen, no safe area insets on the gradient (edge-to-edge). Logo respects safe area.
- StatusBar: light content (white icons).

### Web Notes
- Same layout, centered in viewport. No top nav shown.
- Max-width 480px for content area, centered horizontally.

---

## 2. Onboarding Slides (3 slides)
**Purpose**: Communicate the value proposition to first-time users across 3 swipeable pages.
**Route/Navigation**: Shown on first launch only (flag `onboarding_complete` not set).
**Platform**: Both

### Layout
Each slide is full-screen with:
1. Top 60%: Large illustration area with gradient background and floating emoji decorations.
2. Center: Large emoji (48px) as hero icon.
3. Below illustration: Title in Nunito Bold 24px, dark text, left-aligned with 24px padding.
4. Description in Nunito Regular 16px, secondary text color, below title, max 2 lines.
5. Bottom bar: Page indicator dots (3) + navigation buttons.

### Slides Content

**Slide 1 — "Track Your Child's Growth"**
- Gradient: Emerald -> Teal
- Hero emoji: chart-bar-increasing
- Description: "Monitor development milestones based on WHO standards with AI-powered insights"
- Floating decorations: baby, chart, sparkles, star

**Slide 2 — "Capture Precious Moments"**
- Gradient: Blue -> Purple
- Hero emoji: camera
- Description: "Upload photos, videos, and baby voice recordings for detailed analysis"
- Floating decorations: video, mic, sparkle, rainbow

**Slide 3 — "Get Personalized Insights"**
- Gradient: Purple -> Pink
- Hero emoji: sparkles
- Description: "Receive AI recommendations, bedtime stories, and development activities"
- Floating decorations: book, paint, teddy, heart

### Components
- **Page indicator**: 3 dots, 8px diameter, active dot = white filled, inactive = white/40%.
- **Skip button**: Top-right, text "Skip", Nunito Medium 14px, white. Visible on slides 1-2.
- **Next button**: Bottom-right, circle 56px, white background, right-arrow icon emerald color.
- **Get Started button**: On final slide, replaces Next. Full-width button, white background, "Get Started" text in emerald, Nunito Bold 16px, 12px radius, 48px height.

### Data
- None. Static content.

### User Actions
- **Swipe left/right**: Navigate between slides. Horizontal PageView with spring physics.
- **Tap Skip**: Jump to Profile Setup (screen 5).
- **Tap Next**: Advance to next slide with 300ms slide animation.
- **Tap Get Started** (slide 3): Set `onboarding_complete` flag in local storage, navigate to Profile Setup (screen 5).

### States
- **Empty**: N/A.
- **Loading**: N/A (static content).
- **Error**: N/A.

### Mobile Notes
- Swipe gesture with momentum. Page snapping.
- Safe area: content respects top/bottom safe areas. Gradient is edge-to-edge.
- Floating emoji decorations use subtle parallax on swipe for depth.

### Web Notes
- Centered card layout at tablet+ (max-width 600px, centered, with shadow).
- Arrow keys can navigate slides.
- Skip/Next buttons are always visible (no swipe, click-based navigation).

---

## 3. Login Screen
**Purpose**: Authenticate returning users with email and password.
**Route/Navigation**: From Splash (if token expired) or from Register screen "Already have an account?" link.
**Platform**: Both

### Layout
1. Top: Back arrow (if came from Register). Emerald-to-teal gradient header area, 200px tall, with curved bottom edge.
2. In gradient area: "Welcome Back" title, Nunito Bold 28px, white. Subtitle "Sign in to continue tracking [child name]'s progress" (or generic if no child) in Nunito Regular 14px, white/80%.
3. White card overlapping gradient by 40px: Contains form fields.
4. Email input field with mail icon prefix.
5. Password input field with lock icon prefix and show/hide toggle suffix.
6. "Forgot password?" text link, right-aligned, emerald color, Nunito Medium 13px.
7. "Sign In" primary button, full-width, emerald gradient, white text, 48px height.
8. Divider with "or" text.
9. "Sign in with Google" outline button, full-width, 48px height.
10. Bottom: "Don't have an account? Sign Up" text, centered, "Sign Up" in emerald bold.

### Components
- **Text inputs**: White background, 1px #e5e7eb border, 12px radius, 48px height, Nunito Regular 16px, placeholder in #9ca3af. Focus state: 2px emerald border.
- **Primary button**: Emerald-to-teal gradient, white Nunito Bold 16px text, 12px radius, 48px height. Disabled state: 50% opacity.
- **Google button**: White background, 1px #e5e7eb border, Google "G" icon left, "Sign in with Google" text in #1f2937.

### Data
- `POST /api/auth/login` with `{ email, password }`.
- Response: `{ token, refreshToken, user: { id, email, name } }`.
- Store token + refreshToken in secure storage (mobile) / httpOnly cookie or localStorage (web).

### User Actions
- **Type email**: Validate email format on blur. Show red border + "Please enter a valid email" if invalid.
- **Type password**: No validation beyond non-empty.
- **Tap show/hide**: Toggle password visibility.
- **Tap Forgot password?**: Navigate to forgot password flow (future, show "Coming soon" toast for now).
- **Tap Sign In**: Validate both fields non-empty, call login API. On success -> Home Dashboard. On 401 -> show inline error "Invalid email or password" below password field in red. On 500 -> show toast "Something went wrong. Please try again."
- **Tap Google sign-in**: Initiate OAuth flow (future, show "Coming soon" toast for now).
- **Tap Sign Up**: Navigate to Register screen (screen 4).

### States
- **Empty**: Form fields empty, Sign In button disabled (50% opacity).
- **Loading**: Sign In button shows spinner, fields disabled.
- **Error**: Inline error message below relevant field, red text Nunito Regular 12px. Toast for server errors.

### Mobile Notes
- Keyboard-aware scroll. Form card scrolls up when keyboard opens.
- Email field: keyboardType emailAddress, autocomplete email.
- Password field: obscureText true by default.

### Web Notes
- Form centered, max-width 420px.
- Enter key submits form.
- Tab order: email -> password -> sign in.
- Autofill support for email and password.

---

## 4. Register Screen
**Purpose**: Create a new account for first-time users.
**Route/Navigation**: From Login "Sign Up" link or from Onboarding "Get Started" (if no account).
**Platform**: Both

### Layout
1. Same gradient header as Login, but title is "Create Account" and subtitle "Start tracking your little one's amazing journey".
2. White card with form fields:
   - Full name input (user icon prefix).
   - Email input (mail icon prefix).
   - Password input (lock icon prefix, show/hide toggle, strength indicator below).
   - Confirm password input (lock icon prefix, show/hide toggle).
3. Terms checkbox: "I agree to the Terms of Service and Privacy Policy" with linked text in emerald.
4. "Create Account" primary button, full-width, emerald gradient.
5. Divider with "or".
6. "Sign up with Google" outline button.
7. Bottom: "Already have an account? Sign In" link.

### Components
- **Password strength indicator**: 4-segment bar below password field. Segments fill left-to-right: 1=red (weak), 2=orange (fair), 3=yellow (good), 4=green (strong). Label text: "Weak" / "Fair" / "Good" / "Strong" in matching color, Nunito Regular 11px.
- **Checkbox**: 20x20px, emerald fill when checked, 4px radius.
- All other components same as Login screen.

### Data
- `POST /api/auth/register` with `{ name, email, password }`.
- Response: `{ token, refreshToken, user: { id, email, name } }`.
- Validation: name required, email valid format, password min 6 chars, passwords match.

### User Actions
- **Fill fields**: Real-time validation on blur for each field.
- **Tap Create Account**: Validate all fields. Call register API. On success -> Profile Setup (screen 5). On 400 "Email already registered" -> show inline error below email. On 500 -> toast.
- **Tap Terms/Privacy links**: Open in-app browser / new tab.
- **Tap Sign In**: Navigate to Login (screen 3).

### States
- **Empty**: All fields empty, button disabled.
- **Loading**: Button shows spinner, fields disabled.
- **Error**: Field-level inline errors in red below each invalid field.

### Mobile Notes
- Same keyboard handling as Login.
- Password strength updates in real-time as user types.

### Web Notes
- Same centered layout as Login, max-width 420px.
- Tab order follows field order.

---

## 5. Profile Setup Wizard (5 steps)
**Purpose**: Collect child profile information in a guided, non-overwhelming 5-step flow.
**Route/Navigation**: After Register (screen 4) or from onboarding completion. Can also be accessed from Profile to add another child.
**Platform**: Both

### Layout
1. Top: Progress bar showing step N of 5. Emerald fill animates left-to-right. Step labels below: "Basics | Measurements | Region | Interests | Favorites".
2. Content area: PageView with current step content. Each step is a scrollable form.
3. Bottom: "Back" text button (left) + "Next" / "Complete" primary button (right). Back hidden on step 1.

### Step 1 — Basics
- **Child's name** text input (required). Placeholder: "What's your little one's name?"
- **Nickname** text input (optional). Placeholder: "Any cute nickname?"
- **Date of birth** date picker. Tap opens native date picker (mobile) or calendar dropdown (web). Placeholder: "When were they born?"
- **Gender** segmented control with 3 options: Boy | Girl | Other. Pill-shaped segments, selected = emerald fill + white text, unselected = white fill + gray text.
- **Profile photo** (optional): Circular 80px placeholder with camera icon. Tap opens camera/gallery picker.

### Step 2 — Measurements
- **Weight** number input with "kg" suffix. Placeholder: "e.g., 10.5".
- **Height** number input with "cm" suffix. Placeholder: "e.g., 76".
- **Head circumference** number input with "cm" suffix (optional). Placeholder: "e.g., 46". Helper text below: "Usually measured at checkups for babies under 3 years."
- Info card (light blue background, info icon): "These measurements help us compare your child's growth against WHO standards. You can update them anytime."

### Step 3 — Region
- **WHO Region** selection as a list of 6 large tappable cards (one per region):
  - AFRO (Africa) with Africa map icon
  - AMRO (Americas) with Americas map icon
  - SEARO (South-East Asia) with SE Asia map icon
  - EURO (Europe) with Europe map icon
  - EMRO (Eastern Mediterranean) with EM map icon
  - WPRO (Western Pacific) with WP map icon
- Selected card: emerald border + checkmark badge. Unselected: gray border.
- Helper text: "This helps us use the right WHO growth standards for your region."

### Step 4 — Interests
- **What does [name] enjoy?** Multi-select grid of pill chips.
- Options: "Music", "Animals", "Books", "Outdoors", "Building", "Art", "Water play", "Dancing", "Vehicles", "Cooking", "Sports", "Nature".
- Selected pills: emerald fill + white text. Unselected: white fill + gray border + gray text.
- Min 0, no max. Helper: "This helps us personalize stories and activities."

### Step 5 — Favorites
- **Favorite colors** multi-select color circles (8 options: Red, Orange, Yellow, Green, Blue, Purple, Pink, Rainbow). Each is a 40px circle of that color. Selected: 3px emerald ring around it.
- **Favorite characters** text input with tag-style entry. Type name + Enter to add as a chip. Chips are removable (x icon). Placeholder: "e.g., Peppa Pig, Elmo..."
- Helper: "We use favorites to personalize bedtime stories."

### Components
- **Progress bar**: 4px height, full-width, gray track, emerald fill. 5 evenly spaced marker dots. Current step marker is larger (8px) and emerald.
- **Step navigation**: "Back" in gray text, "Next" as emerald gradient pill button 48px height. "Complete" on final step (same style, label changes).
- **Info cards**: Light blue (#eff6ff) background, 16px radius, blue info icon, text in #1e40af, Nunito Regular 13px.

### Data
- On "Complete" (step 5): `POST /api/children` with full profile payload:
  ```json
  {
    "name": "...", "dateOfBirth": "ISO", "gender": "male|female|other",
    "weight": 10.5, "height": 76, "headCircumference": 46,
    "region": "searo", "interests": [...], "favoriteColors": [...],
    "favoriteCharacters": [...]
  }
  ```
- Response: `{ child }` with created child profile.
- Also upload profile photo if set: `POST /api/upload/image` with `bucket=profiles`.

### User Actions
- **Tap Next**: Validate current step fields, animate to next step, update progress bar.
- **Tap Back**: Go to previous step.
- **Tap Complete**: Submit profile to API. On success -> Home Dashboard (screen 6) with confetti animation. On error -> toast "Could not save profile. Please try again."
- **Tap profile photo**: Open image picker (camera + gallery options on mobile, file picker on web).

### States
- **Empty**: Each step starts with empty fields. Next button disabled until required fields filled.
- **Loading**: Complete button shows spinner on final submission.
- **Error**: Field-level validation errors. Toast for API errors.

### Mobile Notes
- PageView with physics: NeverScrollableScrollPhysics (button-driven only, no swipe between steps to prevent accidental navigation).
- Date picker: showDatePicker with max date = today, min date = 5 years ago.
- Number inputs: keyboardType number with decimal.

### Web Notes
- Centered card, max-width 540px.
- Date picker: HTML date input or custom calendar dropdown.
- Step indicators are clickable to jump to completed steps (not forward).

---

## HOME & DASHBOARD

---

## 6. Home Dashboard
**Purpose**: Central hub showing child summary, latest analysis highlights, and quick actions.
**Route/Navigation**: Default screen after login. Bottom tab "Home" (mobile) or "Dashboard" (web).
**Platform**: Both

### Layout
1. **Header section** (emerald-to-teal gradient, 200px, curved bottom):
   - Top row: "Hi, [parent_name]" greeting (Nunito Bold 16px, white), notification bell icon (right), child switcher dropdown if multiple children.
   - Child avatar (56px circle, photo or initials) + child name (Nunito Bold 20px, white) + age badge pill ("14 months", white/20% bg, white text).
   - Subtle wave pattern decoration at bottom of gradient.

2. **Quick Actions row** (horizontal scroll, overlapping gradient by 20px):
   - 4 action cards, each 72x80px:
     - "Analyze" (camera icon, emerald bg) -> Media Upload (screen 8)
     - "Stories" (book icon, purple bg) -> Bedtime Stories (screen 16)
     - "Growth" (trending-up icon, blue bg) -> Growth Charts (screen 14)
     - "Report" (file-text icon, pink bg) -> Pediatrician Report (screen 20)

3. **Development Snapshot card** (if analysis exists):
   - Card title: "Latest Development Snapshot" + "See details" link (right).
   - Overall score: Large circular progress ring (emerald), score number centered (e.g., "85"), label "Overall Score" below.
   - 4 domain mini-bars in a row: Motor (blue), Cognitive (purple), Language (pink), Social (amber). Each shows domain icon + score bar + number.
   - Timestamp: "Analyzed 3 days ago" in secondary text.

4. **Upcoming Milestones card** (if child profile exists):
   - Card title: "Coming Up Next" + "All milestones" link.
   - 2-3 milestone items, each with: domain color dot, milestone title (Nunito Medium 14px), expected age range ("12-15 months"), status chip ("On track" green / "Watch" amber).

5. **Personalized Tip card**:
   - Light gradient background (emerald/5% opacity).
   - Lightbulb icon + "Tip of the Day" label.
   - Tip text from latest analysis personalizedTips[0] or a generic parenting tip.
   - "More tips" link -> Recommendations (screen 19).

6. **Recent Timeline** (2-3 most recent entries):
   - Card title: "Recent Activity" + "View all" link.
   - Each entry: icon (based on type: analysis=bar-chart, milestone=flag, measurement=ruler, photo=image), title, relative time.

### Components
- **Quick action card**: 72x80px, 16px radius, colored background, white icon (24px) centered above label (Nunito Medium 11px, white).
- **Development score ring**: 80px diameter, 6px stroke, emerald track, gray background track. Number centered: Nunito Bold 28px.
- **Domain mini-bar**: 60px wide, 6px height, colored fill proportional to score (0-100). Domain icon 16px above. Score number (Nunito Medium 12px) right of bar.
- **Milestone item**: Row with 8px color dot, text stack (title + age range), status chip (pill, 20px radius, colored bg at 10% + colored text).
- **Timeline entry**: Row with 32px icon circle (light bg, colored icon), title (14px medium), time (12px secondary).

### Data
- `GET /api/auth/me` -> parent name.
- `GET /api/children` -> child profiles (use first/selected child).
- `GET /api/analysis/:childId` -> latest analysis (first item) for Development Snapshot.
- `GET /api/analysis/milestones/:ageMonths` -> upcoming milestones.
- `GET /api/timeline/:childId` -> recent 3 entries.

### User Actions
- **Tap child avatar/name**: Open child switcher bottom sheet (if multiple children) or navigate to Edit Profile (screen 26).
- **Tap quick action cards**: Navigate to respective screens.
- **Tap "See details"**: Navigate to Analysis Results (screen 10) for latest analysis.
- **Tap "All milestones"**: Navigate to Milestones Tracker (screen 13).
- **Tap "More tips"**: Navigate to Recommendations (screen 19).
- **Tap "View all"**: Navigate to Timeline (screen 15).
- **Tap any timeline entry**: Navigate to the relevant detail screen (analysis results, etc.).
- **Pull to refresh**: Reload all dashboard data.

### States
- **Empty** (no child profile): Show illustration of a parent holding a baby + "Welcome to TinySteps!" title + "Add your child's profile to get started" description + "Set Up Profile" emerald button -> Profile Setup (screen 5).
- **Empty** (child exists, no analysis): Development Snapshot card replaced with a CTA card: "Ready to see how [name] is doing?" + "Run First Analysis" button -> Media Upload (screen 8). Milestones and timeline cards still show based on available data.
- **Loading**: Skeleton screens for each card. Gradient header shows immediately. Cards show animated shimmer placeholder rectangles.
- **Error**: Toast "Couldn't load dashboard data. Pull to refresh." Cards that failed show inline retry button.

### Mobile Notes
- Pull-to-refresh with custom emerald refresh indicator.
- Quick actions row: horizontally scrollable with snap. Thumb-zone optimized: primary actions on left.
- Bottom navigation bar visible. Center "Analyze" tab is elevated FAB-style (56px circle, emerald gradient, plus icon).
- Scroll: SingleChildScrollView. Header gradient stays fixed during scroll (collapses on scroll-up as SliverAppBar).

### Web Notes
- **Tablet (768px+)**: Quick actions grid 2x2 instead of horizontal scroll. Development Snapshot and Milestones cards side-by-side in 2-column grid.
- **Desktop (1280px+)**: 3-column layout. Left: child info sidebar (sticky). Center: Development Snapshot + Milestones. Right: Tip + Timeline.
- Top nav replaces bottom tabs.

---

## 7. Add Measurement Modal
**Purpose**: Quick-entry modal to record a new growth measurement (weight, height, head circumference).
**Route/Navigation**: Triggered from Growth Charts screen (screen 14) "Add Measurement" button, or from Dashboard quick action.
**Platform**: Both (bottom sheet on mobile, dialog on web)

### Layout
1. Handle bar (mobile) or close X (web) at top.
2. Title: "New Measurement" in Nunito Bold 18px.
3. Date picker row: calendar icon + date display (defaults to today). Tap to change.
4. Three input fields in a column:
   - Weight (kg): number input, optional.
   - Height (cm): number input, optional.
   - Head circumference (cm): number input, optional.
5. Notes text area (optional, 2 lines max). Placeholder: "Any notes? e.g., measured at doctor's office"
6. "Save Measurement" primary button, full-width.

### Components
- Same text input style as Profile Setup. Number inputs with decimal keyboard.
- Date display: Nunito Medium 14px, tap opens date picker.

### Data
- `POST /api/timeline/measurement` with `{ childId, weight, height, headCircumference, date, notes }`.
- At least one of weight/height/headCircumference required.
- Response: `{ measurement, child }` (child with updated current measurements).

### User Actions
- **Change date**: Open date picker (max = today).
- **Fill fields**: At least one measurement required. Save button disabled until at least one field has a value.
- **Tap Save**: Submit to API. On success: close modal, show toast "Measurement saved!", refresh parent screen data. On error: toast with error message.

### States
- **Empty**: Fields empty, Save disabled.
- **Loading**: Save button shows spinner.
- **Error**: Toast for API errors. Field validation for non-numeric input.

### Mobile Notes
- Bottom sheet, drag-to-dismiss enabled.
- 85% of screen height.
- Number keyboard with decimal point.

### Web Notes
- Centered dialog, max-width 420px, with backdrop overlay.
- Close on Escape key.

---

## ANALYSIS FLOW

---

## 8. Media Upload Screen
**Purpose**: Allow parents to upload photos or videos of their child for AI development analysis.
**Route/Navigation**: From Dashboard "Analyze" quick action, or center bottom tab "+" button.
**Platform**: Both

### Layout
1. **Header**: "New Analysis" title (Nunito Bold 20px) + back arrow.
2. **Child context bar**: Small avatar + name + age. Shows which child this analysis is for.
3. **Upload area** (central, large):
   - Dashed border rectangle, 16px radius, 200px height.
   - Center: cloud-upload icon (48px, emerald) + "Tap to upload photos or videos" text + "or drag and drop" (web only) in secondary text.
   - Accepted formats note: "JPEG, PNG, GIF, MP4, WebM - up to 50MB" in Nunito Regular 11px, secondary color.
4. **Selected media grid**: After selection, shows thumbnail grid (2 columns) of selected files.
   - Each thumbnail: 16px radius, fill container width, aspect ratio preserved, X button top-right to remove.
   - Add more button (+) as last grid item if < 10 files.
5. **Tips section** (collapsible):
   - "Tips for better results" header with chevron.
   - Bullet list: "Show your child playing naturally", "Good lighting helps", "Include different activities", "Videos of 15-30 seconds work best".
6. **Bottom**: "Analyze" primary button, full-width. Disabled until at least 1 file selected.

### Components
- **Upload area**: Dashed 2px #d1d5db border, 16px radius. Hover (web): border becomes emerald, bg becomes emerald/5%.
- **Thumbnail**: Rounded image/video preview. Video thumbnails show play icon overlay and duration badge.
- **Tips section**: Light yellow (#fefce8) card, 16px radius, warning-amber icon.

### Data
- `POST /api/analysis` with `multipart/form-data`: `childId` field + `media` file array (up to 10 files).
- Alternatively for web: `POST /api/analysis/save` with pre-computed browser-side Gemini results.
- File limits: 50MB per file, max 10 files. Allowed: image/jpeg, image/png, image/gif, image/webp, video/mp4, video/webm.

### User Actions
- **Tap upload area**: Open file picker (camera + gallery on mobile, file browser on web).
- **Tap thumbnail X**: Remove that file from selection.
- **Tap +**: Add more files (up to 10 total).
- **Tap Analyze**: Upload files and start analysis. Navigate to Analysis Loading (screen 9).
- **Tap back**: Confirm discard if files selected ("Discard this analysis?" dialog).

### States
- **Empty**: Upload area shown, Analyze button disabled.
- **Loading**: During file upload: progress bar across top of upload area, file-by-file progress.
- **Error**: "File too large" or "Unsupported format" inline error below upload area. Toast for upload failures.

### Mobile Notes
- Camera option in picker for live capture.
- Files stored temporarily in app cache during selection.
- Long-press thumbnail to see full preview.

### Web Notes
- Drag and drop zone: highlight border on dragover.
- Paste from clipboard support for images.
- File input hidden, triggered by click on upload area.

---

## 9. Analysis Loading Screen
**Purpose**: Engaging wait screen while AI analyzes uploaded media (15-30 seconds).
**Route/Navigation**: Auto-navigated from Media Upload after successful file submission.
**Platform**: Both

### Layout
1. Full-screen, emerald-to-teal gradient background (subtle).
2. **Center content**:
   - Animated illustration: rotating brain icon with orbiting dots (motor=blue, cognitive=purple, language=pink, social=amber).
   - Below: "Analyzing [child_name]'s development..." in Nunito Bold 18px, dark text.
   - Rotating status messages (fade in/out every 3s):
     - "Examining motor skills..."
     - "Checking cognitive development..."
     - "Evaluating language milestones..."
     - "Assessing social-emotional growth..."
     - "Comparing with WHO standards..."
     - "Generating personalized insights..."
   - Progress bar (indeterminate or estimated): 4px, emerald fill, rounded.
3. **Bottom**: "This usually takes 15-30 seconds" helper text, Nunito Regular 13px, secondary.

### Components
- **Brain animation**: Custom animated widget. Central brain icon (40px) with 4 colored dots orbiting in a circle (radius 60px), each dot 8px, domain-colored.
- **Status text**: Nunito Regular 14px, secondary color. Crossfade transition between messages.
- **Progress bar**: 4px height, full-width minus 48px padding, 2px radius, emerald fill.

### Data
- Polling: If using server-side analysis, poll `GET /api/analysis/:childId` every 3s until new analysis appears.
- If using client-side Gemini: await the Gemini API response, then `POST /api/analysis/save`.

### User Actions
- **None during analysis**. Back button / back gesture shows confirmation: "Analysis in progress. Are you sure you want to cancel?"
- On completion: Auto-navigate to Analysis Results (screen 10) with a brief success flash (checkmark icon, 500ms).

### States
- **Loading**: The default and only visible state.
- **Error**: If analysis fails after timeout (60s), show: sad-face illustration + "Analysis couldn't be completed" + "This might be due to unclear media or a network issue" + "Try Again" button (re-upload) + "Go Back" text button.

### Mobile Notes
- Prevent screen sleep during analysis.
- Back gesture intercepted with confirmation dialog.

### Web Notes
- Same layout, centered, max-width 480px.
- Browser tab title: "Analyzing... | TinySteps"

---

## 10. Analysis Results Screen
**Purpose**: Display comprehensive AI development analysis results with scores, observations, and next steps.
**Route/Navigation**: Auto-navigated from Analysis Loading. Also accessible from Dashboard "See details" and Timeline entries.
**Platform**: Both

### Layout
1. **Header** (emerald gradient, 160px):
   - Back arrow + "Analysis Results" title.
   - Date of analysis: "February 28, 2026" in white/80%.

2. **Overall Score card** (white, overlapping gradient by 30px):
   - Large circular progress ring (120px diameter, 8px stroke, emerald).
   - Score number centered: Nunito Bold 36px.
   - Status label below ring: "On Track" (green pill) / "Emerging" (amber pill) / "Needs Support" (red pill).
   - Headline text: 1-2 sentence AI summary. Nunito Regular 14px, secondary. E.g., "Aarav is developing wonderfully! Motor skills are especially strong."

3. **Domain Assessment cards** (4 cards, vertically stacked):
   Each card contains:
   - Domain color bar (4px) at top edge.
   - Domain icon (24px, domain color) + domain name (Nunito Bold 16px) + score ("/100", Nunito Medium 14px, secondary).
   - Status chip (pill, domain color bg at 10%, domain color text).
   - Horizontal score bar: domain color fill, 100px wide, 6px height.
   - "Observations" section: 2-3 bullet points (Nunito Regular 13px).
   - "Strengths" section: green checkmark + text list.
   - "What to work on" section: arrow-right + text list.
   - "Activities" expandable: Tap to show 2-3 recommended activities.
   - Card is tappable -> navigates to Improve Domain screen (screen 12) for that domain.

4. **Personalized Tips section**:
   - Section title: "Your Next Steps" (Nunito Bold 18px).
   - 3-5 tip cards, each: numbered circle (emerald) + tip title (Bold 14px) + tip description (Regular 13px) + materials list if any.

5. **Sources & Evidence link**:
   - "Based on WHO guidelines and clinical research" text + right arrow -> WHO Evidence (screen 24).

6. **Action buttons** (sticky bottom on mobile):
   - "Share with Pediatrician" outline button -> Pediatrician Report (screen 20).
   - "Run New Analysis" primary button -> Media Upload (screen 8).

### Components
- **Score ring**: Animated on mount (0 to actual score over 1s, ease-out).
- **Domain cards**: White background, 16px radius, standard shadow. Domain color accent on left edge (4px bar).
- **Tip cards**: White background, 16px radius, numbered with emerald circle (24px).

### Data
- `GET /api/analysis/:childId/:analysisId` or use the analysis object passed from loading screen.
- Analysis object contains: overallScore, overallStatus, summary, motorAssessment, languageAssessment, cognitiveAssessment, socialAssessment, personalizedTips, sources.

### User Actions
- **Tap domain card**: Navigate to Improve Domain (screen 12) with domain parameter.
- **Tap "Activities" expand**: Toggle activity list within card.
- **Tap WHO Evidence link**: Navigate to WHO Evidence (screen 24) with domain context.
- **Tap Share with Pediatrician**: Navigate to Pediatrician Report (screen 20).
- **Tap Run New Analysis**: Navigate to Media Upload (screen 8).
- **Scroll**: Smooth scrolling. Domain cards animate in on scroll (stagger fade-up).

### States
- **Empty**: N/A (always has data when navigated here).
- **Loading**: If loaded by ID: skeleton cards for each section.
- **Error**: Full-screen error: "Couldn't load analysis results" + Retry button.

### Mobile Notes
- Scroll with sticky bottom action buttons (translucent white bar, 80px).
- Share button bottom-right as FAB alternative if preferred.
- Domain cards: subtle entrance animation (fade + slide up, 100ms stagger).

### Web Notes
- **Tablet+**: Overall score card and domain cards in 2-column grid.
- **Desktop**: 3-column: score left (sticky sidebar), domains center (2-col grid), tips right.
- Print-friendly: Add "Print Results" option in web.

---

## DEVELOPMENT TRACKING

---

## 11. Development Insights Screen
**Purpose**: Longitudinal view of development progress over time with trend charts and domain comparisons.
**Route/Navigation**: From Dashboard "See details" or from Home -> Discover tab section.
**Platform**: Both

### Layout
1. **Header**: Back arrow + "Development Insights" title + filter icon (right) to filter by date range.
2. **Overall Trend chart**:
   - Line chart showing overall score over time (x-axis: dates, y-axis: 0-100).
   - Emerald line, area fill below at 10% opacity.
   - Data points as circles (8px). Tap a point to see details tooltip.
   - If only 1 analysis: show single data point with note "Run more analyses to see trends."
3. **Domain Comparison section**:
   - 4 horizontal bars, one per domain, each showing latest score.
   - Bar color = domain color. Label left, score right.
   - Arrow indicator showing change since last analysis (up green arrow, down red arrow, dash if no change).
4. **Domain Trend charts** (expandable per domain):
   - Tap a domain bar to expand and show its individual trend chart.
   - Same line chart format as overall, but in domain color.
5. **Milestone Progress card**:
   - Circular progress ring: "X of Y milestones achieved for this age" (e.g., "8 of 12").
   - "View all milestones" link -> Milestones Tracker (screen 13).
6. **WHO Comparison note**:
   - Info card: "Your child is in the Xth percentile for [domain] development compared to WHO standards for [age] months."

### Components
- **Line chart**: Recharts (web) / fl_chart (Flutter). Emerald line, 2px stroke, filled area below. Grid lines in #f3f4f6. Axis labels in Nunito Regular 11px, secondary.
- **Domain bar**: 200px max width, 12px height, 6px radius, domain colored fill. Score label (Nunito Bold 14px) right-aligned.
- **Change arrow**: 16px, green up-arrow (score increased) or red down-arrow (decreased) or gray dash (same/no prior).

### Data
- `GET /api/analysis/:childId` -> all analyses (up to 50) for trend data.
- `GET /api/children/:childId/milestones` -> achieved + watched milestones.
- `GET /api/analysis/milestones/:ageMonths` -> total milestones for age.

### User Actions
- **Tap chart data point**: Show tooltip with date + score.
- **Tap domain bar**: Expand to show domain-specific trend chart.
- **Tap "View all milestones"**: Navigate to Milestones Tracker (screen 13).
- **Tap filter icon**: Open date range selector (Last 30 days / 3 months / 6 months / All time).
- **Pull to refresh**: Reload analysis data.

### States
- **Empty** (no analyses): Illustration + "No insights yet" + "Run your first analysis to start tracking development" + "Analyze Now" button.
- **Loading**: Skeleton chart placeholder + shimmer bars.
- **Error**: "Couldn't load insights" + Retry.

### Mobile Notes
- Charts are full-width with horizontal scroll if many data points.
- Tap + hold on chart for detailed tooltip.

### Web Notes
- **Tablet+**: Overall trend chart full-width. Domain bars in 2x2 grid below.
- **Desktop**: Side-by-side: overall trend left (60%), domain bars + milestone progress right (40%).
- Charts have hover tooltips.

---

## 12. Improve Domain Screen
**Purpose**: Focused improvement resources, activities, and guidance for a specific developmental domain.
**Route/Navigation**: From Analysis Results domain card tap, or from Development Insights domain expansion.
**Platform**: Both

### Layout
1. **Header**: Domain-colored gradient background (e.g., blue gradient for Motor). Back arrow + domain name title (e.g., "Motor Skills") + domain icon.
2. **Domain Score card** (white, overlapping gradient):
   - Score ring (80px, domain color) + current score.
   - Status: "On Track" / "Emerging" / "Needs Support" pill.
   - Trend indicator: up/down arrow + "improved by 5 points since last analysis".
3. **Current Observations** section:
   - List of AI observations from latest analysis for this domain.
   - Each with bullet, Nunito Regular 14px.
4. **Recommended Activities** section:
   - Cards for each activity. Each card:
     - Activity title (Nunito Bold 14px).
     - Duration estimate: clock icon + "10-15 min".
     - Difficulty: Easy / Medium / Challenging pill.
     - Description text (13px).
     - Materials list if any (tag chips).
5. **Related Milestones** section:
   - Milestones for this domain and child's age.
   - Each: checkbox (achieved/not), milestone title, age range, domain dot.
6. **WHO Evidence link**: "See the research behind these recommendations" -> WHO Evidence (screen 24) with domain filter.

### Components
- **Activity card**: White, 16px radius, shadow. Domain color left accent bar (4px).
- **Difficulty pill**: Easy=green, Medium=amber, Challenging=red. 20px radius, colored bg at 10%.
- **Material chip**: Gray bg (#f3f4f6), 20px radius, Nunito Regular 12px.

### Data
- `GET /api/resources/:childId?domain=[motor|language|cognitive|social]` -> activities and resources for this domain.
- `GET /api/analysis/:childId` (latest) -> domain-specific observations and score.
- `GET /api/analysis/milestones/:ageMonths` -> milestones filtered by domain.

### User Actions
- **Tap activity card**: Expand for full details (description + materials).
- **Tap milestone checkbox**: Mark as achieved (`POST /api/children/:childId/milestones/:milestoneId`).
- **Tap WHO Evidence link**: Navigate to WHO Evidence (screen 24).
- **Pull to refresh**: Reload resources.

### States
- **Empty** (no resources): "No activities generated yet" + "Run an analysis to get personalized activities" button.
- **Loading**: Skeleton cards.
- **Error**: "Couldn't load activities" + Retry.

### Mobile Notes
- Smooth scroll. Activity cards have subtle entrance animation.
- Milestone checkboxes: haptic feedback on toggle.

### Web Notes
- **Tablet+**: Activity cards in 2-column grid.
- **Desktop**: Left sidebar with domain score + observations (sticky). Right: activities + milestones.

---

## 13. Milestones Tracker Screen
**Purpose**: View and track developmental milestones by domain, filtered for child's age.
**Route/Navigation**: From Dashboard "All milestones" link, or from Discover tab.
**Platform**: Both

### Layout
1. **Header**: Back arrow + "Milestones" title.
2. **Domain filter tabs**: Horizontal scrollable pills: "All" | "Motor" (blue) | "Cognitive" (purple) | "Language" (pink) | "Social" (amber). Selected = filled, unselected = outline.
3. **Progress summary bar**:
   - "X of Y milestones achieved" text.
   - Linear progress bar: emerald fill, gray track.
4. **Age group sections** (grouped by milestone age range):
   - Section header: "12-15 months" (age range), with expand/collapse chevron.
   - Milestone list items within each group:
     - Checkbox (emerald when checked) + milestone title (Nunito Medium 14px) + domain color dot.
     - Below title: description text (12px, secondary), expected age range.
     - Status: "Achieved" green chip / "Watching" amber chip / unmarked.
     - Tap to expand: shows notes field + date achieved + confirmed by.

5. **Watched Milestones** section (if any):
   - Separate card at top: "Milestones You're Watching" with eye icon.
   - List of watched milestones with "Mark as Achieved" button each.

### Components
- **Domain filter pill**: 32px height, 20px radius. Selected: domain color fill + white text. Unselected: white fill + domain color border + domain color text.
- **Milestone item**: Row layout, 16px padding vertical. Divider between items.
- **Checkbox**: 24x24px, emerald fill when checked, gray border when unchecked. Animated checkmark.

### Data
- `GET /api/analysis/milestones/:ageMonths` -> all milestones for child's age.
- `GET /api/children/:childId/milestones` -> achieved + watched milestones.
- `POST /api/children/:childId/milestones/:milestoneId` -> mark achieved.
- `DELETE /api/children/:childId/milestones/:milestoneId` -> unmark achieved.
- `POST /api/children/:childId/milestones/:milestoneId/watch` -> add to watch list.
- `DELETE /api/children/:childId/milestones/:milestoneId/watch` -> remove from watch list.

### User Actions
- **Tap domain filter**: Filter milestones by domain.
- **Tap checkbox**: Toggle achieved state. If marking achieved: brief celebration animation (confetti burst). Creates timeline entry automatically (backend).
- **Long-press milestone**: Show context menu: "Mark as achieved" / "Add to watch list" / "Add notes".
- **Tap milestone row**: Expand to show details (notes, date, who confirmed).
- **Pull to refresh**: Reload milestones.

### States
- **Empty**: "No milestones loaded" + "Make sure you have a child profile set up" + link to Profile Setup.
- **Loading**: Skeleton list items.
- **Error**: "Couldn't load milestones" + Retry.

### Mobile Notes
- Sticky domain filter tabs at top on scroll.
- Haptic feedback on milestone achievement.
- Swipe right on milestone to quick-mark as achieved.

### Web Notes
- **Tablet+**: Domain filters as horizontal bar. Milestones in wider cards.
- **Desktop**: Left sidebar with domain filters (vertical list) + progress. Right: milestone list.

---

## 14. Growth Charts Screen
**Purpose**: Visualize child's physical growth (weight, height, head circumference) against WHO percentile curves.
**Route/Navigation**: From Dashboard "Growth" quick action, or from Discover tab.
**Platform**: Both

### Layout
1. **Header**: Back arrow + "Growth Charts" title + "Add Measurement" button (right, emerald outline).
2. **Metric toggle tabs**: "Weight" | "Height" | "Head Circ." — horizontal pills.
3. **Growth chart** (main area, ~300px height):
   - Line chart with WHO percentile bands as shaded areas:
     - 3rd-15th percentile: light red shading
     - 15th-50th: light yellow shading
     - 50th-85th: light green shading
     - 85th-97th: light yellow shading
   - Child's data points plotted as emerald dots connected by emerald line.
   - X-axis: Age in months. Y-axis: measurement value (kg/cm).
   - Legend: "Your child" (emerald dot) + percentile labels.
4. **Current Percentile card**:
   - "Weight: 65th percentile" with icon and interpretation.
   - Interpretation text: "Within normal range" (green) / "Below average - monitor" (amber) / "Consult pediatrician" (red).
5. **Measurement History list**:
   - Table/list of all measurements, most recent first.
   - Each row: date, weight, height, head circ, source (parent/doctor).
   - Tap to edit/delete.
6. **"Add Measurement" floating button** (bottom right, mobile).

### Components
- **Growth chart**: Recharts AreaChart (web) / fl_chart LineChart (Flutter). Percentile bands as gradient-shaded areas. Child data as solid line with data points.
- **Metric tab**: Same pill style as domain filters. Selected = emerald fill.
- **Percentile card**: White, 16px radius. Large percentile number (Nunito Bold 24px). Color-coded interpretation.
- **Measurement row**: Date (14px medium), values (14px regular), secondary text.

### Data
- `GET /api/timeline/measurements/:childId` -> all measurements chronologically.
- `POST /api/analysis/growth-percentiles` with `{ weight, height, headCircumference, ageMonths, gender }` -> current percentiles.
- WHO percentile data cached locally from backend WHO data service.

### User Actions
- **Tap metric tabs**: Switch between Weight, Height, Head Circ charts.
- **Tap "Add Measurement"**: Open Add Measurement modal (screen 7).
- **Tap data point on chart**: Tooltip showing date + exact value + percentile.
- **Tap measurement row**: Expand to show full details or edit.
- **Pull to refresh**: Reload measurements.

### States
- **Empty** (no measurements): Chart area shows WHO curves without child data + "Add your first measurement to start tracking growth" + "Add Measurement" button.
- **Loading**: Skeleton chart + shimmer measurement list.
- **Error**: "Couldn't load growth data" + Retry.

### Mobile Notes
- Chart supports pinch-to-zoom horizontally for dense data.
- Swipe left/right on chart to pan through time.
- FAB for "Add Measurement" (56px, emerald, plus icon) in bottom-right.

### Web Notes
- **Tablet+**: Chart takes full width. Measurement table below.
- **Desktop**: Chart left (65%), percentile card + measurement table right (35%).
- Chart has hover crosshair showing exact values.

---

## 15. Timeline Screen
**Purpose**: Chronological feed of all child development events (analyses, milestones, measurements, notes, photos).
**Route/Navigation**: Bottom tab "Timeline" (mobile) or top nav "Timeline" (web).
**Platform**: Both

### Layout
1. **Header**: "Timeline" title + filter dropdown (right): "All" | "Analyses" | "Milestones" | "Measurements" | "Notes".
2. **Timeline feed** (vertical list with connecting line):
   - Left: vertical line (2px, #e5e7eb) connecting event nodes.
   - Each event node: colored circle (12px) on the line, domain/type colored.
   - Right of line: event card.
   - Event card content varies by type:
     - **Analysis**: Bar chart icon, "Development Analysis", score summary, date. Tap -> Analysis Results.
     - **Milestone**: Flag icon, milestone title, domain pill, "Achieved!" label, date.
     - **Measurement**: Ruler icon, "Growth Measurement", "Weight: 10.5kg, Height: 76cm", date.
     - **Photo**: Image icon, thumbnail, caption, date.
     - **Note**: Pencil icon, note text, date.
3. **"Add Entry" FAB** (mobile) or "Add Note" button (web): Add a manual note/photo to timeline.
4. **Date grouping**: Events grouped by month. Section headers: "February 2026", "January 2026", etc.

### Components
- **Timeline line**: 2px solid #e5e7eb, vertically continuous.
- **Event node**: 12px circle, type-colored (analysis=emerald, milestone=domain color, measurement=blue, photo=pink, note=gray).
- **Event card**: White, 16px radius, shadow. 12px left margin from node. Content varies by type.
- **Date group header**: Nunito Bold 16px, secondary color, 16px top padding, 8px bottom padding.

### Data
- `GET /api/timeline/:childId` -> all entries (up to 100), sorted by date descending.
- Types: analysis, milestone, measurement, photo, note.

### User Actions
- **Tap event card**: Navigate to detail screen for that entry type (Analysis Results, Milestone detail, etc.).
- **Tap filter**: Filter timeline by event type.
- **Tap "Add Entry" FAB**: Bottom sheet with options: "Add Note" / "Add Photo" / "Add Measurement".
- **Pull to refresh**: Reload timeline.
- **Infinite scroll**: Load more entries as user scrolls down.

### States
- **Empty**: Illustration of a baby scrapbook + "Your journey starts here" + "Run your first analysis or add a note to begin" + "Analyze" button + "Add Note" outline button.
- **Loading**: Skeleton timeline items (3-4 shimmer cards).
- **Error**: "Couldn't load timeline" + Retry.

### Mobile Notes
- Smooth scrolling with lazy loading.
- Event cards have subtle slide-in animation as they enter viewport.
- FAB: 56px, emerald, plus icon. Positioned in thumb zone (bottom-right, above bottom nav).

### Web Notes
- **Tablet+**: Timeline line centered, events alternate left/right for visual interest.
- **Desktop**: Centered timeline, max-width 720px, with ample whitespace.
- Filter as horizontal tabs above timeline.

---

## CONTENT & ENGAGEMENT

---

## 16. Bedtime Stories — Theme Picker
**Purpose**: Select a story theme to generate a personalized bedtime story for the child.
**Route/Navigation**: From Dashboard "Stories" quick action, or from Discover tab.
**Platform**: Both

### Layout
1. **Header**: Back arrow + "Bedtime Stories" title + moon icon.
2. **Introduction text**: "Choose a theme for [child_name]'s bedtime story" in Nunito Regular 14px. Subtext: "Stories are personalized with [name]'s favorite characters and interests."
3. **Theme grid** (2 columns):
   Each theme card:
   - 16px radius, theme color background.
   - Large emoji (36px) centered.
   - Theme name (Nunito Bold 16px, white).
   - Short description (Nunito Regular 12px, white/80%).
   - Tap to select and generate.
4. **Previous Stories section** (below grid):
   - Section title: "Past Stories" + "See all" link.
   - Horizontal scroll of story cover cards (120x160px):
     - Theme color background, story title, date, heart icon if favorited.
     - Tap -> Story Reader (screen 17).

### Theme Cards Data (from API):
| Theme | Emoji | Color | Description |
|-------|-------|-------|-------------|
| Adventure | mountain | #F59E0B | Exciting journeys |
| Animals | lion | #10B981 | Stories with animal friends |
| Space | rocket | #6366F1 | Cosmic adventures |
| Ocean | wave | #0EA5E9 | Underwater worlds |
| Magic | sparkles | #A855F7 | Enchanted tales |
| Dinosaurs | sauropod | #84CC16 | Prehistoric adventures |
| Dreams | crescent-moon | #8B5CF6 | Gentle sleepy stories |
| Friendship | handshake | #EC4899 | Being a good friend |

### Components
- **Theme card**: Colored background matching theme, 16px radius, shadow. 48px padding.
- **Story cover card**: 120x160px, colored bg, 12px radius. Title overlay at bottom (white text on dark gradient).

### Data
- `GET /api/stories/themes` -> available themes.
- `GET /api/stories/:childId` -> previous stories.
- `POST /api/stories` with `{ childId, themeId }` -> generate new story.

### User Actions
- **Tap theme card**: Show brief "Generating story..." modal, call API, on success navigate to Story Reader (screen 17).
- **Tap previous story**: Navigate to Story Reader (screen 17) with that story ID.
- **Tap heart on previous story**: Toggle favorite (`PATCH /api/stories/:childId/:id/favorite`).

### States
- **Empty** (no previous stories): Theme grid shown normally. "Past Stories" section hidden.
- **Loading** (generating story): Full-screen overlay with lullaby animation (moon + stars twinkling) + "Creating a story just for [name]..." text.
- **Error**: Toast "Story generation failed. Please try again." Return to theme picker.

### Mobile Notes
- Theme grid: 2 columns, equal spacing. Thumb zone: most popular themes top-left.
- Previous stories: horizontal scroll with snap, momentum scrolling.

### Web Notes
- **Tablet+**: Theme grid 3 columns.
- **Desktop**: Theme grid 4 columns. Previous stories as larger horizontal scroll or grid below.

---

## 17. Story Reader (Full-Screen Reading Mode)
**Purpose**: Immersive full-screen reading experience for generated bedtime stories.
**Route/Navigation**: From Theme Picker after story generation, or tapping a previous story.
**Platform**: Both

### Layout
1. **Full-screen mode**: Minimal chrome. Tap to toggle header/footer visibility.
2. **Header** (semi-transparent, shown on tap):
   - Back arrow (white) + story title (Nunito Bold 16px, white) + heart favorite toggle (right) + share icon (right).
3. **Page content** (PageView, one page at a time):
   - Top: Illustration area (60% of page height). AI-generated or placeholder illustration for the page. If no illustration: themed gradient background with large page emoji.
   - Bottom: Story text (Nunito Regular 16px, dark text on light card). 24px padding. Soft-cornered white card with subtle shadow.
   - Page number: "Page 2 of 8" small text, centered below text.
4. **Footer** (semi-transparent, shown on tap):
   - Page dots indicator.
   - Previous / Next buttons (arrow icons, white circles).
5. **Moral of the story** (final page):
   - Special layout: emerald gradient background, star icon, "The Moral" label, moral text in white, Nunito Italic 16px.

### Components
- **Page view**: Full-screen, swipe left/right to navigate pages.
- **Illustration**: Rounded 16px, fills top portion. Placeholder if not generated: theme color gradient + page emoji.
- **Text card**: White, 16px top radius, extends to bottom. Nunito Regular 16px, line-height 1.6.
- **Favorite heart**: 24px, filled red if favorited, outline white if not.

### Data
- `GET /api/stories/:childId/:storyId` -> story with pages, illustrations, moral.
- Story pages array: `[{ pageNumber, text, illustrationPrompt, illustrationUrl }]`.
- `PATCH /api/stories/:childId/:id/favorite` -> toggle favorite.

### User Actions
- **Swipe left**: Next page (with page turn animation).
- **Swipe right**: Previous page.
- **Tap center**: Toggle header/footer visibility.
- **Tap heart**: Toggle favorite.
- **Tap share**: Share story text via native share sheet (mobile) or copy link (web).
- **Tap back**: Return to Bedtime Stories screen.

### States
- **Empty**: N/A (always has story data).
- **Loading**: Skeleton page with shimmer illustration area + text lines.
- **Error**: "Couldn't load story" + Retry.

### Mobile Notes
- Full-screen: hide status bar and navigation bar.
- Page turn animation: 3D curl effect or simple slide.
- Prevent screenshots (optional parental feature).

### Web Notes
- Full-viewport mode with escape to exit.
- Arrow keys navigate pages.
- Keyboard shortcut: F for favorite.
- **Desktop**: Pages shown book-style (two pages side by side).

---

## 18. Recipes Screen
**Purpose**: Display AI-generated, age-appropriate recipes for the child.
**Route/Navigation**: From Discover tab or Dashboard.
**Platform**: Both

### Layout
1. **Header**: Back arrow + "Recipes for [child_name]" title + refresh icon (right, to regenerate).
2. **Age context banner**: Light green card: "[Name] is [X] months old - here are age-appropriate meals."
3. **Recipe cards** (vertical list):
   Each recipe card:
   - Recipe image placeholder (theme colored gradient, food emoji).
   - Recipe name (Nunito Bold 16px).
   - Tags row: age range pill + prep time pill (clock icon) + difficulty pill.
   - Short description (13px, 2 lines max, secondary).
   - Tap to expand full recipe:
     - Ingredients list (bulleted).
     - Instructions (numbered steps).
     - Nutritional notes.
     - Safety warnings if any (red card).
4. **"Get More Recipes" button** at bottom: Generates 3 more recipes.

### Components
- **Recipe card**: White, 16px radius, shadow. Expandable with smooth height animation.
- **Tag pills**: 20px radius, appropriate colored background at 10% + colored text. Prep time: blue. Difficulty: Easy=green, Medium=amber, Hard=red. Age: emerald.

### Data
- `GET /api/recommendations/recipes/:childId?count=3` -> recipes array.
- Each recipe: `{ name, description, prepTime, difficulty, ageRange, ingredients[], instructions[], nutritionalNotes, warnings }`.

### User Actions
- **Tap recipe card**: Expand/collapse full recipe details.
- **Tap refresh icon**: Regenerate recipes (show loading state).
- **Tap "Get More Recipes"**: Append 3 more recipes.
- **Pull to refresh**: Reload recipes.

### States
- **Empty**: "Recipes will appear after you set up [name]'s profile" + link to Profile Setup.
- **Loading**: 3 skeleton recipe cards.
- **Error**: "Couldn't load recipes" + Retry.

### Mobile Notes
- Cards expand in-place with smooth animation.
- Long recipe instructions: scrollable within expanded card.

### Web Notes
- **Tablet+**: Recipe cards in 2-column grid.
- **Desktop**: 3-column grid. Expanded recipe takes full row width.

---

## 19. Recommendations Screen
**Purpose**: Hub for all personalized recommendations: products, activities, and parenting tips.
**Route/Navigation**: From Dashboard "More tips" link, or Discover tab.
**Platform**: Both

### Layout
1. **Header**: Back arrow + "Recommendations" title.
2. **Tab bar**: "Products" | "Activities" | "Tips" — horizontal tabs, emerald underline on selected.
3. **Products tab**:
   - Category filter: "Toys" | "Books" | "Learning" | "Safety" pills.
   - Product cards: image placeholder + name + age range + why recommended + buy link (external).
4. **Activities tab**:
   - Domain filter: "All" | domain pills.
   - Activity cards: Same as Improve Domain screen activities. Title, duration, difficulty, description, materials.
5. **Tips tab**:
   - Tip cards: numbered list, each with icon + title + description + "Learn more" link.
   - Focus area filter: "Sleep" | "Nutrition" | "Play" | "Safety" | "General".

### Components
- **Product card**: White, 16px radius. Image left (80x80px), text right. "View" outline button.
- **Activity card**: Same as screen 12.
- **Tip card**: White, 16px radius. Numbered emerald circle + text stack.

### Data
- Products: `GET /api/recommendations/products/:childId?category=toys`.
- Activities: `GET /api/recommendations/activities/:childId?domain=motor`.
- Tips: `GET /api/recommendations/tips/:childId?focusArea=sleep`.

### User Actions
- **Switch tabs**: Load respective content.
- **Tap filter pills**: Filter within current tab.
- **Tap product "View"**: Open external link (in-app browser on mobile, new tab on web).
- **Tap activity card**: Expand for details.
- **Pull to refresh**: Reload current tab.

### States
- **Empty**: Per tab empty state with relevant illustration + "Run an analysis to get personalized [products/activities/tips]."
- **Loading**: Skeleton cards for current tab.
- **Error**: Per-tab error with Retry.

### Mobile Notes
- Tabs are scrollable if more are added. Tab content swipeable.
- Product links open in SafariViewController / Chrome Custom Tab.

### Web Notes
- **Tablet+**: Cards in 2-column grid per tab.
- **Desktop**: 3-column grid. Filters in left sidebar.

---

## REPORTS & MEDICAL

---

## 20. Pediatrician Report Screen
**Purpose**: Generate a professional, shareable development report suitable for pediatrician visits.
**Route/Navigation**: From Analysis Results "Share with Pediatrician" button, or from Dashboard "Report" quick action.
**Platform**: Both

### Layout
1. **Header**: Back arrow + "Pediatrician Report" title.
2. **Report preview card** (if report exists):
   - Report number: "RPT-2026-0228" (Nunito Medium 12px, secondary).
   - Date generated.
   - Child name + age.
   - Overall score + status pill.
   - "View Full Report" primary button -> Generated Report (screen 21).
   - "Download PDF" outline button.
   - "Share" outline button with icon.
3. **Generate Report section** (if no report yet, or to generate new):
   - Info card: "This report summarizes [name]'s latest development analysis in a format suitable for sharing with healthcare providers."
   - Requirements checklist:
     - Checkmark + "Child profile complete" (green if done, red if not).
     - Checkmark + "At least one analysis completed" (green if done, red if not).
   - "Generate Report" primary button (disabled if requirements not met).
4. **Previous Reports list** (if multiple reports exist):
   - List of past reports: date + report number + "View" link.

### Components
- **Report preview card**: White, 16px radius, emerald left border (4px).
- **Requirements item**: Row with circle-check (green) or circle-x (red) icon + text.

### Data
- `GET /api/reports/:childId` -> list of reports.
- `POST /api/reports/:childId/generate` -> generate new report.
- `GET /api/reports/:childId/:id/pdf` -> PDF URL.

### User Actions
- **Tap "Generate Report"**: Call generate API. Show loading. On success: show report preview.
- **Tap "View Full Report"**: Navigate to Generated Report Viewer (screen 21).
- **Tap "Download PDF"**: Download PDF file (triggers browser download on web, share sheet on mobile).
- **Tap "Share"**: Native share sheet with PDF attachment (mobile) or copy link (web).
- **Tap previous report**: Navigate to Generated Report Viewer for that report.

### States
- **Empty** (no analysis): Show requirements checklist with unmet items. "Generate Report" disabled. Prompt to run analysis first.
- **Loading**: "Generating your report..." with spinner and estimated time.
- **Error**: "Report generation failed" + Retry.

### Mobile Notes
- PDF download opens in system PDF viewer or share sheet.
- Share options: email, WhatsApp, print, save to files.

### Web Notes
- PDF opens in new browser tab for preview.
- "Print" button available on desktop.
- Report preview shows more detail on wider screens.

---

## 21. Generated Report Viewer Screen
**Purpose**: Full in-app view of the generated pediatrician report with all sections.
**Route/Navigation**: From Pediatrician Report "View Full Report" button.
**Platform**: Both

### Layout
1. **Header**: Back arrow + "Report #RPT-2026-0228" title + "Download" icon button + "Share" icon button.
2. **Report content** (scrollable, print-formatted):
   - **TinySteps AI logo** + "Development Report" header.
   - **Patient Information** section:
     - Name, Age (months), Gender, Height, Weight, Head Circumference.
     - Laid out as label: value pairs.
   - **Overall Assessment** section:
     - Score: X/100 with status.
     - Summary text paragraph.
   - **Domain Assessment Details** (4 domains):
     - Each domain: name + score + status + alert level indicator.
     - Observations list.
     - Strengths list.
     - Areas to Support list.
     - WHO Range note.
   - **Recommendations** section:
     - Numbered list of prioritized recommendations.
   - **WHO Sources** section:
     - List of referenced sources with titles and links.
   - **Disclaimer** at bottom:
     - "This report is generated by TinySteps AI for informational purposes only..."

### Components
- **Section header**: Nunito Bold 18px, bottom border 1px #e5e7eb.
- **Label-value pair**: Label (Nunito Medium 12px, secondary) above value (Nunito Regular 14px, primary).
- **Alert indicator**: On domain headers: "[!!! CONCERN]" in red or "[! WATCH]" in amber.
- **Source link**: Blue text, underlined, opens in browser.

### Data
- `GET /api/reports/:childId/:reportId` -> full report object.
- Report contains: patientInfo, overallScore, overallStatus, overallSummary, domainAssessments[], growthPercentiles[], recommendations[], whoSources[].

### User Actions
- **Scroll**: Read through report.
- **Tap Download**: Get PDF (`GET /api/reports/:childId/:id/pdf`).
- **Tap Share**: Share PDF via native share / copy link.
- **Tap source link**: Open in browser.
- **Tap domain section**: Optionally navigate to Improve Domain (screen 12) for that domain.

### States
- **Empty**: N/A (always has report data when navigated here).
- **Loading**: Skeleton report sections.
- **Error**: "Couldn't load report" + Retry + Back.

### Mobile Notes
- Report formatted for comfortable mobile reading. Sections collapsible.
- "Pin to top" button for each section to quick-scroll.

### Web Notes
- **Desktop**: Formatted like a printed document (A4 proportions, centered, max-width 800px).
- Print button triggers browser print dialog with print-optimized CSS.
- PDF download is browser download.

---

## DISCOVER & RESOURCES

---

## 22. Resources Library Screen
**Purpose**: Centralized library of all AI-generated improvement resources across all domains.
**Route/Navigation**: From Discover tab, or from Home dashboard.
**Platform**: Both

### Layout
1. **Header**: Back arrow + "Resources Library" title + search icon (right).
2. **Filter bar**:
   - Domain pills: "All" | "Motor" | "Cognitive" | "Language" | "Social" (domain-colored).
   - Type pills (below): "All" | "Activity" | "Article" | "Video" | "Tip".
3. **Resource count**: "12 resources" text, secondary, below filters.
4. **Resource cards** (vertical list):
   Each card:
   - Domain color left accent bar (4px).
   - Resource title (Nunito Bold 14px).
   - Type badge: pill with resource type.
   - Tags row: tag chips for each tag.
   - Description (13px, 2 lines, secondary).
   - Metadata row: age range + duration + difficulty.
   - Priority indicator: high priority = emerald dot.
5. **"Regenerate Resources" button** at bottom: Re-runs Gemini to generate fresh resources.

### Components
- **Resource card**: White, 16px radius, shadow, domain color left bar.
- **Type badge**: Pill, 20px radius. Activity=blue, Article=green, Video=purple, Tip=amber.
- **Tag chip**: #f3f4f6 background, 20px radius, 12px text.

### Data
- `GET /api/resources/:childId?domain=&type=` -> filtered resources + counts.
- `POST /api/resources/:childId/regenerate` -> regenerate resources.
- Response includes: resources[], counts { total, byDomain, byType }.

### User Actions
- **Tap domain filter**: Filter by domain.
- **Tap type filter**: Filter by resource type.
- **Tap resource card**: Expand for full description and materials.
- **Tap search icon**: Open search overlay to search resources by keyword.
- **Tap "Regenerate Resources"**: Confirm dialog "This will generate new personalized resources based on your latest analysis. Continue?" -> call regenerate API.
- **Pull to refresh**: Reload resources.

### States
- **Empty** (no resources): "No resources yet" + "Run an analysis to generate personalized resources" + "Analyze Now" button.
- **Empty** (filtered, no results): "No [domain] [type] resources found. Try a different filter."
- **Loading**: Skeleton resource cards.
- **Error**: "Couldn't load resources" + Retry.

### Mobile Notes
- Filters stick to top on scroll.
- Cards have domain-color animation on mount.

### Web Notes
- **Tablet+**: Resource cards in 2-column grid.
- **Desktop**: Left sidebar with filters (vertical), right: resource grid (3 columns).

---

## 23. Health Hub (Doctors) Screen
**Purpose**: Display recommended and available healthcare providers, prioritized by child's development needs.
**Route/Navigation**: From Discover tab, or from Analysis Results.
**Platform**: Both

### Layout
1. **Header**: Back arrow + "Health Hub" title + filter icon.
2. **Context banner** (if flagged domains exist):
   - Amber info card: "Based on [name]'s latest analysis, we recommend consulting specialists in [flagged domains]."
3. **"Recommended for You" section** (if recommended doctors exist):
   - Section title with star icon.
   - Doctor cards with "Recommended" badge.
   - Each card:
     - Doctor photo placeholder (48px circle, initials if no photo).
     - Name (Nunito Bold 16px) + credentials.
     - Specialty (14px, secondary).
     - Rating: star icon + "4.8" (Nunito Medium 14px).
     - Recommendation reason text (13px, emerald): "Recommended because..."
     - "View Details" button.
4. **"All Specialists" section**:
   - All other active doctors.
   - Same card format but without recommendation badge/reason.
5. **Disclaimer card** at bottom:
   - "TinySteps AI provides recommendations for informational purposes only. Always consult a licensed healthcare professional."

### Components
- **Doctor card**: White, 16px radius, shadow. Photo/initials circle left, info right.
- **Recommended badge**: Emerald pill with star icon: "Recommended".
- **Rating**: Star icon (amber) + number.

### Data
- `GET /api/doctors/recommended/:childId` -> recommended and other doctors, with flagged domains and scores.
- Response: `{ flaggedDomains, domainScores, childName, recommended[], others[] }`.
- Each doctor: `{ name, specialty, rating, domains[], isRecommended, recommendationReason }`.

### User Actions
- **Tap "View Details"**: Navigate to consultation details screen (show doctor profile with available times - future feature. For now show doctor info in expanded card).
- **Tap filter icon**: Filter by specialty or domain.
- **Pull to refresh**: Reload doctors.

### States
- **Empty** (no doctors in DB): "No healthcare providers available in your area yet. Check back soon."
- **Empty** (no analysis for recommendations): All doctors shown in "All Specialists" without recommendations. Banner: "Run an analysis to get personalized doctor recommendations."
- **Loading**: Skeleton doctor cards.
- **Error**: "Couldn't load health providers" + Retry.

### Mobile Notes
- Doctor cards have subtle entrance animation.
- Tap phone number to call (if available, future feature).

### Web Notes
- **Tablet+**: Doctor cards in 2-column grid.
- **Desktop**: Recommended section left (sidebar-style), All specialists right in grid.

---

## 24. WHO Evidence & Sources Screen
**Purpose**: Display the scientific evidence, methodology, and sources behind TinySteps AI assessments.
**Route/Navigation**: From Analysis Results "WHO guidelines" link, or from Improve Domain "See research" link.
**Platform**: Both

### Layout
1. **Header**: Back arrow + "Evidence & Sources" title.
2. **Methodology section**:
   - Section title: "Our Assessment Methodology".
   - 3 step cards (numbered):
     - Step 1: "Data Collection" — clipboard-list icon — description.
     - Step 2: "WHO Benchmark Comparison" — git-compare icon — description.
     - Step 3: "AI-Powered Analysis" — brain icon — description.
3. **Sources list**:
   - Section title: "Reference Sources".
   - Source cards, each:
     - Source title (Nunito Bold 14px).
     - Type badge: "Guideline" / "Research" / "Analysis" pill.
     - Domain badge if applicable.
     - URL link (blue, truncated).
     - Tap to open in browser.
4. **Disclaimer section**:
   - Full disclaimer text in a light gray card.
   - "This report is generated by TinySteps AI for informational purposes only..."

### Components
- **Step card**: White, 16px radius. Numbered emerald circle (32px) left. Icon (24px, emerald) top. Title bold, description regular.
- **Source card**: White, 16px radius, shadow. Title + type pill + link.
- **Disclaimer card**: #f9fafb background, 16px radius, Nunito Regular 13px, secondary color.

### Data
- `GET /api/recommendations/sources?context=[domains]&analysisId=[id]&region=[region]` -> sources, methodology, disclaimer.
- Response: `{ sources[], methodology[], disclaimer }`.

### User Actions
- **Tap source link**: Open URL in browser.
- **Tap step card**: Expand for more detail (optional).
- **Scroll**: Read through all sections.

### States
- **Empty**: N/A (methodology and disclaimer are always available, sources may be empty).
- **Loading**: Skeleton sections.
- **Error**: "Couldn't load sources" + Retry. Methodology and disclaimer still shown (hardcoded fallback).

### Mobile Notes
- Clean reading layout, generous padding.
- Links open in in-app browser.

### Web Notes
- Max-width 720px centered layout.
- Links open in new tab.

---

## PROFILE & SETTINGS

---

## 25. Profile & Settings Screen
**Purpose**: View and manage parent account settings, child profiles, and app preferences.
**Route/Navigation**: Bottom tab "Profile" (mobile) or top nav profile avatar (web).
**Platform**: Both

### Layout
1. **Profile header card**:
   - Parent avatar (64px circle, initials or photo).
   - Parent name (Nunito Bold 18px).
   - Email (14px, secondary).
   - "Edit Profile" text button.
2. **Child Profiles section**:
   - Section title: "Your Children".
   - Child cards, each:
     - Child photo/initials (48px circle) + name + age.
     - "Active" pill on currently selected child.
     - Tap to switch active child.
   - "+ Add Child" card at end -> Profile Setup (screen 5).
3. **Settings section**:
   - List items with icons:
     - "Notifications" (bell icon) -> toggle switch.
     - "Language" (globe icon) -> "English" with chevron.
     - "Theme" (palette icon) -> "Light" / "Dark" / "System" selector.
     - "API Key" (key icon) -> Gemini API key management.
     - "Data & Privacy" (shield icon) -> Data management options.
4. **About section**:
   - "About TinySteps" (info icon) -> version, licenses.
   - "Help & Support" (help-circle icon).
   - "Terms of Service" (file-text icon).
   - "Privacy Policy" (lock icon).
5. **Sign Out button**: Red text, bottom of list.
6. **App version**: "TinySteps AI v1.0.0" centered, 11px, gray, at very bottom.

### Components
- **Settings list item**: 56px height row. Icon (20px, secondary) left, label (14px) center, value/control right. Bottom divider.
- **Child card**: White, 16px radius. Photo + text + "Active" pill or "Switch" button.
- **Toggle switch**: Emerald when on, gray when off.

### Data
- `GET /api/auth/me` -> user profile + preferences.
- `GET /api/children` -> child profiles.
- `PUT /api/auth/preferences` -> update preferences (notifications, language, theme).

### User Actions
- **Tap "Edit Profile"**: Navigate to Edit Profile (screen 26) in parent mode.
- **Tap child card**: Switch active child (update local storage selection).
- **Tap "+ Add Child"**: Navigate to Profile Setup (screen 5).
- **Tap notification toggle**: Update preference.
- **Tap Language**: Open language picker.
- **Tap Theme**: Open theme selector.
- **Tap API Key**: Navigate to API key input screen.
- **Tap Sign Out**: Confirm dialog "Are you sure you want to sign out?" -> Clear tokens, navigate to Login.
- **Tap About/Help/Terms/Privacy**: Navigate to respective screens or open URLs.

### States
- **Empty**: N/A (always has user data if authenticated).
- **Loading**: Skeleton for profile header and child list.
- **Error**: Toast for failed preference updates.

### Mobile Notes
- Scrollable list. Settings items have standard iOS/Android list item feel.
- Sign out: positioned well below fold, requires scroll.

### Web Notes
- **Tablet+**: Split layout: profile card left, settings right.
- **Desktop**: Centered card, max-width 640px.

---

## 26. Edit Profile Screen (5 tabs)
**Purpose**: Edit child profile information organized in 5 tabs matching the original setup wizard.
**Route/Navigation**: From Profile & Settings -> tap child -> "Edit" button, or from Dashboard child avatar tap.
**Platform**: Both

### Layout
1. **Header**: Back arrow + "Edit [Child Name]" title + "Save" button (right, emerald text, appears when changes made).
2. **Tab bar**: "Photo" | "Basics" | "Growth" | "Interests" | "Favorites" — scrollable tabs with emerald underline.
3. **Tab content** (switches based on selected tab):

### Tab 1 — Photo
- Large circular photo (120px) with camera overlay icon.
- "Change Photo" button below.
- "Remove Photo" text button (if photo exists).

### Tab 2 — Basics
- Same fields as Profile Setup Step 1: Name, Nickname, Date of Birth, Gender.
- All pre-filled with current values.
- Fields are editable.

### Tab 3 — Growth
- Current measurements display: Weight, Height, Head Circumference.
- "Update Measurements" button -> opens Add Measurement modal (screen 7).
- Measurement history: last 5 measurements in a mini table.
- Region selector (same as setup step 3).

### Tab 4 — Interests
- Same multi-select grid as Profile Setup Step 4.
- Pre-selected with current interests.

### Tab 5 — Favorites
- Same as Profile Setup Step 5: favorite colors + favorite characters.
- Pre-filled with current data.

### Components
- All form components match Profile Setup (screen 5) styling.
- **Tab bar**: Scrollable, emerald underline on active tab. Nunito Medium 14px.
- **Save button**: Appears in header when any change is detected. Emerald text, Nunito Bold 14px.

### Data
- `GET /api/children/:childId` -> current profile data.
- `PUT /api/children/:childId` -> save updated profile.
- `POST /api/upload/image` with `bucket=profiles` -> upload new photo.

### User Actions
- **Switch tabs**: View/edit different sections.
- **Edit any field**: Mark form as dirty, show Save button.
- **Tap Save**: Submit changes to API. On success: toast "Profile updated!" + navigate back. On error: toast with error.
- **Tap back** (unsaved changes): Confirm dialog "You have unsaved changes. Discard?"
- **Tap "Change Photo"**: Open image picker.
- **Tap "Remove Photo"**: Confirm "Remove profile photo?" -> remove.

### States
- **Empty**: N/A (always has child data).
- **Loading**: Skeleton fields while loading child data. Save button shows spinner during submission.
- **Error**: Field-level validation + toast for API errors.

### Mobile Notes
- Tab content is in a PageView, swipeable between tabs.
- Keyboard handling same as Profile Setup.

### Web Notes
- Tabs are horizontal bar, not swipeable. Click-based.
- Max-width 540px centered form.

---

## Appendix A: Shared Component Library

### Button Variants
| Variant | Style |
|---------|-------|
| Primary | Emerald-teal gradient bg, white text, 12px radius, 48px height |
| Secondary | White bg, 1px emerald border, emerald text, 12px radius, 48px height |
| Text | No bg, emerald text, 12px radius, 40px height |
| Danger | White bg, 1px #ef4444 border, red text |
| Disabled | Any variant at 50% opacity, non-interactive |

### Card Variants
| Variant | Style |
|---------|-------|
| Standard | White bg, 16px radius, shadow (0 2px 8px rgba(0,0,0,0.06)) |
| Accented | Standard + 4px left border in accent color |
| Info | #eff6ff bg, 16px radius, no shadow |
| Warning | #fefce8 bg, 16px radius, no shadow |
| Success | #f0fdf4 bg, 16px radius, no shadow |

### Input Fields
| State | Style |
|-------|-------|
| Default | White bg, 1px #e5e7eb border, 12px radius, 48px height |
| Focused | White bg, 2px #10b981 border |
| Error | White bg, 2px #ef4444 border, red error text below |
| Disabled | #f9fafb bg, 1px #e5e7eb border, 50% text opacity |

### Typography Scale
| Usage | Weight | Size |
|-------|--------|------|
| Screen title | Bold (700) | 20-24px |
| Section header | Bold (700) | 18px |
| Card title | Bold (700) | 16px |
| Body | Regular (400) | 14-16px |
| Caption | Regular (400) | 12-13px |
| Small label | Medium (500) | 11px |

### Spacing System
- Base unit: 4px
- Content padding: 16-24px
- Card padding: 16px
- Section gap: 24px
- Item gap: 12px
- Inline gap: 8px

---

## Appendix B: API Endpoint Summary

| Screen | Endpoints Used |
|--------|---------------|
| Splash | `GET /api/auth/me` |
| Login | `POST /api/auth/login` |
| Register | `POST /api/auth/register` |
| Profile Setup | `POST /api/children`, `POST /api/upload/image` |
| Home Dashboard | `GET /api/auth/me`, `GET /api/children`, `GET /api/analysis/:childId`, `GET /api/analysis/milestones/:age`, `GET /api/timeline/:childId` |
| Add Measurement | `POST /api/timeline/measurement` |
| Media Upload | `POST /api/analysis` (multipart) |
| Analysis Results | `GET /api/analysis/:childId/:id` |
| Dev Insights | `GET /api/analysis/:childId`, `GET /api/children/:childId/milestones` |
| Improve Domain | `GET /api/resources/:childId?domain=X`, `GET /api/analysis/:childId` |
| Milestones | `GET /api/analysis/milestones/:age`, `GET /api/children/:childId/milestones`, `POST/DELETE /api/children/:childId/milestones/:id` |
| Growth Charts | `GET /api/timeline/measurements/:childId`, `POST /api/analysis/growth-percentiles` |
| Timeline | `GET /api/timeline/:childId`, `POST /api/timeline` |
| Bedtime Stories | `GET /api/stories/themes`, `GET /api/stories/:childId`, `POST /api/stories` |
| Story Reader | `GET /api/stories/:childId/:id`, `PATCH /api/stories/:childId/:id/favorite` |
| Recipes | `GET /api/recommendations/recipes/:childId` |
| Recommendations | `GET /api/recommendations/products/:childId`, `GET /api/recommendations/activities/:childId`, `GET /api/recommendations/tips/:childId` |
| Pediatrician Report | `GET /api/reports/:childId`, `POST /api/reports/:childId/generate`, `GET /api/reports/:childId/:id/pdf` |
| Report Viewer | `GET /api/reports/:childId/:id` |
| Resources Library | `GET /api/resources/:childId`, `POST /api/resources/:childId/regenerate` |
| Health Hub | `GET /api/doctors/recommended/:childId` |
| WHO Evidence | `GET /api/recommendations/sources` |
| Profile & Settings | `GET /api/auth/me`, `GET /api/children`, `PUT /api/auth/preferences` |
| Edit Profile | `GET /api/children/:id`, `PUT /api/children/:id`, `POST /api/upload/image` |

---

## Appendix C: Navigation Map

```
Splash
  |-- (no token) --> Onboarding --> Profile Setup --> Home
  |-- (has token) --> Home

Home (tab: Home)
  |-- Quick Actions --> Analyze, Stories, Growth, Report
  |-- Dev Snapshot "See details" --> Analysis Results
  |-- Milestones "All milestones" --> Milestones Tracker
  |-- Tips "More tips" --> Recommendations
  |-- Timeline "View all" --> Timeline
  |-- Child avatar --> Edit Profile

Analyze (tab: center FAB / Analyze)
  |-- Media Upload --> Analysis Loading --> Analysis Results
  |-- Analysis Results --> Improve Domain, Pediatrician Report, WHO Evidence

Discover (tab: Discover)
  |-- Dev Insights, Milestones, Growth Charts, Stories, Recipes,
      Recommendations, Resources Library, Health Hub

Timeline (tab: Timeline)
  |-- Entry tap --> Analysis Results / Milestone detail / etc.
  |-- Add FAB --> Note / Photo / Measurement

Profile (tab: Profile)
  |-- Edit Profile
  |-- Add Child --> Profile Setup
  |-- Settings (inline)
  |-- Sign Out --> Login
```
