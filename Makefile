.PHONY: help seed-local seed-remote dev dev-with-seed deploy deploy-with-seed query-users query-shops delete-shop

help:
	@echo "Usage:"
	@echo "  make seed-local        Seed data to local R2 and D1 databases"
	@echo "  make seed-remote       Seed data to remote R2 and D1 databases"
	@echo "  make query-users       Query all users from local D1 database"
	@echo "  make query-shops       Query all shops from local D1 database"
	@echo "  make delete-shop       Delete a shop from local D1 database by prompting for ID"
	@echo "  make dev               Run local dev server (wrangler pages dev)"
	@echo "  make dev-with-seed     Seed local databases and run local dev server"
	@echo "  make deploy            Build and deploy app to Cloudflare Pages"
	@echo "  make deploy-with-seed  Seed remote databases, build, and deploy app to Cloudflare Pages"

seed-local:
	npx tsx scripts/seed.ts

seed-remote:
	npx tsx scripts/seed.ts --remote

query-users:
	./scripts/query-users.sh

query-shops:
	./scripts/query-shops.sh

delete-shop:
	@read -p "Enter Shop ID to delete: " shop_id; \
	./scripts/delete-shop.sh $$shop_id

dev:
	pnpm dev:wrangler

dev-with-seed: seed-local dev

deploy:
	pnpm deploy

deploy-with-seed: seed-remote deploy



