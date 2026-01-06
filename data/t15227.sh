#!/bin/bash
# Nom de fitxer de l'script sense l'extensió
script_name=$(basename "$0" .sh)
# Número de caràcters del nom de l'script
name_length=${#script_name}
# Script per fusionar fitxers CSV en un de sol
rm -f "$script_name".csv
# Afegeix la capçalera del primer fitxer
echo "Comarca;Població;Superfície km2;Densitat (habitants/km2);Any" >"$script_name".csv
for file in "$script_name"*.csv; do
    # extreu l'any del nom de fitxer
    year=${file:$name_length:4}
    # afegeix una columna amb l'any, eliminem les línies abans de la primera comarca i després de la darrera
    grep -A 10000 '^\;Població' "$file" | tail +2 | sed '/^$/d' | awk -v yr="$year" -F';' 'BEGIN {OFS=";"} {print $0, yr}' >>"$script_name".csv
done
