import { createClient } from "@supabase/supabase-js";
import catalog from "./products.json";
const url = import.meta.env.VITE_SUPABASE_URL,
  key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const configured = Boolean(
  url && key && !url.includes("SEU-PROJETO") && !key.includes("SUA_CHAVE"),
);
export const supabase = configured ? createClient(url, key) : null;
export const localCatalog = catalog.map(
  ({ id, title, image_url, shop_url }) => ({
    id,
    title,
    image_url,
    shop_url,
    status: "unknown",
  }),
);
export const imageUrl = (path) =>
  path?.startsWith("https://") ? path : `${import.meta.env.BASE_URL}${path}`;
export const unavailable =
  "As confirmações e reservas ainda não foram abertas. Por favor, volte em breve.";
export async function listGifts() {
  if (!supabase) return localCatalog;
  const { data, error } = await supabase
    .from("gifts")
    .select("id,title,image_url,shop_url,status")
    .order("created_at");
  if (error) throw error;
  const order = new Map(catalog.map((g, i) => [g.id, i]));
  return data.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
}
export async function rpc(name, args) {
  if (!supabase) throw Error(unavailable);
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data;
}
export function friendlyError(error) {
  if (error?.message === unavailable) return unavailable;
  return "Não foi possível concluir agora. Verifique sua conexão e tente novamente. Seus dados continuam no formulário.";
}
export function exportCsv(filename, rows) {
  if (!rows.length) return;
  const safe = (value) => {
    let s = String(value ?? "");
    if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  const keys = Object.keys(rows[0]);
  const csv =
    "\uFEFF" +
    [
      keys.map(safe).join(";"),
      ...rows.map((r) => keys.map((k) => safe(r[k])).join(";")),
    ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function storedToken(key) {
  try {
    let t = localStorage.getItem(key);
    if (!t) {
      t = crypto.randomUUID();
      localStorage.setItem(key, t);
    }
    return t;
  } catch {
    return crypto.randomUUID();
  }
}
