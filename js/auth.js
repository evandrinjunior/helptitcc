import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// CORREÇÃO AQUI: Importando as funções do banco de dados para o auth.js
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

// 1. Função de Cadastro Normal
export async function cadastrarUsuario(nome, email, senha, tipo) {
    const credencial = await createUserWithEmailAndPassword(auth, email, senha);
    const user = credencial.user;
    
    // Salva o perfil no Firestore
    await setDoc(doc(db, "usuarios", user.uid), {
        nome: nome,
        email: email,
        tipo: tipo,
        criadoEm: new Date()
    });
    
    window.location.href = "feed.html";
}

// 2. Função de Login Normal
export async function logarUsuario(email, senha) {
    await signInWithEmailAndPassword(auth, email, senha);
    window.location.href = "feed.html";
}

// 3. Função do Google
export async function loginComGoogle() {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const user = cred.user;

    const docRef = doc(db, "usuarios", user.uid);
    const docSnap = await getDoc(docRef);

    // Se for o primeiro acesso, cria o perfil como cliente
    if (!docSnap.exists()) {
        await setDoc(docRef, {
            nome: user.displayName,
            email: user.email,
            tipo: "cliente",
            criadoEm: new Date()
        });
    }
    
    window.location.href = "feed.html";
}

// 4. Função que protege as páginas (Feed, Chat, Perfil)
export function exigirLogin(callback) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const docSnap = await getDoc(doc(db, "usuarios", user.uid));
            if (docSnap.exists()) {
                const perfil = docSnap.data();
                
                // Atualiza o nome na barra superior
                const nomeEl = document.getElementById("nome-usuario");
                if(nomeEl) nomeEl.textContent = perfil.nome;
                
                // Atualiza a etiqueta (badge) de tipo na barra superior
                const badgeEl = document.getElementById("badge-tipo");
                if(badgeEl) badgeEl.textContent = perfil.tipo;

                callback(user, perfil);
            }
        } else {
            window.location.href = "login.html";
        }
    });
}

// 5. Função de Sair
export async function deslogar() {
    await signOut(auth);
    window.location.href = "login.html";
}