
# Auction Project

A simple auction service built using microservices and horizontally scalable

## Run Locally

Go to the back-end directory in auction project

```bash
  cd Auction-Project/back-end
```

## Starting databases first

Running Postgres

```bash
  cd databases/postgres
```
Use docker compose to start postgres
```bash
  docker compose up --build
```

Running Redis

```bash
  cd databases/redis
```
Use docker compose to start redis
```bash
  docker compose up --build
```

## Starting Kafka message queue
Assuming current directory is Auction-Project/back-end

```bash
  cd services/kafka
```
Use docker compose to start kafka
```bash
  docker compose up --build
```

## Starting services
Assuming current directory is Auction-Project/back-end

```bash
  cd services
```
Use docker compose to start all services
```bash
  docker compose up --build
```