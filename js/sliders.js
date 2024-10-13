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
const slidersTableBody = document.getElementById('slidersTableBody');
const sliderModal = new bootstrap.Modal(document.getElementById('sliderModal'));
const sliderForm = document.getElementById('sliderForm');
const sliderLocation = document.getElementById('sliderLocation');
const sliderItems = document.getElementById('sliderItems');
const addSliderItemBtn = document.getElementById('addSliderItem');
const saveSliderBtn = document.getElementById('saveSliderBtn');
const addSliderBtn = document.getElementById('addSliderBtn');

let editingSliderIndex = null;

// Load sliders
function loadSliders() {
    database.ref('sliders').once('value', (snapshot) => {
        const sliders = snapshot.val();
        slidersTableBody.innerHTML = '';
        sliders.forEach((slider, index) => {
            const row = `
                <tr>
                    <td>${slider.location}</td>
                    <td>${slider.items.length}</td>
                    <td>
                        <button class="btn btn-sm btn-primary edit-slider" data-index="${index}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-slider" data-index="${index}">Delete</button>
                    </td>
                </tr>
            `;
            slidersTableBody.innerHTML += row;
        });
        addEventListeners();
    });
}

// Load locations
function loadLocations() {
    database.ref('locations').once('value', (snapshot) => {
        const locations = snapshot.val();
        sliderLocation.innerHTML = '<option value="">Select a location</option>';
        locations.forEach(location => {
            sliderLocation.innerHTML += `<option value="${location}">${location}</option>`;
        });
    });
}

// Add slider item
function addSliderItem(item = {}) {
    const itemIndex = sliderItems.children.length;
    const itemHtml = `
        <div class="mb-3 slider-item">
            <h5>Item ${itemIndex + 1}</h5>
            <div class="mb-2">
                <label for="itemTitle${itemIndex}" class="form-label">Title</label>
                <input type="text" class="form-control" id="itemTitle${itemIndex}" value="${item.title || ''}" required>
            </div>
            <div class="mb-2">
                <label for="itemDescription${itemIndex}" class="form-label">Description</label>
                <input type="text" class="form-control" id="itemDescription${itemIndex}" value="${item.description || ''}" required>
            </div>
            <div class="mb-2">
                <label for="itemImageUrl${itemIndex}" class="form-label">Image URL</label>
                <input type="url" class="form-control" id="itemImageUrl${itemIndex}" value="${item.imageUrl || ''}" required>
            </div>
            <div class="mb-2">
                <label for="itemRating${itemIndex}" class="form-label">Rating</label>
                <input type="number" class="form-control" id="itemRating${itemIndex}" min="0" max="5" step="0.1" value="${item.rating || ''}">
            </div>
            <button type="button" class="btn btn-danger remove-item">Remove</button>
        </div>
    `;
    sliderItems.insertAdjacentHTML('beforeend', itemHtml);
}

// Save slider
function saveSlider() {
    const location = sliderLocation.value;
    const items = Array.from(sliderItems.children).map(item => {
        const index = Array.from(sliderItems.children).indexOf(item);
        return {
            title: document.getElementById(`itemTitle${index}`).value,
            description: document.getElementById(`itemDescription${index}`).value,
            imageUrl: document.getElementById(`itemImageUrl${index}`).value,
            rating: parseFloat(document.getElementById(`itemRating${index}`).value) || null
        };
    });

    const slider = { location, items };

    if (editingSliderIndex !== null) {
        database.ref(`sliders/${editingSliderIndex}`).set(slider)
            .then(() => {
                showToast('Slider updated successfully', 'success');
                sliderModal.hide();
                loadSliders();
            })
            .catch(error => {
                console.error('Error updating slider:', error);
                showToast('Error updating slider', 'error');
            });
    } else {
        database.ref('sliders').push(slider)
            .then(() => {
                showToast('Slider added successfully', 'success');
                sliderModal.hide();
                loadSliders();
            })
            .catch(error => {
                console.error('Error adding slider:', error);
                showToast('Error adding slider', 'error');
            });
    }
}

// Delete slider
function deleteSlider(index) {
    if (confirm('Are you sure you want to delete this slider?')) {
        database.ref(`sliders/${index}`).remove()
            .then(() => {
                showToast('Slider deleted successfully', 'success');
                loadSliders();
            })
            .catch(error => {
                console.error('Error deleting slider:', error);
                showToast('Error deleting slider', 'error');
            });
    }
}

// Add event listeners
function addEventListeners() {
    document.querySelectorAll('.edit-slider').forEach(btn => {
        btn.addEventListener('click', (e) => {
            editingSliderIndex = parseInt(e.target.dataset.index);
            database.ref(`sliders/${editingSliderIndex}`).once('value', (snapshot) => {
                const slider = snapshot.val();
                sliderLocation.value = slider.location;
                sliderItems.innerHTML = '';
                slider.items.forEach(item => addSliderItem(item));
                document.getElementById('sliderModalLabel').textContent = 'Edit Slider';
                sliderModal.show();
            });
        });
    });

    document.querySelectorAll('.delete-slider').forEach(btn => {
        btn.addEventListener('click', (e) => {
            deleteSlider(parseInt(e.target.dataset.index));
        });
    });
}

// Event listeners
addSliderItemBtn.addEventListener('click', () => addSliderItem());
saveSliderBtn.addEventListener('click', saveSlider);
addSliderBtn.addEventListener('click', () => {
    editingSliderIndex = null;
    sliderForm.reset();
    sliderItems.innerHTML = '';
    addSliderItem();
    document.getElementById('sliderModalLabel').textContent = 'Add New Slider';
    sliderModal.show();
});

sliderItems.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-item')) {
        e.target.closest('.slider-item').remove();
    }
});

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

// Load sliders and locations when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadSliders();
    loadLocations();
});
