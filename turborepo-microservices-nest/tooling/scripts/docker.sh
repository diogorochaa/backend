#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="${ROOT}/docker/docker-compose.yml"
ENV_FILE="${ROOT}/docker/.env"

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

compose() {
  if [[ -f "${ENV_FILE}" ]]; then
    docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" "$@"
  else
    docker compose -f "${COMPOSE_FILE}" "$@"
  fi
}

cmd="${1:-}"
profile="${2:-infra}"

case "${cmd}" in
  up)
    if [[ "${profile}" == "all" ]]; then
      compose --profile infra --profile messaging up -d --wait
    else
      compose --profile "${profile}" up -d --wait
    fi
    ;;
  down)
    compose --profile infra --profile messaging --profile all --profile users --profile orders down --remove-orphans
    ;;
  logs)
    compose logs -f "${profile}"
    ;;
  ps)
    compose ps -a
    ;;
  *)
    echo "Uso: $0 {up|down|logs|ps} [profile]"
    echo "Perfis: infra | messaging | all | users | orders | auth | billing | notification"
    exit 1
    ;;
esac
