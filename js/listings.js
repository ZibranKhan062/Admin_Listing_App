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

// Initialize OneSignal
window.OneSignal = window.OneSignal || [];
OneSignal.push(function() {
    OneSignal.init({
        appId: "0152b859-235a-4da6-b7a0-23a0283a4bb6",
    });
});

const db = firebase.database();
const listingsRef = db.ref('listings');
const categoriesRef = db.ref('categories');
const storage = firebase.storage();
const locationsRef = db.ref('locations');

document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    const addListingBtn = document.getElementById('addListingBtn');
    const saveListingBtn = document.getElementById('saveListingBtn');
    const listingsTableBody = document.getElementById('listingsTableBody');
    const listingForm = document.getElementById('listingForm');
    const listingModal = new bootstrap.Modal(document.getElementById('listingModal'));
    const toast = new bootstrap.Toast(document.getElementById('toast'));
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imageInput = document.getElementById('listingImageInput');
    
    let editingListingId = null;
    let editingListingLocation = null;
    let editingListingCategory = null;
      let currentImages = [];

    // Check if user is logged in
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            // No user is signed in, redirect to login page
            window.location.href = 'index.html';
        } else {
            // User is signed in, load listings
            loadListings();
            loadCategories();
            loadLocations();
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

   // Add listing button click
    addListingBtn.addEventListener('click', function() {
        resetForm();
        document.getElementById('listingModalLabel').textContent = 'Add New Listing';
        listingModal.show();
    });
    
     // Image input change
    imageInput.addEventListener('change', handleImageSelection);


    
    
    // Save listing button click
    saveListingBtn.addEventListener('click', function() {
        if (listingForm.checkValidity()) {
            const listingData = {
                name: document.getElementById('listingName').value,
                description: document.getElementById('listingDescription').value,
                rating: document.getElementById('listingRating').value,
                call: document.getElementById('listingCall').value,
                website: document.getElementById('listingWebsite').value,
                category: document.getElementById('listingCategory').value,
                location: document.getElementById('listingLocation').value
            };

            if (editingListingId) {
                updateListing(editingListingId, editingListingLocation, editingListingCategory, listingData);
            } else {
                addNewListing(listingData);
            }
        } else {
            listingForm.reportValidity();
        }
    });


     function loadListings() {
        listingsTableBody.innerHTML = '';
        listingsRef.once('value', (snapshot) => {
            snapshot.forEach((locationSnapshot) => {
                const location = locationSnapshot.key;
                locationSnapshot.forEach((categorySnapshot) => {
                    const category = categorySnapshot.key;
                    categorySnapshot.forEach((listingSnapshot) => {
                        const listing = listingSnapshot.val();
                        const listingId = listingSnapshot.key;
                        const row = createListingRow(listing, listingId, location, category);
                        listingsTableBody.appendChild(row);
                    });
                });
            });
        });
    }

  
   
   function createListingRow(listing, listingId, location, category) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${listing.name}</td>
        <td>${category}</td>
        <td>${location}</td>
        <td>
            <div class="form-check form-switch">
                <input class="form-check-input approve-switch" type="checkbox" id="approve-${listingId}" ${listing.approved ? 'checked' : ''}>
                <label class="form-check-label" for="approve-${listingId}">${listing.approved ? 'Approved' : 'Pending'}</label>
            </div>
        </td>
        <td>
            <button class="btn btn-sm btn-primary edit-btn" data-id="${listingId}" data-location="${location}" data-category="${category}">Edit</button>
            <button class="btn btn-sm btn-danger delete-btn" data-id="${listingId}" data-location="${location}" data-category="${category}">Delete</button>
        </td>
    `;

    row.querySelector('.edit-btn').addEventListener('click', function() {
        editListing(listingId, location, category);
    });

    row.querySelector('.delete-btn').addEventListener('click', function() {
        deleteListing(listingId, location, category);
    });

    row.querySelector('.approve-switch').addEventListener('change', function() {
        toggleApproval(listingId, location, category, this.checked);
    });

    return row;
}


function toggleApproval(listingId, location, category, isApproved) {
    const listingRef = listingsRef.child(location).child(category).child(listingId);
    
    listingRef.once('value', (snapshot) => {
        const listing = snapshot.val();
        const wasApproved = listing.approved;

        listingRef.update({ approved: isApproved })
            .then(() => {
                showNotification(`Listing ${isApproved ? 'approved' : 'unapproved'} successfully`, 'success');
                loadListings();

                // If the listing was not approved before and is now approved, send a notification
                if (!wasApproved && isApproved) {
                    sendApprovalNotification(listing.userId, listingId, listing.name);
                }
            })
            .catch((error) => {
                showNotification('Error updating approval status: ' + error.message, 'danger');
            });
    });
}

function sendApprovalNotification(userId, listingId, listingName) {
    // Fetch the user's device ID
    db.ref('users').child(userId).once('value', (snapshot) => {
        const user = snapshot.val();
        if (user && user.deviceID) {
            // Send OneSignal notification
            const notificationData = {
                app_id: "0152b859-235a-4da6-b7a0-23a0283a4bb6",
                include_player_ids: [user.deviceID],
                contents: {"en": `Your listing "${listingName}" has been approved!`}
            };

            fetch('https://onesignal.com/api/v1/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic OTZkNGE4MTQtYTU1Ny00ZDkzLTkwZDAtZTVlMmU5MTkzMjE1'
                },
                body: JSON.stringify(notificationData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('OneSignal notification sent:', data);
                // Add notification to user's notifications in the database
                const userNotificationsRef = db.ref(`userNotifications/${userId}`);
                userNotificationsRef.push({
                    listingId: listingId,
                    listingName: listingName,
                    message: `Your listing "${listingName}" has been approved!`,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    read: false
                });
            })
            .catch(error => console.error('Error sending OneSignal notification:', error));
        }
    });
}
   
   function approveListing(listingId, location, category) {
        listingsRef.child(location).child(category).child(listingId).update({ approved: true })
            .then(() => {
                showNotification('Listing approved successfully', 'success');
                loadListings();
            })
            .catch((error) => {
                showNotification('Error approving listing: ' + error.message, 'danger');
            });
    }

 
 function editListing(listingId, location, category) {
    editingListingId = listingId;
    editingListingLocation = location;
    editingListingCategory = category;

    listingsRef.child(location).child(category).child(listingId).once('value', (snapshot) => {
        const listing = snapshot.val();
        document.getElementById('listingName').value = listing.name || '';
        document.getElementById('listingCategory').value = category;
        document.getElementById('listingLocation').value = location;
        document.getElementById('listingDescription').value = listing.description || '';
        document.getElementById('listingRating').value = listing.rating || '';
        document.getElementById('listingCall').value = listing.call || '';
        document.getElementById('listingWebsite').value = listing.website || '';

        // Load and display existing images
        currentImages = listing.imageUrls || [];
        displayImagePreviews(currentImages);

        document.getElementById('listingModalLabel').textContent = 'Edit Listing';
        listingModal.show();
    });
}



    
    function updateListing(listingId, oldLocation, oldCategory, listingData) {
    const newLocation = listingData.location;
    const newCategory = listingData.category;

    uploadImages(listingId, currentImages)
        .then((imageUrls) => {
            listingData.imageUrls = imageUrls;

            if (oldLocation !== newLocation || oldCategory !== newCategory) {
                // Remove from old location
                listingsRef.child(oldLocation).child(oldCategory).child(listingId).remove()
                    .then(() => {
                        // Add to new location
                        return listingsRef.child(newLocation).child(newCategory).child(listingId).set(listingData);
                    })
                    .then(() => {
                        showNotification('Listing updated successfully', 'success');
                        listingModal.hide();
                        loadListings();
                        resetForm();
                    })
                    .catch((error) => {
                        showNotification('Error updating listing: ' + error.message, 'danger');
                    });
            } else {
                // Update in the same location
                listingsRef.child(oldLocation).child(oldCategory).child(listingId).update(listingData)
                    .then(() => {
                        showNotification('Listing updated successfully', 'success');
                        listingModal.hide();
                        loadListings();
                        resetForm();
                    })
                    .catch((error) => {
                        showNotification('Error updating listing: ' + error.message, 'danger');
                    });
            }
        })
        .catch((error) => {
            showNotification('Error uploading images: ' + error.message, 'danger');
        });
}


function addNewListing(listingData) {
    const newListingRef = listingsRef.child(listingData.location).child(listingData.category).push();
    const listingId = newListingRef.key;

    listingData.approved = false; // Set initial approval status

    uploadImages(listingId, currentImages)
        .then((imageUrls) => {
            listingData.imageUrls = imageUrls;
            return newListingRef.set(listingData);
        })
        .then(() => {
            showNotification('Listing added successfully', 'success');
            listingModal.hide();
            loadListings();
            resetForm();
        })
        .catch((error) => {
            showNotification('Error adding listing: ' + error.message, 'danger');
        });
}



    function deleteListing(listingId, location, category) {
        if (confirm('Are you sure you want to delete this listing?')) {
            listingsRef.child(location).child(category).child(listingId).remove()
                .then(() => {
                    showNotification('Listing deleted successfully', 'success');
                    loadListings();
                })
                .catch((error) => {
                    showNotification('Error deleting listing: ' + error.message, 'danger');
                });
        }
    }
   
   
function handleImageSelection(event) {
    const files = event.target.files;
    const newImageUrls = Array.from(files).map(file => URL.createObjectURL(file));
    currentImages = [...currentImages, ...newImageUrls];
    displayImagePreviews(currentImages);
}   
   


function displayImagePreviews(imageUrls) {
    imagePreviewContainer.innerHTML = '';
    imageUrls.forEach((url, index) => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'image-preview';
        imgContainer.innerHTML = `
            <img src="${url}" alt="Preview ${index + 1}">
            <button type="button" class="btn btn-sm btn-danger remove-image" data-index="${index}">×</button>
        `;
        imagePreviewContainer.appendChild(imgContainer);

        imgContainer.querySelector('.remove-image').addEventListener('click', function() {
            removeImage(index);
        });
    });
}



function removeImage(index) {
    currentImages.splice(index, 1);
    displayImagePreviews(currentImages);
}
    
    
 function uploadImages(listingId, imagesToUpload) {
    const imageUploadPromises = [];

    imagesToUpload.forEach((imageUrl, index) => {
        if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
            // This is a new image that needs to be uploaded
            const imageRef = storage.ref(`listings/${listingId}_${Date.now()}_${index}`);
            imageUploadPromises.push(
                fetch(imageUrl)
                    .then(response => response.blob())
                    .then(blob => imageRef.put(blob))
                    .then(() => imageRef.getDownloadURL())
            );
        } else {
            // This is an existing image URL, no need to upload
            imageUploadPromises.push(Promise.resolve(imageUrl));
        }
    });

    return Promise.all(imageUploadPromises);
}   

    function loadCategories() {
        const categorySelect = document.getElementById('listingCategory');
        categoriesRef.once('value', (snapshot) => {
            snapshot.forEach((childSnapshot) => {
                const category = childSnapshot.val();
                const option = document.createElement('option');
                option.value = childSnapshot.key;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        });
    }

    function loadLocations() {
        const locationSelect = document.getElementById('listingLocation');
        locationsRef.once('value', (snapshot) => {
            snapshot.val().forEach((location) => {
                const option = document.createElement('option');
                option.value = location;
                option.textContent = location;
                locationSelect.appendChild(option);
            });
        });
    }

    function resetForm() {
        listingForm.reset();
        editingListingId = null;
        editingListingLocation = null;
        editingListingCategory = null;
         currentImages = [];
        imagePreviewContainer.innerHTML = '';
    }

    function showNotification(message, type) {
        const toastBody = document.querySelector('.toast-body');
        toastBody.textContent = message;
        document.getElementById('toast').classList.remove('bg-success', 'bg-danger');
        document.getElementById('toast').classList.add(`bg-${type}`);
        toast.show();
    }
});


