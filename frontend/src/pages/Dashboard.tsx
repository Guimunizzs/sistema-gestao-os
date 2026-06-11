export default function Dashboard() {
  function handleLogout() {
    localStorage.removeItem("@SistemaOS:token");
    window.location.href = "/";
  }

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      {/* Barra Lateral Bem Simples */}
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
      <main className="flex-1 p-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Painel de Controle</h1>
          <p className="text-slate-400 mt-1">
            Bem-vindo ao sistema de gerenciamento de OS.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
            <h3 className="text-sm font-medium text-slate-400">OS Abertas</h3>
            <p className="text-3xl font-bold text-white mt-2">--</p>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
            <h3 className="text-sm font-medium text-slate-400">
              Em Manutenção
            </h3>
            <p className="text-3xl font-bold text-amber-400 mt-2">--</p>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
            <h3 className="text-sm font-medium text-slate-400">Finalizadas</h3>
            <p className="text-3xl font-bold text-emerald-400 mt-2">--</p>
          </div>
        </div>
      </main>
    </div>
  );
}
