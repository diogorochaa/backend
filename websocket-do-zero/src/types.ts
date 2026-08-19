export type ClientEvent =
    | {
        type: "chat.message";
        payload: {
            message: string;
        };
    }
    | {
        type: "private.message";
        payload: {
            targetUserId: string;
            message: string;
        };
    }
    | {
        type: "user.list";
    };

export type ServerEvent =
    | {
        type: "connected";
        payload: {
            userId: string;
        };
    }
    | {
        type: "chat.message";
        payload: {
            userId: string;
            message: string;
        };
    }
    | {
        type: "private.message";
        payload: {
            userId: string;
            message: string;
        };
    }
    | {
        type: "user.joined";
        payload: {
            userId: string;
        };
    }
    | {
        type: "user.left";
        payload: {
            userId: string;
        };
    }
    | {
        type: "user.list";
        payload: {
            users: string[];
        };
    }
    | {
        type: "error";
        payload: {
            message: string;
        };
    };