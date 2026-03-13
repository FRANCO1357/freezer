# freezer.francescomelani.com

Progetto collegato al sottodominio **freezer.francescomelani.com** su Hostinger.  
Sviluppo in locale, push su GitHub → deploy automatico sul sottodominio.

**Credenziali:** password e dati sensibili non sono nel README. Sono in **`credentials.local`** (in `.gitignore`, mai su GitHub). Copia **`credentials.example`** in **`credentials.local`** e compila i valori reali.

---

## Sottodominio e percorso

- **URL:** https://freezer.francescomelani.com  
- **Directory su Hostinger:** `/home/u705656439/domains/francescomelani.com/public_html/freezer`

---

## 1. Versionamento con GitHub

### Inizializzare Git (se non l’hai già fatto)

```bash
cd /Users/astuser/freezer
git init
git add .
git commit -m "Setup iniziale"
```

### Creare il repository su GitHub

1. Vai su [github.com/new](https://github.com/new).
2. Nome repo (es. `freezer`). **Non** spuntare “Add a README”.
3. Clicca **Create repository**.

### Collegare il progetto a una nuova repo

Se devi collegare questo progetto a un repo appena creato (sostituisci **NOME-REPO** con il nome reale):

```bash
cd /Users/astuser/freezer
git remote remove origin   # se era collegato a un altro repo
git remote add origin https://github.com/FRANCO1357/NOME-REPO.git
git push -u origin main
```

---

## 2. Deploy automatico su Hostinger (SSH/SFTP)

Il deploy usa **GitHub Actions** via **SSH/SFTP**.  
**Prerequisito:** il sottodominio **freezer.francescomelani.com** deve esistere su Hostinger e puntare a `public_html/freezer`.

### 2.1 SSH su Hostinger

1. **hPanel** → **Advanced** → **SSH Access**. Abilita SSH e annota **Hostname** (o IP), **Porta** (es. 65002), **Username** (es. `u705656439`).

### 2.2 Chiave SSH per il deploy

Sul Mac (se non ne hai già una per Hostinger):

```bash
ssh-keygen -t ed25519 -C "deploy-freezer" -f ~/.ssh/hostinger_deploy -N ""
```

- **Chiave pubblica** (`~/.ssh/hostinger_deploy.pub`) → **hPanel** → **SSH Access** → **SSH Keys** → Aggiungi.
- **Chiave privata** (`~/.ssh/hostinger_deploy`) → va nei GitHub Secrets (vedi sotto). Per chiavi Ed25519, quando la incolli nel secret **lascia una riga vuota dopo** `-----END OPENSSH PRIVATE KEY-----`.

### 2.3 Secrets su GitHub

Nel repo GitHub: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Crea questi **4**:

| Secret | Valore |
|--------|--------|
| `HOSTINGER_SSH_USER` | Username SSH (es. `u705656439`) |
| `HOSTINGER_SSH_HOST` | Hostname o IP (da SSH Access) |
| `HOSTINGER_SSH_PORT` | Porta SSH (es. `65002`) |
| `HOSTINGER_SSH_PRIVATE_KEY` | Contenuto completo di `~/.ssh/hostinger_deploy` (da `-----BEGIN` a `-----END` + riga vuota finale) |

Dopo averli impostati, ogni **push su `main`** esegue il deploy (frontend Angular + backend Laravel) in `public_html/freezer`.

**Deploy manuale:** **Actions** → workflow **“Deploy to freezer.francescomelani.com”** → **Run workflow**.

---

## 3. Flusso di lavoro

1. Sviluppo in locale.
2. Commit e push:
   ```bash
   git add .
   git commit -m "Descrizione modifiche"
   git push origin main
   ```
3. Deploy automatico su **freezer.francescomelani.com** (frontend in `public_html/freezer`, backend in `public_html/freezer/backend`).
4. Controllo esito in **Actions** su GitHub.

---

## 4. Laravel e database

### 4.1 Database su Hostinger

1. **hPanel** → **Databases** → **MySQL** (o **Gestione** sotto Banche dati). **Non** usare “MySQL remoto” (quello è per connessioni da fuori).
2. Crea un **nuovo database** (es. nome `freezer` → diventa `u705656439_freezer`).
3. Crea un **utente MySQL**, assegnalo al database con **tutti i privilegi**, annota nome utente e password.
4. Annota: **DB_DATABASE**, **DB_USERNAME**, **DB_PASSWORD**. Host MySQL su Hostinger è **localhost**, porta **3306**.

Salva questi valori in **`credentials.local`** → sezione `[database_hostinger]`. Usali in `backend/.env` (locale) e nel `.env` sul server.

### 4.2 Laravel in locale (generale)

   ```bash
   cd backend
   cp .env.example .env
   php artisan key:generate
   composer install
php artisan storage:link   # necessario per vedere le immagini prodotti (link public/storage → storage/app/public)
```

Poi in **`backend/.env`** imposta le variabili DB (Hostinger o MAMP, vedi sotto).

### 4.3 Database in locale con MAMP

1. Avvia **MAMP** (Apache e MySQL). Porta MySQL di solito **8889**.
2. **phpMyAdmin** (da MAMP o http://localhost:8888/phpMyAdmin): crea un database (es. **`freezer`**). Utente tipico **root**, password **root**.
3. In **`backend/.env`**:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=8889
   DB_DATABASE=freezer
   DB_USERNAME=root
   DB_PASSWORD=root
   ```
4. Tabelle e seed:
   ```bash
   cd backend
   php artisan migrate
   php artisan db:seed
   ```

**Riepilogo MAMP:** `DB_HOST=127.0.0.1`, `DB_PORT=8889`, `DB_DATABASE=freezer`, `DB_USERNAME=root`, `DB_PASSWORD=root`.

Verifica: `php artisan serve` → http://localhost:8000/db-check e phpMyAdmin (tabella `users`).

### 4.4 Backend su Hostinger (dopo il deploy)

Il file **`.env`** non viene caricato (è in .gitignore). Va creato a mano sul server.

1. **hPanel** → **File Manager** → **`public_html`** → **`freezer`** → **`backend`**.
2. Crea il file **`.env`**. Incolla un contenuto con `APP_NAME`, `APP_ENV=production`, `APP_KEY`, `APP_DEBUG=false`, `APP_URL=https://freezer.francescomelani.com` e le variabili DB prese da **`credentials.local`** (`[laravel]` e `[database_hostinger]`):
   ```env
   DB_CONNECTION=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_DATABASE=<da credentials.local>
   DB_USERNAME=<da credentials.local>
   DB_PASSWORD=<da credentials.local>
   ```
3. **PHP ≥ 8.4:** in **hPanel** → **Advanced** → **PHP Configuration** imposta 8.4 per il sottodominio.

**Verifica:** https://freezer.francescomelani.com/backend/public/db-check → `{"ok":true,"database":"...",...}`.

### 4.5 Migrazioni e seed su Hostinger

Eseguire **sul server** (non in locale):

1. SSH dal Mac (chiave deploy, porta e host da hPanel):
   ```bash
   ssh -i ~/.ssh/hostinger_deploy -p 65002 u705656439@195.35.49.118
   ```
2. Sul server (Hostinger usa PHP 7.4 di default in SSH; il progetto richiede PHP 8.4, quindi usa il path completo):
   ```bash
   cd domains/francescomelani.com/public_html/freezer/backend
   /opt/alt/php84/usr/bin/php artisan migrate --force
   /opt/alt/php84/usr/bin/php artisan db:seed --force
   /opt/alt/php84/usr/bin/php artisan storage:link   # immagini prodotti (se non già fatto)
   exit
   ```
   Se il path non esiste, in **hPanel** → **Advanced** → **PHP Configuration** verifica le versioni disponibili; a volte è `php82` o `php83` in `/opt/alt/phpXX/usr/bin/php`.

   **Se il DB in produzione resta vuoto** (es. "Nothing to migrate" ma in phpMyAdmin non ci sono tabelle): quasi sempre il **`.env` sul server** punta a un altro database. In SSH controlla con `cat .env | grep DB_` dalla cartella `backend`. Verifica che `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` siano quelli del DB **freezer** (come in `credentials.local` → `[database_hostinger]`). Se erano sbagliati, correggi il `.env` in File Manager, poi sul server:
   ```bash
   /opt/alt/php84/usr/bin/php artisan migrate:fresh --force
   /opt/alt/php84/usr/bin/php artisan db:seed --force
   ```
   Così le tabelle vengono create (o ricreate) nel database corretto.

### 4.6 Sincronizzare il database locale con produzione

Per **aggiungere i dati** dal database locale (MAMP) al database su Hostinger **senza cancellare né sovrascrivere** ciò che è già in produzione:

1. **Prerequisiti:** `backend/.env` connesso al DB locale (MAMP); `credentials.local` con la sezione `[database_hostinger]` compilata. Chiave SSH per Hostinger (es. `~/.ssh/hostinger_deploy`). **Se il DB in produzione è vuoto (nessuna tabella):** esegui prima § 4.5 (migrate + seed sul server), così vengono create le tabelle; poi puoi usare lo script di sync per aggiungere altri dati da locale.
2. Dalla **root del progetto**:
   ```bash
   ./scripts/sync-db-to-production.sh
   ```
   Lo script esporta solo i **dati** (nessun `DROP TABLE` né `CREATE TABLE`) e usa **INSERT IGNORE**: in produzione vengono inserite solo le righe che non esistono già (stessa chiave primaria). I dati già presenti in produzione restano invariati.

**Override SSH** (se host/porta/utente/chiave sono diversi): imposta le variabili d’ambiente prima di eseguire lo script:
   ```bash
   export HOSTINGER_SSH_KEY=~/.ssh/hostinger_deploy
   export HOSTINGER_SSH_HOST=195.35.49.118
   export HOSTINGER_SSH_PORT=65002
   export HOSTINGER_SSH_USER=u705656439
   ./scripts/sync-db-to-production.sh
   ```

Se sul server il comando `mysql` non è disponibile, usa solo l’export e importa a mano da **phpMyAdmin** (Import):
   ```bash
   EXPORT_ONLY=1 ./scripts/sync-db-to-production.sh
   ```
   Poi carica il file `freezer_dump.sql` in phpMyAdmin su Hostinger nel database di produzione.

---

## 5. Login, registrazione e mailer

- **Credenziali admin:** in **`credentials.local`** → `[login_admin]`. L’utente è creato dal seeder. Cambia la password dopo il primo accesso.
- **API autenticazione base:**  
  - `POST /api/login`  
  - `POST /api/logout`  
  - `GET /api/user` (protetta).  
  Backend con Sanctum, bcrypt, rate limiting, CORS.
- **Frontend:** `/login`, `/area-riservata` (guard). In sviluppo il proxy manda `/api` a `http://localhost:8000`; in produzione API su `/backend/public/api`.

### 5.1 Registrazione utente e conferma email

È stata aggiunta la **registrazione con conferma email**:

- **Endpoint backend:**
  - `POST /api/register` → crea un nuovo utente e invia una mail con link di conferma.
  - `GET /api/verify-email/{id}/{hash}` → verifica la firma del link e imposta `email_verified_at` per l’utente.
- **Frontend:**
  - Pagina `/register` (Angular) con form `nome / email / password / conferma password`.
  - Dalla pagina `/login` c’è un link “Registrati” che porta a `/register`.
  - Dopo la registrazione viene mostrato un messaggio tipo _“Controlla l’email per confermare l’account”_.
- **Utente esistente:** l’utente admin già presente nel database **non viene toccato**; la registrazione aggiunge solo nuovi record nella tabella `users`.

### 5.3 Invitare un altro utente (stesso account / stessi permessi)

Un utente loggato può **invitare un’altra persona** a usare il suo stesso “account” (stessi freezer e prodotti, stesso permesso di lettura/scrittura):

- **Backend:** tabella `freezer_user` (condivisione freezer) e `invitations` (inviti in sospeso). Endpoint:
  - `POST /api/invitations` (auth) → invia email con link per accettare l’invito.
  - `GET /api/invitations/accept?token=...` (pubblico) → restituisce nome inviter e email invitato se il token è valido.
  - `POST /api/invitations/accept` (pubblico) → body: `token`, `name`, `password`, `password_confirmation`; crea (o riusa) l’utente e lo collega a tutti i freezer dell’inviter; invito consumato.
- **Frontend:** in area riservata, voce di menu **“Invita utente”** (`/area-riservata/invita`): form con email che chiama `POST /api/invitations`. L’invitato riceve una mail con link a `/invite/accept?token=...`; da lì imposta nome e password, poi viene reindirizzato al login.
- **Migrazioni:** alla prima installazione o dopo il deploy eseguire `php artisan migrate` per creare le tabelle `freezer_user` e `invitations` (vedi § 4.5 per produzione).

### 5.4 Configurazione mailer (locale e produzione)

Laravel usa le variabili in `backend/.env`:

```env
MAIL_MAILER=log
MAIL_HOST=127.0.0.1
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"
```

#### 5.4.1 Comportamento di default in locale

- Con `MAIL_MAILER=log` **non viene inviata nessuna email reale**.
- Il contenuto delle email (incluso il link di verifica account) viene scritto nel **log di Laravel**:
  - in locale tipicamente in `backend/storage/logs/laravel.log`  
  - oppure in console se configurato così.
- Per testare la verifica account in locale puoi:
  1. Registrare un nuovo utente da `/register`.
  2. Aprire `backend/storage/logs/laravel.log` e cercare l’URL di verifica (`/api/verify-email/...`).
  3. Copiare l’URL nel browser → l’email viene segnata come verificata.

#### 5.4.2 Mailer in locale (es. Mailtrap)

Se vuoi vedere davvero le email in una inbox di test, puoi usare un servizio tipo **Mailtrap**:

1. Crea un account su Mailtrap e un inbox di test.
2. Prendi i parametri SMTP (host, porta, username, password).
3. In `backend/.env` (solo in locale) imposta ad es.:

   ```env
   MAIL_MAILER=smtp
   MAIL_HOST=<host SMTP di Mailtrap>
   MAIL_PORT=<porta SMTP di Mailtrap>
   MAIL_USERNAME=<username SMTP>
   MAIL_PASSWORD=<password SMTP>
   MAIL_ENCRYPTION=tls
   MAIL_FROM_ADDRESS="no-reply@freezer.local"
   MAIL_FROM_NAME="Freezer Organizer"
   ```

4. Riavvia `php artisan serve`.

Da questo momento, le mail inviate da `/api/register` arriveranno nella inbox di Mailtrap (non nella posta reale).

#### 5.4.3 Mailer in produzione (Hostinger)

In produzione, usa l’SMTP di Hostinger (o di un provider esterno) e **non** committare mai le credenziali:

1. Salva i parametri SMTP (host, porta, username, password, from) in **`credentials.local`**, ad es. sezione `[mailer_hostinger]`.
2. Nel file `.env` sul server (`public_html/freezer/backend/.env`) imposta:

   ```env
   MAIL_MAILER=smtp
   MAIL_HOST=<host SMTP Hostinger o provider>
   MAIL_PORT=<porta SMTP>
   MAIL_USERNAME=<utente SMTP>
   MAIL_PASSWORD=<password SMTP>
   MAIL_ENCRYPTION=tls   # o null / ssl in base a come richiede il provider
   MAIL_FROM_ADDRESS="no-reply@freezer.francescomelani.com"
   MAIL_FROM_NAME="Freezer Organizer"
   ```

3. Assicurati che `APP_URL` nel `.env` di produzione sia:

   ```env
   APP_URL=https://freezer.francescomelani.com
   ```

   In questo modo i link di verifica generati dal backend punteranno al dominio corretto.

> Nota: se cambi il mailer in produzione, non serve alcuna migration o comando DB aggiuntivo; basta aggiornare `.env` e, se vuoi, eseguire `php artisan config:clear` sul server.

---

## 6. Avviare frontend e backend in locale

- **Backend:** `cd backend && php artisan serve` → http://localhost:8000  
- **Frontend:** `cd app && npm start` → http://localhost:4200 (dopo la build)

---

## 7. Duplicare il progetto per un altro sottodominio

Per usare questo repo come template (es. altro sottodominio su Hostinger):

1. Copia la cartella, rimuovi `.git`, `git init`, crea un nuovo repo su GitHub e collegalo.
2. In Hostinger crea il sottodominio e la cartella (es. `public_html/nuovo`).
3. Sostituisci **freezer** / **freezer.francescomelani.com** con il nuovo nome in: **README.md**, **.github/workflows/deploy.yml** (name e tutti i `remote_path` / path negli script), **app/src/environments/environment.prod.ts**, **app/src/index.html**, **backend/.env.example**, **backend/config/cors.php**.
4. Configura i 4 GitHub Secrets (stessi valori Hostinger se stesso account, oppure nuova chiave SSH).
5. Crea un nuovo database MySQL su Hostinger, .env sul server nella nuova cartella backend, poi in SSH dalla nuova cartella backend: `php artisan migrate --force` e `php artisan db:seed --force`.
