#!/bin/bash
# Nom de fitxer de l'script sense l'extensió
script_name=$(basename "$0" .sh)
# Número de caràcters del nom de l'script
name_length=${#script_name}
# Script per fusionar fitxers CSV en un de sol
rm -f "$script_name".csv
# Afegeix la capçalera del primer fitxer
headings=("Comarca;Total 0-15;Total 16-24;Total 25-44;Total 45-64;Total 65 i més;Total Sum;Any" "Comarca;Home 0-15;Home 16-24;Home 25-44;Home 45-64;Home 65 i més;Home Sum;Any" "Comarca;Dona 0-15;Dona 16-24;Dona 25-44;Dona 45-64;Dona 65 i més;Dona Sum;Any")
file_name=$(basename "$0" .csv)
files=("${script_name}-T.csv" "${script_name}-H.csv" "${script_name}-D.csv")
# Crea fitxers buits amb les capçaleres corresponents
echo "${headings[0]}" >"${files[0]}"
echo "${headings[1]}" >"${files[1]}"
echo "${headings[2]}" >"${files[2]}"
for file in "$script_name"2*.csv; do
    year=${file:$name_length:4}
    echo "Processant el fitxer: $file de l'any: $year"
    chunk=0
    IFS=$'\n'
    for line in $(cat "$file"); do
        if [[ $line == *"Població a 1 de gener"* ]] || [[ $line == *";0-15"* ]]; then
            chunk=$((chunk + 1))
            continue
        fi
        if ((chunk % 2 == 0)); then
            file_id=$((chunk / 2))
            echo "$line;$year" >>"${files[$((file_id - 1))]}"
        fi
    done
done
