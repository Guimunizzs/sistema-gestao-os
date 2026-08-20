"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const database_1 = __importDefault(require("../config/database"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class UserController {
    async createUser(username, email, password, role) {
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
        const params = [username, email, hashedPassword, role];
        const [result] = await database_1.default.execute(sql, params);
        return result.insertId;
    }
    async register(req, res) {
        const { username, password, email } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({
                error: "Dados incompletos",
                detalhes: "username, email e password são obrigatórios e não podem ser undefined.",
            });
        }
        try {
            const userId = await this.createUser(username, email, password, "tecnico");
            return res.status(201).json({
                message: "Usuário registrado com sucesso",
                userId,
            });
        }
        catch (error) {
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
    async createByAdmin(req, res) {
        const { username, password, email, role } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({
                error: "Dados incompletos",
                detalhes: "username, email e password são obrigatórios e não podem ser undefined.",
            });
        }
        try {
            const userId = await this.createUser(username, email, password, role || "tecnico");
            return res.status(201).json({
                message: "Usuário registrado com sucesso",
                userId,
            });
        }
        catch (error) {
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
    async login(req, res) {
        const { email, password } = req.body;
        try {
            const sql = "SELECT * FROM users WHERE email = ?";
            const [rows] = await database_1.default.execute(sql, [email]);
            if (rows.length === 0) {
                return res.status(400).json({ error: "Credenciais inválidas" });
            }
            const user = rows[0];
            const isMatch = await bcryptjs_1.default.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: "Credenciais inválidas" });
            }
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
            return res.json({ token });
        }
        catch (error) {
            return res
                .status(500)
                .json({ error: "Erro interno no servidor", detalhes: error.message });
        }
    }
    async listAll(req, res) {
        try {
            const sql = "SELECT id, name FROM users ORDER BY name ASC";
            const [rows] = await database_1.default.execute(sql);
            return res.json(rows);
        }
        catch (error) {
            return res
                .status(500)
                .json({
                error: "Erro ao listar usuários/técnicos",
                detalhes: error.message,
            });
        }
    }
}
exports.UserController = UserController;
