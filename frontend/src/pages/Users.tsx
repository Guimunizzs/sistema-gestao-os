import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "tecnico";
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Estado modal e formulario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "tecnico">("tecnico");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/users");
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      }
    } catch (error) {
      setError("Erro ao carregar usuários. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreateUser() {
    setFormError("");
    if (!userName || !userEmail || !password) {
      setFormError("Todos os campos são obrigatórios.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/register", {
        username: userName,
        email: userEmail,
        password,
        role,
      });

      setUserName("");
      setUserEmail("");
      setPassword("");
      setRole("tecnico");
      setIsModalOpen(false);
      loadUsers();
    } catch (error) {
      setFormError("Erro ao criar usuário. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );
  });

  const handleLogout = () => {
    localStorage.removeItem("@SistemaOS:token");
    window.location.href = "/";
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      {/* Barra Lateral */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold text-emerald-400 mb-8">FixOS</h2>
          <nav className="space-y-4">
            <Link
              to="/dashboard"
              className="block p-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              📊 Dashboard
            </Link>
            <Link
              to="/orders"
              className="block p-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              🔧 Ordens de Serviço
            </Link>
            <Link
              to="/customers"
              className="block p-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              👥 Clientes
            </Link>
            <Link
              to="/users"
              className="block p-3 rounded-lg bg-slate-800 text-emerald-400 font-medium"
            >
              🛡️ Equipe
            </Link>
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="w-full bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg hover:bg-red-500 hover:text-white transition-colors font-medium"
        >
          Sair do Sistema
        </button>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Equipe Técnica</h1>
            <p className="text-slate-400 mt-1">
              Gerencie os técnicos e administradores com acesso ao sistema.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-emerald-500/10"
          >
            + Novo Membro
          </button>
        </header>

        {/* Filtro Client-Side */}
        <div className="mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Buscar por nome ou e-mail do técnico..."
            className="w-full max-w-md rounded-lg bg-slate-900 border border-slate-800 p-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
          />
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-slate-400 font-medium animate-pulse">
            Carregando membros da equipe...
          </div>
        ) : (
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-sm font-medium">
                  <th className="p-4">Nome</th>
                  <th className="p-4">E-mail</th>
                  <th className="p-4">Nível de Acesso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4 font-medium text-white">{u.name}</td>
                    <td className="p-4 text-slate-400">{u.email}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${u.role === "admin" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"}`}
                      >
                        {u.role === "admin" ? "👑 Administrador" : "🛠️ Técnico"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* MODAL DE CADASTRO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateUser();
            }}
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl"
          >
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                Cadastrar Membro da Equipe
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {formError && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 text-center">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Nome do Usuário
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ex: joaotecnico"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  E-mail Corporativo
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="joao@fixos.com"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Senha de Acesso
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Nível de Permissão
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none"
                >
                  <option value="tecnico">
                    🛠️ Técnico (Acesso operacional)
                  </option>
                  <option value="admin">👑 Administrador (Acesso total)</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-800 text-slate-400 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400"
                >
                  {isSubmitting ? "Cadastrando..." : "Registrar Usuário"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
