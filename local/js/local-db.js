// ============================================================
// "BANCO DE DADOS" LOCAL — HelpTI (sem Firebase)
// Guarda tudo no localStorage do navegador, nas chaves:
//   helpti_local_usuarios   → lista de usuários cadastrados
//   helpti_local_sessao     → uid do usuário logado agora
//   helpti_local_demandas   → lista de chamados
//   helpti_local_mensagens  → { [demandaId]: [mensagens...] }
//
// Mesmo "formato" de dados da versão com Firebase (js/auth.js,
// js/demandas.js, js/chat.js) — trocar para o banco de verdade
// depois é só trocar de onde essas funções leem/escrevem.
//
// Funciona em várias abas ao mesmo tempo: abra uma aba como
// cliente e outra como técnico para simular os dois lados do chat.
// ============================================================

const CHAVE_USUARIOS = "helpti_local_usuarios";
const CHAVE_SESSAO = "helpti_local_sessao";
const CHAVE_DEMANDAS = "helpti_local_demandas";
const CHAVE_MENSAGENS = "helpti_local_mensagens";

function ler(chave, padrao) {
  try {
    const val = localStorage.getItem(chave);
    return val ? JSON.parse(val) : padrao;
  } catch {
    return padrao;
  }
}
function escrever(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}
function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ============================================================
// USUÁRIOS / SESSÃO
// ============================================================
export function cadastrarUsuario({ nome, email, senha, tipo }) {
  const usuarios = ler(CHAVE_USUARIOS, []);
  if (usuarios.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("Esse e-mail já está cadastrado.");
  }
  const novo = { uid: gerarId(), nome, email, senha, tipo };
  usuarios.push(novo);
  escrever(CHAVE_USUARIOS, usuarios);
  escrever(CHAVE_SESSAO, novo.uid);
  return novo;
}

export function loginUsuario({ email, senha }) {
  const usuarios = ler(CHAVE_USUARIOS, []);
  const user = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha);
  if (!user) throw new Error("E-mail ou senha incorretos.");
  escrever(CHAVE_SESSAO, user.uid);
  return user;
}

export function logoutUsuario() {
  localStorage.removeItem(CHAVE_SESSAO);
  window.location.href = "login.html";
}

export function usuarioLogado() {
  const uid = ler(CHAVE_SESSAO, null);
  if (!uid) return null;
  const usuarios = ler(CHAVE_USUARIOS, []);
  return usuarios.find(u => u.uid === uid) || null;
}

// Guarda de rota — chama no topo de toda página que exige login
export function exigirLogin(callback) {
  const user = usuarioLogado();
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  callback(user);
}

// ============================================================
// DEMANDAS (chamados)
// ============================================================
export function gerarTicketId() {
  const demandas = ler(CHAVE_DEMANDAS, []);
  const ano = new Date().getFullYear();
  return `HT-${ano}-${String(demandas.length + 1).padStart(4, "0")}`;
}

export function criarDemanda({ titulo, descricao, categoria, clienteId, clienteNome }) {
  const demandas = ler(CHAVE_DEMANDAS, []);
  const nova = {
    id: gerarId(),
    ticketId: gerarTicketId(),
    titulo,
    descricao,
    categoria,
    status: "aberto",
    clienteId,
    clienteNome,
    tecnicoId: null,
    tecnicoNome: null,
    criadoEm: Date.now()
  };
  demandas.unshift(nova);
  escrever(CHAVE_DEMANDAS, demandas);
  return nova;
}

export function listarDemandas() {
  return ler(CHAVE_DEMANDAS, []).sort((a, b) => b.criadoEm - a.criadoEm);
}

export function assumirDemanda(demandaId, { tecnicoId, tecnicoNome }) {
  const demandas = ler(CHAVE_DEMANDAS, []);
  const d = demandas.find(x => x.id === demandaId);
  if (!d) return;
  d.status = "em_negociacao";
  d.tecnicoId = tecnicoId;
  d.tecnicoNome = tecnicoNome;
  escrever(CHAVE_DEMANDAS, demandas);
}

export function atualizarStatusDemanda(demandaId, novoStatus) {
  const demandas = ler(CHAVE_DEMANDAS, []);
  const d = demandas.find(x => x.id === demandaId);
  if (!d) return;
  d.status = novoStatus;
  escrever(CHAVE_DEMANDAS, demandas);
}

export function buscarDemanda(demandaId) {
  return ler(CHAVE_DEMANDAS, []).find(x => x.id === demandaId) || null;
}

// ============================================================
// MENSAGENS (chat por chamado)
// ============================================================
export function enviarMensagem(demandaId, { remetenteId, remetenteNome, texto }) {
  const todas = ler(CHAVE_MENSAGENS, {});
  if (!todas[demandaId]) todas[demandaId] = [];
  todas[demandaId].push({ id: gerarId(), remetenteId, remetenteNome, texto, criadoEm: Date.now() });
  escrever(CHAVE_MENSAGENS, todas);
}

export function listarMensagens(demandaId) {
  const todas = ler(CHAVE_MENSAGENS, {});
  return (todas[demandaId] || []).sort((a, b) => a.criadoEm - b.criadoEm);
}

// ============================================================
// Atualização em tempo real entre abas
// Chame isto para reagir quando OUTRA aba mudar os dados
// (ex: técnico assume o chamado numa aba, cliente vê na hora na outra)
// ============================================================
export function escutarMudancas(callback) {
  window.addEventListener("storage", (e) => {
    if ([CHAVE_DEMANDAS, CHAVE_MENSAGENS].includes(e.key)) callback();
  });
}

export const LABEL_STATUS = { aberto: "Aberto", em_negociacao: "Em negociação", resolvido: "Resolvido", cancelado: "Cancelado" };
export const LABEL_CATEGORIA = { hardware: "🖥️ Hardware", software: "💻 Software" };

// ============================================================
// Utilitário para popular dados de teste rapidamente (opcional)
// Chame window.helptiSeed() no console do navegador para testar.
// ============================================================
window.helptiSeed = function () {
  const tecnico = cadastrarUsuario({ nome: "Marcos Costa", email: "tecnico@teste.com", senha: "123456", tipo: "tecnico" });
  const cliente = cadastrarUsuario({ nome: "Fernanda Lima", email: "cliente@teste.com", senha: "123456", tipo: "cliente" });
  criarDemanda({ titulo: "Notebook não liga após atualização", descricao: "Trava na tela de logo do Windows.", categoria: "hardware", clienteId: cliente.uid, clienteNome: cliente.nome });
  console.log("Usuários de teste criados: tecnico@teste.com / cliente@teste.com — senha 123456");
};
