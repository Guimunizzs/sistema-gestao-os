import { Response, NextFunction } from "express";
import { CustomRequest } from "./auth";

export function checkRole(allowedRoles: string[]) {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.tokenData) {
      return res
        .status(401)
        .json({ error: "Token de autenticação não fornecido" });
    }

    const { role } = req.tokenData;

    if (!allowedRoles.includes(role)) {
      return res
        .status(403)
        .json({
          error: "Acesso negado: permissão insuficiente",
          detalhes: "Você não tem permissão para acessar este recurso",
        });
    }

    return next();
  };
}
