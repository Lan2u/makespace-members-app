.phony: check clear-containers dev fix lint prod release smoketest test typecheck unused-exports watch-typecheck

check: test lint typecheck unused-exports

node_modules: package.json package-lock.json
	npm install
	touch node_modules

dev:
	docker-compose --file docker-compose.yaml --file docker-compose.dev.yaml up --build

fix: node_modules
	npx gts fix

prod:
	docker-compose --file docker-compose.yaml up --build

test: node_modules
	npx jest

smoketest:
	./smoketest.sh

lint: node_modules
	npx gts lint --fix

unused-exports: node_modules
	npx ts-unused-exports ./tsconfig.json

typecheck: node_modules
	npx tsc --noEmit

watch-typecheck: node_modules
	npx tsc --noEmit --watch

clear-containers:
	docker-compose --file docker-compose.yaml --file docker-compose.dev.yaml down

release: export TAG = latest/$(shell date +%Y%m%d%H%M)
release:
	git tag $$TAG
	git push origin $$TAG