import { db } from "./firebase-config.js";
import { collection, addDoc, updateDoc, doc, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Rótulos amigáveis para a interface
export const LABEL_STATUS = {
    "aberto": "Aberto",
    "em_negociacao": "Em Negociação",
    "resolvido": "Resolvido"
};

export const LABEL_CATEGORIA = {
    "hardware": "Hardware",
    "software": "Software"
};

// 1. Escutar todos os chamados em tempo real
export function escutarDemandas(callback) {
    const demandasRef = collection(db, "demandas");
    
    return onSnapshot(demandasRef, (snapshot) => {
        const demandas = [];
        snapshot.forEach((docSnap) => {
            demandas.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        // Ordena para que os mais recentes (maior ticketId) apareçam primeiro
        demandas.sort((a, b) => b.ticketId - a.ticketId);
        
        callback(demandas);
    });
}

// 2. Criar um novo chamado (Cliente)
export async function criarDemanda(dados) {
    const demandasRef = collection(db, "demandas");
    const ticketId = Math.floor(1000 + Math.random() * 9000); // Gera um ID numérico de 4 dígitos
    
    const novaDemanda = {
        ...dados,
        ticketId: ticketId,
        status: "aberto",
        dataCriacao: new Date().toISOString()
    };
    
    await addDoc(demandasRef, novaDemanda);
}

// 3. Assumir um chamado (Técnico)
export async function assumirDemanda(idDemanda, idTecnico, nomeTecnico) {
    const docRef = doc(db, "demandas", idDemanda);
    await updateDoc(docRef, {
        status: "em_negociacao",
        tecnicoId: idTecnico,
        tecnicoNome: nomeTecnico
    });
}

// 4. Atualizar/Editar um chamado (Cliente)
export async function atualizarDemanda(id, novosDados) {
    const docRef = doc(db, "demandas", id);
    await updateDoc(docRef, novosDados);
}

// 5. Excluir/Cancelar um chamado (Cliente)
export async function excluirDemanda(id) {
    const docRef = doc(db, "demandas", id);
    await deleteDoc(docRef);
}