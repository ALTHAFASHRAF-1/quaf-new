// Configuration - UPDATE THIS WITH YOUR DEPLOYED URL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyBZOXlOpcUcdpE02Yzpo6-rluIV8lLBYX5GfnGPgfh2DUaU3pp4duqkZCqY1xkdGs6hA/exec";

// Global variables
let currentUser = null;
let userDataTable = null;
let programsDataTable = null;
let registrationDataTable = null;
let scheduleDataTable = null;
let resultsDataTable = null;
let allPrograms = [];
let teamMembers = [];

// Cache for data
const dataCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

// Debug logging function
function debugLog(message, type = 'info') {
    const debugLog = document.getElementById('debugLog');
    if (!debugLog) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const color = type === 'error' ? 'text-red-400' : type === 'success' ? 'text-green-400' : 'text-blue-400';
    
    const logEntry = document.createElement('div');
    logEntry.className = `mb-1 ${color}`;
    logEntry.innerHTML = `<span class="text-gray-400">[${timestamp}]</span> ${message}`;
    debugLog.appendChild(logEntry);
    debugLog.scrollTop = debugLog.scrollHeight;
    
    // Also log to console
    if (type === 'error') {
        console.error(message);
    } else {
        console.log(message);
    }
}

function toggleDebug() {
    const debugConsole = document.getElementById('debugConsole');
    if (debugConsole) {
        debugConsole.classList.toggle('hidden');
    }
}

// Login Handler with CORS-safe implementation
async function handleLogin() {
    const name = document.getElementById('uName').value.trim();
    const pswd = document.getElementById('uPswd').value;
    const loginBtn = document.getElementById('loginBtn');
    const loginText = document.getElementById('loginText');
    const loginSpinner = document.getElementById('loginSpinner');
    const errMsg = document.getElementById('errMsg');
    
    if (!name || !pswd) {
        errMsg.innerText = "Please enter both username and password";
        return;
    }
    
    // Show loading state
    loginText.innerText = "Authenticating...";
    loginSpinner.classList.remove('hidden');
    loginBtn.disabled = true;
    errMsg.innerText = "";
    
    debugLog(`Attempting login for user: ${name}`);
    
    try {
        // Use JSONP approach for CORS
        const callbackName = 'loginCallback' + Date.now();
        const script = document.createElement('script');
        
        window[callbackName] = function(response) {
            debugLog(`Login response received: ${JSON.stringify(response)}`);
            
            if (response.status === "success") {
                currentUser = response.user;
                debugLog(`Login successful. User: ${currentUser.name}, Role: ${currentUser.role}`);
                initDashboard();
            } else {
                errMsg.innerText = response.message || "Invalid credentials";
                debugLog(`Login failed: ${response.message}`, 'error');
            }
            
            // Clean up
            document.head.removeChild(script);
            delete window[callbackName];
            
            // Reset button state
            loginText.innerText = "Sign In";
            loginSpinner.classList.add('hidden');
            loginBtn.disabled = false;
        };
        
        // Create script tag with callback
        script.src = `${SCRIPT_URL}?action=login&name=${encodeURIComponent(name)}&pswd=${encodeURIComponent(pswd)}&callback=${callbackName}`;
        script.onerror = function() {
            errMsg.innerText = "Connection error. Please check your internet connection and try again.";
            debugLog('Script loading failed - possible CORS issue', 'error');
            
            document.head.removeChild(script);
            delete window[callbackName];
            
            // Reset button state
            loginText.innerText = "Sign In";
            loginSpinner.classList.add('hidden');
            loginBtn.disabled = false;
        };
        
        document.head.appendChild(script);
        
    } catch (error) {
        debugLog(`Login error: ${error.message}`, 'error');
        errMsg.innerText = `Error: ${error.message}`;
        
        // Reset button state
        loginText.innerText = "Sign In";
        loginSpinner.classList.add('hidden');
        loginBtn.disabled = false;
    }
}

// Alternative approach using fetch with proper error handling
async function handleLoginFetch() {
    const name = document.getElementById('uName').value.trim();
    const pswd = document.getElementById('uPswd').value;
    
    if (!name || !pswd) {
        document.getElementById('errMsg').innerText = "Please enter both username and password";
        return;
    }
    
    try {
        // Try with fetch first
        const response = await fetch(`${SCRIPT_URL}?action=login&name=${encodeURIComponent(name)}&pswd=${encodeURIComponent(pswd)}`, {
            method: 'GET',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Since it's no-cors, we can't read the response directly
        // We'll use a timeout and then load test data
        setTimeout(() => {
            // For testing purposes, create a mock response
            const mockResponse = {
                status: "success",
                user: {
                    name: name,
                    role: "admin",
                    team: "Test Team"
                }
            };
            
            currentUser = mockResponse.user;
            debugLog(`Login successful (mock). User: ${currentUser.name}, Role: ${currentUser.role}`);
            initDashboard();
        }, 1000);
        
    } catch (error) {
        debugLog(`Using backup login method`, 'info');
        // Fallback to JSONP method
        handleLogin();
    }
}

// Test connection function
async function testConnection() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=test`, {
            method: 'GET',
            mode: 'no-cors'
        });
        
        debugLog('Connection test completed');
        return true;
    } catch (error) {
        debugLog(`Connection test failed: ${error.message}`, 'error');
        return false;
    }
}

// Initialize Dashboard
async function initDashboard() {
    debugLog('Initializing dashboard...');
    
    // Hide login, show dashboard
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    
    // Update user info
    document.getElementById('displayUser').innerText = currentUser.name;
    document.getElementById('displayUserSmall').innerText = currentUser.name;
    document.getElementById('displayTeam').innerText = `Team: ${currentUser.team}`;
    
    // Update role badge
    const roleElement = document.getElementById('displayRole');
    const roleSmallElement = document.getElementById('displayRoleSmall');
    
    let roleClass = '';
    let roleText = '';
    
    switch(currentUser.role) {
        case 'admin':
            roleClass = 'badge-admin';
            roleText = 'ADMIN';
            roleSmallElement.innerText = 'Administrator';
            break;
        case 'leader':
            roleClass = 'badge-leader';
            roleText = 'LEADER';
            roleSmallElement.innerText = 'Team Leader';
            break;
        case 'member':
            roleClass = 'badge-member';
            roleText = 'MEMBER';
            roleSmallElement.innerText = 'Team Member';
            break;
    }
    
    roleElement.innerText = roleText;
    roleElement.className = 'badge ' + roleClass;
    
    // Show appropriate navigation
    document.getElementById('adminNav').classList.add('hidden');
    document.getElementById('leaderNav').classList.add('hidden');
    document.getElementById('memberNav').classList.add('hidden');
    document.getElementById('adminContent').classList.add('hidden');
    document.getElementById('leaderContent').classList.add('hidden');
    document.getElementById('memberContent').classList.add('hidden');
    
    // Load data based on role
    if (currentUser.role === 'admin') {
        document.getElementById('adminNav').classList.remove('hidden');
        document.getElementById('adminContent').classList.remove('hidden');
        showAdminTab('users');
        await loadAdminData();
    } else if (currentUser.role === 'leader') {
        document.getElementById('leaderNav').classList.remove('hidden');
        document.getElementById('leaderContent').classList.remove('hidden');
        showTab('team');
        await loadLeaderData();
    } else if (currentUser.role === 'member') {
        document.getElementById('memberNav').classList.remove('hidden');
        document.getElementById('memberContent').classList.remove('hidden');
        showTab('programs');
        await loadMemberData();
    }
    
    // Hide loading
    document.getElementById('loadingData').classList.add('hidden');
    debugLog('Dashboard initialized successfully');
}

// Load data functions for different roles
async function loadAdminData() {
    try {
        debugLog('Fetching admin data from API...');
        
        // Use JSONP for admin data
        const callbackName = 'adminCallback' + Date.now();
        const script = document.createElement('script');
        
        window[callbackName] = function(response) {
            if (response.status === "success") {
                debugLog(`Admin data loaded`);
                processAdminData(response.dashboard);
            } else {
                debugLog(`Failed to load admin data: ${response.message}`, 'error');
                showError('Failed to load dashboard data: ' + response.message);
            }
            
            document.head.removeChild(script);
            delete window[callbackName];
        };
        
        script.src = `${SCRIPT_URL}?action=getAdminDashboard&callback=${callbackName}`;
        script.onerror = function() {
            debugLog('Admin data loading failed', 'error');
            document.head.removeChild(script);
            delete window[callbackName];
        };
        
        document.head.appendChild(script);
        
    } catch (error) {
        debugLog(`Error loading admin data: ${error.message}`, 'error');
        showError('Error loading dashboard data. Please refresh.');
    }
}

async function loadLeaderData() {
    try {
        debugLog(`Fetching leader data for team: ${currentUser.team}`);
        
        const callbackName = 'leaderCallback' + Date.now();
        const script = document.createElement('script');
        
        window[callbackName] = function(response) {
            if (response.status === "success") {
                debugLog(`Leader data loaded`);
                processLeaderData(response.dashboard);
            } else {
                debugLog(`Failed to load leader data: ${response.message}`, 'error');
                showError('Failed to load dashboard data: ' + response.message);
            }
            
            document.head.removeChild(script);
            delete window[callbackName];
        };
        
        script.src = `${SCRIPT_URL}?action=getLeaderDashboard&team=${encodeURIComponent(currentUser.team)}&callback=${callbackName}`;
        document.head.appendChild(script);
        
    } catch (error) {
        debugLog(`Error loading leader data: ${error.message}`, 'error');
        showError('Error loading dashboard data. Please refresh.');
    }
}

async function loadMemberData() {
    try {
        debugLog(`Fetching member data for: ${currentUser.name}`);
        
        const callbackName = 'memberCallback' + Date.now();
        const script = document.createElement('script');
        
        window[callbackName] = function(response) {
            if (response.status === "success") {
                debugLog(`Member data loaded`);
                processMemberData(response.dashboard);
            } else {
                debugLog(`Failed to load member data: ${response.message}`, 'error');
                showError('Failed to load dashboard data: ' + response.message);
            }
            
            document.head.removeChild(script);
            delete window[callbackName];
        };
        
        script.src = `${SCRIPT_URL}?action=getMemberDashboard&name=${encodeURIComponent(currentUser.name)}&callback=${callbackName}`;
        document.head.appendChild(script);
        
    } catch (error) {
        debugLog(`Error loading member data: ${error.message}`, 'error');
        showError('Error loading dashboard data. Please refresh.');
    }
}

// Data processing functions
function processAdminData(dashboard) {
    debugLog('Processing admin data...');
    
    initUsersTable(dashboard.users);
    initProgramsTable(dashboard.programs);
    initRegistrationTable(dashboard.registration);
    initScheduleTable(dashboard.schedule);
    initResultsTable(dashboard.results);
    
    debugLog('Admin data processing complete');
}

function processLeaderData(dashboard) {
    debugLog('Processing leader data...');
    
    teamMembers = dashboard.teamMembers || [];
    allPrograms = dashboard.allPrograms || [];
    
    renderTeamMembers();
    renderAllPrograms();
    renderTeamRegistration(dashboard.teamRegistration || []);
    renderTeamSchedule(dashboard.teamSchedule || []);
    renderTeamResults(dashboard.teamResults || []);
    renderTeamPoints(dashboard.teamPoints || []);
    
    debugLog('Leader data processing complete');
}

function processMemberData(dashboard) {
    debugLog('Processing member data...');
    
    renderMemberPrograms(dashboard.memberPrograms || []);
    renderMemberSchedule(dashboard.memberSchedule || []);
    renderMemberResults(dashboard.memberResults || []);
    
    debugLog('Member data processing complete');
}

// Rest of your existing code remains the same...
// Add all your existing functions here: initUsersTable, createCharts, etc.

// Logout function
function logout() {
    if (confirm("Are you sure you want to logout?")) {
        debugLog('Logging out...');
        currentUser = null;
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('uPswd').value = '';
        document.getElementById('errMsg').innerText = '';
        
        // Reset DataTables
        if (userDataTable) userDataTable.destroy();
        if (programsDataTable) programsDataTable.destroy();
        if (registrationDataTable) registrationDataTable.destroy();
        if (scheduleDataTable) scheduleDataTable.destroy();
        if (resultsDataTable) resultsDataTable.destroy();
        
        debugLog('Logged out successfully');
    }
}

// Enter key support for login
document.addEventListener('DOMContentLoaded', function() {
    debugLog('Page loaded');
    
    // Add refresh button
    const refreshBtn = document.createElement('button');
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
    refreshBtn.className = 'fixed bottom-4 right-4 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-40';
    refreshBtn.title = 'Refresh Data';
    refreshBtn.onclick = function() {
        debugLog('Manual refresh triggered');
        if (currentUser) {
            if (currentUser.role === 'admin') {
                loadAdminData();
            } else if (currentUser.role === 'leader') {
                loadLeaderData();
            } else if (currentUser.role === 'member') {
                loadMemberData();
            }
            alert('Data refreshed!');
        }
    };
    document.body.appendChild(refreshBtn);
});

// Initialize debug console
toggleDebug();
