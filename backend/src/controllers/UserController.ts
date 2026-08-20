import { Request, Response } from "express";
import pool from "../config/database";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class UserController {
  private async createUser(
    username: string,
    email: string,
    password: string,
    role: string,
  ) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const sql =
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
    const params = [username, email, hashedPassword, role];

    const [result]: any = await pool.execute(sql, params);
    return result.insertId;
  }

  async register(req: Request, res: Response) {
    const { username, password, email } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Dados incompletos",
        detalhes:
          "username, email e password são obrigatórios e não podem ser undefined.",
      });
    }

    try {
      const userId = await this.createUser(
        username,
        email,
        password,
        "tecnico",
      );

      return res.status(201).json({
        message: "Usuário registrado com sucesso",
        userId,
      });
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        return res
          .status(400)
          .json({ error: "Este e-mail já está cadastrado." });
      }

      return res
        .status(500)
        .json({ error: "Erro interno no servidor", detalhes: error.message });
    }
  }

  async createByAdmin(req: Request, res: Response) {
    const { username, password, email, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Dados incompletos",
        detalhes:
          "username, email e password são obrigatórios e não podem ser undefined.",
      });
    }

    try {
      const userId = await this.createUser(
        username,
        email,
        password,
        role || "tecnico",
      );

      return res.status(201).json({
        message: "Usuário registrado com sucesso",
        userId,
      });
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        return res
          .status(400)
          .json({ error: "Este e-mail já está cadastrado." });
      }

      return res
        .status(500)
        .json({ error: "Erro interno no servidor", detalhes: error.message });
    }
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
      const sql = "SELECT * FROM users WHERE email = ?";
      const [rows]: any = await pool.execute(sql, [email]);

      if (rows.length === 0) {
        return res.status(400).json({ error: "Credenciais inválidas" });
      }

      const user = rows[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ error: "Credenciais inválidas" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: "1h" },
      );

      return res.json({ token });
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: "Erro interno no servidor", detalhes: error.message });
    }
  }

  async listAll(req: Request, res: Response) {
    try {
      const sql = "SELECT id, name FROM users ORDER BY name ASC";
      const [rows]: any = await pool.execute(sql);

      return res.json(rows);
    } catch (error: any) {
      return res
        .status(500)
        .json({
          error: "Erro ao listar usuários/técnicos",
          detalhes: error.message,
        });
    }
  }
}
