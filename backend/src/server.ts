import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import pool from "./config/database.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', async (_req: Request, res: Response) => {
  try {
    // No mysql2 com TS, o retorno é um array onde o primeiro item são as linhas (rows)
    const [rows]: any = await pool.execute('SELECT "Servidor e Banco OK" AS status');
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ erro: "Erro no banco", detalhes: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor TypeScript rodando na porta ${PORT}`);
});