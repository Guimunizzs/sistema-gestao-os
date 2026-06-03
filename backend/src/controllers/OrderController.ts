import { Request, Response } from "express";
import pool from "../config/database";
import { CustomRequest } from "../middlewares/auth";

export class OrderController {
  async create(req: CustomRequest, res: Response) {
    // 1. Pegamos os campos exatamente como estão na sua tabela service_orders
    const {
      customer_id,
      equipment,
      brand,
      serial_number,
      description_problem,
    } = req.body;

    const technician_id = req.tokenData?.id;

    try {
      // 2. SQL Puro apontando para a tabela 'service_orders' e colunas corretas
      const sql = `
        INSERT INTO service_orders 
        (customer_id, equipment, brand, serial_number, description_problem, status, technician_id) 
        VALUES (?, ?, ?, ?, ?, 'aberta', ?)
      `;

      const params = [
        customer_id || null,
        equipment || null,
        brand || null,
        serial_number || null,
        description_problem || null,
        technician_id,
      ];

      const [result]: any = await pool.execute(sql, params);

      return res.status(201).json({
        message: "Ordem de Serviço aberta com sucesso!",
        orderId: result.insertId,
      });
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: "Erro ao abrir OS", detalhes: error.message });
    }
  }

  async listAll(req: Request, res: Response) {
    try {
      const sql = `SELECT so.*,
        c.name AS customer_name,
        c.phone AS customer_phone,
        c.email AS customer_email
        FROM service_orders so
        INNER JOIN customers c ON so.customer_id = c.id
        ORDER BY so.created_at DESC`;

      const [rows]: any = await pool.execute(sql);
      return res.json(rows);
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: "Erro ao listar OS", detalhes: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const sql = `
      SELECT 
        so.*, 
        c.name AS customer_name, 
        c.phone AS customer_phone, 
        c.email AS customer_email,
        c.document AS customer_document,
        c.address AS customer_address
      FROM service_orders so
      INNER JOIN customers c ON so.customer_id = c.id
      WHERE so.id = ?
    `;
      const [rows]: any = await pool.execute(sql, [id]);

      if (rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Ordem de Serviço não encontrada" });
      }
      return res.json(rows[0]);
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: "Erro ao buscar OS", detalhes: error.message });
    }
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { technical_report, status, total_value } = req.body;

    try {
      const sql = `
        UPDATE service_orders
        SET technical_report = ?, status = ?, total_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

      const params = [
        technical_report || null,
        status || null,
        total_value || null,
        id,
      ];

      const [result]: any = await pool.execute(sql, params);

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ error: "Ordem de Serviço não encontrada" });
      }

      return res.json({ message: "Ordem de Serviço atualizada com sucesso!" });
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: "Erro ao atualizar OS", detalhes: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const sql = "DELETE FROM service_orders WHERE id = ?";

      const [result]: any = await pool.execute(sql, [id]);

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ error: "Ordem de Serviço não encontrada" });
      }

      return res.json({ message: "Ordem de Serviço deletada com sucesso!" });
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: "Erro ao deletar OS", detalhes: error.message });
    }
  }
}
