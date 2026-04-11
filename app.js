/**
 * VOCO Stickers Mini App - True Fullscreen Implementation
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

        if (typeof tg.disableVerticalSwipes === 'function') {
            tg.disableVerticalSwipes();
        }
        if (tg.isVerticalSwipesEnabled !== undefined) {
            tg.isVerticalSwipesEnabled = false;
        }

        updateSafeArea();
    }

    initWebApp();
    tg.onEvent('viewportChanged', updateSafeArea);
    window.addEventListener('resize', updateSafeArea);

} catch (e) {
    console.error('TG Init Error:', e);
}

document.addEventListener('DOMContentLoaded', () => {
    const banner = document.getElementById('elastic-banner');
    const bannerContainer = document.getElementById('banner-container');
    const viewMoreBtn = document.getElementById('view-more-btn');
    const purchaseModal = document.getElementById('purchase-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const buyButton = document.querySelector('.buy-button');

    // Элемент для эффекта снизу
    const bottomEl = document.querySelector('.content-wrapper');

    // --- Elastic Scroll Effect (TOP + BOTTOM) ---
    let startY = 0;
    let isTouching = false;
    let direction = null; // 'top' | 'bottom'

    function isAtBottom() {
        return (window.innerHeight + window.scrollY) >= document.body.scrollHeight - 2;
    }

    function isAtTop() {
        return window.scrollY <= 0;
    }

    window.addEventListener('touchstart', (e) => {
        startY = e.touches[0].pageY;
        isTouching = false;
        direction = null;

        if (isAtTop()) {
            direction = 'top';
            isTouching = true;
        } else if (isAtBottom()) {
            direction = 'bottom';
            isTouching = true;
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!isTouching || !direction) return;

        const currentY = e.touches[0].pageY;
        const diff = currentY - startY;

        if (direction === 'top' && diff > 0) {
            // Тянем вниз на самом верху — эффект растяжения баннера
            if (e.cancelable) e.preventDefault();

            const scale = 1 + diff / 400;
            const extraHeight = diff * 0.5;

            banner.style.transition = 'none';
            bannerContainer.style.transition = 'none';
            banner.style.transform = `scale(${scale})`;
            bannerContainer.style.height = `${220 + extraHeight}px`;

        } else if (direction === 'bottom' && diff < 0) {
            // Тянем вверх на самом низу — эффект пружины снизу
            if (e.cancelable) e.preventDefault();

            const pull = Math.abs(diff);
            const translateY = -(pull * 0.3);

            bottomEl.style.transition = 'none';
            bottomEl.style.transform = `translateY(${translateY}px)`;

        } else {
            // Потянули не в ту сторону — отменяем
            isTouching = false;
            resetAll();
        }
    }, { passive: false });

    window.addEventListener('touchend', () => {
        if (isTouching) {
            isTouching = false;
            resetAll();
        }
    });

    function resetBanner() {
        banner.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        bannerContainer.style.transition = 'height 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        banner.style.transform = 'scale(1)';
        bannerContainer.style.height = '220px';
    }

    function resetBottom() {
        bottomEl.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        bottomEl.style.transform = 'translateY(0)';
    }

    function resetAll() {
        resetBanner();
        resetBottom();
    }

    // --- Parallax при обычном скролле ---
    window.addEventListener('scroll', () => {
        if (window.scrollY > 0) {
            const scroll = window.scrollY;
            banner.style.transform = `translateY(${scroll * 0.4}px)`;
        }
    });

    // --- Modal Logic ---
    const openModal = () => {
        purchaseModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        purchaseModal.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (viewMoreBtn) viewMoreBtn.addEventListener('click', openModal);
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