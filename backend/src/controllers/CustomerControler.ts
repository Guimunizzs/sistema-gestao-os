import { Request, Response } from "express";
import pool from "../config/database";

export class CustomerController {
  async create(req: Request, res: Response) {
    const { name, phone, email, document, address } = req.body;

    try {
      const sql = `
        INSERT INTO customers (name, phone, email, document, address) 
        VALUES (?, ?, ?, ?, ?)`;

      const params = [
        name || null,
        phone || null,
        email || null,
        document || null,
        address || null,
      ];

      const [result]: any = await pool.execute(sql, params);

      return res.status(201).json({
        message: "Cliente criado com sucesso!",
        customerId: result.insertId,
      });
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        return res
          .status(400)
          .json({ error: "Este cliente ou documento já está cadastrado." });
      }
      return res
        .status(500)
        .json({ error: "Erro ao criar cliente", detalhes: error.message });
    }
  }

  async listAll(req: Request, res: Response) {
    try {
      const sql = "SELECT id, name FROM customers ORDER BY name ASC";
      const [rows]: any = await pool.execute(sql);
      return res.status(200).json(rows);
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: "Erro ao listar clientes", detalhes: error.message });
    }
  }
}
