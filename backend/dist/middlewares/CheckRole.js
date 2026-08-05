"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = checkRole;
function checkRole(allowedRoles) {
    return (req, res, next) => {
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
