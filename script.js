// ========== KONFIGURASI SISTEM ==========
// 🔑 Login credentials (SIMPAN DI VARIABLE INI SAHAJA)
const VALID_USERNAME = "admin";
const VALID_PASSWORD = "@klang41200@";

// 🔗 URL Google Apps Script (GANTI DENGAN URL ANDA)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwA9ymZdaAD3rf98fxR9dnpShJsqDxaFiBhCkLIFTAKEQouxFNDxzhW8fDPycTbN3Ic/exec";

// ========== STATE MANAGEMENT ==========
let medicalAssets = [];
let nonMedicalAssets = [];
let currentAssetType = 'medical';
let currentEditingAssetId = null;
let uploadedImages = [];
let assetStatusChart, zoneDistributionChart, ppmTrendChart, categoryChart;

// ========== DOM ELEMENTS CACHE ==========
const elements = {
    // Login
    loginContainer: document.getElementById('login-container'),
    mainContainer: document.getElementById('main-container'),
    loginForm: document.getElementById('login-form'),
    usernameInput: document.getElementById('username'),
    passwordInput: document.getElementById('password'),
    loginError: document.getElementById('login-error'),
    loginBtn: document.getElementById('login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Navigation
    navItems: document.querySelectorAll('.nav-item[data-section]'),
    sections: {
        dashboard: document.getElementById('dashboard'),
        medical: document.getElementById('medical-assets'),
        nonMedical: document.getElementById('non-medical-assets'),
        reports: document.getElementById('reports-analytics')
    },
    pageTitle: document.getElementById('page-title'),
    
    // Modal
    assetModal: document.getElementById('asset-modal'),
    modalTitle: document.getElementById('modal-title'),
    closeModal: document.getElementById('close-modal'),
    cancelAsset: document.getElementById('cancel-asset'),
    assetForm: document.getElementById('asset-form'),
    imageUploadArea: document.getElementById('image-upload-area'),
    imageUploadInput: document.getElementById('image-upload-input'),
    uploadedImagesContainer: document.getElementById('uploaded-images'),
    saveAsset: document.getElementById('save-asset'),
    
    // Buttons
    addMedicalAsset: document.getElementById('add-medical-asset'),
    addNonMedicalAsset: document.getElementById('add-non-medical-asset'),
    searchMedicalBtn: document.getElementById('search-medical-btn'),
    clearMedicalSearch: document.getElementById('clear-medical-search'),
    searchNonMedicalBtn: document.getElementById('search-nonmedical-btn'),
    clearNonMedicalSearch: document.getElementById('clear-nonmedical-search'),
    generateReportBtn: document.getElementById('generate-report-btn'),
    printReportBtn: document.getElementById('print-report-btn'),
    exportDataBtn: document.getElementById('export-data-btn'),
    
    // Filter Elements
    filterStatus: document.getElementById('filter-status'),
    filterCategory: document.getElementById('filter-category'),
    filterZone: document.getElementById('filter-zone'),
    filterNonmedStatus: document.getElementById('filter-nonmed-status'),
    filterNonmedCategory: document.getElementById('filter-nonmed-category'),
    searchMedicalAsset: document.getElementById('search-medical-asset'),
    searchNonmedicalAsset: document.getElementById('search-nonmedical-asset'),
    
    // Table Bodies
    medicalAssetsTableBody: document.getElementById('medical-assets-table-body'),
    nonMedicalAssetsTableBody: document.getElementById('non-medical-assets-table-body'),
    ppmAlertTable: document.getElementById('ppm-alert-table'),
    recentAssetsTable: document.getElementById('recent-assets-table'),
    urgentAssetsTableBody: document.getElementById('urgent-assets-table-body'),
    
    // Summary Cards
    totalMedicalAssets: document.getElementById('total-medical-assets'),
    activeAssets: document.getElementById('active-assets'),
    ppmDue: document.getElementById('ppm-due'),
    damagedAssets: document.getElementById('damaged-assets'),
    
    // Report Stats
    availabilityRate: document.getElementById('availability-rate'),
    ppmCompliance: document.getElementById('ppm-compliance'),
    maintenanceCost: document.getElementById('maintenance-cost'),
    urgentAssetsCount: document.getElementById('urgent-assets-count'),
    
    // Toast
    toast: document.getElementById('toast'),
    
    // No Results
    medicalNoResults: document.getElementById('medical-no-results'),
    nonmedicalNoResults: document.getElementById('nonmedical-no-results')
};

// ========== GOOGLE SHEETS API FUNCTIONS ==========
class GoogleSheetsAPI {
    static async fetchData(sheetName) {
        try {
            const url = `${GOOGLE_SCRIPT_URL}?action=get&sheet=${encodeURIComponent(sheetName)}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching from Google Sheets:', error);
            showToast('Gagal memuat data dari Google Sheets', 'error');
            return [];
        }
    }

    static async saveData(sheetName, data) {
        try {
            const payload = {
                action: 'save',
                sheet: sheetName,
                data: data
            };
            
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error saving to Google Sheets:', error);
            showToast('Gagal menyimpan data ke Google Sheets', 'error');
            return { success: false, error: error.message };
        }
    }

    static async updateData(sheetName, assetId, data) {
        try {
            const payload = {
                action: 'update',
                sheet: sheetName,
                id: assetId,
                data: data
            };
            
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error updating Google Sheets:', error);
            showToast('Gagal mengemaskini data di Google Sheets', 'error');
            return { success: false, error: error.message };
        }
    }

    static async deleteData(sheetName, assetId) {
        try {
            const payload = {
                action: 'delete',
                sheet: sheetName,
                id: assetId
            };
            
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error deleting from Google Sheets:', error);
            showToast('Gagal memadam data dari Google Sheets', 'error');
            return { success: false, error: error.message };
        }
    }
}

// ========== DATA LOADING FUNCTIONS ==========
async function loadAllData() {
    try {
        showToast('Memuatkan data dari Google Sheets...', 'info');
        
        // Load medical assets
        medicalAssets = await GoogleSheetsAPI.fetchData('medical_assets');
        
        // Load non-medical assets
        nonMedicalAssets = await GoogleSheetsAPI.fetchData('non_medical_assets');
        
        // Update UI
        renderMedicalAssets();
        renderNonMedicalAssets();
        initializeDashboard();
        
        showToast('Data berjaya dimuatkan', 'success');
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Gagal memuat data. Sila cuba lagi.', 'error');
    }
}

// ========== LOGIN FUNCTIONS ==========
elements.loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = elements.usernameInput.value.trim();
    const password = elements.passwordInput.value;
    
    // Reset error
    elements.loginError.classList.remove('show');
    
    // Disable button and show loading
    elements.loginBtn.disabled = true;
    elements.loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengesahkan...';
    
    // Simulate authentication delay
    setTimeout(() => {
        if (username === VALID_USERNAME && password === VALID_PASSWORD) {
            // Successful login
            elements.loginContainer.classList.remove('active');
            elements.mainContainer.style.display = 'flex';
            
            // Show welcome message
            showToast('Berjaya log masuk! Selamat datang ke Sistem Pengurusan Aset.', 'success');
            
            // Initialize the system
            initializeSystem();
        } else {
            // Failed login
            elements.loginError.classList.add('show');
            elements.usernameInput.focus();
            
            // Reset button
            elements.loginBtn.disabled = false;
            elements.loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Log Masuk';
        }
    }, 1000);
});

// Logout functionality
elements.logoutBtn.addEventListener('click', function() {
    if (confirm('Adakah anda pasti ingin log keluar?')) {
        // Clear any sensitive data
        elements.usernameInput.value = '';
        elements.passwordInput.value = '';
        elements.loginError.classList.remove('show');
        
        // Reset button
        elements.loginBtn.disabled = false;
        elements.loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Log Masuk';
        
        // Show login page
        elements.loginContainer.classList.add('active');
        elements.mainContainer.style.display = 'none';
        
        // Clear local data
        medicalAssets = [];
        nonMedicalAssets = [];
        
        // Show logout message
        showToast('Anda telah log keluar.', 'info');
    }
});

// ========== SYSTEM INITIALIZATION ==========
function initializeSystem() {
    setupEventListeners();
    loadAllData();
    
    // Auto-refresh data every 5 minutes
    setInterval(loadAllData, 5 * 60 * 1000);
    
    // Refresh data when tab becomes visible
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && elements.mainContainer.style.display !== 'none') {
            loadAllData();
        }
    });
}

// ========== EVENT LISTENERS SETUP ==========
function setupEventListeners() {
    // Navigation
    elements.navItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            
            // Update active nav item
            elements.navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Hide all sections
            Object.values(elements.sections).forEach(sec => {
                if (sec) sec.classList.remove('active');
            });
            
            // Show selected section
            if (section === 'dashboard') {
                elements.sections.dashboard.classList.add('active');
                elements.pageTitle.textContent = 'Dashboard Pengurusan Aset';
                initializeDashboard();
            } else if (section === 'medical-assets') {
                elements.sections.medical.classList.add('active');
                elements.pageTitle.textContent = 'Aset Perubatan';
                renderMedicalAssets();
            } else if (section === 'non-medical-assets') {
                elements.sections.nonMedical.classList.add('active');
                elements.pageTitle.textContent = 'Aset Bukan Perubatan';
                renderNonMedicalAssets();
            } else if (section === 'reports-analytics') {
                elements.sections.reports.classList.add('active');
                elements.pageTitle.textContent = 'Laporan & Analitik';
                initializeCharts();
            }
        });
    });

    // Add asset buttons
    elements.addMedicalAsset.addEventListener('click', () => {
        currentAssetType = 'medical';
        elements.modalTitle.textContent = 'Tambah Aset Perubatan';
        resetAssetForm();
        elements.assetModal.classList.add('active');
    });

    elements.addNonMedicalAsset.addEventListener('click', () => {
        currentAssetType = 'non-medical';
        elements.modalTitle.textContent = 'Tambah Aset Bukan Perubatan';
        resetAssetForm();
        elements.assetModal.classList.add('active');
    });

    // Modal controls
    elements.closeModal.addEventListener('click', () => {
        elements.assetModal.classList.remove('active');
    });

    elements.cancelAsset.addEventListener('click', () => {
        elements.assetModal.classList.remove('active');
    });

    // Asset form submission
    elements.assetForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const assetData = collectFormData();
        
        if (!assetData) return;
        
        // Show loading
        elements.saveAsset.disabled = true;
        elements.saveAsset.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        
        try {
            if (currentEditingAssetId) {
                // Update existing asset
                const result = await GoogleSheetsAPI.updateData(
                    currentAssetType === 'medical' ? 'medical_assets' : 'non_medical_assets',
                    currentEditingAssetId,
                    assetData
                );
                
                if (result.success) {
                    showToast(`${currentAssetType === 'medical' ? 'Aset perubatan' : 'Aset bukan perubatan'} berjaya dikemaskini`, 'success');
                    await loadAllData();
                } else {
                    throw new Error(result.error);
                }
            } else {
                // Add new asset
                const result = await GoogleSheetsAPI.saveData(
                    currentAssetType === 'medical' ? 'medical_assets' : 'non_medical_assets',
                    assetData
                );
                
                if (result.success) {
                    showToast(`${currentAssetType === 'medical' ? 'Aset perubatan' : 'Aset bukan perubatan'} berjaya ditambah`, 'success');
                    await loadAllData();
                } else {
                    throw new Error(result.error);
                }
            }
            
            elements.assetModal.classList.remove('active');
        } catch (error) {
            console.error('Save error:', error);
            showToast('Gagal menyimpan data. Sila cuba lagi.', 'error');
        } finally {
            // Reset button
            elements.saveAsset.disabled = false;
            elements.saveAsset.innerHTML = 'Simpan Aset';
        }
    });

    // Image upload
    elements.imageUploadArea.addEventListener('click', () => {
        elements.imageUploadInput.click();
    });

    elements.imageUploadInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        if (files.length + uploadedImages.length > 5) {
            showToast('Maksimum 5 gambar sahaja dibenarkan', 'warning');
            return;
        }
        
        files.forEach(file => {
            if (!file.type.startsWith('image/')) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                uploadedImages.push(e.target.result);
                renderUploadedImages();
            };
            reader.readAsDataURL(file);
        });
        
        // Reset file input
        elements.imageUploadInput.value = '';
    });

    // Search and filter functionality
    setupSearchAndFilters();
    
    // Report buttons
    elements.generateReportBtn.addEventListener('click', generateReport);
    elements.printReportBtn.addEventListener('click', printReport);
    elements.exportDataBtn.addEventListener('click', exportData);
}

function setupSearchAndFilters() {
    // Medical assets search
    elements.searchMedicalBtn.addEventListener('click', performMedicalSearch);
    elements.searchMedicalAsset.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performMedicalSearch();
    });

    // Clear medical search
    elements.clearMedicalSearch.addEventListener('click', function() {
        elements.searchMedicalAsset.value = '';
        elements.filterStatus.value = '';
        elements.filterCategory.value = '';
        elements.filterZone.value = '';
        renderMedicalAssets();
    });

    // Non-medical assets search
    elements.searchNonMedicalBtn.addEventListener('click', performNonMedicalSearch);
    elements.searchNonmedicalAsset.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performNonMedicalSearch();
    });

    // Clear non-medical search
    elements.clearNonMedicalSearch.addEventListener('click', function() {
        elements.searchNonmedicalAsset.value = '';
        elements.filterNonmedStatus.value = '';
        elements.filterNonmedCategory.value = '';
        renderNonMedicalAssets();
    });

    // Filter change events
    elements.filterStatus.addEventListener('change', performMedicalSearch);
    elements.filterCategory.addEventListener('change', performMedicalSearch);
    elements.filterZone.addEventListener('change', performMedicalSearch);
    elements.filterNonmedStatus.addEventListener('change', performNonMedicalSearch);
    elements.filterNonmedCategory.addEventListener('change', performNonMedicalSearch);
}

// ========== FORM HANDLING ==========
function collectFormData() {
    const assetNo = document.getElementById('asset-no').value.trim();
    const assetName = document.getElementById('asset-name').value.trim();
    const category = document.getElementById('asset-category').value;
    const location = document.getElementById('asset-location').value;
    const status = document.getElementById('asset-status').value;
    
    // Validation
    if (!assetNo) {
        showToast('Sila masukkan Nombor Aset', 'error');
        return null;
    }
    if (!assetName) {
        showToast('Sila masukkan Nama Peralatan', 'error');
        return null;
    }
    if (!category) {
        showToast('Sila pilih Kategori', 'error');
        return null;
    }
    if (!location) {
        showToast('Sila pilih Lokasi', 'error');
        return null;
    }
    if (!status) {
        showToast('Sila pilih Status', 'error');
        return null;
    }
    
    const assetData = {
        id: currentEditingAssetId || Date.now().toString(),
        assetNo: assetNo,
        name: assetName,
        category: category,
        brand: document.getElementById('asset-brand').value.trim(),
        model: document.getElementById('asset-model').value.trim(),
        location: location,
        status: status,
        lastPPM: document.getElementById('last-ppm').value,
        nextPPM: document.getElementById('next-ppm').value,
        notes: document.getElementById('asset-notes').value.trim(),
        images: uploadedImages,
        createdAt: currentEditingAssetId ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // For non-medical assets, rename ppm fields
    if (currentAssetType === 'non-medical') {
        assetData.lastService = assetData.lastPPM;
        assetData.nextService = assetData.nextPPM;
        delete assetData.lastPPM;
        delete assetData.nextPPM;
    }
    
    return assetData;
}

function resetAssetForm() {
    elements.assetForm.reset();
    document.getElementById('asset-no').readOnly = false;
    uploadedImages = [];
    renderUploadedImages();
    currentEditingAssetId = null;
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];
    
    document.getElementById('last-ppm').value = today;
    document.getElementById('next-ppm').value = nextMonthStr;
}

function renderUploadedImages() {
    elements.uploadedImagesContainer.innerHTML = '';
    uploadedImages.forEach((image, index) => {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'uploaded-image';
        
        imageDiv.innerHTML = `
            <img src="${image}" alt="Asset Image ${index + 1}">
            <div class="remove-image" data-index="${index}">&times;</div>
        `;
        
        elements.uploadedImagesContainer.appendChild(imageDiv);
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-image').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            uploadedImages.splice(index, 1);
            renderUploadedImages();
        });
    });
}

// ========== ASSET MANAGEMENT FUNCTIONS ==========
async function editAsset(assetId, type) {
    currentAssetType = type;
    const assets = type === 'medical' ? medicalAssets : nonMedicalAssets;
    const asset = assets.find(a => a.id === assetId);
    
    if (!asset) {
        showToast('Aset tidak ditemui', 'error');
        return;
    }
    
    currentEditingAssetId = assetId;
    elements.modalTitle.textContent = type === 'medical' ? 'Kemaskini Aset Perubatan' : 'Kemaskini Aset Bukan Perubatan';
    
    // Populate form
    document.getElementById('asset-no').value = asset.assetNo || '';
    document.getElementById('asset-no').readOnly = true;
    document.getElementById('asset-name').value = asset.name || '';
    document.getElementById('asset-category').value = asset.category || '';
    document.getElementById('asset-brand').value = asset.brand || '';
    document.getElementById('asset-model').value = asset.model || '';
    document.getElementById('asset-location').value = asset.location || '';
    document.getElementById('asset-status').value = asset.status || '';
    
    if (type === 'medical') {
        document.getElementById('last-ppm').value = asset.lastPPM || '';
        document.getElementById('next-ppm').value = asset.nextPPM || '';
    } else {
        document.getElementById('last-ppm').value = asset.lastService || '';
        document.getElementById('next-ppm').value = asset.nextService || '';
    }
    
    document.getElementById('asset-notes').value = asset.notes || '';
    
    // Set images
    uploadedImages = Array.isArray(asset.images) ? [...asset.images] : [];
    renderUploadedImages();
    
    elements.assetModal.classList.add('active');
}

async function deleteAsset(assetId, type) {
    if (!confirm('Adakah anda pasti ingin memadam aset ini?')) return;
    
    try {
        const sheetName = type === 'medical' ? 'medical_assets' : 'non_medical_assets';
        const result = await GoogleSheetsAPI.deleteData(sheetName, assetId);
        
        if (result.success) {
            showToast(`${type === 'medical' ? 'Aset perubatan' : 'Aset bukan perubatan'} berjaya dipadam`, 'success');
            await loadAllData();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Gagal memadam aset', 'error');
    }
}

function viewAsset(assetId, type) {
    const assets = type === 'medical' ? medicalAssets : nonMedicalAssets;
    const asset = assets.find(a => a.id === assetId);
    
    if (!asset) {
        showToast('Aset tidak ditemui', 'error');
        return;
    }
    
    let details = `
        <strong>No. Aset:</strong> ${asset.assetNo}<br>
        <strong>Nama:</strong> ${asset.name}<br>
        <strong>Kategori:</strong> ${getCategoryName(asset.category)}<br>
        <strong>Jenama/Model:</strong> ${asset.brand || ''} ${asset.model || ''}<br>
        <strong>Lokasi:</strong> ${asset.location}<br>
        <strong>Status:</strong> ${asset.status}<br>
    `;
    
    if (asset.lastPPM) details += `<strong>Tarikh PPM Terakhir:</strong> ${formatDate(asset.lastPPM)}<br>`;
    if (asset.nextPPM) details += `<strong>Tarikh Next PPM:</strong> ${formatDate(asset.nextPPM)}<br>`;
    if (asset.lastService) details += `<strong>Tarikh Servis Terakhir:</strong> ${formatDate(asset.lastService)}<br>`;
    if (asset.nextService) details += `<strong>Tarikh Servis Seterusnya:</strong> ${formatDate(asset.nextService)}<br>`;
    if (asset.notes) details += `<strong>Catatan:</strong> ${asset.notes}<br>`;
    if (asset.createdAt) details += `<strong>Dicipta pada:</strong> ${formatDate(asset.createdAt)}<br>`;
    
    // Create a modal for viewing
    const modalHtml = `
        <div class="modal active" id="view-modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Butiran Aset</h3>
                    <span class="close-modal" onclick="document.getElementById('view-modal').remove()">&times;</span>
                </div>
                <div style="padding: 20px;">
                    ${details}
                    ${asset.images && asset.images.length > 0 ? `
                    <div style="margin-top: 20px;">
                        <strong>Gambar:</strong><br>
                        <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                            ${asset.images.map((img, i) => `
                                <img src="${img}" alt="Gambar ${i+1}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 5px; border: 1px solid #ddd;">
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    // Add to DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ========== RENDER FUNCTIONS ==========
function performMedicalSearch() {
    const searchTerm = elements.searchMedicalAsset.value.toLowerCase();
    const statusFilter = elements.filterStatus.value;
    const categoryFilter = elements.filterCategory.value;
    const zoneFilter = elements.filterZone.value;
    
    const filteredAssets = medicalAssets.filter(asset => {
        const matchesSearch = !searchTerm || 
            (asset.assetNo && asset.assetNo.toLowerCase().includes(searchTerm)) ||
            (asset.name && asset.name.toLowerCase().includes(searchTerm)) ||
            (asset.brand && asset.brand.toLowerCase().includes(searchTerm)) ||
            (asset.model && asset.model.toLowerCase().includes(searchTerm)) ||
            (asset.location && asset.location.toLowerCase().includes(searchTerm));
        
        const matchesStatus = !statusFilter || asset.status === statusFilter;
        const matchesCategory = !categoryFilter || asset.category === categoryFilter;
        const matchesZone = !zoneFilter || asset.location === zoneFilter;
        
        return matchesSearch && matchesStatus && matchesCategory && matchesZone;
    });
    
    renderMedicalAssets(filteredAssets);
}

function performNonMedicalSearch() {
    const searchTerm = elements.searchNonmedicalAsset.value.toLowerCase();
    const statusFilter = elements.filterNonmedStatus.value;
    const categoryFilter = elements.filterNonmedCategory.value;
    
    const filteredAssets = nonMedicalAssets.filter(asset => {
        const matchesSearch = !searchTerm || 
            (asset.assetNo && asset.assetNo.toLowerCase().includes(searchTerm)) ||
            (asset.name && asset.name.toLowerCase().includes(searchTerm)) ||
            (asset.brand && asset.brand.toLowerCase().includes(searchTerm)) ||
            (asset.model && asset.model.toLowerCase().includes(searchTerm)) ||
            (asset.location && asset.location.toLowerCase().includes(searchTerm));
        
        const matchesStatus = !statusFilter || asset.status === statusFilter;
        const matchesCategory = !categoryFilter || asset.category === categoryFilter;
        
        return matchesSearch && matchesStatus && matchesCategory;
    });
    
    renderNonMedicalAssets(filteredAssets);
}

function renderMedicalAssets(filteredAssets = null) {
    const assetsToRender = filteredAssets || medicalAssets;
    elements.medicalAssetsTableBody.innerHTML = '';
    
    if (assetsToRender.length === 0) {
        elements.medicalNoResults.style.display = 'block';
        elements.medicalAssetsTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 30px;">
                    ${filteredAssets ? 'Tiada aset perubatan ditemui untuk carian ini.' : 'Tiada aset perubatan dalam sistem. Sila tambah aset perubatan pertama anda.'}
                </td>
            </tr>
        `;
        return;
    }
    
    elements.medicalNoResults.style.display = 'none';
    
    assetsToRender.forEach(asset => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${asset.assetNo || '-'}</td>
            <td>${asset.name || '-'}</td>
            <td>${getCategoryName(asset.category) || '-'}</td>
            <td>${(asset.brand || '') + ' ' + (asset.model || '')}</td>
            <td><span class="zone-badge ${getZoneClass(asset.location)}">${asset.location || '-'}</span></td>
            <td><span class="status-badge status-${(asset.status || '').replace(' ', '-')}">${asset.status || '-'}</span></td>
            <td>${formatDate(asset.nextPPM)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-view" onclick="viewAsset('${asset.id}', 'medical')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-edit" onclick="editAsset('${asset.id}', 'medical')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteAsset('${asset.id}', 'medical')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        elements.medicalAssetsTableBody.appendChild(row);
    });
}

function renderNonMedicalAssets(filteredAssets = null) {
    const assetsToRender = filteredAssets || nonMedicalAssets;
    elements.nonMedicalAssetsTableBody.innerHTML = '';
    
    if (assetsToRender.length === 0) {
        elements.nonmedicalNoResults.style.display = 'block';
        elements.nonMedicalAssetsTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 30px;">
                    ${filteredAssets ? 'Tiada aset bukan perubatan ditemui untuk carian ini.' : 'Tiada aset bukan perubatan dalam sistem. Sila tambah aset bukan perubatan pertama anda.'}
                </td>
            </tr>
        `;
        return;
    }
    
    elements.nonmedicalNoResults.style.display = 'none';
    
    assetsToRender.forEach(asset => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${asset.assetNo || '-'}</td>
            <td>${asset.name || '-'}</td>
            <td>${asset.category || '-'}</td>
            <td>${(asset.brand || '') + ' ' + (asset.model || '')}</td>
            <td><span class="zone-badge ${getZoneClass(asset.location)}">${asset.location || '-'}</span></td>
            <td><span class="status-badge status-${(asset.status || '').replace(' ', '-')}">${asset.status || '-'}</span></td>
            <td>${formatDate(asset.nextService)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-view" onclick="viewAsset('${asset.id}', 'non-medical')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-edit" onclick="editAsset('${asset.id}', 'non-medical')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteAsset('${asset.id}', 'non-medical')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        elements.nonMedicalAssetsTableBody.appendChild(row);
    });
}

// ========== DASHBOARD FUNCTIONS ==========
function initializeDashboard() {
    // Update summary cards
    elements.totalMedicalAssets.textContent = medicalAssets.length;
    
    const activeAssets = medicalAssets.filter(a => a.status === 'aktif').length + 
                        nonMedicalAssets.filter(a => a.status === 'aktif').length;
    elements.activeAssets.textContent = activeAssets;
    
    // Calculate PPM due in next month
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const ppmDue = medicalAssets.filter(asset => {
        if (!asset.nextPPM) return false;
        const ppmDate = new Date(asset.nextPPM);
        return ppmDate >= today && ppmDate <= nextMonth;
    }).length;
    
    elements.ppmDue.textContent = ppmDue;
    
    const damagedAssets = medicalAssets.filter(a => a.status === 'rosak').length + 
                          nonMedicalAssets.filter(a => a.status === 'rosak').length;
    elements.damagedAssets.textContent = damagedAssets;
    
    renderPPMAlerts();
    renderRecentAssets();
    renderUrgentAssets();
    updateStats();
}

function renderPPMAlerts() {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const ppmAlerts = medicalAssets.filter(asset => {
        if (!asset.nextPPM) return false;
        const ppmDate = new Date(asset.nextPPM);
        return ppmDate >= today && ppmDate <= nextMonth;
    });
    
    elements.ppmAlertTable.innerHTML = '';
    
    if (ppmAlerts.length === 0) {
        elements.ppmAlertTable.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 30px;">
                    Tiada aset yang menghampiri tarikh PPM dalam tempoh 1 bulan akan datang.
                </td>
            </tr>
        `;
        return;
    }
    
    ppmAlerts.forEach(asset => {
        const row = document.createElement('tr');
        const ppmDate = new Date(asset.nextPPM);
        const daysLeft = Math.ceil((ppmDate - today) / (1000 * 60 * 60 * 24));
        
        row.innerHTML = `
            <td>${asset.assetNo || '-'}</td>
            <td>${asset.name || '-'}</td>
            <td>${getCategoryName(asset.category) || '-'}</td>
            <td><span class="zone-badge ${getZoneClass(asset.location)}">${asset.location || '-'}</span></td>
            <td>${formatDate(asset.nextPPM)} (${daysLeft} hari)</td>
            <td><span class="status-badge status-${(asset.status || '').replace(' ', '-')}">${asset.status || '-'}</span></td>
        `;
        
        elements.ppmAlertTable.appendChild(row);
    });
}

function renderRecentAssets() {
    const allAssets = [...medicalAssets, ...nonMedicalAssets]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 10);
    
    elements.recentAssetsTable.innerHTML = '';
    
    if (allAssets.length === 0) {
        elements.recentAssetsTable.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 30px;">
                    Tiada aset dalam sistem. Sila tambah aset pertama anda.
                </td>
            </tr>
        `;
        return;
    }
    
    allAssets.forEach(asset => {
        const row = document.createElement('tr');
        const isMedical = medicalAssets.some(a => a.id === asset.id);
        
        row.innerHTML = `
            <td>${asset.assetNo || '-'}</td>
            <td>${asset.name || '-'}</td>
            <td>${(asset.brand || '') + ' ' + (asset.model || '')}</td>
            <td>${isMedical ? getCategoryName(asset.category) : (asset.category || '-')}</td>
            <td><span class="zone-badge ${getZoneClass(asset.location)}">${asset.location || '-'}</span></td>
            <td><span class="status-badge status-${(asset.status || '').replace(' ', '-')}">${asset.status || '-'}</span></td>
        `;
        
        elements.recentAssetsTable.appendChild(row);
    });
}

function renderUrgentAssets() {
    elements.urgentAssetsTableBody.innerHTML = '';
    
    const allAssets = [...medicalAssets, ...nonMedicalAssets];
    const urgentAssets = allAssets.filter(asset => {
        const today = new Date();
        return asset.status === 'rosak' || 
               asset.status === 'tidak aktif' ||
               (asset.nextPPM && new Date(asset.nextPPM) < today) ||
               (asset.nextService && new Date(asset.nextService) < today);
    });
    
    if (urgentAssets.length === 0) {
        elements.urgentAssetsTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 30px;">
                    Tiada aset yang memerlukan tindakan segera.
                </td>
            </tr>
        `;
        return;
    }
    
    urgentAssets.forEach(asset => {
        const row = document.createElement('tr');
        const today = new Date();
        const isMedical = medicalAssets.some(a => a.id === asset.id);
        
        let issue = '';
        if (asset.status === 'rosak') issue = 'Rosak - Tidak Berfungsi';
        else if (asset.status === 'tidak aktif') issue = 'Tidak Aktif';
        else if (asset.nextPPM && new Date(asset.nextPPM) < today) {
            const daysLate = Math.ceil((today - new Date(asset.nextPPM)) / (1000 * 60 * 60 * 24));
            issue = `PPM Lewat ${daysLate} Hari`;
        }
        else if (asset.nextService && new Date(asset.nextService) < today) {
            const daysLate = Math.ceil((today - new Date(asset.nextService)) / (1000 * 60 * 60 * 24));
            issue = `Servis Lewat ${daysLate} Hari`;
        }
        else issue = 'Memerlukan Perhatian';
        
        row.innerHTML = `
            <td>${asset.assetNo || '-'}</td>
            <td>${asset.name || '-'}</td>
            <td>${issue}</td>
            <td><span class="zone-badge ${getZoneClass(asset.location)}">${asset.location || '-'}</span></td>
            <td>${formatDate(asset.nextPPM || asset.nextService || asset.createdAt)}</td>
            <td><span class="status-badge status-${(asset.status || '').replace(' ', '-')}">${asset.status || '-'}</span></td>
            <td><button class="btn-icon btn-edit" onclick="editAsset('${asset.id}', '${isMedical ? 'medical' : 'non-medical'}')" style="width: auto; padding: 5px 10px;">Tindakan</button></td>
        `;
        
        elements.urgentAssetsTableBody.appendChild(row);
    });
}

function updateStats() {
    const allAssets = [...medicalAssets, ...nonMedicalAssets];
    const totalAssets = allAssets.length;
    
    if (totalAssets === 0) {
        elements.availabilityRate.textContent = '0%';
        elements.ppmCompliance.textContent = '0%';
        elements.maintenanceCost.textContent = 'RM 0';
        elements.urgentAssetsCount.textContent = '0';
        return;
    }
    
    // Calculate availability rate
    const activeAssets = allAssets.filter(a => a.status === 'aktif').length;
    const availability = Math.round((activeAssets / totalAssets) * 100);
    elements.availabilityRate.textContent = `${availability}%`;
    
    // Calculate PPM compliance
    const today = new Date();
    const compliantAssets = medicalAssets.filter(asset => {
        if (!asset.nextPPM) return false;
        return new Date(asset.nextPPM) >= today;
    }).length;
    
    const ppmComplianceRate = medicalAssets.length > 0 
        ? Math.round((compliantAssets / medicalAssets.length) * 100) 
        : 0;
    elements.ppmCompliance.textContent = `${ppmComplianceRate}%`;
    
    // Calculate maintenance cost (simulated)
    const totalMonthlyCost = allAssets.length * 50; // Simulated cost
    elements.maintenanceCost.textContent = `RM ${totalMonthlyCost.toLocaleString()}`;
    
    // Count urgent assets
    const urgentAssets = allAssets.filter(asset => {
        const today = new Date();
        return asset.status === 'rosak' || 
               asset.status === 'tidak aktif' ||
               (asset.nextPPM && new Date(asset.nextPPM) < today) ||
               (asset.nextService && new Date(asset.nextService) < today);
    }).length;
    
    elements.urgentAssetsCount.textContent = urgentAssets;
}

// ========== CHART FUNCTIONS ==========
function initializeCharts() {
    // Destroy existing charts if they exist
    if (assetStatusChart) assetStatusChart.destroy();
    if (zoneDistributionChart) zoneDistributionChart.destroy();
    if (ppmTrendChart) ppmTrendChart.destroy();
    if (categoryChart) categoryChart.destroy();
    
    // Asset Status Chart
    const assetStatusCtx = document.getElementById('assetStatusChart').getContext('2d');
    const allAssets = [...medicalAssets, ...nonMedicalAssets];
    
    const statusCounts = {
        aktif: allAssets.filter(a => a.status === 'aktif').length,
        tidakAktif: allAssets.filter(a => a.status === 'tidak aktif').length,
        baikPulih: allAssets.filter(a => a.status === 'baik pulih').length,
        kalibrasi: allAssets.filter(a => a.status === 'kalibrasi').length,
        rosak: allAssets.filter(a => a.status === 'rosak').length,
        servis: allAssets.filter(a => a.status === 'servis').length
    };
    
    assetStatusChart = new Chart(assetStatusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Aktif', 'Tidak Aktif', 'Baik Pulih', 'Kalibrasi', 'Rosak', 'Servis'],
            datasets: [{
                data: [
                    statusCounts.aktif,
                    statusCounts.tidakAktif,
                    statusCounts.baikPulih,
                    statusCounts.kalibrasi,
                    statusCounts.rosak,
                    statusCounts.servis
                ],
                backgroundColor: [
                    '#28a745',
                    '#dc3545',
                    '#ffc107',
                    '#17a2b8',
                    '#6c757d',
                    '#007bff'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // Zone Distribution Chart
    const zoneCtx = document.getElementById('zoneDistributionChart').getContext('2d');
    
    const zoneCounts = {};
    allAssets.forEach(asset => {
        if (asset.location) {
            zoneCounts[asset.location] = (zoneCounts[asset.location] || 0) + 1;
        }
    });
    
    const zones = Object.keys(zoneCounts);
    const zoneData = zones.map(zone => zoneCounts[zone]);
    
    zoneDistributionChart = new Chart(zoneCtx, {
        type: 'bar',
        data: {
            labels: zones.length > 0 ? zones : ['Tiada Data'],
            datasets: [{
                label: 'Bilangan Aset',
                data: zoneData.length > 0 ? zoneData : [0],
                backgroundColor: zones.map(zone => {
                    if (zone.includes('Red')) return '#dc3545';
                    if (zone.includes('Yellow')) return '#ffc107';
                    if (zone.includes('Blue')) return '#007bff';
                    if (zone.includes('Green')) return '#28a745';
                    return '#6c757d';
                }),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: 'Bilangan Aset'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Lokasi/Zon'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // PPM Trend Chart
    const ppmCtx = document.getElementById('ppmTrendChart').getContext('2d');
    
    const months = getLast6Months();
    const ppmData = getPPMDataForMonths(months);
    
    ppmTrendChart = new Chart(ppmCtx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'PPM Selesai',
                    data: ppmData.completed,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2
                },
                {
                    label: 'PPM Tertunggak',
                    data: ppmData.pending,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Bilangan Aset'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Bulan'
                    }
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
    
    // Category Chart
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    
    const categoryCounts = {};
    medicalAssets.forEach(asset => {
        if (asset.category) {
            const categoryName = getCategoryName(asset.category);
            categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
        }
    });
    
    const categories = Object.keys(categoryCounts);
    const categoryData = categories.map(cat => categoryCounts[cat]);
    
    categoryChart = new Chart(categoryCtx, {
        type: 'polarArea',
        data: {
            labels: categories.length > 0 ? categories : ['Tiada Data'],
            datasets: [{
                data: categoryData.length > 0 ? categoryData : [1],
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#8AC926', '#1982C4',
                    '#FF595E', '#6A4C93'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        }
    });
}

function getLast6Months() {
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${monthNames[date.getMonth()]} ${date.getFullYear()}`);
    }
    
    return months;
}

function getPPMDataForMonths(months) {
    const completed = [];
    const pending = [];
    
    // Simulate data for demonstration
    for (let i = 0; i < months.length; i++) {
        completed.push(Math.floor(Math.random() * 20) + 5);
        pending.push(Math.floor(Math.random() * 10) + 1);
    }
    
    return { completed, pending };
}

// ========== REPORT FUNCTIONS ==========
function generateReport() {
    showToast('Menjana laporan...', 'info');
    
    const originalText = elements.generateReportBtn.innerHTML;
    elements.generateReportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menjana...';
    elements.generateReportBtn.disabled = true;
    
    setTimeout(() => {
        initializeCharts();
        showToast('Laporan berjaya dijana', 'success');
        elements.generateReportBtn.innerHTML = originalText;
        elements.generateReportBtn.disabled = false;
    }, 1500);
}

function printReport() {
    showToast('Menyediakan untuk cetakan...', 'info');
    
    setTimeout(() => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Laporan Sistem Pengurusan Aset HTAR</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #0056b3; }
                    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
                    .summary-item { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #0056b3; color: white; }
                    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 0.9em; }
                </style>
            </head>
            <body>
                <h1>Laporan Sistem Pengurusan Aset</h1>
                <h2>Hospital Tengku Ampuan Rahimah (HTAR)</h2>
                <p>Dijana pada: ${new Date().toLocaleDateString('ms-MY')}</p>
                
                <div class="summary">
                    <div class="summary-item">
                        <h3>${medicalAssets.length}</h3>
                        <p>Aset Perubatan</p>
                    </div>
                    <div class="summary-item">
                        <h3>${nonMedicalAssets.length}</h3>
                        <p>Aset Bukan Perubatan</p>
                    </div>
                    <div class="summary-item">
                        <h3>${medicalAssets.filter(a => a.status === 'aktif').length + nonMedicalAssets.filter(a => a.status === 'aktif').length}</h3>
                        <p>Aset Aktif</p>
                    </div>
                    <div class="summary-item">
                        <h3>${medicalAssets.filter(a => a.status === 'rosak').length + nonMedicalAssets.filter(a => a.status === 'rosak').length}</h3>
                        <p>Aset Rosak</p>
                    </div>
                </div>
                
                <h3>Ringkasan Statistik</h3>
                <table>
                    <tr>
                        <th>Metrik</th>
                        <th>Nilai</th>
                    </tr>
                    <tr>
                        <td>Kadar Ketersediaan Aset</td>
                        <td>${elements.availabilityRate.textContent}</td>
                    </tr>
                    <tr>
                        <td>Pematuhan Jadual PPM</td>
                        <td>${elements.ppmCompliance.textContent}</td>
                    </tr>
                    <tr>
                        <td>Kos Penyelenggaraan (Bulan Ini)</td>
                        <td>${elements.maintenanceCost.textContent}</td>
                    </tr>
                    <tr>
                        <td>Aset Perlu Perhatian Segera</td>
                        <td>${elements.urgentAssetsCount.textContent}</td>
                    </tr>
                </table>
                
                <div class="footer">
                    <p>Sistem Pengurusan Aset Jabatan Kecemasan & Trauma HTAR</p>
                    <p>© 2026 - Dijana oleh: PPP Mohd Shahril bin Mat Daud</p>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        
        showToast('Laporan sedia untuk dicetak', 'success');
    }, 1000);
}

function exportData() {
    showToast('Menyediakan data untuk eksport...', 'info');
    
    setTimeout(() => {
        // Create worksheet for medical assets
        const medicalData = medicalAssets.map(asset => ({
            'No. Aset': asset.assetNo,
            'Nama Aset': asset.name,
            'Kategori': getCategoryName(asset.category),
            'Jenama': asset.brand,
            'Model': asset.model,
            'Lokasi': asset.location,
            'Status': asset.status,
            'Tarikh PPM Terakhir': formatDate(asset.lastPPM),
            'Tarikh PPM Seterusnya': formatDate(asset.nextPPM),
            'Catatan': asset.notes,
            'Dicipta': formatDate(asset.createdAt),
            'Dikemaskini': formatDate(asset.updatedAt)
        }));
        
        // Create worksheet for non-medical assets
        const nonMedicalData = nonMedicalAssets.map(asset => ({
            'No. Aset': asset.assetNo,
            'Nama Aset': asset.name,
            'Kategori': asset.category,
            'Jenama': asset.brand,
            'Model': asset.model,
            'Lokasi': asset.location,
            'Status': asset.status,
            'Tarikh Servis Terakhir': formatDate(asset.lastService),
            'Tarikh Servis Seterusnya': formatDate(asset.nextService),
            'Catatan': asset.notes,
            'Dicipta': formatDate(asset.createdAt),
            'Dikemaskini': formatDate(asset.updatedAt)
        }));
        
        // Create workbook with multiple sheets
        const workbook = XLSX.utils.book_new();
        
        if (medicalData.length > 0) {
            const medicalSheet = XLSX.utils.json_to_sheet(medicalData);
            XLSX.utils.book_append_sheet(workbook, medicalSheet, 'Aset Perubatan');
        }
        
        if (nonMedicalData.length > 0) {
            const nonMedicalSheet = XLSX.utils.json_to_sheet(nonMedicalData);
            XLSX.utils.book_append_sheet(workbook, nonMedicalSheet, 'Aset Bukan Perubatan');
        }
        
        // Generate summary sheet
        const summaryData = [
            ['Statistik Sistem Pengurusan Aset HTAR'],
            ['Dijana pada:', new Date().toLocaleDateString('ms-MY')],
            [''],
            ['Ringkasan Statistik'],
            ['Jumlah Aset Perubatan:', medicalAssets.length],
            ['Jumlah Aset Bukan Perubatan:', nonMedicalAssets.length],
            ['Jumlah Keseluruhan Aset:', medicalAssets.length + nonMedicalAssets.length],
            ['Aset Aktif:', medicalAssets.filter(a => a.status === 'aktif').length + nonMedicalAssets.filter(a => a.status === 'aktif').length],
            ['Aset Rosak:', medicalAssets.filter(a => a.status === 'rosak').length + nonMedicalAssets.filter(a => a.status === 'rosak').length]
        ];
        
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');
        
        // Generate Excel file
        const fileName = `Data_Aset_HTAR_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        
        showToast('Data berjaya dieksport', 'success');
    }, 1000);
}

// ========== HELPER FUNCTIONS ==========
function getCategoryName(category) {
    const categories = {
        'ventilator': 'Ventilator',
        'monitor': 'Monitor',
        'defibrillator': 'Defibrillator',
        'infusion pump': 'Infusion Pump',
        'suction unit': 'Suction Unit',
        'ECG': 'ECG Machine',
        'x-ray': 'X-Ray Machine',
        'ultrasound': 'Ultrasound Machine',
        'syringe pump': 'Syringe Pump',
        'others': 'Lain-lain'
    };
    
    return categories[category] || category;
}

function getZoneClass(location) {
    if (!location) return 'gray-zone';
    if (location.includes('Red')) return 'red-zone';
    if (location.includes('Yellow')) return 'yellow-zone';
    if (location.includes('Blue')) return 'blue-zone';
    if (location.includes('Green')) return 'green-zone';
    return 'gray-zone';
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Tarikh tidak sah';
        return date.toLocaleDateString('ms-MY', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        return 'Tarikh tidak sah';
    }
}

function showToast(message, type = 'info') {
    // Remove existing toast
    elements.toast.className = 'toast';
    
    // Set new content and type
    elements.toast.textContent = message;
    elements.toast.classList.add(`toast-${type}`);
    elements.toast.classList.add('show');
    
    // Add icon
    const icon = document.createElement('i');
    icon.className = getToastIcon(type);
    elements.toast.prepend(icon);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        elements.toast.classList.remove('show');
        setTimeout(() => {
            elements.toast.textContent = '';
        }, 300);
    }, 3000);
}

function getToastIcon(type) {
    switch(type) {
        case 'success': return 'fas fa-check-circle';
        case 'error': return 'fas fa-exclamation-circle';
        case 'warning': return 'fas fa-exclamation-triangle';
        case 'info': 
        default: return 'fas fa-info-circle';
    }
}

// ========== INITIALIZATION ==========
// Make functions available globally for onclick handlers
window.editAsset = editAsset;
window.deleteAsset = deleteAsset;
window.viewAsset = viewAsset;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in (for development/testing)
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn && window.location.hostname !== 'localhost') {
        elements.loginContainer.classList.remove('active');
        elements.mainContainer.style.display = 'flex';
        initializeSystem();
    }
});