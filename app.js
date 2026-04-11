/**
 * VOCO Stickers Mini App
 */

try {
    const tg = window.Telegram.WebApp;
    tg.ready();

    function updateSafeArea() {
        try {
            const inset = tg.contentSafeAreaInset || { top: 0, bottom: 0, left: 0, right: 0 };
            const root = document.documentElement;
            root.style.setProperty('--safeTop', (inset.top || 0) + 'px');
            root.style.setProperty('--safeBottom', (inset.bottom || 0) + 'px');
            root.style.setProperty('--safeLeft', (inset.left || 0) + 'px');
            root.style.setProperty('--safeRight', (inset.right || 0) + 'px');
        } catch (e) {}
    }

    function initWebApp() {
        tg.expand();
        if (tg.requestFullscreen) tg.requestFullscreen();
        if (tg.setHeaderColor) tg.setHeaderColor('transparent');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#06080d');
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
    const banner        = document.getElementById('elastic-banner');
    const bannerContainer = document.getElementById('banner-container');
    const contentWrapper  = document.querySelector('.content-wrapper');

    const BANNER_H = 220;

    // ─── Состояние одного жеста ───────────────────────────────────────────────
    let gestureStartY   = 0;
    let gestureType     = null;   // null | 'elastic-top' | 'elastic-bottom' | 'scroll'
    let elasticActive   = false;

    // ─── Helpers ──────────────────────────────────────────────────────────────
    const atTop    = () => window.scrollY <= 0;
    const atBottom = () => window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;

    function resetBanner(animate = true) {
        if (animate) {
            banner.style.transition        = 'transform 0.45s cubic-bezier(0.175,0.885,0.32,1.275)';
            bannerContainer.style.transition = 'height 0.45s cubic-bezier(0.175,0.885,0.32,1.275)';
        } else {
            banner.style.transition        = 'none';
            bannerContainer.style.transition = 'none';
        }
        banner.style.transform         = 'scale(1)';
        bannerContainer.style.height   = BANNER_H + 'px';
    }

    function resetBottom(animate = true) {
        contentWrapper.style.transition = animate
            ? 'transform 0.45s cubic-bezier(0.175,0.885,0.32,1.275)'
            : 'none';
        contentWrapper.style.transform = 'translateY(0)';
    }

    function resetAll(animate = true) {
        resetBanner(animate);
        resetBottom(animate);
    }

    // ─── Parallax при скролле (только баннер, только когда нет elastic-жеста) ─
    window.addEventListener('scroll', () => {
        if (elasticActive) return;          // идёт elastic — не трогаем
        const s = window.scrollY;
        if (s > 0) {
            // убираем scale, ставим параллакс
            banner.style.transition = 'none';
            banner.style.transform  = `translateY(${s * 0.4}px)`;
        } else {
            // вернулись наверх — сброс
            banner.style.transform = 'scale(1)';
        }
    }, { passive: true });

    // ─── Touch handlers ───────────────────────────────────────────────────────
    window.addEventListener('touchstart', (e) => {
        gestureStartY = e.touches[0].pageY;
        gestureType   = null;
        elasticActive = false;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        const dy = e.touches[0].pageY - gestureStartY;

        // Определяем тип жеста один раз в начале движения
        if (gestureType === null) {
            if (dy > 4 && atTop()) {
                gestureType   = 'elastic-top';
                elasticActive = true;
                resetAll(false);            // сброс без анимации перед началом
            } else if (dy < -4 && atBottom()) {
                gestureType   = 'elastic-bottom';
                elasticActive = true;
            } else {
                gestureType = 'scroll';
            }
        }

        if (gestureType === 'elastic-top') {
            if (e.cancelable) e.preventDefault();   // блокируем TG-сворачивание
            const pull  = Math.max(0, dy);
            const scale = 1 + pull / 450;
            const extra = pull * 0.45;
            banner.style.transition          = 'none';
            bannerContainer.style.transition = 'none';
            banner.style.transform           = `scale(${scale})`;
            bannerContainer.style.height     = (BANNER_H + extra) + 'px';

        } else if (gestureType === 'elastic-bottom') {
            if (e.cancelable) e.preventDefault();
            const pull      = Math.max(0, -dy);
            const translateY = -(pull * 0.28);
            contentWrapper.style.transition = 'none';
            contentWrapper.style.transform  = `translateY(${translateY}px)`;
        }
        // 'scroll' — ничего не делаем, браузер сам скроллит
    }, { passive: false });

    window.addEventListener('touchend', () => {
        if (elasticActive) {
            elasticActive = false;
            resetAll(true);
        }
        gestureType = null;
    }, { passive: true });

    // ─── Modal Logic ──────────────────────────────────────────────────────────
    const purchaseModal = document.getElementById('purchase-modal');
    const viewMoreBtn   = document.getElementById('view-more-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const buyButton     = document.querySelector('.buy-button');

    const openModal = () => {
        purchaseModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    const closeModal = () => {
        purchaseModal.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (viewMoreBtn)   viewMoreBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    purchaseModal.addEventListener('click', (e) => { if (e.target === purchaseModal) closeModal(); });

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