import React, { useEffect, useState } from "react";
import { Download, LogOut, LockKeyhole } from "lucide-react";
import { supabase, configured, rpc, exportCsv } from "./api";
import { Modal } from "./forms";
const date = (s) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(s));
export default function Admin() {
  const [session, setSession] = useState(null),
    [loading, setLoading] = useState(configured),
    [allowed, setAllowed] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [rsvps, setRsvps] = useState([]),
    [gifts, setGifts] = useState([]),
    [claims, setClaims] = useState([]),
    [release, setRelease] = useState(null),
    [tab, setTab] = useState("rsvp");
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (active) {
        setSession(data.session);
        setLoading(false);
        if (error) setError("Não foi possível verificar a sessão.");
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) {
        setAllowed(false);
        setRsvps([]);
        setClaims([]);
        setGifts([]);
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  async function load() {
    setBusy(true);
    setError("");
    try {
      const admin = await rpc("is_admin");
      if (!admin) {
        setAllowed(false);
        setError("Esta conta não tem acesso ao painel.");
        return;
      }
      setAllowed(true);
      const results = await Promise.all([
        supabase
          .from("rsvps")
          .select(
            "id,full_name,family,guest_count,attendance,message,created_at",
          )
          .order("created_at", { ascending: false }),
        supabase.from("gifts").select("*"),
        supabase
          .from("gift_claims")
          .select("id,gift_id,guest_name,guest_family,created_at"),
      ]);
      for (const result of results) if (result.error) throw result.error;
      setRsvps(results[0].data);
      setGifts(results[1].data);
      setClaims(results[2].data);
    } catch {
      setError("Não foi possível carregar o painel. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (session) load();
  }, [session?.user?.id]);
  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: f.get("email").trim(),
        password: f.get("password"),
      });
      if (error) throw error;
    } catch {
      setError("Não foi possível entrar. Confira o e-mail e a senha.");
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) setError("Não foi possível sair. Tente novamente.");
    else {
      setAllowed(false);
      setRsvps([]);
      setClaims([]);
      setSession(null);
    }
  }
  async function free() {
    setBusy(true);
    setError("");
    try {
      await rpc("release_gift", { p_gift_id: release.id });
      setRelease(null);
      await load();
    } catch {
      setError("Não foi possível liberar o presente. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  const total = rsvps.reduce(
      (n, r) => n + (r.attendance ? r.guest_count : 0),
      0,
    ),
    absent = rsvps.reduce((n, r) => n + (!r.attendance ? r.guest_count : 0), 0);
  return (
    <div className="admin">
      <header>
        <a className="monogram" href="#inicio">
          KL
        </a>
        <span>Painel dos organizadores</span>
        {session && (
          <button className="button outline" onClick={logout}>
            <LogOut size={17} /> Sair
          </button>
        )}
      </header>
      <main>
        {loading ? (
          <p role="status">Verificando acesso…</p>
        ) : !session ? (
          <section className="login">
            <LockKeyhole />
            <h1>Kevelyn & Lucas</h1>
            <h2>Acesso administrativo</h2>
            {!configured ? (
              <p className="notice">
                O painel estará disponível após a configuração do Supabase.
                Consulte o guia de configuração entregue com o projeto.
              </p>
            ) : (
              <form onSubmit={login}>
                <label>
                  E-mail
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                  />
                </label>
                <label>
                  Senha
                  <input
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                  />
                </label>
                <button className="button" disabled={busy}>
                  {busy ? "Entrando…" : "Entrar"}
                </button>
              </form>
            )}
            <a href="#inicio">Voltar ao site</a>
          </section>
        ) : (
          <>
            {allowed && (
              <>
                <div className="admin-heading">
                  <h1>Nosso jantar, em detalhes</h1>
                  <button
                    className="button outline"
                    disabled={busy}
                    onClick={load}
                  >
                    {busy ? "Atualizando…" : "Atualizar"}
                  </button>
                </div>
                <div className="summary">
                  {[
                    ["Respostas recebidas", rsvps.length],
                    ["Pessoas confirmadas", total],
                    ["Pessoas que não irão", absent],
                    [
                      "Presentes disponíveis",
                      gifts.filter((g) => g.status === "available").length,
                    ],
                    ["Presentes escolhidos", claims.length],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <strong>{value}</strong>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <div className="admin-tabs">
                  <button
                    className={"button " + (tab === "rsvp" ? "" : "outline")}
                    onClick={() => setTab("rsvp")}
                  >
                    Presenças
                  </button>
                  <button
                    className={"button " + (tab === "gifts" ? "" : "outline")}
                    onClick={() => setTab("gifts")}
                  >
                    Presentes
                  </button>
                  <button
                    className="button outline"
                    disabled={!(tab === "rsvp" ? rsvps.length : gifts.length)}
                    onClick={() =>
                      exportCsv(
                        tab + ".csv",
                        tab === "rsvp"
                          ? rsvps.map((r) => ({
                              Nome: r.full_name,
                              Família: r.family,
                              Quantidade: r.guest_count,
                              Presença: r.attendance ? "Sim" : "Não",
                              Recado: r.message,
                              Data: date(r.created_at),
                            }))
                          : gifts.map((g) => {
                              const c = claims.find((c) => c.gift_id === g.id);
                              return {
                                Produto: g.title,
                                Status:
                                  g.status === "claimed"
                                    ? "Escolhido"
                                    : "Disponível",
                                Nome: c?.guest_name || "",
                                Família: c?.guest_family || "",
                                Data: c ? date(c.created_at) : "",
                              };
                            }),
                      )
                    }
                  >
                    <Download size={17} /> Exportar CSV
                  </button>
                </div>
                <div
                  className="table-wrap"
                  tabIndex={0}
                  aria-label={
                    tab === "rsvp"
                      ? "Tabela de confirmações"
                      : "Tabela de presentes"
                  }
                >
                  {tab === "rsvp" ? (
                    <table>
                      <thead>
                        <tr>
                          {[
                            "Nome",
                            "Família / acompanhantes",
                            "Pessoas",
                            "Presença",
                            "Recado",
                            "Data",
                          ].map((t) => (
                            <th key={t}>{t}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rsvps.map((r) => (
                          <tr key={r.id}>
                            <td>{r.full_name}</td>
                            <td>{r.family || "—"}</td>
                            <td>{r.guest_count}</td>
                            <td>{r.attendance ? "Sim" : "Não"}</td>
                            <td>{r.message || "—"}</td>
                            <td>{date(r.created_at)}</td>
                          </tr>
                        ))}
                        {!rsvps.length && (
                          <tr>
                            <td colSpan={6}>
                              Nenhuma resposta recebida ainda.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          {[
                            "Produto",
                            "Status",
                            "Quem escolheu",
                            "Família",
                            "Data",
                            "Ação",
                          ].map((t) => (
                            <th key={t}>{t}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {gifts.map((g) => {
                          const c = claims.find((c) => c.gift_id === g.id);
                          return (
                            <tr key={g.id}>
                              <td>{g.title}</td>
                              <td>
                                {g.status === "claimed"
                                  ? "Escolhido"
                                  : "Disponível"}
                              </td>
                              <td>{c?.guest_name || "—"}</td>
                              <td>{c?.guest_family || "—"}</td>
                              <td>{c ? date(c.created_at) : "—"}</td>
                              <td>
                                {c && (
                                  <button
                                    className="button outline"
                                    disabled={busy}
                                    onClick={() => setRelease(g)}
                                  >
                                    Liberar
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
            {!allowed && busy && <p role="status">Verificando permissão…</p>}
            {!allowed && !busy && (
              <button className="button outline" onClick={load}>
                Tentar novamente
              </button>
            )}
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </main>
      {release && (
        <Modal
          title="Liberar este presente?"
          busy={busy}
          onClose={() => setRelease(null)}
        >
          <p>
            <strong>{release.title}</strong>
          </p>
          <p>
            A reserva atual será removida e outro convidado poderá escolher o
            item.
          </p>
          <div className="modal-actions">
            <button
              className="button outline"
              disabled={busy}
              onClick={() => setRelease(null)}
            >
              Cancelar
            </button>
            <button className="button" disabled={busy} onClick={free}>
              {busy ? "Liberando…" : "Sim, liberar presente"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
