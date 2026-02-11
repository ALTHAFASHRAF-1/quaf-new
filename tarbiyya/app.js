// Google Apps Script Web App URL (Replace with your own)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxAkg6BussSxaSQysmZQUj_h77LV3Qr_NRGfMqw8xf2b3o-VdKVKEpXAVuaJPOwzYOh/exec';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const adnoSelect = document.getElementById('adno');
const dateInput = document.getElementById('date');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const errorMessages = {
    adno: document.getElementById('adnoError'),
    date: document.getElementById('dateError'),
    password: document.getElementById('passwordError')
};

// Set today's date as default
dateInput.valueAsDate = new Date();

// Load admission numbers on page load
document.addEventListener('DOMContentLoaded', function() {
    loadAdmissionNumbers();
});

// Function to load admission numbers from Google Sheets
async function loadAdmissionNumbers() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getAdmissionNumbers`);
        if (!response.ok) throw new Error('Failed to load admission numbers');
        
        const data = await response.json();
        
        if (data.success && data.admissionNumbers) {
            // Clear existing options except the first one
            while (adnoSelect.options.length > 1) {
                adnoSelect.remove(1);
            }
            
            // Add new options
            data.admissionNumbers.forEach(adno => {
                const option = document.createElement('option');
                option.value = adno;
                option.textContent = adno;
                adnoSelect.appendChild(option);
            });
        } else {
            throw new Error(data.message || 'Failed to load admission numbers');
        }
    } catch (error) {
        console.error('Error loading admission numbers:', error);
        showError('adno', 'Failed to load admission numbers. Please refresh the page.');
    }
}

// Function to show error message
function showError(field, message) {
    errorMessages[field].textContent = message;
    errorMessages[field].style.display = 'block';
    
    // Highlight the input field
    const inputField = document.getElementById(field);
    inputField.style.borderColor = '#e74c3c';
    inputField.style.boxShadow = '0 0 0 3px rgba(231, 76, 60, 0.1)';
}

// Function to clear error message
function clearError(field) {
    errorMessages[field].style.display = 'none';
    
    const inputField = document.getElementById(field);
    inputField.style.borderColor = '#ddd';
    inputField.style.boxShadow = 'none';
}

// Function to show loading state
function showLoading() {
    submitBtn.disabled = true;
    btnText.innerHTML = '<div class="loading"></div> Authenticating...';
}

// Function to hide loading state
function hideLoading() {
    submitBtn.disabled = false;
    btnText.textContent = 'Login to Track';
}

// Function to validate form
function validateForm() {
    let isValid = true;
    
    // Clear all errors
    Object.keys(errorMessages).forEach(field => clearError(field));
    
    // Validate admission number
    if (!adnoSelect.value) {
        showError('adno', 'Please select your admission number');
        isValid = false;
    }
    
    // Validate date
    if (!dateInput.value) {
        showError('date', 'Please select a date');
        isValid = false;
    }
    
    // Validate password
    if (!passwordInput.value) {
        showError('password', 'Please enter your password');
        isValid = false;
    } else if (passwordInput.value.length < 3) {
        showError('password', 'Password must be at least 3 characters');
        isValid = false;
    }
    
    return isValid;
}

// Form submission handler
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    showLoading();
    
    try {
        const formData = {
            action: 'login',
            adno: adnoSelect.value,
            date: dateInput.value,
            password: passwordInput.value
        };
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const result = await response.json();
        
        if (result.success) {
            // Store session data
            sessionStorage.setItem('tharbiyya_user', JSON.stringify({
                adno: adnoSelect.value,
                date: dateInput.value,
                name: result.name
            }));
            
            // Redirect to tracking page
            window.location.href = 'tracking.html';
        } else {
            throw new Error(result.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('password', error.message || 'Invalid credentials. Please try again.');
        hideLoading();
    }
});

// Real-time validation
adnoSelect.addEventListener('change', () => clearError('adno'));
dateInput.addEventListener('change', () => clearError('date'));
passwordInput.addEventListener('input', () => clearError('password'));

// Add input event listeners for real-time validation
const inputs = [adnoSelect, dateInput, passwordInput];
inputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.style.backgroundColor = 'white';
    });
    
    input.addEventListener('blur', function() {
        if (!this.value) {
            this.style.backgroundColor = '#f9f9f9';
        }
    });
});

// Function to check if user is already logged in (for tracking page)
function checkLogin() {
    const user = sessionStorage.getItem('tharbiyya_user');
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }
    return JSON.parse(user);
}
