# Guida al Deployment & Staging (Vercel + Supabase Cloud)

Questa guida illustra la configurazione e il rilascio dell'applicazione **Tailor** su ambiente cloud (Vercel per il frontend Next.js e Supabase Cloud per database PostgreSQL, autenticazione e storage).

---

## 1. Architettura di Staging e Produzione

- **Frontend / Edge:** Vercel (Next.js 16 con Partial Prerendering, Turbopack e Edge Proxy).
- **Database & Auth:** Supabase Cloud (Progetto remoto: `szzrpsukhvgcaeatuiim`).
- **Storage:** Supabase Storage (bucket per documenti organizzazione e fotografie annunci).
- **Monitoring & Telemetria:** Sentry (error tracking server/client) e PostHog EU (analytics conforme GDPR, gated da consenso cookie).
- **Email transazionali:** Resend (notifiche per richieste di adozione).

---

## 2. Allineamento Database Remoto (Supabase Cloud)

Tutte le migrazioni DDL si trovano in `supabase/migrations/` e devono essere applicate al database remoto:

```bash
# 1. Collegamento al progetto Supabase remoto
bunx supabase link --project-ref szzrpsukhvgcaeatuiim

# 2. Push di tutte le migrazioni non applicate
bun run db:push

# 3. (Opzionale per Staging) Caricamento dei dati pilota per il Lazio
bun run db:seed:pilot

# 4. Rigenerazione automatica dei tipi TypeScript direttamente dallo schema remoto
bun run db:types:remote
```

---

## 3. Variabili di Ambiente su Vercel

Configurare le seguenti variabili nel pannello **Project Settings > Environment Variables** di Vercel:

| Variabile | Ambienti | Descrizione |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Dev | URL dell'istanza Supabase (es. `https://szzrpsukhvgcaeatuiim.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Dev | Anon / Public Key del progetto |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Dev | **Server-only:** Chiave di servizio per query amministrative protette |
| `NEXT_PUBLIC_SITE_URL` | Production, Preview | URL canonico del sito (es. `https://tailor-adoptions.vercel.app`) |
| `NEXT_PUBLIC_STAGING` | Preview | Impostare su `true` per mostrare il banner di staging pilota |
| `NEXT_PUBLIC_APP_ENV` | Production, Preview | `production` oppure `staging` |
| `NEXT_PUBLIC_POSTHOG_KEY` | Production, Preview | API Key PostHog EU (attiva solo previo consenso utente) |
| `NEXT_PUBLIC_POSTHOG_HOST` | Production, Preview | Host PostHog (`https://eu.posthog.com`) |
| `SENTRY_DSN` | Production, Preview | DSN Sentry per il logging degli errori server/runtime |
| `RESEND_API_KEY` | Production, Preview | API Key per l'invio delle notifiche email di adozione |
| `EMAIL_FROM` | Production, Preview | Mittente verificato (es. `Tailor Adozioni <adozioni@tailor.pet>`) |

---

## 4. Checklist Pre-Deploy (Vercel)

Prima di promuovere una preview a produzione:

- [ ] **Build:** `bun run build` completa senza errori (0 exit code).
- [ ] **Test unitari:** `npm test -- --run` (53/53 test superati).
- [ ] **E2E tests:** `bun run test:e2e` superati su browser desktop e mobile.
- [ ] **Audit RLS:** Eseguita la migrazione `20261029120000_rls_audit_hardening.sql` sul database remoto.
- [ ] **CSP Headers:** Verificare nei DevTools del browser che `Content-Security-Policy` e `X-Frame-Options: DENY` siano applicati correttamente alle risposte HTTP.
- [ ] **Cookie Consent:** Verificare che nessun cookie analitico o chiamata a PostHog avvenga prima che l'utente clicchi "Accetta" sul banner informativo.
- [ ] **Robots & Sitemap:** Verificare l'indicizzazione su `/robots.txt` e `/sitemap.xml`.
