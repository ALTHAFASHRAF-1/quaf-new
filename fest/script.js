// Configuration - IMPORTANT: Update this URL with your actual Google Apps Script URL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwFvQZzbaJZKczthsqt0qwYPuIzfliWcf6wKbYZh27VxcrIHjM_wIwuyfMvomAPSQMxqQ/exec";

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

// Cache for data
const dataCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

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
        const testUrl = `${SCRIPT_URL}?action=login&name=test&pswd=test`;
        debugLog(`Testing URL: ${testUrl}`);
        
        // Use a simpler fetch without CORS for testing
        const response = await fetch(testUrl);
        debugLog(`Connection test response status: ${response.status}`);
        return response.status === 200;
    } catch (error) {
        debugLog(`Connection test failed: ${error.message}`, 'error');
        return false;
    }
}

// Login Handler with improved error handling
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
        debugLog(`Calling login API...`);
        
        // Create URL with proper encoding - USE /exec NOT /dev
        const loginUrl = `${SCRIPT_URL}?action=login&name=${encodeURIComponent(name)}&pswd=${encodeURIComponent(pswd)}`;
        debugLog(`Login URL: ${loginUrl}`);
        
        // Use a simple fetch without complex options
        const response = await fetch(loginUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        debugLog(`Login response: ${JSON.stringify(result)}`);
        
        if (result.status === "success") {
            currentUser = result.user;
            debugLog(`Login successful. User: ${currentUser.name}, Role: ${currentUser.role}`);
            await initDashboard();
        } else {
            errMsg.innerText = result.message || "Invalid credentials";
            debugLog(`Login failed: ${result.message}`, 'error');
        }
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            errMsg.innerText = `Connection error. Please check: 
            1. Google Apps Script deployment settings
            2. URL is correct: ${SCRIPT_URL}
            3. Script is deployed as "Web App" with "Anyone, even anonymous" access`;
            debugLog('Network error - Failed to fetch', 'error');
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

// Load Admin Data with single API call
async function loadAdminData() {
    try {
        debugLog('Fetching admin data from API...');
        
        // Single API call for all admin data
        const response = await fetch(`${SCRIPT_URL}?action=getAdminDashboard`);
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

// Load Leader Data with single API call
async function loadLeaderData() {
    try {
        debugLog(`Fetching leader data for team: ${currentUser.team}`);
        
        const response = await fetch(`${SCRIPT_URL}?action=getLeaderDashboard&team=${encodeURIComponent(currentUser.team)}`);
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

// Load Member Data with single API call
async function loadMemberData() {
    try {
        debugLog(`Fetching member data for: ${currentUser.name}`);
        
        const response = await fetch(`${SCRIPT_URL}?action=getMemberDashboard&name=${encodeURIComponent(currentUser.name)}`);
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

// Optimized DataTables initialization
function initUsersTable(users) {
    debugLog(`Initializing users table with ${users.length} records`);
    
    if (userDataTable) {
        userDataTable.destroy();
    }
    
    if (users.length === 0) {
        document.getElementById('usersTable').innerHTML = `
            <tbody>
                <tr>
                    <td colspan="5" class="text-center p-8 text-gray-500">
                        <i class="fas fa-users-slash text-3xl mb-2"></i>
                        <p>No users found</p>
                    </td>
                </tr>
            </tbody>
        `;
        return;
    }
    
    userDataTable = $('#usersTable').DataTable({
        data: users,
        columns: [
            { data: 'sl_no' },
            { data: 'name' },
            { 
                data: 'role',
                render: function(data) {
                    const roleClass = data === 'admin' ? 'badge-admin' : 
                                    data === 'leader' ? 'badge-leader' : 'badge-member';
                    return `<span class="badge ${roleClass}">${data.toUpperCase()}</span>`;
                }
            },
            { data: 'team' },
            {
                data: null,
                render: function(data) {
                    return `
                        <div class="flex gap-2">
                            <button onclick="editUser('${data.sl_no}')" class="text-blue-600 hover:text-blue-800 p-1">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteUser('${data.sl_no}', '${data.name}')" class="text-red-600 hover:text-red-800 p-1">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        pageLength: 10,
        responsive: true,
        deferRender: true,
        processing: true,
        language: {
            search: "Search users:"
        }
    });
}

function initProgramsTable(programs) {
    debugLog(`Initializing programs table with ${programs.length} records`);
    
    if (programsDataTable) {
        programsDataTable.destroy();
    }
    
    if (programs.length === 0) {
        document.getElementById('programsAdminTable').innerHTML = `
            <tbody>
                <tr>
                    <td colspan="4" class="text-center p-8 text-gray-500">
                        <i class="fas fa-list-alt text-3xl mb-2"></i>
                        <p>No programs found</p>
                    </td>
                </tr>
            </tbody>
        `;
        return;
    }
    
    programsDataTable = $('#programsAdminTable').DataTable({
        data: programs,
        columns: [
            { data: 'code' },
            { data: 'name' },
            { 
                data: 'category',
                render: function(data) {
                    return `<span class="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">${data}</span>`;
                }
            },
            {
                data: null,
                render: function(data) {
                    return `
                        <div class="flex gap-2">
                            <button onclick="editProgram('${data.code}')" class="text-blue-600 hover:text-blue-800 p-1">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteProgram('${data.code}', '${data.name}')" class="text-red-600 hover:text-red-800 p-1">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        pageLength: 10,
        responsive: true,
        deferRender: true
    });
}

function initRegistrationTable(registration) {
    debugLog(`Initializing registration table with ${registration.length} records`);
    
    if (registrationDataTable) {
        registrationDataTable.destroy();
    }
    
    if (registration.length === 0) {
        document.getElementById('registrationAdminTable').innerHTML = `
            <tbody>
                <tr>
                    <td colspan="7" class="text-center p-8 text-gray-500">
                        <i class="fas fa-clipboard-list text-3xl mb-2"></i>
                        <p>No registrations found</p>
                    </td>
                </tr>
            </tbody>
        `;
        return;
    }
    
    registrationDataTable = $('#registrationAdminTable').DataTable({
        data: registration,
        columns: [
            { data: 'code' },
            { data: 'program_name' },
            { data: 'category' },
            { data: 'sl_no' },
            { data: 'name' },
            { data: 'team' },
            {
                data: null,
                render: function(data) {
                    return `
                        <div class="flex gap-2">
                            <button onclick="editRegistration('${data.id}')" class="text-blue-600 hover:text-blue-800 p-1">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteRegistration('${data.id}', '${data.name}')" class="text-red-600 hover:text-red-800 p-1">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        pageLength: 10,
        responsive: true,
        deferRender: true
    });
}

function initScheduleTable(schedule) {
    debugLog(`Initializing schedule table with ${schedule.length} records`);
    
    if (scheduleDataTable) {
        scheduleDataTable.destroy();
    }
    
    if (schedule.length === 0) {
        document.getElementById('scheduleAdminTable').innerHTML = `
            <tbody>
                <tr>
                    <td colspan="10" class="text-center p-8 text-gray-500">
                        <i class="fas fa-calendar-alt text-3xl mb-2"></i>
                        <p>No schedule found</p>
                    </td>
                </tr>
            </tbody>
        `;
        return;
    }
    
    scheduleDataTable = $('#scheduleAdminTable').DataTable({
        data: schedule,
        columns: [
            { data: 'code' },
            { data: 'program_name' },
            { data: 'category' },
            { data: 'sl_no' },
            { data: 'name' },
            { data: 'team' },
            { data: 'date' },
            { data: 'time' },
            { data: 'venue' },
            {
                data: null,
                render: function(data) {
                    return `
                        <div class="flex gap-2">
                            <button onclick="editSchedule('${data.id}')" class="text-blue-600 hover:text-blue-800 p-1">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteSchedule('${data.id}', '${data.name}')" class="text-red-600 hover:text-red-800 p-1">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        pageLength: 10,
        responsive: true,
        deferRender: true
    });
}

function initResultsTable(results) {
    debugLog(`Initializing results table with ${results.length} records`);
    
    if (resultsDataTable) {
        resultsDataTable.destroy();
    }
    
    if (results.length === 0) {
        document.getElementById('resultsAdminTable').innerHTML = `
            <tbody>
                <tr>
                    <td colspan="10" class="text-center p-8 text-gray-500">
                        <i class="fas fa-trophy text-3xl mb-2"></i>
                        <p>No results found</p>
                    </td>
                </tr>
            </tbody>
        `;
        return;
    }
    
    resultsDataTable = $('#resultsAdminTable').DataTable({
        data: results,
        columns: [
            { data: 'code' },
            { data: 'program_name' },
            { data: 'category' },
            { data: 'sl_no' },
            { data: 'name' },
            { data: 'team' },
            { 
                data: 'position',
                render: function(data) {
                    const color = data === '1st' ? 'text-yellow-600' : 
                                data === '2nd' ? 'text-gray-600' : 
                                data === '3rd' ? 'text-orange-600' : 'text-gray-800';
                    return `<span class="font-bold ${color}">${data}</span>`;
                }
            },
            { data: 'grade' },
            { 
                data: 'points',
                render: function(data) {
                    return `<span class="font-bold text-green-600">${data}</span>`;
                }
            },
            {
                data: null,
                render: function(data) {
                    return `
                        <div class="flex gap-2">
                            <button onclick="editResult('${data.id}')" class="text-blue-600 hover:text-blue-800 p-1">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteResult('${data.id}', '${data.name}')" class="text-red-600 hover:text-red-800 p-1">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        pageLength: 10,
        responsive: true,
        deferRender: true
    });
}

// Render functions for Leader
function renderTeamMembers() {
    const tableBody = document.getElementById('teamTableBody');
    tableBody.innerHTML = '';
    
    if (teamMembers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center p-8 text-gray-500">
                    <i class="fas fa-users-slash text-3xl mb-2"></i>
                    <p>No team members found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    teamMembers.forEach(member => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="p-3">${member.sl_no}</td>
            <td class="p-3 font-medium text-gray-800">${member.name}</td>
            <td class="p-3">
                <span class="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm">
                    ${member.role}
                </span>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function renderAllPrograms() {
    const tableBody = document.getElementById('programsLeaderTableBody');
    tableBody.innerHTML = '';
    
    if (allPrograms.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center p-8 text-gray-500">
                    <i class="fas fa-list-alt text-3xl mb-2"></i>
                    <p>No programs found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    allPrograms.forEach(program => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="p-3 font-mono text-gray-700">${program.code}</td>
            <td class="p-3 font-medium text-gray-800">${program.name}</td>
            <td class="p-3">
                <span class="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                    ${program.category}
                </span>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function renderTeamRegistration(registration) {
    const tableBody = document.getElementById('registrationLeaderTableBody');
    tableBody.innerHTML = '';
    
    if (registration.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center p-8 text-gray-500">
                    <i class="fas fa-clipboard-list text-3xl mb-2"></i>
                    <p>No registrations found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    registration.forEach(reg => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="p-3 font-mono text-gray-700">${reg.code}</td>
            <td class="p-3 font-medium text-gray-800">${reg.program_name}</td>
            <td class="p-3">
                <span class="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm">
                    ${reg.category}
                </span>
            </td>
            <td class="p-3">${reg.sl_no}</td>
            <td class="p-3">${reg.name}</td>
            <td class="p-3">
                <span class="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm">
                    ${reg.team}
                </span>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function renderTeamSchedule(schedule) {
    const tableBody = document.getElementById('scheduleLeaderTableBody');
    tableBody.innerHTML = '';
    
    if (schedule.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center p-8 text-gray-500">
                    <i class="fas fa-calendar-alt text-3xl mb-2"></i>
                    <p>No schedule found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    schedule.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="p-3 font-mono text-gray-700">${item.code}</td>
            <td class="p-3 font-medium text-gray-800">${item.program_name}</td>
            <td class="p-3">
                <span class="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm">
                    ${item.category}
                </span>
            </td>
            <td class="p-3">${item.name}</td>
            <td class="p-3">${item.date}</td>
            <td class="p-3">${item.time}</td>
            <td class="p-3">${item.venue}</td>
        `;
        tableBody.appendChild(row);
    });
}

function renderTeamResults(results) {
    const tableBody = document.getElementById('resultsLeaderTableBody');
    tableBody.innerHTML = '';
    
    if (results.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center p-8 text-gray-500">
                    <i class="fas fa-trophy text-3xl mb-2"></i>
                    <p>No results found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    results.forEach(result => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="p-3 font-mono text-gray-700">${result.code}</td>
            <td class="p-3 font-medium text-gray-800">${result.program_name}</td>
            <td class="p-3">
                <span class="px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm">
                    ${result.category}
                </span>
            </td>
            <td class="p-3">${result.name}</td>
            <td class="p-3 font-bold">${result.position}</td>
            <td class="p-3">${result.grade}</td>
            <td class="p-3 font-bold text-green-600">${result.points}</td>
        `;
        tableBody.appendChild(row);
    });
}

function renderTeamPoints(teamPoints) {
    const container = document.getElementById('teamPointsContainer');
    container.innerHTML = '';
    
    if (teamPoints.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center p-8 text-gray-500">
                <i class="fas fa-chart-bar text-3xl mb-2"></i>
                <p>No team points data available</p>
            </div>
        `;
        return;
    }
    
    teamPoints.forEach(team => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow p-4';
        card.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <h5 class="font-bold text-gray-800">${team.team}</h5>
                <span class="text-sm px-2 py-1 rounded-full ${team.team === currentUser.team ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                    ${team.team === currentUser.team ? 'Your Team' : ''}
                </span>
            </div>
            <div class="text-3xl font-bold text-green-600">${team.total_points}</div>
            <div class="text-sm text-gray-500 mt-1">Total Points</div>
        `;
        container.appendChild(card);
    });
}

// Render functions for Member
function renderMemberPrograms(programs) {
    const tableBody = document.getElementById('programsMemberTableBody');
    tableBody.innerHTML = '';
    
    if (programs.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center p-8 text-gray-500">
                    <i class="fas fa-list-alt text-3xl mb-2"></i>
                    <p>No programs found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    programs.forEach(program => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="p-3 font-mono text-gray-700">${program.code}</td>
            <td class="p-3 font-medium text-gray-800">${program.name}</td>
            <td class="p-3">
                <span class="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                    ${program.category}
                </span>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function renderMemberSchedule(schedule) {
    const tableBody = document.getElementById('scheduleMemberTableBody');
    tableBody.innerHTML = '';
    
    if (schedule.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center p-8 text-gray-500">
                    <i class="fas fa-calendar-alt text-3xl mb-2"></i>
                    <p>No schedule found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    schedule.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="p-3 font-medium text-gray-800">${item.program_name}</td>
            <td class="p-3">
                <span class="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm">
                    ${item.category}
                </span>
            </td>
            <td class="p-3">${item.date}</td>
            <td class="p-3">${item.time}</td>
            <td class="p-3">${item.venue}</td>
        `;
        tableBody.appendChild(row);
    });
}

function renderMemberResults(results) {
    const tableBody = document.getElementById('resultsMemberTableBody');
    tableBody.innerHTML = '';
    
    if (results.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center p-8 text-gray-500">
                    <i class="fas fa-trophy text-3xl mb-2"></i>
                    <p>No results found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    results.forEach(result => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="p-3 font-medium text-gray-800">${result.program_name}</td>
            <td class="p-3">
                <span class="px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm">
                    ${result.category}
                </span>
            </td>
            <td class="p-3 font-bold">${result.position}</td>
            <td class="p-3">${result.grade}</td>
            <td class="p-3 font-bold text-green-600">${result.points}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Modal Functions
function showAddUserModal() {
    document.getElementById('addUserModal').style.display = 'block';
}

function showAddProgramModal() {
    document.getElementById('addProgramModal').style.display = 'block';
}

function showAddRegistrationModal() {
    document.getElementById('addRegistrationModal').style.display = 'block';
}

function showAddScheduleModal() {
    document.getElementById('addScheduleModal').style.display = 'block';
}

function showAddResultModal() {
    document.getElementById('addResultModal').style.display = 'block';
}

function showLeaderRegistrationModal() {
    const memberSelect = document.getElementById('leaderMemberSelect');
    const programSelect = document.getElementById('leaderProgramSelect');
    
    // Clear and populate member select
    memberSelect.innerHTML = '<option value="">Select Member</option>';
    teamMembers.forEach(member => {
        if (member.role === 'member') {
            const option = document.createElement('option');
            option.value = member.name;
            option.textContent = member.name;
            memberSelect.appendChild(option);
        }
    });
    
    // Clear and populate program select
    programSelect.innerHTML = '<option value="">Select Program</option>';
    allPrograms.forEach(program => {
        const option = document.createElement('option');
        option.value = program.name;
        option.textContent = `${program.name} (${program.category})`;
        option.setAttribute('data-code', program.code);
        option.setAttribute('data-category', program.category);
        programSelect.appendChild(option);
    });
    
    document.getElementById('leaderRegistrationModal').style.display = 'block';
}

function autoFillProgramDetails() {
    const programSelect = document.getElementById('leaderProgramSelect');
    const selectedOption = programSelect.options[programSelect.selectedIndex];
    
    if (selectedOption.value) {
        document.getElementById('autoProgramCode').value = selectedOption.getAttribute('data-code');
        document.getElementById('autoProgramCategory').value = selectedOption.getAttribute('data-category');
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Save Functions with improved error handling
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
        const response = await fetch(`${SCRIPT_URL}?action=addUser`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        
        const result = await response.json();
        debugLog(`Save user response: ${JSON.stringify(result)}`);
        
        if (result.status === "success") {
            alert('User added successfully!');
            closeModal('addUserModal');
            if (currentUser.role === 'admin') {
                loadAdminData();
            }
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        debugLog(`Error saving user: ${error.message}`, 'error');
        alert('Error saving user. Please try again.');
    }
}

// Clear cache function
function clearCache() {
    dataCache.clear();
    debugLog('Cache cleared');
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
        clearCache();
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

// Add refresh button functionality
document.addEventListener('DOMContentLoaded', function() {
    debugLog('Page loaded');
    
    // Add refresh button
    const refreshBtn = document.createElement('button');
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
    refreshBtn.className = 'fixed bottom-4 right-4 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-40';
    refreshBtn.title = 'Refresh Data';
    refreshBtn.onclick = function() {
        debugLog('Manual refresh triggered');
        clearCache();
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
