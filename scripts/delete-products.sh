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

echo "Deleting all products (and associated order_items, orders, product_prices) from ${FLAG#--} D1 database (${DB_NAME})..."

npx wrangler d1 execute "${DB_NAME}" ${FLAG} --command="
PRAGMA foreign_keys = ON;
DELETE FROM order_item;
DELETE FROM \"order\";
DELETE FROM product;
"

echo "All products deleted successfully."
