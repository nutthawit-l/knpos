#!/bin/bash
URL="$1"
OUT="$2"
mkdir -p "$(dirname "$OUT")"
curl -L -o "$OUT" "$URL"
