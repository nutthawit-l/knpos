.PHONY: help seed seed-local seed-remote dev dev-with-seed deploy deploy-with-seed query-users query-shops delete-shop delete-products clear-local clear-remote

help:
	@echo "Usage:"
	@echo "  make seed-local        Seed data to local R2 and D1 databases"
	@echo "  make seed-remote       Seed data to remote R2 and D1 databases"
	@echo "  make query-users       Query all users from local D1 database"
	@echo "  make query-shops       Query all shops from local D1 database"
	@echo "  make delete-shop       Delete a shop from local D1 database by prompting for ID"
	@echo "  make delete-products   Delete all products from local D1 database"
	@echo "  make clear-local       Clear all data from local D1 database"
	@echo "  make clear-remote      Clear all data from remote D1 database"
	@echo "  make dev               Run local dev server & wrangler in separate tmux panes"
	@echo "  make dev-with-seed     Seed local databases and run local dev server"
	@echo "  make deploy            Build and deploy app to Cloudflare Pages"
	@echo "  make deploy-with-seed  Seed remote databases, build, and deploy app to Cloudflare Pages"

migrate:
	pnpm install && npx wrangler d1 execute charnipos-db --local --file=./schema.sql

remote-migrate:
	pnpm install && npx wrangler d1 execute charnipos-db --remote --file=./schema.sql

seed-products:
	npx tsx seed/seed-products.ts

remote-seed-products:
	npx tsx seed/seed-products.ts --remote

seed-events:
	npx tsx seed/seed-events.ts

remote-seed-events:
	npx tsx seed/seed-events.ts --remote

seed-shop:
	npx tsx seed/seed-shop.ts

remote-seed-shop:
	npx tsx seed/seed-shop.ts --remote


seed:
	$(MAKE) seed-shop
	npx tsx seed/check-db.ts
	$(MAKE) seed-products
	$(MAKE) seed-events

remote-seed:
	$(MAKE) remote-seed-shop
	npx tsx seed/check-db.ts --remote
	$(MAKE) remote-seed-products
	$(MAKE) remote-seed-events


dev:
	@if [ -n "$$TMUX" ]; then \
		PANE_ID=$$(tmux split-window -h -P -F '#{pane_id}' 'pnpm dev:wrangler'); \
		pnpm dev; \
		tmux kill-pane -t $$PANE_ID 2>/dev/null || true; \
	else \
		tmux kill-session -t knpos-dev 2>/dev/null || true; \
		tmux new-session -d -s knpos-dev 'pnpm dev; tmux kill-session -t knpos-dev'; \
		tmux split-window -h -t knpos-dev 'pnpm dev:wrangler; tmux kill-session -t knpos-dev'; \
		tmux attach-session -t knpos-dev; \
	fi

deploy:
	pnpm deploy
