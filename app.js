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

        // Fullscreen
        if (tg.requestFullscreen) tg.requestFullscreen();

        // Colors
        if (tg.setHeaderColor) tg.setHeaderColor('transparent');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#06080d');

        // --- КЛЮЧЕВОЕ: отключаем вертикальные свайпы ---
        // Это предотвращает закрытие/сворачивание приложения при свайпе вниз
        if (typeof tg.disableVerticalSwipes === 'function') {
            tg.disableVerticalSwipes();
        }
        // Для старых версий SDK
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

    // --- Elastic Scroll Effect ---
    let startY = 0;
    let isTouching = false;

    window.addEventListener('touchstart', (e) => {
        if (window.scrollY <= 0) {
            startY = e.touches[0].pageY;
            isTouching = true;
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!isTouching) return;

        const currentY = e.touches[0].pageY;
        const diff = currentY - startY;

        if (diff > 0 && window.scrollY <= 0) {
            // Блокируем нативный скролл и сворачивание окна TG
            if (e.cancelable) {
                e.preventDefault();
            }

            const scale = 1 + diff / 400;
            const extraHeight = diff * 0.5;

            banner.style.transition = 'none';
            bannerContainer.style.transition = 'none';
            banner.style.transform = `scale(${scale})`;
            bannerContainer.style.height = `${220 + extraHeight}px`;

        } else if (diff < 0) {
            isTouching = false;
            resetBanner();
        }
    }, { passive: false });

    function resetBanner() {
        banner.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        bannerContainer.style.transition = 'height 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        banner.style.transform = 'scale(1)';
        bannerContainer.style.height = '220px';
    }

    window.addEventListener('touchend', () => {
        if (isTouching) {
            isTouching = false;
            resetBanner();
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

    // --- Parallax ---
    window.addEventListener('scroll', () => {
        if (window.scrollY > 0) {
            const scroll = window.scrollY;
            banner.style.transform = `translateY(${scroll * 0.4}px)`;
        }
    });
});