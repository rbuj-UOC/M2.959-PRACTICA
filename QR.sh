#!/usr/bin/env bash

# Other possible shebangs:
##!/bin/bash
##!/opt/homebrew/bin/bash
##!/usr/local/bin/bash

# brew install qrencode

mkdir -p img
qrencode -t SVG -o img/web.svg "https://rbuj-uoc.github.io/M2.959-PRACTICA/"
qrencode -t SVG -o img/code.svg "https://github.com/rbuj-UOC/M2.959-PRACTICA"
