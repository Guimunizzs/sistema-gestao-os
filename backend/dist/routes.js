"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = require("./controllers/UserController");
const OrderController_1 = require("./controllers/OrderController");
const CustomerControler_1 = require("./controllers/CustomerControler");
const auth_1 = require("./middlewares/auth");
const CheckRole_1 = require("./middlewares/CheckRole");
const router = (0, express_1.Router)();
const userController = new UserController_1.UserController();
const orderController = new OrderController_1.OrderController();
const customerController = new CustomerControler_1.CustomerController();
// Rotas para usuários
router.post("/register", (req, res) => userController.register(req, res));
router.post("/login", (req, res) => userController.login(req, res));
router.get("/users", auth_1.authMiddleware, (req, res) => userController.listAll(req, res));
router.post("/users", auth_1.authMiddleware, (0, CheckRole_1.checkRole)(["admin"]), (req, res) => userController.createByAdmin(req, res));
// Rotas para ordens de serviço
router.post("/orders", auth_1.authMiddleware, (req, res) => orderController.create(req, res));
router.get("/orders", auth_1.authMiddleware, (req, res) => orderController.listAll(req, res));
// Rotas para clientes
router.post("/customers", auth_1.authMiddleware, (req, res) => customerController.create(req, res));
router.get("/customers", auth_1.authMiddleware, (req, res) => customerController.listAll(req, res));
// Rota para atualizar OS
router.put("/orders/:id", auth_1.authMiddleware, (req, res) => orderController.update(req, res));
// Rota para obter OS por ID
router.get("/orders/:id", auth_1.authMiddleware, (req, res) => orderController.getById(req, res));
// Rota para deletar OS
router.delete("/orders/:id", auth_1.authMiddleware, (0, CheckRole_1.checkRole)(["admin"]), (req, res) => orderController.delete(req, res));
// Rota para obter estatísticas do dashboard
router.get("/dashboard/stats", auth_1.authMiddleware, (req, res) => orderController.getDashboardStats(req, res));
exports.default = router;
