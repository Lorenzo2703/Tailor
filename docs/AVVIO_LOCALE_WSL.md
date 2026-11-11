# Avvio locale con Docker in WSL

Questa guida descrive la configurazione usata su questo computer: Supabase gira
nei container Docker di Debian su WSL; l'app Next.js gira su Windows.

## Prerequisiti

- WSL 2 con la distribuzione `Debian` e Docker funzionante al suo interno.
- Bun disponibile sia su Windows sia in Debian e Node.js disponibile su Windows.
- Dipendenze del progetto installate su Windows. Se mancano, dalla cartella del
  progetto esegui `bun install` in PowerShell.
- Un file `.env.local` configurato per Supabase **locale**. Non pubblicare né
  condividere le chiavi mostrate dai comandi di Supabase.

## 1. Avvia Supabase in WSL

Apri PowerShell e dalla cartella del progetto avvia una shell Debian:

```powershell
cd C:\Users\gialo\Desktop\APP\Tailor
wsl -d Debian --cd "$PWD" -- bash -l
```

Nel terminale Debian verifica Docker e avvia Supabase:

```bash
docker info
bunx supabase start
```

Se Docker non è attivo, avvialo in Debian con `systemctl start docker` come
root, oppure con `sudo systemctl start docker` se usi un utente con sudo. Poi
ripeti i comandi sopra.

**Lascia aperto il terminale Debian** mentre usi l'app. Su questa configurazione
WSL può arrestarsi quando non rimangono sessioni attive: in tal caso si fermano
anche Docker e Supabase e le pagine possono dare errori.

Per verificare lo stato di Supabase, sempre nel terminale Debian:

```bash
bunx supabase status
```

## 2. Controlla la configurazione locale

Se `.env.local` è già configurato per il database locale, non sovrascriverlo.
Altrimenti, in PowerShell, copia `.env.example` in `.env.local` **solo se il
file non esiste**:

```powershell
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
```

Compila il file usando i valori mostrati da `bunx supabase status`:

- `NEXT_PUBLIC_SUPABASE_URL`: URL locale, normalmente `http://127.0.0.1:54321`.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: chiave pubblicabile locale.
- `SUPABASE_SERVICE_ROLE_KEY`: chiave di servizio locale, solo lato server.

Per i form protetti da Turnstile, configura anche le chiavi di test indicate in
[Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).
Le altre variabili sono descritte in `.env.example`. Non usare credenziali cloud
per questa procedura e non committare file contenenti segreti.

## 3. Avvia l'app su Windows

Apri **un secondo terminale PowerShell**, lasciando aperto quello Debian:

```powershell
cd C:\Users\gialo\Desktop\APP\Tailor
bun run dev
```

Attendi il messaggio `Ready`, poi apri:

- App: [http://localhost:3000](http://localhost:3000)
- Supabase Studio: [http://localhost:54323](http://localhost:54323)
- Mailpit: [http://localhost:54324](http://localhost:54324)

Se modifichi `.env.local`, riavvia il server Next.js affinché legga i nuovi
valori. Se la porta 3000 è occupata, controlla nel terminale l'URL effettivo
indicato da Next.js.

## 4. Fermare i servizi

1. Nel terminale PowerShell dell'app premi `Ctrl+C`.
2. Nel terminale Debian esegui `bunx supabase stop`.
3. Chiudi la shell Debian quando non serve più.

Non eseguire reset o cancellazioni del database per il normale avvio o arresto.

## Risoluzione dei problemi

- **Docker non raggiungibile:** verifica `docker info` in Debian e avvia il
  servizio Docker se necessario. Il comando Docker di Windows non è richiesto.
- **Annuncio non trovato o errore di connessione:** verifica che il terminale
  Debian sia ancora aperto, che `bunx supabase status` segnali i servizi attivi
  e che `.env.local` punti all'URL locale. Riprova dopo l'avvio completo.
- **Dati o foto mancanti:** verifica quale database locale stai usando. I dati
  demo dipendono dai seed e dallo storage già caricati; l'avvio non garantisce
  che siano presenti. Non resettare il database per ripristinarli senza prima
  valutare i dati esistenti.

I servizi Supabase locali possono essere accessibili anche dalla rete e usano
credenziali di sviluppo: non esporli su reti non attendibili e non usare tali
credenziali in produzione.
