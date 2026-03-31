"use client";

import { useState } from "react";

type FilterResult = {
  name: string;
  role: string;
  stage: string;
  aiScore: number;
  decision: string;
};

export function AdminConsole() {
  const [query, setQuery] = useState("ventas entrevista disponibilidad");
  const [results, setResults] = useState<FilterResult[]>([]);
  const [message, setMessage] = useState("Quiero hablar con un administrador sobre mi entrevista.");
  const [reply, setReply] = useState("");
  const [loadingFilter, setLoadingFilter] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  async function handleFilter() {
    setLoadingFilter(true);
    const response = await fetch("/api/candidates/filter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await response.json();
    setResults(data.result ?? []);
    setLoadingFilter(false);
  }

  async function handleChat() {
    setLoadingChat(true);
    const response = await fetch("/api/ai/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await response.json();
    setReply(data.reply ?? "");
    setLoadingChat(false);
  }

  return (
    <section className="card-grid content-split">
      <article className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Filtro IA</p>
            <h2>Consulta de candidatos</h2>
          </div>
        </div>
        <div className="stack-sm">
          <label className="field">
            <span>Busqueda para IA</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <button type="button" className="primary-link action-button" onClick={handleFilter}>
            {loadingFilter ? "Analizando..." : "Filtrar candidatos"}
          </button>
          <div className="stack-sm">
            {results.map((candidate) => (
              <div key={candidate.name} className="candidate-card">
                <div className="candidate-head">
                  <strong>{candidate.name}</strong>
                  <span className="pill">{candidate.aiScore}</span>
                </div>
                <p>
                  {candidate.role} - {candidate.stage}
                </p>
                <p>{candidate.decision}</p>
              </div>
            ))}
          </div>
        </div>
      </article>

      <article className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Chatbot inicial</p>
            <h2>Mensajes a administracion</h2>
          </div>
        </div>
        <div className="stack-sm">
          <label className="field">
            <span>Mensaje del usuario</span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} />
          </label>
          <button type="button" className="primary-link action-button" onClick={handleChat}>
            {loadingChat ? "Respondiendo..." : "Probar chatbot"}
          </button>
          {reply ? (
            <div className="chat-bubble bot full-width">
              <span>Bot</span>
              <p>{reply}</p>
            </div>
          ) : null}
        </div>
      </article>
    </section>
  );
}
