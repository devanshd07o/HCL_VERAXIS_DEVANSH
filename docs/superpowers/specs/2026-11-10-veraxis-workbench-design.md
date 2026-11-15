# VERAXIS — Asymmetric Split Research Workbench Design Specification

**Date:** 2026-11-10  
**Architecture Approach:** Approach A — Asymmetric Split Research Workbench (Editorial Scientific Instrument, Website-Only)  
**Palette:** Strict 5-Color System (`#2C2B30`, `#4F4F51`, `#D6D6D6`, `#F2C4CE`, `#F58F7C`)

---

## 1. Visual Identity & Anti-AI-Slop Guarantees
- **Rejected Legacy Look Purged:** Removed cartoon agent SVG (`Stage.jsx`), 4 static/generic suggestion pills (`DirectiveRow.jsx`), stock AI hero slogans, boxed `"VERAXIS Dossier"` wrapper around casual greetings (`hello`), and PWA/app framing.
- **Website-Only Flow:** Clean top split-pill website navigation + asymmetric desktop workspace rail (`lg:`) collapsing cleanly to a slide-over drawer (`<1024px`) + live publication reading & evidence inspector stage.
- **Real Telemetry Only:** No synthetic metrics. Active reasoning count (`X/5`) and model ID come directly from `GET /api/status`. Academic sources appear only from live `/api/chat` discovery.

---

## 2. Exact `D:\LetsCode\UI_COMPONENTS` Component Inventory

| Target Role | Exact Registry Component Source |
| :--- | :--- |
| CSS Class Utility (`cn`) | `D:\LetsCode\UI_COMPONENTS\kokonutui\lib\utils.ts` |
| Auto-Resize Hook | `D:\LetsCode\UI_COMPONENTS\kokonutui\hooks\use-auto-resize-textarea.ts` |
| UI Base Primitives (`button`, `textarea`, `dropdown-menu`, `badge`, `bubble`, `message`, `message-scroller`) | `D:\LetsCode\UI_COMPONENTS\kokonutui\components\ui\` + `D:\LetsCode\UI_COMPONENTS\shadcn-ui\apps\v4\registry\new-york-v4\ui\` + `shadcn-ui\packages\react\src\message-scroller\` |
| Top Split-Pill Website Navigation | `D:\LetsCode\UI_COMPONENTS\kokonutui\components\kokonutui\morphic-navbar.tsx` (React SPA nav adapter) |
| Live Engine Telemetry Pill | `D:\LetsCode\UI_COMPONENTS\kokonutui\components\kokonutui\status-island.tsx` |
| Animated Theme Switcher | `D:\LetsCode\UI_COMPONENTS\kokonutui\components\kokonutui\switch-button.tsx` (`data-theme` synced) |
| Canvas Architectural Backdrop | `D:\LetsCode\UI_COMPONENTS\magicui\apps\www\registry\magicui\dot-pattern.tsx` |
| Main AI Prompt Console + Slash Menu + Mode Effort Control | `D:\LetsCode\UI_COMPONENTS\kokonutui\components\kokonutui\ai-prompt.tsx` + `D:\LetsCode\UI_COMPONENTS\magicui\apps\www\registry\magicui\border-beam.tsx` |
| Primary Space Capsule Action CTA | `D:\LetsCode\UI_COMPONENTS\uiverse-galaxy\Buttons\StealthWorm_spotty-horse-48.html` |
| Voice Equalizer Dictation Module | `D:\LetsCode\UI_COMPONENTS\kokonutui\components\kokonutui\ai-voice.tsx` (wired to Web Speech API) |
| Research Priority Toggle Switch | `D:\LetsCode\UI_COMPONENTS\uiverse-galaxy\Toggle-switches\Galahhad_happy-warthog-87.html` |
| Keyboard Shortcut Keycap Button (`New Research`) | `D:\LetsCode\UI_COMPONENTS\kokonutui\components\kokonutui\command-button.tsx` |
| Async Particle Action Button (`Copy`, `Add Key`) | `D:\LetsCode\UI_COMPONENTS\kokonutui\components\kokonutui\particle-button.tsx` |
| PDF Download Animated Tray Button | `D:\LetsCode\UI_COMPONENTS\uiverse-galaxy\Buttons\G4b413l_slippery-owl-85.html` |
| Multi-Agent Execution Log Loader | `D:\LetsCode\UI_COMPONENTS\kokonutui\components\kokonutui\ai-loading.tsx` (fed by `/api/thinking-steps`) |
| 3-Agent Pipeline Execution Timeline | `D:\LetsCode\UI_COMPONENTS\kokonutui\components\kokonutui\ai-agent-lanes.tsx` |
| Inline Academic Citations + Hover Snippets | `D:\LetsCode\UI_COMPONENTS\kokonutui\components\kokonutui\ai-citations.tsx` |
| Long-Report Sticky Section Index | `D:\LetsCode\UI_COMPONENTS\kokonutui\components\kokonutui\scroll-index.tsx` |
| Spotlight Source / Key Vault Cards | `D:\LetsCode\UI_COMPONENTS\magicui\apps\www\registry\magicui\magic-card.tsx` |
| Search & Key Recessed Inputs | `D:\LetsCode\UI_COMPONENTS\uiverse-galaxy\Inputs\1osm_pretty-frog-15.html` / `0xnihilism_silly-quail-9.html` |
| Radio Selectors (Width, Typeface, Scale) | `D:\LetsCode\UI_COMPONENTS\uiverse-galaxy\Radio-buttons\3bdel3ziz-T_gentle-vampirebat-46.html` |
| Delete / Close Micro Buttons | `D:\LetsCode\UI_COMPONENTS\uiverse-galaxy\Buttons\2Fl00rian6_empty-dolphin-52.html` |

---

## 3. Noted Non-Library Structural Placeholders
Components not present inside `D:\LetsCode\UI_COMPONENTS` and implemented cleanly as minimal structural glue only:
1. **Root Split-Workbench Responsive Grid Shell**: Outer responsive layout shell combining left Archive workspace rail (`drawer` on mobile `<1024px`), center Main Editorial Stage, and right Evidence Inspector drawer/pane for Deep Research.
2. **Markdown + KaTeX Publication Renderer**: Safe AST-protected `marked` + `katex` compiler with live non-jarring reveal inside the Report canvas.
3. **Web Speech API Audio Bridge**: Connects native browser `SpeechRecognition` transcripts into `AI_Voice` waveform visualization & prompt value.
4. **SPA Route & Theme Adapters**: Replaces `next/link` / `next/navigation` in `morphic-navbar.tsx` and `next-themes` in `magic-card.tsx` with local React state & `data-theme`.
