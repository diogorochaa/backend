#!/usr/bin/env bash
set -euo pipefail

# Uso: prisma-studio.sh users | orders
DOMAIN="${1:-users}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ROOT}/docker/.env"
PKG_DIR="${ROOT}/packages/database/${DOMAIN}"

if [[ ! -d "${PKG_DIR}" ]]; then
  echo "Pacote não encontrado: packages/database/${DOMAIN}"
  exit 1
fi

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "${ENV_FILE}"
  set +a
fi

VAR_NAME="$(echo "${DOMAIN}" | tr '[:lower:]' '[:upper:]')_DATABASE_URL"
URL="${!VAR_NAME:-}"

if [[ -z "${URL}" ]]; then
  echo "Defina ${VAR_NAME} em docker/.env (cp docker/.env.example docker/.env)"
  exit 1
fi

export "${VAR_NAME}=${URL}"

cd "${PKG_DIR}"
echo "Prisma Studio → ${DOMAIN}_db (${VAR_NAME})"
echo "Se aparecer ERR_STREAM_UNABLE_TO_PIPE no terminal, ignore: bug cosmético do Prisma 7."
echo "Abra a URL exibida abaixo no navegador."
exec pnpm exec prisma studio
