# Contributing to VO Tools

Thank you for your interest in contributing to VO Tools! This document provides guidelines and instructions for contributing to the project.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Project Structure](#project-structure)

---

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a welcoming environment
- Report unacceptable behavior to the maintainers

---

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm package manager
- Docker (optional, for containerized development)
- Git

### Local Setup

1. **Clone the repository**
   ```bash
   git clone https://gitea.tohareprod.com/tro2789/vo-tools.git
   cd vo-tools
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   - Navigate to http://localhost:3000

### Docker Setup (Alternative)

```bash
docker-compose up -d
# Access at http://localhost:3010
```

---

## Development Workflow

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `refactor/*` - Code refactoring
- `docs/*` - Documentation updates

### Workflow

1. Create a new branch from `develop`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes
   - Write clean, readable code
   - Follow existing patterns
   - Add comments for complex logic

3. Test your changes
   ```bash
   npm run lint
   npm run build
   # npm test (when tests are added)
   ```

4. Commit your changes
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. Push to your branch
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a Pull Request
   - Provide clear description
   - Link related issues
   - Request review

---

## Code Style

### General Principles

- **Single Responsibility**: One function/component = one purpose
- **DRY**: Don't Repeat Yourself
- **KISS**: Keep It Simple, Stupid
- **Clean Code**: Self-documenting, readable code

### TypeScript

```typescript
// ✅ Good
interface UserProps {
  name: string;
  age: number;
}

function greetUser({ name, age }: UserProps): string {
  return `Hello ${name}, you are ${age} years old`;
}

// ❌ Bad
function greet(n: any, a: any) {
  return "Hello " + n + ", you are " + a;
}
```

### React Components

```typescript
// ✅ Good - Functional component with TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// ❌ Bad - Missing types, unclear naming
export default function Btn(props: any) {
  return <button onClick={props.fn}>{props.txt}</button>;
}
```

### File Naming

- Components: `PascalCase.tsx` (e.g., `ScriptCalculator.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useAutosave.ts`)
- Utilities: `camelCase.ts` (e.g., `textAnalysis.ts`)
- Types: `camelCase.ts` with descriptive suffix (e.g., `pricingTypes.ts`)

### Folder Organization

```
components/
├── feature-name/          # Group related components
│   ├── Component.tsx
│   └── SubComponent.tsx
└── SharedComponent.tsx    # Shared across features
```

---

## Testing

### Test Structure (Future)

```
__tests__/
├── unit/                 # Unit tests
│   ├── hooks/
│   ├── utils/
│   └── components/
├── integration/          # Integration tests
└── e2e/                 # End-to-end tests
```

### Writing Tests

```typescript
// Example unit test for a hook
import { renderHook } from '@testing-library/react';
import { useAutosave } from '@/hooks/useAutosave';

describe('useAutosave', () => {
  it('should save data after interval', () => {
    const mockSave = jest.fn();
    const { result } = renderHook(() => 
      useAutosave({ data: 'test' }, mockSave, 1000)
    );
    
    // Test assertions here
  });
});
```

### Running Tests (When Implemented)

```bash
npm test              # Run all tests
npm test:watch        # Watch mode
npm test:coverage     # Coverage report
```

---

## Submitting Changes

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(pricing): add per-hour pricing model
fix(comparison): resolve diff highlighting issue
docs(readme): update installation instructions
refactor(hooks): extract autosave logic
perf(analysis): optimize word count calculation
```

### Pull Request Guidelines

**PR Title:**
- Use conventional commit format
- Be clear and descriptive

**PR Description:**
- What changes were made?
- Why were these changes necessary?
- How were the changes tested?
- Any breaking changes?
- Screenshots (if UI changes)

**Checklist:**
- [ ] Code follows project style guidelines
- [ ] Tests added/updated (when applicable)
- [ ] Documentation updated (if needed)
- [ ] No console warnings or errors
- [ ] Build passes (`npm run build`)
- [ ] Linter passes (`npm run lint`)

---

## Project Structure

See [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) for detailed information about the project organization.

### Key Directories

- `app/` - Next.js App Router pages
- `components/` - React components (organized by feature)
- `hooks/` - Custom React hooks
- `utils/` - Utility functions and types
- `docs/` - Documentation
- `__tests__/` - Test files
- `public/` - Static assets

### Import Paths

Use path aliases for clean imports:

```typescript
// ✅ Good
import { useAutosave } from '@/hooks/useAutosave';
import { calculateQuote } from '@/utils/pricingTypes';

// ❌ Bad
import { useAutosave } from '../../hooks/useAutosave';
```

---

## Development Tips

### Hot Reload

The development server supports hot module replacement (HMR). Changes to components will reflect immediately without full page reload.

### Debugging

- Use React DevTools browser extension
- Use `console.log` sparingly (remove before committing)
- Use TypeScript for type safety
- Check browser console for errors

### Performance

- Use React DevTools Profiler
- Implement memoization where appropriate
- Avoid unnecessary re-renders
- Use code splitting for large components

---

## Getting Help

- **Issues**: Create an issue on Gitea
- **Discussions**: Use Gitea discussions for questions
- **Documentation**: Check [README.md](../README.md) and [docs/](.)

---

## Recognition

Contributors will be acknowledged in:
- CHANGELOG.md for significant contributions
- Project README for major features
- Release notes

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to VO Tools! 🎙️
