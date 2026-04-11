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
            root.style.setProperty('--safeTop',    (inset.top    || 0) + 'px');
            root.style.setProperty('--safeBottom', (inset.bottom || 0) + 'px');
            root.style.setProperty('--safeLeft',   (inset.left   || 0) + 'px');
            root.style.setProperty('--safeRight',  (inset.right  || 0) + 'px');
        } catch (e) {}
    }

    function initWebApp() {
        tg.expand();
        if (tg.requestFullscreen)  tg.requestFullscreen();
        if (tg.setHeaderColor)     tg.setHeaderColor('transparent');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#06080d');
        if (tg.enableClosingConfirmation) tg.enableClosingConfirmation();
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

    const BANNER_H   = 220;
    const MAX_SCROLL = () => Math.max(0, appEl.scrollHeight - window.innerHeight);

    // Блокируем нативный скролл
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height   = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.height   = '100%';
    appEl.style.position   = 'relative';
    appEl.style.willChange = 'transform';

    let scrollY  = 0;
    let velocity = 0;
    let rafId    = null;

    // Применяем скролл + параллакс баннера
    function applyScroll(y) {
        scrollY = Math.max(0, Math.min(y, MAX_SCROLL()));
        appEl.style.transition  = 'none';
        appEl.style.transform   = `translateY(${-scrollY}px)`;
        banner.style.transition = 'none';
        // Параллакс только когда не на самом верху
        banner.style.transform  = scrollY > 0
            ? `translateY(${scrollY * 0.4}px)`
            : 'scale(1)';
        bannerContainer.style.height = BANNER_H + 'px';
    }

    // Инерция
    function momentumLoop() {
        if (Math.abs(velocity) < 0.5) { velocity = 0; rafId = null; return; }
        velocity *= 0.9;
        applyScroll(scrollY + velocity);
        rafId = requestAnimationFrame(momentumLoop);
    }

    // ── Touch ──────────────────────────────────────────────────────────────
    let touchStartY = 0;
    let lastY       = 0;
    let lastT       = 0;
    let touchVel    = 0;
    let isElastic   = false;

    window.addEventListener('touchstart', (e) => {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        velocity = 0;
        touchStartY = lastY = e.touches[0].pageY;
        lastT    = Date.now();
        touchVel = 0;
        isElastic = false;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        e.preventDefault(); // Блокируем TG от перехвата

        const now = Date.now();
        const y   = e.touches[0].pageY;
        const dy  = lastY - y;  // >0 = тянем вверх (скролл вниз), <0 = тянем вниз (скролл вверх)
        const dt  = now - lastT || 1;

        touchVel = dy / dt * 16;
        lastY    = y;
        lastT    = now;

        const target = scrollY + dy;

        if (target < 0) {
            // ── Резина СВЕРХУ: scrollY=0 и тянем вниз (dy < 0) ──────────
            isElastic    = true;
            const over   = -target;          // насколько вышли за 0
            const damp   = over / 3;         // демпфинг

            // Растягиваем баннер
            const scale  = 1 + damp / 220;
            const extra  = damp * 0.45;
            banner.style.transition          = 'none';
            bannerContainer.style.transition = 'none';
            banner.style.transform           = `scale(${scale})`;
            bannerContainer.style.height     = (BANNER_H + extra) + 'px';

            // Сдвигаем контент вниз
            appEl.style.transition = 'none';
            appEl.style.transform  = `translateY(${damp}px)`;

        } else if (target > MAX_SCROLL()) {
            // ── Резина СНИЗУ ─────────────────────────────────────────────
            isElastic  = true;
            const over = target - MAX_SCROLL();
            const damp = over / 3;

            appEl.style.transition = 'none';
            appEl.style.transform  = `translateY(${-(MAX_SCROLL() + damp)}px)`;

        } else {
            // ── Обычный скролл ────────────────────────────────────────────
            isElastic = false;
            applyScroll(target);
        }
    }, { passive: false });

    window.addEventListener('touchend', () => {
        if (isElastic) {
            // Пружинный возврат
            appEl.style.transition = 'transform 0.5s cubic-bezier(0.175,0.885,0.32,1.275)';
            appEl.style.transform  = `translateY(${-scrollY}px)`;

            banner.style.transition          = 'transform 0.5s cubic-bezier(0.175,0.885,0.32,1.275)';
            bannerContainer.style.transition = 'height 0.5s cubic-bezier(0.175,0.885,0.32,1.275)';
            banner.style.transform     = scrollY > 0 ? `translateY(${scrollY * 0.4}px)` : 'scale(1)';
            bannerContainer.style.height = BANNER_H + 'px';

            isElastic = false;
        } else {
            velocity = touchVel;
            rafId = requestAnimationFrame(momentumLoop);
        }
    }, { passive: true });

    // ── Modal ──────────────────────────────────────────────────────────────
    const purchaseModal = document.getElementById('purchase-modal');
    const viewMoreBtn   = document.getElementById('view-more-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const buyButton     = document.querySelector('.buy-button');

    const openModal  = () => purchaseModal.classList.add('active');
    const closeModal = () => purchaseModal.classList.remove('active');

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