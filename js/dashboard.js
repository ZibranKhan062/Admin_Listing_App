// Firebase configuration
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    const dashboardCards = document.getElementById('dashboardCards');
    const toast = new bootstrap.Toast(document.getElementById('toast'));

    // Check if user is logged in
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // User is signed in, load dashboard
            loadDashboard();
        } else {
            // No user is signed in, redirect to login page
            window.location.href = 'index.html';
        }
    });

    // Logout functionality
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        firebase.auth().signOut().then(() => {
            showNotification('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }).catch((error) => {
            showNotification('Logout error: ' + error.message, 'danger');
        });
    });

    function loadDashboard() {
    const sections = [
        { name: 'Listings', icon: 'bi-list-ul' },
        { name: 'Categories', icon: 'bi-grid' },
        { name: 'Locations', icon: 'bi-geo-alt' },
        { name: 'Users', icon: 'bi-people' },
        { name: 'Promotions', icon: 'bi-star' }
    ];

    sections.forEach(section => {
        const card = createDashboardCard(section);
        dashboardCards.appendChild(card);

        // Add click event listener for the "Listings" card
        if (section.name === 'Listings') {
            card.querySelector('.btn').addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'listings.html';
            });
        }
    });
}


    function createDashboardCard(section) {
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        card.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">
                        <i class="bi ${section.icon}"></i> ${section.name}
                    </h5>
                    <p class="card-text">Manage ${section.name.toLowerCase()}</p>
                    <a href="#" class="btn btn-primary" data-section="${section.name.toLowerCase()}">View ${section.name}</a>
                </div>
            </div>
        `;

        card.querySelector('.btn').addEventListener('click', function(e) {
            e.preventDefault();
            const sectionName = this.getAttribute('data-section');
            // Navigate to the respective management page
            window.location.href = `${sectionName}.html`;
        });

        return card;
    }

    function showNotification(message, type) {
        const toastBody = document.querySelector('.toast-body');
        toastBody.textContent = message;
        document.getElementById('toast').classList.remove('bg-success', 'bg-danger');
        document.getElementById('toast').classList.add(`bg-${type}`);
        toast.show();
    }
});
