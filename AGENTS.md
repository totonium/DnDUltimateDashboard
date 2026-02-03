# AGENTS.md - DnD Ultimate Dashboard

## Build Commands

### Frontend (dashboardfrontend/)
```bash
npm run dev           # Dev server (port 3000)
npm run build         # Production build (dist/)
npm run lint          # ESLint (src --ext js,jsx --max-warnings 0)
npm run preview       # Preview production build

# Test commands (when implemented)
npm run test              # Run all tests
npm run test -- --watch   # Watch mode
npm run coverage          # Coverage report
```

### Backend (dashboardbackend/)
```bash
cd dashboardbackend && ../mvnw spring-boot:run   # Dev server (port 8080)
../mvnw test                                    # Run all tests
../mvnw test -Dtest=ClassName                   # Run single test class
../mvnw test -Dtest=ClassName#methodName       # Run single test method
../mvnw package -DskipTests                     # Build JAR
```

## Project Structure

```
DnDUltimateDashboard/
├── dashboardfrontend/     # React 19 + Vite + Zustand + TanStack Router
│   └── src/
│       ├── components/    # Feature components (layout/, statblocks/, initiative/, audio/)
│       ├── services/      # Parsers, API clients (monsterParser.jsx, srdImporter.js)
│       ├── stores/       # Zustand stores (auth, statblocks, initiative, ui)
│       ├── hooks/        # Custom hooks
│       ├── db/            # Dexie.js schema
│       └── styles/        # CSS variables, utilities
├── dashboardbackend/      # Spring Boot 3.x + JPA + PostgreSQL
└── styles/              # Global CSS files
```

## Code Style Guidelines

### Imports Order (React files)
```jsx
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useStore } from '../../stores/store'
import { helperFunc } from '../../services/helper'
import './Component.css'
```

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `StatblockViewer` |
| Hooks | useXxx | `useAuth` |
| Stores | useXxxStore | `useStatblockStore` |
| Services/Files | camelCase or PascalCase | `monsterParser.jsx`, `authService.js` |
| CSS Files | kebab-case | `statblock-viewer.css` |

### Component Pattern
```jsx
export function ComponentName({ prop1, prop2 }) {
  const { value } = useStore()
  return <div>{value}</div>
}
export default ComponentName
```

### State Management (Zustand)
```javascript
export const useStore = create(
  persist((set, get) => ({
    items: [],
    addItem: async (item) => {
      const newItem = { id: uuidv4(), ...item }
      await db.items.add(newItem)
      set({ items: [...get().items, newItem] })
    }
  }), { name: 'storage-key' })
)
```

### CSS Variables (semantic naming only)
```css
--color-primary, --color-secondary, --color-success, --color-error
--bg-primary, --bg-secondary, --bg-tertiary, --bg-card
--text-primary, --text-secondary, --text-muted
--space-1 through --space-8
--radius-*, --shadow-*, --transition-*
```

### Backend Patterns
- **DTOs**: Use Java records (`public record XyzDTO(...)`)
- **Entities**: Use UUID primary keys (no auto-increment Long)
- **Validation**: `@Valid` on all `@RequestBody` parameters
- **Exceptions**: Custom exceptions with `@RestControllerAdvice`

## Development Guidelines

### Frontend
1. Use functional components with hooks
2. State management via Zustand only
3. CSS Modules with semantic variables
4. JSX files use `.jsx` extension
5. PWA-first - work offline
6. Mobile responsive design

### Backend
1. UUID primary keys on all entities
2. Record-based DTOs (immutable)
3. Service layer with `@Transactional`
4. OpenAPI docs with `@Tag` annotations

### Database
1. Offline-first with IndexedDB (Dexie.js)
2. Audit fields: createdAt, updatedAt
3. No hard deletes - use soft deletes

## Key Constraints

- **NO DICE ROLLING** - Never implement random number generation
- **NO REAL-TIME COLLABORATION** - Single-user only
- **NO PLAYER COMBAT TOOLS** - DM-focused only
- **NO EXTERNAL CDN LINKS** - All dependencies via npm/maven
- **ALWAYS OFFLINE FIRST** - All features work without internet
- **NO TAILWIND CSS** - Use utility classes from styles/

## Parser Conventions

When adding file parsers (like monsterParser.jsx):
1. Export parsing functions: `parseTetraCubeText`, `parseTextToElements`
2. Use JSX extension when returning React elements
3. Support variable substitution: `[MON]`, `[STR ATK]`, `[INT 1d8]`
4. Support markdown: `_text_` for italic (`<em>`)

## API Conventions
- Base URL: `/api/v1/{resource}`
- JWT auth: `Authorization: Bearer <token>`
- Error format: `{ "code": "ERROR_CODE", "message": "..." }`

## ESLint Configuration
```javascript
{
  'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',
  'react-refresh/only-export-components': 'warn'
}
```

## Commit Message Format
```
feat: add initiative tracker
fix: resolve combatant sorting issue
docs: update API documentation
refactor: extract modal component
test: add combatant service tests
chore: update dependencies
```

## Agent Instructions

For coding agents operating in this repository:
1. Analyze codebase structure before making changes
2. Follow existing patterns and naming conventions
3. Run `npm run lint` before committing
4. Test changes when possible
5. Focus on one feature area at a time
6. Communicate planned changes before implementation
