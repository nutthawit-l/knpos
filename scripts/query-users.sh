#!/bin/bash

# Exit on error
set -e

# Default to local
FLAG="--local"

# Check CLI arguments
for arg in "$@"; do
  if [ "$arg" == "--remote" ]; then
    FLAG="--remote"
  fi
done

DB_NAME="charnipos-db"

echo "Querying all users from ${FLAG#--} D1 database (${DB_NAME})..."
npx wrangler d1 execute "${DB_NAME}" ${FLAG} --command="SELECT id, shop_id, email, is_verified, created_at FROM \"user\";"
