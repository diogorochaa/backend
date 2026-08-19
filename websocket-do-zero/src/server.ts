import { WebSocketServer, WebSocket } from "ws";

import { UserManager } from "./users.js";
import type {
    ClientEvent,
    ServerEvent,
} from "./types.js";

const server = new WebSocketServer({
    port: 8080,
});

const users = new UserManager();

function send(
    socket: WebSocket,
    event: ServerEvent,
) {
    socket.send(JSON.stringify(event));
}

function broadcast(event: ServerEvent) {
    for (const user of users.getAll()) {
        if (user.socket.readyState === 1) {
            send(user.socket, event);
        }
    }
}

function broadcastExcept(
    userId: string,
    event: ServerEvent,
) {
    for (const user of users.getAll()) {
        if (
            user.id !== userId &&
            user.socket.readyState === 1
        ) {
            send(user.socket, event);
        }
    }
}

server.on("connection", (socket) => {
    const userId = users.add(socket);

    console.log(`Usuário conectado: ${userId}`);

    send(socket, {
        type: "connected",
        payload: {
            userId,
        },
    });

    broadcastExcept(userId, {
        type: "user.joined",
        payload: {
            userId,
        },
    });

    socket.on("message", (rawMessage) => {
        let message: ClientEvent;

        try {
            message = JSON.parse(
                rawMessage.toString(),
            ) as ClientEvent;
        } catch {
            send(socket, {
                type: "error",
                payload: {
                    message: "JSON inválido",
                },
            });

            return;
        }

        switch (message.type) {
            case "chat.message": {
                broadcast({
                    type: "chat.message",
                    payload: {
                        userId,
                        message: message.payload.message,
                    },
                });

                break;
            }

            case "private.message": {
                const target = users.get(
                    message.payload.targetUserId,
                );

                if (!target) {
                    send(socket, {
                        type: "error",
                        payload: {
                            message: "Usuário não encontrado",
                        },
                    });

                    return;
                }

                send(target.socket, {
                    type: "private.message",
                    payload: {
                        userId,
                        message: message.payload.message,
                    },
                });

                break;
            }

            case "user.list": {
                send(socket, {
                    type: "user.list",
                    payload: {
                        users: users.getIds(),
                    },
                });

                break;
            }
        }
    });

    socket.on("close", () => {
        users.remove(userId);

        console.log(`Usuário desconectado: ${userId}`);

        broadcast({
            type: "user.left",
            payload: {
                userId,
            },
        });
    });

    socket.on("error", (error) => {
        console.error(
            `Erro no usuário ${userId}:`,
            error,
        );
    });
});