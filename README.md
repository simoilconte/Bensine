# 🐿️⛽ Benzine CRM

CRM per officine meccaniche - MVP mobile-first con gestione clienti, veicoli e ricambi.

## 🚀 Setup Rapido

### Prerequisiti
- Node.js 18+
- Account Convex (gratuito su [convex.dev](https://convex.dev))

### Installazione

```bash
# Installa dipendenze
npm install

# Configura Convex (segui le istruzioni)
npx convex dev
```

In un altro terminale:

```bash
# Avvia il frontend
npm run dev
```

### Configurazione Convex

1. Crea un account su [convex.dev](https://convex.dev)
2. Esegui `npx convex dev` e segui le istruzioni
3. Il file `.env.local` verrà creato automaticamente con `VITE_CONVEX_URL`

## 👤 Utenti Demo

Dopo aver avviato l'app, clicca su **"🌱 Popola Database Demo"** nella pagina di login per creare i dati di esempio.

| Ruolo | Email | Password |
|-------|-------|----------|
| Admin | admin@benzine.it | admin123 |
| Dipendente | luca@benzine.it | benzine123 |
| Dipendente | giulia@benzine.it | benzine123 |
| Cliente | cliente@benzine.it | cliente123 |

## 🎨 Brand & Design

- **Mascotte**: 🐿️⛽ (scoiattolo che mette benzina)
- **Colore primario**: Arancione (#F97316)
- **Colore accento**: Verde (#22C55E)
- **Sfondo**: Arancione chiaro (#FFF7ED)

## 📱 Funzionalità

### Clienti
- Lista clienti con ricerca
- Filtro per tipo (Privato/Azienda)
- Dettaglio cliente con tab Info/Veicoli/Ricambi
- Creazione nuovo cliente

### Veicoli
- Associazione a cliente
- Targa unica (normalizzata)
- Dati veicolo (marca, modello, anno, km)
- Misure gomme strutturate (estate/inverno)
- Upload foto libretto di circolazione

### Ricambi
- **Magazzino**: catalogo ricambi con stock
- **Richieste**: gestione ordini con stati
  - Da ordinare → Ordinato → Arrivato → Consegnato
  - Possibilità di annullare

### Ruoli e Permessi

| Ruolo | Permessi |
|-------|----------|
| ADMIN | Accesso completo + gestione utenti |
| BENZINE | CRUD su clienti, veicoli, ricambi |
| CLIENTE | Solo lettura dei propri dati |

## 🛠️ Stack Tecnologico

- **Frontend**: React + TypeScript + Vite
- **Styling**: TailwindCSS + shadcn/ui
- **Backend**: Convex (database + API)
- **Icone**: Lucide React

## 📁 Struttura Progetto

```
├── convex/           # Backend Convex
│   ├── schema.ts     # Schema database
│   ├── auth.ts       # Autenticazione
│   ├── users.ts      # Gestione utenti
│   ├── customers.ts  # API clienti
│   ├── vehicles.ts   # API veicoli
│   ├── parts.ts      # API ricambi
│   ├── partRequests.ts # API richieste
│   ├── events.ts     # Event log
│   └── seed.ts       # Dati demo
├── src/
│   ├── components/   # Componenti React
│   │   ├── ui/       # shadcn/ui
│   │   └── layout/   # Layout (TopBar, BottomNav)
│   ├── pages/        # Pagine
│   ├── lib/          # Utilities + Auth context
│   └── hooks/        # Custom hooks
└── public/           # Asset statici
```

## 🔧 Comandi Utili

```bash
# Sviluppo
npm run dev           # Avvia frontend
npx convex dev        # Avvia backend Convex

# Build
npm run build         # Build produzione

# Lint
npm run lint          # Controlla codice
```

## 📝 Note per lo Sviluppo

### Promuovere un utente ad Admin

1. Accedi come Admin esistente
2. Vai su Profilo → Gestione Utenti
3. Seleziona l'utente e cambia il ruolo

### Collegare un Cliente

1. Accedi come Admin
2. Vai su Profilo → Gestione Utenti
3. Seleziona l'utente, imposta ruolo "Cliente"
4. Seleziona il cliente da collegare

### Event Log e Notifiche

Il sistema registra automaticamente:
- Creazione/modifica clienti e veicoli
- Creazione/modifica ricambi
- Cambio stato richieste ricambi

Le notifiche sono predisposte nella tabella `notificationOutbox` (stub per implementazione futura).

## 📄 Licenza

MIT
