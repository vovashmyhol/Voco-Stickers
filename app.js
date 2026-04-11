// 1. Мгновенная инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();

// Расширяем и запрашиваем фуллскрин сразу
tg.expand();
if (tg.requestFullscreen) {
  tg.requestFullscreen();
}

// Устанавливаем прозрачный заголовок и специфический фон
if (tg.setHeaderColor) tg.setHeaderColor('transparent');
if (tg.setBackgroundColor) tg.setBackgroundColor('#06080d');

// Отключаем вертикальный свайп, чтобы приложение не сворачивалось
if (tg.isVerticalSwipeEnabled !== undefined) {
    tg.isVerticalSwipeEnabled = false; 
}

document.addEventListener('DOMContentLoaded', () => {
    const banner = document.getElementById('elastic-banner');
    const bannerContainer = document.getElementById('banner-container');
    const viewMoreBtn = document.getElementById('view-more-btn');
    const purchaseModal = document.getElementById('purchase-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const buyButton = document.querySelector('.buy-button');

    // 2. Elastic Scroll Effect (с доработкой под фуллскрин)
    let startY = 0;
    let isTouching = false;

    window.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) {
            startY = e.touches[0].pageY;
            isTouching = true;
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!isTouching || window.scrollY > 0) return;

        const currentY = e.touches[0].pageY;
        const diff = currentY - startY;

        if (diff > 0) {
            const scale = 1 + diff / 500;
            banner.style.transform = `scale(${scale})`;
            bannerContainer.style.height = `${220 + diff * 0.5}px`;
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

    // 3. Modal Logic
    const openModal = () => {
        purchaseModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        purchaseModal.classList.remove('active');
        document.body.style.overflow = '';
    };

    viewMoreBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);

    purchaseModal.addEventListener('click', (e) => {
        if (e.target === purchaseModal) closeModal();
    });

    // 4. Buy Button Feedback
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

    // 5. Parallax
    window.addEventListener('scroll', () => {
        if (window.scrollY > 0) {
            const scroll = window.scrollY;
            banner.style.transform = `translateY(${scroll * 0.4}px)`;
        }
    });
});
