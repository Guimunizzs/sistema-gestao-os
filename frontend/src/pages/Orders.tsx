import React, { useEffect, useState } from "react";
import api from "../services/api";

interface Order {
  id: number;
  id_cliente: number;
  id_tecnico?: number;
  equipamento: string;
  defeito: string;
  status: "aberto" | "em_manutencao" | "finalizado";
  valor_total?: number;
  created_at: string;
  cliente_nome?: string;
}

interface Customer {
  id: number;
  name: string; // Casando perfeitamente com o seu MySQL
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estados do Modal e Formulário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [defeito, setDefeito] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carrega as ordens silenciadas (após salvar uma nova OS)
  async function loadOrders() {
    try {
      const response = await api.get("/orders");
      if (Array.isArray(response.data)) {
        setOrders(response.data);
      }
    } catch (err) {
      setError("Erro ao carregar ordens.");
    }
  }

  // Carregamento Inicial Seguro
  useEffect(() => {
    async function initPage() {
      try {
        setLoading(true);
        setError("");

        // 1. Garante o carregamento das ordens primeiro
        const ordersRes = await api.get("/orders");
        if (Array.isArray(ordersRes.data)) {
          setOrders(ordersRes.data);
        }
      } catch (err) {
        setError("Erro ao carregar ordens de serviço.");
      } finally {
        setLoading(false);
      }

      try {
        // 2. Busca os clientes na rota em inglês correta agora que adicionamos o GET
        const customersRes = await api.get("/customers");
        if (Array.isArray(customersRes.data)) {
          setCustomers(customersRes.data);
        }
      } catch (err) {
        console.error(
          "Aviso: Rota de clientes /customers ainda não respondeu.",
        );
      }
    }

    initPage();
  }, []);

  async function handleCreateOrder() {
    setFormError("");

    if (!selectedCustomerId || !equipamento || !defeito) {
      setFormError("Por favor, preencha todos os campos.");
      return;
    }

    try {
      setIsSubmitting(true);

      await api.post("/orders", {
        id_cliente: Number(selectedCustomerId),
        equipamento,
        defeito,
        status: "aberto",
      });

      setSelectedCustomerId("");
      setEquipamento("");
      setDefeito("");
      setIsModalOpen(false);

      loadOrders(); // Recarrega a tabela
    } catch (err: any) {
      const msg =
        err.response?.data?.error || "Erro ao criar ordem de serviço.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("@SistemaOS:token");
    window.location.href = "/";
  }

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      {/* Barra Lateral */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold text-emerald-400 mb-8">FixOS</h2>
          <nav className="space-y-4">
            <a
              href="/dashboard"
              className="block p-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              📊 Dashboard
            </a>
            <a
              href="/orders"
              className="block p-3 rounded-lg bg-slate-800 text-emerald-400 font-medium"
            >
              🔧 Ordens de Serviço
            </a>
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
            <h1 className="text-3xl font-bold">Ordens de Serviço</h1>
            <p className="text-slate-400 mt-1">
              Gerencie e acompanhe os chamados de manutenção.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-emerald-500/10"
          >
            + Nova Ordem
          </button>
        </header>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-slate-400 font-medium animate-pulse">
            Carregando ordens de serviço...
          </div>
        ) : (
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-sm font-medium">
                  <th className="p-4">ID</th>
                  <th className="p-4">Equipamento</th>
                  <th className="p-4">Defeito</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Data</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {orders.map((os) => (
                  <tr
                    key={os.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4 font-mono text-emerald-400">#{os.id}</td>
                    <td className="p-4 font-medium text-white">
                      {os.equipamento}
                    </td>
                    <td className="p-4 max-w-xs truncate text-slate-400">
                      {os.defeito}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                        ${os.status === "aberto" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : ""}
                        ${os.status === "em_manutencao" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : ""}
                        ${os.status === "finalizado" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : ""}
                      `}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full 
                          ${os.status === "aberto" ? "bg-blue-400" : ""}
                          ${os.status === "em_manutencao" ? "bg-amber-400" : ""}
                          ${os.status === "finalizado" ? "bg-emerald-400" : ""}
                        `}
                        />
                        {os.status === "em_manutencao"
                          ? "em manutenção"
                          : os.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {new Date(os.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-slate-400 hover:text-emerald-400 p-1 font-medium transition-colors text-sm">
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}

                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-slate-500">
                      Nenhuma ordem de serviço encontrada no banco de dados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* MODAL DE CADASTRO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                Cadastrar Nova OS
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors text-lg"
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

              {/* Seleção do Cliente */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Cliente
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="">Selecione um cliente...</option>
                  {customers.map((cli) => (
                    <option key={cli.id} value={cli.id}>
                      {cli.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Input Equipamento */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Equipamento
                </label>
                <input
                  type="text"
                  value={equipamento}
                  onChange={(e) => setEquipamento(e.target.value)}
                  placeholder="Ex: iPhone 13 Pro Max, Notebook Dell"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder-slate-600"
                />
              </div>

              {/* Input Defeito */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Defeito Relatado
                </label>
                <textarea
                  value={defeito}
                  onChange={(e) => setDefeito(e.target.value)}
                  placeholder="Descreva detalhadamente o problema..."
                  rows={3}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder-slate-600 resize-none"
                />
              </div>

              {/* Botões do Modal */}
              <div className="flex gap-3 mt-6 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateOrder}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Salvando..." : "Salvar Ordem"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
