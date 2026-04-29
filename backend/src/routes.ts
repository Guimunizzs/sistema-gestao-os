import { Router } from "express";
import { UserController } from "./controllers/UserController";

const router = Router();
const userController = new UserController();

router.post("/register", (req, res) => userController.register(req, res));

export default router;
