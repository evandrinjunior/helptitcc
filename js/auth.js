import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Verifica se o usuário está logado e busca o perfil no Firestore com segurança contra travamentos
export function exigirLogin(callback) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "index.html";
            return;
        }

        // Perfil padrão caso o Firestore falhe ou demore
        let perfil = { 
            tipo: "cliente", 
            nome: user.displayName || user.email.split('@')[0] 
        };

        try {
            // Cria uma promessa com timeout de 3 segundos para o Firestore
            const docRef = doc(db, "usuarios", user.uid);
            const fetchPromise = getDoc(docRef);
            
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(DesejaTempoEsgotado => {}), 3000)
            );

            const docSnap = await Promise.race([fetchPromise, timeoutPromise]);
            
            if (docSnap && docSnap.exists()) {
                const dados = docSnap.data();
                perfil.nome = dados.nome || perfil.nome;
                perfil.tipo = dados.tipo || "cliente";
            }
        } catch (error) {
            console.warn("Aviso: Não foi possível carregar do Firestore, usando dados básicos.", error);
        }

        // Garante que o callback sempre será executado, evitando o travamento
        callback(user, perfil);
    });
}

// Função para encerrar a sessão do usuário
export async function fazerLogout() {
    try {
        await signOut(auth);
    } catch (error) {
        throw new Error("Erro ao encerrar sessão: " + error.message);
    }
}