# Graph Report - .  (2026-07-17)

## Corpus Check
- 85 files · ~56,421 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 160 nodes · 92 edges · 72 communities (7 shown, 65 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- AI & Dependencies
- ESLint & Dev Config
- TypeScript Config
- Next.js Type References
- Project Docs & Assets
- Package Manifest
- DOM & ESNext Libs
- File Icon Asset
- Globe Icon Asset
- Window Icon Asset
- Check Username Action
- Claim Trial Data Action
- Delete Account Action
- Global Command Action
- Authenticated Routine Generation
- Catch-Up Routine Generation
- Trial Routine Generation
- Save Catch-Up Action
- Save Metric Action
- Save Routine Block Action
- Save Task Action
- Profile Setup Action
- Save Routine Action
- Create Journal Log
- Create Metric
- Create Task
- Delete Task
- Toggle Task Status
- Update Journal Log
- Update Metric Value
- Update Task Details
- Journal Editor Component
- Edit Journal Page
- New Journal Page
- Journal List Page
- App Layout
- Root Layout
- Global Loading State
- Landing Page
- App Template
- Routine Block Component
- Routine Block Source
- Button UI Component
- Chunky Date Picker
- Chunky Dropdown
- Create Metric Inline
- Create Task Inline
- Input UI Component
- Speech Recognition Hook
- AI Routine Generator
- Routine Generator Options
- App Error Class
- App Error Types
- Supabase Browser Client
- Database Composite Types
- Database Schema Type
- Database Enums
- Database JSON Type
- Database Tables
- Database Insert Types
- Database Update Types
- Supabase Middleware Session
- Supabase Server Client
- Utility Functions (cn)
- API Proxy
- Types Composite Types
- Types Database Schema
- Types Enums
- Types JSON
- Types Tables
- Types Insert Types
- Types Update Types

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `include` - 7 edges
3. `Questine Next.js Project` - 6 edges
4. `scripts` - 5 edges
5. `lib` - 4 edges
6. `@ai-sdk/google` - 2 edges
7. `@supabase/ssr` - 2 edges
8. `@supabase/supabase-js` - 2 edges
9. `ai` - 2 edges
10. `canvas-confetti` - 2 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Logo (SVG)` --conceptually_related_to--> `Questine Next.js Project`  [INFERRED]
  public/next.svg → README.md
- `App Icon (PNG)` --conceptually_related_to--> `Questine Next.js Project`  [INFERRED]
  src/app/icon.png → README.md
- `Vercel Logo (SVG)` --conceptually_related_to--> `Vercel Deployment`  [INFERRED]
  public/vercel.svg → README.md
- `Next.js Agent Rules` --conceptually_related_to--> `Questine Next.js Project`  [INFERRED]
  AGENTS.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Next.js Project Public Assets** — public_file_svg, public_globe_svg, public_next_svg, public_vercel_svg, public_window_svg [INFERRED 0.85]

## Communities (72 total, 65 thin omitted)

### Community 0 - "AI & Dependencies"
Cohesion: 0.07
Nodes (29): ai, @ai-sdk/google, canvas-confetti, clsx, framer-motion, lucide-react, next, dependencies (+21 more)

### Community 1 - "ESLint & Dev Config"
Cohesion: 0.11
Nodes (19): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/canvas-confetti (+11 more)

### Community 2 - "TypeScript Config"
Cohesion: 0.13
Nodes (15): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, module, moduleResolution (+7 more)

### Community 3 - "Next.js Type References"
Cohesion: 0.20
Nodes (9): **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude (+1 more)

### Community 4 - "Project Docs & Assets"
Cohesion: 0.22
Nodes (9): Next.js Breaking Changes Convention, Next.js Agent Rules, Next.js Logo (SVG), Vercel Logo (SVG), Development Server, Geist Font (next/font), Questine Next.js Project, Vercel Deployment (+1 more)

### Community 5 - "Package Manifest"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 6 - "DOM & ESNext Libs"
Cohesion: 0.50
Nodes (4): dom, dom.iterable, esnext, lib

## Knowledge Gaps
- **124 isolated node(s):** `name`, `version`, `private`, `dev`, `build` (+119 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **65 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `AI & Dependencies` to `Package Manifest`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `ESLint & Dev Config` to `Package Manifest`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `compilerOptions` connect `TypeScript Config` to `Next.js Type References`, `DOM & ESNext Libs`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Questine Next.js Project` (e.g. with `Next.js Agent Rules` and `Next.js Logo (SVG)`) actually correct?**
  _`Questine Next.js Project` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _124 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AI & Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `ESLint & Dev Config` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._