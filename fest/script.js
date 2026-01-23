// Configuration - UPDATE THIS URL with your actual Google Apps Script URL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzZJjCp7yNHJscAyKVuwXs19S_Qn3GIkYI-ViC5AO4ryRCxzr0bsduCJHjTGRYCWNVt7g/exec"; // Replace with your actual deployed URL

// Global variables
let currentUser = null;
let userDataTable = null;
let programsDataTable = null;
let registrationDataTable = null;
let scheduleDataTable = null;
let resultsDataTable = null;
let allPrograms = [];
let teamMembers = [];
let currentEditType = null;
let currentEditId = null;

// Debug logging function
function debugLog(message, type = 'info') {
    const debugLog = document.getElementById('debugLog');
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
    debugConsole.classList.toggle('hidden');
}

// Test Google Apps Script connection
async function testConnection() {
    try {
        debugLog('Testing connection to Google Apps Script...');
        const testUrl = `${SCRIPT_URL}?action=test&timestamp=${Date.now()}`;
        
        const response = await fetch(testUrl, {
            method: 'GET',
            mode: 'no-cors' // Important for testing
        });
        
        debugLog(`Connection test completed`);
        return true;
    } catch (error) {
        debugLog(`Connection test failed: ${error.message}`, 'error');
        return false;
    }
}

// Enhanced fetch function with error handling
async function safeFetch(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            mode: 'cors',
            cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// Login Handler
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
        // Test connection first
        const isConnected = await testConnection();
        if (!isConnected) {
            throw new Error('Cannot connect to server. Please check your internet connection.');
        }
        
        debugLog('Connection test passed, attempting login...');
        
        // Create login URL - using GET method (simpler for GAS)
        const loginUrl = `${SCRIPT_URL}?action=login&name=${encodeURIComponent(name)}&pswd=${encodeURIComponent(pswd)}&timestamp=${Date.now()}`;
        debugLog(`Login URL: ${loginUrl.substring(0, 100)}...`);
        
        const response = await safeFetch(loginUrl);
        const result = await response.json();
        
        debugLog(`Login response received: ${JSON.stringify(result)}`);
        
        if (result.status === "success") {
            currentUser = result.user;
            debugLog(`Login successful. User: ${currentUser.name}, Role: ${currentUser.role}`);
            await initDashboard();
        } else {
            errMsg.innerText = result.message || "Invalid credentials";
            debugLog(`Login failed: ${result.message}`, 'error');
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            errMsg.innerText = "Request timeout. Please try again.";
            debugLog('Request timeout', 'error');
        } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            errMsg.innerHTML = `
                <div class="text-left">
                    <p class="font-semibold mb-2">Connection Error:</p>
                    <ol class="list-decimal list-inside text-sm space-y-1">
                        <li>Make sure your Google Apps Script is deployed as "Web App"</li>
                        <li>Set deployment permissions to "Anyone" (or "Anyone with Google account")</li>
                        <li>Copy the correct deployment URL ending with /exec</li>
                        <li>Current URL: ${SCRIPT_URL}</li>
                    </ol>
                </div>
            `;
            debugLog('Network error - Failed to fetch. Check GAS deployment.', 'error');
        } else {
            errMsg.innerText = `Error: ${error.message}`;
            debugLog(`Login error: ${error.message}`, 'error');
        }
        console.error('Login error details:', error);
    } finally {
        // Reset button state
        loginText.innerText = "Sign In";
        loginSpinner.classList.add('hidden');
        loginBtn.disabled = false;
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
    try {
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
    } catch (error) {
        debugLog(`Error loading dashboard data: ${error.message}`, 'error');
        alert('Error loading dashboard data. Please refresh the page.');
    }
    
    // Hide loading
    document.getElementById('loadingData').classList.add('hidden');
    debugLog('Dashboard initialized successfully');
}

// Toggle sidebar for mobile
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Admin Tab Navigation
function showAdminTab(tabName) {
    debugLog(`Showing admin tab: ${tabName}`);
    
    // Update page title
    const titles = {
        'users': 'Users Management',
        'programs': 'Programs Management',
        'registration': 'Registration Management',
        'schedule': 'Schedule Management',
        'results': 'Results Management'
    };
    document.getElementById('currentPage').innerText = titles[tabName] || 'Dashboard';
    
    // Hide all admin content
    ['usersContent', 'programsAdminContent', 'registrationAdminContent', 'scheduleAdminContent', 'resultsAdminContent'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    
    // Show selected content
    document.getElementById(`${tabName}Content`).classList.remove('hidden');
    
    // Update active nav link
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('bg-purple-50', 'text-purple-700');
    });
    event.target.classList.add('bg-purple-50', 'text-purple-700');
}

// Leader/Member Tab Navigation
function showTab(tabName) {
    debugLog(`Showing tab: ${tabName} for ${currentUser.role}`);
    
    // Update page title
    const titles = {
        'team': 'Team Members',
        'programs': 'Programs',
        'registration': 'Registration',
        'schedule': 'Schedule',
        'results': 'Results'
    };
    document.getElementById('currentPage').innerText = titles[tabName] || 'Dashboard';
    
    if (currentUser.role === 'leader') {
        // Hide all leader content
        ['teamContent', 'programsLeaderContent', 'registrationLeaderContent', 'scheduleLeaderContent', 'resultsLeaderContent'].forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });
        
        // Show selected content
        document.getElementById(`${tabName}LeaderContent`).classList.remove('hidden');
    } else if (currentUser.role === 'member') {
        // Hide all member content
        ['programsMemberContent', 'scheduleMemberContent', 'resultsMemberContent'].forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });
        
        // Show selected content
        document.getElementById(`${tabName}MemberContent`).classList.remove('hidden');
    }
    
    // Update active nav link
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-purple-50', 'text-purple-700');
    });
    event.target.classList.add('bg-purple-50', 'text-purple-700');
}

// Load Admin Data
async function loadAdminData() {
    try {
        debugLog('Fetching admin data from API...');
        
        const response = await safeFetch(`${SCRIPT_URL}?action=getAdminDashboard&timestamp=${Date.now()}`);
        const result = await response.json();
        
        debugLog(`Admin data response status: ${result.status}`);
        
        if (result.status === "success") {
            debugLog(`Admin data loaded: Users: ${result.dashboard.users.length}, Programs: ${result.dashboard.programs.length}`);
            processAdminData(result.dashboard);
        } else {
            debugLog(`Failed to load admin data: ${result.message}`, 'error');
            showError('Failed to load dashboard data: ' + result.message);
        }
    } catch (error) {
        debugLog(`Error loading admin data: ${error.message}`, 'error');
        showError('Error loading dashboard data. Please refresh.');
    }
}

function processAdminData(dashboard) {
    debugLog('Processing admin data...');
    
    // Initialize all tables
    initUsersTable(dashboard.users);
    initProgramsTable(dashboard.programs);
    initRegistrationTable(dashboard.registration);
    initScheduleTable(dashboard.schedule);
    initResultsTable(dashboard.results);
    
    debugLog('Admin data processing complete');
}

// Load Leader Data
async function loadLeaderData() {
    try {
        debugLog(`Fetching leader data for team: ${currentUser.team}`);
        
        const response = await safeFetch(`${SCRIPT_URL}?action=getLeaderDashboard&team=${encodeURIComponent(currentUser.team)}&timestamp=${Date.now()}`);
        const result = await response.json();
        
        debugLog(`Leader data response status: ${result.status}`);
        
        if (result.status === "success") {
            debugLog(`Leader data loaded: Team members: ${result.dashboard.teamMembers.length}, Programs: ${result.dashboard.allPrograms.length}`);
            processLeaderData(result.dashboard);
        } else {
            debugLog(`Failed to load leader data: ${result.message}`, 'error');
            showError('Failed to load dashboard data: ' + result.message);
        }
    } catch (error) {
        debugLog(`Error loading leader data: ${error.message}`, 'error');
        showError('Error loading dashboard data. Please refresh.');
    }
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

// Load Member Data
async function loadMemberData() {
    try {
        debugLog(`Fetching member data for: ${currentUser.name}`);
        
        const response = await safeFetch(`${SCRIPT_URL}?action=getMemberDashboard&name=${encodeURIComponent(currentUser.name)}&timestamp=${Date.now()}`);
        const result = await response.json();
        
        debugLog(`Member data response status: ${result.status}`);
        
        if (result.status === "success") {
            debugLog(`Member data loaded: Programs: ${result.dashboard.memberPrograms.length}`);
            processMemberData(result.dashboard);
        } else {
            debugLog(`Failed to load member data: ${result.message}`, 'error');
            showError('Failed to load dashboard data: ' + result.message);
        }
    } catch (error) {
        debugLog(`Error loading member data: ${error.message}`, 'error');
        showError('Error loading dashboard data. Please refresh.');
    }
}

function processMemberData(dashboard) {
    debugLog('Processing member data...');
    
    renderMemberPrograms(dashboard.memberPrograms || []);
    renderMemberSchedule(dashboard.memberSchedule || []);
    renderMemberResults(dashboard.memberResults || []);
    
    debugLog('Member data processing complete');
}

// DataTables initialization functions (keep your existing functions for initUsersTable, initProgramsTable, etc.)
// ... [Keep all your existing DataTables initialization functions as they are] ...

// Render functions for Leader (keep your existing render functions)
// ... [Keep all your existing render functions as they are] ...

// Modal Functions (keep your existing modal functions)
// ... [Keep all your existing modal functions as they are] ...

// Save Functions
async function saveUser() {
    const userData = {
        sl_no: document.getElementById('userSlNo').value,
        name: document.getElementById('userName').value,
        role: document.getElementById('userRole').value,
        password: document.getElementById('userPassword').value,
        team: document.getElementById('userTeam').value
    };
    
    if (!userData.sl_no || !userData.name || !userData.role || !userData.password) {
        alert('Please fill in all required fields');
        return;
    }
    
    debugLog(`Saving user: ${userData.name}`);
    
    try {
        // Using GET for GAS compatibility
        const url = `${SCRIPT_URL}?action=addUser&sl_no=${encodeURIComponent(userData.sl_no)}&name=${encodeURIComponent(userData.name)}&role=${encodeURIComponent(userData.role)}&password=${encodeURIComponent(userData.password)}&team=${encodeURIComponent(userData.team)}`;
        
        const response = await safeFetch(url);
        const result = await response.json();
        
        debugLog(`Save user response: ${JSON.stringify(result)}`);
        
        if (result.status === "success") {
            alert('User added successfully!');
            closeModal('addUserModal');
            if (currentUser.role === 'admin') {
                await loadAdminData();
            }
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        debugLog(`Error saving user: ${error.message}`, 'error');
        alert('Error saving user. Please try again.');
    }
}

// Show error function
function showError(message) {
    alert(message);
    debugLog(`Error: ${message}`, 'error');
}

// Logout
function logout() {
    if (confirm("Are you sure you want to logout?")) {
        debugLog('Logging out...');
        currentUser = null;
        
        // Destroy DataTables if they exist
        if (userDataTable) {
            userDataTable.destroy();
            userDataTable = null;
        }
        if (programsDataTable) {
            programsDataTable.destroy();
            programsDataTable = null;
        }
        if (registrationDataTable) {
            registrationDataTable.destroy();
            registrationDataTable = null;
        }
        if (scheduleDataTable) {
            scheduleDataTable.destroy();
            scheduleDataTable = null;
        }
        if (resultsDataTable) {
            resultsDataTable.destroy();
            resultsDataTable = null;
        }
        
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('uPswd').value = '';
        document.getElementById('errMsg').innerText = '';
        
        debugLog('Logged out successfully');
    }
}

// Enter key support for login
document.getElementById('uPswd').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handleLogin();
    }
});

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    debugLog('Page loaded');
    
    // Test connection on load
    testConnection();
    
    // Add refresh button
    const refreshBtn = document.createElement('button');
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
    refreshBtn.className = 'fixed bottom-4 right-4 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-40';
    refreshBtn.title = 'Refresh Data';
    refreshBtn.onclick = async function() {
        debugLog('Manual refresh triggered');
        if (currentUser) {
            try {
                if (currentUser.role === 'admin') {
                    await loadAdminData();
                } else if (currentUser.role === 'leader') {
                    await loadLeaderData();
                } else if (currentUser.role === 'member') {
                    await loadMemberData();
                }
                alert('Data refreshed!');
            } catch (error) {
                debugLog(`Refresh error: ${error.message}`, 'error');
                alert('Error refreshing data.');
            }
        }
    };
    document.body.appendChild(refreshBtn);
});
