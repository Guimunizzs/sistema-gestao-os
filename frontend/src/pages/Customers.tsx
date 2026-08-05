import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  document: string;
  address: string;
  created_at: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Estado Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [document, setDocument] = useState("");
  const [address, setAddress] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Função para buscar os clientes de banco

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/customers");
      if (Array.isArray(response.data)) {
        setCustomers(response.data);
      }
    } catch (err) {
      setError("Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  //função para cadastrar novo cliente

  async function handleCreateCustomer() {
    setFormError("");
    if (!name || !email || !phone) {
      setFormError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/customers", {
        name,
        email,
        phone,
        document: document || null,
        address: address || null,
      });

      setName("");
      setEmail("");
      setPhone("");
      setDocument("");
      setAddress("");
      setIsModalOpen(false);
      loadCustomers();
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detalhes ||
        "Erro ao salvar cliente.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  const filteredCustomers = customers.filter((cli) => {
    const term = searchTerm.toLowerCase();
    return (
      cli.name.toLowerCase().includes(term) ||
      cli.email.toLowerCase().includes(term) ||
      cli.phone.includes(term)
    );
  });

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
              to="/users"
              className="block p-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              👤 Usuários
            </Link>
            <Link
              to="/orders"
              className="block p-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              🔧 Ordens de Serviço
            </Link>
            <Link
              to="/customers"
              className="block p-3 rounded-lg bg-slate-800 text-emerald-400 font-medium"
            >
              👥 Clientes
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
            <h1 className="text-3xl font-bold">Clientes</h1>
            <p className="text-slate-400 mt-1">
              Gerencie a base de clientes cadastrados no sistema.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-emerald-500/10"
          >
            + Novo Cliente
          </button>
        </header>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-800 text-slate-400 placeholder:text-slate-500 border border-slate-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-slate-400 font-medium animate-pulse">
            Carregando clientes...
          </div>
        ) : (
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-sm font-medium">
                  <th className="p-4">Nome</th>
                  <th className="p-4">Telefone</th>
                  <th className="p-4">E-mail</th>
                  <th className="p-4">Documento</th>
                  <th className="p-4">Data Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredCustomers.map((cli) => (
                  <tr
                    key={cli.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4 font-medium text-white">{cli.name}</td>
                    <td className="p-4 text-slate-400">{cli.phone}</td>
                    <td className="p-4 text-slate-400">{cli.email}</td>
                    <td className="p-4 font-mono text-sm text-slate-500">
                      {cli.document || "---"}
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {new Date(cli.created_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}

                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-slate-500">
                      Nenhum cliente cadastrado no banco de dados.
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateCustomer();
            }}
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl"
          >
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                Cadastrar Novo Cliente
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
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Telefone *
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    CPF / CNPJ
                  </label>
                  <input
                    type="text"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  E-mail *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="joao@email.com"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Endereço
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, bairro..."
                  rows={2}
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
                  {isSubmitting ? "Salvando..." : "Salvar Cliente"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
