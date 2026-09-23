import React, { useEffect, useRef, useState } from "react";
import { Gift, Check, X, ExternalLink, Heart } from "lucide-react";
import {
  configured,
  listGifts,
  localCatalog,
  rpc,
  imageUrl,
  unavailable,
  friendlyError,
  storedToken,
} from "./api";
import { registerGiftTools } from "./webmcp";
export const colorNote =
  "Uma observação sobre os presentes: caso haja opção de escolher a cor, pedimos com carinho que deem preferência ao branco ou bege. 🤍";
export function Modal({ title, onClose, children, busy = false }) {
  const dialog = useRef();
  useEffect(() => {
    const el = dialog.current;
    el.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      el.close();
      document.body.style.overflow = old;
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <button
        disabled={busy}
        className="icon-button close"
        aria-label="Fechar janela"
        onClick={onClose}
      >
        <X />
      </button>
      <h2 id="modal-title">{title}</h2>
      {children}
    </dialog>
  );
}
export function RSVP() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(false);
  const token = useRef(storedToken("kl-rsvp-request"));
  const lock = useRef(false);
  async function submit(e) {
    e.preventDefault();
    if (lock.current) return;
    setError("");
    lock.current = true;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      await rpc("submit_rsvp", {
        p_full_name: f.get("full_name").trim(),
        p_family: f.get("family").trim(),
        p_guest_count: Number(f.get("guest_count")),
        p_attendance: f.get("attendance") === "yes",
        p_message: f.get("message").trim(),
        p_request_id: token.current,
      });
      setSuccess(true);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="rsvp panel" id="presenca">
      <h2>
        Confirmação
        <br />
        de presença
      </h2>
      {success ? (
        <div className="success" role="status" tabIndex={-1}>
          <Check />
          <h3>Resposta recebida!</h3>
          <p>Obrigado pelo carinho. Sua resposta foi registrada.</p>
        </div>
      ) : (
        <form onSubmit={submit}>
          <label>
            Nome completo
            <input
              name="full_name"
              required
              minLength={3}
              maxLength={150}
              autoComplete="name"
              placeholder="Seu nome completo"
            />
          </label>
          <label>
            Família / acompanhantes
            <input
              name="family"
              maxLength={200}
              placeholder="Ex.: João da Silva e família"
            />
          </label>
          <div className="form-pair">
            <label>
              Quantidade
              <input
                name="guest_count"
                type="number"
                defaultValue="1"
                min="1"
                max="30"
                required
              />
            </label>
            <label>
              Confirma presença?
              <select name="attendance" required defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                <option value="yes">Sim, estarei lá!</option>
                <option value="no">Não poderei ir</option>
              </select>
            </label>
          </div>
          <label>
            Recado <span>(opcional)</span>
            <textarea
              name="message"
              maxLength={1000}
              rows={2}
              placeholder="Deixe seu carinho"
            />
          </label>
          <p className="privacy-note">
            Sua resposta será vista somente pelos organizadores.
          </p>
          {!configured && <p className="notice">{unavailable}</p>}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={busy || !configured}>
            {busy ? "Enviando…" : "Enviar resposta"}
          </button>
        </form>
      )}
    </section>
  );
}
function GiftModal({ gift, onClose, onReserved }) {
  const [step, setStep] = useState(1),
    [form, setForm] = useState({ name: "", family: "" }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const request = useRef(storedToken("kl-gift-" + gift.id));
  const lock = useRef(false);
  async function reserve() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await rpc("reserve_gift", {
        p_gift_id: gift.id,
        p_guest_name: form.name.trim(),
        p_guest_family: form.family.trim(),
        p_request_id: request.current,
      });
      if (result === "already_claimed") {
        setStep(4);
        onReserved(gift.id);
      } else if (result === "reserved") {
        setStep(3);
        onReserved(gift.id);
        try {
          localStorage.removeItem("kl-gift-" + gift.id);
        } catch {}
      } else throw Error("Resposta inesperada");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  return (
    <Modal
      title={
        step === 3
          ? "Presente reservado!"
          : step === 4
            ? "Este presente já foi escolhido"
            : "Um presente com carinho"
      }
      onClose={onClose}
      busy={busy}
    >
      <div className="modal-product">
        {gift.image_url ? (
          <img src={imageUrl(gift.image_url)} alt={gift.title} />
        ) : (
          <Gift />
        )}
        <h3>{gift.title}</h3>
      </div>
      {step < 3 && (
        <>
          <p className="color-note">{colorNote}</p>
          {step === 1 ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
              }}
            >
              <label>
                Nome completo
                <input
                  autoFocus
                  required
                  minLength={3}
                  maxLength={150}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoComplete="name"
                />
              </label>
              <label>
                Nome / família
                <input
                  maxLength={200}
                  value={form.family}
                  onChange={(e) => setForm({ ...form, family: e.target.value })}
                  placeholder="Ex.: João da Silva e família"
                />
              </label>
              <p className="privacy-note">
                Somente os organizadores verão quem escolheu este presente.
              </p>
              <button className="button" disabled={!configured}>
                Revisar escolha
              </button>
              {!configured && <p className="notice">{unavailable}</p>}
            </form>
          ) : (
            <div>
              <p>
                Confirmar a reserva em nome de <strong>{form.name}</strong>
                {form.family && <> ({form.family})</>}?
              </p>
              <p className="privacy-note">
                A reserva avisa aos outros convidados que você escolheu este
                item. A compra será feita separadamente no TikTok Shop.
              </p>
              <div className="modal-actions">
                <button
                  className="button outline"
                  disabled={busy}
                  onClick={() => setStep(1)}
                >
                  Voltar
                </button>
                <button className="button" disabled={busy} onClick={reserve}>
                  {busy ? "Reservando…" : "Confirmar reserva"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {step === 3 && (
        <div className="success" role="status">
          <Check />
          <p>
            Obrigado pelo carinho! Sua escolha foi registrada. Agora você pode
            concluir a compra na loja.
          </p>
          <a
            className="button"
            href={gift.shop_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Comprar no TikTok Shop <ExternalLink size={17} />
          </a>
          <p className="privacy-note">
            Confira a voltagem, o tamanho e a cor antes de comprar.
          </p>
        </div>
      )}
      {step === 4 && (
        <p role="status">
          Alguém acabou de escolher este item. Obrigado pelo carinho! Você pode
          escolher outro presente da lista.
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}
export function Gifts() {
  const [gifts, setGifts] = useState(localCatalog),
    [loading, setLoading] = useState(configured),
    [error, setError] = useState(""),
    [selected, setSelected] = useState(null);
  const valid = useRef(false);
  useEffect(() => registerGiftTools(gifts, setSelected), [gifts]);
  async function refresh() {
    try {
      const data = await listGifts();
      if (valid.current) {
        setGifts(data);
        setError("");
      }
    } catch {
      if (valid.current)
        setError(
          "Não foi possível atualizar a disponibilidade. Tente novamente antes de escolher.",
        );
    } finally {
      if (valid.current) setLoading(false);
    }
  }
  useEffect(() => {
    valid.current = true;
    refresh();
    const t = setInterval(refresh, 15000);
    const focus = () => refresh();
    window.addEventListener("focus", focus);
    return () => {
      valid.current = false;
      clearInterval(t);
      window.removeEventListener("focus", focus);
    };
  }, []);
  function reserved(id) {
    setGifts((gs) =>
      gs.map((g) => (g.id === id ? { ...g, status: "claimed" } : g)),
    );
  }
  return (
    <section id="presentes" className="gift-section">
      <span className="eyebrow">Com carinho, para o nosso lar</span>
      <h2>Lista de presentes</h2>
      <p className="color-note">{colorNote}</p>
      {!configured && (
        <p className="catalog-notice">
          Você já pode conhecer os presentes. As reservas serão abertas em
          breve.
        </p>
      )}
      {loading && <p role="status">Consultando disponibilidade…</p>}
      {error && (
        <div className="error" role="alert">
          {error} <button onClick={refresh}>Tentar novamente</button>
        </div>
      )}
      <div className="gift-grid">
        {gifts.map((g, i) => (
          <article
            className={"gift-card " + (g.status === "claimed" ? "claimed" : "")}
            key={g.id}
          >
            <div className="gift-photo">
              {g.image_url ? (
                <img
                  src={imageUrl(g.image_url)}
                  alt={g.title}
                  loading="lazy"
                  width="600"
                  height="600"
                />
              ) : (
                <div className="placeholder">
                  <Gift size={40} />
                  <span>Foto do produto pendente</span>
                </div>
              )}
              <span className="gift-number">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="gift-body">
              <span className={"status " + g.status}>
                {g.status === "claimed"
                  ? "Presente escolhido"
                  : g.status === "available"
                    ? "Disponível"
                    : "Reservas em breve"}
              </span>
              <h3>{g.title}</h3>
              <a
                className="shop-link"
                href={g.shop_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visualizar / comprar <ExternalLink size={15} />
              </a>
              <button
                className="button"
                disabled={g.status === "claimed" || loading || Boolean(error)}
                onClick={() => setSelected(g)}
              >
                {g.status === "claimed" ? (
                  <>
                    <Check size={17} /> Presente escolhido
                  </>
                ) : (
                  "Escolher este presente"
                )}
              </button>
            </div>
          </article>
        ))}
      </div>
      {selected && (
        <GiftModal
          gift={selected}
          onClose={() => setSelected(null)}
          onReserved={reserved}
        />
      )}
    </section>
  );
}
