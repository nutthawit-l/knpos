# Centralized Theming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement centralized design tokens using Tailwind v4's `@theme` directive and refactor all hardcoded hex styles to use semantic utility classes.

**Architecture:** We will define CSS variables in `src/index.css` via `@theme`. We will then use a targeted Node.js script to refactor all hardcoded `.tsx` files systematically, ensuring no regressions.

**Tech Stack:** React, Tailwind CSS v4, Vite, Node.js.

---

### Task 1: Define Design Tokens in `src/index.css`

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Replace contents of `src/index.css`**

Replace the current `src/index.css` content with the new centralized theme definition.

```css
@import "tailwindcss";

@theme {
  /* Brand Colors */
  --color-primary: #f47b20;
  --color-primary-light: #fef3e8;

  /* Surfaces & Backgrounds */
  --color-background: #ffffff;
  --color-surface: #f9fafb;

  /* Text & Foreground */
  --color-foreground: #1c1c1e;
  --color-foreground-muted: #374151;
  --color-foreground-subtle: #9ca3af;

  /* Borders & Dividers */
  --color-border: #f3f4f6;

  /* Semantic UI */
  --color-destructive: #ef4444;
}
```

- [ ] **Step 2: Commit the theme definition**

```bash
git add src/index.css
git commit -m "chore: setup centralized design tokens in index.css"
```

### Task 2: Create and Execute Refactoring Script

Since there are numerous arbitrary hex values scattered across many components, we will use a Node.js script to perform the exact mappings defined in the spec.

**Files:**
- Create: `scripts/refactor-theme.js`
- Modify: All `.tsx` files in `src/`

- [ ] **Step 1: Create the refactoring script**

Create `scripts/refactor-theme.js` with the following content:

```javascript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '../src');

const replacements = [
  // Primary
  { from: /text-\[#f47b20\]/g, to: 'text-primary' },
  { from: /bg-\[#f47b20\]/g, to: 'bg-primary' },
  { from: /border-\[#f47b20\]/g, to: 'border-primary' },
  { from: /focus:ring-\[#f47b20\]/g, to: 'focus:ring-primary' },
  { from: /focus:border-\[#f47b20\]/g, to: 'focus:border-primary' },
  { from: /fill='#f47b20'/g, to: "fill='var(--color-primary)'" },
  // Primary Light
  { from: /text-\[#fef3e8\]/g, to: 'text-primary-light' },
  { from: /bg-\[#fef3e8\]/g, to: 'bg-primary-light' },
  // Text Foreground
  { from: /text-\[#1c1c1e\]/g, to: 'text-foreground' },
  { from: /text-\[#374151\]/g, to: 'text-foreground-muted' },
  { from: /text-\[#9ca3af\]/g, to: 'text-foreground-subtle' },
  { from: /fill='#9ca3af'/g, to: "fill='var(--color-foreground-subtle)'" },
  // Borders & Dividers
  { from: /border-\[#f3f4f6\]/g, to: 'border-border' },
  { from: /bg-\[#f3f4f6\]/g, to: 'bg-border' },
  // Destructive
  { from: /text-\[#ef4444\]/g, to: 'text-destructive' },
  // Surfaces
  { from: /hover:bg-gray-50/g, to: 'hover:bg-surface' },
  { from: /bg-gray-50/g, to: 'bg-surface' }
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content;
      for (const r of replacements) {
        newContent = newContent.replace(r.from, r.to);
      }
      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(srcDir);
```

- [ ] **Step 2: Execute the script**

```bash
node scripts/refactor-theme.js
```
Expected output: A list of updated `.tsx` files in the terminal.

- [ ] **Step 3: Verify the application runs**

Start the dev server momentarily to ensure the build compiles successfully without any syntax errors.
```bash
# Run this in background or run and immediately cancel to verify it compiles
npx tsc --noEmit && pnpm build
```
Expected: successful compilation.

- [ ] **Step 4: Commit the refactored files and remove script**

```bash
rm scripts/refactor-theme.js
git add src/
git commit -m "refactor: apply semantic theme tokens across components"
```
