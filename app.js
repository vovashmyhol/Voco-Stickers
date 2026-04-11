/**
 * VOCO Stickers Mini App — единый кастомный скролл
 */

try {
    const tg = window.Telegram.WebApp;
    tg.ready();

    function updateSafeArea() {
        try {
            const inset = tg.contentSafeAreaInset || { top: 0, bottom: 0, left: 0, right: 0 };
            const root = document.documentElement;
            root.style.setProperty('--safeTop',    (inset.top    || 0) + 'px');
            root.style.setProperty('--safeBottom', (inset.bottom || 0) + 'px');
            root.style.setProperty('--safeLeft',   (inset.left   || 0) + 'px');
            root.style.setProperty('--safeRight',  (inset.right  || 0) + 'px');
        } catch (e) {}
    }

    function initWebApp() {
        tg.expand();
        if (tg.requestFullscreen)    tg.requestFullscreen();
        if (tg.setHeaderColor)       tg.setHeaderColor('transparent');
        if (tg.setBackgroundColor)   tg.setBackgroundColor('#06080d');
        if (typeof tg.disableVerticalSwipes === 'function') tg.disableVerticalSwipes();
        if (tg.isVerticalSwipesEnabled !== undefined) tg.isVerticalSwipesEnabled = false;
        updateSafeArea();
    }

    initWebApp();
    tg.onEvent('viewportChanged', updateSafeArea);
    window.addEventListener('resize', updateSafeArea);

} catch (e) {
    console.error('TG Init Error:', e);
}

document.addEventListener('DOMContentLoaded', () => {
    const banner          = document.getElementById('elastic-banner');
    const bannerContainer = document.getElementById('banner-container');
    const appEl           = document.getElementById('app');

    const BANNER_H      = 220;
    const VIEWPORT_H    = () => window.innerHeight;
    const CONTENT_H     = () => appEl.scrollHeight;
    const MAX_SCROLL    = () => Math.max(0, CONTENT_H() - VIEWPORT_H());

    // ── Текущая позиция скролла (в пикселях, 0 = самый верх) ─────────────────
    let scrollY   = 0;
    let velocity  = 0;
    let rafId     = null;

    // ── Блокируем нативный скролл полностью ───────────────────────────────────
    document.body.style.overflow   = 'hidden';
    document.body.style.height     = '100vh';
    document.documentElement.style.overflow = 'hidden';

    // appEl — наш «окно просмотра», двигаем его целиком через translateY
    appEl.style.willChange  = 'transform';
    appEl.style.position    = 'relative';

    // ── Применяем скролл ───────────────────────────────────────────────────────
    function applyScroll(y, instant = false) {
        scrollY = Math.max(0, Math.min(y, MAX_SCROLL()));

        // Параллакс баннера
        const parallax = scrollY * 0.4;
        banner.style.transition    = 'none';
        banner.style.transform     = `translateY(${parallax}px)`;

        // Двигаем весь контент вверх
        appEl.style.transition = instant ? 'none' : '';
        appEl.style.transform  = `translateY(${-scrollY}px)`;
    }

    // ── Инерция ───────────────────────────────────────────────────────────────
    function momentumLoop() {
        if (Math.abs(velocity) < 0.5) {
            velocity = 0;
            rafId = null;
            return;
        }
        velocity *= 0.92;
        applyScroll(scrollY + velocity, true);
        rafId = requestAnimationFrame(momentumLoop);
    }

    // ── Elastic (резиновый) отскок ────────────────────────────────────────────
    let elasticOffset = 0; // доп. смещение за пределы контента

    function applyElastic(extra) {
        elasticOffset = extra;
        appEl.style.transition = 'none';
        appEl.style.transform  = `translateY(${-scrollY + extra}px)`;
    }

    function releaseElastic() {
        appEl.style.transition = 'transform 0.45s cubic-bezier(0.175,0.885,0.32,1.275)';
        appEl.style.transform  = `translateY(${-scrollY}px)`;
        elasticOffset = 0;

        // Сброс баннера если были на верху
        if (scrollY === 0) {
            banner.style.transition    = 'transform 0.45s cubic-bezier(0.175,0.885,0.32,1.275)';
            bannerContainer.style.transition = 'height 0.45s cubic-bezier(0.175,0.885,0.32,1.275)';
            banner.style.transform     = 'scale(1)';
            bannerContainer.style.height = BANNER_H + 'px';
        }
    }

    // ── Touch ─────────────────────────────────────────────────────────────────
    let touchStartY = 0;
    let lastTouchY  = 0;
    let lastTouchT  = 0;
    let touchVel    = 0;
    let isElastic   = false;

    window.addEventListener('touchstart', (e) => {
        // Останавливаем инерцию
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        velocity    = 0;
        isElastic   = false;

        touchStartY = e.touches[0].pageY;
        lastTouchY  = touchStartY;
        lastTouchT  = Date.now();
        touchVel    = 0;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        // Всегда блокируем нативный скролл — мы управляем сами
        if (e.cancelable) e.preventDefault();

        const now  = Date.now();
        const y    = e.touches[0].pageY;
        const dy   = lastTouchY - y;   // >0 = скролл вверх, <0 = вниз
        const dt   = now - lastTouchT || 1;

        touchVel   = dy / dt * 16;     // px за кадр (~16ms)
        lastTouchY = y;
        lastTouchT = now;

        const newY = scrollY + dy;

        if (newY < 0) {
            // ─ Резина СВЕРХУ (тянем вниз за пределы) ─
            isElastic = true;
            const over  = -newY;
            const damp  = over / 3;

            // Растягиваем баннер
            const scale = 1 + damp / 220;
            const extra = damp * 0.45;
            banner.style.transition          = 'none';
            bannerContainer.style.transition = 'none';
            banner.style.transform           = `scale(${scale})`;
            bannerContainer.style.height     = (BANNER_H + extra) + 'px';

            applyElastic(damp);

        } else if (newY > MAX_SCROLL()) {
            // ─ Резина СНИЗУ (тянем вверх за пределы) ─
            isElastic = true;
            const over = newY - MAX_SCROLL();
            const damp = -(over / 3);
            applyElastic(damp);

        } else {
            // ─ Обычный скролл ─
            isElastic = false;
            applyScroll(newY, true);
        }
    }, { passive: false });

    window.addEventListener('touchend', () => {
        if (isElastic) {
            isElastic = false;
            releaseElastic();
        } else {
            // Запускаем инерцию
            velocity = touchVel;
            rafId = requestAnimationFrame(momentumLoop);
        }
    }, { passive: true });

    // ── Modal Logic ───────────────────────────────────────────────────────────
    const purchaseModal = document.getElementById('purchase-modal');
    const viewMoreBtn   = document.getElementById('view-more-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const buyButton     = document.querySelector('.buy-button');

    const openModal = () => {
        purchaseModal.classList.add('active');
    };
    const closeModal = () => {
        purchaseModal.classList.remove('active');
    };

    if (viewMoreBtn)   viewMoreBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    purchaseModal.addEventListener('click', (e) => {
        if (e.target === purchaseModal) closeModal();
    });

    if (buyButton) {
        buyButton.addEventListener('click', () => {
            buyButton.textContent = 'Обработка...';
            buyButton.style.backgroundColor = '#34c759';
            setTimeout(() => {
                buyButton.textContent = 'Открыто!';
                setTimeout(() => {
                    closeModal();
                    setTimeout(() => {
                        buyButton.textContent = 'Open';
                        buyButton.style.backgroundColor = '';
                    }, 500);
                }, 1000);
            }, 1500);
        });
    }
});