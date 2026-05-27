
import { Request, Response } from 'express';
import pool from '../config/database';

export class OrderController {
  async create(req: Request, res: Response) {
    // 1. Pegamos os campos exatamente como estão na sua tabela service_orders
    const { 
      customer_id, 
      equipment, 
      brand, 
      serial_number, 
      description_problem 
    } = req.body;

    try {
      // 2. SQL Puro apontando para a tabela 'service_orders' e colunas corretas
      const sql = `
        INSERT INTO service_orders 
        (customer_id, equipment, brand, serial_number, description_problem, status) 
        VALUES (?, ?, ?, ?, ?, 'aberta')
      `;
      
      const params = [
        customer_id || null, 
        equipment || null, 
        brand || null, 
        serial_number || null, 
        description_problem || null
      ];

      const [result]: any = await pool.execute(sql, params);

      return res.status(201).json({
        message: 'Ordem de Serviço aberta com sucesso!',
        orderId: result.insertId
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao abrir OS', detalhes: error.message });
    }
  }

  async listAll(req: Request, res: Response) {
    try {
      // 3. Busca direto na tabela correta
      const [rows] = await pool.execute('SELECT * FROM service_orders');
      return res.json(rows);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao listar OS', detalhes: error.message });
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
          id
        ];

        const [result]: any = await pool.execute(sql, params);

        if (result.affectedRows === 0) {
          return res.status(404).json({ error:
            'Ordem de Serviço não encontrada'
          });
        }

        return res.json({ message: 'Ordem de Serviço atualizada com sucesso!'});

    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao atualizar OS', detalhes: error.message });
    }
  }
}