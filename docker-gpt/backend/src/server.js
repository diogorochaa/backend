import express from "express";
import cors from "cors";
import pg from "pg";

const { Pool } = pg;

const app = express();

app.use(cors());

const pool = new Pool({
    host: process.env.DATABASE_HOST || "localhost",
    port: Number(process.env.DATABASE_PORT || 5432),
    database: process.env.DATABASE_NAME || "app",
    user: process.env.DATABASE_USER || "postgres",
    password: process.env.DATABASE_PASSWORD || "postgres",
});

app.get("/", (req, res) => {
    res.json({
        message: "Backend funcionando!",
    });
});

app.get("/health", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            status: "ok",
            database: "connected",
            databaseTime: result.rows[0].now,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: "error",
            database: "disconnected",
            message: error.message,
        });
    }
});

app.listen(4000, "0.0.0.0", () => {
    console.log("Backend running on port 4000");
});