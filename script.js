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

function setupGlobalSearch() {
    const heroContent = document.querySelector('.hero-content');
    if (!heroContent || heroContent.querySelector('.hero-search')) {
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'hero-search-wrapper';
    wrapper.innerHTML = `
        <i class="fa-solid fa-magnifying-glass hero-search-icon"></i>
        <input type="text" class="hero-search" placeholder="Buscar serviços, dashboards ou ferramentas..." aria-label="Buscar serviços">
    `;

    heroContent.appendChild(wrapper);

    const input = wrapper.querySelector('.hero-search');
    const cards = Array.from(document.querySelectorAll('.card:not(.favorite-card)'));
    const sections = Array.from(document.querySelectorAll('.section-area'));
    const searchCache = new Map();

    const normalizeText = (value) => {
        return (value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    };

    const getTargetPage = (card) => {
        // Prefer explicit data-page attribute
        const dataPage = card.getAttribute('data-page');
        if (dataPage) return dataPage;

        // If the card contains an anchor, prefer its href
        const anchor = card.querySelector('a[href]');
        if (anchor) return anchor.getAttribute('href');

        // Parse common onclick patterns: window.open, window.location, window.location.href
        const onclick = card.getAttribute('onclick') || '';
        let match = onclick.match(/window\.open\(['"]([^'"]+)['"]/i);
        if (match) return match[1];
        match = onclick.match(/window\.location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i);
        if (match) return match[1];
        match = onclick.match(/window\.location\.replace\(['"]([^'"]+)['"]/i);
        if (match) return match[1];

        return null;
    };

    const getCardText = async (card) => {
        const title = card.querySelector('p')?.textContent || '';
        const targetPage = getTargetPage(card);

        if (!targetPage) {
            return normalizeText(title);
        }

        if (searchCache.has(targetPage)) {
            return searchCache.get(targetPage);
        }

        try {
            const response = await fetch(targetPage, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error('Page not found');
            }
            const html = await response.text();
            const temp = document.createElement('div');
            temp.innerHTML = html;
            const bodyText = temp.textContent || '';
            const combinedText = `${title} ${bodyText}`;
            searchCache.set(targetPage, normalizeText(combinedText));
            return searchCache.get(targetPage);
        } catch (error) {
            const combinedText = `${title}`;
            searchCache.set(targetPage, normalizeText(combinedText));
            return searchCache.get(targetPage);
        }
    };

    const updateVisibility = async (query) => {
        const normalizedQuery = normalizeText(query);

        if (!normalizedQuery) {
            cards.forEach((card) => {
                card.style.display = '';
            });
            sections.forEach((section) => {
                section.style.display = '';
            });
            return;
        }

        const visibleCards = [];
        for (const card of cards) {
            const searchableText = await getCardText(card);
            const isMatch = searchableText.includes(normalizedQuery);
            card.style.display = isMatch ? '' : 'none';
            if (isMatch) {
                visibleCards.push(card);
            }
        }

        sections.forEach((section) => {
            const sectionCards = Array.from(section.querySelectorAll('.card'));
            const hasVisibleCards = sectionCards.some((card) => card.style.display !== 'none');
            section.style.display = hasVisibleCards ? '' : 'none';
        });
    };

    input.addEventListener('input', (event) => {
        updateVisibility(event.target.value);
    });
}

function setupFavorites() {
    const container = document.querySelector('.container');
    if (!container || document.querySelector('.favorites-section')) {
        return;
    }

    const favoritesSection = document.createElement('section');
    favoritesSection.className = 'favorites-section';
    favoritesSection.innerHTML = `
        <div class="favorites-header">
            <button class="favorites-toggle" type="button" aria-expanded="true">
                <span class="favorites-title">
                    <span class="label-linha">Fixados</span>
                    <h2 class="titulo-secao">Fixados</h2>
                </span>
                <i class="fa-solid fa-chevron-up favorites-icon"></i>
            </button>
        </div>
        <div class="favorites-grid"></div>
    `;

    const firstSection = container.querySelector('.section-area');
    if (firstSection) {
        container.insertBefore(favoritesSection, firstSection);
    } else {
        container.appendChild(favoritesSection);
    }

    const favoritesGrid = favoritesSection.querySelector('.favorites-grid');
    const favoritesToggle = favoritesSection.querySelector('.favorites-toggle');
    const favoritesIcon = favoritesSection.querySelector('.favorites-icon');
    const cards = Array.from(document.querySelectorAll('.card'));
    const storageKey = 'portal-servicos-favoritos';

    const getStoredFavorites = () => {
        try {
            const stored = localStorage.getItem(storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    };

    const saveFavorites = (favorites) => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(favorites));
        } catch (error) {
            // Ignore storage errors in static environments.
        }
    };

    const getCardIdentifier = (card) => {
        const title = card.querySelector('p')?.textContent?.trim() || card.querySelector('h4')?.textContent?.trim() || 'card';

        // Determine target page using multiple strategies to avoid falling back to titles with accents
        const onclick = card.getAttribute('onclick') || '';
        const page = card.getAttribute('data-page')
            || onclick.match(/window\.open\(['"]([^'"]+)['"]/i)?.[1]
            || onclick.match(/window\.location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i)?.[1]
            || card.querySelector('a[href]')?.getAttribute('href')
            || title;

        return `${page}|${title}`;
    };

    const getTargetPage = (card) => {
        // Prefer explicit data-page attribute
        const dataPage = card.getAttribute('data-page');
        if (dataPage) return dataPage;

        // If the card contains an anchor, prefer its href
        const anchor = card.querySelector('a[href]');
        if (anchor) return anchor.getAttribute('href');

        // Parse common onclick patterns: window.open, window.location, window.location.href
        const onclick = card.getAttribute('onclick') || '';
        let match = onclick.match(/window\.open\(['"]([^'"]+)['"]/i);
        if (match) return match[1];
        match = onclick.match(/window\.location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i);
        if (match) return match[1];
        match = onclick.match(/window\.location\.replace\(['"]([^'"]+)['"]/i);
        if (match) return match[1];

        return null;
    };

    const buildFavoriteCard = (favoriteId) => {
        const parts = favoriteId.split('|');
        let page = parts[0] || '';
        const title = parts.slice(1).join('|') || 'Favorito';
        const originalCard = cards.find((card) => getCardIdentifier(card) === favoriteId);

        if (originalCard) {
            const favoriteCard = originalCard.cloneNode(true);
            favoriteCard.classList.add('favorite-card');
            favoriteCard.querySelector('.card-favorite-toggle')?.remove();

            const favoriteButton = document.createElement('button');
            favoriteButton.className = 'card-favorite-toggle active';
            favoriteButton.type = 'button';
            favoriteButton.setAttribute('aria-label', 'Remover dos fixados');
            favoriteButton.innerHTML = '<i class="fa-solid fa-thumbtack"></i>';
            favoriteButton.addEventListener('click', (event) => {
                event.stopPropagation();
                const currentFavorites = getStoredFavorites().filter((id) => id !== favoriteId);
                saveFavorites(currentFavorites);
                renderFavorites();
                updateCardButtons();
            });

            favoriteCard.insertBefore(favoriteButton, favoriteCard.firstChild);
            favoriteCard.dataset.favoriteId = favoriteId;
            // ensure clicking the favorite card navigates to the target page in the same tab
            if (page) {
                favoriteCard.addEventListener('click', (ev) => {
                    // ignore clicks on the favorite toggle button
                    if (ev.target.closest('.card-favorite-toggle')) return;
                    window.location.href = page;
                });
            }

            return favoriteCard;
        }

        const fallbackCard = document.createElement('div');
        fallbackCard.className = 'card favorite-card favorite-card-fallback';
        const normalizedTitle = title.replace(/\.html$/i, '').replace(/[-_]/g, ' ').trim();
        const displayLabel = normalizedTitle && normalizedTitle !== 'card' ? normalizedTitle : '';
        fallbackCard.innerHTML = `
            <button class="card-favorite-toggle active" type="button" aria-label="Remover dos fixados">
                <i class="fa-solid fa-thumbtack"></i>
            </button>
            ${displayLabel ? `<p>${displayLabel}</p>` : ''}
        `;

        fallbackCard.querySelector('.card-favorite-toggle').addEventListener('click', (event) => {
            event.stopPropagation();
            const currentFavorites = getStoredFavorites().filter((id) => id !== favoriteId);
            saveFavorites(currentFavorites);
            renderFavorites();
            updateCardButtons();
        });

        if (page) {
            // open in same tab for pinned/fallback cards
            fallbackCard.addEventListener('click', () => {
                window.location.href = page;
            });
        }

        fallbackCard.dataset.favoriteId = favoriteId;

        return fallbackCard;
    };

    const renderFavorites = () => {
        // repair and resolve stored favorites to real page URLs
        let favorites = getStoredFavorites();
        if (!favorites.length) {
            favoritesSection.style.display = 'none';
            return;
        }

        // build a title -> page map from current cards for robust resolution
        const titleToPage = new Map();
        const normalizeForMap = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        cards.forEach((c) => {
            const t = c.querySelector('p')?.textContent?.trim() || c.querySelector('h4')?.textContent?.trim() || '';
            const p = getTargetPage(c) || '';
            if (t && p) {
                titleToPage.set(normalizeForMap(t), p);
            }
        });

        // attempt to repair favorites that stored human titles instead of filenames
        let repaired = false;
        favorites = favorites.map((fav) => {
            const parts = fav.split('|');
            let storedPage = parts[0] || '';
            let title = parts.slice(1).join('|') || '';

            // If the stored favorite was saved as a single title string (no '|'), treat that as the title
            if ((!title || title.trim() === '') && storedPage && !storedPage.includes('.') && /\s/.test(storedPage)) {
                title = storedPage;
                storedPage = '';
            }

            const normalizedTitle = normalizeForMap(title);

            // if storedPage looks like a title or is empty, try to resolve using title->page map
            const looksLikeTitle = !storedPage || (!storedPage.includes('.') && /\s/.test(storedPage));
            if (looksLikeTitle && title && titleToPage.has(normalizedTitle)) {
                const resolved = titleToPage.get(normalizedTitle);
                repaired = true;
                return `${resolved}|${title}`;
            }

            // If nothing matched but we only had a title, convert to title-only canonical form
            if (!storedPage && title) {
                return `${title}|${title}`;
            }

            return fav;
        });

        if (repaired) {
            saveFavorites(favorites);
        }

        favoritesSection.style.display = '';
        favoritesGrid.innerHTML = '';
        favorites.forEach((favoriteId) => {
            favoritesGrid.appendChild(buildFavoriteCard(favoriteId));
        });
    };

    const updateCardButtons = () => {
        const favorites = getStoredFavorites();
        cards.forEach((card) => {
            const button = card.querySelector('.card-favorite-toggle');
            if (!button) {
                return;
            }
            const isFavorite = favorites.includes(getCardIdentifier(card));
            button.classList.toggle('active', isFavorite);
            button.setAttribute('aria-label', isFavorite ? 'Remover dos fixados' : 'Adicionar aos fixados');
            button.innerHTML = isFavorite ? '<i class="fa-solid fa-thumbtack"></i>' : '<i class="fa-solid fa-thumbtack"></i>';
        });
    };

    cards.forEach((card) => {
        if (card.querySelector('.card-favorite-toggle')) {
            return;
        }

        const favoriteButton = document.createElement('button');
        favoriteButton.className = 'card-favorite-toggle';
        favoriteButton.type = 'button';
        favoriteButton.setAttribute('aria-label', 'Adicionar aos fixados');
        favoriteButton.innerHTML = '<i class="fa-solid fa-thumbtack"></i>';

        favoriteButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            const id = getCardIdentifier(card);
            const favorites = getStoredFavorites();
            const isFavorite = favorites.includes(id);
            const nextFavorites = isFavorite
                ? favorites.filter((favoriteId) => favoriteId !== id)
                : [...favorites, id];

            saveFavorites(nextFavorites);
            updateCardButtons();
            // update favorites grid immediately
            if (!isFavorite) {
                // added
                favoritesGrid.appendChild(buildFavoriteCard(id));
                favoritesSection.style.display = '';
            } else {
                // removed
                Array.from(favoritesGrid.children).forEach((child) => {
                    if (child.dataset.favoriteId === id) child.remove();
                });
                if (!favoritesGrid.children.length) favoritesSection.style.display = 'none';
            }
        });

        card.insertBefore(favoriteButton, card.firstChild);
    });

    favoritesToggle.addEventListener('click', () => {
        const isCollapsed = favoritesGrid.classList.toggle('collapsed');
        favoritesToggle.setAttribute('aria-expanded', String(!isCollapsed));
        favoritesIcon.classList.toggle('collapsed', isCollapsed);
    });

    updateCardButtons();
    renderFavorites();

    // Safety pass: ensure every .card has a favorite button (fixes pages where buttons were missing)
    const ensureButtonsPresent = () => {
        const allCards = Array.from(document.querySelectorAll('.card'));
        allCards.forEach((card) => {
            if (card.querySelector('.card-favorite-toggle')) return;

            const favoriteButton = document.createElement('button');
            favoriteButton.className = 'card-favorite-toggle';
            favoriteButton.type = 'button';
            favoriteButton.setAttribute('aria-label', 'Adicionar aos fixados');
            favoriteButton.innerHTML = '<i class="fa-solid fa-thumbtack"></i>';
            favoriteButton.style.zIndex = 5;

            favoriteButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

                const id = getCardIdentifier(card);
                const favorites = getStoredFavorites();
                const isFavorite = favorites.includes(id);
                const nextFavorites = isFavorite
                    ? favorites.filter((favoriteId) => favoriteId !== id)
                    : [...favorites, id];

                saveFavorites(nextFavorites);
                updateCardButtons();
                // update favorites grid immediately
                if (!isFavorite) {
                    favoritesGrid.appendChild(buildFavoriteCard(id));
                    favoritesSection.style.display = '';
                } else {
                    Array.from(favoritesGrid.children).forEach((child) => {
                        if (child.dataset.favoriteId === id) child.remove();
                    });
                    if (!favoritesGrid.children.length) favoritesSection.style.display = 'none';
                }
            });

            card.insertBefore(favoriteButton, card.firstChild);
        });
    };

    ensureButtonsPresent();
}

setupHeroVideoBackgrounds();
setupGlobalSearch();
setupFavorites();

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
function applyTheme(isDark) {
    document.body.classList.toggle('dark', isDark);
    const icon = document.querySelector('.btn-theme i');
    if (icon) {
        icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
    localStorage.setItem('portal-servicos-theme', isDark ? 'dark' : 'light');
}

function toggleTheme() {
    const isDark = !document.body.classList.contains('dark');
    applyTheme(isDark);
}

const savedTheme = localStorage.getItem('portal-servicos-theme');
if (savedTheme === 'dark') {
    applyTheme(true);
} else {
    applyTheme(false);
}
