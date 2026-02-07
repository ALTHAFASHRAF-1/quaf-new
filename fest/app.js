// 🌐 Global Variables
let currentUser = null;
let currentPage = 'dashboard';
let currentTeamTab = 1;
let currentResultType = 's';

// =============================
// 📊 Google Sheets Integration - FIXED
// =============================
class GoogleSheetsAPI {
    constructor() {
        // ⚠️ REPLACE THIS URL WITH YOUR GOOGLE APPS SCRIPT WEB APP URL
        this.apiUrl = "https://script.google.com/macros/s/AKfycbxA1gSXVQU0kKyEQeNkfzObx8VjXaRuE0qUX6KKdNcg6H9Xos82TLkDCWhj7p20N9RmYA/exec";
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
            console.log(`Fetching ${sheetName} from:`, url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            let data;
            
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse JSON from', sheetName, ':', e);
                console.log('Raw response:', text);
                data = [];
            }
            
            if (useCache && data) {
                this.cache.set(cacheKey, { data, timestamp: now });
            }
            
            return data;
        } catch (error) {
            console.error(`Error fetching ${sheetName}:`, error);
            return [];
        }
    }

    async addRow(sheetName, rowData) {
        try {
            console.log(`Adding row to ${sheetName}:`, rowData);
            
            const formData = new FormData();
            formData.append('sheet', sheetName);
            formData.append('data', JSON.stringify(rowData));
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                body: formData
            });
            
            const text = await response.text();
            let result;
            
            try {
                result = JSON.parse(text);
            } catch (e) {
                result = { success: true, message: text };
            }
            
            // Clear cache for this sheet
            this.cache.delete(sheetName);
            
            return result;
        } catch (error) {
            console.error('Error adding row:', error);
            return { error: error.message };
        }
    }

    async updatePassword(username, newPassword) {
        try {
            const formData = new FormData();
            formData.append('action', 'updatePassword');
            formData.append('username', username);
            formData.append('newPassword', newPassword);
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                body: formData
            });
            
            const text = await response.text();
            let result;
            
            try {
                result = JSON.parse(text);
            } catch (e) {
                result = { success: true, message: text };
            }
            
            // Clear user credentials cache
            this.cache.delete("user_credentials");
            
            return result;
        } catch (error) {
            console.error('Error updating password:', error);
            return { error: error.message };
        }
    }

    async login(username, password) {
        try {
            const formData = new FormData();
            formData.append('action', 'login');
            formData.append('username', username);
            formData.append('password', password);
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                body: formData
            });
            
            const text = await response.text();
            let result;
            
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('Login response parse error:', e);
                return { success: false, error: 'Invalid response from server' };
            }
            
            return result;
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error: ' + error.message };
        }
    }

    async initializeSheets() {
        try {
            const response = await fetch(`${this.apiUrl}?action=initialize`);
            const text = await response.text();
            let result;
            
            try {
                result = JSON.parse(text);
            } catch (e) {
                result = { success: true, message: text };
            }
            
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
// 🔑 Authentication - FIXED
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
        const result = await api.login(username, password);
        
        console.log('Login result:', result);
        
        if (result.success && result.user) {
            currentUser = {
                sl_no: result.user.sl_no || result.user['sl:no'] || '0',
                ad_no: result.user.ad_no || result.user['ad:no'] || username,
                name: result.user.name || 'User',
                role: result.user.role?.toLowerCase() || 'member',
                team: result.user.team || '0'
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
            showLoginError(result.error || 'Invalid admission number or password');
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
    if (errorDiv) {
        errorDiv.textContent = message;
        if (message) {
            errorDiv.classList.remove('hidden');
        } else {
            errorDiv.classList.add('hidden');
        }
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
    if (welcomeUser) welcomeUser.textContent = `Welcome, ${currentUser.name} (${roleDisplay})`;
    
    // Update profile info
    if (profileName) profileName.textContent = currentUser.name;
    if (profileUsername) profileUsername.textContent = `@${currentUser.ad_no}`;
    if (profileRole) {
        profileRole.textContent = roleDisplay;
        profileRole.className = 'text-xs px-2 py-1 bg-white/20 rounded-full ' + 
            (currentUser.role === 'admin' ? 'role-admin' : 
             currentUser.role === 'leader' ? 'role-leader' : 
             currentUser.role === 'assistant' ? 'role-assistant' : 'role-member');
    }
    
    if (profileTeam) {
        profileTeam.textContent = `Team ${currentUser.team}`;
        profileTeam.className = 'text-xs px-2 py-1 bg-white/20 rounded-full ml-1 team-' + currentUser.team;
    }
    
    // Show/hide navigation based on role
    if (currentUser.role === 'admin') {
        if (adminNav) adminNav.classList.remove('hidden');
        if (leaderNav) leaderNav.classList.add('hidden');
        if (adminDashboardCards) adminDashboardCards.classList.remove('hidden');
        if (leaderDashboardCards) leaderDashboardCards.classList.add('hidden');
    } else if (currentUser.role === 'leader' || currentUser.role === 'assistant') {
        if (leaderNav) leaderNav.classList.remove('hidden');
        if (adminNav) adminNav.classList.add('hidden');
        if (leaderDashboardCards) leaderDashboardCards.classList.remove('hidden');
        if (adminDashboardCards) adminDashboardCards.classList.add('hidden');
    } else {
        if (leaderNav) leaderNav.classList.add('hidden');
        if (adminNav) adminNav.classList.add('hidden');
        if (leaderDashboardCards) leaderDashboardCards.classList.add('hidden');
        if (adminDashboardCards) adminDashboardCards.classList.add('hidden');
    }
}

// =============================
// 📍 Navigation
// =============================
async function showPage(page) {
    try {
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
    } catch (error) {
        console.error('Error showing page:', error);
    }
}

// =============================
// 🏠 Dashboard Functions - FIXED
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
        if (dashboardInfo) {
            const roleText = currentUser.role === 'admin' ? 'Admin' : 
                           currentUser.role === 'leader' ? 'Leader' :
                           currentUser.role === 'assistant' ? 'Assistant' : 'Member';
            dashboardInfo.textContent = `${roleText} of Team ${currentUser.team}`;
        }

        // Load user's programs
        const registrationSheet = `registration_team_${currentUser.team}`;
        const registrations = await api.getSheet(registrationSheet);
        
        // Load all results to calculate points
        const resultSheets = ['s_result', 'ns_result', 'sp_result', 'gs_result', 'gns_result', 'gsp_result'];
        const allResults = await Promise.all(resultSheets.map(sheet => api.getSheet(sheet)));
        
        // Calculate stats
        let userPrograms = [];
        let userPoints = 0;
        
        if (Array.isArray(registrations) && registrations.length > 0) {
            userPrograms = registrations.filter(reg => {
                const regSlNo = reg['sl:no'] || reg.sl_no || '';
                const regName = reg.name || '';
                return regSlNo == currentUser.sl_no || 
                       regName.toLowerCase() === currentUser.name.toLowerCase();
            });
            
            // Calculate points from results
            allResults.forEach(results => {
                if (Array.isArray(results) && results.length > 0) {
                    const userResults = results.filter(result => {
                        const resultSlNo = result['sl:no'] || result.sl_no || '';
                        const resultName = result.name || '';
                        return resultSlNo == currentUser.sl_no || 
                               resultName.toLowerCase() === currentUser.name.toLowerCase();
                    });
                    
                    userResults.forEach(result => {
                        const points = parseInt(result.points || 0);
                        userPoints += isNaN(points) ? 0 : points;
                    });
                }
            });
        }
        
        // Count completed programs (programs with results)
        let completedCount = 0;
        if (Array.isArray(userPrograms)) {
            userPrograms.forEach(program => {
                const programCode = program.program_code || '';
                // Check if this program has a result
                const hasResult = allResults.some(results => {
                    if (!Array.isArray(results)) return false;
                    return results.some(result => {
                        const resultSlNo = result['sl:no'] || result.sl_no || '';
                        const resultProgramCode = result.program_code || '';
                        return resultSlNo == currentUser.sl_no && resultProgramCode === programCode;
                    });
                });
                if (hasResult) completedCount++;
            });
        }
        
        if (totalPrograms) totalPrograms.textContent = userPrograms.length;
        if (completedPrograms) completedPrograms.textContent = completedCount;
        if (totalPoints) totalPoints.textContent = userPoints;
        
        // Calculate team rank
        const teamPoints = await calculateTeamPoints(currentUser.team);
        if (teamRank) teamRank.textContent = teamPoints.rank || '-';
        
        // Load upcoming programs
        await loadUpcomingPrograms();

    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function calculateTeamPoints(teamNumber) {
    try {
        const resultSheets = ['s_result', 'ns_result', 'sp_result', 'gs_result', 'gns_result', 'gsp_result'];
        const allResults = await Promise.all(resultSheets.map(sheet => api.getSheet(sheet)));
        
        let teamPoints = 0;
        const teamTotals = {1: 0, 2: 0, 3: 0};
        
        // Calculate points for all teams
        allResults.forEach(results => {
            if (Array.isArray(results)) {
                results.forEach(result => {
                    const points = parseInt(result.points || 0);
                    const team = result.team || '';
                    
                    if (team && teamTotals[team] !== undefined) {
                        teamTotals[team] += points;
                    }
                });
            }
        });
        
        // Convert to array for sorting
        const teamsArray = Object.entries(teamTotals).map(([team, points]) => ({team, points}));
        teamsArray.sort((a, b) => b.points - a.points);
        
        // Find rank
        let rank = 1;
        for (let i = 0; i < teamsArray.length; i++) {
            if (teamsArray[i].team == teamNumber) {
                // Check if there's a tie
                if (i > 0 && teamsArray[i].points === teamsArray[i-1].points) {
                    rank = i; // Same rank as previous
                } else {
                    rank = i + 1;
                }
                break;
            }
        }
        
        return {
            points: teamTotals[teamNumber] || 0,
            rank: rank,
            leaderboard: teamsArray
        };
        
    } catch (error) {
        console.error('Error calculating team points:', error);
        return { points: 0, rank: '-', leaderboard: [] };
    }
}

async function loadUpcomingPrograms() {
    try {
        const schedule = await api.getSheet('schedule');
        const upcomingPrograms = document.getElementById('upcomingPrograms');
        
        if (!upcomingPrograms) return;
        
        if (!Array.isArray(schedule) || schedule.length === 0) {
            upcomingPrograms.innerHTML = '<p class="text-gray-500 text-center py-4">No upcoming programs</p>';
            return;
        }
        
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filter upcoming programs (next 7 days)
        const upcoming = schedule.filter(item => {
            try {
                const itemDate = new Date(item.date || today);
                itemDate.setHours(0, 0, 0, 0);
                const diffTime = itemDate - today;
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                return diffDays >= 0 && diffDays <= 7;
            } catch (e) {
                return false;
            }
        }).slice(0, 5);
        
        if (upcoming.length === 0) {
            upcomingPrograms.innerHTML = '<p class="text-gray-500 text-center py-4">No upcoming programs in next 7 days</p>';
            return;
        }
        
        let html = '';
        upcoming.forEach(item => {
            let itemDate;
            try {
                itemDate = new Date(item.date || new Date());
            } catch (e) {
                itemDate = new Date();
            }
            
            const dayName = item.day || itemDate.toLocaleDateString('en-US', { weekday: 'short' });
            const formattedDate = itemDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
            
            const programCode = item.program_code || '';
            const time = item.time || '';
            
            html += `
                <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="program-code">${programCode}</span>
                            <span class="text-xs text-gray-500 ml-2">${getProgramType(programCode)}</span>
                        </div>
                        <div class="text-right">
                            <div class="text-sm font-medium">${time}</div>
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
    if (!programCode) return 'General';
    const code = programCode.toString().toUpperCase();
    if (code.startsWith('S') && !code.startsWith('SP') && !code.startsWith('GS')) return 'Stage';
    if (code.startsWith('NS') && !code.startsWith('GNS')) return 'Non-Stage';
    if (code.startsWith('SP') && !code.startsWith('GSP')) return 'Sports';
    if (code.startsWith('GS')) return 'Group Stage';
    if (code.startsWith('GNS')) return 'Group Non-Stage';
    if (code.startsWith('GSP')) return 'Group Sports';
    return 'General';
}

// =============================
// 📅 Schedule Functions - FIXED
// =============================
async function loadSchedule() {
    try {
        const schedule = await api.getSheet('schedule');
        const tableBody = document.getElementById('scheduleTableBody');
        
        if (!tableBody) return;
        
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
        
        // Get registrations count for each program
        const registrationsByProgram = {};
        for (let team = 1; team <= 3; team++) {
            const regSheet = await api.getSheet(`registration_team_${team}`);
            if (Array.isArray(regSheet)) {
                regSheet.forEach(reg => {
                    const programCode = reg.program_code || '';
                    if (programCode) {
                        if (!registrationsByProgram[programCode]) {
                            registrationsByProgram[programCode] = 0;
                        }
                        registrationsByProgram[programCode]++;
                    }
                });
            }
        }
        
        let html = '';
        schedule.forEach(item => {
            let date;
            try {
                date = new Date(item.date || new Date());
            } catch (e) {
                date = new Date();
            }
            
            const dayName = item.day || date.toLocaleDateString('en-US', { weekday: 'long' });
            const formattedDate = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            const programCode = item.program_code || '';
            const time = item.time || '';
            const registeredCount = registrationsByProgram[programCode] || 0;
            
            html += `
                <tr>
                    <td>${formattedDate}</td>
                    <td>${dayName}</td>
                    <td>${time}</td>
                    <td>
                        <span class="program-code">${programCode}</span>
                    </td>
                    <td>
                        <span class="badge badge-${getProgramType(programCode).toLowerCase().replace(' ', '')}">
                            ${getProgramType(programCode)}
                        </span>
                    </td>
                    <td>${registeredCount}</td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading schedule:', error);
        const tableBody = document.getElementById('scheduleTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-8 text-red-500">
                        Error loading schedule
                    </td>
                </tr>
            `;
        }
    }
}

// =============================
// 📋 My Programs Functions - FIXED
// =============================
async function loadMyPrograms() {
    if (!currentUser) return;

    try {
        const registrationSheet = `registration_team_${currentUser.team}`;
        const registrations = await api.getSheet(registrationSheet);
        const programsList = document.getElementById('myProgramsList');
        
        if (!programsList) return;
        
        if (!Array.isArray(registrations) || registrations.length === 0) {
            programsList.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-clipboard-list text-4xl text-gray-300 mb-3"></i>
                    <p class="text-gray-500">No programs registered yet</p>
                </div>
            `;
            return;
        }
        
        const myRegistrations = registrations.filter(reg => {
            const regSlNo = reg['sl:no'] || reg.sl_no || '';
            const regName = reg.name || '';
            return regSlNo == currentUser.sl_no || 
                   regName.toLowerCase() === currentUser.name.toLowerCase();
        });
        
        if (myRegistrations.length === 0) {
            programsList.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-clipboard-list text-4xl text-gray-300 mb-3"></i>
                    <p class="text-gray-500">No programs registered yet</p>
                </div>
            `;
            return;
        }
        
        // Get results to check completion
        const resultSheets = ['s_result', 'ns_result', 'sp_result', 'gs_result', 'gns_result', 'gsp_result'];
        const allResults = await Promise.all(resultSheets.map(sheet => api.getSheet(sheet)));
        
        let html = '';
        myRegistrations.forEach(reg => {
            const programCode = reg.program_code || '';
            const programName = reg.program || getProgramType(programCode);
            const team = reg.team || currentUser.team;
            const slNo = reg['sl:no'] || reg.sl_no || '';
            
            // Check if program has result
            let hasResult = false;
            let resultPoints = 0;
            allResults.forEach(results => {
                if (Array.isArray(results)) {
                    const result = results.find(r => {
                        const rSlNo = r['sl:no'] || r.sl_no || '';
                        const rProgramCode = r.program_code || '';
                        return rSlNo == slNo && rProgramCode === programCode;
                    });
                    if (result) {
                        hasResult = true;
                        resultPoints = parseInt(result.points || 0);
                    }
                }
            });
            
            const programType = getProgramType(programCode);
            const badgeClass = programType.toLowerCase().replace(' ', '');
            
            html += `
                <div class="program-card ${hasResult ? 'border-green-500' : ''}">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <span class="program-code">${programCode}</span>
                            <span class="text-sm font-medium text-gray-700 ml-2">${programName}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="badge badge-${badgeClass}">${programType}</span>
                            ${hasResult ? `<span class="text-green-600 font-bold">${resultPoints} pts</span>` : ''}
                        </div>
                    </div>
                    <div class="text-sm text-gray-600">
                        <div class="flex justify-between">
                            <span>Team: <span class="font-medium">${team}</span></span>
                            <span>SL No: <span class="font-medium">${slNo}</span></span>
                        </div>
                        <div class="mt-1">
                            Status: <span class="font-medium ${hasResult ? 'text-green-600' : 'text-yellow-600'}">
                                ${hasResult ? 'Completed' : 'Upcoming'}
                            </span>
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
// 🏆 My Results Functions - FIXED
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
        
        if (!totalPointsDisplay || !stagePoints || !nonStagePoints || !resultsList) return;
        
        let totalPoints = 0;
        let stageTotal = 0;
        let nonStageTotal = 0;
        let sportsTotal = 0;
        let groupTotal = 0;
        let allUserResults = [];
        
        // Process all results
        allResults.forEach((results, index) => {
            const sheetName = resultSheets[index];
            if (Array.isArray(results) && results.length > 0) {
                const userResults = results.filter(result => {
                    const resultSlNo = result['sl:no'] || result.sl_no || '';
                    const resultName = result.name || '';
                    return resultSlNo == currentUser.sl_no || 
                           resultName.toLowerCase() === currentUser.name.toLowerCase();
                });
                
                userResults.forEach(result => {
                    const points = parseInt(result.points || 0);
                    totalPoints += isNaN(points) ? 0 : points;
                    
                    // Categorize points
                    if (sheetName === 's_result') {
                        stageTotal += points;
                    } else if (sheetName === 'ns_result') {
                        nonStageTotal += points;
                    } else if (sheetName === 'sp_result') {
                        sportsTotal += points;
                    } else {
                        groupTotal += points;
                    }
                    
                    allUserResults.push({
                        ...result,
                        type: sheetName.replace('_result', ''),
                        points: points
                    });
                });
            }
        });
        
        // Update points displays
        totalPointsDisplay.textContent = totalPoints;
        stagePoints.textContent = stageTotal;
        nonStagePoints.textContent = nonStageTotal + sportsTotal;
        
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
            const programCode = result.program_code || '';
            const position = result.position || 'N/A';
            const grade = result.grade || 'N/A';
            const points = result.points || 0;
            const type = result.type || '';
            
            const positionClass = position <= 3 ? `position-${position}` : '';
            const programType = getProgramType(programCode);
            const typeColor = type === 's' ? 'text-yellow-600' : 
                            type === 'ns' ? 'text-green-600' : 
                            type === 'sp' ? 'text-blue-600' : 'text-purple-600';
            
            html += `
                <div class="result-card">
                    <div class="flex justify-between items-center mb-3">
                        <div>
                            <span class="program-code">${programCode}</span>
                            <span class="text-sm font-medium ${typeColor} ml-2">${programType}</span>
                        </div>
                        <div class="flex items-center space-x-3">
                            ${position <= 3 ? `<div class="${positionClass} position-badge">${position}</div>` : ''}
                            <span class="text-lg font-bold text-green-600">${points} pts</span>
                        </div>
                    </div>
                    <div class="text-sm text-gray-600">
                        <div class="flex justify-between">
                            <span>Grade: <span class="font-medium ${grade === 'A' ? 'text-green-600' : grade === 'B' ? 'text-yellow-600' : 'text-orange-600'}">${grade}</span></span>
                            <span>Position: <span class="font-medium">${position}</span></span>
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
// 👥 Team Members Functions (Leader/Assistant) - FIXED
// =============================
async function loadTeamMembers() {
    if (!currentUser || (currentUser.role !== 'leader' && currentUser.role !== 'assistant')) {
        return;
    }

    try {
        // Load all team members
        const users = await api.getSheet('user_credentials');
        const teamMembers = users.filter(user => {
            const userTeam = user.team || '';
            const userRole = (user.role || '').toLowerCase();
            return userTeam == currentUser.team && 
                   ['member', 'leader', 'assistant'].includes(userRole);
        });
        
        // Load program count
        const programCounts = await api.getSheet('program_count');
        
        const tableBody = document.getElementById('teamMembersTableBody');
        if (!tableBody) return;
        
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
            const slNo = member['sl:no'] || member.sl_no || '';
            const name = member.name || '';
            const role = (member.role || '').toLowerCase();
            const adNo = member['ad:no'] || member.ad_no || '';
            
            // Find program count for this member
            let countData = null;
            if (Array.isArray(programCounts) && programCounts.length > 0) {
                countData = programCounts.find(pc => {
                    const pcSlNo = pc['sl:no'] || pc.sl_no || '';
                    return pcSlNo == slNo;
                });
            }
            
            const stageCount = countData ? (parseInt(countData.s || 0)) : 0;
            const nonStageCount = countData ? (parseInt(countData.ns || 0)) : 0;
            const sportsCount = countData ? (parseInt(countData.sp || 0)) : 0;
            const totalCount = countData ? (parseInt(countData.count || 0)) : 0;
            
            // Check if member meets minimum requirements
            const meetsStage = stageCount >= 1;
            const meetsNonStage = nonStageCount >= 1;
            const meetsSports = sportsCount >= 1;
            const meetsTotal = totalCount <= 12;
            
            const hasWarning = !meetsStage || !meetsNonStage || !meetsSports || !meetsTotal;
            
            html += `
                <tr class="${hasWarning ? 'program-warning' : ''}">
                    <td>${slNo}</td>
                    <td>
                        <div class="font-medium">${name}</div>
                        <div class="text-xs text-gray-500">${adNo}</div>
                    </td>
                    <td>
                        <span class="${role === 'leader' ? 'role-leader' : 
                                     role === 'assistant' ? 'role-assistant' : 
                                     'role-member'}">
                            ${role}
                        </span>
                    </td>
                    <td class="text-center ${meetsStage ? '' : 'text-red-600'}">${stageCount}</td>
                    <td class="text-center ${meetsNonStage ? '' : 'text-red-600'}">${nonStageCount}</td>
                    <td class="text-center ${meetsSports ? '' : 'text-red-600'}">${sportsCount}</td>
                    <td class="text-center font-bold ${meetsTotal ? '' : 'text-red-600'}">${totalCount}</td>
                    <td>
                        <button onclick="viewMemberPrograms('${slNo}')" class="text-blue-600 hover:text-blue-800 mr-2">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="assignProgramToMember('${slNo}', '${name}')" class="text-green-600 hover:text-green-800">
                            <i class="fas fa-plus"></i>
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
            registrations.filter(reg => {
                const regSlNo = reg['sl:no'] || reg.sl_no || '';
                return regSlNo == slNo;
            }) : [];
        
        // Get user name
        const users = await api.getSheet('user_credentials');
        const member = users.find(u => {
            const userSlNo = u['sl:no'] || u.sl_no || '';
            return userSlNo == slNo;
        });
        
        const memberName = member ? (member.name || 'Unknown') : 'Unknown';
        
        if (memberPrograms.length === 0) {
            alert(`${memberName} (SL: ${slNo}) has no programs registered.`);
            return;
        }
        
        let message = `${memberName} (SL: ${slNo}) has ${memberPrograms.length} programs:\n\n`;
        memberPrograms.forEach((program, index) => {
            const programCode = program.program_code || '';
            const programName = program.program || getProgramType(programCode);
            message += `${index + 1}. ${programCode} - ${programName}\n`;
        });
        
        alert(message);
        
    } catch (error) {
        console.error('Error viewing member programs:', error);
        alert('Error loading member programs');
    }
}

async function assignProgramToMember(slNo, memberName) {
    try {
        // Load available programs from schedule
        const schedule = await api.getSheet('schedule');
        const programCodes = [...new Set(schedule.map(item => item.program_code || '').filter(Boolean))];
        
        // Load member's current programs
        const registrationSheet = `registration_team_${currentUser.team}`;
        const registrations = await api.getSheet(registrationSheet);
        const memberPrograms = Array.isArray(registrations) ? 
            registrations.filter(reg => {
                const regSlNo = reg['sl:no'] || reg.sl_no || '';
                return regSlNo == slNo;
            }).map(reg => reg.program_code || '') : [];
        
        // Filter out already assigned programs
        const availablePrograms = programCodes.filter(code => !memberPrograms.includes(code));
        
        if (availablePrograms.length === 0) {
            alert(`${memberName} is already registered for all available programs.`);
            return;
        }
        
        const modal = document.getElementById('assignProgramModal');
        const modalContent = document.getElementById('assignProgramModalContent');
        
        if (!modal || !modalContent) return;
        
        let optionsHtml = '';
        availablePrograms.forEach(code => {
            optionsHtml += `<option value="${code}">${code} - ${getProgramType(code)}</option>`;
        });
        
        modalContent.innerHTML = `
            <form id="assignProgramModalForm" onsubmit="assignProgramFromModal(event, '${slNo}', '${memberName}')">
                <div class="space-y-4">
                    <div class="form-group">
                        <label class="form-label">Member</label>
                        <input type="text" value="${memberName} (SL: ${slNo})" class="form-input" readonly>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Select Program</label>
                        <select id="modalProgramCode" class="form-select" required>
                            <option value="">Select a program</option>
                            ${optionsHtml}
                        </select>
                    </div>
                    
                    <div id="assignModalError" class="alert alert-error hidden"></div>
                    
                    <div class="flex justify-end space-x-3">
                        <button type="button" onclick="closeAssignProgramModal()" class="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-plus mr-2"></i>Assign Program
                        </button>
                    </div>
                </div>
            </form>
        `;
        
        modal.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error assigning program:', error);
        alert('Error loading programs');
    }
}

async function assignProgramFromModal(event, slNo, memberName) {
    event.preventDefault();
    
    const programCode = document.getElementById('modalProgramCode').value;
    const errorDiv = document.getElementById('assignModalError');
    
    if (!programCode) {
        if (errorDiv) {
            errorDiv.textContent = 'Please select a program';
            errorDiv.classList.remove('hidden');
        }
        return;
    }
    
    try {
        // Get program type
        const programType = getProgramType(programCode);
        
        // Add registration
        const rowData = {
            'program_code': programCode,
            'program': programType + ' Program',
            'sl:no': slNo,
            'name': memberName,
            'team': currentUser.team
        };
        
        const result = await api.addRow(`registration_team_${currentUser.team}`, rowData);
        
        if (result && !result.error) {
            closeAssignProgramModal();
            alert('Program assigned successfully!');
            await loadTeamMembers();
            await loadAssignPrograms();
        } else {
            throw new Error(result?.error || 'Failed to assign program');
        }
        
    } catch (error) {
        console.error('Error assigning program from modal:', error);
        if (errorDiv) {
            errorDiv.textContent = 'Error: ' + error.message;
            errorDiv.classList.remove('hidden');
        }
    }
}

// =============================
// 📝 Assign Programs Functions (Leader/Assistant) - FIXED
// =============================
async function loadAssignPrograms() {
    if (!currentUser || (currentUser.role !== 'leader' && currentUser.role !== 'assistant')) {
        return;
    }

    try {
        // Load team members for dropdown
        const users = await api.getSheet('user_credentials');
        const teamMembers = users.filter(user => {
            const userTeam = user.team || '';
            const userRole = (user.role || '').toLowerCase();
            return userTeam == currentUser.team && userRole === 'member';
        });
        
        const memberSelect = document.getElementById('memberSelect');
        if (!memberSelect) return;
        
        memberSelect.innerHTML = '<option value="">Select member</option>';
        teamMembers.forEach(member => {
            const slNo = member['sl:no'] || member.sl_no || '';
            const name = member.name || '';
            const adNo = member['ad:no'] || member.ad_no || '';
            const option = document.createElement('option');
            option.value = slNo;
            option.textContent = `${slNo} - ${name} (${adNo})`;
            memberSelect.appendChild(option);
        });
        
        // Load program codes from schedule
        const schedule = await api.getSheet('schedule');
        const programCodes = [...new Set(schedule.map(item => item.program_code || '').filter(Boolean))];
        
        const programCodeSelect = document.getElementById('programCodeSelect');
        if (!programCodeSelect) return;
        
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
        
        if (!assignedProgramsList) return;
        
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
            const slNo = reg['sl:no'] || reg.sl_no || '';
            const programCode = reg.program_code || '';
            const programName = reg.program || getProgramType(programCode);
            
            const member = users.find(u => {
                const userSlNo = u['sl:no'] || u.sl_no || '';
                return userSlNo == slNo;
            });
            
            const memberName = member ? (member.name || 'Unknown') : 'Unknown';
            const memberAdNo = member ? (member['ad:no'] || member.ad_no || '') : '';
            
            html += `
                <div class="program-card mb-3">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="font-medium">${memberName}</div>
                            <div class="text-sm text-gray-600">SL: ${slNo} | AD: ${memberAdNo}</div>
                        </div>
                        <div class="text-right">
                            <div class="program-code">${programCode}</div>
                            <div class="text-xs text-gray-500">${programName}</div>
                        </div>
                    </div>
                    <div class="mt-2">
                        <button onclick="removeAssignment('${slNo}', '${programCode}')" 
                                class="text-red-600 hover:text-red-800 text-sm">
                            <i class="fas fa-trash mr-1"></i> Remove
                        </button>
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
        const member = users.find(u => {
            const userSlNo = u['sl:no'] || u.sl_no || '';
            const userTeam = u.team || '';
            return userSlNo == memberSlNo && userTeam == currentUser.team;
        });
        
        if (!member) {
            alert('Member not found in your team');
            return;
        }
        
        const memberName = member.name || '';
        
        // Check if already registered
        const registrationSheet = `registration_team_${currentUser.team}`;
        const registrations = await api.getSheet(registrationSheet);
        
        const alreadyRegistered = Array.isArray(registrations) ? 
            registrations.some(reg => {
                const regSlNo = reg['sl:no'] || reg.sl_no || '';
                const regProgramCode = reg.program_code || '';
                return regSlNo == memberSlNo && regProgramCode === programCode;
            }) : false;
        
        if (alreadyRegistered) {
            alert('This member is already registered for this program');
            return;
        }
        
        // Get program type
        const programType = getProgramType(programCode);
        
        // Add registration
        const rowData = {
            'program_code': programCode,
            'program': programType + ' Program',
            'sl:no': memberSlNo,
            'name': memberName,
            'team': currentUser.team
        };
        
        const result = await api.addRow(registrationSheet, rowData);
        
        if (result && !result.error) {
            alert('Program assigned successfully!');
            document.getElementById('assignProgramForm').reset();
            await loadAssignedPrograms();
            await loadTeamMembers();
        } else {
            throw new Error(result?.error || 'Failed to assign program');
        }
        
    } catch (error) {
        console.error('Error assigning program:', error);
        alert('Error assigning program: ' + error.message);
    }
});

async function removeAssignment(slNo, programCode) {
    if (!confirm('Are you sure you want to remove this assignment?')) {
        return;
    }
    
    try {
        alert(`Removing assignment:\nSL No: ${slNo}\nProgram: ${programCode}\n\nNote: Delete functionality requires Google Apps Script implementation.`);
        // In a full implementation, you would call an API to delete the row
    } catch (error) {
        console.error('Error removing assignment:', error);
        alert('Error removing assignment');
    }
}

// =============================
// 🏢 All Teams Functions (Admin) - FIXED
// =============================
async function loadAllTeams() {
    try {
        // Set default team tab
        window.showTeamTab(1);
        await loadTeamData(1);
        
    } catch (error) {
        console.error('Error loading all teams:', error);
    }
}

async function loadTeamData(teamNumber) {
    try {
        // Load team members
        const users = await api.getSheet('user_credentials');
        const teamMembers = users.filter(user => {
            const userTeam = user.team || '';
            return userTeam == teamNumber.toString();
        });
        
        // Load team registrations
        const registrationSheet = `registration_team_${teamNumber}`;
        const registrations = await api.getSheet(registrationSheet);
        
        const teamContent = document.getElementById('teamContent');
        if (!teamContent) return;
        
        if (teamMembers.length === 0) {
            teamContent.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    No members in Team ${teamNumber}
                </div>
            `;
            return;
        }
        
        // Get program counts
        const programCounts = await api.getSheet('program_count');
        
        let html = `
            <div class="mb-6">
                <h4 class="font-bold text-gray-800 mb-4">Team ${teamNumber} Members (${teamMembers.length})</h4>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>SL No</th>
                                <th>Name</th>
                                <th>Admission No</th>
                                <th>Role</th>
                                <th>Programs</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        teamMembers.forEach(member => {
            const slNo = member['sl:no'] || member.sl_no || '';
            const name = member.name || '';
            const adNo = member['ad:no'] || member.ad_no || '';
            const role = (member.role || '').toLowerCase();
            
            // Find program count
            let programCount = 0;
            if (Array.isArray(programCounts)) {
                const countData = programCounts.find(pc => {
                    const pcSlNo = pc['sl:no'] || pc.sl_no || '';
                    return pcSlNo == slNo;
                });
                programCount = countData ? parseInt(countData.count || 0) : 0;
            }
            
            html += `
                <tr>
                    <td>${slNo}</td>
                    <td>${name}</td>
                    <td>${adNo}</td>
                    <td>
                        <span class="${role === 'admin' ? 'role-admin' : 
                                     role === 'leader' ? 'role-leader' : 
                                     role === 'assistant' ? 'role-assistant' : 
                                     'role-member'}">
                            ${role}
                        </span>
                    </td>
                    <td class="text-center">${programCount}</td>
                    <td>
                        <button onclick="adminViewMemberDetails('${teamNumber}', '${slNo}')" 
                                class="text-blue-600 hover:text-blue-800 mr-2">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="adminAssignProgram('${teamNumber}', '${slNo}', '${name}')" 
                                class="text-green-600 hover:text-green-800">
                            <i class="fas fa-plus"></i>
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
                <h4 class="font-bold text-gray-800 mb-4">Team ${teamNumber} Registrations</h4>
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
                                <th>Program Type</th>
                                <th>SL No</th>
                                <th>Name</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            registrations.forEach(reg => {
                const programCode = reg.program_code || '';
                const programType = getProgramType(programCode);
                const slNo = reg['sl:no'] || reg.sl_no || '';
                const name = reg.name || '';
                
                html += `
                    <tr>
                        <td>${programCode}</td>
                        <td>${programType}</td>
                        <td>${slNo}</td>
                        <td>${name}</td>
                        <td>
                            <button onclick="adminRemoveRegistration('${teamNumber}', '${programCode}', '${slNo}')" 
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

async function adminViewMemberDetails(teamNumber, slNo) {
    try {
        const users = await api.getSheet('user_credentials');
        const member = users.find(u => {
            const userTeam = u.team || '';
            const userSlNo = u['sl:no'] || u.sl_no || '';
            return userTeam == teamNumber.toString() && userSlNo == slNo;
        });
        
        if (!member) {
            alert('Member not found');
            return;
        }
        
        // Get member's programs
        const regSheet = await api.getSheet(`registration_team_${teamNumber}`);
        const memberPrograms = Array.isArray(regSheet) ? 
            regSheet.filter(reg => {
                const regSlNo = reg['sl:no'] || reg.sl_no || '';
                return regSlNo == slNo;
            }) : [];
        
        // Get program count
        const programCounts = await api.getSheet('program_count');
        let countData = null;
        if (Array.isArray(programCounts)) {
            countData = programCounts.find(pc => {
                const pcSlNo = pc['sl:no'] || pc.sl_no || '';
                return pcSlNo == slNo;
            });
        }
        
        let message = `Member Details:\n\n`;
        message += `SL No: ${member['sl:no'] || member.sl_no || ''}\n`;
        message += `Name: ${member.name || ''}\n`;
        message += `Admission No: ${member['ad:no'] || member.ad_no || ''}\n`;
        message += `Role: ${member.role || ''}\n`;
        message += `Team: ${member.team || ''}\n\n`;
        
        if (countData) {
            message += `Program Count:\n`;
            message += `Stage: ${countData.s || 0}\n`;
            message += `Non-Stage: ${countData.ns || 0}\n`;
            message += `Sports: ${countData.sp || 0}\n`;
            message += `Total: ${countData.count || 0}/12\n\n`;
        }
        
        message += `Registered Programs (${memberPrograms.length}):\n`;
        if (memberPrograms.length === 0) {
            message += `None\n`;
        } else {
            memberPrograms.forEach((program, index) => {
                const programCode = program.program_code || '';
                const programName = program.program || getProgramType(programCode);
                message += `${index + 1}. ${programCode} - ${programName}\n`;
            });
        }
        
        alert(message);
        
    } catch (error) {
        console.error('Error viewing member details:', error);
    }
}

async function adminAssignProgram(teamNumber, slNo, memberName) {
    try {
        // Load available programs from schedule
        const schedule = await api.getSheet('schedule');
        const programCodes = [...new Set(schedule.map(item => item.program_code || '').filter(Boolean))];
        
        // Load member's current programs
        const registrationSheet = `registration_team_${teamNumber}`;
        const registrations = await api.getSheet(registrationSheet);
        const memberPrograms = Array.isArray(registrations) ? 
            registrations.filter(reg => {
                const regSlNo = reg['sl:no'] || reg.sl_no || '';
                return regSlNo == slNo;
            }).map(reg => reg.program_code || '') : [];
        
        // Filter out already assigned programs
        const availablePrograms = programCodes.filter(code => !memberPrograms.includes(code));
        
        if (availablePrograms.length === 0) {
            alert(`${memberName} is already registered for all available programs.`);
            return;
        }
        
        let programList = availablePrograms.map(code => `${code} - ${getProgramType(code)}`).join('\n');
        const selectedCode = prompt(
            `Assign program to ${memberName} (Team ${teamNumber})\n\n` +
            `Available programs:\n${programList}\n\n` +
            `Enter program code:`
        );
        
        if (!selectedCode) return;
        
        const programCode = selectedCode.trim().toUpperCase();
        
        if (!availablePrograms.includes(programCode)) {
            alert(`Invalid program code. Please select from available programs.`);
            return;
        }
        
        // Check if already registered
        if (memberPrograms.includes(programCode)) {
            alert('This member is already registered for this program');
            return;
        }
        
        // Get program type
        const programType = getProgramType(programCode);
        
        // Add registration
        const rowData = {
            'program_code': programCode,
            'program': programType + ' Program',
            'sl:no': slNo,
            'name': memberName,
            'team': teamNumber
        };
        
        const result = await api.addRow(registrationSheet, rowData);
        
        if (result && !result.error) {
            alert('Program assigned successfully!');
            await loadTeamData(teamNumber);
        } else {
            throw new Error(result?.error || 'Failed to assign program');
        }
        
    } catch (error) {
        console.error('Error assigning program as admin:', error);
        alert('Error assigning program: ' + error.message);
    }
}

async function adminRemoveRegistration(teamNumber, programCode, slNo) {
    if (!confirm('Are you sure you want to remove this registration?')) {
        return;
    }
    
    try {
        alert(`Removing registration:\nTeam: ${teamNumber}\nProgram: ${programCode}\nSL No: ${slNo}\n\nNote: Delete functionality requires Google Apps Script implementation.`);
        // In a full implementation, you would call an API to delete the row
    } catch (error) {
        console.error('Error removing registration:', error);
    }
}

// =============================
// 🧮 Program Count Functions (Admin) - FIXED
// =============================
async function loadProgramCount() {
    try {
        const programCounts = await api.getSheet('program_count');
        const tableBody = document.getElementById('programCountTableBody');
        
        if (!tableBody) return;
        
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
        
        // Get user names for better display
        const users = await api.getSheet('user_credentials');
        
        let html = '';
        programCounts.forEach(pc => {
            const slNo = pc['sl:no'] || pc.sl_no || '';
            const name = pc.name || '';
            const team = pc.team || '';
            const stageCount = parseInt(pc.s || 0);
            const nonStageCount = parseInt(pc.ns || 0);
            const sportsCount = parseInt(pc.sp || 0);
            const totalCount = parseInt(pc.count || 0);
            
            // Find user role
            let role = '';
            if (Array.isArray(users)) {
                const user = users.find(u => {
                    const userSlNo = u['sl:no'] || u.sl_no || '';
                    return userSlNo == slNo;
                });
                role = user ? (user.role || '').toLowerCase() : '';
            }
            
            // Check requirements
            const meetsStage = stageCount >= 1;
            const meetsNonStage = nonStageCount >= 1;
            const meetsSports = sportsCount >= 1;
            const meetsTotal = totalCount <= 12;
            
            const hasWarning = !meetsStage || !meetsNonStage || !meetsSports || !meetsTotal;
            
            let status = '';
            let statusDetails = [];
            if (!meetsStage) statusDetails.push('Stage < 1');
            if (!meetsNonStage) statusDetails.push('Non-Stage < 1');
            if (!meetsSports) statusDetails.push('Sports < 1');
            if (!meetsTotal) statusDetails.push('Total > 12');
            
            if (hasWarning) {
                status = `<span class="text-red-600 font-medium" title="${statusDetails.join(', ')}">⚠️ Needs ${statusDetails.length} fix(es)</span>`;
            } else {
                status = '<span class="text-green-600 font-medium">✓ OK</span>';
            }
            
            html += `
                <tr class="${hasWarning ? 'program-warning' : ''}">
                    <td>${slNo}</td>
                    <td>
                        <div class="font-medium">${name}</div>
                        <div class="text-xs text-gray-500">${role}</div>
                    </td>
                    <td>
                        <span class="team-${team} team-badge">Team ${team}</span>
                    </td>
                    <td class="text-center ${meetsStage ? '' : 'text-red-600 font-bold'}">${stageCount}</td>
                    <td class="text-center ${meetsNonStage ? '' : 'text-red-600 font-bold'}">${nonStageCount}</td>
                    <td class="text-center ${meetsSports ? '' : 'text-red-600 font-bold'}">${sportsCount}</td>
                    <td class="text-center font-bold ${meetsTotal ? '' : 'text-red-600'}">${totalCount}/12</td>
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
// 🏅 Manage Results Functions (Admin) - FIXED
// =============================
async function loadManageResults() {
    try {
        // Set default result type
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
        if (!resultsContent) return;
        
        if (!Array.isArray(results) || results.length === 0) {
            resultsContent.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    No results available for ${getResultTypeName(type)}
                </div>
            `;
            return;
        }
        
        // Get registrations for this type
        const registrations = [];
        for (let team = 1; team <= 3; team++) {
            const regSheet = await api.getSheet(`registration_team_${team}`);
            if (Array.isArray(regSheet)) {
                regSheet.forEach(reg => {
                    const programCode = reg.program_code || '';
                    if (programCode.startsWith(type.charAt(0).toUpperCase())) {
                        registrations.push({
                            ...reg,
                            team: team
                        });
                    }
                });
            }
        }
        
        let html = `
            <div class="mb-4">
                <h4 class="font-bold text-gray-800 mb-4">${getResultTypeName(type)} Results</h4>
                <div class="mb-4">
                    <button onclick="addNewResult('${type}')" class="btn btn-primary">
                        <i class="fas fa-plus mr-2"></i>Add New Result
                    </button>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Program Code</th>
                                <th>SL No</th>
                                <th>Name</th>
                                <th>Team</th>
                                <th>Position</th>
                                <th>Grade</th>
                                <th>Points</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        results.forEach(result => {
            const programCode = result.program_code || '';
            const slNo = result['sl:no'] || result.sl_no || '';
            const name = result.name || '';
            const position = result.position || 'N/A';
            const grade = result.grade || 'N/A';
            const points = result.points || '0';
            
            // Find team
            let team = '';
            const registration = registrations.find(reg => {
                const regSlNo = reg['sl:no'] || reg.sl_no || '';
                const regProgramCode = reg.program_code || '';
                return regSlNo == slNo && regProgramCode === programCode;
            });
            if (registration) {
                team = registration.team || '';
            }
            
            html += `
                <tr>
                    <td>${programCode}</td>
                    <td>${slNo}</td>
                    <td>${name}</td>
                    <td>
                        ${team ? `<span class="team-${team} team-badge">Team ${team}</span>` : ''}
                    </td>
                    <td>
                        ${position <= 3 ? `<div class="position-${position} position-badge inline-flex">${position}</div>` : position}
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
                        <button onclick="editResult('${type}', '${programCode}', '${slNo}')" 
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
            results.find(r => {
                const rProgramCode = r.program_code || '';
                const rSlNo = r['sl:no'] || r.sl_no || '';
                return rProgramCode === programCode && rSlNo == slNo;
            }) : null;
        
        if (!result) {
            alert('Result not found');
            return;
        }
        
        const modal = document.getElementById('editResultModal');
        const modalContent = document.getElementById('editResultModalContent');
        
        if (!modal || !modalContent) return;
        
        const isGroup = type.startsWith('g');
        const positionValues = isGroup ? 
            {1: 10, 2: 7, 3: 5} : 
            {1: 3, 2: 2, 3: 1};
        const gradeValues = {A: 3, B: 2, C: 1};
        
        const currentPosition = result.position || '';
        const currentGrade = result.grade || '';
        const currentPoints = result.points || 0;
        
        modalContent.innerHTML = `
            <form id="editResultForm" onsubmit="updateResult(event, '${type}', '${programCode}', '${slNo}')">
                <div class="space-y-4">
                    <div class="form-group">
                        <label class="form-label">Program Code</label>
                        <input type="text" value="${programCode}" class="form-input" readonly>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">SL No</label>
                        <input type="text" value="${slNo}" class="form-input" readonly>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Name</label>
                        <input type="text" value="${result.name || ''}" class="form-input" readonly>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="form-label">Position</label>
                            <select id="editPosition" class="form-select" required>
                                <option value="">Select position</option>
                                <option value="1" ${currentPosition == '1' ? 'selected' : ''}>1st (${positionValues[1]} points)</option>
                                <option value="2" ${currentPosition == '2' ? 'selected' : ''}>2nd (${positionValues[2]} points)</option>
                                <option value="3" ${currentPosition == '3' ? 'selected' : ''}>3rd (${positionValues[3]} points)</option>
                                <option value="4" ${currentPosition == '4' ? 'selected' : ''}>4th (0 points)</option>
                                <option value="5" ${currentPosition == '5' ? 'selected' : ''}>5th (0 points)</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Grade</label>
                            <select id="editGrade" class="form-select" required>
                                <option value="">Select grade</option>
                                <option value="A" ${currentGrade == 'A' ? 'selected' : ''}>A (${gradeValues['A']} points)</option>
                                <option value="B" ${currentGrade == 'B' ? 'selected' : ''}>B (${gradeValues['B']} points)</option>
                                <option value="C" ${currentGrade == 'C' ? 'selected' : ''}>C (${gradeValues['C']} points)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Calculated Points</label>
                        <input type="text" id="calculatedPoints" class="form-input" readonly value="${currentPoints}">
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
                pointsInput.value = currentPoints;
            }
        }
        
        if (positionSelect) positionSelect.addEventListener('change', calculatePoints);
        if (gradeSelect) gradeSelect.addEventListener('change', calculatePoints);
        
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
        const sheetName = `${type}_result`;
        
        // Get the result to update name
        const results = await api.getSheet(sheetName);
        const result = Array.isArray(results) ? 
            results.find(r => {
                const rProgramCode = r.program_code || '';
                const rSlNo = r['sl:no'] || r.sl_no || '';
                return rProgramCode === programCode && rSlNo == slNo;
            }) : null;
        
        if (!result) {
            showEditResultError('Result not found');
            return;
        }
        
        // Update data
        const updateData = {
            'program_code': programCode,
            'sl:no': slNo,
            'name': result.name || '',
            'position': position,
            'grade': grade,
            'points': calculatedPoints
        };
        
        alert(`Update Result:\n\nType: ${type}\nProgram: ${programCode}\nSL No: ${slNo}\nPosition: ${position}\nGrade: ${grade}\nPoints: ${calculatedPoints}\n\nNote: Update functionality requires Google Apps Script implementation for updating existing rows.`);
        
        // In a full implementation, you would call an API to update the row
        // For now, we'll just reload the data
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
        // Get all registrations for this type
        let allRegistrations = [];
        for (let team = 1; team <= 3; team++) {
            const regSheet = await api.getSheet(`registration_team_${team}`);
            if (Array.isArray(regSheet)) {
                regSheet.forEach(reg => {
                    const programCode = reg.program_code || '';
                    if (programCode.startsWith(type.charAt(0).toUpperCase())) {
                        allRegistrations.push({
                            ...reg,
                            team: team
                        });
                    }
                });
            }
        }
        
        if (allRegistrations.length === 0) {
            alert(`No registrations found for ${getResultTypeName(type)} programs`);
            return;
        }
        
        // Get unique program codes
        const programCodes = [...new Set(allRegistrations.map(reg => reg.program_code || '').filter(Boolean))];
        
        if (programCodes.length === 0) {
            alert(`No program codes found for ${getResultTypeName(type)}`);
            return;
        }
        
        // Show form to add result
        let programsHtml = '';
        programCodes.forEach(code => {
            programsHtml += `<option value="${code}">${code} - ${getProgramType(code)}</option>`;
        });
        
        let registrationsHtml = '';
        allRegistrations.forEach(reg => {
            const slNo = reg['sl:no'] || reg.sl_no || '';
            const name = reg.name || '';
            const programCode = reg.program_code || '';
            registrationsHtml += `<option value="${slNo}|${programCode}">${slNo} - ${name} (${programCode})</option>`;
        });
        
        const modal = document.getElementById('editResultModal');
        const modalContent = document.getElementById('editResultModalContent');
        
        if (!modal || !modalContent) return;
        
        const isGroup = type.startsWith('g');
        const positionValues = isGroup ? 
            {1: 10, 2: 7, 3: 5} : 
            {1: 3, 2: 2, 3: 1};
        const gradeValues = {A: 3, B: 2, C: 1};
        
        modalContent.innerHTML = `
            <form id="addResultForm" onsubmit="saveNewResult(event, '${type}')">
                <div class="space-y-4">
                    <div class="form-group">
                        <label class="form-label">Select Registration</label>
                        <select id="newResultRegistration" class="form-select" required>
                            <option value="">Select registration</option>
                            ${registrationsHtml}
                        </select>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="form-label">Position</label>
                            <select id="newResultPosition" class="form-select" required>
                                <option value="">Select position</option>
                                <option value="1">1st (${positionValues[1]} points)</option>
                                <option value="2">2nd (${positionValues[2]} points)</option>
                                <option value="3">3rd (${positionValues[3]} points)</option>
                                <option value="4">4th (0 points)</option>
                                <option value="5">5th (0 points)</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Grade</label>
                            <select id="newResultGrade" class="form-select" required>
                                <option value="">Select grade</option>
                                <option value="A">A (${gradeValues['A']} points)</option>
                                <option value="B">B (${gradeValues['B']} points)</option>
                                <option value="C">C (${gradeValues['C']} points)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Calculated Points</label>
                        <input type="text" id="newResultPoints" class="form-input" readonly>
                    </div>
                    
                    <div id="addResultError" class="alert alert-error hidden"></div>
                    
                    <div class="flex justify-end space-x-3">
                        <button type="button" onclick="closeEditResultModal()" class="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-plus mr-2"></i>Add Result
                        </button>
                    </div>
                </div>
            </form>
        `;
        
        // Calculate points on change
        const positionSelect = document.getElementById('newResultPosition');
        const gradeSelect = document.getElementById('newResultGrade');
        const pointsInput = document.getElementById('newResultPoints');
        
        function calculateNewPoints() {
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
        
        if (positionSelect) positionSelect.addEventListener('change', calculateNewPoints);
        if (gradeSelect) gradeSelect.addEventListener('change', calculateNewPoints);
        
        modal.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error adding new result:', error);
        alert('Error: ' + error.message);
    }
}

async function saveNewResult(event, type) {
    event.preventDefault();
    
    const registration = document.getElementById('newResultRegistration').value;
    const position = document.getElementById('newResultPosition').value;
    const grade = document.getElementById('newResultGrade').value;
    const calculatedPoints = document.getElementById('newResultPoints').value;
    
    const errorDiv = document.getElementById('addResultError');
    
    if (!registration) {
        if (errorDiv) {
            errorDiv.textContent = 'Please select a registration';
            errorDiv.classList.remove('hidden');
        }
        return;
    }
    
    if (!position || !grade) {
        if (errorDiv) {
            errorDiv.textContent = 'Please select both position and grade';
            errorDiv.classList.remove('hidden');
        }
        return;
    }
    
    try {
        const [slNo, programCode] = registration.split('|');
        
        // Find registration details
        let registrationDetails = null;
        for (let team = 1; team <= 3; team++) {
            const regSheet = await api.getSheet(`registration_team_${team}`);
            if (Array.isArray(regSheet)) {
                const reg = regSheet.find(r => {
                    const rSlNo = r['sl:no'] || r.sl_no || '';
                    const rProgramCode = r.program_code || '';
                    return rSlNo == slNo && rProgramCode === programCode;
                });
                if (reg) {
                    registrationDetails = { ...reg, team: team };
                    break;
                }
            }
        }
        
        if (!registrationDetails) {
            if (errorDiv) {
                errorDiv.textContent = 'Registration not found';
                errorDiv.classList.remove('hidden');
            }
            return;
        }
        
        // Add result
        const rowData = {
            'program_code': programCode,
            'sl:no': slNo,
            'name': registrationDetails.name || '',
            'position': position,
            'grade': grade,
            'points': calculatedPoints
        };
        
        const result = await api.addRow(`${type}_result`, rowData);
        
        if (result && !result.error) {
            closeEditResultModal();
            alert('Result added successfully!');
            await loadResultsByType(type);
        } else {
            throw new Error(result?.error || 'Failed to add result');
        }
        
    } catch (error) {
        console.error('Error saving new result:', error);
        if (errorDiv) {
            errorDiv.textContent = 'Error: ' + error.message;
            errorDiv.classList.remove('hidden');
        }
    }
}

// =============================
// 📅 Admin Schedule Functions - FIXED
// =============================
async function loadAdminSchedule() {
    try {
        const schedule = await api.getSheet('schedule');
        const tableBody = document.getElementById('adminScheduleTableBody');
        
        if (!tableBody) return;
        
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
            let date;
            try {
                date = new Date(item.date || new Date());
            } catch (e) {
                date = new Date();
            }
            
            const formattedDate = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            const time = item.time || '';
            const programCode = item.program_code || '';
            const day = item.day || date.toLocaleDateString('en-US', { weekday: 'long' });
            
            html += `
                <tr>
                    <td>${formattedDate}</td>
                    <td>${time}</td>
                    <td>
                        <span class="program-code">${programCode}</span>
                        <div class="text-xs text-gray-500">${day}</div>
                    </td>
                    <td>
                        <button onclick="editSchedule('${item.date || ''}', '${time}', '${programCode}')" 
                                class="text-blue-600 hover:text-blue-800 mr-2">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteSchedule('${item.date || ''}', '${time}', '${programCode}')" 
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
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        
        // Add to schedule
        const rowData = {
            'date': formattedDate,
            'day': dayName,
            'time': time,
            'program_code': programCode
        };
        
        const result = await api.addRow('schedule', rowData);
        
        if (result && !result.error) {
            alert('Schedule added successfully!');
            document.getElementById('addScheduleForm').reset();
            await loadAdminSchedule();
            await loadSchedule(); // Reload user schedule view
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
        const newDate = prompt('Enter new date (YYYY-MM-DD):', date);
        const newTime = prompt('Enter new time:', time);
        const newProgramCode = prompt('Enter new program code:', programCode);
        
        if (newDate && newTime && newProgramCode) {
            alert(`Schedule updated:\n\nDate: ${newDate}\nTime: ${newTime}\nProgram Code: ${newProgramCode}\n\nNote: Edit functionality requires Google Apps Script implementation.`);
            // In a full implementation, you would call an API to update the row
        }
    } catch (error) {
        console.error('Error editing schedule:', error);
    }
}

async function deleteSchedule(date, time, programCode) {
    if (!confirm('Are you sure you want to delete this schedule?')) {
        return;
    }
    
    try {
        alert(`Delete Schedule:\n\nDate: ${date}\nTime: ${time}\nProgram Code: ${programCode}\n\nNote: Delete functionality requires Google Apps Script implementation.`);
        // In a full implementation, you would call an API to delete the row
    } catch (error) {
        console.error('Error deleting schedule:', error);
    }
}

// =============================
// 🔐 Change Password Functions - FIXED
// =============================
function openChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (!modal) return;
    
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
    
    if (!errorDiv || !successDiv) return;
    
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
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            login();
        });
    }
    
    // Change password form
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            changePassword(e);
        });
    }
    
    // Assign program form
    const assignProgramForm = document.getElementById('assignProgramForm');
    if (assignProgramForm) {
        assignProgramForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Handled in the form's own event listener
        });
    }
    
    // Add schedule form
    const addScheduleForm = document.getElementById('addScheduleForm');
    if (addScheduleForm) {
        addScheduleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Handled in the form's own event listener
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
            // Reload the page
            location.reload();
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
window.showPage = showPage;
window.logout = logout;
window.openChangePasswordModal = openChangePasswordModal;
window.showResultType = function(type) {
    currentResultType = type;
    loadResultsByType(type);
};

console.log('%c🎉 FEST MANAGEMENT SYSTEM LOADED 🎉', 'color: #3b82f6; font-size: 16px; font-weight: bold;');
console.log('%cRun initializeSheets() in console to setup sheets', 'color: #059669; font-size: 12px;');
console.log('%cSample Login:', 'color: #f59e0b; font-size: 12px;');
console.log('%cAdmin: ADM001 / admin123', 'color: #dc2626;');
console.log('%cTeam 1 Leader: T1L001 / t1leader', 'color: #3b82f6;');
console.log('%cTeam 1 Member: T1M001 / t1m001', 'color: #10b981;');
