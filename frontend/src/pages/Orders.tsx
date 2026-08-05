import { useEffect, useState } from "react";
import api from "../services/api";

interface Order {
  id: number;
  customer_id: number;
  equipment: string;
  brand?: string;
  serial_number?: string;
  description_problem: string;
  technical_report?: string;
  status:
    | "aberta"
    | "em_orcamento"
    | "em_manutencao"
    | "finalizada"
    | "entregue";
  total_value?: number;
  created_at: string;
  updated_at: string;
  technician_id?: number;
  cliente_nome?: string;
}

interface Customer {
  id: number;
  name: string;
}

interface Technician {
  id: number;
  name?: string;
  username?: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Estados do Modal de Cadastro
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [equipment, setEquipment] = useState("");
  const [descriptionProblem, setDescriptionProblem] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados do Modal de Edição Técnica
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editTechnicalReport, setEditTechnicalReport] = useState("");
  const [editTotalValue, setEditTotalValue] = useState("");
  const [editTechnicianId, setEditTechnicianId] = useState("");
  const [editStatus, setEditStatus] = useState<Order["status"]>("aberta");

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

  useEffect(() => {
    async function initPage() {
      try {
        setLoading(true);
        setError("");

        const [ordersRes, customersRes, techniciansRes] = await Promise.all([
          api.get("/orders"),
          api.get("/customers"),
          api.get("/users").catch(() => ({ data: [] })),
        ]);

        if (Array.isArray(ordersRes.data)) setOrders(ordersRes.data);
        if (Array.isArray(customersRes.data)) setCustomers(customersRes.data);
        if (Array.isArray(techniciansRes.data)) setTechnicians(techniciansRes.data);
      } catch (err) {
        setError("Erro ao carregar dados do sistema.");
      } font-medium {
        setLoading(false);
      }
    }

    initPage();
  }, []);

  function handleOpenEditModal(order: Order) {
    setEditingOrder(order);
    setEditTechnicalReport(order.technical_report || "");
    setEditTotalValue(order.total_value ? String(order.total_value) : "");
    setEditTechnicianId(order.technician_id ? String(order.technician_id) : "");
    setEditStatus(order.status);
    setFormError("");
  }

  async function handleSaveEditOrder() {
    if (!editingOrder) return;

    try {
      setIsSubmitting(true);

      await api.put(`/orders/${editingOrder.id}`, {
        customer_id: editingOrder.customer_id,
        equipment: editingOrder.equipment,
        description_problem: editingOrder.description_problem,
        technical_report: editTechnicalReport || null,
        total_value: editTotalValue ? Number(editTotalValue) : null,
        technician_id: editTechnicianId ? Number(editTechnicianId) : null,
        status: editStatus,
      });

      setEditingOrder(null);
      loadOrders();
    } catch (err: any) {
      setFormError("Erro ao atualizar os detalhes da ordem de serviço.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateStatus(
    orderId: number,
    currentOrder: Order,
    newStatus: Order["status"]
  ) {
    try {
      await api.put(`/orders/${orderId}`, {
        customer_id: currentOrder.customer_id,
        equipment: currentOrder.equipment,
        description_problem: currentOrder.description_problem,
        technical_report: currentOrder.technical_report,
        total_value: currentOrder.total_value,
        technician_id: currentOrder.technician_id,
        status: newStatus,
      });
      loadOrders();
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  }

  async function handleCreateOrder() {
    setFormError("");
    if (!selectedCustomerId || !equipment || !descriptionProblem) {
      setFormError("Por favor, preencha todos os campos.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/orders", {
        customer_id: Number(selectedCustomerId),
        equipment,
        description_problem: descriptionProblem,
        status: "aberta",
      });
      setSelectedCustomerId("");
      setEquipment("");
      setDescriptionProblem("");
      setIsModalOpen(false);
      loadOrders();
    } catch (err: any) {
      setFormError("Erro ao criar ordem de serviço.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("@SistemaOS:token");
    window.location.href = "/";
  }

  const filteredOrders = orders.filter((os) => {
    const term = searchTerm.toLowerCase();
    return (
      os.id.toString().includes(term) ||
      os.equipment.toLowerCase().includes(term) ||
      (os.description_problem &&
        os.description_problem.toLowerCase().includes(term))
    );
  });

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
              href="/users"
              className="block p-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              👤 Usuários
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
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            + Nova Ordem
          </button>
        </header>

        {/* Alerta de erro global */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400">
            {error}
          </div>
        )}

        <div className="mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Buscar por ID da OS, equipamento ou defeito..."
            className="w-full max-w-md rounded-lg bg-slate-900 border border-slate-800 p-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
          />
        </div>

        {loading ? (
          <div className="text-slate-400 font-medium animate-pulse">
            Carregando ordens...
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
                  <th className="p-4">Valor</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredOrders.map((os) => (
                  <tr
                    key={os.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4 font-mono text-emerald-400">#{os.id}</td>
                    <td className="p-4 font-medium text-white">
                      {os.equipment}
                    </td>
                    <td className="p-4 max-w-xs truncate text-slate-400">
                      {os.description_problem}
                    </td>
                    <td className="p-4">
                      <select
                        value={os.status}
                        onChange={(e) =>
                          handleUpdateStatus(os.id, os, e.target.value as any)
                        }
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                      >
                        <option value="aberta">🔹 Aberta</option>
                        <option value="em_orcamento">📋 Em Orçamento</option>
                        <option value="em_manutencao">🛠️ Em Manutenção</option>
                        <option value="finalizada">✅ Finalizada</option>
                        <option value="entregue">📦 Entregue</option>
                      </select>
                    </td>
                    <td className="p-4 text-sm font-mono text-emerald-500">
                      {os.total_value
                        ? `R$ ${Number(os.total_value).toFixed(2)}`
                        : "---"}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenEditModal(os)}
                        className="text-emerald-400 hover:underline text-sm font-medium"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* MODAL DE CADASTRO DE NOVA OS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateOrder();
            }}
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl"
          >
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                Abrir Nova Ordem de Serviço
              </h2>
              <button
                type="button"
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

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Cliente *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="">
                    Selecione o cliente dono do aparelho...
                  </option>
                  {customers.map((cli) => (
                    <option key={cli.id} value={cli.id}>
                      {cli.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Aparelho / Equipamento *
                </label>
                <input
                  type="text"
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  placeholder="Ex: iPhone 13 Pro Max ou Notebook Dell"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Defeito Relatado *
                </label>
                <textarea
                  value={descriptionProblem}
                  onChange={(e) => setDescriptionProblem(e.target.value)}
                  placeholder="Ex: Não liga após queda ou tela piscando verde..."
                  rows={3}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 mt-6 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Abrindo..." : "Abrir OS"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE EDIÇÃO TÉCNICA DA OS */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveEditOrder();
            }}
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl"
          >
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                Editar OS #{editingOrder.id}
              </h2>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
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

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Status da OS
                </label>
                <select
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value as Order["status"])
                  }
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="aberta">🔹 Aberta</option>
                  <option value="em_orcamento">📋 Em Orçamento</option>
                  <option value="em_manutencao">🛠️ Em Manutenção</option>
                  <option value="finalizada">✅ Finalizada</option>
                  <option value="entregue">📦 Entregue</option>
                </select>
              </div>

              {/* Seleção do Técnico Responsável */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Técnico Responsável
                </label>
                <select
                  value={editTechnicianId}
                  onChange={(e) => setEditTechnicianId(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="">Nenhum técnico atribuído</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name || tech.username || `Técnico #${tech.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Valor do Serviço */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Valor Total (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editTotalValue}
                  onChange={(e) => setEditTotalValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Laudo Técnico */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Laudo Técnico / Diagnóstico
                </label>
                <textarea
                  value={editTechnicalReport}
                  onChange={(e) => setEditTechnicalReport(e.target.value)}
                  placeholder="Descreva o que foi reparado ou peças trocadas..."
                  rows={3}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 mt-6 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}