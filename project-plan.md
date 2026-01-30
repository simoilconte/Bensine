# Benzine CRM - Progetto MVP Mobile-First

## Panoramica
CRM per officina meccanica con gestione clienti, veicoli, ricambi e richieste. Design mobile-first con tema arancione/verde e mascotte scoiattolo.

## Stack Tecnologico
- **Frontend**: Vite + React + TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui (Button, Input, Card, Dialog, Sheet, Tabs, Badge, Table, DropdownMenu, Toast)
- **Icone**: lucide-react
- **Backend**: Convex (DB + Queries/Mutations + File Storage + Auth)
- **Auth**: Convex Auth con email/password

## Architettura

### Layout Mobile-First
- **Mobile**: Bottom Navigation (3 tab: Clienti, Ricambi, Profilo)
- **Desktop**: Sidebar collassabile + TopBar
- **TopBar Sticky**: Brand + nome app + avatar profilo
- **Colori**: Primary arancione (#F97316), Accent verde (#22C55E), Sfondo caldo (#FFF7ED)

### Database Schema (Convex)

#### 1. appUsers
```typescript
{
  _id: Id<appUsers>
  identitySubject: string // Convex Auth identity
  role: "ADMIN" | "BENZINE" | "CLIENTE"
  customerId?: Id<customers> // Solo per CLIENTE
  privileges?: { [key: string]: boolean }
  createdAt: number
  updatedAt: number
}
```

#### 2. customers
```typescript
{
  _id: Id<customers>
  type: "PRIVATO" | "AZIENDA"
  displayName: string
  privateFields?: {
    firstName: string
    lastName: string
  }
  companyFields?: {
    ragioneSociale: string
    piva: string
    referenteNome?: string
  }
  contacts?: {
    phone?: string
    email?: string
    address?: string
  }
  notes?: string
  sharing: {
    sharedWithClientUserIds: Id<appUsers>[]
    clientPermissions: {
      canViewVehicles: boolean
      canViewParts: boolean
      canViewDocuments: boolean
    }
  }
  createdAt: number
  updatedAt: number
}
```

#### 3. vehicles
```typescript
{
  _id: Id<vehicles>
  customerId: Id<customers>
  plate: string // UNIQUE, normalizzata
  make?: string
  model?: string
  year?: number
  vin?: string
  km?: number
  tires: {
    summer?: {
      front?: TireSpec
      rear?: TireSpec
    }
    winter?: {
      front?: TireSpec
      rear?: TireSpec
    }
    notes?: string
  }
  registrationDocFileId?: Id<_storage>
  registrationDocMeta?: {
    filename: string
    contentType: string
    uploadedAt: number
  }
  createdAt: number
  updatedAt: number
}

type TireSpec = {
  width: number // es: 205
  aspectRatio: number // es: 55
  rimDiameter: number // es: 16
  loadIndex?: string | number
  speedRating?: string
  brand?: string
}
```

#### 4. parts
```typescript
{
  _id: Id<parts>
  name: string
  sku?: string
  oemCode?: string
  supplier?: string
  unitCost?: number
  unitPrice?: number
  stockQty: number
  minStockQty?: number
  location?: string
  notes?: string
  createdAt: number
  updatedAt: number
}
```

#### 5. partRequests
```typescript
{
  _id: Id<partRequests>
  customerId: Id<customers>
  vehicleId: Id<vehicles>
  requestedItems: Array<{
    partId?: Id<parts>
    freeTextName?: string
    qty: number
    unitPriceSnapshot?: number
    unitCostSnapshot?: number
  }>
  status: "DA_ORDINARE" | "ORDINATO" | "ARRIVATO" | "CONSEGNATO" | "ANNULLATO"
  supplier?: string
  notes?: string
  timeline: Array<{
    status: string
    at: number
    byUserId: Id<appUsers>
  }>
  createdAt: number
  updatedAt: number
}
```

#### 6. events
```typescript
{
  _id: Id<events>
  type: string // "CUSTOMER_CREATED", "VEHICLE_UPDATED", etc.
  entityType: "customer" | "vehicle" | "part" | "partRequest"
  entityId: Id<any>
  payload: object
  actorUserId: Id<appUsers>
  createdAt: number
}
```

#### 7. notificationOutbox
```typescript
{
  _id: Id<notificationOutbox>
  channel: "EMAIL" | "SMS" | "WHATSAPP" | "PUSH"
  to: string
  templateKey: string
  data: object
  status: "PENDING" | "SENT" | "FAILED"
  retryCount: number
  lastError?: string
  createdAt: number
  updatedAt: number
}
```

## Ruoli e Permessi

### Ruoli
- **ADMIN**: Accesso totale, gestisce ruoli e condivisioni
- **BENZINE**: CRUD su dati operativi, NO gestione ruoli/condivisioni
- **CLIENTE**: Read-only su dati condivisi dal proprio customer

### Permessi CLIENTE
- `canViewVehicles`: può vedere veicoli del customer
- `canViewParts`: può vedere richieste ricambi
- `canViewDocuments`: può vedere documenti (foto libretto)

## Pagine e Flussi

### 1. Login (/login)
- Form semplice email/password
- Redirect a /app dopo login

### 2. Dashboard (/app)
- AppShell con navigazione
- Bottom nav mobile / Sidebar desktop

### 3. Clienti (/app/clienti)
- Lista clienti con search
- Card mobile: nome, tipo, telefono, #veicoli
- FAB "+" per nuovo cliente
- Click → Dettaglio cliente

### 4. Dettaglio Cliente (/app/clienti/:id)
- Tab: Info | Veicoli | Ricambi
- Info: dati customer + note + azioni rapide
- Se ADMIN: sezione condivisione con toggle permessi

### 5. Veicoli (tab in dettaglio cliente)
- Lista veicoli (card con targa grande)
- Form aggiunta veicolo:
  - Targa obbligatoria (auto uppercase)
  - Marca/modello/anno opzionali
  - Form misura gomme strutturato
  - Upload foto libretto (capture camera)
- Dettaglio veicolo: dati + preview immagine

### 6. Ricambi (/app/ricambi)
- Tabs: Magazzino | Richieste
- Magazzino:
  - Lista + search
  - Dettaglio ricambio
  - Adjust stock (+/-)
  - Warning se sotto minStockQty
- Richieste:
  - Lista filtrabile per status
  - FAB "+" nuova richiesta
  - Dettaglio: items, badge status, timeline
  - Cambio stato (azioni colorate)

### 7. Profilo (/app/profilo)
- Info utente + ruolo
- Se ADMIN: gestione utenti (lista, assegna ruoli)

## Componenti UI

### Design System
- **Colori**: Primary arancione, Accent verde, Neutrali grigi Tailwind
- **Tipografia**: System font, headings semibold, base 16px
- **Componenti**: Card rounded-2xl, shadow leggera
- **Badge Stati**:
  - DA_ORDINARE: grigio
  - ORDINATO: arancione
  - ARRIVATO: verde
  - CONSEGNATO: verde scuro
  - ANNULLATO: rosso tenue

### Componenti Base (shadcn/ui)
- Button, Input, Card, Dialog, Sheet, Tabs, Badge, Table, DropdownMenu, Toast

### Layout Components
- **AppShell**: TopBar + contenuto + navigazione
- **TopBar**: Brand + nome app + avatar profilo
- **BottomNav**: 3 tab con icone + label
- **FAB**: Arancione per azioni principali

## Validazioni
- Targa: unique, normalizzata (trim, uppercase, no spaces)
- Customer displayName: obbligatorio
- Stock qty: non negativo
- Item qty: > 0

## Eventi e Notifiche
- Ogni creazione/aggiornamento genera evento in `events`
- Se condiviso con CLIENTE e permessi consentiti, genera record in `notificationOutbox`
- Template: "PART_REQUEST_STATUS" per cambi stato richieste

## Setup Sviluppo
- Seed data: 1 admin, 2 benzine, 1 cliente
- 3 customers, 4 vehicles, 10 parts, 5 partRequests
- README in italiano con istruzioni setup

## Prossimi Passi
1. Setup progetto Vite + configurazioni
2. Convex backend con auth e schema
3. Implementazione frontend con routing
4. Customers management
5. Vehicles con upload documenti
6. Parts e stock management
7. Part requests e workflow
8. Admin e condivisioni
9. Eventi e notifiche
10. Polish e testing