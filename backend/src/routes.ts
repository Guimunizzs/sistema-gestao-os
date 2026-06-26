import { Router } from "express";
import { UserController } from "./controllers/UserController";
import { OrderController } from "./controllers/OrderController";
import { CustomerController } from "./controllers/CustomerControler";
import { authMiddleware } from "./middlewares/auth";
import { checkRole } from "./middlewares/CheckRole";

const router = Router();
const userController = new UserController();
const orderController = new OrderController();
const customerController = new CustomerController();

// Rotas para usuários
router.post("/register", (req, res) => userController.register(req, res));
router.post("/login", (req, res) => userController.login(req, res));
router.get("/users", authMiddleware, (req, res) =>
  userController.listAll(req, res),
);

// Rotas para ordens de serviço
router.post("/orders", authMiddleware, (req, res) =>
  orderController.create(req, res),
);
router.get("/orders", authMiddleware, (req, res) =>
  orderController.listAll(req, res),
);

// Rotas para clientes
router.post("/customers", authMiddleware, (req, res) =>
  customerController.create(req, res),
);

router.get("/customers", authMiddleware, (req, res) =>
  customerController.listAll(req, res),
);

// Rota para atualizar OS
router.put("/orders/:id", authMiddleware, (req, res) =>
  orderController.update(req, res),
);

// Rota para obter OS por ID
router.get("/orders/:id", authMiddleware, (req, res) =>
  orderController.getById(req, res),
);

// Rota para deletar OS
router.delete("/orders/:id", authMiddleware, checkRole(["admin"]), (req, res) =>
  orderController.delete(req, res),
);

export default router;
