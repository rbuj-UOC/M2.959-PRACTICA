# Recollida selectiva

## Web scraper

### Creació d'un entorn virtual amb venv

```sh
python3 -m venv .venv
```

### Activació de l'entorn virtual

```sh
source .venv/bin/activate
```

### Instal·lació dels requisits

```sh
(.venv) $ python3 -m pip install -r requirements.txt
```

### Execució del codi

```sh
(.venv) $ python3 scraper.py
```

## Preprocessament de les dades

El fitxer preprocessing.Rmd preprocessa les dades i genera el conjunt de dates
[recollida-selectiva-comarques-2006-2021.csv](./data/recollida-selectiva-comarques-2006-2021.csv).
