import React, { useEffect, useState } from "react";
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
  name: string; // Ajuste se no seu banco for 'username' ou 'nome'
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  // Recarrega as ordens na tabela
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

  // Carregamento Inicial Seguro (Ordens, Clientes e Técnicos)
  useEffect(() => {
    async function initPage() {
      try {
        setLoading(true);
        setError("");

        const [ordersRes, customersRes, techniciansRes] = await Promise.all([
          api.get("/orders"),
          api.get("/customers"),
          api.get("/users").catch(() => ({ data: [] })), // Fallback seguro se não tiver a rota de usuários ainda
        ]);

        if (Array.isArray(ordersRes.data)) setOrders(ordersRes.data);
        if (Array.isArray(customersRes.data)) setCustomers(customersRes.data);
        if (Array.isArray(techniciansRes.data))
          setTechnicians(techniciansRes.data);
      } catch (err) {
        setError("Erro ao carregar dados do sistema.");
      } finally {
        setLoading(false);
      }
    }

    initPage();
  }, []);

  // Abrir modal de edição pré-preenchendo os dados da OS selecionada
  function handleOpenEditModal(order: Order) {
    setEditingOrder(order);
    setEditTechnicalReport(order.technical_report || "");
    setEditTotalValue(order.total_value ? String(order.total_value) : "");
    setEditTechnicianId(order.technician_id ? String(order.technician_id) : "");
    setEditStatus(order.status);
    setFormError("");
  }

  // Salvar a edição completa da OS (Laudo, Valor, Técnico e Status)
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

  // Função inline rápida apenas para mudar o status pelo select da tabela
  async function handleUpdateStatus(
    orderId: number,
    currentOrder: Order,
    newStatus: Order["status"],
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
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            + Nova Ordem
          </button>
        </header>

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
                {orders.map((os) => (
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

      {/* MODAL DE CADASTRO (Omitido aqui por espaço, permanece igual ao seu anterior) */}

      {/* MODAL DE EDIÇÃO TÉCNICA (Aparece se editingOrder não for null) */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveEditOrder();
            }}
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl"
          >
            <div className="mb-4 flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-xl font-bold text-white">
                Editar OS #{editingOrder.id}
              </h2>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <strong>Aparelho:</strong> {editingOrder.equipment} <br />
                <strong>Defeito inicial:</strong>{" "}
                {editingOrder.description_problem}
              </p>

              {/* Seleção do Técnico Responsável */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Técnico Responsável
                </label>
                <select
                  value={editTechnicianId}
                  onChange={(e) => setEditTechnicianId(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none"
                >
                  <option value="">Selecione o técnico...</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status e Valor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Status Atual
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none"
                  >
                    <option value="aberta">🔹 Aberta</option>
                    <option value="em_orcamento">📋 Em Orçamento</option>
                    <option value="em_manutencao">🛠️ Em Manutenção</option>
                    <option value="finalizada">✅ Finalizada</option>
                    <option value="entregue">📦 Entregue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Valor do Serviço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editTotalValue}
                    onChange={(e) => setEditTotalValue(e.target.value)}
                    placeholder="0,00"
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Laudo Técnico */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Laudo / Relatório Técnico
                </label>
                <textarea
                  value={editTechnicalReport}
                  onChange={(e) => setEditTechnicalReport(e.target.value)}
                  placeholder="Descreva o diagnóstico ou o que foi reparado no equipamento..."
                  rows={4}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none resize-none"
                />
              </div>

              {/* Botões */}
              <div className="flex gap-3 mt-6 justify-end border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2.5 rounded-lg border border-slate-800 text-slate-400 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400"
                >
                  {isSubmitting ? "Salvando..." : "Atualizar Ordem"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
