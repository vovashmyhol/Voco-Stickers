/**
 * VOCO Stickers Mini App - True Fullscreen Implementation
 * 
 * Содержит полную логику инициализации Telegram WebApp SDK, 
 * настройки Safe Area и предотвращение сворачивания.
 */

try {
    const tg = window.Telegram.WebApp;

    // 1. Функция обновления безопасных зон (Safe Area)
    function updateSafeArea() {
        try {
            // Пытаемся получить данные из SDK или используем 0
            const inset = tg.contentSafeAreaInset || { top: 0, bottom: 0, left: 0, right: 0 };
            const root = document.documentElement;
            
            root.style.setProperty('--safeTop', (inset.top || 0) + 'px');
            root.style.setProperty('--safeBottom', (inset.bottom || 0) + 'px');
            root.style.setProperty('--safeLeft', (inset.left || 0) + 'px');
            root.style.setProperty('--safeRight', (inset.right || 0) + 'px');
            
            console.log('Safe Area Updated:', inset);
        } catch (e) {
            console.error('Error updating safe areas:', e);
        }
    }

    // 2. Основная инициализация (Выполняется максимально рано)
    function initWebApp() {
        tg.ready();
        
        // Расширяем и запрашиваем полноэкранный режим
        tg.expand();
        if (tg.requestFullscreen) {
            tg.requestFullscreen();
        }

        // Настройка визуального стиля "Прозрачный заголовок"
        if (tg.setHeaderColor) tg.setHeaderColor('transparent');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#06080d');

        // Отключение свайпов для предотвращения закрытия в фуллскрине
        if (tg.disableVerticalSwipes) {
            tg.disableVerticalSwipes();
        } else if (tg.isVerticalSwipeEnabled !== undefined) {
            tg.isVerticalSwipeEnabled = false;
        }

        // Первичное обновление отступов
        updateSafeArea();
    }

    // Запуск инициализации
    initWebApp();

    // 3. Обработка событий изменения окна/вьюпорта
    tg.onEvent('viewportChanged', updateSafeArea);
    window.addEventListener('resize', updateSafeArea);

} catch (e) {
    console.error('Telegram SDK Init Error:', e);
}

// 4. Стандартная логика интерфейса после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    const banner = document.getElementById('elastic-banner');
    const bannerContainer = document.getElementById('banner-container');
    const viewMoreBtn = document.getElementById('view-more-btn');
    const purchaseModal = document.getElementById('purchase-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const buyButton = document.querySelector('.buy-button');

    // 5. Elastic Scroll Effect
    let startY = 0;
    let isTouching = false;

    // Используем body для отслеживания скролла, так как в фуллскрине скроллится он
    const scrollContainer = document.body;

    window.addEventListener('touchstart', (e) => {
        if (scrollContainer.scrollTop <= 0) {
            startY = e.touches[0].pageY;
            isTouching = true;
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!isTouching || scrollContainer.scrollTop > 0) {
            isTouching = false;
            return;
        }

        const currentY = e.touches[0].pageY;
        const diff = currentY - startY;

        if (diff > 0) {
            const scale = 1 + diff / 500;
            banner.style.transform = `scale(${scale})`;
            bannerContainer.style.height = `${220 + diff * 0.5}px`;
            
            // Если тянем сильно вниз, предотвращаем стандартное поведение
            if (diff > 10 && e.cancelable) {
                // e.preventDefault(); 
            }
        }
    }, { passive: true });

    window.addEventListener('touchend', () => {
        isTouching = false;
        banner.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        bannerContainer.style.transition = 'height 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        banner.style.transform = 'scale(1)';
        bannerContainer.style.height = '220px';

        setTimeout(() => {
            banner.style.transition = '';
            bannerContainer.style.transition = '';
        }, 500);
    });

    // Modal Logic
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

    // Buy Button Feedback
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

    // Parallax
    scrollContainer.addEventListener('scroll', () => {
        if (scrollContainer.scrollTop > 0) {
            const scroll = scrollContainer.scrollTop;
            banner.style.transform = `translateY(${scroll * 0.4}px)`;
        }
    });
});
