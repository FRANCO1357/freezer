# dev.francescomelani.com

Progetto collegato al sottodominio **dev.francescomelani.com** su Hostinger.  
Sviluppi in locale, push su GitHub → deploy automatico sul sottodominio.

**Credenziali:** le password, le chiavi e i dati sensibili non sono nel README. Sono in un file locale **`credentials.local`** (in `.gitignore`, mai caricato su GitHub). Copia **`credentials.example`** in **`credentials.local`** e compila con i valori reali; solo tu li hai sulla tua macchina.

---

## Sottodominio e percorso

- **URL:** https://dev.francescomelani.com  
- **Directory su Hostinger:**  
  `/home/u705656439/domains/francescomelani.com/public_html/dev`

---

## 1. Versionamento con GitHub

### Inizializzare Git (se non l’hai già fatto)

```bash
cd /Users/astuser/dev-francescomelani
git init
git add .
git commit -m "Setup iniziale – deploy su dev.francescomelani.com"
```

### Creare il repository su GitHub

1. Vai su [github.com/new](https://github.com/new) (con il tuo account [FRANCO1357](https://github.com/FRANCO1357)).
2. Nome repo (es. `dev-francescomelani` o `francescomelani-dev`).
3. Scegli **Public** (o Private se preferisci).
4. **Non** spuntare “Add a README” (ce l’hai già in locale).
5. Clicca **Create repository**.

### Collegare il repo e fare il primo push

Nella pagina del nuovo repo GitHub vedrai i comandi. Con il tuo account [**FRANCO1357**](https://github.com/FRANCO1357), se chiami il repo `dev-francescomelani`:

```bash
git remote add origin https://github.com/FRANCO1357/dev-francescomelani.git
git branch -M main
git push -u origin main
```

(Se scegli un altro nome per il repository, sostituisci `dev-francescomelani` nell’URL.)

---

## 2. Deploy automatico su Hostinger (SSH/SFTP)

Il deploy avviene con **GitHub Actions** tramite **SSH/SFTP** (connessione cifrata, più sicura dell'FTP).

### 2.1 Abilitare SSH e dati su Hostinger

1. Accedi a **hPanel** (Hostinger).
2. Vai in **Advanced** → **SSH Access**.
3. Abilita SSH (se non è già attivo) e annota:
   - **Hostname** (o IP del server)
   - **Porta** (solitamente **65002** per hosting condiviso)
   - **Username** (es. `u705656439`)

### 2.2 Chiave SSH per il deploy

Sul tuo computer genera una chiave dedicata al deploy:

```bash
ssh-keygen -t ed25519 -C "deploy-dev-francescomelani" -f ~/.ssh/hostinger_deploy -N ""
```

- **Chiave pubblica:** `~/.ssh/hostinger_deploy.pub` → da aggiungere su Hostinger (**SSH Access** → **SSH Keys**).
- **Chiave privata:** `~/.ssh/hostinger_deploy` → da mettere nei GitHub Secrets (mai condividerla).

### 2.3 Secrets su GitHub (SSH)

Nel repository GitHub:

1. **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret** per ognuno di questi **4**:

| Nome del secret               | Valore |
|------------------------------|--------|
| `HOSTINGER_SSH_USER`         | Username SSH (es. `u705656439`) |
| `HOSTINGER_SSH_HOST`         | Hostname o IP del server (da SSH Access) |
| `HOSTINGER_SSH_PORT`         | Porta SSH (es. `65002`) |
| `HOSTINGER_SSH_PRIVATE_KEY`  | Contenuto **completo** del file `~/.ssh/hostinger_deploy` (incluse le righe `-----BEGIN ...` e `-----END ...`). Lascia una riga vuota alla fine. |

Dopo aver configurato i 4 secrets, ogni **push su `main`** (e l'avvio manuale del workflow) farà il deploy nella directory del sottodominio tramite SFTP.

---

## 3. Flusso di lavoro

1. **Sviluppo in locale** nella cartella del progetto.
2. **Commit e push** su GitHub:
   ```bash
   git add .
   git commit -m "Descrizione delle modifiche"
   git push origin main
   ```
3. **Deploy automatico:** GitHub Actions carica **frontend** (build Angular) e **backend** (Laravel) su  
   `dev.francescomelani.com` (cartella `public_html/dev`; il backend in `public_html/dev/backend`).
4. Controlla l’esito in **Actions** nel tab del repository GitHub.

---

## 4. Laravel e database Hostinger

Il backend Laravel si trova in **`backend/`** e può essere collegato al database MySQL di Hostinger.

### 4.1 Creare il database su Hostinger

1. In **hPanel** → **Databases** → **MySQL Databases**.
2. Crea un nuovo database (es. `u705656439_dev`).
3. Crea un utente MySQL e assegnalo al database (con tutti i privilegi).
4. Annota: **host** (solitamente `localhost`), **nome database**, **username**, **password**. Su Hostinger l'host MySQL è spesso `localhost`; il nome utente è nel formato `u705656439_nomeutente`.

Le credenziali DB (username, password, nome database) sono in **`credentials.local`** → sezione `[database_hostinger]`. Usale in `backend/.env` (`DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`) e nel file `.env` su Hostinger dopo il deploy.

### 4.2 Configurare Laravel in locale

1. Installa PHP (≥ 8.2) e [Composer](https://getcomposer.org/) sul tuo Mac.
2. Dalla root del progetto:
   ```bash
   cd backend
   cp .env.example .env
   php artisan key:generate
   composer install
   ```
3. Modifica **`backend/.env`** e imposta le variabili del database:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_DATABASE=nome_database_hostinger
   DB_USERNAME=utente_hostinger
   DB_PASSWORD=password_hostinger
   ```
4. Per provare in locale: `php artisan serve` e apri http://localhost:8000. La route **http://localhost:8000/db-check** restituisce un JSON con l'esito della connessione al DB.

### 4.2b Usare MAMP (o simile) in locale

Se usi **MAMP**, **Laragon** o **XAMPP** hai MySQL e **phpMyAdmin** in locale: stesso motore del server e interfaccia per vedere le tabelle (es. `users`).

1. **Avvia MAMP** e avvia i servizi (Apache e MySQL).
2. Apri **phpMyAdmin** (da MAMP: Open WebStart page → Tools → phpMyAdmin, oppure http://localhost:8888/phpMyAdmin se la porta è 8888).
3. Crea un database (es. `dev_francescomelani`) e annota nome, utente e password. Con MAMP spesso: **porta MySQL 8889**, utente **root**, password **root** (o vuota).
4. In **`backend/.env`** imposta:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=8889
   DB_DATABASE=dev_francescomelani
   DB_USERNAME=root
   DB_PASSWORD=root
   ```
   (Usa la porta e le credenziali che vedi in MAMP se diverse.)
5. Crea le tabelle e l’utente di login:
   ```bash
   cd backend
   php artisan migrate
   php artisan db:seed
   ```
6. In phpMyAdmin seleziona il database e apri la tabella **`users`** per vedere i dati. La route **http://localhost:8000/db-check** (con `php artisan serve`) conferma la connessione.

**Nota:** con MAMP usi il PHP di MAMP per `php artisan`; se preferisci il PHP di sistema (Homebrew), tieni MySQL avviato da MAMP e nel `.env` imposta solo `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` come sopra.

### 4.3 Configurare il backend su Hostinger (dopo il deploy)

Il deploy carica anche la cartella **backend** in `public_html/dev/backend`. Il file **`.env`** non viene mai caricato (è in .gitignore), quindi va creato a mano sul server.

**PHP su Hostinger:** il backend richiede **PHP ≥ 8.4**. In **hPanel** → **Advanced** → **PHP Configuration** imposta la versione PHP a **8.4** (o la massima disponibile ≥ 8.2) per il dominio/sottodominio; altrimenti vedrai "Composer detected issues in your platform" (PHP 7.4 non è compatibile).

1. In **hPanel** → **File Manager** apri la cartella **`public_html` → `dev` → `backend`** (deve esserci dopo un deploy con il nuovo workflow).
2. Clicca **+ New file**, nome file: **`.env`**.
3. Incolla un contenuto simile: prendi **`APP_KEY`**, **`DB_DATABASE`**, **`DB_USERNAME`**, **`DB_PASSWORD`** da **`credentials.local`** (sezioni `[laravel]` e `[database_hostinger]`). In produzione usa `APP_DEBUG=false`.

   ```env
   APP_NAME=Laravel
   APP_ENV=production
   APP_KEY=<da credentials.local [laravel]>
   APP_DEBUG=false
   APP_URL=https://dev.francescomelani.com

   DB_CONNECTION=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_DATABASE=<da credentials.local [database_hostinger]>
   DB_USERNAME=<da credentials.local [database_hostinger]>
   DB_PASSWORD=<da credentials.local [database_hostinger]>
   ```

4. Salva. Da quel momento Laravel sul server userà il database MySQL di Hostinger. **Verifica connessione DB:** apri `https://dev.francescomelani.com/backend/public/db-check`; se vedi `{"ok":true,"database":"...",...}` la connessione è attiva. Su alcuni piani Hostinger potrebbe essere necessario puntare un sottodominio (es. `api.dev.francescomelani.com`) alla cartella `backend/public` da hPanel.


---

## 5. Login e area riservata

L’app include una **pagina di login** e un’**area riservata** protetta. L’autenticazione usa **Laravel Sanctum** (token API), **password con hash bcrypt**, **rate limiting** sul login (5 tentativi/minuto) e **CORS** configurato.

### Credenziali utente (da cambiare in produzione)

Email e password dell’utente admin sono in **`credentials.local`** → sezione `[login_admin]`. L’utente viene creato dal seeder. **Dopo il primo accesso, cambia la password** (aggiungendo ad es. una route/UI per il cambio password).

### Backend (Laravel)

1. Installa Sanctum e esegui le migrazioni (in locale e sul server dopo il deploy):
   ```bash
   cd backend
   composer update
   php artisan migrate
   php artisan db:seed
   ```
2. Le route API sono: `POST /api/login`, `POST /api/logout`, `GET /api/user` (protetta).

### Migrazioni e seed in produzione (Hostinger)

I comandi `php artisan migrate` e `php artisan db:seed` vanno eseguiti **sul server**, non sul tuo Mac: in locale aggiornano solo il DB locale (MAMP); il database di produzione (nome in `credentials.local`) resta vuoto finché non lanci migrate/seed **dopo esserti connesso via SSH**.

1. **Verifica SSH:** in **hPanel** → **Advanced** → **SSH Access** controlla che SSH sia attivo e annota **Hostname** (o IP), **Porta** (es. 65002), **Username** (es. `u705656439`).
2. **Connettiti dal Mac** (usa la stessa chiave del deploy):
   ```bash
   ssh -i ~/.ssh/hostinger_deploy -p PORTA USERNAME@HOSTNAME
   ```
   Esempio: `ssh -i ~/.ssh/hostinger_deploy -p 65002 u705656439@srv123.hostinger.com`
3. **Sul server** esegui:
   ```bash
   cd domains/francescomelani.com/public_html/dev/backend
   php artisan migrate --force
   php artisan db:seed --force
   ```
4. Esci con `exit`. In phpMyAdmin su Hostinger, nel database configurato (nome in `credentials.local`), dovresti vedere le tabelle e l’utente admin.

### Frontend (Angular)

- **Login:** `/login` — form email/password che chiama l’API e salva il token in `sessionStorage`.
- **Area riservata:** `/area-riservata` — accessibile solo se autenticati (guard); pulsante “Esci” per logout.
- In sviluppo il proxy inoltra le richieste a `/api` verso `http://localhost:8000`. In produzione l’API è su `/backend/public/api`.

---

## 6. Deploy manuale

- Vai su **Actions** → workflow **“Deploy to dev.francescomelani.com”** → **Run workflow** → **Run workflow**.

---

## 7. Prossimi passi (opzionale)

- Se userai **Node/npm** (es. React, Vite, Next.js):
  - Apri `.github/workflows/deploy.yml`.
  - Decommenta e adatta la sezione **Setup Node** e **Install & Build**.
  - Imposta `local_path` sulla cartella di build (es. `./dist/*` o `./build/*`) invece di `./*`.

Se vuoi, al prossimo step possiamo configurare il **deploy di Laravel** su dev.francescomelani.com (document root verso `backend/public` e `composer install` in pipeline).

---

## 8. Duplicare questo progetto per un nuovo sottodominio (es. freezer.francescomelani.com)

Questa sezione è utile quando vuoi usare **questo progetto come template** per un’altra app (nuova repo, altro sottodominio, es. **freezer.francescomelani.com**).

### 8.1 Copiare il progetto in una nuova cartella

- Copia l’intera cartella del progetto (es. `dev-francescomelani`) in una nuova directory (es. `freezer-francescomelani`).
- Elimina la cartella **`.git`** nella nuova directory (così parti da zero con un nuovo repo):
  ```bash
  cd /path/to/freezer-francescomelani
  rm -rf .git
  git init
  ```

### 8.2 Nuovo repository GitHub

- Crea un **nuovo repository** su GitHub (es. `freezer-francescomelani`), senza README.
- Collega la nuova cartella e fai il primo push:
  ```bash
  git remote add origin https://github.com/TUO_USER/freezer-francescomelani.git
  git branch -M main
  git add .
  git commit -m "Setup da template dev.francescomelani.com"
  git push -u origin main
  ```

### 8.3 Sottodominio e cartella su Hostinger

- In **hPanel** → **Domains** (o **Sottodomini**): crea il sottodominio **freezer.francescomelani.com** e punta la cartella (es. **`public_html/freezer`**). Annota il percorso completo, es.  
  `/home/u705656439/domains/francescomelani.com/public_html/freezer`
- SSH e deploy useranno questo percorso al posto di `.../dev`.

### 8.4 Cosa modificare nel nuovo progetto

Sostituisci **dev** / **dev.francescomelani.com** con **freezer** / **freezer.francescomelani.com** (e, se serve, il nome repo) nei file sotto.

| File | Cosa cambiare |
|------|----------------|
| **README.md** | Titolo, URL, percorso Hostinger (es. `freezer.francescomelani.com`, `public_html/freezer`). |
| **.github/workflows/deploy.yml** | `name:` (es. "Deploy to freezer.francescomelani.com"); `remote_path:` in tutti gli step (es. `.../public_html/freezer`); negli script SSH il path (es. `.../public_html/freezer`). |
| **app/src/environments/environment.prod.ts** | `apiUrl: '/backend/public/api'` (uguale se la struttura backend è identica); se il backend sta sotto un’altra path, adatta. |
| **app/src/index.html** | `<title>` (es. "Freezer"). |
| **backend/.env.example** e **backend/.env.hostinger.example** | `APP_URL=https://freezer.francescomelani.com`; commenti e, se usi un DB dedicato, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`. |
| **backend/config/cors.php** | Aggiungi in `allowed_origins`: `https://freezer.francescomelani.com` e `http://freezer.francescomelani.com`. |

Cerca nel progetto le stringhe **dev.francescomelani.com** e **/dev** (path) e aggiornale con **freezer.francescomelani.com** e **/freezer** dove appropriato.

### 8.5 GitHub Secrets (deploy)

- Se il **nuovo repo** usa lo **stesso account Hostinger** (stesso utente SSH), puoi riusare gli stessi **4 secrets** nel nuovo repository:  
  `HOSTINGER_SSH_USER`, `HOSTINGER_SSH_HOST`, `HOSTINGER_SSH_PORT`, `HOSTINGER_SSH_PRIVATE_KEY`.
- Se preferisci una chiave dedicata al solo progetto freezer: genera una nuova chiave SSH, aggiungila in Hostinger (SSH Access → SSH Keys) e imposta i 4 secrets nel **nuovo** repo con i nuovi valori.

### 8.6 Database (Laravel) per il nuovo progetto

- In **hPanel** → **Databases** → **MySQL**: crea un **nuovo database** (e utente) per il progetto freezer (es. `u705656439_freezer`).
- Nel nuovo progetto, in **backend/.env** (locale e, dopo il deploy, sul server in `public_html/freezer/backend/.env`) imposta `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` con i dati del nuovo DB.
- Sul server (SSH), dalla cartella `.../public_html/freezer/backend` esegui con PHP 8.4:
  ```bash
  /opt/alt/php84/usr/bin/php artisan migrate --force
  /opt/alt/php84/usr/bin/php artisan db:seed --force
  ```
  (e crea il file **.env** in `public_html/freezer/backend` come in § 4.3, con `APP_URL=https://freezer.francescomelani.com`).

### 8.7 Checklist rapida

- [ ] Progetto copiato, `.git` rimosso, `git init`, nuovo remote e push.
- [ ] Sottodominio **freezer.francescomelani.com** creato su Hostinger, cartella es. `public_html/freezer`.
- [ ] README, deploy.yml, environment.prod.ts, index.html, .env.example / .env.hostinger.example, cors.php aggiornati con freezer / nuovo URL.
- [ ] Secrets Actions configurati nel nuovo repo (stessi 4 di Hostinger o nuova chiave).
- [ ] Nuovo database MySQL creato; .env sul server con `APP_URL` e credenziali DB; migrate e seed eseguiti sul server.
- [ ] Deploy eseguito (push su main); .htaccess e .env presenti in `public_html/freezer` e `public_html/freezer/backend`.
