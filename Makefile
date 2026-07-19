all: start

start:
	docker-compose up -d --build

dev:
	docker-compose -f docker-compose.dev.yml up -d --build

up:
	docker-compose up -d

build:
	docker-compose build

down:
	docker-compose down

re:
	docker-compose down
	docker-compose build
	docker-compose up -d

clean:
	docker-compose down -v --remove-orphans