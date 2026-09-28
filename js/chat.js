// ============================================================
// CHAT INTERNO — HelpTI
// Subcoleção "demandas/{demandaId}/mensagens/{id}" = {
//   remetenteId, remetenteNome, texto, criadoEm
// }
// ============================================================
import { db } from "./firebase-config.js";
import {
  doc, getDoc, collection, addDoc, query, orderBy,
  onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Busca os dados do chamado (para mostrar cabeçalho do chat) ---
export async function buscarDemanda(demandaId) {
  const snap = await getDoc(doc(db, "demandas", demandaId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// --- Envia mensagem no chamado ---
export async function enviarMensagem(demandaId, { remetenteId, remetenteNome, texto }) {
  const mensagensRef = collection(db, "demandas", demandaId, "mensagens");
  await addDoc(mensagensRef, {
    remetenteId,
    remetenteNome,
    texto,
    criadoEm: serverTimestamp()
  });
}

// --- Escuta mensagens em tempo real ---
export function escutarMensagens(demandaId, callback) {
  const mensagensRef = collection(db, "demandas", demandaId, "mensagens");
  const q = query(mensagensRef, orderBy("criadoEm", "asc"));
  return onSnapshot(q, (snap) => {
    const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(lista);
  });
}
