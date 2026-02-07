// =============================
// 🌐 FEST MANAGEMENT SYSTEM
// Complete JavaScript Implementation
// Mobile-Optimized & Production Ready
// =============================

// Global Variables
let currentUser = null;
let currentPage = 'dashboard';
let currentTeamTab = 1;
let currentResultType = 's';
let mobileMenuOpen = false;

// =============================
// 📊 Google Sheets API Integration
// =============================
class GoogleSheetsAPI {
    constructor() {
        // ⚠️ REPLACE WITH YOUR GOOGLE APPS SCRIPT WEB APP URL
        this.apiUrl = "https://script.google.com/macros/s/AKfycbwF_EwH5GNgixEo3iynpTM8URVxS3a58EUUhtwdGnPeGd41zE0p0Dw4Itp4j3RFa8kTEw/exec";
        this.cache = new Map();
        this.cacheTimeout = 30 * 1000; // 30 seconds
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
            console.log(`📥 Fetching ${sheetName}...`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            let data;
            
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('❌ Failed to parse JSON:', e);
                data = [];
            }
            
            if (useCache && data) {
                this.cache.set(cacheKey, { data, timestamp: now });
            }
            
            console.log(`✅ Loaded ${sheetName}: ${Array.isArray(data) ? data.length : 0} rows`);
            return data;
        } catch (error) {
            console.error(`❌ Error fetching ${sheetName}:`, error);
            return [];
        }
    }

    async addRow(sheetName, rowData) {
        try {
            console.log(`📤 Adding row to ${sheetName}:`, rowData);
            
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
            
            console.log(`✅ Add row result:`, result);
            return result;
        } catch (error) {
            console.error('❌ Error adding row:', error);
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
            console.error('❌ Error updating password:', error);
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
                console.error('❌ Login response parse error:', e);
                return { success: false, error: 'Invalid response from server' };
            }
            
            return result;
        } catch (error) {
            console.error('❌ Login error:', error);
            return { success: false, error: 'Network error: ' + error.message };
        }
    }

    clearCache() {
        this.cache.clear();
    }
}

const api = new GoogleSheetsAPI();

// =============================
// 🔧 Utility Functions
// =============================

function showLoading(show = true) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

function showToast(message, type = 'info', duration = 3000) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 max-w-sm p-4 rounded-lg shadow-lg z-50 alert alert-${type}`;
    toast.style.animation = 'slideUp 0.3s ease-out';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function getProgramType(programCode) {
    if (!programCode) return 'General';
    const code = programCode.toString().toUpperCase();
    if (code.startsWith('GS') && !code.startsWith('GSP')) return 'Group Stage';
    if (code.startsWith('GNS')) return 'Group Non-Stage';
    if (code.startsWith('GSP')) return 'Group Sports';
    if (code.startsWith('S') && !code.startsWith('SP')) return 'Stage';
    if (code.startsWith('NS')) return 'Non-Stage';
    if (code.startsWith('SP')) return 'Sports';
    return 'General';
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (e) {
        return dateString;
    }
}

function formatTime(timeString) {
    if (!timeString) return '';
    // Handle both 12-hour and 24-hour formats
    try {
        const time = timeString.toString().trim();
        if (time.includes('AM') || time.includes('PM')) {
            return time;
        }
        // Convert 24-hour to 12-hour
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    } catch (e) {
        return timeString;
    }
}

// =============================
// 🔑 Authentication Functions
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
        
        console.log('🔐 Login result:', result);
        
        if (result.success && result.user) {
            currentUser = {
                sl_no: result.user.sl_no || result.user['sl:no'] || '0',
                ad_no: result.user.ad_no || result.user['ad:no'] || username,
                name: result.user.name || 'User',
                role: result.user.role?.toLowerCase() || 'member',
                team: result.user.team || '0'
            };

            console.log('✅ Logged in as:', currentUser);

            // Hide login page, show dashboard
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('dashboardContainer').classList.remove('hidden');
            
            // Update UI based on role
            updateUIForRole();
            
            // Load dashboard data
            showLoading(true);
            await loadDashboard();
            showLoading(false);
            
            showLoginError('');
            showToast(`Welcome, ${currentUser.name}!`, 'success');
        } else {
            showLoginError(result.error || 'Invalid admission number or password');
        }
    } catch (error) {
        console.error('❌ Login error:', error);
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
    
    showToast('Logged out successfully', 'info');
}

// =============================
// 🎭 UI Update Functions
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

    const roleDisplay = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    
    if (welcomeUser) welcomeUser.textContent = `Welcome, ${currentUser.name}`;
    if (profileName) profileName.textContent = currentUser.name;
    if (profileUsername) profileUsername.textContent = `@${currentUser.ad_no}`;
    
    if (profileRole) {
        profileRole.textContent = roleDisplay;
        profileRole.className = `text-xs px-2 py-1 bg-white/20 rounded-full role-${currentUser.role}`;
    }
    
    if (profileTeam && currentUser.team !== '0') {
        profileTeam.textContent = `Team ${currentUser.team}`;
        profileTeam.className = `text-xs px-2 py-1 bg-white/20 rounded-full ml-1 team-${currentUser.team}`;
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
    
    // Load mobile navigation
    loadMobileNavigation();
}

function loadMobileNavigation() {
    const navContent = document.getElementById('mobileNavContent');
    if (!navContent || !currentUser) return;
    
    const role = currentUser.role;
    
    let html = `
        <div class="mobile-nav-section">
            <div class="mobile-nav-section-title">Main Menu</div>
            <button onclick="showPage('dashboard')" class="mobile-nav-btn ${currentPage === 'dashboard' ? 'active' : ''}">
                <i class="fas fa-home"></i>Dashboard
            </button>
            <button onclick="showPage('schedule')" class="mobile-nav-btn ${currentPage === 'schedule' ? 'active' : ''}">
                <i class="fas fa-calendar-alt"></i>Schedule
            </button>
            <button onclick="showPage('programs')" class="mobile-nav-btn ${currentPage === 'programs' ? 'active' : ''}">
                <i class="fas fa-list-alt"></i>My Programs
            </button>
            <button onclick="showPage('results')" class="mobile-nav-btn ${currentPage === 'results' ? 'active' : ''}">
                <i class="fas fa-chart-line"></i>Results
            </button>
        </div>
    `;
    
    if (role === 'leader' || role === 'assistant') {
        html += `
            <div class="mobile-nav-section">
                <div class="mobile-nav-section-title">Team Management</div>
                <button onclick="showPage('teamMembers')" class="mobile-nav-btn ${currentPage === 'teamMembers' ? 'active' : ''}">
                    <i class="fas fa-users"></i>Team Members
                </button>
                <button onclick="showPage('assignPrograms')" class="mobile-nav-btn ${currentPage === 'assignPrograms' ? 'active' : ''}">
                    <i class="fas fa-tasks"></i>Assign Programs
                </button>
            </div>
        `;
    }
    
    if (role === 'admin') {
        html += `
            <div class="mobile-nav-section">
                <div class="mobile-nav-section-title">Administration</div>
                <button onclick="showPage('allTeams')" class="mobile-nav-btn ${currentPage === 'allTeams' ? 'active' : ''}">
                    <i class="fas fa-users-cog"></i>All Teams
                </button>
                <button onclick="showPage('programCount')" class="mobile-nav-btn ${currentPage === 'programCount' ? 'active' : ''}">
                    <i class="fas fa-calculator"></i>Program Count
                </button>
                <button onclick="showPage('manageResults')" class="mobile-nav-btn ${currentPage === 'manageResults' ? 'active' : ''}">
                    <i class="fas fa-edit"></i>Manage Results
                </button>
                <button onclick="showPage('adminSchedule')" class="mobile-nav-btn ${currentPage === 'adminSchedule' ? 'active' : ''}">
                    <i class="fas fa-calendar-plus"></i>Manage Schedule
                </button>
            </div>
        `;
    }
    
    html += `
        <div class="mobile-nav-section">
            <div class="mobile-nav-section-title">Account</div>
            <button onclick="openChangePasswordModal()" class="mobile-nav-btn">
                <i class="fas fa-key"></i>Change Password
            </button>
            <button onclick="logout()" class="mobile-nav-btn text-red-600">
                <i class="fas fa-sign-out-alt"></i>Logout
            </button>
        </div>
    `;
    
    navContent.innerHTML = html;
}

// =============================
// 📱 Mobile Menu Functions
// =============================

function toggleMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const overlay = document.getElementById('mobileMenuOverlay');
    const sidebar = document.getElementById('mobileMenuSidebar');
    
    mobileMenuOpen = !mobileMenuOpen;
    
    if (mobileMenuOpen) {
        btn.classList.add('active');
        overlay.classList.add('active');
        sidebar.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        btn.classList.remove('active');
        overlay.classList.remove('active');
        sidebar.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function closeMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const overlay = document.getElementById('mobileMenuOverlay');
    const sidebar = document.getElementById('mobileMenuSidebar');
    
    mobileMenuOpen = false;
    btn.classList.remove('active');
    overlay.classList.remove('active');
    sidebar.classList.remove('active');
    document.body.style.overflow = '';
}

// =============================
// 📍 Navigation Functions
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
        
        // Update mobile navigation
        loadMobileNavigation();
        
        // Close mobile menu if open
        if (mobileMenuOpen) {
            closeMobileMenu();
        }
        
        // Show loading
        showLoading(true);
        
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
        
        showLoading(false);
    } catch (error) {
        console.error('❌ Error showing page:', error);
        showLoading(false);
        showToast('Error loading page: ' + error.message, 'error');
    }
}

// =============================
// 🏠 Dashboard Functions
// =============================

async function loadDashboard() {
    if (!currentUser) return;

    try {
        console.log('📊 Loading dashboard...');
        
        const dashboardInfo = document.getElementById('dashboardInfo');
        const totalPrograms = document.getElementById('totalPrograms');
        const completedPrograms = document.getElementById('completedPrograms');
        const totalPoints = document.getElementById('totalPoints');
        const teamRank = document.getElementById('teamRank');

        // Update dashboard info
        if (dashboardInfo) {
            const roleText = currentUser.role === 'admin' ? 'Admin' : 
                           currentUser.role === 'leader' ? 'Leader' :
                           currentUser.role === 'assistant' ? 'Assistant' : 'Member';
            dashboardInfo.textContent = currentUser.team !== '0' 
                ? `${roleText} of Team ${currentUser.team}` 
                : roleText;
        }

        // Load user's programs
        const registrationSheet = `registration_team_${currentUser.team}`;
        const registrations = await api.getSheet(registrationSheet);
        
        // Load all results
        const resultSheets = ['s_result', 'ns_result', 'sp_result', 'gs_result', 'gns_result', 'gsp_result'];
        const allResults = await Promise.all(resultSheets.map(sheet => api.getSheet(sheet)));
        
        // Calculate stats
        let userPrograms = [];
        let userPoints = 0;
        
        if (Array.isArray(registrations) && registrations.length > 0) {
            userPrograms = registrations.filter(reg => {
                const regSlNo = reg['sl:no'] || reg.sl_no || '';
                return regSlNo == currentUser.sl_no;
            });
            
            // Calculate points from results
            allResults.forEach(results => {
                if (Array.isArray(results) && results.length > 0) {
                    const userResults = results.filter(result => {
                        const resultSlNo = result['sl:no'] || result.sl_no || '';
                        return resultSlNo == currentUser.sl_no;
                    });
                    
                    userResults.forEach(result => {
                        const points = parseInt(result.points || 0);
                        userPoints += isNaN(points) ? 0 : points;
                    });
                }
            });
        }
        
        // Count completed programs
        let completedCount = 0;
        if (Array.isArray(userPrograms)) {
            userPrograms.forEach(program => {
                const programCode = program.program_code || '';
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
        if (currentUser.team !== '0') {
            const teamPoints = await calculateTeamPoints(currentUser.team);
            if (teamRank) teamRank.textContent = teamPoints.rank || '-';
        } else {
            if (teamRank) teamRank.textContent = '-';
        }
        
        // Load upcoming programs
        await loadUpcomingPrograms();

        console.log('✅ Dashboard loaded successfully');
    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
        showToast('Error loading dashboard', 'error');
    }
}

async function calculateTeamPoints(teamNumber) {
    try {
        const resultSheets = ['s_result', 'ns_result', 'sp_result', 'gs_result', 'gns_result', 'gsp_result'];
        const allResults = await Promise.all(resultSheets.map(sheet => api.getSheet(sheet)));
        
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
        
        // Convert to array and sort
        const teamsArray = Object.entries(teamTotals).map(([team, points]) => ({team, points}));
        teamsArray.sort((a, b) => b.points - a.points);
        
        // Find rank
        let rank = 1;
        for (let i = 0; i < teamsArray.length; i++) {
            if (teamsArray[i].team == teamNumber) {
                if (i > 0 && teamsArray[i].points === teamsArray[i-1].points) {
                    rank = i;
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
        console.error('❌ Error calculating team points:', error);
        return { points: 0, rank: '-', leaderboard: [] };
    }
}

async function loadUpcomingPrograms() {
    try {
        const schedule = await api.getSheet('schedule');
        const upcomingPrograms = document.getElementById('upcomingPrograms');
        
        if (!upcomingPrograms) return;
        
        if (!Array.isArray(schedule) || schedule.length === 0) {
            upcomingPrograms.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <p>No upcoming programs</p>
                </div>
            `;
            return;
        }
        
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
            upcomingPrograms.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <p>No upcoming programs in next 7 days</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        upcoming.forEach(item => {
            const itemDate = new Date(item.date || new Date());
            const dayName = item.day || itemDate.toLocaleDateString('en-US', { weekday: 'short' });
            const formattedDate = formatDate(item.date);
            const programCode = item.program_code || '';
            const time = formatTime(item.time || '');
            const programType = getProgramType(programCode);
            
            html += `
                <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:border-blue-400 transition-colors">
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="program-code">${programCode}</span>
                            <span class="text-xs text-gray-500 ml-2">${programType}</span>
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
        console.error('❌ Error loading upcoming programs:', error);
    }
}

// =============================
// 📅 Schedule Functions
// =============================

async function loadSchedule() {
    try {
        console.log('📅 Loading schedule...');
        
        const schedule = await api.getSheet('schedule');
        const tableBody = document.getElementById('scheduleTableBody');
        
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
            const formattedDate = formatDate(item.date);
            const time = formatTime(item.time || '');
            const programCode = item.program_code || '';
            const programType = getProgramType(programCode);
            const badgeClass = programType.toLowerCase().replace(/\s+/g, '');
            
            html += `
                <tr>
                    <td>${formattedDate}</td>
                    <td class="hide-mobile">${time}</td>
                    <td>
                        <span class="program-code">${programCode}</span>
                        <div class="text-xs text-gray-500 md:hidden">${time}</div>
                    </td>
                    <td class="hide-mobile">
                        <span class="badge badge-${badgeClass}">${programType}</span>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
        console.log('✅ Schedule loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading schedule:', error);
        const tableBody = document.getElementById('scheduleTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-8 text-red-500">
                        Error loading schedule
                    </td>
                </tr>
            `;
        }
    }
}

// =============================
// 📋 My Programs Functions
// =============================

async function loadMyPrograms() {
    if (!currentUser) return;

    try {
        console.log('📋 Loading my programs...');
        
        const registrationSheet = `registration_team_${currentUser.team}`;
        const registrations = await api.getSheet(registrationSheet);
        const programsList = document.getElementById('myProgramsList');
        
        if (!programsList) return;
        
        if (!Array.isArray(registrations) || registrations.length === 0) {
            programsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No programs registered yet</p>
                </div>
            `;
            return;
        }
        
        const myRegistrations = registrations.filter(reg => {
            const regSlNo = reg['sl:no'] || reg.sl_no || '';
            return regSlNo == currentUser.sl_no;
        });
        
        if (myRegistrations.length === 0) {
            programsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No programs registered yet</p>
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
            const badgeClass = programType.toLowerCase().replace(/\s+/g, '');
            
            html += `
                <div class="program-card ${hasResult ? 'border-green-500 bg-green-50' : ''}">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex-1">
                            <span class="program-code">${programCode}</span>
                            <span class="text-sm font-medium text-gray-700 ml-2">${programName}</span>
                        </div>
                        <div class="flex items-center space-x-2 flex-shrink-0 ml-2">
                            <span class="badge badge-${badgeClass}">${programType}</span>
                            ${hasResult ? `<span class="text-green-600 font-bold">${resultPoints} pts</span>` : ''}
                        </div>
                    </div>
                    <div class="text-sm text-gray-600">
                        <div class="flex justify-between items-center">
                            <span>Team: <span class="font-medium">${team}</span></span>
                            <span class="font-medium ${hasResult ? 'text-green-600' : 'text-yellow-600'}">
                                ${hasResult ? '✓ Completed' : '⏱ Upcoming'}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        programsList.innerHTML = html;
        console.log('✅ My programs loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading my programs:', error);
        showToast('Error loading programs', 'error');
    }
}

// =============================
// 🏆 My Results Functions
// =============================

async function loadMyResults() {
    if (!currentUser) return;

    try {
        console.log('🏆 Loading my results...');
        
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
        let allUserResults = [];
        
        // Process all results
        allResults.forEach((results, index) => {
            const sheetName = resultSheets[index];
            if (Array.isArray(results) && results.length > 0) {
                const userResults = results.filter(result => {
                    const resultSlNo = result['sl:no'] || result.sl_no || '';
                    return resultSlNo == currentUser.sl_no;
                });
                
                userResults.forEach(result => {
                    const points = parseInt(result.points || 0);
                    totalPoints += isNaN(points) ? 0 : points;
                    
                    // Categorize points
                    if (sheetName.includes('s_result') && !sheetName.includes('ns_result') && !sheetName.includes('gs_result')) {
                        stageTotal += points;
                    } else {
                        nonStageTotal += points;
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
        nonStagePoints.textContent = nonStageTotal;
        
        // Display results
        if (allUserResults.length === 0) {
            resultsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <p>No results available yet</p>
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
            
            const programType = getProgramType(programCode);
            const typeColor = type === 's' ? 'text-yellow-600' : 
                            type === 'ns' ? 'text-green-600' : 
                            type === 'sp' ? 'text-blue-600' : 'text-purple-600';
            
            html += `
                <div class="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                    <div class="flex justify-between items-center mb-3">
                        <div class="flex items-center space-x-3">
                            ${position <= 3 ? `<div class="position-${position} position-badge">${position}</div>` : ''}
                            <div>
                                <span class="program-code">${programCode}</span>
                                <span class="text-sm font-medium ${typeColor} ml-2">${programType}</span>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold text-green-600">${points}</div>
                            <div class="text-xs text-gray-500">points</div>
                        </div>
                    </div>
                    <div class="text-sm text-gray-600 flex justify-between">
                        <span>Grade: <span class="font-medium ${grade === 'A' ? 'text-green-600' : grade === 'B' ? 'text-yellow-600' : 'text-orange-600'}">${grade}</span></span>
                        <span>Position: <span class="font-medium">${position}</span></span>
                    </div>
                </div>
            `;
        });
        
        resultsList.innerHTML = html;
        console.log('✅ My results loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading my results:', error);
        showToast('Error loading results', 'error');
    }
}

// =============================
// 🔐 Change Password Functions
// =============================

function openChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    
    // Reset form
    document.getElementById('changePasswordForm').reset();
    document.getElementById('changePasswordError').classList.add('hidden');
    document.getElementById('changePasswordSuccess').classList.add('hidden');
    
    // Close mobile menu if open
    if (mobileMenuOpen) {
        closeMobileMenu();
    }
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').classList.add('hidden');
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
        showLoading(true);
        
        // First verify current password
        const loginResult = await api.login(currentUser.ad_no, currentPassword);
        if (!loginResult.success) {
            throw new Error('Current password is incorrect');
        }
        
        // Update password
        const result = await api.updatePassword(currentUser.ad_no, newPassword);
        
        showLoading(false);
        
        if (result && !result.error) {
            successDiv.textContent = 'Password changed successfully! Logging out...';
            successDiv.classList.remove('hidden');
            
            // Clear form
            document.getElementById('changePasswordForm').reset();
            
            // Logout after 2 seconds
            setTimeout(() => {
                closeChangePasswordModal();
                logout();
            }, 2000);
        } else {
            throw new Error(result?.error || 'Failed to update password');
        }
        
    } catch (error) {
        console.error('❌ Error changing password:', error);
        showLoading(false);
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    }
}

// =============================
// 🎯 Profile Menu Functions
// =============================

function toggleProfileMenu() {
    const profileMenu = document.getElementById('profileMenu');
    if (profileMenu) {
        profileMenu.classList.toggle('hidden');
    }
}

// =============================
// 📱 Event Listeners Setup
// =============================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Fest Management System Initialized');
    
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
    
    // Mobile menu button
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // Mobile menu close button
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', closeMobileMenu);
    }
    
    // Mobile menu overlay
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', closeMobileMenu);
    }
    
    // Close profile menu when clicking outside
    document.addEventListener('click', function(event) {
        const profileContainer = event.target.closest('.profile-pic-container');
        const profileMenu = document.getElementById('profileMenu');
        
        if (!profileContainer && profileMenu && !profileMenu.classList.contains('hidden')) {
            profileMenu.classList.add('hidden');
        }
    });
    
    // Close modals when clicking outside
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Escape key closes modals and mobile menu
        if (e.key === 'Escape') {
            if (mobileMenuOpen) {
                closeMobileMenu();
            }
            
            document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                modal.classList.add('hidden');
            });
            
            const profileMenu = document.getElementById('profileMenu');
            if (profileMenu && !profileMenu.classList.contains('hidden')) {
                profileMenu.classList.add('hidden');
            }
        }
    });
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            // Close mobile menu on desktop
            if (window.innerWidth > 768 && mobileMenuOpen) {
                closeMobileMenu();
            }
        }, 250);
    });
    
    // Prevent mobile zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
});

// =============================
// 🌐 Global Functions (Window Scope)
// =============================

window.login = login;
window.logout = logout;
window.showPage = showPage;
window.toggleProfileMenu = toggleProfileMenu;
window.openChangePasswordModal = openChangePasswordModal;
window.closeChangePasswordModal = closeChangePasswordModal;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;

// Make currentUser accessible globally for debugging
window.currentUser = currentUser;
window.api = api;

console.log('%c🎉 FEST MANAGEMENT SYSTEM LOADED 🎉', 'color: #3b82f6; font-size: 16px; font-weight: bold;');
console.log('%c📱 Mobile optimized & production ready', 'color: #10b981; font-size: 12px;');
console.log('%c🔧 Open console and type "api" to access API', 'color: #f59e0b; font-size: 12px;');
