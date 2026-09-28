import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

export async function logarUsuario(email, senha) {
  try {
    await signInWithEmailAndPassword(auth, email, senha);
    window.location.href = "feed.html";
  } catch (error) {
    throw new Error("Erro ao entrar. Verifique o e-mail e a senha.");
  }
}

export async function cadastrarUsuario(nome, email, senha, tipo) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    // Guarda os dados de perfil no Firestore
    await setDoc(doc(db, "usuarios", cred.user.uid), {
      nome: nome,
      email: email,
      tipo: tipo,
      criadoEm: new Date()
    });
    window.location.href = "feed.html";
  } catch (error) {
    throw new Error("Erro ao criar conta.");
  }
}

export function logoutUsuario() {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
}

// Esta é a função mágica que resolve o seu problema do topo da tela
export function exigirLogin(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html"; // Manda para o login se não estiver autenticado
      return;
    }
    
    try {
      // Vai ao Firestore buscar os dados reais que foram guardados no cadastro
      const docRef = doc(db, "usuarios", user.uid);
      const docSnap = await getDoc(docRef);
      
      let perfil = { nome: user.email, tipo: "cliente" }; // Fallback caso falhe
      
      if (docSnap.exists()) {
        perfil = docSnap.data();
      }

      // 1. Atualiza automaticamente o nome no topo de TODAS as páginas
      const elNome = document.getElementById("nome-usuario");
      const elTipo = document.getElementById("badge-tipo");
      
      if (elNome) elNome.textContent = perfil.nome;
      if (elTipo) elTipo.textContent = perfil.tipo;

      // 2. Devolve os dados para a página usar onde precisar
      callback(user, perfil);
      
    } catch (e) {
      console.error("Erro ao puxar dados do Firestore:", e);
    }
  });
}