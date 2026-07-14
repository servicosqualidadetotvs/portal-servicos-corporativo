function setupHeroVideoBackgrounds() {
    const heroes = document.querySelectorAll('.hero');
    heroes.forEach((hero) => {
        if (!hero.querySelector('.hero-video')) {
            const video = document.createElement('video');
            video.className = 'hero-video';
            video.autoplay = true;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = 'metadata';

            const source = document.createElement('source');
            source.src = 'theme/videobanner.mp4';
            source.type = 'video/mp4';
            video.appendChild(source);

            hero.insertBefore(video, hero.firstChild);
        }
    });
}

setupHeroVideoBackgrounds();

// MODAL DE DETALHES
const modal = document.getElementById("modalOverlay");
const mTitle = document.getElementById("modalTitle");
const mDesc = document.getElementById("modalDescription");

function abrirModal(t, d) {
    mTitle.innerText = t;
    mDesc.innerHTML = "";
    mDesc.innerText = d;
    modal.style.display = "flex";
}

function abrirModalHtml(t, htmlContent) {
    mTitle.innerText = t;
    mDesc.innerHTML = htmlContent;
    modal.style.display = "flex";
}

function fecharModal() { modal.style.display = "none"; }

// TABS DE DASHBOARDS
const tabButtons = document.querySelectorAll('.tab-btn');
const dashboardGroups = document.querySelectorAll('.dashboard-group');

tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const selectedTab = button.dataset.tab;

        tabButtons.forEach((btn) => {
            const isActive = btn === button;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        dashboardGroups.forEach((group) => {
            const shouldShow = group.dataset.category === selectedTab;
            group.hidden = !shouldShow;
        });
    });
});

// MODAL PARA O PAINEL DE CAPACITAÇÃO NO MDW
const capacitacaoLinks = document.querySelectorAll('[data-action="open-capacitacao-modal"]');

capacitacaoLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        abrirModalHtml(
            'Painel Capacitação',
            '<div class="dashboard-embed"><iframe width="100%" height="3750" src="https://datastudio.google.com/embed/reporting/a05ba967-fe6c-4a1d-b2e1-bfb477e45043/page/p_uebx448erc" frameborder="0" style="border:0" allowfullscreen sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe></div>'
        );
    });
});

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
