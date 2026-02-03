// Little Good POS - JavaScript (Premium Edition)

// === 1. PRODUCT DATA & STATE ===
const defaultProducts = [
    { id: 1, name: "Kopi Susu Little Good", price: 25000, category: "signature" },
    { id: 2, name: "Kopi Susu Nusantara", price: 25000, category: "signature" },
    { id: 3, name: "Kopi Susu Ceria", price: 23000, category: "signature" },
    { id: 4, name: "Americano (Hot)", price: 20000, category: "coffee" },
    { id: 5, name: "Americano (Ice)", price: 23000, category: "coffee" },
    { id: 6, name: "Cappuccino (Hot)", price: 23000, category: "coffee" },
    { id: 7, name: "Cappuccino (Ice)", price: 25000, category: "coffee" },
    { id: 8, name: "Matcha Latte", price: 25000, category: "non-coffee" },
    { id: 9, name: "Taro Latte", price: 25000, category: "non-coffee" },
    { id: 10, name: "Chocolate", price: 23000, category: "non-coffee" },
    { id: 11, name: "Lemon Tea (Hot)", price: 20000, category: "tea" },
    { id: 12, name: "Lemon Tea (Ice)", price: 23000, category: "tea" },
    { id: 13, name: "Lychee Tea", price: 23000, category: "tea" },
    { id: 14, name: "Black Tea", price: 23000, category: "tea" },
    { id: 15, name: "French Fries", price: 18000, category: "snack" },
    { id: 16, name: "Tempe Mendoan", price: 18000, category: "snack" },
    { id: 17, name: "Corn Ribs", price: 15000, category: "snack" },
    { id: 18, name: "Pisang Goreng", price: 15000, category: "snack" },
    { id: 19, name: "Roti Bakar Coklat", price: 18000, category: "toast" },
    { id: 20, name: "Roti Bakar Keju", price: 20000, category: "toast" },
    { id: 21, name: "Sandwich Telur", price: 22000, category: "toast" },
    { id: 22, name: "Nasi Goreng Special", price: 28000, category: "main-course" },
    { id: 23, name: "Mie Goreng Jawa", price: 28000, category: "main-course" },
    { id: 24, name: "Ayam Geprek", price: 25000, category: "main-course" },
    { id: 25, name: "Rice Bowl Teriyaki", price: 30000, category: "main-course" },
];

let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let products = JSON.parse(localStorage.getItem('products') || JSON.stringify(defaultProducts));

// --- MIGRATION: Ensure new categories exist ---
const hasNewCategories = products.some(p => p.category === 'main-course' || p.category === 'toast');
if (!hasNewCategories) {
    // Append missing default items
    const existingIds = new Set(products.map(p => p.id));
    const newItems = defaultProducts.filter(p => !existingIds.has(p.id));
    products = [...products, ...newItems];
    localStorage.setItem('products', JSON.stringify(products));
    console.log('Migrated products: Added new menu items');
}
let cashiers = JSON.parse(localStorage.getItem('cashiers') || '[]');
let currentCashier = localStorage.getItem('cashierName') || '';
let discount = 0;
let currentTotal = 0;
let currentCategory = 'all';
let isEditMode = false;
let editingProductId = null;
let originalCartBackup = [];
let isSplitTransaction = false;
let selectedMethod = 'Tunai';
let isAdmin = false; // State for Admin Mode
const ADMIN_PIN = '123456'; // Default PIN
let currentLang = localStorage.getItem('pos_lang') || 'id'; // Language State

const TRANSLATIONS = {
    id: {
        nav_all: "Semua Menu",
        btn_manage: "Kelola Toko",
        lbl_cashier: "Kasir Aktif",
        header_kasir: "Kasir",
        search_placeholder: "Cari menu favorit...",
        cart_title: "Pesanan",
        cart_subtotal: "Subtotal",
        cart_total: "Total",
        btn_process: "Proses Pembayaran",

        // Dynamic Toasts & Alerts
        msg_added: "Ditambahkan: ",
        msg_cart_empty: "Keranjang masih kosong!",
        msg_payment_success: "Pembayaran Berhasil! Kembalian: ",
        msg_payment_failed: "Uang tunai kurang!",
        msg_admin_active: "Mode Admin Aktif",
        msg_admin_inactive: "Mode Admin Nonaktif",
        msg_pin_wrong: "PIN Salah!",
        prompt_pin: "Masukkan PIN Admin:",
        confirm_del: "Yakin ingin menghapus riwayat transaksi? Data tidak bisa dikembalikan.",
        data_del: "Transaksi dihapus"
    },
    en: {
        nav_all: "All Menu",
        btn_manage: "Manage Store",
        lbl_cashier: "Active Cashier",
        header_kasir: "Cashier",
        search_placeholder: "Search favorite menu...",
        cart_title: "Order Details",
        cart_subtotal: "Subtotal",
        cart_total: "Total",
        btn_process: "Checkout",

        // Dynamic Toasts & Alerts
        msg_added: "Added: ",
        msg_cart_empty: "Cart is empty!",
        msg_payment_success: "Payment Success! Change: ",
        msg_payment_failed: "Insufficient cash!",
        msg_admin_active: "Admin Mode Active",
        msg_admin_inactive: "Admin Mode Inactive",
        msg_pin_wrong: "Incorrect PIN!",
        prompt_pin: "Enter Admin PIN:",
        confirm_del: "Are you sure you want to delete this transaction history? Data cannot be recovered.",
        data_del: "Transaction deleted"
    }
};

function t(key) {
    return TRANSLATIONS[currentLang][key] || key;
}

function updateLanguageUI() {
    // Static Elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (TRANSLATIONS[currentLang][key]) {
            el.textContent = TRANSLATIONS[currentLang][key];
        }
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (TRANSLATIONS[currentLang][key]) {
            el.placeholder = TRANSLATIONS[currentLang][key];
        }
    });
}

function toggleLanguage() {
    currentLang = currentLang === 'id' ? 'en' : 'id';
    localStorage.setItem('pos_lang', currentLang);
    updateLanguageUI();
    showToast(currentLang === 'id' ? 'Bahasa: Indonesia' : 'Language: English', 'info');
}

// === 2. DOM ELEMENTS ===
const menuContainer = document.getElementById('menu-container');
const cartPanel = document.getElementById('cart-panel');
const cartContainer = document.getElementById('cart-items');
const subtotalEl = document.getElementById('subtotal');
const totalEl = document.getElementById('total');
const dateDisplay = document.getElementById('date-display');
const searchInput = document.getElementById('search-input');
const checkoutBtn = document.getElementById('checkout-btn');
const modal = document.getElementById('checkout-modal');
const modalTotal = document.getElementById('modal-total');
const checkoutCashierSelect = document.getElementById('checkout-cashier-select');
const cashierSelect = document.getElementById('cashier-select');
const checkoutDiscountInput = document.getElementById('checkout-discount-input');
const moreActionsTrigger = document.getElementById('more-actions-trigger');
const moreActionsMenu = document.getElementById('more-actions-menu');
const splitModal = document.getElementById('split-bill-modal');
const splitList = document.getElementById('split-bill-list');
const splitTotalDisplay = document.getElementById('split-total-display');
const processSplitBtn = document.getElementById('process-split-btn');
const historyModal = document.getElementById('history-modal');
const cashierModal = document.getElementById('cashier-modal');
const historyBtn = document.getElementById('history-btn');
const editModeBtn = document.getElementById('edit-mode-btn');
const historyList = document.getElementById('history-list');
const historyTotalRevenue = document.getElementById('history-total-revenue');
const themeToggle = document.getElementById('theme-toggle');
const fabCheckout = document.getElementById('fab-checkout');
const cashInput = document.getElementById('cash-input');
const changeAmountEl = document.getElementById('change-amount');
const processPaymentBtn = document.getElementById('process-payment-btn');
const cashSection = document.getElementById('cash-section');
const methodCards = document.querySelectorAll('.method-card');

// === 3. HELPERS ===
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount).replace(',00', '');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function updateTime() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    if (dateDisplay) dateDisplay.textContent = new Date().toLocaleDateString('id-ID', options);
}

// === 4. DARK MODE ===
function initDarkMode() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) icon.classList.replace('fa-moon', 'fa-sun');
        }
    }
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            const icon = themeToggle.querySelector('i');
            if (icon) {
                if (isDark) {
                    icon.classList.replace('fa-moon', 'fa-sun');
                    localStorage.setItem('theme', 'dark');
                } else {
                    icon.classList.replace('fa-sun', 'fa-moon');
                    localStorage.setItem('theme', 'light');
                }
            }
        });
    }
}

// === 5. PRODUCT & CATALOG ===
function getCategoryIcon(category) {
    switch (category) {
        case 'signature': return 'fa-star';
        case 'coffee': return 'fa-mug-hot';
        case 'non-coffee': return 'fa-glass-water';
        case 'tea': return 'fa-leaf';
        case 'snack': return 'fa-burger';
        case 'main-course': return 'fa-bowl-food';
        case 'toast': return 'fa-bread-slice';
        default: return 'fa-utensils';
    }
}






function toggleAdminMode() {
    if (isAdmin) {
        // Logout
        isAdmin = false;
        document.body.classList.remove('admin-active');
        showToast(t('msg_admin_inactive'), 'info');
        updateAdminUI();
    } else {
        // Login
        const pin = prompt(t('prompt_pin'));
        if (pin === ADMIN_PIN) {
            isAdmin = true;
            document.body.classList.add('admin-active');
            showToast(t('msg_admin_active'), 'success');
            updateAdminUI();
        } else if (pin !== null) {
            showToast(t('msg_pin_wrong'), 'error');
        }
    }
}

function updateAdminUI() {
    const lockIcon = document.getElementById('admin-lock-icon');
    const roleText = document.getElementById('user-role-text');
    const restrictedBtns = document.querySelectorAll('.admin-only');

    // Update Icon & Text
    if (lockIcon) lockIcon.className = isAdmin ? 'fa-solid fa-lock-open' : 'fa-solid fa-lock';
    if (roleText) roleText.textContent = isAdmin ? 'Admin' : 'Kasir';

    // Show/Hide Restricted Buttons
    restrictedBtns.forEach(btn => {
        btn.style.display = isAdmin ? 'flex' : 'none';
        btn.classList.toggle('hidden', !isAdmin);
    });

    // Close Edit Mode if logging out
    if (!isAdmin && isEditMode) {
        isEditMode = false;
        if (editModeBtn) editModeBtn.classList.remove('active');
        renderProducts();
    }
}

function renderProducts(items = products) {
    menuContainer.innerHTML = '';
    let filtered = items;
    if (currentCategory !== 'all') filtered = filtered.filter(p => p.category === currentCategory);
    const search = searchInput.value.toLowerCase();
    if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search));

    if (filtered.length === 0) {
        menuContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">Tidak ada menu yang ditemukan.</div>`;
        return;
    }

    filtered.forEach((product, index) => {
        const card = document.createElement('div');
        card.className = 'product-card' + (isEditMode ? ' edit-mode-card' : '');
        card.style.animationDelay = `${Math.min(index * 0.05, 0.5)}s`;
        const iconClass = getCategoryIcon(product.category);

        card.innerHTML = `
            <i class="fa-solid ${iconClass} card-icon"></i>
            <div class="product-info">
                <h3>${product.name}</h3>
                <span class="product-price">${formatCurrency(product.price)}</span>
            </div>
            ${isEditMode ? '<div class="edit-badge"><i class="fa-solid fa-pen"></i></div>' : ''}
        `;

        // Check cart quantity
        const cartItem = cart.find(c => c.id === product.id);
        if (cartItem && cartItem.quantity > 0) {
            const badge = document.createElement('div');
            badge.className = 'qty-indicator';
            badge.textContent = cartItem.quantity;
            card.appendChild(badge);
        }

        card.addEventListener('click', () => {
            card.classList.add('click-pulse');
            setTimeout(() => card.classList.remove('click-pulse'), 200);
            if (isEditMode) openAddProductModal(true, product);
            else addToCart(product);
        });
        menuContainer.appendChild(card);
    });
}

function saveAndRefreshProducts() {
    localStorage.setItem('products', JSON.stringify(products));
    renderProducts();
}

// === 6. CART MANAGEMENT ===
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) existingItem.quantity += 1;
    else cart.push({ ...product, quantity: 1 });
    saveCart();
    saveCart();
    renderCart();
    renderProducts(); // Update badges
    showToast(`${t('msg_added')}${product.name}`, 'success');
}

function updateQuantity(id, change) {
    const itemIndex = cart.findIndex(item => item.id === id);
    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;
        if (cart[itemIndex].quantity <= 0) cart.splice(itemIndex, 1);
        saveCart();
        renderCart();
        renderProducts(); // Update badges
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function renderCart() {
    cartContainer.innerHTML = '';
    if (cart.length === 0) {
        cartContainer.innerHTML = `<div class="empty-cart-message"><i class="fa-solid fa-basket-shopping"></i><p>Belum ada pesanan</p></div>`;
        checkoutBtn.disabled = true;
        updateTotals(0);
        return;
    }
    checkoutBtn.disabled = false;
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">${formatCurrency(item.price)}</div>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn minus" onclick="updateQuantity(${item.id}, -1)"><i class="fa-solid fa-minus"></i></button>
                <span class="qty">${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)"><i class="fa-solid fa-plus"></i></button>
            </div>
        `;
        cartContainer.appendChild(cartItem);
    });
    updateTotals(subtotal);
}

function updateTotals(subtotal) {
    subtotalEl.textContent = formatCurrency(subtotal);
    totalEl.textContent = formatCurrency(subtotal); // Before discount
}

function toggleCart() {
    if (cartPanel) {
        cartPanel.classList.toggle('visible');
    }
}

// === 7. MODALS & CHECKOUT ===
function openModal() {
    if (cart.length === 0) return;
    const sub = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (sub <= 0) {
        showToast('Rp 0 tidak bisa diproses', 'error');
        return;
    }
    updateCheckoutDisplay();
    if (checkoutDiscountInput) checkoutDiscountInput.value = discount;
    if (checkoutCashierSelect) {
        checkoutCashierSelect.innerHTML = cashierSelect.innerHTML;
        checkoutCashierSelect.value = currentCashier;
        checkoutCashierSelect.onchange = (e) => {
            currentCashier = e.target.value;
            cashierSelect.value = currentCashier;
            localStorage.setItem('cashierName', currentCashier);
        };
    }
    modal.classList.add('visible');
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('visible'));
    if (isSplitTransaction) {
        cart = [...originalCartBackup];
        originalCartBackup = [];
        isSplitTransaction = false;
        updateCheckoutDisplay();
        renderCart();
    }
}

function updateCheckoutDisplay() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal * ((100 - discount) / 100);
    currentTotal = total;
    const totalStr = formatCurrency(total);

    checkoutBtn.innerHTML = `<span>Bayar (${cart.length} item)</span><span>${totalStr}</span>`;

    if (modalTotal) {
        if (discount > 0) {
            modalTotal.innerHTML = `
                <del style="color:#999;font-size:0.9rem;">${formatCurrency(subtotal)}</del><br>
                <span style="color:var(--success);">${totalStr}</span>
                <small style="display:block;color:var(--text-muted);font-size:0.75rem;">Diskon ${discount}%</small>
            `;
        } else {
            modalTotal.textContent = totalStr;
        }
    }
}

function calculateChange() {
    if (!cashInput || !changeAmountEl) return;
    const cash = parseInt(cashInput.value.replace(/\./g, '')) || 0;
    const change = cash - currentTotal;
    updatePaymentButton(change >= 0, change);
    changeAmountEl.textContent = change >= 0 ? formatCurrency(change) : 'Rp 0';
}

function updatePaymentButton(isValid, change, isNonCash = false) {
    if (!processPaymentBtn) return;
    if (isValid) {
        processPaymentBtn.removeAttribute('disabled');
        processPaymentBtn.style.background = 'var(--success)';
        processPaymentBtn.textContent = isNonCash ? `Bayar (${selectedMethod})` : 'Bayar & Cetak';
    } else {
        processPaymentBtn.setAttribute('disabled', 'true');
        processPaymentBtn.style.background = '#ccc';
        processPaymentBtn.textContent = `Kurang ${formatCurrency(Math.abs(change))}`;
    }
}

// === 8. CASHIER MANAGEMENT ===
function renderCashierOptions() {
    if (!cashierSelect) return;
    cashierSelect.innerHTML = '<option value="">-- Pilih --</option>';
    cashiers.forEach(name => {
        const option = document.createElement('option');
        option.value = name; option.textContent = name;
        if (name === currentCashier) option.selected = true;
        cashierSelect.appendChild(option);
    });
    // Ensure current cashier matches the selection if it was deleted or changed
    if (cashierSelect.value !== currentCashier) {
        currentCashier = cashierSelect.value;
        localStorage.setItem('cashierName', currentCashier);
    }
}

// === 9. HISTORY & REPORTS ===
function loadHistory() {
    return JSON.parse(localStorage.getItem('orderHistory') || '[]');
}

function saveOrderToHistory(cartItems, total, method, status, cashierName) {
    const history = loadHistory();
    history.push({
        id: 'ORD-' + Date.now().toString().slice(-6),
        date: new Date().toISOString(),
        items: cartItems,
        total: total,
        method: method,
        status: status,
        cashier: cashierName || currentCashier || 'N/A'
    });
    localStorage.setItem('orderHistory', JSON.stringify(history));
}

function renderHistory() {
    const history = loadHistory();
    const today = new Date().toDateString();
    const todaysOrders = history.filter(o => new Date(o.date).toDateString() === today).sort((a, b) => new Date(b.date) - new Date(a.date));

    if (historyTotalRevenue) {
        const totalRev = todaysOrders.reduce((sum, o) => sum + o.total, 0);

        let profitHtml = '';
        if (isAdmin) {
            const totalHpp = todaysOrders.reduce((sum, o) => {
                // Calculate HPP for this order
                const orderHpp = o.items.reduce((isum, item) => isum + ((item.hpp || 0) * item.quantity), 0);
                return sum + orderHpp;
            }, 0);
            const totalProfit = totalRev - totalHpp;
            profitHtml = `<div style="font-size: 0.9rem; margin-top: 5px; opacity: 0.8; border-top: 1px solid rgba(255,255,255,0.2); padding-top:5px;">
                            Profit Bersih: <strong>${formatCurrency(totalProfit)}</strong>
                          </div>`;
        }

        historyTotalRevenue.innerHTML = `${formatCurrency(totalRev)} ${profitHtml}`;
    }

    if (!historyList) return;
    historyList.innerHTML = '';
    if (todaysOrders.length === 0) {
        historyList.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem;">Belum ada pesanan hari ini.</td></tr>`;
        return;
    }

    todaysOrders.forEach(order => {
        const time = new Date(order.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #eee';
        const methodBtn = order.status === 'unpaid'
            ? `<button onclick="openPaymentEditModal('${order.id}')" style="background:#dc3545; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.8rem; cursor:pointer;">Lunasi</button>`
            : `<button onclick="openPaymentEditModal('${order.id}')" style="background:#e3f2fd; color:#1565c0; padding:4px 8px; border:none; border-radius:4px; font-size:0.8rem; cursor:pointer;">${order.method} <i class="fa-solid fa-pen" style="font-size:0.7rem;"></i></button>`;

        tr.innerHTML = `
            <td style="padding:1rem;">${time}</td>
            <td style="padding:1rem; font-family:monospace;">${order.id}</td>
            <td style="padding:1rem;">${order.cashier || '-'}</td>
            <td style="padding:1rem; font-weight:bold;">${formatCurrency(order.total)}</td>
            <td style="padding:1rem;">${methodBtn}</td>
            <td style="padding:1rem;">
                <button onclick="deleteHistoryItem('${order.id}')" style="background:#fee2e2; color:#ef4444; border:none; width:30px; height:30px; border-radius:6px; cursor:pointer; display:flex; align-items:center; justify-content:center;" title="Hapus Transaksi">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        historyList.appendChild(tr);
    });
}

function deleteHistoryItem(orderId) {
    if (confirm(t('confirm_del'))) {
        let history = loadHistory();
        history = history.filter(o => o.id !== orderId);
        localStorage.setItem('orderHistory', JSON.stringify(history));
        renderHistory();
        showToast(t('data_del'), 'success');
    }
}

let selectedUpdateMethod = null;

function openPaymentEditModal(orderId) {
    const modalIdInput = document.getElementById('edit-payment-order-id');
    const paymentModal = document.getElementById('payment-method-modal');
    const saveBtn = document.getElementById('confirm-payment-update-btn');

    if (modalIdInput && paymentModal) {
        modalIdInput.value = orderId;
        selectedUpdateMethod = null;

        // Reset visual state
        document.querySelectorAll('#update-methods-grid .method-card').forEach(c => c.classList.remove('active'));
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.style.background = '#ccc';
        }

        paymentModal.classList.add('visible');
    }
}

function selectPaymentUpdateMethod(method, element) {
    selectedUpdateMethod = method;

    // Update visual active state
    document.querySelectorAll('#update-methods-grid .method-card').forEach(c => c.classList.remove('active'));
    element.classList.add('active');

    // Enable save button
    const saveBtn = document.getElementById('confirm-payment-update-btn');
    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.style.background = 'var(--success)';
    }
}

function confirmPaymentUpdate() {
    const orderId = document.getElementById('edit-payment-order-id').value;
    if (!orderId || !selectedUpdateMethod) return;

    let history = loadHistory();
    const idx = history.findIndex(o => o.id === orderId);

    if (idx > -1) {
        history[idx].method = selectedUpdateMethod;
        history[idx].status = 'paid';
        localStorage.setItem('orderHistory', JSON.stringify(history));

        showToast(`Pembayaran ${orderId} berhasil diupdate ke ${selectedUpdateMethod}`, 'success');
        renderHistory();
        closeModal();
    }
}

// Global scope for onclick attribute handlers
window.updateQuantity = updateQuantity;
window.toggleCart = toggleCart;
window.openPaymentEditModal = openPaymentEditModal;
window.selectPaymentUpdateMethod = selectPaymentUpdateMethod;
window.confirmPaymentUpdate = confirmPaymentUpdate;
window.deleteHistoryItem = deleteHistoryItem;

// === 10. PRODUCT MANAGEMENT MODAL ===
function openAddProductModal(isEdit = false, product = null) {
    const pm = document.getElementById('add-product-modal');
    if (!pm) return;
    pm.classList.add('visible');
    const title = document.getElementById('modal-title');
    const nameInput = document.getElementById('new-product-name');
    const priceInput = document.getElementById('new-product-price');
    const hppInput = document.getElementById('new-product-hpp');
    const categoryInput = document.getElementById('new-product-category');
    const deleteBtn = document.getElementById('delete-product-btn');
    const saveBtn = document.getElementById('save-product-btn');

    if (isEdit && product) {
        if (title) title.textContent = 'Edit Menu';
        if (nameInput) nameInput.value = product.name;
        if (priceInput) priceInput.value = product.price;
        if (hppInput) hppInput.value = product.hpp || 0;
        if (categoryInput) categoryInput.value = product.category;
        editingProductId = product.id;

        // Force show delete button
        if (deleteBtn) {
            deleteBtn.classList.remove('d-none');
            deleteBtn.style.display = 'inline-flex'; // Enforce flex layout
        }
        if (saveBtn) saveBtn.textContent = 'Simpan Perubahan';
    } else {
        if (title) title.textContent = 'Tambah Menu Baru';
        if (nameInput) nameInput.value = '';
        if (priceInput) priceInput.value = '';
        if (hppInput) hppInput.value = '';
        if (categoryInput) categoryInput.value = 'signature';
        editingProductId = null;

        // Force hide delete button
        if (deleteBtn) {
            deleteBtn.classList.add('d-none');
            deleteBtn.style.display = 'none';
        }
        if (saveBtn) saveBtn.textContent = 'Simpan Menu';
        if (nameInput) nameInput.focus();
    }
}


function openCashierModal() {
    if (cashierModal) {
        cashierModal.classList.add('visible');
        const input = document.getElementById('new-cashier-name');
        if (input) {
            input.value = '';
            input.focus();
        }
    }
}

// Redundant closeCashierModal removed (use closeModal)

// Global close function exposure if needed
window.closeModal = closeModal;

// === 11. INITIALIZATION & EVENT LISTENERS ===
document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 60000);
    initDarkMode();
    renderCashierOptions();
    renderProducts();
    renderCart();

    // Check session or init UI
    updateAdminUI();

    // Admin Toggle Listener
    const adminToggleBtn = document.getElementById('admin-toggle-btn');
    if (adminToggleBtn) adminToggleBtn.addEventListener('click', toggleAdminMode);

    // Language Toggle Listener
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) langBtn.addEventListener('click', toggleLanguage);
    updateLanguageUI(); // Apply initial translation

    // Nav Category
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            const target = e.target.closest('.nav-item');
            target.classList.add('active');
            currentCategory = target.dataset.category;
            renderProducts();
        });
    });

    // Search
    if (searchInput) searchInput.addEventListener('input', () => renderProducts());

    // Cashier Management
    if (cashierSelect) {
        cashierSelect.addEventListener('change', (e) => {
            currentCashier = e.target.value;
            localStorage.setItem('cashierName', currentCashier);
        });
    }

    const addCashierBtn = document.getElementById('add-cashier-btn');
    if (addCashierBtn) {
        addCashierBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openCashierModal();
        });
    }

    const saveCashierBtn = document.getElementById('save-cashier-btn');
    if (saveCashierBtn) {
        saveCashierBtn.addEventListener('click', () => {
            const input = document.getElementById('new-cashier-name');
            const name = input ? input.value.trim() : '';
            if (name) {
                if (!cashiers.includes(name)) {
                    cashiers.push(name);
                    localStorage.setItem('cashiers', JSON.stringify(cashiers));
                    currentCashier = name;
                    localStorage.setItem('cashierName', name);
                    renderCashierOptions();
                    closeModal();
                    showToast(`Kasir "${name}" ditambahkan`, 'success');
                } else {
                    showToast('Nama kasir sudah ada', 'info');
                }
            } else {
                showToast('Masukkan nama kasir', 'error');
            }
        });
    }

    const deleteCashierBtn = document.getElementById('delete-cashier-btn');
    if (deleteCashierBtn) {
        deleteCashierBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!currentCashier) return showToast('Pilih kasir dulu', 'info');
            if (confirm(`Hapus kasir "${currentCashier}"?`)) {
                cashiers = cashiers.filter(c => c !== currentCashier);
                localStorage.setItem('cashiers', JSON.stringify(cashiers));
                currentCashier = '';
                localStorage.setItem('cashierName', '');
                renderCashierOptions();
                showToast('Kasir dihapus', 'success');
            }
        });
    }

    // Checkout & Modals
    if (checkoutBtn) checkoutBtn.addEventListener('click', openModal);
    document.querySelectorAll('.close-modal').forEach(b => b.addEventListener('click', closeModal));

    if (checkoutDiscountInput) {
        checkoutDiscountInput.addEventListener('input', (e) => {
            let val = parseFloat(e.target.value) || 0;
            if (val < 0) val = 0; if (val > 100) val = 100;
            e.target.value = val;
            discount = val;
            updateCheckoutDisplay();
            calculateChange();
        });
    }

    methodCards.forEach(card => {
        card.addEventListener('click', () => {
            methodCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedMethod = card.querySelector('span').textContent;
            if (selectedMethod === 'Tunai') {
                cashSection.style.display = 'block';
                calculateChange();
            } else {
                cashSection.style.display = 'none';
                updatePaymentButton(true, 0, true);
            }
        });
    });

    if (cashInput) {
        cashInput.addEventListener('input', (e) => {
            let raw = e.target.value.replace(/\D/g, '');
            e.target.value = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            calculateChange();
        });
    }

    // Quick Amounts
    document.querySelectorAll('.quick-amounts button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const amount = e.target.dataset.amount;
            if (amount === 'exact') cashInput.value = currentTotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            else cashInput.value = amount.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            calculateChange();
        });
    });

    // Process Payment
    if (processPaymentBtn) processPaymentBtn.addEventListener('click', () => {
        const sub = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total = currentTotal;
        let cash = total;
        let change = 0;

        if (selectedMethod === 'Tunai') {
            cash = parseInt(cashInput.value.replace(/\./g, '')) || 0;
            if (cash < total) return showToast('Pembayaran kurang!', 'error');
            change = cash - total;
        }

        const finalCashier = checkoutCashierSelect ? checkoutCashierSelect.value : currentCashier;

        // Finalize
        const receiptModal = document.getElementById('receipt-modal');
        const receiptBody = document.getElementById('receipt-body');
        if (receiptBody) {
            const itemsHtml = cart.map(i => `<div style="display:flex; justify-content:space-between;"><span>${i.name} x${i.quantity}</span><span>${formatCurrency(i.price * i.quantity)}</span></div>`).join('');
            receiptBody.innerHTML = `
                <div style="text-align:center; border-bottom:1px dashed #000; padding-bottom:1rem;">
                    <h3>MARVINZ POS</h3><p>${new Date().toLocaleString('id-ID')}</p><p>Kasir: ${finalCashier}</p>
                </div>
                <div style="padding:1rem 0; border-bottom:1px dashed #000;">${itemsHtml}</div>
                <div style="padding-top:1rem;">
                    <div style="display:flex; justify-content:space-between;"><span>Total</span><span>${formatCurrency(total)}</span></div>
                    <div style="display:flex; justify-content:space-between;"><span>${selectedMethod}</span><span>${formatCurrency(cash)}</span></div>
                    <div style="display:flex; justify-content:space-between;"><span>Kembali</span><span>${formatCurrency(change)}</span></div>
                </div>
            `;
            if (receiptModal) receiptModal.classList.add('visible');
        }

        saveOrderToHistory(cart, total, selectedMethod, 'paid', finalCashier);

        // Reset
        if (isSplitTransaction) {
            originalCartBackup = originalCartBackup.filter(backupItem => !cart.includes(backupItem));
            cart = [...originalCartBackup];
            originalCartBackup = [];
            isSplitTransaction = false;
        } else {
            cart = [];
        }
        discount = 0; if (checkoutDiscountInput) checkoutDiscountInput.value = 0;

        saveCart(); renderCart();
        modal.classList.remove('visible');
        cashInput.value = '';
        showToast('Pembayaran Berhasil!', 'success');
    });

    // Pay Later
    const payLaterBtn = document.getElementById('pay-later-btn');
    if (payLaterBtn) payLaterBtn.addEventListener('click', () => {
        const sub = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total = sub * ((100 - discount) / 100);
        const finalCashier = checkoutCashierSelect ? checkoutCashierSelect.value : currentCashier;
        saveOrderToHistory(cart, total, '-', 'unpaid', finalCashier);
        if (isSplitTransaction) {
            originalCartBackup = originalCartBackup.filter(backupItem => !cart.includes(backupItem));
            cart = [...originalCartBackup];
            originalCartBackup = [];
            isSplitTransaction = false;
        } else {
            cart = [];
        }
        discount = 0; if (checkoutDiscountInput) checkoutDiscountInput.value = 0;

        saveCart(); renderCart();
        modal.classList.remove('visible');
        showToast('Pesanan Disimpan (Belum Lunas)', 'info');
    });

    // History
    if (historyBtn) historyBtn.addEventListener('click', () => {
        moreActionsMenu.classList.add('hidden');
        historyModal.classList.add('visible');
        renderHistory();
    });

    // Edit Mode Toggle
    if (editModeBtn) editModeBtn.addEventListener('click', () => {
        moreActionsMenu.classList.add('hidden');
        isEditMode = !isEditMode;
        if (isEditMode) {
            editModeBtn.classList.add('active');
            showToast('Mode Edit Aktif - Klik produk untuk edit', 'success');
        } else {
            editModeBtn.classList.remove('active');
            showToast('Mode Edit Nonaktif', 'info');
        }
        renderProducts();
    });

    // Add Product Modal
    const addProductBtnTrigger = document.getElementById('add-product-btn-trigger');
    if (addProductBtnTrigger) addProductBtnTrigger.addEventListener('click', () => {
        moreActionsMenu.classList.add('hidden');
        openAddProductModal();
    });

    // Product Management
    const saveProductBtn = document.getElementById('save-product-btn');
    if (saveProductBtn) saveProductBtn.addEventListener('click', () => {
        const name = document.getElementById('new-product-name').value.trim();
        const price = parseInt(document.getElementById('new-product-price').value.replace(/\D/g, ''));
        const hpp = parseInt(document.getElementById('new-product-hpp').value.replace(/\D/g, '')) || 0;
        const category = document.getElementById('new-product-category').value;
        if (!name || isNaN(price)) return showToast('Input tidak valid', 'error');

        if (editingProductId) {
            const idx = products.findIndex(p => p.id === editingProductId);
            if (idx > -1) products[idx] = { ...products[idx], name, price, hpp, category };
        } else {
            products.push({ id: Date.now(), name, price, hpp, category });
        }
        saveAndRefreshProducts();
        closeModal();
        showToast('Menu diperbarui', 'success');
    });

    const deleteProductBtn = document.getElementById('delete-product-btn');
    if (deleteProductBtn) {
        // Clone to clear old listeners
        const newBtn = deleteProductBtn.cloneNode(true);
        deleteProductBtn.parentNode.replaceChild(newBtn, deleteProductBtn);

        newBtn.addEventListener('click', (e) => {
            e.preventDefault();

            if (editingProductId && confirm('Yakin ingin menghapus menu ini?')) {
                products = products.filter(p => p.id !== editingProductId);
                saveAndRefreshProducts();

                // Sync Cart
                cart = cart.filter(c => c.id !== editingProductId);
                saveCart(); renderCart();

                closeModal();
                showToast('Menu berhasil dihapus!', 'success');
            }
        });
    }

    // Report
    const downloadReportBtn = document.getElementById('download-report-btn');
    if (downloadReportBtn) downloadReportBtn.addEventListener('click', () => {
        const history = loadHistory();
        if (history.length === 0) return showToast('Belum ada data', 'error');
        let csv = "Order ID,Tanggal,Kasir,Total,Metode,Status\n";
        history.forEach(o => csv += `${o.id},${new Date(o.date).toLocaleString()},${o.cashier},${o.total},${o.method},${o.status}\n`);
        const link = document.createElement("a");
        link.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
        link.download = `Laporan_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    });

    // Split Bill
    const splitBtnTrigger = document.getElementById('btn-split-bill');
    if (splitBtnTrigger) splitBtnTrigger.addEventListener('click', () => {
        if (cart.length === 0) return showToast('Keranjang kosong', 'error');
        moreActionsMenu.classList.add('hidden');
        splitList.innerHTML = '';
        cart.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'split-item checked';
            div.innerHTML = `<input type="checkbox" class="split-checkbox" data-index="${index}" checked><div><span>${item.name} x${item.quantity}</span></div>`;
            div.onclick = (e) => { if (e.target.type !== 'checkbox') { const cb = div.querySelector('input'); cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); } };
            splitList.appendChild(div);
        });
        const updateSplitTotal = () => {
            let st = 0;
            splitList.querySelectorAll('.split-checkbox:checked').forEach(cb => {
                const item = cart[parseInt(cb.dataset.index)];
                st += item.price * item.quantity;
            });
            splitTotalDisplay.textContent = formatCurrency(st * ((100 - discount) / 100));
            processSplitBtn.disabled = !splitList.querySelector('.split-checkbox:checked');
        };
        splitList.querySelectorAll('.split-checkbox').forEach(cb => cb.addEventListener('change', updateSplitTotal));
        updateSplitTotal();
        splitModal.classList.add('visible');
    });

    if (processSplitBtn) processSplitBtn.addEventListener('click', () => {
        const checked = Array.from(splitList.querySelectorAll('.split-checkbox:checked'));
        originalCartBackup = [...cart];
        const selected = checked.map(cb => originalCartBackup[parseInt(cb.dataset.index)]);
        cart = selected;
        isSplitTransaction = true;
        splitModal.classList.remove('visible');
        openModal();
    });

    const confirmPaymentUpdateBtn = document.getElementById('confirm-payment-update-btn');
    if (confirmPaymentUpdateBtn) confirmPaymentUpdateBtn.addEventListener('click', confirmPaymentUpdate);



    // Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F2') { e.preventDefault(); openModal(); }
        if (e.key === 'Escape') { closeModal(); }
        if (e.ctrlKey && e.key === 'h') { e.preventDefault(); if (historyBtn) historyBtn.click(); }
    });

    // FAB
    if (fabCheckout) {
        fabCheckout.addEventListener('click', () => {
            // If in mobile/landscape mode where cart is hidden fixed, toggle cart first
            if (window.innerWidth <= 932 && window.orientation === 90 || window.orientation === -90 || (window.innerWidth > window.innerHeight && window.innerWidth <= 932)) {
                if (!cartPanel.classList.contains('visible') && cart.length > 0) {
                    toggleCart();
                    return;
                }
            }
            openModal();
        });
    }

    // More Actions Outside Click
    if (moreActionsTrigger) moreActionsTrigger.addEventListener('click', (e) => { e.stopPropagation(); moreActionsMenu.classList.toggle('hidden'); });
    document.addEventListener('click', () => moreActionsMenu.classList.add('hidden'));
    moreActionsMenu.addEventListener('click', (e) => e.stopPropagation());
});
