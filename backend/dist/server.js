"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = __importDefault(require("./config/database"));
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(routes_1.default);
app.get("/health", async (_req, res) => {
    try {
        // No mysql2 com TS, o retorno é um array onde o primeiro item são as linhas (rows)
        const [rows] = await database_1.default.execute('SELECT "Servidor e Banco OK" AS status');
        res.json(rows[0]);
    }
    catch (error) {
        res.status(500).json({ erro: "Erro no banco", detalhes: error.message });
    }
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Servidor TypeScript rodando na porta ${PORT}`);
});
