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
const categoriesTableBody = document.getElementById('categoriesTableBody');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));
const categoryForm = document.getElementById('categoryForm');
const saveCategoryBtn = document.getElementById('saveCategoryBtn');
const categoryModalLabel = document.getElementById('categoryModalLabel');

let editingCategoryId = null;

// Load categories
function loadCategories() {
    database.ref('categories').on('value', (snapshot) => {
        const categories = snapshot.val();
        categoriesTableBody.innerHTML = '';
        for (const [key, category] of Object.entries(categories)) {
            const row = `
                <tr>
                    <td><img src="${category.iconUrl}" alt="${category.name}" width="50"></td>
                    <td>${category.name}</td>
                    <td>
                        <button class="btn btn-sm btn-primary edit-category" data-id="${key}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-category" data-id="${key}">Delete</button>
                    </td>
                </tr>
            `;
            categoriesTableBody.innerHTML += row;
        }
        addEventListeners();
    });
}

// Add event listeners
function addEventListeners() {
    const editButtons = document.querySelectorAll('.edit-category');
    const deleteButtons = document.querySelectorAll('.delete-category');

    editButtons.forEach(button => {
        button.addEventListener('click', (e) => editCategory(e.target.dataset.id));
    });

    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => deleteCategory(e.target.dataset.id));
    });
}

// Add new category
addCategoryBtn.addEventListener('click', () => {
    editingCategoryId = null;
    categoryForm.reset();
    categoryModalLabel.textContent = 'Add New Category';
    categoryModal.show();
});

// Save category
saveCategoryBtn.addEventListener('click', () => {
    const name = document.getElementById('categoryName').value;
    const iconUrl = document.getElementById('categoryIcon').value;

    if (name && iconUrl) {
        const categoryData = {
            name: name,
            iconUrl: iconUrl
        };

        let savePromise;

        if (editingCategoryId) {
            savePromise = database.ref(`categories/${editingCategoryId}`).update(categoryData);
        } else {
            savePromise = database.ref('categories').push(categoryData);
        }

        savePromise
            .then(() => {
                categoryModal.hide();
                showToast(editingCategoryId ? 'Category updated successfully' : 'Category added successfully', 'success');
                editingCategoryId = null;
            })
            .catch((error) => {
                console.error('Error saving category:', error);
                showToast('Error saving category', 'error');
            });
    }
});

// Edit category
function editCategory(categoryId) {
    editingCategoryId = categoryId;
    database.ref(`categories/${categoryId}`).once('value', (snapshot) => {
        const category = snapshot.val();
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryIcon').value = category.iconUrl;
        categoryModalLabel.textContent = 'Edit Category';
        categoryModal.show();
    });
}

// Delete category
function deleteCategory(categoryId) {
    if (confirm('Are you sure you want to delete this category?')) {
        database.ref(`categories/${categoryId}`).remove()
            .then(() => {
                showToast('Category deleted successfully', 'success');
            })
            .catch((error) => {
                console.error('Error deleting category:', error);
                showToast('Error deleting category', 'error');
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

// Load categories when the page loads
document.addEventListener('DOMContentLoaded', loadCategories);
