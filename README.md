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
[recollida-selectiva-comarques-2006-2021.csv](./data/recollida-selectiva-comarques-2006-2021.csv)

Per obtenir l'informe en format pdf, executeu la següent ordre:

```sh
Rscript -e "rmarkdown::render('preprocessing.Rmd', output_format = 'pdf_document')"
```

o bé, aquesta altra ordre per obtenir l'enforme en format html:

```sh
Rscript -e "rmarkdown::render('preprocessing.Rmd', output_format = 'html_document')"
```

> [!TIP]
> En MacOS, per renderitzar el fitxer R Markdown a PDF, cal instal·lar
> [MacTeX](https://www.tug.org/mactex/) i [pandoc](https://pandoc.org/). pandoc
> es pot instal·lar amb Homebrew:

## Pàgina web

### Construcció de la pàgina

```sh
npm run build
```

### Execució del servidor local

```sh
npm run start
```

### Execució en mode depuració

```sh
npm run dev
```
