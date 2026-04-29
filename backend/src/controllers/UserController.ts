import { Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcryptjs';

export class UserController {
  async register(req: Request, res: Response) {
    const { username, password, email, role } = req.body;

    try{
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const sql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
      const params = [username, email, hashedPassword, role || 'tecnico'];

      const [result]: any = await pool.execute(sql, params);

      return res.status(201).json({ message: 'Usuário registrado com sucesso', userId: result.insertId });

    } catch (error: any) {// Tratamento de erro específico para e-mail duplicado
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
      }

      return res.status(500).json({ error: 'Erro interno no servidor', detalhes: error.message });
     }
   }
  }