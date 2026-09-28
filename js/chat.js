import { collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

// Escuta as mensagens de um chamado específico em tempo real
export function escutarMensagens(demandaId, callback) {
  // Cria uma "subcoleção" de mensagens dentro do chamado específico
  const mensagensRef = collection(db, "demandas", demandaId, "mensagens");
  
  // Ordena para as mais antigas aparecerem em cima e as novas embaixo
  const q = query(mensagensRef, orderBy("criadoEm", "asc"));
  
  return onSnapshot(q, (snapshot) => {
    const lista = [];
    snapshot.forEach((doc) => {
      lista.push({ id: doc.id, ...doc.data() });
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