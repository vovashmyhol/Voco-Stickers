document.addEventListener('DOMContentLoaded', () => {
    const banner = document.getElementById('elastic-banner');
    const bannerContainer = document.getElementById('banner-container');
    const viewMoreBtn = document.getElementById('view-more-btn');
    const purchaseModal = document.getElementById('purchase-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const buyButton = document.querySelector('.buy-button');

    // 1. Elastic Scroll Effect
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
            // Pulling down
            const scale = 1 + diff / 500;
            banner.style.transform = `scale(${scale})`;
            bannerContainer.style.height = `${220 + diff * 0.5}px`;
            
            // Prevent default browser pull-to-refresh if possible
            if (diff > 10) {
                // e.preventDefault(); // Might need non-passive listener
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

    // 2. Modal Logic
    const openModal = () => {
        purchaseModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    };

    const closeModal = () => {
        purchaseModal.classList.remove('active');
        document.body.style.overflow = '';
    };

    viewMoreBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);

    // Close modal on background click
    purchaseModal.addEventListener('click', (e) => {
        if (e.target === purchaseModal) {
            closeModal();
        }
    });

    // 3. Buy Button Feedback
    buyButton.addEventListener('click', () => {
        buyButton.textContent = 'Обработка...';
        buyButton.style.backgroundColor = '#34c759'; // Success green
        
        setTimeout(() => {
            buyButton.textContent = 'Открыто!';
            setTimeout(() => {
                closeModal();
                // Reset button for next time
                setTimeout(() => {
                    buyButton.textContent = 'Open';
                    buyButton.style.backgroundColor = '';
                }, 500);
            }, 1000);
        }, 1500);
    });

    // 4. Parallax on Scroll (Standard)
    window.addEventListener('scroll', () => {
        if (window.scrollY > 0) {
            const scroll = window.scrollY;
            banner.style.transform = `translateY(${scroll * 0.4}px)`;
        }
    });
});
