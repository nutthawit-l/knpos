#!/bin/bash

# Exit on error
set -e

# Parse arguments
SHOP_ID=""
FLAG="--local"

for arg in "$@"; do
  if [ "$arg" == "--remote" ]; then
    FLAG="--remote"
  elif [[ "$arg" =~ ^[0-9]+$ ]]; then
    SHOP_ID="$arg"
  fi
done

if [ -z "$SHOP_ID" ]; then
  echo "Error: Please specify a Shop ID."
  echo "Usage: $0 <shop_id> [--remote]"
  exit 1
fi

DB_NAME="charnipos-db"

echo "Deleting shop with ID ${SHOP_ID} from ${FLAG#--} D1 database (${DB_NAME})..."
npx wrangler d1 execute "${DB_NAME}" ${FLAG} --command="DELETE FROM shop WHERE id = ${SHOP_ID};"
