# Collegare questo progetto a una nuova repo GitHub

Segui questi passi in ordine.

---

## Passo 1 – Crea la nuova repository su GitHub

1. Vai su **https://github.com/new** (accedi con l’account **FRANCO1357** se è il tuo).
2. **Repository name:** scegli un nome (es. `freezer` oppure `freezer-francescomelani`).
3. **Description:** opzionale (es. "Progetto freezer – francescomelani.com").
4. Scegli **Public** (o Private se preferisci).
5. **Non** spuntare:
   - "Add a README file"
   - "Add .gitignore"
   - "Choose a license"  
   (il progetto ha già tutto in locale.)
6. Clicca **Create repository**.

Dopo la creazione GitHub mostrerà una pagina con i comandi. **Non** usare la sezione "…or push an existing repository from the command line" così com’è: usa i comandi qui sotto, che aggiornano anche il remote.

---

## Passo 2 – Committa le modifiche in sospeso (se vuoi portarle nella nuova repo)

Da terminale, nella cartella del progetto:

```bash
cd /Users/astuser/freezer

git add .gitignore README.md credentials.example
git commit -m "Spostate credenziali in credentials.local, aggiunto credentials.example"
```

(Se preferisci fare il commit dopo aver collegato la nuova repo, puoi saltare questo passo e farlo dopo il Passo 4.)

---

## Passo 3 – Collega il progetto alla nuova repo

Sostituisci **NOME-REPO** con il nome esatto della repository che hai creato (es. `freezer` o `freezer-francescomelani`).

```bash
cd /Users/astuser/freezer

# Rimuove il collegamento alla vecchia repo (dev-francescomelani)
git remote remove origin

# Collega alla nuova repo (usa il nome che hai scelto)
git remote add origin https://github.com/FRANCO1357/NOME-REPO.git

# Verifica
git remote -v
```

Dovresti vedere qualcosa tipo:
`origin  https://github.com/FRANCO1357/NOME-REPO.git (fetch)`
`origin  https://github.com/FRANCO1357/NOME-REPO.git (push)`

---

## Passo 4 – Push sulla nuova repo

```bash
# Se non l’hai già fatto, committa le modifiche
git add .
git status
git commit -m "Setup iniziale – collegamento a nuova repo"

# Invia tutto sul branch main della nuova repo
git push -u origin main
```

Se GitHub ti chiede autenticazione, usa il tuo utente e un **Personal Access Token** (non la password dell’account) oppure configura SSH.

---

## Riepilogo comandi (copia-incolla dopo aver creato la repo)

Sostituisci **NOME-REPO** con il nome reale della repo (es. `freezer`):

```bash
cd /Users/astuser/freezer
git add .gitignore README.md credentials.example
git commit -m "Spostate credenziali in credentials.local, aggiunto credentials.example"
git remote remove origin
git remote add origin https://github.com/FRANCO1357/NOME-REPO.git
git push -u origin main
```

Da quel momento ogni `git push origin main` aggiornerà la nuova repository.
