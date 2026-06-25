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

echo "Clearing all data from ${FLAG#--} D1 database (${DB_NAME})..."

npx wrangler d1 execute "${DB_NAME}" ${FLAG} --command="
PRAGMA foreign_keys = OFF;
DELETE FROM session;
DELETE FROM otp_verification;
DELETE FROM order_item;
DELETE FROM product_price;
DELETE FROM event_member;
DELETE FROM shop_member;
DELETE FROM \"order\";
DELETE FROM product;
DELETE FROM event;
DELETE FROM \"user\";
DELETE FROM shop;
DELETE FROM sqlite_sequence;
PRAGMA foreign_keys = ON;
"

echo "All data cleared successfully."
