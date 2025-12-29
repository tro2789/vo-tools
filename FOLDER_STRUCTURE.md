# VO Tools - Folder Structure & Organization

## Current Structure Analysis

The project currently follows a clean Next.js 13+ App Router architecture with good separation of concerns. Here's the current structure and recommendations:

---

## ✅ Current Structure (Good)

```
script-calc/
├── app/                      # Next.js 13+ App Router
│   ├── favicon.ico
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page (mounts ScriptCalculator)
│
├── components/              # React components (well-organized)
│   ├── analysis/           # Analysis-related components
│   │   ├── AnalysisSidebar.tsx
│   │   └── SpeedControl.tsx
│   ├── comparison/         # Script comparison components
│   │   ├── ComparisonStats.tsx
│   │   └── DiffVisualization.tsx
│   ├── editor/             # Editor components
│   │   └── ScriptEditor.tsx
│   ├── pricing/            # Pricing & quotes
│   │   └── PricingSection.tsx
│   ├── settings/           # Settings components
│   │   └── ExpansionSettings.tsx
│   ├── AutosaveIndicator.tsx
│   ├── ScriptCalculator.tsx  # Main orchestrator
│   ├── ThemeProvider.tsx
│   ├── ThemeToggle.tsx
│   └── UnsavedChangesWarning.tsx  # ⚠️ Currently unused
│
├── hooks/                   # Custom React hooks
│   ├── useAutosave.ts
│   ├── useComparison.ts
│   ├── useDebounce.ts
│   ├── useExpansionOptions.ts
│   ├── useLocalStorage.ts
│   ├── usePricing.ts
│   └── useScriptAnalysis.ts
│
├── utils/                   # Utility functions & types
│   ├── expansionOptions.ts
│   ├── pauseDetection.ts
│   ├── pdfGenerator.ts
│   ├── pricingTypes.ts
│   ├── textAnalysis.ts
│   └── textComparison.ts
│
├── public/                  # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── eslint.config.mjs
├── next.config.mjs
├── package.json
├── package-lock.json
├── PLAN.md                  # Technical improvement roadmap
├── postcss.config.js
├── README.md               # User documentation
├── tailwind.config.ts
├── TEST_COMPARISON.md      # Feature testing notes
└── tsconfig.json
```

---

## 📋 Recommended Improvements

### 1. Create Documentation Folder

Move all documentation to a dedicated `/docs` folder:

```
docs/
├── README.md              # Main documentation (symlink to root)
├── ARCHITECTURE.md        # System architecture
├── CHANGELOG.md          # Version history
├── CONTRIBUTING.md       # Contribution guidelines
├── PLAN.md              # Technical roadmap
└── TESTING.md           # Test documentation (include TEST_COMPARISON.md content)
```

### 2. Add Tests Folder (Future)

```
__tests__/               # or /tests/
├── unit/
│   ├── hooks/
│   ├── utils/
│   └── components/
├── integration/
└── e2e/
```

### 3. Add Types Folder (Optional)

If types grow significantly:

```
types/
├── index.ts             # Re-export all types
├── components.ts        # Component prop types
├── hooks.ts            # Hook types
└── api.ts              # API types (if added)
```

### 4. Add Constants Folder (Phase 4 Improvement)

```
constants/
├── index.ts            # Re-export all constants
├── typography.ts       # Font sizes, weights
├── spacing.ts         # Padding, margin values
├── timing.ts          # WPM defaults, debounce times
└── colors.ts          # Color values (if custom)
```

### 5. Organize Unused/Deprecated Code

```
_archive/               # Archived but kept for reference
└── components/
    └── UnsavedChangesWarning.tsx
```

---

## 🎯 Best Practices Being Followed

✅ **Separation of Concerns**
- Components, hooks, and utilities are properly separated
- Each folder has a clear, single responsibility

✅ **Component Organization**
- Components are grouped by feature (`analysis/`, `comparison/`, etc.)
- Follows atomic design principles

✅ **Hook Organization**
- Custom hooks are in a dedicated folder
- Each hook has a single responsibility
- Naming convention: `use[Feature].ts`

✅ **Utility Organization**
- Pure functions separated from React code
- Type definitions co-located with utilities

✅ **Next.js App Router**
- Proper use of App Router structure
- Minimal routes (single-page app)

---

## 🔧 Additional Recommendations

### File Naming Conventions

**Current (Good):**
- Components: PascalCase (`ScriptCalculator.tsx`)
- Hooks: camelCase with `use` prefix (`useAutosave.ts`)
- Utilities: camelCase (`textAnalysis.ts`)
- Types: camelCase (`pricingTypes.ts`)

**Keep consistent:**
- ✅ Use `.tsx` for files with JSX
- ✅ Use `.ts` for pure TypeScript
- ✅ One component per file
- ✅ Named exports for utilities, default for components

### Documentation Files

**Current locations (Good):**
- `README.md` - Root level (user-facing)
- `PLAN.md` - Root level (development roadmap)
- `TEST_COMPARISON.md` - Root level (feature notes)

**Recommendation:**
- Keep `README.md` at root (GitHub standard)
- Move technical docs to `/docs` folder
- Add `CHANGELOG.md` for version tracking

### Configuration Files

**Current (Good):**
- All config files at root level
- This is standard and correct for Next.js projects

---

## 📦 Docker & Deployment

**Current structure is optimal:**
```
/
├── Dockerfile              # Build instructions
├── docker-compose.yml      # Local development
└── .dockerignore          # Build exclusions
```

---

## 🚫 Files to Remove/Archive

1. **`components/UnsavedChangesWarning.tsx`**
   - Status: Unused (removed from codebase)
   - Action: Move to `_archive/` or delete

2. **`app/pricing/page.tsx`**
   - Status: Doesn't exist (already removed)
   - Action: None needed

---

## 📊 Complexity Metrics

**Current Status:**
- Total Components: 15 (well-organized)
- Total Hooks: 7 (appropriate number)
- Total Utils: 6 (clean separation)
- Deepest Nesting: 2 levels (very good)
- Largest Component: ~270 lines (excellent after refactoring)

**Health Score: 9/10**
- Deduction for lacking tests folder structure

---

## 🎯 Priority Actions

### High Priority
1. ✅ Update `.gitignore` (COMPLETED)
2. 📁 Move or delete `UnsavedChangesWarning.tsx`
3. 📝 Create `CHANGELOG.md`

### Medium Priority
4. 📁 Create `/docs` folder and move technical docs
5. 📁 Create `__tests__/` structure
6. 📝 Add `CONTRIBUTING.md`

### Low Priority
7. 📁 Add `/constants` folder (Phase 4 of PLAN.md)
8. 📁 Add `/types` folder (if needed)
9. 📝 Create architecture documentation

---

## 🏗️ Future Growth Considerations

### If the app grows to include:

**Multiple Pages:**
```
app/
├── (marketing)/
│   ├── page.tsx
│   └── about/
└── (calculator)/
    └── page.tsx
```

**API Routes:**
```
app/
└── api/
    ├── analyze/
    └── pricing/
```

**Shared Lib:**
```
lib/
├── api/
├── db/
└── utils/
```

### Current approach is perfect for a single-page app
- No premature abstraction
- Clear organization
- Easy to navigate
- Scalable when needed

---

## ✅ Summary

**The current folder structure is excellent!**

Minor improvements needed:
1. Enhanced `.gitignore` ✅ (Done)
2. Archive/remove unused `UnsavedChangesWarning.tsx`
3. Add documentation folder structure

**No major reorganization needed** - the structure follows Next.js and React best practices perfectly.
