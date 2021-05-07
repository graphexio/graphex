#!/bin/bash
if ! [ -z "$DATABASE_HOST" ]; then
  ./docker/wait_for_it.sh "${DATABASE_HOST}:${DATABASE_PORT}" -- echo "[info]: PostgreSQL is up at ${DATABASE_HOST} on ${DATABASE_PORT}"
  if ! [ -z "$DOCKER_RUN_MIGRATIONS" ]; then
    echo "[info]: Running DB migrations"
    yarn run db:migrate && echo "[Info]: Migration completed successfully"

    if [ $? -ne 0 ]; then
        exit 1;
    fi
  fi
fi

if ! [ -z "$ACCESS_CONTROL_REDIS_HOST" ]; then
  ./docker/wait_for_it.sh "${ACCESS_CONTROL_REDIS_HOST}:${ACCESS_CONTROL_REDIS_PORT}" -- echo "[info]: Redis is up at ${ACCESS_CONTROL_REDIS_HOST} on ${ACCESS_CONTROL_REDIS_PORT}"
fi

echo "[info]: Starting application with command - \"${DOCKER_COMMAND}\""
${DOCKER_COMMAND}
