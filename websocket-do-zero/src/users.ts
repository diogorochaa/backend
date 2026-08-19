import { randomUUID } from "node:crypto";
import type { WebSocket } from "ws";

export interface User {
    id: string;
    socket: WebSocket;
}

export class UserManager {
    private users = new Map<string, User>();

    add(socket: WebSocket) {
        const id = randomUUID();

        this.users.set(id, {
            id,
            socket,
        });

        return id;
    }

    remove(id: string) {
        this.users.delete(id);
    }

    get(id: string) {
        return this.users.get(id);
    }

    getAll() {
        return [...this.users.values()];
    }

    getIds() {
        return [...this.users.keys()];
    }
}