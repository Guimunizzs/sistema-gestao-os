import { Request, Response } from "express";
import pool from "../config/database";
import { CustomRequest } from "../middlewares/auth";

export class OrderController {
  async create(req: CustomRequest, res: Response) {
    const {
      customer_id,
      equipment,
      brand,
      serial_number,
      description_problem,
    } = req.body;

    const technician_id = req.tokenData?.id;

    // Usamos uma conexão manual do pool para gerenciar a transação
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Abre a Ordem de Serviço
      const sqlOrder = `
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
        technician_id || null,
      ];

      const [result]: any = await connection.execute(sqlOrder, params);
      const newOrderId = result.insertId;

      // 2. Registra o histórico inicial de abertura na order_history
      if (technician_id) {
        const sqlHistory = `
          INSERT INTO order_history (order_id, technician_id, old_status, new_status, notes)
          VALUES (?, ?, ?, ?, ?)
        `;

        await connection.execute(sqlHistory, [
          newOrderId,
          technician_id,
          null, // Não havia status anterior (NULL)
          "aberta",
          "Ordem de Serviço aberta no sistema.",
        ]);
      }

      await connection.commit();

      return res.status(201).json({
        message: "Ordem de Serviço aberta com sucesso!",
        orderId: newOrderId,
      });
    } catch (error: any) {
      await connection.rollback();
      return res
        .status(500)
        .json({ error: "Erro ao abrir OS", detalhes: error.message });
    } finally {
      connection.release();
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

  async update(req: CustomRequest, res: Response) {
    const { id } = req.params;
    const { technical_report, status, total_value } = req.body;
    const technician_id = req.tokenData?.id;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Busca o status atual
      const [currentOrder]: any = await connection.execute(
        "SELECT status FROM service_orders WHERE id = ?",
        [id],
      );

      if (currentOrder.length === 0) {
        connection.release();
        return res
          .status(404)
          .json({ error: "Ordem de serviço não encontrada" });
      }

      const oldstatus = currentOrder[0].status;
      const newStatus = status || oldstatus;

      // 2. Atualiza a ordem de serviço principal
      const sqlUpdate = `
        UPDATE service_orders
        SET technical_report = ?, status = ?, total_value = ?, updated_at = CURRENT_TIMESTAMP, technician_id = ?
        WHERE id = ?
      `;

      await connection.execute(sqlUpdate, [
        technical_report || null,
        newStatus,
        total_value || null,
        technician_id || null,
        id,
      ]);

      // 3. Se o status mudou, gera o log na order_history
      if (oldstatus !== newStatus && technician_id) {
        const sqlHistory = `
          INSERT INTO order_history (order_id, technician_id, old_status, new_status, notes)
          VALUES (?, ?, ?, ?, ?)
        `;

        await connection.execute(sqlHistory, [
          id,
          technician_id,
          oldstatus,
          newStatus,
          technical_report
            ? `Laudo técnico: ${technical_report}`
            : "Status alterado pelo técnico.",
        ]);
      }

      await connection.commit();
      return res.json({ message: "Ordem de Serviço updated com sucesso!" });
    } catch (error: any) {
      await connection.rollback();
      return res
        .status(500)
        .json({ error: "Erro ao atualizar OS", detalhes: error.message });
    } finally {
      connection.release();
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

  async getDashboardStats(req: Request, res: Response) {
    try {
      const statusSql = `
      SELECT status, COUNT(*) as count
      FROM service_orders
      GROUP BY status
    `;
      const [statusRows]: any = await pool.execute(statusSql);

      const revenueSql = `
      SELECT SUM(total_value) as total_revenue
      FROM service_orders
      WHERE status IN ('finalizada', 'entregue')
    `;
      const [revenueRows]: any = await pool.execute(revenueSql);

      const stats = {
        aberta: 0,
        em_orcamento: 0,
        em_manutencao: 0,
        finalizada: 0,
        entregue: 0,
        faturamento: Number(revenueRows[0].total_revenue || 0),
      };

      statusRows.forEach((row: any) => {
        if (row.status in stats) {
          (stats as any)[row.status] = Number(row.count);
        }
      });

      return res.json(stats);
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: "Erro ao obter estatísticas", detalhes: error.message });
    }
  }
}
