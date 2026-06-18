#!/bin/bash
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname postgres <<-EOSQL
	SELECT 'CREATE DATABASE users_db'
	WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'users_db')\gexec

	SELECT 'CREATE DATABASE orders_db'
	WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'orders_db')\gexec

	SELECT 'CREATE DATABASE auth_db'
	WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'auth_db')\gexec

	SELECT 'CREATE DATABASE billing_db'
	WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'billing_db')\gexec

	SELECT 'CREATE DATABASE notification_db'
	WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'notification_db')\gexec
EOSQL
