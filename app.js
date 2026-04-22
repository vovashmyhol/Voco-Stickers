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
    
    if (user && user.photo_url) {
        userPhotoImg.src = user.photo_url;
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
 
// 2. Profile button (Showcase Inventory)
document.getElementById('profileBtn').addEventListener('click', () => {
    tg.HapticFeedback.impactOccurred('medium');
    openPackModal('VocoX'); 
});
 
// 3. Modal Close
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
 
function openPackModal(packId) {
    updateModalUI(packId);
    
    // Reset any drag transforms before opening
    const modalContent = modal.querySelector('.modal-content');
    modalContent.classList.remove('dragging');
    
    // Force initial state for Safari/iPhone
    modalContent.style.transform = 'translate3d(0, 110%, 0)';
    void modalContent.offsetHeight; // Trigger reflow
    
    modalContent.style.transform = ''; // Let CSS transition take over
    modal.classList.add('active');
    
    // Impact feedback
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }
}
 
function closeModal() {
    modal.classList.remove('active');
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
 
function updateModalUI(packId) {
    const isOwned = inventory.includes(packId);
 
    if (isOwned) {
        buyBtn.textContent = 'Open';
        priceValue.textContent = 'Owned';
    } else {
        buyBtn.textContent = 'Get';
        priceValue.textContent = '15';
    }
}
 
// 5. Purchase Logic
buyBtn.addEventListener('click', () => {
    const isOwned = inventory.includes('VocoX');
    
    if (isOwned) {
        // Open the sticker set
        tg.openTelegramLink('https://t.me/addstickers/VocoX');
    } else {
        // Specific Invoice URL provided by user
        const invoiceUrl = 'https://t.me/$j4ADo8xWMEtDFgAAl_xEVL2lLAU';
        
        if (tg.openInvoice) {
            tg.openInvoice(invoiceUrl, (status) => {
                // status can be 'paid', 'cancelled', 'failed', 'pending'
                if (status === 'paid' || status === 'pending') {
                    confirmPurchase('VocoX');
                }
            });
        } else {
            // Mock payment for Browser/Development
            if (confirm('Simulate successful payment for 15 Stars?')) {
                confirmPurchase('VocoX');
            }
        }
    }
});
 
function confirmPurchase(packId) {
    if (!inventory.includes(packId)) {
        inventory.push(packId);
        localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    }
    tg.HapticFeedback.notificationOccurred('success');
    updateModalUI(packId);
}
