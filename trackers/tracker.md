# Questine - Universal Tracker

This tracker documents the high-level progress of the Questine routine builder application.

## Overall Progress
- [x] Phase 0: Project Setup
- [x] Phase 1: Backend & Database setup (Supabase)
- [x] Phase 2: Core Frontend Architecture
- [x] Phase 3: Onboarding
- [x] Phase 4: Home Generation (Date navigation)
- [] Allow Color personalizations on routine blocks. & fix stepper moving up and down problem. 
- [x] Phase 5: "Actual Truth" OS Redesign (Continuous Timeline, Journal-to-Tasks/Metrics, Plan vs Actual Overlay)

## Features & Screens Built
- `/auth/login` (Login screen)
- `/auth/signup` (Signup screen with trial data claim)
- `/` (Landing page)
- `/onboarding` (Try-Before-Signup flow)
- `/home` (Home tab with date selection & past/future routines)
- `/generate` (Dedicated interactive AI routine generation page)
- `MumbleBar` (Core component: Voice/Text input)
- `RoutineViewer` (Core component: Calendar day view)
- `RoutineViewerWithToggle` (Core component: Overlay Plan/Actual toggle)
- `DateSelector` (Core component: Chunk week view for date navigation)
- `/catchup` (Catch-up screen for logging actual routines vs plan)
