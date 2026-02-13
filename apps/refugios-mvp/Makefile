APP_NAME=refugios-mvp

.PHONY: help install migrate seed dev start bootstrap check clean docker-build docker-up docker-down tunnel

help:
	@echo "Targets disponibles:"
	@echo "  make install     - instala dependencias"
	@echo "  make migrate     - ejecuta migraciones SQL"
	@echo "  make seed        - carga datos demo"
	@echo "  make dev         - ejecuta en modo desarrollo"
	@echo "  make start       - ejecuta en modo produccion"
	@echo "  make bootstrap   - install + migrate + seed"
	@echo "  make check       - valida sintaxis de JS"
	@echo "  make docker-build- construye imagen Docker"
	@echo "  make docker-up   - levanta app con Docker Compose"
	@echo "  make docker-down - baja contenedor"
	@echo "  make tunnel      - expone localhost:3000 con TryCloudflare"
	@echo "  make clean       - elimina node_modules"

install:
	npm install

migrate:
	npm run db:migrate

seed:
	npm run db:seed

dev:
	npm run dev

start:
	npm run start

bootstrap: install migrate seed

check:
	node --check src/server.js
	node --check src/app.js
	node --check src/routes/users.js
	node --check src/routes/guests.js
	node --check src/routes/reservations.js
	node --check src/routes/sales.js
	node --check src/routes/expenses.js
	node --check src/routes/documents.js
	node --check src/routes/dashboard.js
	node --check public/main.js
	node --check scripts/migrate.mjs
	node --check scripts/seed.mjs
	node --check scripts/import-historical.mjs

docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

tunnel:
	cloudflared tunnel --url http://localhost:3000

clean:
	rm -rf node_modules
