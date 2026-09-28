import { collection, addDoc, onSnapshot, doc, updateDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

// Rótulos para exibição no Feed
export const LABEL_STATUS = {
  "aberto": "Em Aberto",
  "em_negociacao": "Em Negociação",
  "resolvido": "Resolvido"
};

export const LABEL_CATEGORIA = {
  "hardware": "Hardware",
  "software": "Software"
};

// Função que o sistema estava a tentar procurar noutro ficheiro
function gerarPrefixoTicket() {
  return Math.floor(1000 + Math.random() * 9000).toString(); // Gera um ID de 4 dígitos
}

// Criar um novo chamado
export async function criarDemanda(dados) {
  const chamadosRef = collection(db, "demandas");
  await addDoc(chamadosRef, {
    ...dados,
    ticketId: gerarPrefixoTicket(),
    status: "aberto",
    criadoEm: new Date(),
    tecnicoId: null,
    tecnicoNome: null
  });
}

// Escutar os chamados em tempo real para alimentar o Feed
export function escutarDemandas(callback) {
  const chamadosRef = collection(db, "demandas");
  const q = query(chamadosRef, orderBy("criadoEm", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const lista = [];
    snapshot.forEach((docSnap) => {
      lista.push({ id: docSnap.id, ...docSnap.data() });
    });
    callback(lista);
  });
}

// Função para o técnico assumir a resolução
export async function assumirDemanda(demandaId, dadosTecnico) {
  const demandaRef = doc(db, "demandas", demandaId);
  await updateDoc(demandaRef, {
    status: "em_negociacao",
    tecnicoId: dadosTecnico.tecnicoId,
    tecnicoNome: dadosTecnico.tecnicoNome
  });
}