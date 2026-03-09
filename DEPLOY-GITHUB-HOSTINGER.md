# Collegare GitHub e Hostinger per il deploy

Questa guida ti permette di far partire il deploy automatico a ogni push su `main`: GitHub Actions si connette a Hostinger via SSH/SFTP e carica frontend (Angular) e backend (Laravel) nella cartella del sottodominio.

**Prerequisiti:** il sottodominio **freezer.francescomelani.com** deve essere creato su Hostinger e puntare alla cartella `public_html/freezer` (o al path che usi). Il percorso usato dal workflow è:
`/home/u705656439/domains/francescomelani.com/public_html/freezer`

---

## 1. Abilitare SSH su Hostinger e annotare i dati

1. Accedi a **hPanel** (Hostinger).
2. Vai in **Advanced** → **SSH Access**.
3. **Abilita SSH** se non è già attivo.
4. Annota (li userai nei GitHub Secrets):
   - **Hostname** (o IP del server), es. `srv123.hostinger.com`
   - **Porta** (solitamente **65002** per hosting condiviso)
   - **Username** (es. `u705656439`)

---

## 2. Creare una chiave SSH per il deploy

Sul tuo Mac, in terminale, genera una chiave **solo per questo deploy** (se ne hai già una per Hostinger, puoi riusarla e saltare al passo 3):

```bash
ssh-keygen -t ed25519 -C "deploy-freezer-hostinger" -f ~/.ssh/hostinger_deploy_freezer -N ""
```

- **Chiave pubblica:** `~/.ssh/hostinger_deploy_freezer.pub` → la aggiungerai su Hostinger (passo 3).
- **Chiave privata:** `~/.ssh/hostinger_deploy_freezer` → la metterai nei GitHub Secrets (passo 5). **Non condividerla e non committarla.**

---

## 3. Aggiungere la chiave pubblica su Hostinger

1. In **hPanel** → **Advanced** → **SSH Access**.
2. Apri la sezione **SSH Keys** (o “Manage SSH Keys”).
3. Clicca **Add SSH Key** (o simile).
4. Copia il **contenuto completo** del file `~/.ssh/hostinger_deploy_freezer.pub` (una riga che inizia con `ssh-ed25519`).
5. Incolla nel campo e salva.

Per copiare dal Mac:
```bash
cat ~/.ssh/hostinger_deploy_freezer.pub
```
Seleziona l’output e copialo (oppure `pbcopy < ~/.ssh/hostinger_deploy_freezer.pub`).

---

## 4. Creare il sottodominio e la cartella su Hostinger (se non l’hai già fatto)

1. In **hPanel** → **Domains** (o **Sottodomini**).
2. Crea il sottodominio **freezer.francescomelani.com** e imposta la cartella, es. **`public_html/freezer`**.
3. Annota il percorso completo (es. `/home/u705656439/domains/francescomelani.com/public_html/freezer`). Se è diverso da quello nel workflow, dovrai modificare `.github/workflows/deploy.yml` con il path corretto.

---

## 5. Aggiungere i 4 Secrets nel repository GitHub

1. Apri il **tuo repository** su GitHub (es. `freezer` o `freezer-francescomelani`).
2. Vai in **Settings** → **Secrets and variables** → **Actions**.
3. Clicca **New repository secret** e crea **4 secrets** con questi nomi e valori:

| Nome del secret | Valore |
|------------------|--------|
| `HOSTINGER_SSH_USER` | Username SSH (es. `u705656439`) |
| `HOSTINGER_SSH_HOST` | Hostname o IP del server (quello di SSH Access) |
| `HOSTINGER_SSH_PORT` | Porta SSH (es. `65002`) |
| `HOSTINGER_SSH_PRIVATE_KEY` | Contenuto **completo** del file della chiave **privata** (`~/.ssh/hostinger_deploy_freezer`), incluse le righe `-----BEGIN OPENSSH PRIVATE KEY-----` e `-----END OPENSSH PRIVATE KEY-----`. Meglio lasciare una riga vuota alla fine. |

Per copiare la chiave privata (da incollare in `HOSTINGER_SSH_PRIVATE_KEY`):
```bash
cat ~/.ssh/hostinger_deploy_freezer
```
Copia tutto l’output (dalla prima alla ultima riga) e incollalo nel valore del secret.

---

## 6. Verificare che il workflow sia nel repo

Assicurati che il file **`.github/workflows/deploy.yml`** sia presente nel repository (è già nel progetto). Dopo un push su `main`, il workflow partirà in automatico.

---

## 7. Primo deploy

1. Fai commit e push su `main`:
   ```bash
   git add .
   git commit -m "Configurazione deploy GitHub → Hostinger"
   git push origin main
   ```
2. Su GitHub vai in **Actions**: dovresti vedere il workflow **“Deploy to freezer.francescomelani.com”** in esecuzione.
3. Se va a buon fine, controlla il sito su **https://freezer.francescomelani.com**.

**Deploy manuale:** **Actions** → **“Deploy to freezer.francescomelani.com”** → **Run workflow** → **Run workflow**.

---

## Riepilogo

- **Hostinger:** SSH abilitato, chiave pubblica aggiunta in SSH Keys, sottodominio **freezer** con cartella `public_html/freezer`.
- **GitHub:** 4 secrets (`HOSTINGER_SSH_USER`, `HOSTINGER_SSH_HOST`, `HOSTINGER_SSH_PORT`, `HOSTINGER_SSH_PRIVATE_KEY`).
- **Push su `main`** → deploy automatico di frontend (Angular) e backend (Laravel) nella cartella del sottodominio. Il file `.env` del backend sul server non viene sovrascritto (viene preservato dallo script di deploy).
