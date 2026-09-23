import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  CalendarDays,
  Clock,
  MapPin,
  Gift,
  Heart,
  Menu,
  X,
  ArrowDown,
} from "lucide-react";
import "./style.css";
import { RSVP, Gifts } from "./forms";
import Admin from "./Admin";

const asset = (name) => `${import.meta.env.BASE_URL}assets/${name}.webp`;
const mapUrl =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent(
    "Espaço MP, Rua Cristóvão Berberia, 302, " +
      (import.meta.env.VITE_EVENT_CITY || "Rio de Janeiro, RJ"),
  );
function Branch({ className = "" }) {
  return (
    <img
      className={"branch " + className}
      src={asset("leaves-clean")}
      alt=""
      aria-hidden="true"
    />
  );
}
function Countdown() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(
    0,
    Math.floor((Date.parse("2026-10-30T19:00:00-03:00") - now) / 1000),
  );
  const v = [
    Math.floor(diff / 86400),
    Math.floor(diff / 3600) % 24,
    Math.floor(diff / 60) % 60,
    diff % 60,
  ];
  return (
    <section className="countdown" aria-label="Contagem regressiva">
      <h2>{diff ? "Faltam" : "Chegou o nosso dia!"}</h2>
      <div className="digits">
        {v.map((n, i) => (
          <div key={i}>
            <strong>{String(n).padStart(2, "0")}</strong>
            <span>{["DIAS", "HORAS", "MINUTOS", "SEGUNDOS"][i]}</span>
          </div>
        ))}
      </div>
      <Heart size={18} />
      <p>
        Para vivermos um dos dias
        <br /> mais importantes das nossas vidas.
      </p>
    </section>
  );
}
function App() {
  const [menu, setMenu] = useState(false);
  return (
    <>
      <a className="skip" href="#historia">
        Pular para o conteúdo
      </a>
      <div className="site">
        <header>
          <a
            href="#inicio"
            className="monogram"
            aria-label="Kevelyn e Lucas, início"
          >
            KL
          </a>
          <button
            className="menu-toggle icon-button"
            aria-label={menu ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
          <nav
            className={menu ? "open" : ""}
            aria-label="Navegação principal"
            onClick={() => setMenu(false)}
          >
            <a href="#historia">Amor</a>
            <a href="#boas-vindas">Boas risadas</a>
            <a href="#galeria">Momentos</a>
            <a href="#presenca">Cumplicidade</a>
            <a href="#presentes">Um lindo futuro</a>
            <Heart size={21} aria-hidden="true" />
          </nav>
        </header>
        <main>
          <div className="opening" id="inicio">
            <section className="hero">
              <div
                className="hero-photo"
                role="img"
                aria-label="Flores delicadas e velas sobre uma mesa de madeira"
              />
              <div className="hero-copy">
                <h1>
                  Kevelyn <span>&</span> Lucas
                </h1>
                <p className="chapter">
                  Um novo capítulo
                  <br />
                  da nossa história
                </p>
                <p className="date">30 • 10 • 2026</p>
                <a className="button" href="#presenca">
                  Confirmar presença
                </a>
                <a className="button outline" href="#nosso-dia">
                  Ver informações
                </a>
                <a
                  className="down"
                  href="#historia"
                  aria-label="Conhecer nossa história"
                >
                  <ArrowDown />
                </a>
              </div>
              <Branch className="hero-branch" />
            </section>
            <aside className="welcome" id="boas-vindas">
              <Branch />
              <h2>
                Sejam
                <br />
                bem-vindos
              </h2>
              <p>
                Estamos muito felizes em compartilhar esse momento tão especial
                com vocês!
                <br />
                Aqui vocês encontram todas as informações.
              </p>
              <p className="script">
                Contamos com
                <br />a sua presença!
              </p>
              <Heart className="filled-heart" size={23} />
            </aside>
          </div>
          <div className="story-row">
            <section className="story panel" id="historia">
              <div>
                <h2>Nossa história</h2>
                <p>
                  Nosso primeiro encontro foi na escola.
                  <br />O nosso reencontro foi no tempo de Deus.
                </p>
                <Branch className="story-branch" />
              </div>
              <figure className="polaroid">
                <img
                  src={asset("couple")}
                  alt="Kevelyn e Lucas juntos, foto da arte fornecida"
                />
                <figcaption>
                  Juntos sempre <span>♥</span>
                </figcaption>
              </figure>
            </section>
            <Countdown />
            <section className="event panel" id="nosso-dia">
              <h2>O nosso dia</h2>
              <p>
                <CalendarDays />
                <span>30 de outubro de 2026</span>
              </p>
              <p>
                <Clock />
                <span>A partir das 19h</span>
              </p>
              <p>
                <MapPin />
                <span>
                  Espaço MP
                  <br />
                  Rua Cristóvão Berberia, 302
                  <br />
                  <small>Rio de Janeiro • RJ</small>
                </span>
              </p>
              <a
                className="button"
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Mapa do local
              </a>
            </section>
          </div>
          <div className="details-row">
            <section className="dress panel">
              <h2>Dress code</h2>
              <div
                className="swatches"
                aria-label="Paleta de tons nude: creme, bege, rosado, caramelo e castanho"
              >
                {["#efe2d8", "#e4cfc1", "#d4b2a2", "#bc907b", "#ab7d65"].map(
                  (c) => (
                    <span key={c} style={{ background: c }} />
                  ),
                )}
              </div>
              <p className="spaced">Trajes em tons nudes</p>
              <img className="sprig" src={asset("sprig-clean")} alt="" />
              <p className="spaced small">Elegância em cada detalhe</p>
            </section>
            <section className="gift-intro panel">
              <h2>Lista de presentes</h2>
              <Gift size={38} />
              <p>
                Sua presença já é o nosso maior presente, mas se quiser nos
                presentear, preparamos uma lista especial.
              </p>
              <a className="button" href="#presentes">
                Ver lista de presentes
              </a>
            </section>
            <RSVP />
            <section className="gallery panel" id="galeria">
              <h2>Galeria</h2>
              <p>Momentos que já são nossos</p>
              <div className="gallery-pics">
                {[
                  ["flowers", "Arranjo de rosas"],
                  ["candles", "Velas acesas"],
                  ["wish", "Mensagem: sonhe, planeje, conquiste"],
                ].map(([n, a]) => (
                  <img key={n} src={asset(n)} alt={a} loading="lazy" />
                ))}
              </div>
            </section>
          </div>
          <Gifts />
        </main>
        <footer>
          <div>
            <span className="monogram">KL</span>
            <span className="script">Kevelyn & Lucas</span>
          </div>
          <p>
            Obrigado por fazer parte disso <Heart size={20} />
          </p>
          <span className="footer-date">30 • 10 • 2026</span>
        </footer>
      </div>
    </>
  );
}
function Router() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const f = () => setHash(location.hash);
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return hash.startsWith("#/admin") ? <Admin /> : <App />;
}
createRoot(document.getElementById("root")).render(<Router />);
