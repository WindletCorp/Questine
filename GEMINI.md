You are building Questine, an ultimate AI-powered time management app i.e Routine builder
- Don't be shy, ask me questions when you need to.
- Don't use placeholder values. If you don't have the information, ask me.

## Use Universal Trackers
1. Create a tracker files (format: trackers/tracker_yourconversationtitle.md) for this project to track your progress.
2. Everytime you make a chnage to the project, update the `trackers/tracker_yourconversationtitle.md` file.
3. Use the universal tracker, trackers/tracker.md to track overall progress. So everytime an app screen is built, add it to the universal tracker. This is mandatory.

## Project Structure
- Backend: Supabase
- Frontend: Next (TypeScript) with tailwind CSS
- Database: Supabase
- Deployment: Vercel (standard SSR/hybrid mode — NOT static export. The app requires server-side BYOK key decryption, which static export cannot support.)

## Design System (mandatory for ALL screens — apply consistently, don't ask per-screen)
**Visual mood:** Duolingo-style — energetic, rounded, high-contrast, chunky tappable cards/buttons with a "pressed" shadow effect on buttons. NOT a flat/neutral SaaS look.

**Do NOT use shadcn/ui defaults for core app screens** (Home, Routine, Catch-Up, Compare, History, Onboarding, **Auth/Login/Signup**). Shadcn's flat, muted, neutral style conflicts with the required Duolingo-style energetic look. Shadcn is acceptable ONLY for plain settings-style screens (e.g. BYOK settings, Profile) if it speeds development — confirm with the developer before using it even there.

**Color tokens (use as Tailwind theme vars, not hardcoded hex per-component):**
- Primary (growth/progress): `#7EC8E3` (pastel blue)
- Accent/CTA (streaks, primary buttons): `#F4A8C0` (pastel pink)
- Background: `#FFFBF5` (cream)
- Text: `#2B2B2B` (near-black, not pure black)
- Error/diverged state: `#E5484D` (soft red)

**Mode:** Light mode is primary and default. Dark mode is a Post-MVP feature — do not build it now, but don't make light-mode-only assumptions that would block adding it later (e.g. don't hardcode white where a theme var should go).

**Layout pattern:** Google Calendar day-view style — a proportional time-axis grid where blocks are sized/positioned by actual duration (not a flat card list). This is for FUNCTIONALITY (duration is visually obvious, easy to scan a full day) — the Duolingo feel comes from STYLING applied on top (rounded block corners, bold colors per block/category, chunky shadows, playful icons), not from changing the underlying layout structure. Do not flatten this into a simple vertical card stack — duration-proportional blocks are a requirement.

**Auth pages:** `/auth/login` and `/auth/signup` must ALSO follow the full Duolingo-style design system (rounded chunky inputs/buttons, bold color blocks, playful tone) — do not treat auth as a "plain utility screen." This is one of the first things a user sees; it should feel as on-brand as the rest of the app, not like a generic form.

**Navigation:** Bottom tab bar with exactly 4 items: **Home, Routine, History, Profile**. Quests (alpha2) fold into the Routine tab — do not add a 5th tab for them.

**Smart Animation** All transitions to different pages must be animated. 
**Page Layouts** Content should be stuck in the center, Use the whole screen real-estate well and make responsive pages (mobile, desktop)
**Notifications:** Toast/sonner style, positioned bottom of screen, with a CTA button when actionable (e.g. "Log your Catch-Up" → button → navigates to `/catchup`). Do not use top-banner or blocking modal patterns for nudges.

## Git usage
Make sure you are on a branch which correlates to your task.
Solo developer project — trunk-based workflow: one feature branch per phase/task, merge directly to `main` when done, then delete the branch. No `dev` branch. No PRs (no second reviewer exists).

## Write sustainable code
Always write code that has proper Error Messages, Error notifications must have a proper CTA (if possible).
Error/notification toasts must also follow the Design System above (bottom-positioned, CTA-equipped) for consistency — don't use a different notification style for errors vs general nudges.

## Naming Conventions
- Variable and Function Names: camelCase
- Classes and Constructors: PascalCase
- Global Constraints: UPPER_SNAKE_CASE
- Database Fields: snake_case
- Database Tables: plural snake_case
- Follow all typescript, next.js and supabase naming conventions standards too.

## Scope Discipline
- Features explicitly marked "deferred" or "out of scope" for the current phase are deferred, not cancelled — do not silently drop them; flag them in the relevant tracker file so they aren't forgotten (e.g. OAuth, password reset, and email confirmation are deferred from the Auth phase for MVP speed, but are REQUIRED before any public launch).