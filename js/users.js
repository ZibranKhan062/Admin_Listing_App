// Initialize Firebase (make sure this part is correct and matches your Firebase configuration)
const firebaseConfig = {
 apiKey: "AIzaSyB6u0trke2S_lQRm-VTATUkkAH1fps8G8A",
    authDomain: "listingapp-1d5a2.firebaseapp.com",
    databaseURL: "https://listingapp-1d5a2-default-rtdb.firebaseio.com",
    projectId: "listingapp-1d5a2",
    storageBucket: "listingapp-1d5a2.appspot.com",
    messagingSenderId: "84987591955",
    appId: "1:84987591955:web:9a4c008b22e2bf46ffaee6",
    measurementId: "G-RK07LCZRTX"};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// DOM elements
const usersTableBody = document.getElementById('usersTableBody');
const userDetailsModal = new bootstrap.Modal(document.getElementById('userDetailsModal'));
const userDetailsModalBody = document.getElementById('userDetailsModalBody');

// Load users
function loadUsers() {
    database.ref('users').once('value', (snapshot) => {
        const users = snapshot.val();
        usersTableBody.innerHTML = '';
        for (const [userId, user] of Object.entries(users)) {
            const row = `
                <tr>
                    <td><img src="${user.profilePictureUrl}" alt="${user.displayName}" width="50" class="rounded-circle"></td>
                    <td>${user.displayName}</td>
                    <td>${user.email}</td>
                    <td>${user.authProvider}</td>
                    <td>${user.location || 'N/A'}</td>
                    <td>${new Date(user.createdAt).toLocaleString()}</td>
                    <td>${new Date(user.lastLoginAt).toLocaleString()}</td>
                    <td>
                        <button class="btn btn-sm btn-primary view-user" data-id="${userId}">View</button>
                    </td>
                </tr>
            `;
            usersTableBody.innerHTML += row;
        }
        addEventListeners();
    });
}

// Add event listeners
function addEventListeners() {
    const viewButtons = document.querySelectorAll('.view-user');

    viewButtons.forEach(button => {
        button.addEventListener('click', (e) => viewUserDetails(e.target.dataset.id));
    });
}

// View user details
function viewUserDetails(userId) {
    database.ref(`users/${userId}`).once('value', (snapshot) => {
        const user = snapshot.val();
        const userDetails = `
            <div class="row">
                <div class="col-md-4">
                    <img src="${user.profilePictureUrl}" alt="${user.displayName}" class="img-fluid rounded-circle">
                </div>
                <div class="col-md-8">
                    <h4>${user.displayName}</h4>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Auth Provider:</strong> ${user.authProvider}</p>
                    <p><strong>Location:</strong> ${user.location || 'N/A'}</p>
                    <p><strong>Created At:</strong> ${new Date(user.createdAt).toLocaleString()}</p>
                    <p><strong>Last Login:</strong> ${new Date(user.lastLoginAt).toLocaleString()}</p>
                </div>
            </div>
            <h5 class="mt-4">Listings</h5>
            <ul>
                ${user.listings ? Object.entries(user.listings).map(([listingId, listing]) => `
                    <li>${listing.name} (${listing.category} in ${listing.location})</li>
                `).join('') : 'No listings'}
            </ul>
            <h5 class="mt-4">Promoted Listings</h5>
            <ul>
                ${user.promotedListings ? Object.entries(user.promotedListings).map(([promotionId, promotion]) => `
                    <li>${promotion.packageName} for ${promotion.listingId} (Ends: ${new Date(promotion.promotionEndDate).toLocaleDateString()})</li>
                `).join('') : 'No promoted listings'}
            </ul>
        `;
        userDetailsModalBody.innerHTML = userDetails;
        userDetailsModal.show();
    });
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

// Load users when the page loads
document.addEventListener('DOMContentLoaded', loadUsers);
