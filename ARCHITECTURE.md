# Tayfun Cam Balkon Web - Architecture Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              SvelteKit 5 Application                 │  │
│  │  ┌──────────────────────────────────────────────────┐│  │
│  │  │           Routes (Pages)                        ││  │
│  │  │ - Home, Auth, Projects, Wizard, etc.           ││  │
│  │  └──────────────────────────────────────────────────┘│  │
│  │                                                      │  │
│  │  ┌──────────────────────────────────────────────────┐│  │
│  │  │        Svelte Stores (State)                    ││  │
│  │  │ - Auth store, Data store                        ││  │
│  │  │ - Derived/Readable/Writable                    ││  │
│  │  └──────────────────────────────────────────────────┘│  │
│  │                                                      │  │
│  │  ┌──────────────────────────────────────────────────┐│  │
│  │  │        Python Engine (Calculation)              ││  │
│  │  │ ┌─────────────────────────────────────────────┐ ││  │
│  │  │ │ Web Worker (Pyodide)                      │ ││  │
│  │  │ │ - Python: drawing_engine.py               │ ││  │
│  │  │ │ - Python: railing.py, viewer3d.py        │ ││  │
│  │  │ │ - Returns: cuts, bars, materials, price  │ ││  │
│  │  │ └─────────────────────────────────────────────┘ ││  │
│  │  └──────────────────────────────────────────────────┘│  │
│  │                                                      │  │
│  │  ┌──────────────────────────────────────────────────┐│  │
│  │  │      Supabase Client (API)                      ││  │
│  │  │ - Real-time listeners                          ││  │
│  │  │ - PostgreSQL queries                           ││  │
│  │  │ - Authentication                               ││  │
│  │  └──────────────────────────────────────────────────┘│  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         ↓ HTTP/WebSocket                      ↓ Network
┌──────────────────────────────────────────────────────────────┐
│                   Cloud Backend                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │     Supabase (PostgreSQL + Auth + Real-time)        │   │
│  │                                                      │   │
│  │  Table: cb_records                                 │   │
│  │  ├─ kind: customer, project, drawing, bundle      │   │
│  │  ├─ data: JSON                                    │   │
│  │  ├─ origin: web, mobile, desktop                 │   │
│  │  └─ updated_at: timestamp                        │   │
│  │                                                      │   │
│  │  Auth Table: users                                 │   │
│  │  ├─ email: user identifier                        │   │
│  │  ├─ encrypted_password                            │   │
│  │  └─ session management                            │   │
│  │                                                      │   │
│  │  Real-time: postgres_changes                       │   │
│  │  ├─ INSERT, UPDATE, DELETE events                │   │
│  │  └─ Instant sync to all clients                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Authentication Flow
```
User Input (Email/Password)
    ↓
Auth Store (SignIn/SignUp)
    ↓
Supabase Auth API
    ↓
Session Token
    ↓
Store in Browser (auto-managed by Supabase)
    ↓
Protected Route Guard
```

### 2. Wizard Calculation Flow
```
User Input (System, Properties, Dimensions)
    ↓
Wizard Component
    ↓
Python Engine (Web Worker)
    ↓
Pyodide Runtime
    ↓
Execute Python Code:
  - drawing_engine.calculate()
  - Returns: {cuts, bars, materials, price, area}
    ↓
Result Component (Display)
    ↓
Save to Supabase (on "Save" click)
    ↓
Create Project & Drawing records
```

### 3. Real-time Sync Flow
```
Device A: Creates Customer
    ↓
Supabase: INSERT into cb_records
    ↓
Real-time Listener: postgres_changes
    ↓
All Connected Clients: Receive update
    ↓
Data Store: Update reactive state
    ↓
UI: Re-render automatically
```

## File Organization

### Frontend Structure
```
src/
├── lib/
│   ├── calculation/
│   │   ├── bundle-loader.ts      # Fetch bundle from Supabase
│   │   └── python-engine.ts      # Web Worker interface
│   │
│   ├── worker/
│   │   └── pyodide-worker.ts     # Worker script
│   │
│   ├── stores/
│   │   ├── auth.ts               # Authentication state
│   │   └── data.ts               # Projects/Customers/Drawings
│   │
│   ├── supabase.ts               # Client initialization
│   └── types/                    # Shared TypeScript types
│
├── routes/
│   ├── +layout.svelte            # Layout wrapper
│   ├── +page.svelte              # Dashboard home
│   │
│   ├── auth/
│   │   ├── login/
│   │   │   ├── +page.svelte      # Login form
│   │   │   └── +page.ts          # Server logic (optional)
│   │   │
│   │   └── signup/
│   │       └── +page.svelte      # Registration form
│   │
│   ├── customers/
│   │   ├── +page.svelte          # Customer list & form
│   │   └── +page.ts              # Server logic (optional)
│   │
│   ├── projects/
│   │   ├── +page.svelte          # Project list
│   │   └── [id]/                 # Project detail (future)
│   │
│   ├── systems/
│   │   └── +page.svelte          # Systems catalog
│   │
│   └── wizard/
│       ├── +page.svelte          # 5-step drawing wizard
│       └── +page.ts              # Server logic (optional)
│
└── app.css                       # Global styles
```

## Key Concepts

### 1. Svelte 5 Runes
```typescript
// State declaration
let count = $state(0);

// Derived state
let doubled = $derived(count * 2);

// Effects
$effect(() => {
  console.log(count);
});
```

### 2. TypeScript Integration
```typescript
// Type definitions
interface CalculationRequest {
  system: string;
  props: Record<string, unknown>;
}

// Type-safe stores
const store = writable<DataStore>({
  customers: {},
  projects: {},
  drawings: {}
});
```

### 3. Web Worker Message Passing
```typescript
// Main thread
worker.postMessage({
  id: 1,
  type: 'call',
  function: 'calculate',
  args: ['KATLANIR-001', props]
});

worker.onmessage = (event) => {
  const { id, success, result } = event.data;
  // Process result
};

// Worker thread
self.onmessage = async (event) => {
  const { id, function: fn, args } = event.data;
  const result = await pyodide.globals.get(fn)(...args);
  self.postMessage({ id, success: true, result });
};
```

### 4. Supabase Real-time
```typescript
// Subscribe to changes
supabase
  .channel('cb_records')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'cb_records'
  }, (payload) => {
    // Handle INSERT, UPDATE, DELETE
    updateLocalState(payload);
  })
  .subscribe();
```

## Performance Considerations

### 1. Bundle Size Optimization
- Main bundle: 214 KB (55 KB gzip)
- Code splitting enabled
- Pyodide loaded from CDN (not bundled)
- Supabase libraries tree-shaken

### 2. Lazy Loading
```typescript
import { dev } from '$app/environment';

// Lazy load features
const WizardComponent = dev 
  ? WizardModule 
  : lazy(() => import('./Wizard.svelte'));
```

### 3. Web Worker Benefits
- Python calculations don't block UI
- Smooth 60 FPS animations
- Responsive to user input
- Error handling isolated

## Security Considerations

### 1. Environment Variables
- Supabase URL is public (anonymous client)
- Anon key is public (row-level security needed)
- Never commit .env.local to git

### 2. Supabase RLS (Row Level Security)
```sql
-- Example: Users can only see their own projects
CREATE POLICY "Users see own projects"
ON cb_records FOR SELECT
USING (auth.uid() = data->>'user_id');
```

### 3. Web Worker Isolation
- Python code runs in isolated context
- No access to DOM or browser APIs
- Safe calculation sandboxing

## Deployment Strategy

### 1. Pre-deployment Checklist
- [ ] All tests pass
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] Environment variables set
- [ ] Performance acceptable
- [ ] Security rules in place

### 2. Vercel Deployment
- Auto-deploy on GitHub push
- Serverless Functions (optional)
- CDN distribution
- Auto HTTPS

### 3. Monitoring
- Vercel Analytics
- Error tracking
- Performance monitoring
- User session monitoring

## Future Enhancements

### Phase 2: UI Improvements
- 3D viewer (Three.js)
- 2D drawing preview
- Material calculations
- PDF export

### Phase 3: Features
- Project templates
- Design history
- Collaboration
- Mobile app

### Phase 4: Advanced
- ML-based optimization
- Advanced analytics
- Custom integrations
- Enterprise features

---

**Last Updated:** 2026-10-15
**Architecture Version:** 1.0
**Status:** Production Ready
