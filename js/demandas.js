import { db } from "./firebase-config.js";
import { collection, addDoc, updateDoc, doc, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const LABEL_STATUS = {
    "aberto": "Aberto",
    "em_andamento": "Em Andamento",
    "em_negociacao": "Em Andamento", // Compatibilidade com registros antigos
    "resolvido": "Resolvido"
};

export const LABEL_CATEGORIA = {
    "hardware": "Hardware",
    "software": "Software"
};

// Escutar chamadas em tempo real do Firestore
export function escutarDemandas(callback) {
    const demandasRef = collection(db, "demandas");
    return onSnapshot(demandasRef, (snapshot) => {
        const demandas = [];
        snapshot.forEach((docSnap) => {
            demandas.push({ id: docSnap.id, ...docSnap.data() });
        });
        callback(demandas);
    });
}

// Criar nova demanda
export async function criarDemanda(dados) {
    const demandasRef = collection(db, "demandas");
    const ticketId = Math.floor(1000 + Math.random() * 9000); 
    const novaDemanda = {
        ...dados,
        ticketId: ticketId,
        status: "aberto",
        editado: false,
        dataCriacao: new Date().toISOString()
    };
    await addDoc(demandasRef, novaDemanda);
}

// Técnico assume o chamado, define status como "em_andamento" e salva o prazo
export async function assumirDemanda(idDemanda, idTecnico, nomeTecnico, prazoEstimado) {
    const docRef = doc(db, "demandas", idDemanda);
    await updateDoc(docRef, {
        status: "em_andamento",
        tecnicoId: idTecnico,
        tecnicoNome: nomeTecnico,
        prazoEstimado: prazoEstimado || "A definir"
    });
}

// Atualizar/Editar chamado (Cliente)
export async function atualizarDemanda(id, novosDados) {
    const docRef = doc(db, "demandas", id);
    await updateDoc(docRef, novosDados);
}

// Excluir/Cancelar chamado (Cliente)
export async function excluirDemanda(id) {
    const docRef = doc(db, "demandas", id);
    await deleteDoc(docRef);
}