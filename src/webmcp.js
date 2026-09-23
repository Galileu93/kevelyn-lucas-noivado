export function registerGiftTools(gifts, start) {
  const context = document.modelContext;
  if (!context?.registerTool) return () => {};
  const lifecycle = new AbortController();
  for (const tool of [
    {
      name: "list_gifts",
      title: "Consultar presentes",
      description:
        "Consulta o catálogo e a disponibilidade visíveis. Não revela dados pessoais de convidados.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute() {
        return gifts.map(({ id, title, status, shop_url }) => ({
          id,
          title,
          status,
          shop_url,
        }));
      },
    },
    {
      name: "start_gift_selection",
      title: "Iniciar escolha de presente",
      description:
        "Abre a janela de escolha do presente. Não efetua a reserva; a pessoa deve revisar e confirmar na interface.",
      inputSchema: {
        type: "object",
        properties: { gift_id: { type: "string" } },
        required: ["gift_id"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        if (!input || typeof input.gift_id !== "string")
          throw Error("gift_id obrigatório");
        const gift = gifts.find((g) => g.id === input.gift_id);
        if (!gift) throw Error("Presente não encontrado");
        if (gift.status !== "available")
          throw Error("Este presente não está disponível para reserva");
        start(gift);
        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        );
        return { status: "selection_opened", gift_id: gift.id };
      },
    },
  ]) {
    try {
      Promise.resolve(
        context.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {}
  }
  return () => lifecycle.abort();
}
