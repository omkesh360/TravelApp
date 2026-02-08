if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Global currency update listener
document.addEventListener('DOMContentLoaded', () => {
    const currencySelect = document.getElementById('currencySelect');
    if (currencySelect) {
        currencySelect.addEventListener('change', (e) => {
            const selectedCurrency = e.target.value;
            localStorage.setItem('selectedCurrency', selectedCurrency);
            // Notify all relevant elements on the page if they exist
            if (typeof updatePricesOnPage === 'function') {
                updatePricesOnPage(selectedCurrency);
            }
        });

        // Initialize from localStorage
        const savedCurrency = localStorage.getItem('selectedCurrency') || 'INR';
        currencySelect.value = savedCurrency;
        if (typeof updatePricesOnPage === 'function') {
            updatePricesOnPage(savedCurrency);
        }
    }
});
