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

echo "Querying all products from ${FLAG#--} D1 database (${DB_NAME})..."
npx wrangler d1 execute "${DB_NAME}" ${FLAG} --command="
SELECT 
  p.id, 
  p.name, 
  p.image_url, 
  GROUP_CONCAT(pp.price || ' ' || pp.currency_code, ', ') AS prices, 
  p.created_at 
FROM product p 
LEFT JOIN product_price pp ON p.id = pp.product_id 
GROUP BY p.id;
"
