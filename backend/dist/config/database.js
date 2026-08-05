"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function getEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
const pool = promise_1.default.createPool({
    host: getEnv("DB_HOST"),
    port: Number(getEnv("DB_PORT")), // <-- Adicionado para ler a porta dinâmica do Aiven
    user: getEnv("DB_USER"),
    password: getEnv("DB_PASSWORD"),
    database: getEnv("DB_NAME"),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // ADICIONE ESTE BLOCO AQUI PARA O SSL EXIGIDO PELO AIVEN:
    ssl: {
        rejectUnauthorized: false,
    },
});
exports.default = pool;
