import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const pool = mysql.createPool({
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

export default pool;
