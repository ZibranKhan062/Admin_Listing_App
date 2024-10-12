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
    const loginForm = document.getElementById('loginForm');
    const toast = new bootstrap.Toast(document.getElementById('toast'));

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Signed in
                const user = userCredential.user;
                showNotification('Login successful!', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                showNotification(errorMessage, 'danger');
            });
    });

    function showNotification(message, type) {
        const toastBody = document.querySelector('.toast-body');
        toastBody.textContent = message;
        document.getElementById('toast').classList.remove('bg-success', 'bg-danger');
        document.getElementById('toast').classList.add(`bg-${type}`);
        toast.show();
    }
});
