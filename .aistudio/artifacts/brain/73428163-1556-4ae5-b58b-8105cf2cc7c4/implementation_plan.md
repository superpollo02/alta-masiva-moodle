# Implementation Plan - Global Manual Search Bar

## Objective
Add a fast, responsive global search bar in the `Navbar` that indexes manual sections, troubleshooting solutions, protocol phases, and glossary terms, allowing users to instantly find and navigate to relevant content.

## Deliverables
1. **Search Index & Utility (`src/data/searchIndex.ts`):**
   - Collects searchable items from protocol data, troubleshooting errors, and glossary terms.
2. **Search Dropdown UI in Navbar (`src/components/Navbar.tsx` or `SearchModal.tsx`):**
   - Live query input with instant dropdown results grouped by category (Protocolo, Errores, Glosario).
   - Keyboard navigation and click-to-navigate functionality.
3. **Tab Switch & Highlight Integration:**
   - Automatically switches `activeTab` and scrolls/highlights the selected topic when clicked.

## Verification
- Run `compile_applet` and `lint_applet` to ensure zero compilation or type errors.
