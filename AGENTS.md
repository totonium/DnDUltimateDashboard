# AGENTS.md - DnD Ultimate Dashboard

## Build Commands

### Frontend (dashboardfrontend/)
```bash
npm run dev           # Dev server (port 3000)
npm run build         # Production build (dist/)
npm run lint          # ESLint (src --ext js,jsx --max-warnings 0)
npm run preview       # Preview production build
```

### Backend (dashboardbackend/)
```bash
cd dashboardbackend && ../mvnw spring-boot:run   # Dev server (port 8080)
../mvnw test                                      # Run all tests
../mvnw test -Dtest=ClassName                     # Run single test class
../mvnw test -Dtest=ClassName#methodName          # Run single test method
../mvnw package -DskipTests                       # Build JAR
```

## Project Structure

```
DnDUltimateDashboard/
├── dashboardfrontend/     # React 19 + Vite + Zustand + TanStack Router
│   └── src/
│       ├── components/    # Feature components (layout/, initiative/, etc.)
│       ├── services/      # api.js, authService.js
│       ├── stores/        # Zustand stores
│       ├── hooks/         # Custom hooks
│       ├── db/            # Dexie.js schema
│       └── styles/        # CSS modules (variables.css, utilities.css, etc.)
├── dashboardbackend/      # Spring Boot 3.x + JPA + PostgreSQL
│   └── src/main/java/com/totonium/
│       ├── controller/    # REST endpoints
│       ├── service/       # Business logic
│       ├── repository/    # JPA repositories
│       ├── entity/        # JPA entities
│       ├── dto/           # Request/Response records
│       ├── config/        # Security, CORS
│       └── exception/     # Custom exceptions
└── styles/                # Global CSS files
```

## Frontend Code Style

### Imports Order
React → external libs → internal modules → CSS
```jsx
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import clsx from 'clsx'
import { Sword } from 'lucide-react'
import { useStore } from '../../stores/store'
import './Component.css'
```

### Components
```jsx
export function ComponentName({ prop1, prop2 }) {
  const { value } = useStore()
  return <div>{value}</div>
}
export default ComponentName
```

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `InitiativeTracker` |
| Hooks | useXxx | `useAuth` |
| Stores | useXxxStore | `useInitiativeStore` |
| Services | camelCase + Service | `authService` |
| Files | kebab-case | `initiative-tracker.css` |

### State (Zustand)
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
/* Colors */
--color-primary, --color-secondary, --color-success, --color-error
/* Backgrounds */
--bg-primary, --bg-secondary, --bg-tertiary, --bg-card
/* Text */
--text-primary, --text-secondary, --text-muted
/* Spacing */
--space-1 through --space-8
/* Other */
--radius-*, --shadow-*, --transition-*, --font-*
```

### Use utility classes from styles/
```jsx
<div className="flex flex-col items-center gap-4 p-4">  // utility classes available
```

## Backend Code Style

### Package Structure
```
com.totonium/
├── controller/  # REST endpoints (@RestController)
├── service/     # Business logic (@Service, @Transactional)
├── repository/  # JPA data access (JpaRepository)
├── entity/      # JPA entities (@Entity)
├── dto/         # Request/Response records
├── config/      # Security, CORS
├── exception/   # Custom exceptions + @RestControllerAdvice
└── security/    # JWT, Auth
```

### REST Controller
```java
@RestController
@RequestMapping("/api/v1/combatants")
@RequiredArgsConstructor
@Tag(name = "Combatants", description = "Combatant management API")
public class CombatantController {
    private final CombatantService service;

    @GetMapping
    public ResponseEntity<List<CombatantDTO>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CombatantDTO create(@Valid @RequestBody CreateCombatantRequest dto) {
        return service.create(dto);
    }
}
```

### DTO Pattern
```java
public record CreateCombatantRequest(
    String name, Integer initiative, Integer currentHp,
    Integer maxHp, UUID encounterId
) {}

public record CombatantDTO(
    UUID id, String name, Integer initiative,
    Integer currentHp, Integer maxHp
) {}
```

### Error Handling
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("NOT_FOUND", ex.getMessage()));
    }
}
```

## Key Constraints

- **NO DICE ROLLING** - Never implement random number generation
- **NO REAL-TIME COLLABORATION** - Single-user only
- **NO EXTERNAL CDN LINKS** - All dependencies via npm/maven
- **NO PLAYER COMBAT TOOLS** - DM-focused only
- **NO TAILWIND CSS** - Use utility classes from src/styles/utilities.css

## API Conventions

- Base URL: `/api/v1/{resource}`
- All endpoints require JWT in `Authorization: Bearer <token>` header
- Error responses: `{ "code": "ERROR_CODE", "message": "..." }`

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Zustand, TanStack Router, Dexie.js |
| Backend | Spring Boot 3.4.x, JPA, PostgreSQL, Java 21 |
| Auth | JWT + Spring Security |
| API | REST + Axios |
| PWA | Vite PWA plugin |
