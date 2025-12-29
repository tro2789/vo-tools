# Changelog

All notable changes to VO Tools will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Auto-save functionality (saves every 30 seconds)
- localStorage persistence for all user data
- Session recovery on page refresh
- Save status indicator in navbar
- Reset button to clear all data
- Component architecture refactoring
- Performance optimizations (debouncing, code splitting)
- Comprehensive documentation (CHANGELOG.md, FOLDER_STRUCTURE.md, PLAN.md, TEST_COMPARISON.md)
- CONTRIBUTING.md with development guidelines and code style standards
- `/docs` folder for organized documentation
- `/__tests__` folder structure for future testing implementation
- `/_archive` folder for deprecated code

### Changed
- Refactored monolithic ScriptCalculator (1100+ lines → 270 lines)
- Extracted 8 focused components from main component
- Created 7 custom hooks for business logic
- Improved .gitignore with comprehensive exclusions (IDE, OS, testing frameworks)
- Enhanced folder structure organization following best practices
- Moved all documentation to `/docs` folder
- Updated README.md with documentation section linking to `/docs`
- Renamed Docker container and image from "script-timer" to "vo-tools"

### Removed
- Unsaved changes warning popup (conflicted with reset functionality)
- Code duplication in pricing UI
- Unused imports and dependencies

### Performance
- Implemented 300ms debouncing on text inputs
- Added code splitting for comparison components
- Enhanced memoization for expensive calculations
- Reduced initial bundle size via lazy loading

---

## [1.0.0] - Initial Release

### Added
- Single script word count and reading time calculation
- Adjustable WPM (75-160) with slider control
- Intelligent text expansion:
  - Numbers to spoken words
  - Currency formatting
  - Decimals, percentages, ordinals
  - Measurements
- Script comparison mode with side-by-side diff
- Diff highlighting (additions, deletions, modifications)
- Pause detection and timing
- Multiple pricing models (per word, per minute, per project)
- Professional PDF quote generation
- Dark/light theme toggle
- Responsive design (mobile, tablet, desktop)
- Docker deployment support

### Features
- **Analysis**: Word count, reading time, pause analysis
- **Comparison**: Original vs revised script diff visualization
- **Pricing**: Configurable rates, minimum fees, revision pricing
- **Export**: PDF quote generation with client/project info
- **UI**: Modern, clean interface with Tailwind CSS
- **Performance**: Fast, optimized Next.js 16 with Turbopack

### Technical Stack
- Next.js 16.1.0 (App Router + Turbopack)
- React 19
- TypeScript
- Tailwind CSS
- jsPDF for PDF generation
- Docker for deployment

---

## Version History

- **v1.0.0** - Initial public release
- **v1.1.0** (Unreleased) - Phase 1-3 improvements (refactoring, performance, persistence)

---

## Future Versions

See [PLAN.md](./PLAN.md) for upcoming features and improvements:

- **v1.2.0** - Code quality improvements (input validation, error boundaries)
- **v1.3.0** - Testing infrastructure (unit, integration, E2E tests)
- **v1.4.0** - UX enhancements (keyboard shortcuts, export options)
- **v2.0.0** - Accessibility improvements, developer tools

---

## Links

- [Repository](https://gitea.tohareprod.com/tro2789/vo-tools)
- [Live Demo](https://script.tohareprod.com)
- [Documentation](./README.md)
- [Roadmap](./PLAN.md)
