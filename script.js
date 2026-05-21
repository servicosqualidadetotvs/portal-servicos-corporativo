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
