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

### Creació de l'entorn virtual amb conda

Per crear un entorn virtual amb conda, executeu la següent ordre al directori
arrel del projecte:

```sh
conda env create --prefix=./.conda --file=environment.yml
conda activate ./.conda
```

Per tal d'assegurar que l'entorn virtual s'ha creat correctament, podeu
comprovar que el directori `.conda/` s'ha creat al directori arrel del projecte.

> [!NOTE]
> Si no voleu utilitzar el fitxer `environment.yml`, podeu crear l'entorn virtual
amb les següents ordres:

```sh
conda create --prefix=./.conda
conda activate ./.conda
conda install r-base=4.5.2 r-data.table r-dplyr r-ggplot2 r-kableextra r-knitr \
    r-languageserver r-rmarkdown
```

> [!TIP]
> Miniconda requereix menys espai i és més lleuger que Anaconda. Per a
> instal·lar Miniconda en sistemes macOS, podeu utilitzar Homebrew:

```sh
brew install --cask miniconda
conda init
conda config --set auto_activate_base False
source ~/.bash_profile
conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/main
conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/r
```

### Activació i desactivació de l'entorn virtual amb conda

Per activar l'entorn virtual, executeu la següent ordre:

```sh
conda activate ./.conda
```

Per a desactivar l'entorn virtual, executeu la següent ordre:

```sh
conda deactivate
```

> [!TIP]
> Per canviar el prompt de l'entorn virtual i que mostri el nom de l'entorn,
> un cop activat, podeu executar la següent ordre per escurçar-lo:

```sh
conda config --set env_prompt '({name}) '
```

### Execució del preprocessament

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
