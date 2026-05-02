// Initialize Telegram WebApp
const tg = window.Telegram?.WebApp || {};

// Splash screen logic: wait for both minimum time AND full page load
let minTimeElapsed = false;
let pageLoaded = false;

function hideSplash() {
    const splash = document.getElementById('splashScreen');
    const app = document.getElementById('app');
    if (!splash) return;
    
    splash.classList.add('hidden');
    if (app) app.classList.remove('is-loading');

    const cleanup = () => splash.remove();
    splash.addEventListener('transitionend', cleanup, { once: true });
    setTimeout(cleanup, 600);
}

function checkSplashStatus() {
    if (minTimeElapsed && pageLoaded) {
        hideSplash();
    }
}

// Minimum display time (1600ms)
setTimeout(() => {
    minTimeElapsed = true;
    checkSplashStatus();
}, 1600);

// Full page load event
window.addEventListener('load', () => {
    pageLoaded = true;
    checkSplashStatus();
});

// Fallback: Force hide after 5 seconds no matter what
setTimeout(() => {
    if (!document.getElementById('splashScreen')?.classList.contains('hidden')) {
        hideSplash();
    }
}, 5000);

document.addEventListener('DOMContentLoaded', () => {
    // 1. Expand the app and request immersive fullscreen
    try {
        if (tg.expand) tg.expand();
        if (tg.requestFullscreen) tg.requestFullscreen();
        if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
        if (tg.setHeaderColor) tg.setHeaderColor('#0088cc');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#050b1a');
    } catch (e) {
        console.warn('Telegram SDK not available:', e);
    }
    
    initUserData();
    initCarousel();
    initScrollEffect();
    initModalGestures();
    
    try { if (tg.ready) tg.ready(); } catch (e) {}
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
    if (!grid) return;
    
    grid.innerHTML = '';
    packCount.textContent = inventory.length;

    if (inventory.length === 0) {
        // Render Empty State
        const emptyState = document.createElement('div');
        emptyState.className = 'inventory-empty-state';
        emptyState.innerHTML = `
            <div class="empty-lottie-container">
                <lottie-player 
                    src="https://raw.githubusercontent.com/vovashmyhol/Voco-Stickers/refs/heads/main/OffPack.json" 
                    background="transparent" 
                    speed="1" 
                    loop 
                    autoplay>
                </lottie-player>
            </div>
            <p class="empty-text">You don't have any packs yet</p>
            <button class="go-market-btn" id="goMarketBtn">Go to market</button>
        `;
        
        // Use insertBefore if grid has a specific position, or just append
        grid.style.display = 'block'; // Change from grid to block for centering
        grid.appendChild(emptyState);
        
        document.getElementById('goMarketBtn').addEventListener('click', () => {
            tg.HapticFeedback.impactOccurred('light');
            closeProfile();
        });
    } else {
        // Render Inventory Items
        grid.style.display = 'grid'; // Ensure it's a grid again
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
                openPackModal(packId, 'profile');
            });
            
            grid.appendChild(item);
        });
    }
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
    const ownerRow = document.getElementById('ownerRow');
    const buyBtn = document.getElementById('buyBtn');
    const priceValue = document.getElementById('priceValue');
    const extraActions = document.getElementById('extraActions');

    console.log('Updating Modal UI for:', packId, 'Context:', context);

    // Always show market info (Price & Supply)
    if (marketInfo) marketInfo.style.display = 'block';
    if (priceValue) priceValue.textContent = '15';

    if (context === 'profile') {
        // In profile, also show owner row inside the card and change button to Open
        if (ownerRow) ownerRow.style.display = 'block';
        buyBtn.textContent = 'Open';
        buyBtn.classList.add('btn-small');
        if (extraActions) extraActions.style.display = 'flex';
    } else {
        // In market, hide owner row and set button to Get
        if (ownerRow) ownerRow.style.display = 'none';
        buyBtn.textContent = 'Get';
        buyBtn.classList.remove('btn-small');
        if (extraActions) extraActions.style.display = 'none';
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
    if (!inventory.includes(packId)) {
        inventory.push(packId);
        localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    }
    
    tg.HapticFeedback.notificationOccurred('success');
    showSuccessModal(packId);
}

// Global interval for continuous stars
let continuousStarsInterval = null;

function showSuccessModal(packId) {
    const successModal = document.getElementById('successModal');
    const container = document.getElementById('successLottieContainer');
    const okBtn = document.getElementById('successOkBtn');

    if (!successModal || !container || !okBtn) return;

    // Smooth Activation
    successModal.classList.remove('fade-out');
    successModal.classList.add('active');
    successModal.style.display = 'flex'; 

    // Trigger Star Explosion (Initial Burst)
    createStarExplosion(60);
    // Start continuous flow
    startContinuousStars();

    // Inject Lottie
    container.innerHTML = '';
    const player = document.createElement('lottie-player');
    player.setAttribute('src', 'https://raw.githubusercontent.com/vovashmyhol/Voco-Stickers/refs/heads/main/Artboard%201%20(3).json');
    player.setAttribute('background', 'transparent');
    player.setAttribute('speed', '1');
    player.setAttribute('autoplay', '');
    player.style.width = '100%';
    player.style.height = '100%';
    container.appendChild(player);

    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');

    // Smooth Closing
    okBtn.onclick = (e) => {
        if (e) e.preventDefault();
        successModal.classList.add('fade-out');
        
        setTimeout(() => {
            stopContinuousStars();
            successModal.classList.remove('active', 'fade-out');
            successModal.style.display = 'none';
            if (typeof closeModal === 'function') closeModal();
            if (typeof renderInventory === 'function') renderInventory();
        }, 500);

        okBtn.onclick = null;
    };
}
function createStarExplosion(count = 40, isContinuous = false) {
    const container = document.getElementById('starExplosion');
    if (!container) return;

    if (!isContinuous) container.innerHTML = '';
    const particleCount = count;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'star-particle';
        
        // Random direction and distance
        const angle = Math.random() * Math.PI * 2;
        const distance = isContinuous ? (150 + Math.random() * 150) : (100 + Math.random() * 200); 
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        // Custom properties for CSS animation
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        
        // Random size variation
        const size = 1 + Math.random() * (isContinuous ? 1 : 2);
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random delay and duration
        const delay = isContinuous ? 0 : (Math.random() * 0.3);
        const duration = isContinuous ? (2.0 + Math.random() * 2.0) : (0.8 + Math.random() * 1.2);
        
        particle.style.animation = `starEmanate ${duration}s cubic-bezier(0.1, 0.4, 0.2, 1) ${delay}s forwards`;
        
        container.appendChild(particle);
        
        // Cleanup particle after animation
        setTimeout(() => {
            if (particle.parentNode === container) {
                container.removeChild(particle);
            }
        }, (duration + delay) * 1000);
    }
}

function startContinuousStars() {
    if (continuousStarsInterval) clearInterval(continuousStarsInterval);
    continuousStarsInterval = setInterval(() => {
        createStarExplosion(3, true); // Add 3 stars periodically
    }, 200);
}

function stopContinuousStars() {
    if (continuousStarsInterval) {
        clearInterval(continuousStarsInterval);
        continuousStarsInterval = null;
    }
}


