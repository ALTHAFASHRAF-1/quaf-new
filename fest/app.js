// 🌐 Global Variables
let currentUser = null;
let currentPage = 'dashboard';
let currentTeamTab = 1;
let currentResultType = 's';

// =============================
// 📊 Google Sheets Integration
// =============================
class GoogleSheetsAPI {
    constructor() {
        this.apiUrl = "https://script.google.com/macros/s/AKfycbwyerg1L23RcYcAsO49cKj-k7OOB1nSYTFktnFqLZyzW02lGoMrQMv6YqVFIUiuhQmgbg/exec";
        this.cache = new Map();
        this.cacheTimeout = 30 * 1000;
    }

    async getSheet(sheetName, useCache = true) {
        const cacheKey = sheetName;
        const now = Date.now();
        
        if (useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (now - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const url = `${this.apiUrl}?sheet=${encodeURIComponent(sheetName)}&t=${now}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            if (useCache) {
                this.cache.set(cacheKey, { data, timestamp: now });
            }
            
            return data;
        } catch (error) {
            console.error(`Error fetching ${sheetName}:`, error);
            return { error: error.message };
        }
    }

    async addRow(sheetName, row) {
        try {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    sheet: sheetName,
                    data: JSON.stringify(row)
                })
            });
            
            const result = await response.json();
            
            // Clear cache for this sheet
            this.cache.delete(sheetName);
            
            return result;
        } catch (error) {
            return { error: error.message };
        }
    }

    async updatePassword(username, newPassword) {
        try {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    sheet: "password_updates",
                    data: JSON.stringify([username, newPassword])
                })
            });
            
            const result = await response.json();
            
            // Clear user credentials cache
            this.cache.delete("user_credentials");
            
            return result;
        } catch (error) {
            return { error: error.message };
        }
    }

    async initializeSheets() {
        try {
            const response = await fetch(`${this.apiUrl}?action=initialize`, {
                method: 'POST'
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            return { error: error.message };
        }
    }

    clearCache() {
        this.cache.clear();
    }
}

const api = new GoogleSheetsAPI();

// =============================
// 🔑 Authentication
// =============================
async function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        showLoginError('Please enter both admission number and password');
        return;
    }

    const loginBtn = document.querySelector('#loginForm button[type="submit"]');
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing In...';
    loginBtn.disabled = true;

    try {
        const users = await api.getSheet("user_credentials", false);
        
        if (!users || users.error || !Array.isArray(users)) {
            showLoginError('Failed to fetch user data');
            return;
        }
        
        // Find user by admission number (case-insensitive)
        const user = users.find(u => 
            String(u.ad_no).toLowerCase() === username.toLowerCase() && 
            u.pswd === password
        );

        if (user) {
            currentUser = {
                ad_no: user.ad_no,
                name: user.name,
                role: user.role.toLowerCase(),
                team: user.team,
                sl_no: user.sl_no
            };

            // Show dashboard
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('dashboardContainer').classList.remove('hidden');
            
            // Update UI based on role
            updateUIForRole();
            
            // Load dashboard data
            await loadDashboard();
            
            showLoginError('');
        } else {
            showLoginError('Invalid admission number or password');
        }
    } catch (error) {
        showLoginError('Network error: ' + error.message);
    } finally {
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    }
}

function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    if (message) {
        errorDiv.classList.remove('hidden');
    } else {
        errorDiv.classList.add('hidden');
    }
}

function logout() {
    currentUser = null;
    api.clearCache();
    
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('dashboardContainer').classList.add('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    showLoginError('');
}

// =============================
// 🎭 Update UI Based on Role
// =============================
function updateUIForRole() {
    if (!currentUser) return;

    const welcomeUser = document.getElementById('welcomeUser');
    const profileName = document.getElementById('profileName');
    const profileUsername = document.getElementById('profileUsername');
    const profileRole = document.getElementById('profileRole');
    const profileTeam = document.getElementById('profileTeam');
    const leaderNav = document.getElementById('leaderNav');
    const adminNav = document.getElementById('adminNav');
    const leaderDashboardCards = document.getElementById('leaderDashboardCards');
    const adminDashboardCards = document.getElementById('adminDashboardCards');

    // Update welcome message
    const roleDisplay = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    welcomeUser.textContent = `Welcome, ${currentUser.name} (${roleDisplay})`;
    
    // Update profile info
    profileName.textContent = currentUser.name;
    profileUsername.textContent = `@${currentUser.ad_no}`;
    profileRole.textContent = roleDisplay;
    profileTeam.textContent = `Team ${currentUser.team}`;
    
    // Add role class to role badge
    profileRole.className = 'text-xs px-2 py-1 bg-white/20 rounded-full ' + 
        (currentUser.role === 'admin' ? 'role-admin' : 
         currentUser.role === 'leader' ? 'role-leader' : 
         currentUser.role === 'assistant' ? 'role-assistant' : 'role-member');
    
    // Add team class to team badge
    profileTeam.className = 'text-xs px-2 py-1 bg-white/20 rounded-full ml-1 team-' + currentUser.team;
    
    // Show/hide navigation based on role
    if (currentUser.role === 'admin') {
        adminNav.classList.remove('hidden');
        leaderNav.classList.add('hidden');
        adminDashboardCards.classList.remove('hidden');
        leaderDashboardCards.classList.add('hidden');
    } else if (currentUser.role === 'leader' || currentUser.role === 'assistant') {
        leaderNav.classList.remove('hidden');
        adminNav.classList.add('hidden');
        leaderDashboardCards.classList.remove('hidden');
        adminDashboardCards.classList.add('hidden');
    } else {
        leaderNav.classList.add('hidden');
        adminNav.classList.add('hidden');
        leaderDashboardCards.classList.add('hidden');
        adminDashboardCards.classList.add('hidden');
    }
}

// =============================
// 📍 Navigation
// =============================
async function showPage(page) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    
    // Show selected page
    const pageElement = document.getElementById(page + 'Page');
    if (pageElement) {
        pageElement.classList.remove('hidden');
    }
    
    currentPage = page;
    
    // Load page-specific data
    switch (page) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'schedule':
            await loadSchedule();
            break;
        case 'programs':
            await loadMyPrograms();
            break;
        case 'results':
            await loadMyResults();
            break;
        case 'teamMembers':
            await loadTeamMembers();
            break;
        case 'assignPrograms':
            await loadAssignPrograms();
            break;
        case 'allTeams':
            await loadAllTeams();
            break;
        case 'programCount':
            await loadProgramCount();
            break;
        case 'manageResults':
            await loadManageResults();
            break;
        case 'adminSchedule':
            await loadAdminSchedule();
            break;
    }
}

// =============================
// 🏠 Dashboard Functions
// =============================
async function loadDashboard() {
    if (!currentUser) return;

    try {
        const dashboardInfo = document.getElementById('dashboardInfo');
        const totalPrograms = document.getElementById('totalPrograms');
        const completedPrograms = document.getElementById('completedPrograms');
        const totalPoints = document.getElementById('totalPoints');
        const teamRank = document.getElementById('teamRank');
        const upcomingPrograms = document.getElementById('upcomingPrograms');

        // Update dashboard info
        dashboardInfo.textContent = `You are ${currentUser.role} of Team ${currentUser.team}`;

        // Load user's programs
        const registrationSheet = `registration_team_${currentUser.team}`;
        const registrations = await api.getSheet(registrationSheet);
        
        // Load all results to calculate points
        const resultSheets = ['s_result', 'ns_result', 'sp_result', 'gs_result', 'gns_result', 'gsp_result'];
        const allResults = await Promise.all(resultSheets.map(sheet => api.getSheet(sheet)));
        
        // Calculate stats
        let userPrograms = [];
        let userPoints = 0;
        
        if (Array.isArray(registrations)) {
            userPrograms = registrations.filter(reg => 
                reg.sl_no === currentUser.sl_no || reg.name === currentUser.name
            );
            
            // Calculate points from results
            allResults.forEach(results => {
                if (Array.isArray(results)) {
                    const userResults = results.filter(result => 
                        result.sl_no === currentUser.sl_no || result.name === currentUser.name
                    );
                    userResults.forEach(result => {
                        userPoints += parseInt(result.points || 0);
                    });
                }
            });
        }
        
        totalPrograms.textContent = userPrograms.length;
        completedPrograms.textContent = '0'; // You can implement completion logic
        totalPoints.textContent = userPoints;
        teamRank.textContent = '-'; // You can implement ranking logic
        
        // Load upcoming programs from schedule
        await loadUpcomingPrograms();

    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadUpcomingPrograms() {
    try {
        const schedule = await api.getSheet('schedule');
        const upcomingPrograms = document.getElementById('upcomingPrograms');
        
        if (!Array.isArray(schedule) || schedule.length === 0) {
            upcomingPrograms.innerHTML = '<p class="text-gray-500 text-center py-4">No upcoming programs</p>';
            return;
        }
        
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filter upcoming programs (next 7 days)
        const upcoming = schedule.filter(item => {
            const itemDate = new Date(item.date);
            itemDate.setHours(0, 0, 0, 0);
            const diffTime = itemDate - today;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            return diffDays >= 0 && diffDays <= 7;
        }).slice(0, 5); // Show only next 5
        
        if (upcoming.length === 0) {
            upcomingPrograms.innerHTML = '<p class="text-gray-500 text-center py-4">No upcoming programs in next 7 days</p>';
            return;
        }
        
        let html = '';
        upcoming.forEach(item => {
            const itemDate = new Date(item.date);
            const dayName = itemDate.toLocaleDateString('en-US', { weekday: 'short' });
            const formattedDate = itemDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
            
            html += `
                <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="program-code">${item.program_code}</span>
                            <span class="text-xs text-gray-500 ml-2">${getProgramType(item.program_code)}</span>
                        </div>
                        <div class="text-right">
                            <div class="text-sm font-medium">${item.time}</div>
                            <div class="text-xs text-gray-500">${dayName}, ${formattedDate}</div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        upcomingPrograms.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading upcoming programs:', error);
    }
}

function getProgramType(programCode) {
    if (programCode.startsWith('s')) return 'Stage';
    if (programCode.startsWith('ns')) return 'Non-Stage';
    if (programCode.startsWith('sp')) return 'Sports';
    if (programCode.startsWith('gs')) return 'Group Stage';
    if (programCode.startsWith('gns')) return 'Group Non-Stage';
    if (programCode.startsWith('gsp')) return 'Group Sports';
    return 'General';
}

// =============================
// 📅 Schedule Functions
// =============================
async function loadSchedule() {
    try {
        const schedule = await api.getSheet('schedule');
        const tableBody = document.getElementById('scheduleTableBody');
        
        if (!Array.isArray(schedule) || schedule.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-8 text-gray-500">
                        No schedule available
                    </td>
                </tr>
            `;
            return;
        }
        
        // Load all registrations to count candidates
        const registrations = await Promise.all([
            api.getSheet('registration_team_1'),
            api.getSheet('registration_team_2'),
            api.getSheet('registration_team_3')
        ]);
        
        let html = '';
        schedule.forEach(item => {
            const date = new Date(item.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            const formattedDate = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            // Count candidates for this program
            let candidateCount = 0;
            registrations.forEach(reg => {
                if (Array.isArray(reg)) {
                    candidateCount += reg.filter(r => r.program_code === item.program_code).length;
                }
            });
            
            html += `
                <tr>
                    <td>${formattedDate}</td>
                    <td>${dayName}</td>
                    <td>${item.time}</td>
                    <td>
                        <span class="program-code">${item.program_code}</span>
                    </td>
                    <td>
                        <span class="badge badge-${getProgramType(item.program_code).toLowerCase().replace(' ', '')}">
                            ${getProgramType(item.program_code)}
                        </span>
                    </td>
                    <td>${candidateCount} candidates</td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading schedule:', error);
        const tableBody = document.getElementById('scheduleTableBody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-8 text-red-500">
                    Error loading schedule
                </td>
            </tr>
        `;
    }
}

// =============================
// 📋 My Programs Functions
// =============================
async function loadMyPrograms() {
    if (!currentUser) return;

    try {
        const registrationSheet = `registration_team_${currentUser.team}`;
        const registrations = await api.getSheet(registrationSheet);
        const programsList = document.getElementById('myProgramsList');
        
        if (!Array.isArray(registrations) || registrations.length === 0) {
            programsList.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-clipboard-list text-4xl text-gray-300 mb-3"></i>
                    <p class="text-gray-500">No programs registered yet</p>
                </div>
            `;
            return;
        }
        
        const myRegistrations = registrations.filter(reg => 
            reg.sl_no === currentUser.sl_no || reg.name === currentUser.name
        );
        
        if (myRegistrations.length === 0) {
            programsList.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-clipboard-list text-4xl text-gray-300 mb-3"></i>
                    <p class="text-gray-500">No programs registered yet</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        myRegistrations.forEach(reg => {
            const programType = getProgramType(reg.program_code);
            const badgeClass = programType.toLowerCase().replace(' ', '');
            
            html += `
                <div class="program-card">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <span class="program-code">${reg.program_code}</span>
                            <span class="text-sm font-medium text-gray-700 ml-2">${reg.program || programType}</span>
                        </div>
                        <span class="badge badge-${badgeClass}">${programType}</span>
                    </div>
                    <div class="text-sm text-gray-600">
                        <div class="flex justify-between">
                            <span>Team: <span class="font-medium">${reg.team}</span></span>
                            <span>SL No: <span class="font-medium">${reg.sl_no}</span></span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        programsList.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading my programs:', error);
    }
}

// =============================
// 🏆 My Results Functions
// =============================
async function loadMyResults() {
    if (!currentUser) return;

    try {
        const resultSheets = ['s_result', 'ns_result', 'sp_result', 'gs_result', 'gns_result', 'gsp_result'];
        const allResults = await Promise.all(resultSheets.map(sheet => api.getSheet(sheet)));
        
        const totalPointsDisplay = document.getElementById('totalPointsDisplay');
        const stagePoints = document.getElementById('stagePoints');
        const nonStagePoints = document.getElementById('nonStagePoints');
        const resultsList = document.getElementById('resultsList');
        
        let totalPoints = 0;
        let stageTotal = 0;
        let nonStageTotal = 0;
        let sportsTotal = 0;
        let allUserResults = [];
        
        // Process all results
        allResults.forEach((results, index) => {
            if (Array.isArray(results)) {
                const userResults = results.filter(result => 
                    result.sl_no === currentUser.sl_no || result.name === currentUser.name
                );
                
                userResults.forEach(result => {
                    const points = parseInt(result.points || 0);
                    totalPoints += points;
                    
                    // Categorize points
                    if (resultSheets[index].startsWith('s')) stageTotal += points;
                    if (resultSheets[index].startsWith('ns')) nonStageTotal += points;
                    if (resultSheets[index].startsWith('sp')) sportsTotal += points;
                    
                    allUserResults.push({
                        ...result,
                        type: resultSheets[index].replace('_result', ''),
                        points: points
                    });
                });
            }
        });
        
        // Update points displays
        totalPointsDisplay.textContent = totalPoints;
        stagePoints.textContent = stageTotal;
        nonStagePoints.textContent = nonStageTotal;
        
        // Display results
        if (allUserResults.length === 0) {
            resultsList.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-chart-line text-4xl text-gray-300 mb-3"></i>
                    <p class="text-gray-500">No results available yet</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        allUserResults.forEach(result => {
            const positionClass = `position-${result.position || '1'}`;
            const grade = result.grade || 'N/A';
            const programType = getProgramType(result.program_code || '');
            
            html += `
                <div class="result-card">
                    <div class="flex justify-between items-center mb-3">
                        <div>
                            <span class="program-code">${result.program_code || 'N/A'}</span>
                            <span class="text-sm font-medium text-gray-700 ml-2">${programType}</span>
                        </div>
                        <div class="flex items-center space-x-3">
                            <div class="${positionClass} position-badge">${result.position || 'N/A'}</div>
                            <span class="text-lg font-bold text-green-600">${result.points} pts</span>
                        </div>
                    </div>
                    <div class="text-sm text-gray-600">
                        <div class="flex justify-between">
                            <span>Grade: <span class="font-medium">${grade}</span></span>
                            <span>Position: <span class="font-medium">${result.position || 'N/A'}</span></span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        resultsList.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading my results:', error);
    }
}

// =============================
// 👥 Team Members Functions (Leader/Assistant)
// =============================
async function loadTeamMembers() {
    if (!currentUser || (currentUser.role !== 'leader' && currentUser.role !== 'assistant')) {
        return;
    }

    try {
        // Load all team members
        const users = await api.getSheet('user_credentials');
        const teamMembers = users.filter(user => 
            user.team === currentUser.team && 
            ['member', 'leader', 'assistant'].includes(user.role.toLowerCase())
        );
        
        // Load program count for each member
        const programCounts = await api.getSheet('program_count');
        
        const tableBody = document.getElementById('teamMembersTableBody');
        
        if (teamMembers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8 text-gray-500">
                        No team members found
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        teamMembers.forEach(member => {
            // Find program count for this member
            const countData = Array.isArray(programCounts) ? 
                programCounts.find(pc => pc.sl_no === member.sl_no) : null;
            
            const stageCount = countData ? (countData.s || 0) : 0;
            const nonStageCount = countData ? (countData.ns || 0) : 0;
            const sportsCount = countData ? (countData.sp || 0) : 0;
            const totalCount = countData ? (parseInt(countData.count) || 0) : 0;
            
            // Check if member meets minimum requirements
            const hasWarning = stageCount < 1 || nonStageCount < 1 || sportsCount < 1;
            
            html += `
                <tr class="${hasWarning ? 'program-warning' : ''}">
                    <td>${member.sl_no}</td>
                    <td>
                        <div class="font-medium">${member.name}</div>
                        <div class="text-xs text-gray-500">${member.role}</div>
                    </td>
                    <td>
                        <span class="${member.role === 'leader' ? 'role-leader' : 
                                     member.role === 'assistant' ? 'role-assistant' : 
                                     'role-member'}">
                            ${member.role}
                        </span>
                    </td>
                    <td class="text-center">${stageCount}</td>
                    <td class="text-center">${nonStageCount}</td>
                    <td class="text-center">${sportsCount}</td>
                    <td class="text-center font-bold">${totalCount}</td>
                    <td>
                        <button onclick="viewMemberPrograms('${member.sl_no}')" class="text-blue-600 hover:text-blue-800">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading team members:', error);
    }
}

async function viewMemberPrograms(slNo) {
    try {
        const registrationSheet = `registration_team_${currentUser.team}`;
        const registrations = await api.getSheet(registrationSheet);
        
        const memberPrograms = Array.isArray(registrations) ? 
            registrations.filter(reg => reg.sl_no === slNo) : [];
        
        alert(`Member SL ${slNo} has ${memberPrograms.length} programs registered.`);
        
    } catch (error) {
        console.error('Error viewing member programs:', error);
    }
}

// =============================
// 📝 Assign Programs Functions (Leader/Assistant)
// =============================
async function loadAssignPrograms() {
    if (!currentUser || (currentUser.role !== 'leader' && currentUser.role !== 'assistant')) {
        return;
    }

    try {
        // Load team members for dropdown
        const users = await api.getSheet('user_credentials');
        const teamMembers = users.filter(user => 
            user.team === currentUser.team && 
            user.role.toLowerCase() === 'member'
        );
        
        const memberSelect = document.getElementById('memberSelect');
        memberSelect.innerHTML = '<option value="">Select member</option>';
        teamMembers.forEach(member => {
            const option = document.createElement('option');
            option.value = member.sl_no;
            option.textContent = `${member.sl_no} - ${member.name}`;
            memberSelect.appendChild(option);
        });
        
        // Load program codes from schedule
        const schedule = await api.getSheet('schedule');
        const programCodes = [...new Set(schedule.map(item => item.program_code))];
        
        const programCodeSelect = document.getElementById('programCodeSelect');
        programCodeSelect.innerHTML = '<option value="">Select program</option>';
        programCodes.forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${code} - ${getProgramType(code)}`;
            programCodeSelect.appendChild(option);
        });
        
        // Load currently assigned programs
        await loadAssignedPrograms();
        
    } catch (error) {
        console.error('Error loading assign programs:', error);
    }
}

async function loadAssignedPrograms() {
    try {
        const registrationSheet = `registration_team_${currentUser.team}`;
        const registrations = await api.getSheet(registrationSheet);
        const assignedProgramsList = document.getElementById('assignedProgramsList');
        
        if (!Array.isArray(registrations) || registrations.length === 0) {
            assignedProgramsList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    No programs assigned yet
                </div>
            `;
            return;
        }
        
        // Get team members for names
        const users = await api.getSheet('user_credentials');
        
        let html = '';
        registrations.forEach(reg => {
            const member = users.find(u => u.sl_no === reg.sl_no);
            const memberName = member ? member.name : 'Unknown';
            
            html += `
                <div class="program-card">
                    <div class="flex justify-between items-center">
                        <div>
                            <div class="font-medium">${memberName}</div>
                            <div class="text-sm text-gray-600">SL No: ${reg.sl_no}</div>
                        </div>
                        <div class="text-right">
                            <div class="program-code">${reg.program_code}</div>
                            <div class="text-xs text-gray-500">${getProgramType(reg.program_code)}</div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        assignedProgramsList.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading assigned programs:', error);
    }
}

// Handle assign program form submission
document.getElementById('assignProgramForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const memberSlNo = document.getElementById('memberSelect').value;
    const programCode = document.getElementById('programCodeSelect').value;
    
    if (!memberSlNo || !programCode) {
        alert('Please select both member and program code');
        return;
    }
    
    try {
        // Get member details
        const users = await api.getSheet('user_credentials');
        const member = users.find(u => u.sl_no === memberSlNo && u.team === currentUser.team);
        
        if (!member) {
            alert('Member not found in your team');
            return;
        }
        
        // Check if already registered
        const registrationSheet = `registration_team_${currentUser.team}`;
        const registrations = await api.getSheet(registrationSheet);
        
        const alreadyRegistered = Array.isArray(registrations) ? 
            registrations.some(reg => reg.sl_no === memberSlNo && reg.program_code === programCode) : false;
        
        if (alreadyRegistered) {
            alert('This member is already registered for this program');
            return;
        }
        
        // Get program type
        const programType = getProgramType(programCode);
        
        // Add registration
        const rowData = [
            programCode,
            programType,
            member.sl_no,
            member.name,
            currentUser.team
        ];
        
        const result = await api.addRow(registrationSheet, rowData);
        
        if (result && !result.error) {
            alert('Program assigned successfully!');
            document.getElementById('assignProgramForm').reset();
            await loadAssignedPrograms();
            
            // Update program count
            await updateProgramCount(member.sl_no);
        } else {
            throw new Error(result?.error || 'Failed to assign program');
        }
        
    } catch (error) {
        console.error('Error assigning program:', error);
        alert('Error assigning program: ' + error.message);
    }
});

async function updateProgramCount(slNo) {
    try {
        const registrationSheet = `registration_team_${currentUser.team}`;
        const registrations = await api.getSheet(registrationSheet);
        
        const memberRegistrations = Array.isArray(registrations) ? 
            registrations.filter(reg => reg.sl_no === slNo) : [];
        
        // Count by type
        let stageCount = 0;
        let nonStageCount = 0;
        let sportsCount = 0;
        
        memberRegistrations.forEach(reg => {
            if (reg.program_code.startsWith('s') && !reg.program_code.startsWith('sp')) stageCount++;
            if (reg.program_code.startsWith('ns')) nonStageCount++;
            if (reg.program_code.startsWith('sp')) sportsCount++;
        });
        
        const totalCount = stageCount + nonStageCount + sportsCount;
        
        // Update or add to program_count sheet
        const programCounts = await api.getSheet('program_count');
        const existing = Array.isArray(programCounts) ? 
            programCounts.find(pc => pc.sl_no === slNo) : null;
        
        if (existing) {
            // Update existing
            // Note: You'll need to implement update functionality
            console.log(`Update program count for SL ${slNo}: S=${stageCount}, NS=${nonStageCount}, SP=${sportsCount}, Total=${totalCount}`);
        } else {
            // Add new
            // Note: You'll need to implement add functionality
            console.log(`Add program count for SL ${slNo}`);
        }
        
    } catch (error) {
        console.error('Error updating program count:', error);
    }
}

// =============================
// 🏢 All Teams Functions (Admin)
// =============================
async function loadAllTeams() {
    try {
        // Set default team tab
        showTeamTab(1);
        await loadTeamData(1);
        
    } catch (error) {
        console.error('Error loading all teams:', error);
    }
}

async function loadTeamData(teamNumber) {
    try {
        // Load team members
        const users = await api.getSheet('user_credentials');
        const teamMembers = users.filter(user => user.team === teamNumber.toString());
        
        // Load team registrations
        const registrationSheet = `registration_team_${teamNumber}`;
        const registrations = await api.getSheet(registrationSheet);
        
        const teamContent = document.getElementById('teamContent');
        
        if (teamMembers.length === 0) {
            teamContent.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    No members in Team ${teamNumber}
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="mb-4">
                <h4 class="font-bold text-gray-800 mb-2">Team ${teamNumber} Members (${teamMembers.length})</h4>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>SL No</th>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Admission No</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        teamMembers.forEach(member => {
            html += `
                <tr>
                    <td>${member.sl_no}</td>
                    <td>${member.name}</td>
                    <td>
                        <span class="${member.role === 'admin' ? 'role-admin' : 
                                     member.role === 'leader' ? 'role-leader' : 
                                     member.role === 'assistant' ? 'role-assistant' : 
                                     'role-member'}">
                            ${member.role}
                        </span>
                    </td>
                    <td>${member.ad_no}</td>
                    <td>
                        <button onclick="adminViewMember('${teamNumber}', '${member.sl_no}')" 
                                class="text-blue-600 hover:text-blue-800 mr-2">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div>
                <h4 class="font-bold text-gray-800 mb-2">Team ${teamNumber} Registrations</h4>
        `;
        
        if (!Array.isArray(registrations) || registrations.length === 0) {
            html += `<p class="text-gray-500">No registrations for Team ${teamNumber}</p>`;
        } else {
            html += `
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Program Code</th>
                                <th>Program</th>
                                <th>SL No</th>
                                <th>Name</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            registrations.forEach(reg => {
                html += `
                    <tr>
                        <td>${reg.program_code}</td>
                        <td>${reg.program || getProgramType(reg.program_code)}</td>
                        <td>${reg.sl_no}</td>
                        <td>${reg.name}</td>
                        <td>
                            <button onclick="adminRemoveRegistration('${teamNumber}', '${reg.program_code}', '${reg.sl_no}')" 
                                    class="text-red-600 hover:text-red-800">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        html += `</div>`;
        teamContent.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading team data:', error);
    }
}

async function adminViewMember(teamNumber, slNo) {
    try {
        const users = await api.getSheet('user_credentials');
        const member = users.find(u => u.team === teamNumber.toString() && u.sl_no === slNo);
        
        if (member) {
            alert(`Member Details:\n\nSL No: ${member.sl_no}\nName: ${member.name}\nRole: ${member.role}\nAdmission No: ${member.ad_no}\nTeam: ${member.team}`);
        }
    } catch (error) {
        console.error('Error viewing member:', error);
    }
}

async function adminRemoveRegistration(teamNumber, programCode, slNo) {
    if (!confirm('Are you sure you want to remove this registration?')) {
        return;
    }
    
    try {
        alert(`Removing registration:\nTeam: ${teamNumber}\nProgram: ${programCode}\nSL No: ${slNo}\n\nNote: This feature requires Google Apps Script implementation for deletion.`);
        // Note: You need to implement deletion in Google Apps Script
    } catch (error) {
        console.error('Error removing registration:', error);
    }
}

// =============================
// 🧮 Program Count Functions (Admin)
// =============================
async function loadProgramCount() {
    try {
        const programCounts = await api.getSheet('program_count');
        const tableBody = document.getElementById('programCountTableBody');
        
        if (!Array.isArray(programCounts) || programCounts.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8 text-gray-500">
                        No program count data available
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        programCounts.forEach(pc => {
            const stageCount = parseInt(pc.s || 0);
            const nonStageCount = parseInt(pc.ns || 0);
            const sportsCount = parseInt(pc.sp || 0);
            const totalCount = parseInt(pc.count || 0);
            
            // Check requirements
            const meetsStage = stageCount >= 1;
            const meetsNonStage = nonStageCount >= 1;
            const meetsSports = sportsCount >= 1;
            const meetsTotal = totalCount <= 12;
            
            const hasWarning = !meetsStage || !meetsNonStage || !meetsSports || !meetsTotal;
            
            let status = '';
            if (hasWarning) {
                status = '<span class="text-red-600 font-medium">⚠️ Check</span>';
            } else {
                status = '<span class="text-green-600 font-medium">✓ OK</span>';
            }
            
            html += `
                <tr class="${hasWarning ? 'program-warning' : ''}">
                    <td>${pc.sl_no}</td>
                    <td>${pc.name}</td>
                    <td>
                        <span class="team-${pc.team} team-badge">Team ${pc.team}</span>
                    </td>
                    <td class="text-center ${meetsStage ? '' : 'text-red-600'}">${stageCount}</td>
                    <td class="text-center ${meetsNonStage ? '' : 'text-red-600'}">${nonStageCount}</td>
                    <td class="text-center ${meetsSports ? '' : 'text-red-600'}">${sportsCount}</td>
                    <td class="text-center font-bold ${meetsTotal ? '' : 'text-red-600'}">${totalCount}</td>
                    <td class="text-center">${status}</td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading program count:', error);
    }
}

// =============================
// 🏅 Manage Results Functions (Admin)
// =============================
async function loadManageResults() {
    try {
        // Set default result type
        showResultType('s');
        await loadResultsByType('s');
        
    } catch (error) {
        console.error('Error loading manage results:', error);
    }
}

async function loadResultsByType(type) {
    try {
        const sheetName = `${type}_result`;
        const results = await api.getSheet(sheetName);
        
        const resultsContent = document.getElementById('resultsContent');
        
        if (!Array.isArray(results) || results.length === 0) {
            resultsContent.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    No results available for ${getResultTypeName(type)}
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="mb-4">
                <h4 class="font-bold text-gray-800 mb-2">${getResultTypeName(type)} Results</h4>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Program Code</th>
                                <th>SL No</th>
                                <th>Name</th>
                                <th>Position</th>
                                <th>Grade</th>
                                <th>Points</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        results.forEach(result => {
            const position = result.position || 'N/A';
            const grade = result.grade || 'N/A';
            const points = result.points || '0';
            
            html += `
                <tr>
                    <td>${result.program_code}</td>
                    <td>${result.sl_no}</td>
                    <td>${result.name}</td>
                    <td>
                        <div class="${position <= 3 ? `position-${position} position-badge inline-flex` : ''}">
                            ${position}
                        </div>
                    </td>
                    <td>
                        <span class="font-medium ${grade === 'A' ? 'text-green-600' : 
                                                grade === 'B' ? 'text-yellow-600' : 
                                                grade === 'C' ? 'text-orange-600' : ''}">
                            ${grade}
                        </span>
                    </td>
                    <td class="font-bold text-green-600">${points}</td>
                    <td>
                        <button onclick="editResult('${type}', '${result.program_code}', '${result.sl_no}')" 
                                class="text-blue-600 hover:text-blue-800 mr-2">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div>
                <button onclick="addNewResult('${type}')" class="btn btn-primary">
                    <i class="fas fa-plus mr-2"></i>Add New Result
                </button>
            </div>
        `;
        
        resultsContent.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading results by type:', error);
    }
}

function getResultTypeName(type) {
    const types = {
        's': 'Stage',
        'ns': 'Non-Stage',
        'sp': 'Sports',
        'gs': 'Group Stage',
        'gns': 'Group Non-Stage',
        'gsp': 'Group Sports'
    };
    return types[type] || type;
}

async function editResult(type, programCode, slNo) {
    try {
        const sheetName = `${type}_result`;
        const results = await api.getSheet(sheetName);
        
        const result = Array.isArray(results) ? 
            results.find(r => r.program_code === programCode && r.sl_no === slNo) : null;
        
        if (!result) {
            alert('Result not found');
            return;
        }
        
        const modal = document.getElementById('editResultModal');
        const modalContent = document.getElementById('editResultModalContent');
        
        const isGroup = type.startsWith('g');
        const positionValues = isGroup ? 
            {1: 10, 2: 7, 3: 5} : 
            {1: 3, 2: 2, 3: 1};
        const gradeValues = {A: 3, B: 2, C: 1};
        
        modalContent.innerHTML = `
            <form id="editResultForm" onsubmit="updateResult(event, '${type}', '${programCode}', '${slNo}')">
                <div class="space-y-4">
                    <div class="form-group">
                        <label class="form-label">Program Code</label>
                        <input type="text" value="${result.program_code}" class="form-input" readonly>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">SL No</label>
                        <input type="text" value="${result.sl_no}" class="form-input" readonly>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Name</label>
                        <input type="text" value="${result.name}" class="form-input" readonly>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="form-label">Position</label>
                            <select id="editPosition" class="form-select" required>
                                <option value="">Select position</option>
                                <option value="1" ${result.position == '1' ? 'selected' : ''}>1st (${positionValues[1]} points)</option>
                                <option value="2" ${result.position == '2' ? 'selected' : ''}>2nd (${positionValues[2]} points)</option>
                                <option value="3" ${result.position == '3' ? 'selected' : ''}>3rd (${positionValues[3]} points)</option>
                                <option value="4" ${result.position == '4' ? 'selected' : ''}>4th (0 points)</option>
                                <option value="5" ${result.position == '5' ? 'selected' : ''}>5th (0 points)</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Grade</label>
                            <select id="editGrade" class="form-select" required>
                                <option value="">Select grade</option>
                                <option value="A" ${result.grade == 'A' ? 'selected' : ''}>A (${gradeValues['A']} points)</option>
                                <option value="B" ${result.grade == 'B' ? 'selected' : ''}>B (${gradeValues['B']} points)</option>
                                <option value="C" ${result.grade == 'C' ? 'selected' : ''}>C (${gradeValues['C']} points)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Calculated Points</label>
                        <input type="text" id="calculatedPoints" class="form-input" readonly>
                    </div>
                    
                    <div id="editResultError" class="alert alert-error hidden"></div>
                    
                    <div class="flex justify-end space-x-3">
                        <button type="button" onclick="closeEditResultModal()" class="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save mr-2"></i>Update Result
                        </button>
                    </div>
                </div>
            </form>
        `;
        
        // Calculate points on change
        const positionSelect = document.getElementById('editPosition');
        const gradeSelect = document.getElementById('editGrade');
        const pointsInput = document.getElementById('calculatedPoints');
        
        function calculatePoints() {
            const position = positionSelect.value;
            const grade = gradeSelect.value;
            
            if (position && grade) {
                const positionPoints = positionValues[position] || 0;
                const gradePoints = gradeValues[grade] || 0;
                const totalPoints = positionPoints + gradePoints;
                pointsInput.value = totalPoints;
            } else {
                pointsInput.value = '';
            }
        }
        
        positionSelect.addEventListener('change', calculatePoints);
        gradeSelect.addEventListener('change', calculatePoints);
        
        // Calculate initial points
        calculatePoints();
        
        modal.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error editing result:', error);
    }
}

async function updateResult(event, type, programCode, slNo) {
    event.preventDefault();
    
    const position = document.getElementById('editPosition').value;
    const grade = document.getElementById('editGrade').value;
    const calculatedPoints = document.getElementById('calculatedPoints').value;
    
    if (!position || !grade) {
        showEditResultError('Please select both position and grade');
        return;
    }
    
    try {
        // Get result details
        const sheetName = `${type}_result`;
        const results = await api.getSheet(sheetName);
        
        const result = Array.isArray(results) ? 
            results.find(r => r.program_code === programCode && r.sl_no === slNo) : null;
        
        if (!result) {
            showEditResultError('Result not found');
            return;
        }
        
        // Update result
        const rowData = [
            programCode,
            slNo,
            result.name,
            position,
            grade,
            calculatedPoints
        ];
        
        // Note: This requires update functionality in Google Apps Script
        alert(`Update Result:\n\nType: ${type}\nProgram: ${programCode}\nSL No: ${slNo}\nPosition: ${position}\nGrade: ${grade}\nPoints: ${calculatedPoints}\n\nNote: Update functionality requires Google Apps Script implementation.`);
        
        closeEditResultModal();
        await loadResultsByType(type);
        
    } catch (error) {
        console.error('Error updating result:', error);
        showEditResultError('Error updating result: ' + error.message);
    }
}

function showEditResultError(message) {
    const errorDiv = document.getElementById('editResultError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    } else {
        alert(message);
    }
}

async function addNewResult(type) {
    try {
        // Get registrations for this type
        const programCodes = [];
        for (let i = 1; i <= 3; i++) {
            const registrations = await api.getSheet(`registration_team_${i}`);
            if (Array.isArray(registrations)) {
                registrations.forEach(reg => {
                    if (reg.program_code.startsWith(type)) {
                        programCodes.push({
                            code: reg.program_code,
                            sl_no: reg.sl_no,
                            name: reg.name,
                            team: reg.team
                        });
                    }
                });
            }
        }
        
        if (programCodes.length === 0) {
            alert(`No registrations found for ${getResultTypeName(type)} programs`);
            return;
        }
        
        // Show form to add new result
        alert(`Add New ${getResultTypeName(type)} Result\n\nAvailable Programs: ${programCodes.length}\n\nNote: This feature requires form implementation.`);
        
    } catch (error) {
        console.error('Error adding new result:', error);
    }
}

// =============================
// 📅 Admin Schedule Functions
// =============================
async function loadAdminSchedule() {
    try {
        const schedule = await api.getSheet('schedule');
        const tableBody = document.getElementById('adminScheduleTableBody');
        
        if (!Array.isArray(schedule) || schedule.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-8 text-gray-500">
                        No schedule available
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        schedule.forEach(item => {
            const date = new Date(item.date);
            const formattedDate = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            html += `
                <tr>
                    <td>${formattedDate}</td>
                    <td>${item.time}</td>
                    <td>
                        <span class="program-code">${item.program_code}</span>
                        <span class="text-xs text-gray-500 ml-2">${getProgramType(item.program_code)}</span>
                    </td>
                    <td>
                        <button onclick="editSchedule('${item.date}', '${item.time}', '${item.program_code}')" 
                                class="text-blue-600 hover:text-blue-800 mr-2">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteSchedule('${item.date}', '${item.time}', '${item.program_code}')" 
                                class="text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading admin schedule:', error);
    }
}

// Handle add schedule form submission
document.getElementById('addScheduleForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const date = document.getElementById('scheduleDate').value;
    const time = document.getElementById('scheduleTime').value;
    const programCode = document.getElementById('scheduleProgramCode').value.trim().toUpperCase();
    
    if (!date || !time || !programCode) {
        alert('Please fill in all fields');
        return;
    }
    
    // Validate program code format
    const validPrefixes = ['S', 'NS', 'SP', 'GS', 'GNS', 'GSP'];
    const prefix = programCode.match(/^[A-Z]+/)?.[0];
    const number = programCode.match(/\d+$/)?.[0];
    
    if (!prefix || !validPrefixes.includes(prefix) || !number) {
        alert('Invalid program code format. Examples: S01, NS01, SP01, GS01, GNS01, GSP01');
        return;
    }
    
    try {
        // Format date
        const dateObj = new Date(date);
        const formattedDate = dateObj.toISOString().split('T')[0];
        
        // Check if schedule already exists
        const schedule = await api.getSheet('schedule');
        const exists = Array.isArray(schedule) ? 
            schedule.some(item => 
                item.date === formattedDate && 
                item.time === time && 
                item.program_code === programCode
            ) : false;
        
        if (exists) {
            alert('This schedule already exists');
            return;
        }
        
        // Add to schedule
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        const rowData = [formattedDate, dayName, time, programCode];
        
        const result = await api.addRow('schedule', rowData);
        
        if (result && !result.error) {
            alert('Schedule added successfully!');
            document.getElementById('addScheduleForm').reset();
            await loadAdminSchedule();
        } else {
            throw new Error(result?.error || 'Failed to add schedule');
        }
        
    } catch (error) {
        console.error('Error adding schedule:', error);
        alert('Error adding schedule: ' + error.message);
    }
});

async function editSchedule(date, time, programCode) {
    try {
        alert(`Edit Schedule:\n\nDate: ${date}\nTime: ${time}\nProgram Code: ${programCode}\n\nNote: This feature requires edit implementation.`);
    } catch (error) {
        console.error('Error editing schedule:', error);
    }
}

async function deleteSchedule(date, time, programCode) {
    if (!confirm('Are you sure you want to delete this schedule?')) {
        return;
    }
    
    try {
        alert(`Delete Schedule:\n\nDate: ${date}\nTime: ${time}\nProgram Code: ${programCode}\n\nNote: This feature requires delete implementation.`);
        // Note: You need to implement deletion in Google Apps Script
    } catch (error) {
        console.error('Error deleting schedule:', error);
    }
}

// =============================
// 🔐 Change Password Functions
// =============================
function openChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    modal.classList.remove('hidden');
    
    // Reset form
    document.getElementById('changePasswordForm').reset();
    document.getElementById('changePasswordError').classList.add('hidden');
    document.getElementById('changePasswordSuccess').classList.add('hidden');
}

async function changePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    const errorDiv = document.getElementById('changePasswordError');
    const successDiv = document.getElementById('changePasswordSuccess');
    
    // Hide previous messages
    errorDiv.classList.add('hidden');
    successDiv.classList.add('hidden');
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        errorDiv.textContent = 'Please fill in all fields';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    if (newPassword.length < 6) {
        errorDiv.textContent = 'New password must be at least 6 characters';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        errorDiv.textContent = 'New passwords do not match';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    if (newPassword === currentPassword) {
        errorDiv.textContent = 'New password must be different from current password';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    try {
        // Verify current password
        const users = await api.getSheet('user_credentials', false);
        
        if (!users || users.error || !Array.isArray(users)) {
            throw new Error('Failed to fetch user data');
        }
        
        const user = users.find(u => 
            u.ad_no === currentUser.ad_no && 
            u.pswd === currentPassword
        );
        
        if (!user) {
            errorDiv.textContent = 'Current password is incorrect';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        // Update password
        const result = await api.updatePassword(currentUser.ad_no, newPassword);
        
        if (result && !result.error) {
            successDiv.textContent = 'Password changed successfully!';
            successDiv.classList.remove('hidden');
            
            // Clear form
            document.getElementById('changePasswordForm').reset();
            
            // Logout after 3 seconds
            setTimeout(() => {
                closeChangePasswordModal();
                logout();
            }, 3000);
        } else {
            throw new Error(result?.error || 'Failed to update password');
        }
        
    } catch (error) {
        console.error('Error changing password:', error);
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    }
}

// =============================
// 🚀 Initialization
// =============================
document.addEventListener('DOMContentLoaded', function() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        login();
    });
    
    // Change password form
    document.getElementById('changePasswordForm').addEventListener('submit', function(e) {
        e.preventDefault();
        changePassword(e);
    });
    
    // Assign program form
    const assignProgramForm = document.getElementById('assignProgramForm');
    if (assignProgramForm) {
        assignProgramForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Handled in the function above
        });
    }
    
    // Add schedule form
    const addScheduleForm = document.getElementById('addScheduleForm');
    if (addScheduleForm) {
        addScheduleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Handled in the function above
        });
    }
    
    // Set default page
    showPage('dashboard');
});

// Admin initialization function
async function initializeSheets() {
    try {
        const result = await api.initializeSheets();
        if (result && !result.error) {
            alert('Sheets initialized successfully with sample data!');
        } else {
            throw new Error(result?.error || 'Failed to initialize sheets');
        }
    } catch (error) {
        console.error('Error initializing sheets:', error);
        alert('Error initializing sheets: ' + error.message);
    }
}

// Export for use in console
window.initializeSheets = initializeSheets;

console.log('%c🎉 FEST MANAGEMENT SYSTEM LOADED 🎉', 'color: #3b82f6; font-size: 16px; font-weight: bold;');
console.log('%cRun initializeSheets() in console to setup sheets', 'color: #059669; font-size: 12px;');
