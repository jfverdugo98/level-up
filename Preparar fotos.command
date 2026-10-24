#!/bin/zsh
# Doble clic para preparar las fotos del catálogo (fondo blanco) y actualizar la web.
cd "$(dirname "$0")"
echo "🎮 Level Up · preparando fotos...\n"
swift scripts/procesar_fotos.swift
echo
read -k1 "?Presiona cualquier tecla para cerrar..."
