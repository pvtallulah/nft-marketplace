#!/usr/bin/env bash

echo "Creating MongoDB user..."
echo "MongoDB database: $MONGO_DB"
echo "MongoDB user: $MONGO_USER"

# MongoDB commands to create a user
mongosh admin --host localhost -u $MONGO_INITDB_ROOT_USERNAME -p $MONGO_INITDB_ROOT_PASSWORD --eval "
  db = db.getSiblingDB('$MONGO_DB');
  db.createUser({
    user: '$MONGO_USER',
    pwd: '$MONGO_PASSWORD',
    roles: [{role: 'readWrite', db: '$MONGO_DB'}]
  });
  disableTelemetry();
"

echo "MongoDB user created."
