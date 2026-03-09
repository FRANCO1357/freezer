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
2. Sul server:
   ```bash
   cd domains/francescomelani.com/public_html/freezer/backend
   php artisan migrate --force
   php artisan db:seed --force
   exit
   ```
   Se `php` non è nel PATH, usa ad es. `/opt/alt/php84/usr/bin/php artisan ...`.

---

## 5. Login e area riservata

- **Credenziali admin:** in **`credentials.local`** → `[login_admin]`. L’utente è creato dal seeder. Cambia la password dopo il primo accesso.
- **API:** `POST /api/login`, `POST /api/logout`, `GET /api/user` (protetta). Backend con Sanctum, bcrypt, rate limiting, CORS.
- **Frontend:** `/login`, `/area-riservata` (guard). In sviluppo il proxy manda `/api` a `http://localhost:8000`; in produzione API su `/backend/public/api`.

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
