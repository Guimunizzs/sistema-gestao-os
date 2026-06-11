import { useState } from "react";
import api from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(false);

    if (!email || !password) {
      setError("Preencha todos os Campos");
      return;
    }

    try {
      // 1. Faz a chamada para a API do Backend
      const response = await api.post("/login", { email, password });

      // 2. Extrai apenas o token (que é o que o seu backend está respondendo de fato)
      const { token } = response.data;

      // 3. Salva o token com segurança no localStorage
      localStorage.setItem("@SistemaOS:token", token);

      // 4. Mensagem de sucesso direta sem tentar ler o 'user' que não veio
      alert("Login efetuado com sucesso!");
    } catch (err: any) {
      const mensagemErro =
        err.response?.data?.error || "Erro ao tentar fazer login.";
      setError(mensagemErro);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-800 p-8 shadow-xl border border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-400">FixOS</h1>
          <p className="text-slate-400 mt-2">
            Gerenciamento de Ordens de Serviço
          </p>
        </div>

        {/* O 'e' tem seu tipo inferido automaticamente pelo React aqui dentro */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-6"
        >
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 p-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 p-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 p-3 font-semibold text-slate-950 hover:bg-emerald-400 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Carregando..." : "Entrar no Sistema"}
          </button>
        </form>
      </div>
    </div>
  );
}
