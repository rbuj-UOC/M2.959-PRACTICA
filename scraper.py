#!/usr/bin/env python3
"""
Script per baixar dades de l'IDESCAT utilitzant Selenium
"""

import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from selenium.webdriver.chrome.options import Options


def setup_driver(download_dir):
    """Configura el driver de Chrome amb les opcions necessàries"""
    chrome_options = Options()

    # Configurar la carpeta de baixades
    prefs = {
        "download.default_directory": download_dir,
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": True,
    }
    chrome_options.add_experimental_option("prefs", prefs)

    driver = webdriver.Chrome(options=chrome_options)
    return driver


def download_densitat_poblacio_csv(url, year, download_dir):
    """
    Baixa el fitxer CSV per un any específic

    Args:
        url: URL de la pàgina web
        year: Any a seleccionar
        download_dir: Directori on desar el fitxer
    """

    # Configurar el driver
    driver = setup_driver(download_dir)

    try:
        print(f"Accedint a la pàgina: {url}")
        driver.get(url)

        # Esperar que la pàgina es carregui
        wait = WebDriverWait(driver, 10)
        wait.until(EC.presence_of_element_located((By.ID, "TitolComp")))
        print("Pàgina carregada correctament")

        # Localitzar el div amb id TitolComp
        titol_comp_div = driver.find_element(By.ID, "TitolComp")

        # Trobar el select de l'any dins del div
        select_element = titol_comp_div.find_element(By.TAG_NAME, "select")
        select = Select(select_element)

        # Seleccionar l'any desitjat
        print(f"Seleccionant l'any: {year}")
        select.select_by_visible_text(str(year))

        # Clicar al botó que hi ha dins del div TitolComp
        button = titol_comp_div.find_element(By.TAG_NAME, "button")
        button.click()

        # Esperar que es carreguin les dades per l'any seleccionat
        print("Esperant que es carreguin les dades...")
        time.sleep(2)  # Espera fixa per assegurar la càrrega

        # Espera que es mostri el div Opcions
        print("Esperant que es mostri el div d'opcions...")
        wait.until(EC.presence_of_element_located((By.ID, "Opcions")))

        # Trobar i clicar el botó del formulari dins del div TitolComp
        options_ul = driver.find_element(By.ID, "Opcions")
        download_li = options_ul.find_element(By.CLASS_NAME, "download")
        download_link = download_li.find_element(By.TAG_NAME, "a")
        download_link.click()

        # Esperar que aparegui el div ocult amb id "download"
        print("Esperant que aparegui el diàleg de descàrrega...")
        wait.until(EC.presence_of_element_located((By.ID, "download")))

        # Seleccionar l'opció "Tabular" dins del div amb id "download"
        print("Seleccionant l'opció Tabular...")
        download_div = driver.find_element(By.ID, "download")
        tabular_option = download_div.find_element(
            By.XPATH, ".//label[contains(text(), 'Tabular')]"
        )
        tabular_option.click()

        # Clicar a l'enllaç que fa de botó "Confirmar" dins del div amb id "download"
        print("Confirmant la baixada...")
        confirm_button = download_div.find_element(
            By.XPATH, ".//a[contains(text(), 'Confirmar')]"
        )
        confirm_button.click()

        # Esperar que es baixi el fitxer
        print("Baixant el fitxer...")
        # Esperar un temps raonable per a la baixada
        time.sleep(2)

        print(f"Fitxer baixat correctament per a l'any {year}")
    except Exception as e:
        print(f"Error durant el procés: {e}")
        raise

    finally:
        driver.quit()


def download_recollida_selectiva_csv(url, year, download_dir):
    """
    Baixa el fitxer CSV per un any específic

    Args:
        url: URL de la pàgina web
        year: Any a seleccionar
        download_dir: Directori on desar el fitxer
    """

    # Configurar el driver
    driver = setup_driver(download_dir)

    try:
        # Concatena a la url el paràmetre &t=YYYY00 per seleccionar l'any directament
        year_url = f"{url}&t={year}00"
        print(f"Accedint a la pàgina: {year_url}")
        driver.get(year_url)

        # Esperar que la pàgina es carregui
        wait = WebDriverWait(driver, 10)
        wait.until(EC.presence_of_element_located((By.ID, "Titular")))
        print("Pàgina carregada correctament")

        # Localitzar el div amb id Titular
        titular_div = driver.find_element(By.ID, "Titular")

        # Espera que es mostri el div Opcions
        print("Esperant que es mostri el div d'opcions...")
        wait.until(EC.presence_of_element_located((By.ID, "Opcions")))

        # Trobar i clicar el botó del formulari dins del div Titular
        options_ul = titular_div.find_element(By.ID, "Opcions")
        download_li = options_ul.find_element(By.CLASS_NAME, "download")
        download_link = download_li.find_element(By.TAG_NAME, "a")
        download_link.click()

        # Esperar que aparegui el div ocult amb id "download"
        print("Esperant que aparegui el diàleg de descàrrega...")
        wait.until(EC.presence_of_element_located((By.ID, "download")))

        # Seleccionar l'opció "Tabular" dins del div amb id "download"
        print("Seleccionant l'opció Tabular...")
        download_div = driver.find_element(By.ID, "download")
        tabular_option = download_div.find_element(
            By.XPATH, ".//label[contains(text(), 'Tabular')]"
        )
        tabular_option.click()

        # Clicar a l'enllaç que fa de botó "Confirmar" dins del div amb id "download"
        print("Confirmant la baixada...")
        confirm_button = download_div.find_element(
            By.XPATH, ".//a[contains(text(), 'Confirmar')]"
        )
        confirm_button.click()

        # Esperar que es baixi el fitxer
        print("Baixant el fitxer...")
        # Esperar un temps raonable per a la baixada
        time.sleep(2)

        print(f"Fitxer baixat correctament per a l'any {year}")
    except Exception as e:
        print(f"Error durant el procés: {e}")
        raise

    finally:
        driver.quit()


def download_poblacio_csv(url, year, download_dir):
    """
    Baixa el fitxer CSV per un any específic

    Args:
        url: URL de la pàgina web
        year: Any a seleccionar
        download_dir: Directori on desar el fitxer
    """

    # Configurar el driver
    driver = setup_driver(download_dir)

    try:
        # Concatena a la url el paràmetre &t=YYYY00 per seleccionar l'any directament
        year_url = f"{url}&t={year}00"
        print(f"Accedint a la pàgina: {year_url}")
        driver.get(year_url)

        # Esperar que la pàgina es carregui
        wait = WebDriverWait(driver, 10)
        wait.until(EC.presence_of_element_located((By.ID, "Titular")))
        print("Pàgina carregada correctament")

        # Localitzar el div amb id Titular
        titular_div = driver.find_element(By.ID, "Titular")
        # Espera que es mostri el div Opcions
        print("Esperant que es mostri el div d'opcions...")
        wait.until(EC.presence_of_element_located((By.ID, "Opcions")))

        # Trobar i clicar el botó del formulari dins del div Titular
        options_ul = titular_div.find_element(By.ID, "Opcions")
        download_li = options_ul.find_element(By.CLASS_NAME, "download")
        download_link = download_li.find_element(By.TAG_NAME, "a")
        download_link.click()

        # Esperar que aparegui el div ocult amb id "download"
        print("Esperant que aparegui el diàleg de descàrrega...")
        wait.until(EC.presence_of_element_located((By.ID, "download")))

        # Seleccionar l'opció "Tabular" dins del div amb id "download"
        print("Seleccionant l'opció Tabular...")
        download_div = driver.find_element(By.ID, "download")
        tabular_option = download_div.find_element(
            By.XPATH, ".//label[contains(text(), 'Tabular')]"
        )
        tabular_option.click()

        # Clicar a l'enllaç que fa de botó "Confirmar" dins del div amb id "download"
        print("Confirmant la baixada...")
        confirm_button = download_div.find_element(
            By.XPATH, ".//a[contains(text(), 'Confirmar')]"
        )
        confirm_button.click()

        # Esperar que es baixi el fitxer
        print("Baixant el fitxer...")
        # Esperar un temps raonable per a la baixada
        time.sleep(2)

        print(f"Fitxer baixat correctament per a l'any {year}")
    except Exception as e:
        print(f"Error durant el procés: {e}")
        raise

    finally:
        driver.quit()


def main():
    """Funció principal"""

    # Directori on desar els fitxers
    current_dir = os.path.dirname(os.path.abspath(__file__))
    download_dir = os.path.join(current_dir, "data")

    # Assegurar que el directori existeix
    os.makedirs(download_dir, exist_ok=True)

    print(f"Carpeta de descàrregues: {download_dir}")

    #########################################################################
    # Densitat de població. Comarques i Aran, àmbits i províncies
    #########################################################################
    # URL de la pàgina
    url = "https://www.idescat.cat/indicadors/?id=aec&n=15227"
    # Llista d'anys a baixar
    years = list(range(2006, 2025))
    for year in years:
        print(f"\n{'='*50}")
        print(f"Processant any: {year}")
        print(f"{'='*50}\n")

        try:
            # Si el fitxer ja existeix, no cal baixar-lo de nou
            filename = f"t15227{year}00.csv"
            filepath = os.path.join(download_dir, filename)
            if os.path.exists(filepath):
                print(f"El fitxer per a l'any {year} ja existeix. Saltant descàrrega.")
            else:
                download_densitat_poblacio_csv(url, year, download_dir)
        except Exception as e:
            print(f"Error baixant dades per a l'any {year}: {e}")
            continue

    #########################################################################
    # Residus municipals. Generació. Total registrat i generació per càpita
    #########################################################################
    # URL de la pàgina
    url = "https://www.idescat.cat/pub/?id=resmc&n=6997&geo=com"
    # Llista d'anys a baixar
    years = list(range(2000, 2022))
    for year in years:
        print(f"\n{'='*50}")
        print(f"Processant any: {year}")
        print(f"{'='*50}\n")

        try:
            # Si el fitxer ja existeix, no cal baixar-lo de nou
            filename = f"t6997com{year}00.csv"
            filepath = os.path.join(download_dir, filename)
            if os.path.exists(filepath):
                print(f"El fitxer per a l'any {year} ja existeix. Saltant descàrrega.")
            else:
                download_recollida_selectiva_csv(url, year, download_dir)
        except Exception as e:
            print(f"Error baixant dades per a l'any {year}: {e}")
            continue

    #########################################################################
    # Població a 1 de gener. Per sexe i grups d'edat. Comarques i Aran,
    # àmbits i províncies
    #########################################################################
    # URL de la pàgina
    url = "https://www.idescat.cat/indicadors/?id=aec&n=15233&tema=XIFPO"
    # Llista d'anys a baixar
    years = list(range(1999, 2025))
    for year in years:
        print(f"\n{'='*50}")
        print(f"Processant any: {year}")
        print(f"{'='*50}\n")

        try:
            # Si el fitxer ja existeix, no cal baixar-lo de nou
            filename = f"t15233{year}00.csv"
            filepath = os.path.join(download_dir, filename)
            if os.path.exists(filepath):
                print(f"El fitxer per a l'any {year} ja existeix. Saltant descàrrega.")
            else:
                download_poblacio_csv(url, year, download_dir)
        except Exception as e:
            print(f"Error baixant dades per a l'any {year}: {e}")
            continue

    print("\nProcés finalitzat!")


if __name__ == "__main__":
    main()
