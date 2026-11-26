import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

// Escuta as mensagens de um chamado específico em tempo real
export function escutarMensagens(demandaId, callback) {
  // Cria uma "subcoleção" de mensagens dentro do chamado específico
  const mensagensRef = collection(db, "demandas", demandaId, "mensagens");

  // Ordena para as mais antigas aparecerem em cima e as novas embaixo
  const q = query(mensagensRef, orderBy("criadoEm", "asc"));

  return onSnapshot(q, (snapshot) => {
    const lista = [];
    snapshot.forEach((docSnap) => {
      lista.push({ id: docSnap.id, ...docSnap.data() });
    });
    callback(lista);
  });
}

// Salva uma nova mensagem no banco de dados
export async function enviarMensagem(demandaId, usuarioId, nome, texto) {
  const mensagensRef = collection(db, "demandas", demandaId, "mensagens");
  await addDoc(mensagensRef, {
    usuarioId: usuarioId,
    nome: nome,
    texto: texto,
    criadoEm: new Date() // Data e hora exata do envio
  });
}

// Cliente recusa o chamado após negociação no chat e devolve ao mural
export async function recusarChamadoEDevolverAoMural(
  demandaId,
  usuarioId,
  nomeUsuario = "Cliente",
  motivo = ""
) {
  const demandaRef = doc(db, "demandas", demandaId);

  // Libera a demanda no mural e limpa o vínculo do técnico assumido
  await updateDoc(demandaRef, {
    status: "aberto",
    tecnicoId: null,
    tecnicoNome: null,
    recusadoEm: serverTimestamp(),
    recusadoPor: usuarioId,
    motivoRecusa: motivo.trim() || "Chamado recusado pelo cliente após negociação no chat"
  });

  // Registra aviso no chat do chamado informando que voltou para o mural
  const mensagensRef = collection(db, "demandas", demandaId, "mensagens");
  await addDoc(mensagensRef, {
    usuarioId: usuarioId,
    nome: nomeUsuario,
    tipo: "sistema",
    texto: "O cliente recusou a proposta após a negociação e o chamado voltou ao mural.",
    criadoEm: new Date()
  });
}