// TravelHub - Shared JavaScript Utilities for Demo Functionality

// ============================================
// CURRENCY CONVERTER
// ============================================
const exchangeRates = {
    USD: 1,
    EUR: 0.92,
    INR: 83.12
};

const symbols = {
    USD: '$',
    EUR: '€',
    INR: '₹'
};

function initCurrencyConverter() {
    const currencySelect = document.getElementById('currencySelect');
    if (!currencySelect) return;

    currencySelect.addEventListener('change', function (e) {
        const selectedCurrency = e.target.value;
        localStorage.setItem('selectedCurrency', selectedCurrency);
        updatePricesOnPage(selectedCurrency);
        showNotification(`Currency changed to ${selectedCurrency}`);
    });

    // Load saved currency on page load
    const savedCurrency = localStorage.getItem('selectedCurrency') || 'INR';
    currencySelect.value = savedCurrency;
    updatePricesOnPage(savedCurrency);
}

function updatePricesOnPage(currency) {
    const rate = exchangeRates[currency];
    document.querySelectorAll('[data-price-usd]').forEach(element => {
        const priceUSD = parseFloat(element.getAttribute('data-price-usd'));
        const convertedPrice = (priceUSD * rate).toFixed(2);
        element.textContent = `${symbols[currency]}${convertedPrice}`;
    });
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-primary';
    notification.className = `fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in z-50 max-w-sm`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// ============================================
// PROFESSIONAL DATE PICKER (Flatpickr)
// ============================================
function initDatePicker() {
    const dateButtons = document.querySelectorAll('[data-date-picker]');

    dateButtons.forEach(button => {
        // Initialize Flatpickr
        const fp = flatpickr(button, {
            mode: "range",
            minDate: "today",
            dateFormat: "Y-m-d",
            showMonths: 2,
            onChange: function (selectedDates, dateStr, instance) {
                if (selectedDates.length === 2) {
                    const checkIn = selectedDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const checkOut = selectedDates[1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    const dateText = button.querySelector('[data-date-text]');
                    if (dateText) {
                        dateText.textContent = `${checkIn} — ${checkOut}`;
                    }
                    showNotification('Dates selected', 'success');
                }
            }
        });

        // Open calendar on button click (Flatpickr handles this mostly, but ensuring click works)
    });
}

// ============================================
// PROFESSIONAL GUEST SELECTOR (Custom Popover)
// ============================================
function initGuestSelector() {
    const guestButtons = document.querySelectorAll('[data-guest-selector]');

    // Create the popover element once
    const popover = document.createElement('div');
    popover.id = 'guest-popover';
    popover.className = 'hidden absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 animate-fade-in';

    // State
    let state = {
        adults: 2,
        children: 0,
        rooms: 1
    };

    function renderPopover() {
        popover.innerHTML = `
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="font-bold text-gray-900">Adults</div>
                        <div class="text-sm text-gray-500">Ages 18 or above</div>
                    </div>
                    <div class="flex items-center gap-3">
                        <button class="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-500 disabled:opacity-50" 
                            ${state.adults <= 1 ? 'disabled' : ''} onclick="updateGuests('adults', -1)">-</button>
                        <span class="w-4 text-center font-medium">${state.adults}</span>
                        <button class="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-primary border-primary" 
                            onclick="updateGuests('adults', 1)">+</button>
                    </div>
                </div>
                
                <div class="flex items-center justify-between border-t border-gray-100 pt-4">
                    <div>
                        <div class="font-bold text-gray-900">Children</div>
                        <div class="text-sm text-gray-500">Ages 0-17</div>
                    </div>
                    <div class="flex items-center gap-3">
                        <button class="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-500 disabled:opacity-50" 
                            ${state.children <= 0 ? 'disabled' : ''} onclick="updateGuests('children', -1)">-</button>
                        <span class="w-4 text-center font-medium">${state.children}</span>
                        <button class="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-primary border-primary" 
                            onclick="updateGuests('children', 1)">+</button>
                    </div>
                </div>

                <div class="flex items-center justify-between border-t border-gray-100 pt-4">
                    <div>
                        <div class="font-bold text-gray-900">Rooms</div>
                        <div class="text-sm text-gray-500"></div>
                    </div>
                    <div class="flex items-center gap-3">
                        <button class="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-500 disabled:opacity-50" 
                            ${state.rooms <= 1 ? 'disabled' : ''} onclick="updateGuests('rooms', -1)">-</button>
                        <span class="w-4 text-center font-medium">${state.rooms}</span>
                        <button class="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-primary border-primary" 
                            onclick="updateGuests('rooms', 1)">+</button>
                    </div>
                </div>

                <button id="guest-done-btn" class="w-full mt-4 bg-primary text-white font-bold py-2 rounded hover:bg-primary-hover transition-colors">Done</button>
            </div>
        `;

        // Re-attach done button listener
        setTimeout(() => {
            const doneBtn = document.getElementById('guest-done-btn');
            if (doneBtn) {
                doneBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent bubbling
                    popover.classList.add('hidden');
                });
            }
        }, 0);
    }

    // Global update function for the inline onclick handlers
    window.updateGuests = function (type, delta) {
        if (type === 'adults') state.adults = Math.max(1, state.adults + delta);
        if (type === 'children') state.children = Math.max(0, state.children + delta);
        if (type === 'rooms') state.rooms = Math.max(1, state.rooms + delta);

        renderPopover();
        updateButtonText();
    };

    function updateButtonText() {
        const text = `${state.adults} adults · ${state.children} children · ${state.rooms} room${state.rooms > 1 ? 's' : ''}`;
        document.querySelectorAll('[data-guest-text]').forEach(el => el.textContent = text);
    }

    guestButtons.forEach(button => {
        // Append popover to the button container relative parent
        const container = button.parentElement;
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }

        button.addEventListener('click', function (e) {
            e.stopPropagation();

            // Move popover to this container if not already
            if (popover.parentElement !== container) {
                container.appendChild(popover);
            }

            renderPopover();
            popover.classList.toggle('hidden');
        });
    });

    // Close on click outside
    document.addEventListener('click', function (e) {
        const isClickInside = popover.contains(e.target) || e.target.closest('[data-guest-selector]');
        if (!isClickInside && !popover.classList.contains('hidden')) {
            popover.classList.add('hidden');
        }
    });
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================
function initSearchForm() {
    const searchForms = document.querySelectorAll('[data-search-form]');

    searchForms.forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const destination = this.querySelector('input[type="text"]')?.value;

            if (!destination || destination.trim() === '') {
                showNotification('Please enter a destination', 'error');
                return;
            }

            showNotification(`Searching for stays in ${destination}...`, 'success');

            // Simulate loading then redirect
            setTimeout(() => {
                const targetPage = this.getAttribute('data-target-page') || 'stays.html';
                window.location.href = `${targetPage}?destination=${encodeURIComponent(destination)}`;
            }, 1000);
        });
    });
}

// ============================================
// FILTER FUNCTIONALITY
// ============================================
function initFilters() {
    const filterCheckboxes = document.querySelectorAll('[data-filter]');
    const filterItems = document.querySelectorAll('[data-filterable]');

    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            applyFilters();
            showNotification('Filters applied', 'success');
        });
    });

    function applyFilters() {
        const activeFilters = Array.from(filterCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.getAttribute('data-filter'));

        if (activeFilters.length === 0) {
            // Show all items if no filters
            filterItems.forEach(item => {
                item.style.display = '';
                item.classList.add('animate-fade-in');
            });
            return;
        }

        filterItems.forEach(item => {
            const itemCategories = (item.getAttribute('data-filterable') || '').split(',');
            const matches = activeFilters.some(filter => itemCategories.includes(filter));

            if (matches) {
                item.style.display = '';
                item.classList.add('animate-fade-in');
            } else {
                item.style.display = 'none';
            }
        });
    }
}

// ============================================
// SORT FUNCTIONALITY
// ============================================
function initSort() {
    const sortSelects = document.querySelectorAll('[data-sort]');

    sortSelects.forEach(select => {
        select.addEventListener('change', function () {
            const sortBy = this.value;
            const container = document.querySelector(this.getAttribute('data-sort-container'));

            if (!container) return;

            const items = Array.from(container.children);

            items.sort((a, b) => {
                const aValue = parseFloat(a.getAttribute(`data-${sortBy}`)) || 0;
                const bValue = parseFloat(b.getAttribute(`data-${sortBy}`)) || 0;

                if (sortBy === 'price-low') return aValue - bValue;
                if (sortBy === 'price-high') return bValue - aValue;
                if (sortBy === 'rating') return bValue - aValue;
                return 0;
            });

            items.forEach(item => {
                item.classList.add('animate-fade-in');
                container.appendChild(item);
            });
            showNotification('Results sorted', 'success');
        });
    });
}

// ============================================
// BUTTON ACTIONS
// ============================================
function initButtonActions() {
    // "View Details" buttons
    document.querySelectorAll('[data-action="view-details"]').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const itemName = this.getAttribute('data-item-name') || 'this item';
            showModal('Property Details', `Viewing details for ${itemName}. In a full application, this would show complete property information, photos, reviews, and booking options.`);
        });
    });

    // "View Deal" / "Rent Now" / "Book Now" buttons
    document.querySelectorAll('[data-action="book"], [data-action="rent"], [data-action="view-deal"]').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const itemName = this.getAttribute('data-item-name') || 'this item';
            const action = this.getAttribute('data-action');
            showModal('Booking', `Ready to book ${itemName}! In a full application, this would proceed to payment and confirmation.`);
        });
    });

    // "Show on map" buttons
    document.querySelectorAll('[data-action="show-map"]').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const location = this.getAttribute('data-location') || 'Location';
            showNotification(`📍 ${location} - Map view would open here`, 'info');
        });
    });

    // "Reserve" buttons for restaurants
    document.querySelectorAll('[data-action="reserve"]').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const restaurant = this.getAttribute('data-item-name') || 'this restaurant';
            showModal('Reservation', `Making a reservation at ${restaurant}. Select your preferred date, time, and party size.`);
        });
    });

    // "Select" buttons for buses
    document.querySelectorAll('[data-action="select-bus"]').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const busInfo = this.getAttribute('data-item-name') || 'this bus';
            showModal('Seat Selection', `Selecting seats for ${busInfo}. Choose your preferred seats and proceed to payment.`);
        });
    });
}

// ============================================
// MODAL SYSTEM
// ============================================
function showModal(title, content) {
    // Remove existing modal if any
    const existingModal = document.getElementById('demo-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'demo-modal';
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 animate-fade-in transform scale-100 transition-all">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-bold text-gray-900">${title}</h3>
                <button onclick="document.getElementById('demo-modal').remove()" class="p-1 rounded-full hover:bg-gray-100 transition-colors">
                    <span class="material-symbols-outlined text-gray-500">close</span>
                </button>
            </div>
            <p class="text-gray-600 mb-8 leading-relaxed">${content}</p>
            <div class="flex gap-3">
                <button onclick="document.getElementById('demo-modal').remove()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors">
                    Cancel
                </button>
                <button onclick="showNotification('Action confirmed!', 'success'); document.getElementById('demo-modal').remove()" class="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-colors shadow-sm">
                    Confirm
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close on backdrop click
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// ============================================
// CARD CLICK HANDLERS
// ============================================
function initCardClicks() {
    document.querySelectorAll('[data-card-link]').forEach(card => {
        card.addEventListener('click', function () {
            const url = this.getAttribute('data-card-link');
            if (url) window.location.href = url;
        });
    });
}

// ============================================
// FILTER RESET
// ============================================
function initFilterReset() {
    const resetButtons = document.querySelectorAll('[data-reset-filters]');

    resetButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            // Reset all checkboxes
            document.querySelectorAll('[data-filter]').forEach(cb => cb.checked = false);

            // Show all items
            document.querySelectorAll('[data-filterable]').forEach(item => {
                item.style.display = '';
                item.classList.add('animate-fade-in');
            });

            // Reset sort
            const sortSelect = document.querySelector('[data-sort]');
            if (sortSelect) sortSelect.value = '';

            showNotification('Filters reset', 'success');
        });
    });
}

// ============================================
// INITIALIZE ALL FUNCTIONALITY
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    initCurrencyConverter();
    initDatePicker();
    initGuestSelector();
    initSearchForm();
    initFilters();
    initSort();
    initButtonActions();
    initCardClicks();
    initFilterReset();

    console.log('TravelHub: Professional UI/UX initialized ✓');
});
