
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
Assuming current directory is /Auction-Project/back-end

```bash
  cd services/kafka
```
Use docker compose to start kafka
```bash
  docker compose up --build
```

## Starting services
Assuming current directory is /Auction-Project/back-end

```bash
  cd services
```
Use docker compose to start all services
```bash
  docker compose up --build
```


## Starting middleware API-Gateway
Assuming current directory is /Auction-Project

```bash
  cd middleware/api-gateway
```
Use docker compose to start the api-gateway
```bash
  docker compose up --build
```

## Starting front-end
Assuming current directory is /Auction-Project

```bash
  cd front-end
```
Install dependencies
```bash
  npm install
```
Run project in development mode
```bash
  npm run dev
```
![image](https://github.com/user-attachments/assets/1959a631-6803-478e-b2f0-9856bbc48651)
