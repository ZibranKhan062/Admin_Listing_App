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
const locationsTableBody = document.getElementById('locationsTableBody');
const addLocationBtn = document.getElementById('addLocationBtn');
const locationModal = new bootstrap.Modal(document.getElementById('locationModal'));
const locationForm = document.getElementById('locationForm');
const saveLocationBtn = document.getElementById('saveLocationBtn');
const locationModalLabel = document.getElementById('locationModalLabel');

let editingLocationIndex = null;

// Load locations
function loadLocations() {
    database.ref('locations').once('value', (snapshot) => {
        const locations = snapshot.val();
        locationsTableBody.innerHTML = '';
        locations.forEach((location, index) => {
            const row = `
                <tr>
                    <td>${location}</td>
                    <td>
                        <button class="btn btn-sm btn-primary edit-location" data-index="${index}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-location" data-index="${index}">Delete</button>
                    </td>
                </tr>
            `;
            locationsTableBody.innerHTML += row;
        });
        addEventListeners();
    });
}

// Add event listeners
function addEventListeners() {
    const editButtons = document.querySelectorAll('.edit-location');
    const deleteButtons = document.querySelectorAll('.delete-location');

    editButtons.forEach(button => {
        button.addEventListener('click', (e) => editLocation(parseInt(e.target.dataset.index)));
    });

    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => deleteLocation(parseInt(e.target.dataset.index)));
    });
}

// Add new location
addLocationBtn.addEventListener('click', () => {
    editingLocationIndex = null;
    locationForm.reset();
    locationModalLabel.textContent = 'Add New Location';
    locationModal.show();
});

// Save location
saveLocationBtn.addEventListener('click', () => {
    const name = document.getElementById('locationName').value.trim();

    if (name) {
        database.ref('locations').once('value', (snapshot) => {
            const locations = snapshot.val() || [];
            
            if (editingLocationIndex !== null) {
                locations[editingLocationIndex] = name;
            } else {
                locations.push(name);
            }

            database.ref('locations').set(locations)
                .then(() => {
                    locationModal.hide();
                    showToast(editingLocationIndex !== null ? 'Location updated successfully' : 'Location added successfully', 'success');
                    loadLocations();
                })
                .catch((error) => {
                    console.error('Error saving location:', error);
                    showToast('Error saving location', 'error');
                });
        });
    }
});

// Edit location
function editLocation(index) {
    editingLocationIndex = index;
    database.ref('locations').once('value', (snapshot) => {
        const locations = snapshot.val();
        document.getElementById('locationName').value = locations[index];
        locationModalLabel.textContent = 'Edit Location';
        locationModal.show();
    });
}

// Delete location
function deleteLocation(index) {
    if (confirm('Are you sure you want to delete this location?')) {
        database.ref('locations').once('value', (snapshot) => {
            const locations = snapshot.val();
            locations.splice(index, 1);
            database.ref('locations').set(locations)
                .then(() => {
                    showToast('Location deleted successfully', 'success');
                    loadLocations();
                })
                .catch((error) => {
                    console.error('Error deleting location:', error);
                    showToast('Error deleting location', 'error');
                });
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

// Load locations when the page loads
document.addEventListener('DOMContentLoaded', loadLocations);
