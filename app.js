// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Expand the app and request immersive fullscreen
    tg.expand();
    if (tg.requestFullscreen) {
        tg.requestFullscreen();
    }
    tg.disableVerticalSwipes(); // Prevents free pulling down to close at the top
    
    // 2. Set Theme Colors
    tg.setHeaderColor('#0088cc'); // Using the Voco blue
    tg.setBackgroundColor('#050b1a'); // Dark background
    
    // 3. Initialize User Data
    initUserData();
    
    // 4. Carousel Scroll Handling
    initCarousel();
 
    // 5. Scroll Overlay Handling (Blur effect on top)
    initScrollEffect();
 
    // 7. Modal Gestures (Swipe to close)
    initModalGestures();
    
    // 8. Telegram Main Button
    tg.ready();
});
 
/**
 * Handle top blur overlay on scroll
 */
function initScrollEffect() {
    const overlay = document.getElementById('scrollOverlay');
    window.addEventListener('scroll', () => {
        const scrollPos = window.scrollY;
        // Fade in over 100px of scroll
        const opacity = Math.min(scrollPos / 100, 1);
        overlay.style.opacity = opacity;
    });
}
 
/**
 * Initialize User Data from Telegram
 */
function initUserData() {
    const user = tg.initDataUnsafe?.user;
    const userPhotoImg = document.getElementById('userPhoto');
    const userPhotoLarge = document.getElementById('userPhotoLarge');
    const userName = document.getElementById('userName');
    const userId = document.getElementById('userId');
    const ownerName = document.getElementById('ownerName');
    
    if (user) {
        if (user.photo_url) {
            userPhotoImg.src = user.photo_url;
            userPhotoLarge.src = user.photo_url;
        }
        
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
        userName.textContent = fullName;
        ownerName.textContent = fullName;
        userId.textContent = user.id || 'Unknown';
        
        // Handle Copy ID
        document.getElementById('copyId').addEventListener('click', () => {
            if (user.id) {
                const idStr = user.id.toString();
                navigator.clipboard.writeText(idStr).then(() => {
                    tg.HapticFeedback.notificationOccurred('success');
                    // Simple temporary visual feedback
                    const originalText = userId.textContent;
                    userId.textContent = 'Copied!';
                    setTimeout(() => userId.textContent = originalText, 1000);
                });
            }
        });
    }
}
 
/**
 * Carousel logic for updating pagination dots
 */
function initCarousel() {
    const carousel = document.getElementById('collectionsCarousel');
    const dots = document.querySelectorAll('.dot');
    
    if (!carousel) return;
 
    carousel.onscroll = () => {
        const scrollPosition = carousel.scrollLeft;
        const cardWidth = carousel.querySelector('.pack-card').offsetWidth;
        const activeIndex = Math.round(scrollPosition / cardWidth);
        
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === activeIndex);
        });
    };
}
 
/**
 * PHASE 2: Modal, Purchase and Inventory Logic
 */
 
// Inventory State (Mocked with LocalStorage)
const INVENTORY_KEY = 'voco_inventory';
let inventory = JSON.parse(localStorage.getItem(INVENTORY_KEY) || '[]');
 
const modal = document.getElementById('packModal');
const buyBtn = document.getElementById('buyBtn');
const priceValue = document.getElementById('priceValue');
 
// 1. Pack click handling (Open Modal)
document.getElementById('vocoPack').addEventListener('click', () => {
    tg.HapticFeedback.impactOccurred('medium');
    openPackModal('VocoX');
});
 
// 2. Profile button (Show Profile View)
document.getElementById('profileBtn').addEventListener('click', () => {
    tg.HapticFeedback.impactOccurred('medium');
    openProfile();
});

function openProfile() {
    renderInventory();
    const profileView = document.getElementById('profileView');
    profileView.classList.add('active');
    updateBackButton();
    initProfileElasticScroll(profileView);
}

function initProfileElasticScroll(profileView) {
    const headerBg = document.getElementById('profileHeaderBg');
    const starsBg = document.getElementById('profileStarsBg');
    
    profileView.onscroll = () => {
        const scrollTop = profileView.scrollTop;
        
        if (scrollTop < 0) {
            // Pulling down (Overscroll)
            const scale = 1 + Math.abs(scrollTop) / 500;
            const translate = Math.abs(scrollTop) / 2;
            headerBg.style.transform = `scale(${scale}) translateY(${translate}px)`;
            starsBg.style.transform = `scale(${scale}) translateY(${translate}px)`;
        } else {
            // Normal scrolling (Parallax)
            const translate = scrollTop * 0.4;
            headerBg.style.transform = `translateY(${-translate}px)`;
            starsBg.style.transform = `translateY(${-translate}px)`;
        }
    };
}

function closeProfile() {
    const profileView = document.getElementById('profileView');
    if (profileView) profileView.classList.remove('active');
    updateBackButton();
}

/**
 * Global navigation handler for Telegram BackButton
 */
function updateBackButton() {
    const profileView = document.getElementById('profileView');
    const modalEl = document.getElementById('packModal');
    
    const isProfileActive = profileView && profileView.classList.contains('active');
    const isModalActive = modalEl && modalEl.classList.contains('active');

    if (isProfileActive || isModalActive) {
        tg.BackButton.show();
        tg.BackButton.offClick(handleBackAction); 
        tg.BackButton.onClick(handleBackAction);
    } else {
        tg.BackButton.hide();
    }
}

function handleBackAction() {
    const modalEl = document.getElementById('packModal');
    const profileView = document.getElementById('profileView');
    
    const isModalActive = modalEl && modalEl.classList.contains('active');
    const isProfileActive = profileView && profileView.classList.contains('active');

    if (isModalActive) {
        closeModal();
    } else if (isProfileActive) {
        closeProfile();
    }
}

function renderInventory() {
    const grid = document.getElementById('inventoryGrid');
    const packCount = document.getElementById('packCount');
    grid.innerHTML = '';
    
    packCount.textContent = inventory.length;

    inventory.forEach(packId => {
        const item = document.createElement('div');
        item.className = 'inventory-item';
        item.innerHTML = `
            <div class="inventory-sticker-container">
                <lottie-player 
                    src="https://raw.githubusercontent.com/vovashmyhol/Voco-Stickers/refs/heads/main/Artboard%201%20(3).json" 
                    background="transparent" 
                    speed="1" 
                    style="width: 100%; height: 100%;">
                </lottie-player>
            </div>
            <div class="inventory-item-name">The Pack</div>
        `;
        
        item.addEventListener('click', () => {
            console.log('Opening modal for pack:', packId); // Debug log
            openPackModal(packId, 'profile');
        });
        
        grid.appendChild(item);
    });
}

// 4. Modal Close
document.getElementById('closeModal').addEventListener('click', () => {
    closeModal();
});
 
// 4. Modal Slider Logic
const lottieSlider = document.getElementById('lottieSlider');
const modalDots = document.querySelectorAll('.m-dot');
 
if (lottieSlider) {
    lottieSlider.onscroll = () => {
        const scrollPosition = lottieSlider.scrollLeft;
        const slideWidth = lottieSlider.querySelector('.lottie-slide').offsetWidth;
        const activeIndex = Math.round(scrollPosition / slideWidth);
        
        modalDots.forEach((dot, index) => {
            dot.classList.toggle('active', index === activeIndex);
        });
    };
}
 
function openPackModal(packId, context = 'market') {
    const modalEl = document.getElementById('packModal');
    if (!modalEl) {
        console.error('Modal element not found!');
        return;
    }
    
    updateModalUI(packId, context);
    
    const modalContent = modalEl.querySelector('.modal-content');
    modalContent.classList.remove('dragging');
    
    // Impact feedback first
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }

    // Show the modal
    modalEl.classList.add('active');
    
    // Reset transform to ensure it's visible
    modalContent.style.transform = 'translate3d(0, 0, 0)';
    
    updateBackButton();
}
 
function closeModal() {
    const modalEl = document.getElementById('packModal');
    if (!modalEl) return;
    
    modalEl.classList.remove('active');
    
    const modalContent = modalEl.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.transform = 'translate3d(0, 110%, 0)';
    }
    
    updateBackButton();
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}
 
/**
 * Initialize Gesture-based closing (Swipe Down)
 */
function initModalGestures() {
    const modalContent = modal.querySelector('.modal-content');
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let dragDelta = 0;
 
    modalContent.addEventListener('touchstart', (e) => {
        // Only allow dragging down if we're not scrolling something else
        const scrollable = e.target.closest('.lottie-slider');
        if (scrollable && scrollable.scrollLeft > 0) {
            // Not allowing drag if they are mid-page in a horizontal slider
            return;
        }
 
        startY = e.touches[0].clientY;
        isDragging = true;
    }, { passive: true });
 
    modalContent.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        currentY = e.touches[0].clientY;
        dragDelta = currentY - startY;
 
        if (dragDelta > 0) {
            // Swiping down
            modalContent.classList.add('dragging');
            modalContent.style.transform = `translateY(${dragDelta}px)`;
            
            // Dim the overlay slightly more as we drag
            const opacity = 1 - Math.min(dragDelta / 400, 0.5);
            modal.style.background = `rgba(0, 0, 0, ${0.7 * opacity})`;
            
            // Prevent scrolling underlying page
            if (e.cancelable) e.preventDefault();
        }
    }, { passive: false });
 
    const handleRelease = () => {
        if (!isDragging) return;
        isDragging = false;
        
        modalContent.classList.remove('dragging');
 
        if (dragDelta > 100) {
            // Close threshold met
            closeModal();
            // Reset for next time after animation
            setTimeout(() => {
                modalContent.style.transform = '';
                modal.style.background = '';
            }, 300);
        } else {
            // Snap back
            modalContent.style.transform = 'translateY(0)';
            modal.style.background = '';
        }
        
        startY = 0;
        currentY = 0;
        dragDelta = 0;
    };
 
    modalContent.addEventListener('touchend', handleRelease);
    modalContent.addEventListener('touchcancel', handleRelease);
}
 
function updateModalUI(packId, context = 'market') {
    const marketInfo = document.getElementById('marketInfo');
    const ownerInfo = document.getElementById('ownerInfo');
    const buyBtn = document.getElementById('buyBtn');
    const priceValue = document.getElementById('priceValue');

    console.log('Updating Modal UI for:', packId, 'Context:', context);

    // Always show market info (Price & Supply)
    if (marketInfo) marketInfo.style.display = 'block';
    if (priceValue) priceValue.textContent = '15';

    if (context === 'profile') {
        // In profile, also show owner info and change button to Open
        if (ownerInfo) ownerInfo.style.display = 'block';
        buyBtn.textContent = 'Open';
    } else {
        // In market, hide owner info and set button to Get
        if (ownerInfo) ownerInfo.style.display = 'none';
        buyBtn.textContent = 'Get';
    }
}
 
// 5. Purchase Logic
document.getElementById('buyBtn').addEventListener('click', () => {
    // If we are in profile view, 'buyBtn' acts as 'Open'
    const isProfileActive = document.getElementById('profileView').classList.contains('active');
    
    if (isProfileActive) {
        // Open the sticker set
        tg.openTelegramLink('https://t.me/addstickers/VocoX');
    } else {
        // Market Mode: Purchase flow
        const invoiceUrl = 'https://t.me/$j4ADo8xWMEtDFgAAl_xEVL2lLAU';
        
        if (tg.initData && tg.openInvoice) {
            tg.openInvoice(invoiceUrl, (status) => {
                if (status === 'paid' || status === 'pending') {
                    confirmPurchase('VocoX');
                }
            });
        } else {
            // Browser Mode: Grant for free
            confirmPurchase('VocoX');
        }
    }
});
 
function confirmPurchase(packId) {
    inventory.push(packId);
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    
    tg.HapticFeedback.notificationOccurred('success');
    updateModalUI(packId, 'market');
}
