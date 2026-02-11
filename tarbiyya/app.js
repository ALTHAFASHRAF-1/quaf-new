 // Configuration
const CONFIG = {
    APPSCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzFrvkkYipPuEs9iMdNqQXyX6oFV8UojvGxyRbm3Oquwh7M_uRJKMSw-uM_m-kEO4Bz/exec',
    HEADINGS: ['zuhr', 'asr', 'magrib', 'isha', 'subh', 'thahajjud', 'zuha', 'swalath_count', 'ravathib']
};

// DOM Elements
let loginForm, adnoSelect, dateInput, passwordInput, submitBtn, btnText, messageDiv;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    loginForm = document.getElementById('loginForm');
    adnoSelect = document.getElementById('adno');
    dateInput = document.getElementById('date');
    passwordInput = document.getElementById('password');
    submitBtn = document.getElementById('submitBtn');
    btnText = document.getElementById('btnText');
    messageDiv = document.getElementById('message');
    
    // Set default date to today
    const today = new Date();
    dateInput.value = today.toISOString().split('T')[0];
    
    // Set max date to today
    dateInput.max = today.toISOString().split('T')[0];
    
    // Load admission numbers from Google Sheets
    loadAdmissionNumbers();
    
    // Form submission handler
    loginForm.addEventListener('submit', handleLogin);
});

// Load admission numbers from Google Sheets
async function loadAdmissionNumbers() {
    try {
        // Show loading state
        const originalText = adnoSelect.innerHTML;
        adnoSelect.innerHTML = '<option value="">Loading admission numbers...</option>';
        
        // Call Google Apps Script to get admission numbers
        const response = await fetch(`${CONFIG.APPSCRIPT_URL}?action=getAdmissionNumbers`);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.admissionNumbers) {
                // Clear the select
                adnoSelect.innerHTML = '<option value="">Select your admission number</option>';
                
                // Add admission numbers
                data.admissionNumbers.forEach(adno => {
                    const option = document.createElement('option');
                    option.value = adno;
                    option.textContent = adno;
                    adnoSelect.appendChild(option);
                });
            } else {
                throw new Error('Failed to load admission numbers');
            }
        } else {
            throw new Error('Network response was not ok');
        }
    } catch (error) {
        console.error('Error loading admission numbers:', error);
        adnoSelect.innerHTML = '<option value="">Error loading. Please refresh.</option>';
        
        // Show error message
        showMessage('Error loading admission numbers. Please try again.', 'error');
    }
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    // Get form values
    const adno = adnoSelect.value;
    const date = dateInput.value;
    const password = passwordInput.value;
    
    // Validate form
    if (!adno || !date || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    btnText.innerHTML = '<div class="loading"></div> Processing...';
    
    try {
        // Call Google Apps Script to validate login and create sheet
        const response = await fetch(CONFIG.APPSCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'login',
                adno: adno,
                date: date,
                password: password
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success) {
                // Store user data in localStorage
                localStorage.setItem('tharbiyya_user', JSON.stringify({
                    adno: adno,
                    date: date,
                    sheetName: data.sheetName
                }));
                
                // Show success message
                showMessage('Login successful! Redirecting...', 'success');
                
                // Redirect to tracking page after a delay
                setTimeout(() => {
                    window.location.href = 'tracking.html';
                }, 1500);
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } else {
            throw new Error('Network response was not ok');
        }
    } catch (error) {
        console.error('Error during login:', error);
        showMessage(error.message || 'Login failed. Please try again.', 'error');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        btnText.textContent = 'Submit & Continue';
    }
}

// Show message to user
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
    
    // Auto-hide error messages after 8 seconds
    if (type === 'error') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 8000);
    }
}

// Check if user is already logged in when accessing other pages
function checkLogin() {
    const user = localStorage.getItem('tharbiyya_user');
    if (!user && !window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
    }
    return user ? JSON.parse(user) : null;
}

// Logout function
function logout() {
    localStorage.removeItem('tharbiyya_user');
    window.location.href = 'login.html';
}
