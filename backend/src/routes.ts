import { Router } from "express";
import { UserController } from "./controllers/UserController";
import { OrderController } from "./controllers/OrderController";
import { CustomerController } from "./controllers/CustomerControler";

const router = Router();
const userController = new UserController();
const orderController = new OrderController();
const customerController = new CustomerController();

// Rotas para usuários
router.post("/register", (req, res) => userController.register(req, res));
router.post("/login", (req, res) => userController.login(req, res));

// Rotas para ordens de serviço
router.post("/orders", (req, res) => orderController.create(req, res));
router.get("/orders", (req, res) => orderController.listAll(req, res));

// Rotas para clientes
router.post("/customers", (req, res) => customerController.create(req, res));

export default router;
