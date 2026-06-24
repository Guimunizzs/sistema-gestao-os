import { useEffect, useState } from "react";
import api from "../services/api";

interface Order {
  id: number;
  status: "aberto" | "em_manutencao" | "finalizado";
  description: string;
  created_at: string;
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const response = await api.get("/orders");

        if (Array.isArray(response.data)) {
          setOrders(response.data);
        }
      } catch (err: any) {
        setError("Não foi possível carregar os dados do Painel.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const abertas = orders.filter((os) => os.status === "aberto").length;
  const emManutencao = orders.filter(
    (os) => os.status === "em_manutencao",
  ).length;
  const finalizadas = orders.filter((os) => os.status === "finalizado").length;

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
          <h1 className="text-3xl font-bold">Painel de Controle</h1>
          <p className="text-slate-400 mt-1">
            Bem-vindo ao sistema de gerenciamento de OS.
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-slate-400 font-medium animate-pulse">
            Carregando dados da API...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
              <h3 className="text-sm font-medium text-slate-400">OS Abertas</h3>
              <p className="text-3xl font-bold text-white mt-2">{abertas}</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
              <h3 className="text-sm font-medium text-slate-400">
                Em Manutenção
              </h3>
              <p className="text-3xl font-bold text-amber-400 mt-2">
                {emManutencao}
              </p>
            </div>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
              <h3 className="text-sm font-medium text-slate-400">
                Finalizadas
              </h3>
              <p className="text-3xl font-bold text-emerald-400 mt-2">
                {finalizadas}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
