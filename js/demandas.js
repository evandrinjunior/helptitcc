import { db } from "./firebase-config.js";
import { collection, addDoc, updateDoc, doc, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const LABEL_STATUS = {
    "aberto": "Aberto",
    "em_andamento": "Em Andamento",
    "em_negociacao": "Em Andamento",
    "resolvido": "Resolvido"
};

export const LABEL_CATEGORIA = {
    "hardware": "Hardware",
    "software": "Software"
};

export const LABEL_MODALIDADE = {
    "remoto": "Remoto (Online)",
    "presencial": "Presencial"
};

// Geocodificação reversa gratuita (Nominatim / OpenStreetMap) para obter Cidade - UF
export async function obterCidadePorCoordenadas(lat, lon) {
    if (!lat || !lon) return null;
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=pt-BR`;
        const resposta = await fetch(url);
        if (!resposta.ok) return null;
        const dados = await resposta.json();
        const addr = dados.address || {};
        const cidade = addr.city || addr.town || addr.village || addr.municipality || addr.county;
        const estado = addr.state;

        const siglasUF = {
            "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM",
            "Bahia": "BA", "Ceará": "CE", "Distrito Federal": "DF", "Espírito Santo": "ES",
            "Goiás": "GO", "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS",
            "Minas Gerais": "MG", "Pará": "PA", "Paraíba": "PB", "Paraná": "PR",
            "Pernambuco": "PE", "Piauí": "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN",
            "Rio Grande do Sul": "RS", "Rondônia": "RO", "Roraima": "RR", "Santa Catarina": "SC",
            "São Paulo": "SP", "Sergipe": "SE", "Tocantins": "TO"
        };

        const uf = siglasUF[estado] || estado || "";
        if (cidade && uf) return `${cidade} - ${uf}`;
        if (cidade) return cidade;
        return null;
    } catch (erro) {
        console.warn("Erro ao buscar cidade pelas coordenadas:", erro);
        return null;
    }
}

// Fórmula de Haversine para calcular distância em km entre duas coordenadas
export function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
}

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

// Técnico assume o chamado
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