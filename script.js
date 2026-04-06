// MODAL DE DETALHES
const modal = document.getElementById("modalOverlay");
const mTitle = document.getElementById("modalTitle");
const mDesc = document.getElementById("modalDescription");

function abrirModal(t, d) {
    mTitle.innerText = t;
    mDesc.innerText = d;
    modal.style.display = "flex";
}
function fecharModal() { modal.style.display = "none"; }

// TOGGLE THEME
function toggleTheme() {
    document.body.classList.toggle('dark');
    const icon = document.querySelector('.btn-theme i');
    if (document.body.classList.contains('dark')) {
        icon.className = 'fa-solid fa-sun';
    } else {
        icon.className = 'fa-solid fa-moon';
    }
}

// LÓGICA DO CHATBOT E BALÃO
const janelaChat = document.getElementById("janelaChat");
const chatBubble = document.getElementById("chatBubble");
const chatInput = document.getElementById("chatInput");
const chatContent = document.getElementById("chatContent");

// Variável para saber se o usuário fechou o balão manualmente
let balaoOcultoPeloUsuario = false;

// Função exclusiva para fechar apenas o balão de texto
function fecharBalaoChat(event) {
    event.stopPropagation(); // Impede que o clique abra o chat acidentalmente
    chatBubble.style.display = "none";
    balaoOcultoPeloUsuario = true;
}

function toggleChat() {
    // Se a janela estiver invisível, abrimos
    if (janelaChat.style.display === "none" || janelaChat.style.display === "") {
        janelaChat.style.display = "flex";
        chatBubble.style.display = "none"; // Esconde o balão ao abrir o chat
        chatInput.focus();
    } else {
        // Se já estiver aberta, fechamos
        janelaChat.style.display = "none";
        
        // Só volta a mostrar o balão de texto se o usuário não o tiver fechado no 'X'
        if (!balaoOcultoPeloUsuario) {
            chatBubble.style.display = "block";
        }
    }
}

// ENVIAR MENSAGENS (SIMULAÇÃO)
function enviarMensagemChat() {
    const texto = chatInput.value.trim();
    if (texto === "") return;

    // Mensagem do Usuário
    const userDiv = document.createElement("div");
    userDiv.className = "msg-user";
    userDiv.innerText = texto;
    chatContent.appendChild(userDiv);

    chatInput.value = "";
    chatContent.scrollTop = chatContent.scrollHeight;

    // Resposta automática do Bot (Simulada)
    setTimeout(() => {
        const botDiv = document.createElement("div");
        botDiv.className = "msg-bot";
        botDiv.innerText = "Estou a processar a sua dúvida...";
        chatContent.appendChild(botDiv);
        chatContent.scrollTop = chatContent.scrollHeight;
    }, 1000);
}

// Enviar com a tecla Enter
chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") enviarMensagemChat();
});