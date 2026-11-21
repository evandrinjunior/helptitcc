import { auth, db } from "./firebase-config.js";
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function logarUsuario(email, senha) {
    const credencial = await signInWithEmailAndPassword(auth, email, senha);
    return credencial.user;
}

export async function logarComGoogle(tipoPadrao = "cliente") {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const resultado = await signInWithPopup(auth, provider);
    const user = resultado.user;

    try {
        const docRef = doc(db, "usuarios", user.uid);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout Firestore")), 2500)
        );
        const docSnap = await Promise.race([getDoc(docRef), timeoutPromise]);

        if (docSnap && !docSnap.exists()) {
            await Promise.race([
                setDoc(docRef, {
                    nome: user.displayName || user.email.split("@")[0],
                    email: user.email,
                    tipo: tipoPadrao,
                    dataCriacao: new Date().toISOString()
                }),
                timeoutPromise
            ]);
        }
    } catch (err) {
        console.warn("Aviso ao sincronizar perfil Google no Firestore:", err);
    }

    return user;
}

export async function cadastrarUsuario(nome, email, senha, tipo) {
    const credencial = await createUserWithEmailAndPassword(auth, email, senha);
    const user = credencial.user;

    try {
        await setDoc(doc(db, "usuarios", user.uid), {
            nome: nome,
            email: email,
            tipo: tipo,
            dataCriacao: new Date().toISOString()
        });
    } catch (err) {
        console.warn("Aviso ao salvar perfil no cadastro:", err);
    }

    return user;
}

export function exigirLogin(callback) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "login.html";
            return;
        }

        let perfil = { 
            tipo: "cliente", 
            nome: user.displayName || user.email.split('@')[0],
            latitude: null,
            longitude: null,
            cidade: null
        };

        try {
            const docRef = doc(db, "usuarios", user.uid);
            const fetchPromise = getDoc(docRef);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Timeout Firestore")), 3000)
            );

            const docSnap = await Promise.race([fetchPromise, timeoutPromise]);
            
            if (docSnap && docSnap.exists()) {
                const dados = docSnap.data();
                perfil.nome = dados.nome || perfil.nome;
                perfil.tipo = dados.tipo || "cliente";
                perfil.latitude = dados.latitude || null;
                perfil.longitude = dados.longitude || null;
                perfil.cidade = dados.cidade || null;
            }
        } catch (error) {
            console.warn("Aviso ao carregar perfil do Firestore:", error);
        }

        callback(user, perfil);
    });
}

export function redirecionarSeLogado(destino = "feed.html") {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            window.location.href = destino;
        }
    });
}

export async function fazerLogout() {
    await signOut(auth);
}

export { logarComGoogle as loginComGoogle };
export { logarUsuario as loginUsuario };