"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const database_1 = __importDefault(require("../config/database"));
class CustomerController {
    async create(req, res) {
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
            const [result] = await database_1.default.execute(sql, params);
            return res.status(201).json({
                message: "Cliente criado com sucesso!",
                customerId: result.insertId,
            });
        }
        catch (error) {
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
    async listAll(req, res) {
        try {
            const sql = "SELECT id, name FROM customers ORDER BY name ASC";
            const [rows] = await database_1.default.execute(sql);
            return res.status(200).json(rows);
        }
        catch (error) {
            return res
                .status(500)
                .json({ error: "Erro ao listar clientes", detalhes: error.message });
        }
    }
}
exports.CustomerController = CustomerController;
