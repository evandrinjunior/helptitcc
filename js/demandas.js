import { db } from "./firebase-config.js";
// Adicionamos updateDoc, deleteDoc e doc na linha abaixo:
import { collection, addDoc, updateDoc, doc, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const LABEL_STATUS = {
    "aberto": "Aberto",
    "em_negociacao": "Em Negociação",
    "resolvido": "Resolvido"
};

export const LABEL_CATEGORIA = {
    "hardware": "Hardware",
    "software": "Software"
};

export function escutarDemandas(callback) {
    const demandasRef = collection(db, "demandas");
    return onSnapshot(demandasRef, (snapshot) => {
        const demandas = [];
        snapshot.forEach((docSnap) => {
            demandas.push({ id: docSnap.id, ...docSnap.data() });
        });
        demandas.sort((a, b) => b.ticketId - a.ticketId);
        callback(demandas);
    });
}

export async function criarDemanda(dados) {
    const demandasRef = collection(db, "demandas");
    const ticketId = Math.floor(1000 + Math.random() * 9000); 
    const novaDemanda = {
        ...dados,
        ticketId: ticketId,
        status: "aberto",
        dataCriacao: new Date().toISOString()
    };
    await addDoc(demandasRef, novaDemanda);
}

export async function assumirDemanda(idDemanda, idTecnico, nomeTecnico) {
    const docRef = doc(db, "demandas", idDemanda);
    await updateDoc(docRef, {
        status: "em_negociacao",
        tecnicoId: idTecnico,
        tecnicoNome: nomeTecnico
    });
}

// === NOVAS FUNÇÕES DE EDITAR E EXCLUIR ABAIXO ===

export async function atualizarDemanda(id, novosDados) {
    const docRef = doc(db, "demandas", id);
    await updateDoc(docRef, novosDados);
}

export async function excluirDemanda(id) {
    const docRef = doc(db, "demandas", id);
    await deleteDoc(docRef);
}