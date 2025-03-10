#!/bin/bash


until pg_isready -U postgres; do
  sleep 2
done



DATABASES=("users" "auctions" "orders")
SCRIPTS=("users_schema.sql" "auctions_schema.sql" "order_schema.sql")

for i in "${!DATABASES[@]}"
do
    DB="${DATABASES[$i]}"
    SCRIPT="${SCRIPTS[$i]}"
    
    echo "Running script $SCRIPT on database: $DB"
    psql -U postgres -d $DB -f ../schema/$SCRIPT
done
