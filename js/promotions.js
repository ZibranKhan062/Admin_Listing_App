// Initialize Firebase (make sure this part is correct and matches your Firebase configuration)
const firebaseConfig = {
    apiKey: "AIzaSyB6u0trke2S_lQRm-VTATUkkAH1fps8G8A",
    authDomain: "listingapp-1d5a2.firebaseapp.com",
    databaseURL: "https://listingapp-1d5a2-default-rtdb.firebaseio.com",
    projectId: "listingapp-1d5a2",
    storageBucket: "listingapp-1d5a2.appspot.com",
    messagingSenderId: "84987591955",
    appId: "1:84987591955:web:9a4c008b22e2bf46ffaee6",
    measurementId: "G-RK07LCZRTX"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// DOM elements
const packagesContainer = document.getElementById('packagesContainer');
const activePromotionsTableBody = document.getElementById('activePromotionsTableBody');
const addPackageBtn = document.getElementById('addPackageBtn');
const packageModal = new bootstrap.Modal(document.getElementById('packageModal'));
const packageForm = document.getElementById('packageForm');
const savePackageBtn = document.getElementById('savePackageBtn');
const packageModalLabel = document.getElementById('packageModalLabel');

let editingPackageId = null;

// Load promotion packages
function loadPromotionPackages() {
    database.ref('promotions').once('value', (snapshot) => {
        const packages = snapshot.val();
        packagesContainer.innerHTML = '';
        for (const [key, pkg] of Object.entries(packages)) {
            const card = `
                <div class="card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">${pkg.name} ${pkg.bestValue ? '<span class="badge bg-success">Best Value</span>' : ''}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">${pkg.duration} - ₹${pkg.price}</h6>
                        <p class="card-text">
                            <strong>Features:</strong>
                            <ul>
                                ${pkg.features.map(feature => `<li>${feature}</li>`).join('')}
                            </ul>
                        </p>
                        <button class="btn btn-sm btn-primary edit-package" data-id="${key}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-package" data-id="${key}">Delete</button>
                    </div>
                </div>
            `;
            packagesContainer.innerHTML += card;
        }
        addPackageEventListeners();
    });
}

// Load active promotions
function loadActivePromotions() {
    database.ref('listedPromotions').once('value', (snapshot) => {
        const promotions = snapshot.val();
        activePromotionsTableBody.innerHTML = '';
        for (const [key, promotion] of Object.entries(promotions)) {
            const adminOverride = promotion.adminOverride !== undefined ? promotion.adminOverride : false;
            const row = `
                <tr data-id="${key}"> <!-- Add data-id to the row for easier access -->
                    <td>${promotion.listingId}</td>
                    <td>${promotion.userId}</td>
                    <td>${promotion.promotionPackage}</td>
                    <td>${new Date(promotion.promotionStartDate).toLocaleDateString()}</td>
                    <td>${new Date(promotion.promotionEndDate).toLocaleDateString()}</td>
                    <td>
                        <div class="form-check form-switch">
                            <input class="form-check-input admin-override" type="checkbox" id="override-${key}" ${adminOverride ? 'checked' : ''}>
                            <label class="form-check-label" for="override-${key}">Admin Override</label>
                        </div>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-danger cancel-promotion" data-id="${key}">Cancel</button>
                    </td>
                </tr>
            `;
            activePromotionsTableBody.innerHTML += row;
        }
        addPromotionEventListeners();
    });
}

// Add package event listeners
function addPackageEventListeners() {
    const editButtons = document.querySelectorAll('.edit-package');
    const deleteButtons = document.querySelectorAll('.delete-package');

    editButtons.forEach(button => {
        button.addEventListener('click', (e) => editPackage(e.target.dataset.id));
    });

    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => deletePackage(e.target.dataset.id));
    });
}

// Add promotion event listeners
function addPromotionEventListeners() {
    const overrideToggles = document.querySelectorAll('.admin-override');
    const cancelButtons = document.querySelectorAll('.cancel-promotion');

    overrideToggles.forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const promotionId = e.target.closest('tr').dataset.id; // Correctly get the promotion ID
            toggleAdminOverride(promotionId, e.target.checked);
        });
    });

    cancelButtons.forEach(button => {
        button.addEventListener('click', (e) => cancelPromotion(e.target.dataset.id));
    });
}

// Add new package
addPackageBtn.addEventListener('click', () => {
    editingPackageId = null;
    packageForm.reset();
    packageModalLabel.textContent = 'Add New Package';
    packageModal.show();
});

// Save package
savePackageBtn.addEventListener('click', () => {
    const name = document.getElementById('packageName').value;
    const duration = document.getElementById('packageDuration').value;
    const durationDays = parseInt(document.getElementById('packageDurationDays').value);
    const price = parseInt(document.getElementById('packagePrice').value);
    const features = document.getElementById('packageFeatures').value.split(',').map(feature => feature.trim());
    const bestValue = document.getElementById('packageBestValue').checked;

    if (name && duration && durationDays && price && features.length > 0) {
        const packageData = {
            name,
            duration,
            durationDays,
            price,
            features,
            bestValue
        };

        let savePromise;

        if (editingPackageId) {
            savePromise = database.ref(`promotions/${editingPackageId}`).update(packageData);
        } else {
            savePromise = database.ref('promotions').push(packageData);
        }

        savePromise
            .then(() => {
                packageModal.hide();
                showToast(editingPackageId ? 'Package updated successfully' : 'Package added successfully', 'success');
                loadPromotionPackages();
                editingPackageId = null;
            })
            .catch((error) => {
                console.error('Error saving package:', error);
                showToast('Error saving package', 'error');
            });
    }
});

// Edit package
function editPackage(packageId) {
    editingPackageId = packageId;
    database.ref(`promotions/${packageId}`).once('value', (snapshot) => {
        const pkg = snapshot.val();
        document.getElementById('packageName').value = pkg.name;
        document.getElementById('packageDuration').value = pkg.duration;
        document.getElementById('packageDurationDays').value = pkg.durationDays;
        document.getElementById('packagePrice').value = pkg.price;
        document.getElementById('packageFeatures').value = pkg.features.join(', ');
        document.getElementById('packageBestValue').checked = pkg.bestValue || false;
        packageModalLabel.textContent = 'Edit Package';
        packageModal.show();
    });
}

// Delete package
function deletePackage(packageId) {
    if (confirm('Are you sure you want to delete this package?')) {
        database.ref(`promotions/${packageId}`).remove()
            .then(() => {
                showToast('Package deleted successfully', 'success');
                loadPromotionPackages();
            })
            .catch((error) => {
                console.error('Error deleting package:', error);
                showToast('Error deleting package', 'error');
            });
    }
}

// Toggle admin override
function toggleAdminOverride(promotionId, isOverridden) {
    console.log(`Updating promotion ${promotionId}, setting adminOverride to ${isOverridden}`);

    // Reference to the specific promotion in the database
    const promotionRef = database.ref(`listedPromotions/${promotionId}`);

    // Fetch the current promotion data
    promotionRef.once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                // Log existing data for debugging
                console.log('Current promotion data:', snapshot.val());

                // Update only the adminOverride field of the specified promotion
                return promotionRef.update({ adminOverride: isOverridden });
            } else {
                console.error(`Promotion ${promotionId} not found. No update performed.`);
                showToast('Error: Promotion not found', 'error');
            }
        })
        .then(() => {
            console.log(`Update successful for promotion ${promotionId}`);
            showToast(`Admin override ${isOverridden ? 'enabled' : 'disabled'} successfully`, 'success');
            loadActivePromotions(); // Reload the promotions to reflect the change
        })
        .catch((error) => {
            console.error('Error updating admin override:', error);
            showToast('Error updating admin override', 'error');
        });
}

// Cancel promotion
function cancelPromotion(promotionId) {
    if (confirm('Are you sure you want to cancel this promotion?')) {
        database.ref(`listedPromotions/${promotionId}`).remove()
            .then(() => {
                showToast('Promotion cancelled successfully', 'success');
                loadActivePromotions();
            })
            .catch((error) => {
                console.error('Error cancelling promotion:', error);
                showToast('Error cancelling promotion', 'error');
            });
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = new bootstrap.Toast(document.getElementById('toast'));
    const toastBody = document.querySelector('.toast-body');
    const toastElement = document.getElementById('toast');

    toastBody.textContent = message;
    toastElement.classList.remove('bg-success', 'bg-danger');
    toastElement.classList.add(type === 'success' ? 'bg-success' : 'bg-danger');

    toast.show();
}

// Load promotion packages and active promotions when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadPromotionPackages();
    loadActivePromotions();
});
