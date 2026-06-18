/**
 * Registro de rotas públicas do gateway.
 * Ao criar um MS com `pnpm create:service --http`, adicione um *ProxyController aqui.
 *
 * Serviços events-only (--consumer-only) não entram nesta lista.
 */
export const PUBLIC_HTTP_SERVICES = [
  {
    path: "users",
    envKey: "USERS_SERVICE_URL",
    defaultUrl: "http://localhost:3000",
  },
] as const;
