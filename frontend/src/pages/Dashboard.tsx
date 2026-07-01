import React, { useEffect, useState } from "react";
import api from "../services/api";

interface DashboardStats {
  aberta: number;
  em_orcamento: number;
  em_manutencao: number;
  finalizada: number;
  entregue: number;
  faturamento: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    aberta: 0,
    em_orcamento: 0,
    em_manutencao: 0,
    finalizada: 0,
    entregue: 0,
    faturamento: 0,
  });
  const [loading, setLoading] = useState(true);

  function handleLogout() {
    localStorage.removeItem("@SistemaOS:token");
    window.location.href = "/";
  }

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const response = await api.get("/dashboard/stats");
        setStats(response.data);
      } catch (err) {
        console.error("Erro ao carregar dados da dashboard", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      {/* Barra Lateral */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold text-emerald-400 mb-8">FixOS</h2>
          <nav className="space-y-4">
            <a
              href="/dashboard"
              className="block p-3 rounded-lg bg-slate-800 text-emerald-400 font-medium"
            >
              📊 Dashboard
            </a>
            <a
              href="/orders"
              className="block p-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              🔧 Ordens de Serviço
            </a>
            <a
              href="/customers"
              className="block p-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              👥 Clientes
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
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Visão geral do faturamento e andamento dos serviços.
          </p>
        </header>

        {loading ? (
          <div className="text-slate-400 font-medium animate-pulse">
            Carregando indicadores...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card Faturamento */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl">
              <span className="text-sm font-medium text-slate-500 block mb-2">
                💰 FATURAMENTO TOTAL
              </span>
              <span className="text-3xl font-mono font-bold text-emerald-400">
                R$ {stats.faturamento.toFixed(2)}
              </span>
            </div>

            {/* Card Em Manutenção */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl">
              <span className="text-sm font-medium text-slate-500 block mb-2">
                🛠️ EM MANUTENÇÃO
              </span>
              <span className="text-3xl font-bold text-amber-400">
                {stats.em_manutencao}
              </span>
            </div>

            {/* Card Abertas */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl">
              <span className="text-sm font-medium text-slate-500 block mb-2">
                🔹 ORDENS ABERTAS
              </span>
              <span className="text-3xl font-bold text-blue-400">
                {stats.aberta}
              </span>
            </div>

            {/* Card Concluídas */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl">
              <span className="text-sm font-medium text-slate-500 block mb-2">
                ✅ FINALIZADAS / ENTREGUES
              </span>
              <span className="text-3xl font-bold text-purple-400">
                {stats.finalizada + stats.entregue}
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
