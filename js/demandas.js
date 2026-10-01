import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

// Textos bonitos para os status
export const LABEL_STATUS = {
    "aberto": "Em Aberto",
    "em_negociacao": "Em Atendimento",
    "resolvido": "Resolvido"
};

// Textos bonitos para as categorias
export const LABEL_CATEGORIA = {
    "hardware": "Hardware",
    "software": "Software"
};

// Função 1: Criar um novo chamado (Cliente)
export async function criarDemanda(dados) {
    const demandasRef = collection(db, "demandas");
    const ticketId = Math.floor(1000 + Math.random() * 9000).toString(); // Gera um ID tipo "4829"
    
    await addDoc(demandasRef, {
        ...dados,
        ticketId: ticketId,
        status: "aberto",
        criadoEm: new Date(),
        tecnicoId: null,
        tecnicoNome: null
    });
}

// Função 2: Ler os chamados em tempo real para desenhar na tela
export function escutarDemandas(callback) {
    const q = query(collection(db, "demandas"), orderBy("criadoEm", "desc"));
    
    return onSnapshot(q, (snapshot) => {
        const lista = [];
        snapshot.forEach((doc) => {
            lista.push({ id: doc.id, ...doc.data() });
        });
        callback(lista);
    });
}

// Função 3: O Técnico assumir o chamado
export async function assumirDemanda(demandaId, tecnicoId, tecnicoNome) {
    const demandaRef = doc(db, "demandas", demandaId);
    
    await updateDoc(demandaRef, {
        status: "em_negociacao",
        tecnicoId: tecnicoId,
        tecnicoNome: tecnicoNome
    });
}