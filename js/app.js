// Encryption key for securing sensitive data (In production, use environment variables)
const ENCRYPTION_KEY = 'travel-hub-secure-key';

// Configuration
const CONFIG = {
    N8N_WEBHOOK_URL: 'https://primary-production-433c.up.railway.app/webhook/travel-hub-search', // Valid n8n webhook URL
    DEFAULT_CURRENCY: 'INR'
};

// State Management
const state = {
    currency: localStorage.getItem('selectedCurrency') || CONFIG.DEFAULT_CURRENCY,
    exchangeRates: {
        USD: 1,
        EUR: 0.92,
        INR: 83.12
    },
    symbols: {
        USD: '$',
        EUR: '€',
        INR: '₹'
    }
};

// Utilities
const utils = {
    // Encrypt data before sending (Simple XOR for demo, use AES in production)
    encrypt: (text) => {
        return btoa(text.split('').map((char, index) =>
            String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length))
        ).join(''));
    },

    formatCurrency: (amount, currency) => {
        const rate = state.exchangeRates[currency] / state.exchangeRates['USD']; // Base is USD in rates
        // Actually rates seem to be based on USD=1. Let's assume input amount is in USD for conversion.
        // Wait, the existing code assumed: price in USD * rate = price in currency.
        // let's stick to that.
        return (amount * state.exchangeRates[currency]).toFixed(2);
    },

    showNotification: (message, type = 'success') => {
        const notification = document.createElement('div');
        const bgColor = type === 'error' ? 'bg-red-600' : 'bg-primary';
        notification.className = `fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in z-50 flex items-center gap-2`;
        notification.innerHTML = `
            <span class="material-symbols-outlined">${type === 'error' ? 'error' : 'check_circle'}</span>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(10px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
};

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => console.log('SW registered:', registration.scope))
            .catch(err => console.log('SW registration failed:', err));
    });
}

// Core Logic
document.addEventListener('DOMContentLoaded', () => {
    initializeCurrency();
    initializeSearch();
    initializeBookingButtons();
    checkLoginState();
    setupAuthListeners();
});

function initializeCurrency() {
    const currencySelect = document.getElementById('currencySelect');
    if (currencySelect) {
        currencySelect.value = state.currency;
        updatePrices();

        currencySelect.addEventListener('change', (e) => {
            state.currency = e.target.value;
            localStorage.setItem('selectedCurrency', state.currency);
            updatePrices();
            utils.showNotification(`Currency changed to ${state.currency}`);
        });
    }
}

function updatePrices() {
    const rate = state.exchangeRates[state.currency];
    const symbol = state.symbols[state.currency];

    document.querySelectorAll('[data-price-usd]').forEach(element => {
        const priceUSD = parseFloat(element.getAttribute('data-price-usd'));
        if (!isNaN(priceUSD)) {
            const convertedPrice = (priceUSD * rate).toFixed(0);
            element.textContent = `${symbol}${convertedPrice}`;
        }
    });
}

function initializeSearch() {
    const searchBtn = document.querySelector('button.bg-primary.text-white.font-bold.text-lg'); // Main search button
    const locationInput = document.querySelector('input[placeholder*="Where"]');

    if (searchBtn && locationInput) {
        searchBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            // Add loading state
            const originalText = searchBtn.textContent;
            searchBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Searching...';
            searchBtn.disabled = true;

            const searchData = {
                type: 'search',
                location: locationInput.value,
                timestamp: new Date().toISOString(),
                userCurrency: state.currency
            };

            try {
                // Send to n8n
                // We use no-cors if the server doesn't support CORS, but for a real webhook we ideally want CORS enabled.
                // Assuming n8n webhook might block CORS from localhost, we might just log it or use 'no-cors' mode which makes the response opaque.
                // For demo purposes, we'll try fetch.
                await fetch(CONFIG.N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(searchData)
                }).catch(err => console.warn('Webhook probably blocked by CORS or network, ignoring for demo:', err));

                // Simulate processing delay for effect
                setTimeout(() => {
                    utils.showNotification('Search preferences saved!');
                    searchBtn.innerHTML = originalText;
                    searchBtn.disabled = false;

                    // Redirect logic can go here if we had a backend searching
                    // window.location.href = 'stays.html'; 
                }, 800);

            } catch (error) {
                console.error('Search error:', error);
                searchBtn.innerHTML = originalText;
                searchBtn.disabled = false;
            }
        });
    }
}

function initializeBookingButtons() {
    document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.includes('Book') || btn.textContent.includes('Rent') || btn.textContent.includes('Reserve')) {
            btn.addEventListener('click', (e) => {
                // Don't prevent default if it's a link or form submit, mostly these are buttons
                const itemCard = btn.closest('.bg-white'); // Assuming cards have white bg
                const title = itemCard?.querySelector('h3')?.textContent || 'Unknown Item';
                const priceMatch = itemCard?.querySelector('[data-price-usd]')?.textContent || itemCard?.querySelector('.text-primary')?.textContent;

                const bookingData = {
                    type: 'booking_attempt',
                    item: title,
                    price: priceMatch,
                    currency: state.currency,
                    timestamp: new Date().toISOString()
                };

                // Fire and forget webhook
                fetch(CONFIG.N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookingData)
                }).catch(() => { });

                utils.showNotification(`Starting booking for ${title}...`);
            });
        }
    });
}

/* Authentication Logic */
function checkLoginState() {
    const user = localStorage.getItem('user');
    try {
        if (user) {
            state.user = JSON.parse(user);
            updateAuthUI(true);
        } else {
            updateAuthUI(false);
        }
    } catch (e) {
        console.error('User parse error', e);
        logout();
    }
}

function updateAuthUI(isLoggedIn) {
    const authButtons = document.getElementById('auth-buttons');
    const userProfile = document.getElementById('user-profile');
    const userNameDisplay = document.getElementById('user-name-display');

    if (isLoggedIn && state.user) {
        if (authButtons) authButtons.classList.add('hidden');
        if (userProfile) userProfile.classList.remove('hidden');
        if (userNameDisplay) userNameDisplay.textContent = state.user.name;
    } else {
        if (authButtons) authButtons.classList.remove('hidden');
        if (userProfile) userProfile.classList.add('hidden');
    }
}

function setupAuthListeners() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            if (email && password) {
                login(email, password);
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            if (name && email && password) {
                register(name, email, password);
            }
        });
    }
}

function login(email, password) {
    // Simulated login
    const user = { name: email.split('@')[0], email: email, role: 'user' };
    localStorage.setItem('user', JSON.stringify(user));
    state.user = user;
    updateAuthUI(true);
    utils.showNotification(`Welcome back, ${user.name}!`);

    if (window.location.pathname.includes('login.html')) {
        setTimeout(() => window.location.href = 'index.html', 500);
    }
}

function register(name, email, password) {
    const user = { name: name, email: email, role: 'user' };
    localStorage.setItem('user', JSON.stringify(user));
    state.user = user;
    updateAuthUI(true);
    utils.showNotification(`Welcome, ${user.name}!`);

    if (window.location.pathname.includes('register.html')) {
        setTimeout(() => window.location.href = 'index.html', 500);
    }
}

function logout() {
    localStorage.removeItem('user');
    state.user = null;
    updateAuthUI(false);
    utils.showNotification('Logged out successfully');
    setTimeout(() => window.location.href = 'index.html', 500);
}
