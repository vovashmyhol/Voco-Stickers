// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Expand the app to full screen and disable swipe-to-close behavior
    tg.expand();
    tg.disableVerticalSwipes(); // Prevents free pulling down to close at the top
    
    // 2. Set Theme Colors
    tg.setHeaderColor('#0088cc'); // Using the Voco blue
    tg.setBackgroundColor('#050b1a'); // Dark background
    
    // 3. Initialize User Data
    initUserData();
    
    // 4. Carousel Scroll Handling
    initCarousel();
    
    // 5. Telegram Main Button (not needed yet for main page, but ready)
    tg.ready();
});

/**
 * Initialize User Data from Telegram
 */
function initUserData() {
    const user = tg.initDataUnsafe?.user;
    const userPhotoImg = document.getElementById('userPhoto');
    
    if (user && user.photo_url) {
        userPhotoImg.src = user.photo_url;
    } else {
        // Fallback or development mock
        console.log('Running outside of Telegram or user photo not available');
        // Keep the default voco_logo.jpg
    }
}

/**
 * Carousel logic for updating pagination dots
 */
function initCarousel() {
    const carousel = document.getElementById('collectionsCarousel');
    const dots = document.querySelectorAll('.dot');
    
    if (!carousel) return;

    carousel.addEventListener('scroll', () => {
        const scrollPosition = carousel.scrollLeft;
        const cardWidth = carousel.querySelector('.pack-card').offsetWidth + 20; // 20 is gap
        const activeIndex = Math.round(scrollPosition / cardWidth);
        
        dots.forEach((dot, index) => {
            if (index === activeIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    });
}

// Add event listener for profile button
document.getElementById('profileBtn').addEventListener('click', () => {
    tg.HapticFeedback.impactOccurred('medium');
    alert('Profile section coming in Phase 2!');
});

// Pack click handling (to be expanded in Phase 2)
document.getElementById('vocoPack').addEventListener('click', () => {
    tg.HapticFeedback.impactOccurred('light');
    // In Phase 2 this will open the pack detail view
    alert('Pack details coming in Phase 2!');
});
