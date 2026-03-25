#!/usr/bin/env bash

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 {data_01_mapping|data_02_aggregates|data_03_status_split|dash_01_default_window}" >&2
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL must be set" >&2
  exit 1
fi

TEST_NAME="$1"

case "$TEST_NAME" in
  data_01_mapping)
    ASSERTION_FILE="sql/tests/data_01_mapping.sql"
    ;;
  data_02_aggregates)
    ASSERTION_FILE="sql/tests/data_02_aggregates.sql"
    ;;
  data_03_status_split)
    ASSERTION_FILE="sql/tests/data_03_status_split.sql"
    ;;
  dash_01_default_window)
    ASSERTION_FILE="sql/tests/dash_01_default_window.sql"
    ;;
  *)
    echo "Unknown test: $TEST_NAME" >&2
    exit 1
    ;;
esac

for sql_file in sql/migrations/*.sql; do
  if [ -f "$sql_file" ]; then
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$sql_file"
  fi
done

for sql_file in sql/staging/*.sql; do
  if [ -f "$sql_file" ]; then
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$sql_file"
  fi
done

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/tests/fixtures/phase_01_seed.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$ASSERTION_FILE"
