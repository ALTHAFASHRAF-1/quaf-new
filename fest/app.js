// =============================
// 🌐 ENHANCED FEST MANAGEMENT SYSTEM
// =============================

// Global Variables
let currentUser = null;
let currentPage = 'dashboard';
let currentTeamTab = 1;
let currentResultType = 's';
let isMobile = window.innerWidth <= 768;

// Detect mobile device
function detectMobile() {
    isMobile = window.innerWidth <= 768;
    return isMobile;
}

// Initialize mobile detection
window.addEventListener('resize', detectMobile);
detectMobile();

// =============================
// 📊 ENHANCED GOOGLE SHEETS API
// =============================
class EnhancedGoogleSheetsAPI {
    constructor() {
        // ⚠️ UPDATE THIS WITH YOUR WEB APP URL
        this.apiUrl = "https://script.google.com/macros/s/AKfycbySFN89KAy9HVjTgWgVeczvXnLSUpTGc5Jd1kSnc6PinL2PPXZ-9MofieE3M695yeHozA/exec";
        this.cache = new Map();
        this.cacheTimeout = 30 * 1000; // 30 seconds
        this.retryCount = 3;
        this.retryDelay = 1000;
    }

    // Enhanced fetch with retry logic
    async fetchWithRetry(url, options = {}, retries = this.retryCount) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, options);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response;
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, i)));
            }
        }
    }

    async getSheet(sheetName, useCache = true) {
        const cacheKey = sheetName;
        const now = Date.now();
        
        if (useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (now - cached.timestamp < this.cacheTimeout) {
                console.log(`📦 Cache hit: ${sheetName}`);
                return cached.data;
            }
        }

        try {
            const url = `${this.apiUrl}?sheet=${encodeURIComponent(sheetName)}&t=${now}&mobile=${isMobile}`;
            console.log(`📤 Fetching: ${sheetName}`);
            
            const response = await this.fetchWithRetry(url);
            const text = await response.text();
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('❌ JSON parse error:', e);
                console.log('Raw response:', text.substring(0, 200));
                data = [];
            }
            
            if (useCache && data && Array.isArray(data)) {
                this.cache.set(cacheKey, { data, timestamp: now });
            }
            
            return data || [];
        } catch (error) {
            console.error(`❌ Error fetching ${sheetName}:`, error);
            
            // Return cached data even if expired
            if (this.cache.has(cacheKey)) {
                console.log('⚠️ Using expired cache due to network error');
                return this.cache.get(cacheKey).data;
            }
            
            return [];
        }
    }

    async addRow(sheetName, rowData) {
        try {
            console.log(`📝 Adding row to ${sheetName}:`, rowData);
            
            const formData = new FormData();
            formData.append('sheet', sheetName);
            formData.append('data', JSON.stringify(rowData));
            formData.append('mobile', isMobile);
            
            const response = await this.fetchWithRetry(this.apiUrl, {
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
            console.error('❌ Error adding row:', error);
            return { success: false, error: error.message };
        }
    }

    async updatePassword(username, newPassword) {
        try {
            const formData = new FormData();
            formData.append('action', 'updatePassword');
            formData.append('username', username);
            formData.append('newPassword', newPassword);
            formData.append('mobile', isMobile);
            
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
            
            this.cache.delete("user_credentials");
            
            return result;
        } catch (error) {
            console.error('❌ Error updating password:', error);
            return { success: false, error: error.message };
        }
    }

    async login(username, password) {
        try {
            const formData = new FormData();
            formData.append('action', 'login');
            formData.append('username', username);
            formData.append('password', password);
            formData.append('mobile', isMobile);
            
            console.log('🔐 Attempting login for:', username);
            
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
                return { success: false, error: 'Invalid server response' };
            }
            
            console.log('✅ Login result:', result.success ? 'Success' : 'Failed');
            return result;
        } catch (error) {
            console.error('❌ Network error during login:', error);
            return { success: false, error: 'Network error. Please check internet connection.' };
        }
    }

    async initializeSheets() {
        try {
            const response = await fetch(`${this.apiUrl}?action=initialize&mobile=${isMobile}`);
            const text = await response.text();
            let result;
            
            try {
                result = JSON.parse(text);
            } catch (e) {
                result = { success: true, message: text };
            }
            
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    clearCache() {
        this.cache.clear();
        console.log('🧹 Cache cleared');
    }

    // Batch requests for mobile optimization
    async batchGet(sheets) {
        if (isMobile) {
            // On mobile, fetch sequentially to reduce memory usage
            const results = {};
            for (const sheet of sheets) {
                results[sheet] = await this.getSheet(sheet);
            }
            return results;
        } else {
            // On desktop, fetch in parallel
            const promises = sheets.map(sheet => this.getSheet(sheet));
            const results = await Promise.all(promises);
            return sheets.reduce((acc, sheet, index) => {
                acc[sheet] = results[index];
                return acc;
            }, {});
        }
    }
}

const api = new EnhancedGoogleSheetsAPI();

// =============================
// 🔑 ENHANCED AUTHENTICATION
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

    // Add loading state to inputs
    document.getElementById('username').disabled = true;
    document.getElementById('password').disabled = true;

    try {
        const result = await api.login(username, password);
        
        if (result.success && result.user) {
            currentUser = {
                sl_no: result.user.sl_no || result.user['sl:no'] || '0',
                ad_no: result.user.ad_no || result.user['ad:no'] || username,
                name: result.user.name || 'User',
                role: result.user.role?.toLowerCase() || 'member',
                team: result.user.team || '0'
            };

            // Store in session storage for persistence
            sessionStorage.setItem('festUser', JSON.stringify(currentUser));
            
            // Show success animation
            loginBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Success!';
            loginBtn.classList.add('btn-success');
            
            // Transition to dashboard
            setTimeout(() => {
                document.getElementById('loginPage').classList.add('hidden');
                document.getElementById('dashboardContainer').classList.remove('hidden');
                
                updateUIForRole();
                loadDashboard();
                
                showLoginError('');
            }, 500);
            
        } else {
            showLoginError(result.error || 'Invalid admission number or password');
            // Shake animation for error
            loginBtn.classList.add('shake');
            setTimeout(() => loginBtn.classList.remove('shake'), 500);
        }
    } catch (error) {
        showLoginError('Network error: ' + error.message);
    } finally {
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
        loginBtn.classList.remove('btn-success');
        document.getElementById('username').disabled = false;
        document.getElementById('password').disabled = false;
    }
}

function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.toggle('hidden', !message);
        
        if (message) {
            errorDiv.classList.add('shake');
            setTimeout(() => errorDiv.classList.remove('shake'), 500);
        }
    }
}

function logout() {
    // Show confirmation on mobile
    if (isMobile && !confirm('Are you sure you want to logout?')) {
        return;
    }
    
    currentUser = null;
    sessionStorage.removeItem('festUser');
    api.clearCache();
    
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('dashboardContainer').classList.add('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    showLoginError('');
}

// =============================
// 🎭 ENHANCED UI UPDATES
// =============================
function updateUIForRole() {
    if (!currentUser) return;

    const elements = {
        welcomeUser: document.getElementById('welcomeUser'),
        profileName: document.getElementById('profileName'),
        profileUsername: document.getElementById('profileUsername'),
        profileRole: document.getElementById('profileRole'),
        profileTeam: document.getElementById('profileTeam'),
        leaderNav: document.getElementById('leaderNav'),
        adminNav: document.getElementById('adminNav'),
        leaderDashboardCards: document.getElementById('leaderDashboardCards'),
        adminDashboardCards: document.getElementById('adminDashboardCards')
    };

    // Update text content
    const roleDisplay = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    if (elements.welcomeUser) {
        elements.welcomeUser.textContent = `Welcome, ${currentUser.name}`;
        elements.welcomeUser.title = `${roleDisplay} - Team ${currentUser.team}`;
    }
    
    if (elements.profileName) elements.profileName.textContent = currentUser.name;
    if (elements.profileUsername) elements.profileUsername.textContent = `@${currentUser.ad_no}`;
    
    // Update role badge
    if (elements.profileRole) {
        elements.profileRole.textContent = roleDisplay;
        elements.profileRole.className = 'text-xs px-2 py-1 bg-white/20 rounded-full ' + 
            (currentUser.role === 'admin' ? 'role-admin' : 
             currentUser.role === 'leader' ? 'role-leader' : 
             currentUser.role === 'assistant' ? 'role-assistant' : 'role-member');
    }
    
    // Update team badge
    if (elements.profileTeam) {
        elements.profileTeam.textContent = `Team ${currentUser.team}`;
        elements.profileTeam.className = 'text-xs px-2 py-1 bg-white/20 rounded-full team-' + currentUser.team;
    }
    
    // Show/hide navigation based on role
    const isAdmin = currentUser.role === 'admin';
    const isLeader = currentUser.role === 'leader' || currentUser.role === 'assistant';
    
    if (elements.leaderNav) elements.leaderNav.classList.toggle('hidden', !isLeader);
    if (elements.adminNav) elements.adminNav.classList.toggle('hidden', !isAdmin);
    if (elements.leaderDashboardCards) elements.leaderDashboardCards.classList.toggle('hidden', !isLeader);
    if (elements.adminDashboardCards) elements.adminDashboardCards.classList.toggle('hidden', !isAdmin);
    
    // Load mobile navigation
    if (typeof loadMobileNavigation === 'function') {
        loadMobileNavigation();
    }
}

// =============================
// 📍 ENHANCED NAVIGATION
// =============================
async function showPage(page) {
    try {
        // Update current page
        currentPage = page;
        
        // Hide all pages with animation
        document.querySelectorAll('.page-content').forEach(p => {
            p.classList.add('hidden');
            p.classList.remove('page-active');
        });
        
        // Show selected page with animation
        const pageElement = document.getElementById(page + 'Page');
        if (pageElement) {
            pageElement.classList.remove('hidden');
            setTimeout(() => pageElement.classList.add('page-active'), 10);
        }
        
        // Update mobile navigation
        if (typeof loadMobileNavigation === 'function') {
            loadMobileNavigation();
        }
        
        // Close mobile menu if open
        if (typeof closeMobileMenu === 'function' && window.mobileMenuOpen) {
            closeMobileMenu();
        }
        
        // Load page data with loading state
        await loadPageData(page);
        
    } catch (error) {
        console.error('❌ Error showing page:', error);
        showAlert('error', 'Failed to load page');
    }
}

async function loadPageData(page) {
    // Show loading skeleton
    const pageElement = document.getElementById(page + 'Page');
    if (pageElement) {
        pageElement.classList.add('loading');
    }
    
    try {
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
        console.error(`❌ Error loading ${page}:`, error);
        showAlert('error', `Failed to load ${page}`);
    } finally {
        if (pageElement) {
            pageElement.classList.remove('loading');
        }
    }
}

// =============================
// 🏠 ENHANCED DASHBOARD
// =============================
async function loadDashboard() {
    if (!currentUser) return;

    try {
        // Show loading states
        ['totalPrograms', 'completedPrograms', 'totalPoints', 'teamRank'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '...';
        });
        
        // Batch load data for better performance
        const sheets = await api.batchGet([
            'schedule',
            `registration_team_${currentUser.team}`,
            's_result', 'ns_result', 'sp_result', 'gs_result', 'gns_result', 'gsp_result'
        ]);
        
        // Update dashboard info
        const dashboardInfo = document.getElementById('dashboardInfo');
        if (dashboardInfo) {
            const roleText = currentUser.role === 'admin' ? 'Administrator' : 
                           currentUser.role === 'leader' ? 'Team Leader' :
                           currentUser.role === 'assistant' ? 'Assistant Leader' : 'Team Member';
            dashboardInfo.textContent = `${roleText} | Team ${currentUser.team}`;
        }
        
        // Calculate stats
        const registrations = sheets[`registration_team_${currentUser.team}`] || [];
        const userPrograms = registrations.filter(reg => {
            const regSlNo = reg['sl:no'] || reg.sl_no || '';
            const regName = reg.name || '';
            return regSlNo == currentUser.sl_no || 
                   regName.toLowerCase() === currentUser.name.toLowerCase();
        });
        
        // Calculate points from all result sheets
        let totalPoints = 0;
        Object.values(sheets).forEach(sheet => {
            if (Array.isArray(sheet)) {
                sheet.forEach(result => {
                    const resultSlNo = result['sl:no'] || result.sl_no || '';
                    const resultName = result.name || '';
                    if (resultSlNo == currentUser.sl_no || 
                        resultName.toLowerCase() === currentUser.name.toLowerCase()) {
                        const points = parseInt(result.points || 0);
                        totalPoints += isNaN(points) ? 0 : points;
                    }
                });
            }
        });
        
        // Count completed programs
        let completedCount = 0;
        userPrograms.forEach(program => {
            const programCode = program.program_code || '';
            const hasResult = Object.values(sheets).some(sheet => {
                if (!Array.isArray(sheet)) return false;
                return sheet.some(result => {
                    const resultSlNo = result['sl:no'] || result.sl_no || '';
                    const resultProgramCode = result.program_code || '';
                    return resultSlNo == currentUser.sl_no && resultProgramCode === programCode;
                });
            });
            if (hasResult) completedCount++;
        });
        
        // Update stats with animation
        animateCounter('totalPrograms', userPrograms.length);
        animateCounter('completedPrograms', completedCount);
        animateCounter('totalPoints', totalPoints);
        
        // Calculate and update team rank
        const teamPoints = await calculateTeamPoints(currentUser.team);
        document.getElementById('teamRank').textContent = teamPoints.rank || '-';
        
        // Load upcoming programs
        await loadUpcomingPrograms(sheets.schedule || []);
        
    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
        showAlert('error', 'Failed to load dashboard data');
    }
}

// Counter animation
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const current = parseInt(element.textContent) || 0;
    const increment = targetValue > current ? 1 : -1;
    const stepTime = Math.abs(30 / (targetValue - current));
    
    let currentValue = current;
    const timer = setInterval(() => {
        currentValue += increment;
        element.textContent = currentValue;
        
        if (currentValue === targetValue) {
            clearInterval(timer);
        }
    }, stepTime);
}

async function loadUpcomingPrograms(schedule) {
    const upcomingPrograms = document.getElementById('upcomingPrograms');
    if (!upcomingPrograms) return;
    
    if (!Array.isArray(schedule) || schedule.length === 0) {
        upcomingPrograms.innerHTML = `
            <div class="text-center py-6">
                <i class="fas fa-calendar-times text-3xl text-gray-300 mb-3"></i>
                <p class="text-gray-500">No upcoming programs</p>
            </div>
        `;
        return;
    }
    
    // Filter upcoming programs (next 3 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming = schedule.filter(item => {
        try {
            const itemDate = new Date(item.date || today);
            itemDate.setHours(0, 0, 0, 0);
            const diffTime = itemDate - today;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            return diffDays >= 0 && diffDays <= 3;
        } catch (e) {
            return false;
        }
    }).slice(0, 3); // Show only 3 on mobile
    
    if (upcoming.length === 0) {
        upcomingPrograms.innerHTML = `
            <div class="text-center py-6">
                <i class="fas fa-calendar-check text-3xl text-green-300 mb-3"></i>
                <p class="text-gray-500">No programs in next 3 days</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    upcoming.forEach(item => {
        const itemDate = new Date(item.date || new Date());
        const dayName = item.day || itemDate.toLocaleDateString('en-US', { weekday: 'short' });
        const formattedDate = itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const programCode = item.program_code || '';
        const time = item.time || '';
        const programType = getProgramType(programCode);
        
        html += `
            <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                <div class="flex justify-between items-start">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center mb-2">
                            <span class="program-code">${programCode}</span>
                            <span class="ml-2 text-xs px-2 py-1 rounded-full ${getProgramTypeClass(programType)}">
                                ${programType}
                            </span>
                        </div>
                        <div class="text-sm text-gray-600">
                            <i class="far fa-clock mr-1"></i> ${time}
                        </div>
                    </div>
                    <div class="text-right ml-3">
                        <div class="text-sm font-semibold">${dayName}</div>
                        <div class="text-xs text-gray-500">${formattedDate}</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    upcomingPrograms.innerHTML = html;
}

// =============================
// 📅 ENHANCED SCHEDULE PAGE
// =============================
async function loadSchedule() {
    try {
        const schedule = await api.getSheet('schedule');
        const tableBody = document.getElementById('scheduleTableBody');
        
        if (!tableBody) return;
        
        if (!Array.isArray(schedule) || schedule.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="${isMobile ? '4' : '6'}" class="text-center py-8 text-gray-500">
                        <i class="fas fa-calendar-times text-3xl text-gray-300 mb-2 block"></i>
                        No schedule available
                    </td>
                </tr>
            `;
            return;
        }
        
        // Get registrations count
        let registrationsByProgram = {};
        if (!isMobile) { // Skip on mobile for performance
            for (let team = 1; team <= 3; team++) {
                const regSheet = await api.getSheet(`registration_team_${team}`);
                if (Array.isArray(regSheet)) {
                    regSheet.forEach(reg => {
                        const programCode = reg.program_code || '';
                        if (programCode) {
                            registrationsByProgram[programCode] = (registrationsByProgram[programCode] || 0) + 1;
                        }
                    });
                }
            }
        }
        
        let html = '';
        schedule.forEach(item => {
            const date = new Date(item.date || new Date());
            const dayName = item.day || date.toLocaleDateString('en-US', { weekday: isMobile ? 'short' : 'long' });
            const formattedDate = isMobile ? 
                date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) :
                date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            
            const programCode = item.program_code || '';
            const time = item.time || '';
            const registeredCount = registrationsByProgram[programCode] || 0;
            const programType = getProgramType(programCode);
            
            if (isMobile) {
                html += `
                    <tr>
                        <td>
                            <div class="font-medium">${formattedDate}</div>
                            <div class="text-xs text-gray-500">${dayName}</div>
                        </td>
                        <td>
                            <div>${time}</div>
                            <div class="program-code text-xs mt-1">${programCode}</div>
                        </td>
                        <td>
                            <span class="text-xs px-2 py-1 rounded-full ${getProgramTypeClass(programType)}">
                                ${programType.charAt(0)}
                            </span>
                        </td>
                        <td class="text-center">${registeredCount}</td>
                    </tr>
                `;
            } else {
                html += `
                    <tr>
                        <td>${formattedDate}</td>
                        <td>${dayName}</td>
                        <td>${time}</td>
                        <td>
                            <span class="program-code">${programCode}</span>
                        </td>
                        <td>
                            <span class="badge badge-${programType.toLowerCase().replace(' ', '')}">
                                ${programType}
                            </span>
                        </td>
                        <td>${registeredCount}</td>
                    </tr>
                `;
            }
        });
        
        tableBody.innerHTML = html;
        
    } catch (error) {
        console.error('❌ Error loading schedule:', error);
        showAlert('error', 'Failed to load schedule');
    }
}

// =============================
// 📋 ENHANCED MY PROGRAMS
// =============================
async function loadMyPrograms() {
    if (!currentUser) return;

    try {
        const registrationSheet = `registration_team_${currentUser.team}`;
        const [registrations, results] = await Promise.all([
            api.getSheet(registrationSheet),
            api.batchGet(['s_result', 'ns_result', 'sp_result', 'gs_result', 'gns_result', 'gsp_result'])
        ]);
        
        const programsList = document.getElementById('myProgramsList');
        if (!programsList) return;
        
        if (!Array.isArray(registrations) || registrations.length === 0) {
            programsList.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-clipboard-list text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 mb-4">No programs registered yet</p>
                    ${currentUser.role !== 'member' ? 
                        '<button onclick="showPage(\'assignPrograms\')" class="btn btn-primary">Assign Programs</button>' : 
                        '<p class="text-sm text-gray-400">Contact your team leader for program assignments</p>'
                    }
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
                <div class="text-center py-12">
                    <i class="fas fa-user-slash text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">No programs assigned to you</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        myRegistrations.forEach(reg => {
            const programCode = reg.program_code || '';
            const programName = reg.program || getProgramType(programCode) + ' Program';
            const team = reg.team || currentUser.team;
            const slNo = reg['sl:no'] || reg.sl_no || '';
            
            // Check if program has result
            let hasResult = false;
            let resultPoints = 0;
            Object.values(results).forEach(sheet => {
                if (Array.isArray(sheet)) {
                    const result = sheet.find(r => {
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
            const badgeClass = getProgramTypeClass(programType);
            
            html += `
                <div class="program-card ${hasResult ? 'border-green-500 bg-green-50' : ''}">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center mb-2">
                                <span class="program-code">${programCode}</span>
                                <span class="ml-2 text-xs px-2 py-1 rounded-full ${badgeClass}">
                                    ${programType}
                                </span>
                            </div>
                            <h4 class="font-semibold text-gray-800 truncate">${programName}</h4>
                        </div>
                        <div class="ml-3 flex items-center space-x-2">
                            ${hasResult ? 
                                `<span class="text-green-600 font-bold text-lg">${resultPoints} pts</span>` : 
                                `<span class="text-yellow-600 text-sm font-medium">Upcoming</span>`
                            }
                        </div>
                    </div>
                    <div class="text-sm text-gray-600">
                        <div class="flex justify-between mb-1">
                            <span>Team: <span class="font-medium team-${team}">${team}</span></span>
                            <span>SL No: <span class="font-medium">${slNo}</span></span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span>Status: 
                                <span class="font-medium ${hasResult ? 'text-green-600' : 'text-yellow-600'}">
                                    ${hasResult ? 'Completed ✓' : 'Pending'}
                                </span>
                            </span>
                            ${hasResult ? 
                                '<i class="fas fa-award text-green-500"></i>' : 
                                '<i class="far fa-clock text-yellow-500"></i>'
                            }
                        </div>
                    </div>
                </div>
            `;
        });
        
        programsList.innerHTML = html;
        
    } catch (error) {
        console.error('❌ Error loading my programs:', error);
        showAlert('error', 'Failed to load your programs');
    }
}

// =============================
// 🏆 ENHANCED RESULTS PAGE
// =============================
async function loadMyResults() {
    if (!currentUser) return;

    try {
        const results = await api.batchGet(['s_result', 'ns_result', 'sp_result', 'gs_result', 'gns_result', 'gsp_result']);
        
        const elements = {
            totalPointsDisplay: document.getElementById('totalPointsDisplay'),
            stagePoints: document.getElementById('stagePoints'),
            nonStagePoints: document.getElementById('nonStagePoints'),
            resultsList: document.getElementById('resultsList')
        };
        
        if (!elements.totalPointsDisplay) return;
        
        // Calculate points
        let totalPoints = 0;
        let stageTotal = 0;
        let nonStageTotal = 0;
        let sportsTotal = 0;
        let groupTotal = 0;
        let allUserResults = [];
        
        Object.entries(results).forEach(([sheetName, sheetResults]) => {
            if (Array.isArray(sheetResults)) {
                const userResults = sheetResults.filter(result => {
                    const resultSlNo = result['sl:no'] || result.sl_no || '';
                    const resultName = result.name || '';
                    return resultSlNo == currentUser.sl_no || 
                           resultName.toLowerCase() === currentUser.name.toLowerCase();
                });
                
                userResults.forEach(result => {
                    const points = parseInt(result.points || 0);
                    totalPoints += isNaN(points) ? 0 : points;
                    
                    if (sheetName === 's_result') stageTotal += points;
                    else if (sheetName === 'ns_result') nonStageTotal += points;
                    else if (sheetName === 'sp_result') sportsTotal += points;
                    else groupTotal += points;
                    
                    allUserResults.push({
                        ...result,
                        type: sheetName.replace('_result', ''),
                        points: points
                    });
                });
            }
        });
        
        // Update points displays with animation
        animateCounter('totalPointsDisplay', totalPoints);
        animateCounter('stagePoints', stageTotal);
        animateCounter('nonStagePoints', nonStageTotal + sportsTotal);
        
        // Display results
        if (allUserResults.length === 0) {
            elements.resultsList.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-chart-line text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 mb-2">No results available yet</p>
                    <p class="text-sm text-gray-400">Results will appear here after evaluation</p>
                </div>
            `;
            return;
        }
        
        // Sort by points (descending)
        allUserResults.sort((a, b) => b.points - a.points);
        
        let html = '';
        allUserResults.forEach((result, index) => {
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
            
            const isMobileView = isMobile;
            
            html += `
                <div class="result-card ${index === 0 ? 'border-yellow-500 bg-yellow-50' : ''}">
                    <div class="flex justify-between items-center mb-3">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center mb-2">
                                <span class="program-code">${programCode}</span>
                                <span class="ml-2 text-sm font-medium ${typeColor}">
                                    ${programType}
                                </span>
                            </div>
                            ${!isMobileView ? `
                                <div class="text-xs text-gray-500">
                                    Position ${position} • Grade ${grade}
                                </div>
                            ` : ''}
                        </div>
                        <div class="ml-3 flex items-center space-x-3">
                            ${position <= 3 ? `
                                <div class="${positionClass} position-badge">
                                    ${position}
                                </div>
                            ` : ''}
                            <span class="text-xl font-bold text-green-600">
                                ${points} pts
                            </span>
                        </div>
                    </div>
                    ${isMobileView ? `
                        <div class="text-sm text-gray-600 flex justify-between">
                            <span>Pos: <span class="font-medium">${position}</span></span>
                            <span>Grade: 
                                <span class="font-medium ${grade === 'A' ? 'text-green-600' : 
                                                         grade === 'B' ? 'text-yellow-600' : 
                                                         'text-orange-600'}">
                                    ${grade}
                                </span>
                            </span>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        elements.resultsList.innerHTML = html;
        
    } catch (error) {
        console.error('❌ Error loading results:', error);
        showAlert('error', 'Failed to load results');
    }
}

// =============================
// 👥 ENHANCED TEAM MEMBERS
// =============================
async function loadTeamMembers() {
    if (!currentUser || (currentUser.role !== 'leader' && currentUser.role !== 'assistant')) {
        return;
    }

    try {
        const [users, programCounts] = await Promise.all([
            api.getSheet('user_credentials'),
            api.getSheet('program_count')
        ]);
        
        const teamMembers = users.filter(user => {
            const userTeam = user.team || '';
            const userRole = (user.role || '').toLowerCase();
            return userTeam == currentUser.team && 
                   ['member', 'leader', 'assistant'].includes(userRole);
        });
        
        const tableBody = document.getElementById('teamMembersTableBody');
        if (!tableBody) return;
        
        if (teamMembers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="${isMobile ? '6' : '8'}" class="text-center py-8 text-gray-500">
                        <i class="fas fa-users-slash text-3xl text-gray-300 mb-2 block"></i>
                        No team members found
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        teamMembers.forEach((member, index) => {
            const slNo = member['sl:no'] || member.sl_no || '';
            const name = member.name || '';
            const role = (member.role || '').toLowerCase();
            const adNo = member['ad:no'] || member.ad_no || '';
            
            // Find program count
            let countData = null;
            if (Array.isArray(programCounts)) {
                countData = programCounts.find(pc => {
                    const pcSlNo = pc['sl:no'] || pc.sl_no || '';
                    return pcSlNo == slNo;
                });
            }
            
            const stageCount = countData ? parseInt(countData.s || 0) : 0;
            const nonStageCount = countData ? parseInt(countData.ns || 0) : 0;
            const sportsCount = countData ? parseInt(countData.sp || 0) : 0;
            const totalCount = countData ? parseInt(countData.count || 0) : 0;
            
            // Check requirements
            const meetsStage = stageCount >= 1;
            const meetsNonStage = nonStageCount >= 1;
            const meetsSports = sportsCount >= 1;
            const meetsTotal = totalCount <= 12;
            
            const hasWarning = !meetsStage || !meetsNonStage || !meetsSports || !meetsTotal;
            
            if (isMobile) {
                html += `
                    <tr class="${hasWarning ? 'program-warning' : ''}">
                        <td>
                            <div class="font-medium">${name}</div>
                            <div class="text-xs text-gray-500">${adNo}</div>
                        </td>
                        <td class="text-center">
                            <span class="${role === 'leader' ? 'role-leader' : 
                                         role === 'assistant' ? 'role-assistant' : 
                                         'role-member'} text-xs">
                                ${role}
                            </span>
                        </td>
                        <td class="text-center font-bold ${meetsTotal ? '' : 'text-red-600'}">
                            ${totalCount}
                        </td>
                        <td>
                            <div class="flex space-x-2">
                                <button onclick="viewMemberPrograms('${slNo}')" 
                                        class="text-blue-600 hover:text-blue-800 p-1"
                                        title="View programs">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button onclick="assignProgramToMember('${slNo}', '${name}')" 
                                        class="text-green-600 hover:text-green-800 p-1"
                                        title="Assign program">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                html += `
                    <tr class="${hasWarning ? 'program-warning' : ''}">
                        <td>${index + 1}</td>
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
                            <div class="flex space-x-2">
                                <button onclick="viewMemberPrograms('${slNo}')" 
                                        class="text-blue-600 hover:text-blue-800 p-1"
                                        title="View programs">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button onclick="assignProgramToMember('${slNo}', '${name}')" 
                                        class="text-green-600 hover:text-green-800 p-1"
                                        title="Assign program">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }
        });
        
        tableBody.innerHTML = html;
        
    } catch (error) {
        console.error('❌ Error loading team members:', error);
        showAlert('error', 'Failed to load team members');
    }
}

// =============================
// 📝 ENHANCED ASSIGN PROGRAMS
// =============================
async function loadAssignPrograms() {
    if (!currentUser || (currentUser.role !== 'leader' && currentUser.role !== 'assistant')) {
        return;
    }

    try {
        const [users, schedule] = await Promise.all([
            api.getSheet('user_credentials'),
            api.getSheet('schedule')
        ]);
        
        const teamMembers = users.filter(user => {
            const userTeam = user.team || '';
            const userRole = (user.role || '').toLowerCase();
            return userTeam == currentUser.team && userRole === 'member';
        });
        
        // Update member select
        const memberSelect = document.getElementById('memberSelect');
        if (memberSelect) {
            memberSelect.innerHTML = '<option value="">Select member</option>';
            teamMembers.forEach(member => {
                const option = document.createElement('option');
                option.value = member['sl:no'] || member.sl_no || '';
                option.textContent = `${member.name} (${member['ad:no'] || member.ad_no || ''})`;
                memberSelect.appendChild(option);
            });
        }
        
        // Update program select
        const programCodes = [...new Set(schedule.map(item => item.program_code || '').filter(Boolean))];
        const programCodeSelect = document.getElementById('programCodeSelect');
        if (programCodeSelect) {
            programCodeSelect.innerHTML = '<option value="">Select program</option>';
            programCodes.forEach(code => {
                const option = document.createElement('option');
                option.value = code;
                option.textContent = `${code} - ${getProgramType(code)}`;
                programCodeSelect.appendChild(option);
            });
        }
        
        // Load assigned programs
        await loadAssignedPrograms();
        
    } catch (error) {
        console.error('❌ Error loading assign programs:', error);
        showAlert('error', 'Failed to load assignment data');
    }
}

// =============================
// 🏢 ENHANCED ALL TEAMS (ADMIN)
// =============================
async function loadAllTeams() {
    try {
        await loadTeamData(currentTeamTab);
    } catch (error) {
        console.error('❌ Error loading all teams:', error);
        showAlert('error', 'Failed to load teams data');
    }
}

// =============================
// 🧮 ENHANCED PROGRAM COUNT
// =============================
async function loadProgramCount() {
    try {
        const [programCounts, users] = await Promise.all([
            api.getSheet('program_count'),
            api.getSheet('user_credentials')
        ]);
        
        const tableBody = document.getElementById('programCountTableBody');
        if (!tableBody) return;
        
        if (!Array.isArray(programCounts) || programCounts.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="${isMobile ? '5' : '8'}" class="text-center py-8 text-gray-500">
                        <i class="fas fa-calculator text-3xl text-gray-300 mb-2 block"></i>
                        No program count data available
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        programCounts.forEach((pc, index) => {
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
            
            if (isMobile) {
                html += `
                    <tr class="${hasWarning ? 'program-warning' : ''}">
                        <td>
                            <div class="font-medium">${name}</div>
                            <div class="text-xs text-gray-500">Team ${team}</div>
                        </td>
                        <td class="text-center font-bold ${meetsTotal ? '' : 'text-red-600'}">
                            ${totalCount}/12
                        </td>
                        <td class="text-center">
                            ${hasWarning ? 
                                '<span class="text-red-600 font-medium">⚠️</span>' : 
                                '<span class="text-green-600 font-medium">✓</span>'
                            }
                        </td>
                    </tr>
                `;
            } else {
                html += `
                    <tr class="${hasWarning ? 'program-warning' : ''}">
                        <td>${index + 1}</td>
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
                        <td class="text-center">
                            ${hasWarning ? 
                                '<span class="text-red-600 font-medium" title="Needs attention">⚠️</span>' : 
                                '<span class="text-green-600 font-medium">✓ OK</span>'
                            }
                        </td>
                    </tr>
                `;
            }
        });
        
        tableBody.innerHTML = html;
        
    } catch (error) {
        console.error('❌ Error loading program count:', error);
        showAlert('error', 'Failed to load program count');
    }
}

// =============================
// 🏅 ENHANCED MANAGE RESULTS
// =============================
async function loadManageResults() {
    try {
        await loadResultsByType(currentResultType);
    } catch (error) {
        console.error('❌ Error loading manage results:', error);
        showAlert('error', 'Failed to load results management');
    }
}

// =============================
// 📅 ENHANCED ADMIN SCHEDULE
// =============================
async function loadAdminSchedule() {
    try {
        const schedule = await api.getSheet('schedule');
        const tableBody = document.getElementById('adminScheduleTableBody');
        
        if (!tableBody) return;
        
        if (!Array.isArray(schedule) || schedule.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="${isMobile ? '3' : '4'}" class="text-center py-8 text-gray-500">
                        <i class="fas fa-calendar-plus text-3xl text-gray-300 mb-2 block"></i>
                        No schedule available
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        schedule.forEach((item, index) => {
            const date = new Date(item.date || new Date());
            const formattedDate = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            const time = item.time || '';
            const programCode = item.program_code || '';
            
            if (isMobile) {
                html += `
                    <tr>
                        <td>
                            <div class="font-medium">${formattedDate}</div>
                            <div class="text-xs text-gray-500">${time}</div>
                        </td>
                        <td>
                            <span class="program-code">${programCode}</span>
                        </td>
                        <td>
                            <div class="flex space-x-2">
                                <button onclick="editSchedule('${item.date || ''}', '${time}', '${programCode}')" 
                                        class="text-blue-600 hover:text-blue-800 p-1">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteSchedule('${item.date || ''}', '${time}', '${programCode}')" 
                                        class="text-red-600 hover:text-red-800 p-1">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                html += `
                    <tr>
                        <td>${formattedDate}</td>
                        <td>${time}</td>
                        <td>
                            <span class="program-code">${programCode}</span>
                        </td>
                        <td>
                            <div class="flex space-x-2">
                                <button onclick="editSchedule('${item.date || ''}', '${time}', '${programCode}')" 
                                        class="text-blue-600 hover:text-blue-800 p-1"
                                        title="Edit schedule">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteSchedule('${item.date || ''}', '${time}', '${programCode}')" 
                                        class="text-red-600 hover:text-red-800 p-1"
                                        title="Delete schedule">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }
        });
        
        tableBody.innerHTML = html;
        
    } catch (error) {
        console.error('❌ Error loading admin schedule:', error);
        showAlert('error', 'Failed to load schedule');
    }
}

// =============================
// 🛠️ UTILITY FUNCTIONS
// =============================

// Alert system
function showAlert(type, message, duration = 5000) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} fixed top-4 right-4 z-50 max-w-md`;
    alertDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                              type === 'error' ? 'exclamation-circle' : 
                              'info-circle'} mr-3"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.classList.add('fade-out');
        setTimeout(() => alertDiv.remove(), 300);
    }, duration);
}

// Program type helper
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

function getProgramTypeClass(programType) {
    const type = programType.toLowerCase().replace(' ', '-');
    return `badge-${type}`;
}

// Team points calculator
async function calculateTeamPoints(teamNumber) {
    try {
        const results = await api.batchGet(['s_result', 'ns_result', 'sp_result', 'gs_result', 'gns_result', 'gsp_result']);
        
        const teamTotals = {1: 0, 2: 0, 3: 0};
        
        Object.values(results).forEach(sheet => {
            if (Array.isArray(sheet)) {
                sheet.forEach(result => {
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
                rank = i + 1;
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

// =============================
// 🚀 INITIALIZATION
// =============================
document.addEventListener('DOMContentLoaded', function() {
    // Check for saved session
    const savedUser = sessionStorage.getItem('festUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('dashboardContainer').classList.remove('hidden');
            updateUIForRole();
            loadDashboard();
        } catch (e) {
            sessionStorage.removeItem('festUser');
        }
    }
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            login();
        });
        
        // Enter key to submit
        loginForm.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
    
    // Initialize page
    showPage('dashboard');
    
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        .shake {
            animation: shake 0.5s ease-in-out;
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .fade-out {
            opacity: 0;
            transform: translateY(-20px);
            transition: opacity 0.3s, transform 0.3s;
        }
        
        .page-active {
            animation: fadeIn 0.3s ease;
        }
        
        .loading {
            position: relative;
        }
        
        .loading::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
        }
        
        .loading::before {
            content: 'Loading...';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 11;
            color: #3b82f6;
            font-weight: 600;
        }
    `;
    document.head.appendChild(style);
    
    console.log('%c🎉 FEST MANAGEMENT SYSTEM LOADED 🎉', 'color: #3b82f6; font-size: 16px; font-weight: bold;');
    console.log('%c📱 Mobile Optimized: ' + (isMobile ? 'Yes' : 'No'), 'color: #059669;');
});

// Export functions
window.showPage = showPage;
window.logout = logout;
window.showResultType = function(type) {
    currentResultType = type;
    loadResultsByType(type);
};
window.initializeSheets = api.initializeSheets.bind(api);
