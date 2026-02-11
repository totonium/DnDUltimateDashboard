# DnD Ultimate Dashboard - Implementation Plan

**Last Updated:** 2026-01-18
**Version:** 4.0 (Custom Backend Edition)

## Current Implementation Status

### Phase 1 - Foundation (In Progress)

| Component | Status | Notes |
| --------- | ------ | ----- |
| Project Setup | ✅ Complete | Vite + React 19, dependencies installed |
| Vite PWA Config | ✅ Complete | Manifest, service workers, offline caching |
| Dexie.js Database | ✅ Complete | Schema for all modules |
| Zustand Stores | ✅ Complete | Auth, Initiative, Audio, Statblocks, UI |
| Layout Components | ✅ Complete | Sidebar, Header, main Layout |
| TanStack Router | ✅ Complete | DM and Player mode routes |
| Base Styles | ✅ Complete | styles.css with component classes |

### Next Steps (Phase 1 Continued)

- [X] Test dev server
- [X] Create backend API template
- [X] Create .env.example file
- [X] Add environment type declarations
- [X] Set up Spring Boot project

### Phase 2 - Initiative Tracker (Upcoming)

- [x] Combatant management
- [x] Turn tracking with ability reminders
- [x] HP/status effect tracking

### Phase 3 - Statblock Library (Upcoming)

- [x] Tetra Cube import
- [ ] SRD bulk import
- [x] Full statblock viewer

### Phase 4 - Music & SFX (Upcoming)

- [ ] Audio player with playlists
- [ ] SFX triggers
- [ ] Volume controls

### Phase 5 - Backend integration (Upcoming)

- [ ] API
- [ ] Configure PostgreSQL database
- [ ] frontend connection

### Phase 6 - Obsidian Reader (Upcoming)

- [ ] Vault folder selection
- [ ] Markdown rendering
- [ ] File navigation

### Phase 7 - Player Mode (Future)

- Character sheet view
- Spell browser with hover tooltips

### Phase 8 - AI DM Assistant (Future)

- Spring AI integration
- OpenAI/Anthropic API gateway
- Context-aware NPC conversations

---

## Executive Summary

This document outlines a comprehensive implementation plan for a **DnD Ultimate Dashboard**, a personal web application designed for Dungeon Masters running D&D 5e sessions. The app features four core modules with offline-first architecture and custom Spring Boot backend.

### Key Characteristics

| Aspect | Details |
| ------ | ------- |
| **User Model** | Single user (personal), no multiplayer |
| **Platform** | Browser-based (desktop, tablet, mobile) |
| **Network** | Offline-first with cloud backup |
| **Modes** | DM Mode (primary), Player Mode (future) |
| **Sync Strategy** | REST API + local Dexie.js cache with backend sync |

### Core Modules

1. **Initiative Tracker** - Combat management with ability reminders
2. **Music & SFX** - Audio player with local files and presets
3. **Statblock Library** - Personal statblocks with simplified ability views
4. **Obsidian Reader** - Local vault markdown reading

### Design Constraints

- **NO DICE ROLLING** - Never implement any dice rolling functionality
- **NO REAL-TIME COLLABORATION** - Single-user only
- **NO PLAYER COMBAT TOOLS** - DM-focused for now

---

## 1. Tech Stack

### 1.1 Backend Stack

| Layer | Technology | Justification |
| ----- | ---------- | ------------- |
| **Framework** | Spring Boot 3.x | Modern Java, excellent ecosystem |
| **Language** | Java 17+ | LTS, strong typing |
| **Database** | PostgreSQL | Robust, feature-rich, free |
| **ORM** | Spring Data JPA | Standardized persistence |
| **Caching** | Redis (optional) | API response caching |
| **Security** | Spring Security + JWT | Industry standard |
| **API Docs** | SpringDoc OpenAPI | Auto-generated Swagger UI |

### 1.2 Frontend Stack

| Layer | Technology | Justification |
| ----- | ---------- | ------------- |
| **Framework** | React 19 + Vite | Already configured; excellent performance |
| **Language** | JavaScript (ES Modules) | Simpler than TypeScript for this scope |
| **State Management** | Zustand | Lightweight (2KB), simple API, persistence support |
| **Routing** | TanStack Router | Type-safe routing, file-based routing |
| **Styling** | CSS Modules + Existing styles.css | Leverage existing DnD theme |
| **Local Database** | Dexie.js (IndexedDB wrapper) | Full-text search, large file storage |
| **Icons** | Lucide React | Clean, consistent, tree-shakeable |
| **Markdown** | Marked + DOMPurify | Fast parsing, security |
| **Audio** | Howler.js | Cross-browser audio handling |
| **PWA** | Vite PWA plugin | Service workers, offline caching |
| **HTTP Client** | Axios | Promise-based, interceptors, automatic JSON parsing |

### 1.3 Dependencies

**Backend (pom.xml):**

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.3</version>
    </dependency>
    <dependency>
        <groupId>org.springdoc</groupId>
        <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
        <version>2.3.0</version>
    </dependency>
</dependencies>
```

**Frontend (package.json):**

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "@tanstack/react-router": "^1.0.0",
    "zustand": "^4.5.0",
    "dexie": "^3.2.0",
    "dexie-react-hooks": "^1.0.0",
    "axios": "^1.6.0",
    "marked": "^12.0.0",
    "dompurify": "^3.0.0",
    "howler": "^2.2.0",
    "lucide-react": "^0.468.0",
    "clsx": "^2.1.0",
    "date-fns": "^3.3.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^5.1.1",
    "vite-plugin-pwa": "^0.20.0",
    "eslint": "^9.0.0",
    "eslint-plugin-react": "^7.33.0",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24"
  }
}
```

### 1.4 Backend Configuration

```yaml
# application.yml
spring:
  application:
    name: dnd-dashboard-backend
  datasource:
    url: jdbc:postgresql://localhost:5432/dnd_dashboard
    username: ${DB_USER:dnd_user}
    password: ${DB_PASSWORD:password}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.PostgreSQLDialect
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}

server:
  port: ${SERVER_PORT:8080}

app:
  jwt:
    secret: ${JWT_SECRET:your-256-bit-secret-key-here}
    expiration: 86400000  # 24 hours in ms
  api:
    base-url: ${API_BASE_URL:http://localhost:8080}
```

---

## 2. Data Architecture

### 2.1 Dual-Layer Storage Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Data Storage Layers                      │
├─────────────────────────────────────────────────────────────┤
│  POSTGRESQL DATABASE (Primary Source of Truth)              │
│  ├── users/                                                 │
│  │   ├── settings                                           │
│  │   ├── encounters                                         │
│  │   ├── combatants                                         │
│  │   ├── statblocks                                         │
│  │   ├── audio_tracks                                       │
│  │   └── playlists                                          │
│  └── campaign_data/                                         │
│      ├── npcs                                               │
│      ├── locations                                          │
│      └── plot_threads                                       │
├─────────────────────────────────────────────────────────────┤
│  REDIS CACHE (API Response Cache)                           │
│  ├── srd_statblocks:{hash}                                  │
│  ├── api_responses:{endpoint}                               │
│  └── session:{userId}                                       │
├─────────────────────────────────────────────────────────────┤
│  LOCAL CACHE (Dexie.js / IndexedDB)                         │
│  ├── Encounters (read/write cache)                          │
│  ├── Combatants (read/write cache)                          │
│  ├── Statblocks (read cache + local imports)                │
│  ├── Audio file blobs                                       │
│  ├── Obsidian vault index                                   │
│  ├── JWT token                                              │
│  └── Settings                                               │
├─────────────────────────────────────────────────────────────┤
│  PWA SERVICE WORKER                                         │
│  ├── Static assets (JS, CSS, fonts)                         │
│  ├── Audio presets (built-in)                               │
│  └── App shell                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Sync Strategy

**Offline-First with Background Sync:**

1. **Write Operations:**
   - Write to local Dexie.js immediately (instant UI update)
   - Queue for backend sync
   - Sync in background when online
   - Conflict resolution: Last-write-wins (acceptable for personal use)

2. **Read Operations:**
   - Read from local Dexie.js cache first (instant)
   - If stale or empty, fetch from REST API
   - Update local cache on fetch
   - Cache with TTL for freshness

3. **Offline Behavior:**
   - All core features work offline
   - Changes stored locally, sync when back online
   - Visual indicator for sync status

4. **Token Management:**
   - JWT stored in localStorage/IndexedDB
   - Automatic token refresh on 401 responses
   - Clear tokens on logout

### 2.3 PostgreSQL Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Settings table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'dark',
    sidebar_collapsed BOOLEAN DEFAULT FALSE,
    audio_volumes JSONB DEFAULT '{"master": 1.0, "music": 0.8, "sfx": 1.0, "atmosphere": 0.7}',
    initiative_auto_sort BOOLEAN DEFAULT TRUE,
    player_mode_enabled BOOLEAN DEFAULT FALSE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT settings_user_unique UNIQUE (user_id)
);

-- Encounters table
CREATE TABLE encounters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    round INTEGER DEFAULT 0,
    current_turn_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Combatants table
CREATE TABLE combatants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    initiative DECIMAL(5, 2),
    current_hp INTEGER,
    max_hp INTEGER,
    ac INTEGER,
    type VARCHAR(20) CHECK (type IN ('npc', 'monster', 'player')),
    player_class VARCHAR(100),
    level INTEGER,
    is_hidden BOOLEAN DEFAULT FALSE,
    statblock_id UUID,
    status_effects JSONB DEFAULT '[]',
    used_abilities JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Statblocks table
CREATE TABLE statblocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('monster', 'npc', 'vehicle', 'object')),
    size VARCHAR(20),
    alignment VARCHAR(100),
    ac INTEGER,
    hp INTEGER,
    speed JSONB DEFAULT '{"walk": 30}',
    abilities JSONB DEFAULT '{"str": 10, "dex": 10, "con": 10, "int": 10, "wis": 10, "cha": 10}',
    saving_throws JSONB DEFAULT '[]',
    skills JSONB DEFAULT '[]',
    senses JSONB DEFAULT '[]',
    resistances JSONB DEFAULT '[]',
    vulnerabilities JSONB DEFAULT '[]',
    immunities JSONB DEFAULT '[]',
    condition_immunities JSONB DEFAULT '[]',
    languages TEXT[] DEFAULT '{}',
    challenge_rating VARCHAR(10),
    experience_points INTEGER,
    special_abilities JSONB DEFAULT '[]',
    actions JSONB DEFAULT '[]',
    reactions JSONB DEFAULT '[]',
    legendary_actions JSONB DEFAULT '[]',
    description TEXT,
    source VARCHAR(50) DEFAULT 'Custom',
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audio tracks table
CREATE TABLE audio_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(20) CHECK (category IN ('music', 'sfx', 'atmosphere')),
    file_path VARCHAR(500),
    duration DECIMAL(10, 2),
    tags TEXT[] DEFAULT '{}',
    volume DECIMAL(3, 2) DEFAULT 1.0,
    loop BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Playlists table
CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) CHECK (category IN ('combat', 'exploration', 'social', 'custom')),
    track_ids UUID[] DEFAULT '{}',
    shuffle BOOLEAN DEFAULT FALSE,
    repeat_mode VARCHAR(10) DEFAULT 'none' CHECK (repeat_mode IN ('none', 'one', 'all')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Campaign data tables
CREATE TABLE npcs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    race VARCHAR(100),
    class_level VARCHAR(100),
    background TEXT,
    personality_traits TEXT[],
    ideals TEXT[],
    bonds TEXT[],
    flaws TEXT[],
    notes TEXT,
    image_url VARCHAR(500),
    statblock_id UUID REFERENCES statblocks(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_location_id UUID REFERENCES locations(id),
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE plot_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'resolved', 'abandoned')),
    linked_npc_ids UUID[] DEFAULT '{}',
    linked_location_ids UUID[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sync queue for offline changes
CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    collection VARCHAR(100) NOT NULL,
    document_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
    data JSONB NOT NULL,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_queue_user ON sync_queue(user_id, created_at);
CREATE INDEX idx_combatants_encounter ON combatants(encounter_id);
CREATE INDEX idx_statblocks_name ON statblocks(name);
CREATE INDEX idx_audio_tracks_category ON audio_tracks(user_id, category);
```

### 2.4 IndexedDB Schema (Dexie.js)

```javascript
// db.js
import Dexie from 'dexie';

export const db = new Dexie('DnDDashboardDB');

db.version(1).stores({
  // Sync metadata
  syncState: 'key, lastSyncAt, status',

  // Sync queue for offline changes
  syncQueue: '++id, collection, documentId, operation, createdAt',

  // Combat data (cached from backend)
  encounters: '++id, apiId, name, isActive, createdAt',
  combatants: '++id, apiId, encounterId, name, initiative, type',

  // Statblocks (includes locally created ones)
  statblocks: '++id, apiId, name, type, challengeRating, *tags, source, isLocal',

  // Audio metadata
  audioTracks: '++id, apiId, name, category, *tags',
  playlists: '++id, apiId, name, category',

  // Audio file blobs (stored locally only)
  audioBlobs: '++id, trackId, blob, mimeType, size',

  // Obsidian vault index
  vaultFolders: '++id, path, parentId, name',
  vaultFiles: '++id, path, folderId, name, extension, modifiedAt, *tags',

  // Settings
  settings: 'key',

  // User data
  userProfile: 'key'
});
```

---

## 3. REST API Service Architecture

### 3.1 API Client

```javascript
// services/api.js
import axios from 'axios';
import { db } from './db';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    const user = await db.userProfile.get('currentUser');
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear invalid session
      await db.userProfile.delete('currentUser');
      window.location.href = '/login';
    }
    return Promise.reject(error)
  }
);

export const apiClient = api;

// Generic CRUD operations
export const apiService = {
  // GET
  async get(endpoint, params = {}) {
    const response = await api.get(endpoint, { params });
    return response.data;
  },

  // POST
  async post(endpoint, data) {
    const response = await api.post(endpoint, data);
    return response.data;
  },

  // PUT
  async put(endpoint, data) {
    const response = await api.put(endpoint, data);
    return response.data;
  },

  // PATCH
  async patch(endpoint, data) {
    const response = await api.patch(endpoint, data);
    return response.data;
  },

  // DELETE
  async delete(endpoint) {
    const response = await api.delete(endpoint);
    return response.data;
  }
};

export default apiClient;
```

### 3.2 Sync Service

```javascript
// services/syncService.js
import { db } from './db';
import { apiClient } from './api';

class SyncService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.isSyncing = false;

    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  handleOnline() {
    this.isOnline = true;
    this.processSyncQueue();
  }

  handleOffline() {
    this.isOnline = false;
  }

  async queueOperation(collection, documentId, operation, data) {
    await db.syncQueue.add({
      collection,
      documentId,
      operation,
      data,
      createdAt: new Date(),
      retryCount: 0
    });

    await this.updateLocalCache(collection, documentId, operation, data);

    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  async processSyncQueue() {
    if (this.isSyncing || !this.isOnline) return;

    this.isSyncing = true;
    const queue = await db.syncQueue.orderBy('createdAt').toArray();

    for (const item of queue) {
      try {
        await this.syncOperation(item);
        await db.syncQueue.delete(item.id);
      } catch (error) {
        console.error('Sync operation failed:', error);
        if (item.retryCount < 3) {
          await db.syncQueue.update(item.id, { retryCount: item.retryCount + 1 });
        } else {
          await db.syncQueue.delete(item.id);
        }
      }
    }

    this.isSyncing = false;
  }

  async syncOperation(item) {
    const user = await db.userProfile.get('currentUser');
    if (!user?.token) throw new Error('Not authenticated');

    const endpoint = `/${item.collection}/${item.documentId}`;

    switch (item.operation) {
      case 'create':
        await apiClient.post(`/${item.collection}`, item.data);
        break;
      case 'update':
        await apiClient.patch(endpoint, item.data);
        break;
      case 'delete':
        await apiClient.delete(endpoint);
        break;
    }
  }

  async updateLocalCache(collection, documentId, operation, data) {
    if (operation === 'delete') {
      await db[collection].where('apiId', '==', documentId).delete();
    } else {
      await db[collection].put({
        apiId: documentId,
        ...data,
        updatedAt: new Date()
      });
    }
  }

  async fullSync() {
    const user = await db.userProfile.get('currentUser');
    if (!user?.token) throw new Error('Not authenticated');

    const collections = ['encounters', 'combatants', 'statblocks', 'audioTracks', 'playlists', 'settings'];

    for (const collection of collections) {
      const response = await apiClient.get(`/${collection}`);
      const items = response.data || [];

      await db[collection].clear();
      if (items.length > 0) {
        await db[collection].bulkPut(items.map(item => ({
          apiId: item.id,
          ...item
        })));
      }
    }

    await db.syncState.put({ key: 'lastFullSync', value: new Date() });
  }
}

export const syncService = new SyncService();
```

---

## 4. Authentication

### 4.1 Backend Auth Controller

```java
// AuthController.java
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(new AuthResponse(null, "Email already registered"));
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user = userRepository.save(user);

        String token = jwtService.generateToken(user.getId());
        return ResponseEntity.ok(new AuthResponse(token, null));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new AuthException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AuthException("Invalid credentials");
        }

        String token = jwtService.generateToken(user.getId());
        return ResponseEntity.ok(new AuthResponse(token, null));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal UserId userId) {
        User user = userRepository.findById(userId.value())
            .orElseThrow(() -> new AuthException("User not found"));
        return ResponseEntity.ok(new UserResponse(user.getId(), user.getEmail()));
    }
}
```

### 4.2 JWT Service

```java
// JwtService.java
@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private long jwtExpiration;

    public String generateToken(UUID userId) {
        return Jwts.builder()
            .subject(userId.toString())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
            .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
            .compact();
    }

    public UUID validateTokenAndGetUserId(String token) {
        Claims claims = Jwts.parser()
            .verifyWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
            .build()
            .parseSignedClaims(token)
            .getPayload();

        return UUID.fromString(claims.getSubject());
    }
}
```

### 4.3 Frontend Auth Service

```javascript
// services/authService.js
import { apiClient } from './api';
import { db } from './db';
import { syncService } from './syncService';

class AuthService {
  async register(email, password) {
    const response = await apiClient.post('/auth/register', { email, password });
    if (response.token) {
      await this.saveSession(response.token, email);
    }
    return response;
  }

  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.token) {
      await this.saveSession(response.token, email);
      await syncService.fullSync();
    }
    return response;
  }

  async saveSession(token, email) {
    await db.userProfile.put({
      key: 'currentUser',
      token,
      email,
      loginTime: new Date()
    });
  }

  async logout() {
    await db.userProfile.delete('currentUser');
    await db.syncQueue.clear();
    // Optionally keep cached data for offline access
  }

  async isAuthenticated() {
    const user = await db.userProfile.get('currentUser');
    return !!user?.token;
  }

  async getToken() {
    const user = await db.userProfile.get('currentUser');
    return user?.token;
  }
}

export const authService = new AuthService();
```

---

## 5. Feature Specifications

### 5.1 Initiative Tracker with Ability Reminders

#### Overview

When a combatant's turn starts, display a reminder card showing their abilities with options to mark abilities as used/available. Highlight reactions that can be used.

#### Components

```javascript
// components/
components/
  initiative/
    InitiativeTracker.jsx        // Main container
    CombatantList.jsx            // List of combatants
    CombatantCard.jsx            // Individual card
    TurnControls.jsx             // Next/Prev turn
    DamageModal.jsx              // HP editing
    AbilityReminderCard.jsx      // NEW: Pop-up on turn start
    AbilityTracker.jsx           // NEW: Track ability usage
    ReactionHighlight.jsx        // NEW: Highlight available reactions
    AbilityTooltip.jsx           // NEW: Show ability description
    index.js
```

---

## 6. Backend Architecture

### 6.1 Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/dnd/dashboard/
│   │   │   ├── DnDDashboardApplication.java
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── RedisConfig.java
│   │   │   │   └── OpenApiConfig.java
│   │   │   ├── controller/
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── EncounterController.java
│   │   │   │   ├── CombatantController.java
│   │   │   │   ├── StatblockController.java
│   │   │   │   ├── AudioController.java
│   │   │   │   ├── CampaignController.java
│   │   │   │   └── Open5eController.java
│   │   │   ├── entity/
│   │   │   │   ├── User.java
│   │   │   │   ├── Encounter.java
│   │   │   │   ├── Combatant.java
│   │   │   │   ├── Statblock.java
│   │   │   │   ├── AudioTrack.java
│   │   │   │   ├── Playlist.java
│   │   │   │   ├── Npc.java
│   │   │   │   ├── Location.java
│   │   │   │   └── PlotThread.java
│   │   │   ├── repository/
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── EncounterRepository.java
│   │   │   │   ├── CombatantRepository.java
│   │   │   │   ├── StatblockRepository.java
│   │   │   │   ├── AudioTrackRepository.java
│   │   │   │   ├── PlaylistRepository.java
│   │   │   │   ├── NpcRepository.java
│   │   │   │   ├── LocationRepository.java
│   │   │   │   └── PlotThreadRepository.java
│   │   │   ├── service/
│   │   │   │   ├── AuthService.java
│   │   │   │   ├── JwtService.java
│   │   │   │   ├── EncounterService.java
│   │   │   │   ├── CombatantService.java
│   │   │   │   ├── StatblockService.java
│   │   │   │   ├── AudioService.java
│   │   │   │   ├── CampaignService.java
│   │   │   │   └── Open5eProxyService.java
│   │   │   ├── dto/
│   │   │   │   ├── request/
│   │   │   │   └── response/
│   │   │   ├── security/
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   └── UserId.java
│   │   │   └── exception/
│   │   │       ├── AuthException.java
│   │   │       ├── ResourceNotFoundException.java
│   │   │       └── GlobalExceptionHandler.java
│   │   └── resources/
│   │       ├── application.yml
│   │       └── db/migration/
│   │           └── V1__initial_schema.sql
│   └── test/
│       └── java/com/dnd/dashboard/
├── pom.xml
└── Dockerfile
```

### 6.2 API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| **Auth** | | |
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login and get JWT |
| GET | /api/auth/me | Get current user |
| **Encounters** | | |
| GET | /api/encounters | List user's encounters |
| POST | /api/encounters | Create encounter |
| GET | /api/encounters/{id} | Get encounter |
| PUT | /api/encounters/{id} | Update encounter |
| DELETE | /api/encounters/{id} | Delete encounter |
| **Combatants** | | |
| GET | /api/combatants?encounterId={id} | Get combatants for encounter |
| POST | /api/combatants | Create combatant |
| PUT | /api/combatants/{id} | Update combatant |
| DELETE | /api/combatants/{id} | Delete combatant |
| PATCH | /api/combatants/{id}/hp | Update HP |
| **Statblocks** | | |
| GET | /api/statblocks | List user's statblocks |
| POST | /api/statblocks | Create statblock |
| GET | /api/statblocks/{id} | Get statblock |
| PUT | /api/statblocks/{id} | Update statblock |
| DELETE | /api/statblocks/{id} | Delete statblock |
| GET | /api/statblocks/srd/search?q={query} | Search 5e SRD |
| **Audio** | | |
| GET | /api/audio/tracks | List audio tracks |
| POST | /api/audio/tracks | Upload audio track |
| GET | /api/audio/playlists | List playlists |
| POST | /api/audio/playlists | Create playlist |
| **Campaign** | | |
| GET | /api/campaign/npcs | List NPCs |
| POST | /api/campaign/npcs | Create NPC |
| GET | /api/campaign/locations | List locations |
| POST | /api/campaign/locations | Create location |
| GET | /api/campaign/plot-threads | List plot threads |
| POST | /api/campaign/plot-threads | Create plot thread |

### 6.3 Open5e Proxy with Caching

```java
// Open5eProxyService.java
@Service
public class Open5eProxyService {

    private final RestTemplate restTemplate;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String OPEN5E_BASE_URL = "https://api.open5e.com";
    private static final Duration CACHE_TTL = Duration.ofHours(24);

    public Open5eProxyService(RedisTemplate<String, Object> redisTemplate) {
        this.restTemplate = new RestTemplate();
        this.redisTemplate = redisTemplate;
    }

    public List<StatblockDTO> searchSRD(String query) {
        String cacheKey = "srd:search:" + query.toLowerCase().hashCode();

        // Try cache first
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return (List<StatblockDTO>) cached;
        }

        // Fetch from Open5e
        String url = OPEN5E_BASE_URL + "/monsters/search/?search=" + query;
        Open5eResponse response = restTemplate.getForObject(url, Open5eResponse.class);

        List<StatblockDTO> results = convertToStatblocks(response.getResults());

        // Cache results
        redisTemplate.opsForValue().set(cacheKey, results, CACHE_TTL);

        return results;
    }

    public StatblockDTO getMonsterBySlug(String slug) {
        String cacheKey = "srd:monster:" + slug;

        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return (StatblockDTO) cached;
        }

        String url = OPEN5E_BASE_URL + "/monsters/" + slug;
        Open5eMonster monster = restTemplate.getForObject(url, Open5eMonster.class);
        StatblockDTO dto = convertToStatblock(monster);

        redisTemplate.opsForValue().set(cacheKey, dto, CACHE_TTL);

        return dto;
    }
}
```

---

## 7. Implementation Phases

### Phase 1: Backend Foundation (Weeks 1-2)

**Goals:** Spring Boot setup, PostgreSQL, JWT auth, basic API

**Deliverables:**

1. **Spring Boot Project Setup**
   - [ ] Create Spring Boot 3.x project
   - [ ] Configure PostgreSQL connection
   - [ ] Set up JPA/Hibernate entities
   - [ ] Configure Redis (optional, for caching)

2. **Authentication System**
   - [ ] Implement User entity and repository
   - [ ] Create JWT generation/validation
   - [ ] Implement Spring Security filter
   - [ ] Create login/register endpoints
   - [ ] Test auth flow with Postman

3. **Database Schema**
   - [ ] Create all entity classes
   - [ ] Run migrations/schema creation
   - [ ] Set up foreign keys and indexes

4. **API Documentation**
   - [ ] Configure SpringDoc OpenAPI
   - [ ] Document all endpoints
   - [ ] Set up Swagger UI

---

### Phase 2: Core API Development (Weeks 3-4)

**Goals:** Campaign, Encounter, Combatant APIs

**Deliverables:**

1. **Encounter API**
   - [ ] CRUD endpoints for encounters
   - [ ] Repository with user isolation
   - [ ] Service layer with business logic

2. **Combatant API**
   - [ ] CRUD endpoints for combatants
   - [ ] Link to encounters
   - [ ] Batch operations

3. **Settings API**
   - [ ] User settings CRUD
   - [ ] Audio volume presets

4. **Frontend Integration**
   - [ ] Set up API client
   - [ ] Implement auth flow
   - [ ] Connect Dexie.js to backend

---

### Phase 3: Initiative Tracker (Weeks 5-6)

**Goals:** Combat tracking with ability reminders

**Deliverables:**

1. **Data Layer**
   - [ ] Define Dexie schema for encounters/combatants
   - [ ] Create Zustand stores with persistence
   - [ ] Implement sync integration

2. **Core Components**
   - [ ] InitiativeTracker - Main container
   - [ ] CombatantList - Scrollable list
   - [ ] CombatantCard - Individual display
   - [ ] TurnControls - Next/Prev/End

3. **Combatant Management**
   - [ ] Add/Edit/Remove combatants
   - [ ] Inline HP editing
   - [ ] Damage/Healing application
   - [ ] Status effect tracking

4. **Turn Management**
   - [ ] Automatic sorting by initiative
   - [ ] Current turn highlighting
   - [ ] Round counter

5. **Ability Reminder System**
   - [ ] AbilityReminderCard component
   - [ ] Mark abilities as used/available
   - [ ] Reaction highlighting

---

### Phase 4: Music & Sound Effects (Weeks 7-8)

**Goals:** Audio system with file storage

**Deliverables:**

1. **Audio API**
   - [ ] File upload endpoint
   - [ ] Audio metadata CRUD
   - [ ] Playlist management

2. **Audio Engine**
   - [ ] Configure Howler.js
   - [ ] Create AudioService
   - [ ] Handle audio context

3. **Frontend Components**
   - [ ] AudioLibrary component
   - [ ] MusicPlayer component
   - [ ] SFX panel

---

### Phase 5: Statblock Library (Weeks 9-10)

**Goals:** Complete library with import capabilities

**Deliverables:**

1. **Statblock API**
   - [ ] Full CRUD endpoints
   - [ ] Import from Open5e proxy

2. **Frontend Library**
   - [ ] StatblockLibrary component
   - [ ] Search and filters
   - [ ] Import modal

3. **Open5e Integration**
   - [ ] Proxy service with caching
   - [ ] Search endpoint
   - [ ] Import to local library

---

### Phase 6: Campaign Management (Weeks 11-12)

**Goals:** NPCs, locations, plot threads

**Deliverables:**

1. **Campaign APIs**
   - [ ] NPC CRUD with statblock linking
   - [ ] Location hierarchy
   - [ ] Plot thread management

2. **Frontend Campaign UI**
   - [ ] NPC browser
   - [ ] Location map view
   - [ ] Plot thread tracker

---

### Phase 7: AI DM Assistant (Future)

**Goals:** AI-powered NPC conversations

**Deliverables:**

1. **Spring AI Integration**
   - [ ] Configure OpenAI/Anthropic clients
   - [ ] Context management service

2. **Frontend Chat Interface**
   - [ ] Chat UI component
   - [ ] Conversation history
   - [ ] Character context injection

---

## 8. Security

### 8.1 JWT Security Config

```java
// SecurityConfig.java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/swagger-ui/**").permitAll()
                .requestMatchers("/actuator/**").permitAll()
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

### 8.2 Password Encoding

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

---

## 9. No-Dice-Rolling Constraint

This application explicitly prohibits any dice rolling functionality. This is a **hard constraint** that applies to all code and features.

### 9.1 What is NOT Allowed

- No random number generation for dice
- No dice notation parsing (e.g., "2d6+4")
- No damage calculation tools
- No attack roll calculators
- No saving throw generators
- No "quick roll" buttons

### 9.2 What IS Allowed

- Displaying static dice values from actual physical dice
- Showing ability scores and modifiers
- Displaying damage formulas (e.g., "1d8+3")
- Reference charts for quick lookup

---

## 10. Project Structure

```
DnDUltimateDashboard/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/dnd/dashboard/
│   │   │   │   ├── config/
│   │   │   │   ├── controller/
│   │   │   │   ├── entity/
│   │   │   │   ├── repository/
│   │   │   │   ├── service/
│   │   │   │   ├── dto/
│   │   │   │   ├── security/
│   │   │   │   └── exception/
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── db/migration/
│   │   └── test/
│   ├── pom.xml
│   └── Dockerfile
├── dashboardfrontend/
│   ├── public/
│   │   ├── audio/                    # Built-in audio presets
│   │   │   ├── music/
│   │   │   ├── sfx/
│   │   │   └── atmosphere/
│   │   ├── fonts/
│   │   └── icons/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   ├── initiative/
│   │   │   ├── audio/
│   │   │   ├── statblocks/
│   │   │   ├── obsidian/
│   │   │   ├── player/               # Player mode (future)
│   │   │   └── common/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── services/
│   │   │   ├── api.js                # Axios API client
│   │   │   ├── authService.js        # JWT auth
│   │   │   ├── syncService.js        # Backend sync
│   │   │   ├── audioService.js
│   │   │   └── db.js                 # IndexedDB config
│   │   ├── utils/
│   │   ├── routes/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── styles/
│   │   ├── styles.css
│   │   └── components/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── docs/
├── .env.example
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 11. Development Workflow

### 11.1 Getting Started

```bash
# 1. Clone the repository
git clone <repository-url>
cd DnDUltimateDashboard

# 2. Set up PostgreSQL (Docker)
docker compose up -d

# 3. Set up backend
cd backend
cp .env.example .env
# Edit .env with your settings
./mvnw install

# 4. Set up frontend
cd ../dashboardfrontend
npm install

# 5. Start backend
./mvnw spring-boot:run

# 6. Start frontend (new terminal)
npm run dev
```

### 11.2 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: dnd_postgres
    environment:
      POSTGRES_USER: dnd_user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: dnd_dashboard
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: dnd_redis
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### 11.3 Environment Variables

```env
# Backend (.env)
DB_HOST=localhost
DB_PORT=5432
DB_USER=dnd_user
DB_PASSWORD=password
DB_NAME=dnd_dashboard

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-256-bit-secret-key-here
JWT_EXPIRATION=86400000

SERVER_PORT=8080

# Frontend (.env)
VITE_API_BASE_URL=http://localhost:8080/api
```

---

## 12. Success Metrics

### 12.1 Performance Targets

| Metric | Target | Measurement |
| ------ | ------ | ----------- |
| First Contentful Paint | < 1.5s | Lighthouse |
| Time to Interactive | < 3s | Lighthouse |
| API Response Time (P95) | < 200ms | Backend metrics |
| Bundle Size (initial) | < 200KB | Vite analyzer |
| Lighthouse Score | > 90 | Lighthouse CI |

### 12.2 Backend Performance Targets

| Metric | Target |
| ------ | ------ |
| CPU Usage (avg) | < 30% |
| Memory Usage | < 512MB |
| DB Connection Pool | 10-20 connections |
| Cache Hit Rate | > 80% |
