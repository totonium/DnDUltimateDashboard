# AGENTS.md - DnD Ultimate Dashboard

## Build Commands

### Frontend (dashboardfrontend/)
```bash
npm run dev           # Dev server (port 3000)
npm run build         # Production build (dist/)
npm run lint          # ESLint (eslint.config.js flat config)
npm run preview       # Preview production build
npm test              # Run all tests (vitest)
npm test -- --run     # Single run (CI mode)
npm test -- --reporter=verbose  # Detailed output
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
│       ├── services/      # API clients, parsers (monsterParser.jsx, srdImporter.js)
│       ├── stores/       # Zustand stores (auth, statblocks, initiative, ui)
│       ├── hooks/        # Custom hooks
│       ├── db/           # Dexie.js schema
│       └── styles/       # CSS variables, utilities
├── dashboardbackend/      # Spring Boot 3.x + JPA + PostgreSQL
│   └── src/main/java/com/totonium/
│       ├── controller/   # REST controllers (@RestController)
│       ├── service/      # Business logic (@Service, @Transactional)
│       ├── entity/       # JPA entities (UUID primary keys)
│       ├── dto/          # Records for API (StatblockDTO, etc.)
│       ├── repository/   # Spring Data JPA repos
│       ├── config/       # Security, CORS, OpenAPI config
│       └── exception/    # Custom exceptions + @RestControllerAdvice
└── styles/              # Global CSS files
```

## Code Style Guidelines

### Frontend Imports Order (React files)
```jsx
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useStore } from '../../stores/store'
import { helperFunc } from '../../services/helper'
import clsx from 'clsx'
import './Component.css'
```

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `StatblockViewer` |
| Hooks | useXxx | `useAuth` |
| Stores | useXxxStore | `useStatblockStore` |
| Services/Files | camelCase | `monsterParser.jsx`, `authService.js` |
| CSS Files | kebab-case | `statblock-viewer.css` |

### Component Pattern
```jsx
export function ComponentName({ prop1, prop2 }) {
  const { value } = useStore()
  useEffect(() => { /* effect */ }, [])
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

### Backend Patterns
- **Package**: `com.totonium` (not `com.totonium.dnddashboard`)
- **Controllers**: `@RestController`, `@RequestMapping("/api/v1/...")`, `@Tag` for OpenAPI
- **DTOs**: Java records (`public record StatblockDTO(...)`)
- **Entities**: UUID primary keys, `@Entity`, audit fields (createdAt, updatedAt)
- **Services**: `@Service`, `@Transactional`, inject with Lombok `@RequiredArgsConstructor`
- **Validation**: `@Valid` on all `@RequestBody` parameters
- **Exceptions**: Throw custom exceptions, handle in `GlobalExceptionHandler` (`@RestControllerAdvice`)
- **Error Response**: `{ "code": "NOT_FOUND", "message": "...", "requestId": "..." }`

### CSS Variables (semantic naming only)
```css
--color-primary, --color-secondary, --color-success, --color-error
--bg-primary, --bg-secondary, --bg-tertiary, --bg-card
--text-primary, --text-secondary, --text-muted
--space-1 through --space-8, --radius-*, --shadow-*, --transition-*
```

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
2. Use `.jsx` extension when returning React elements
3. Support variable substitution: `[MON]`, `[STR ATK]`, `[INT 1d8]`
4. Support markdown: `_text_` for italic (`<em>`)

## ESLint Configuration
Located in `eslint.config.js` (flat config):
- `no-unused-vars`: error (ignore `^[A-Z_]`)
- `react-hooks/rules-of-hooks`: error
- `react-hooks/exhaustive-deps`: warn
- `react-refresh/only-export-components`: warn

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
4. Test changes when possible (backend: `../mvnw test`)
5. Focus on one feature area at a time
6. Communicate planned changes before implementation
