// Global variables
let currentUser = null;
// You'll need to replace this with your actual Google Apps Script Web App URL
// after deploying the script
let googleScriptUrl = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're running locally or on a server
    if (window.location.protocol === 'file:') {
        // Local file system - prompt for URL
        googleScriptUrl = localStorage.getItem('googleScriptUrl');
        if (!googleScriptUrl) {
            googleScriptUrl = prompt('Please enter your Google Apps Script Web App URL:');
            if (googleScriptUrl) {
                localStorage.setItem('googleScriptUrl', googleScriptUrl);
            } else {
                alert('Google Script URL is required. Please reload the page and provide the URL.');
                return;
            }
        }
    } else {
        // Running on a server - try to get from URL or use a default
        const urlParams = new URLSearchParams(window.location.search);
        googleScriptUrl = urlParams.get('scriptUrl') || 
                         localStorage.getItem('googleScriptUrl') ||
                         'https://script.google.com/macros/s/AKfycbxubdoI3OBXWCxhQ-aZzmwp3Bi0vU48xZPY2ElUspB5opAkFBxtwQElLA8f5aVjEtnA/exec'; // Replace with your URL
    }
    
    // Store for future use
    if (googleScriptUrl) {
        localStorage.setItem('googleScriptUrl', googleScriptUrl);
    }
    
    // Display current URL (for debugging)
    console.log('Using Google Script URL:', googleScriptUrl);
    
    // Login functionality
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    // Allow Enter key to login
    document.getElementById('password')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    
    // Logout buttons
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    document.getElementById('logoutLeaderBtn')?.addEventListener('click', logout);
    document.getElementById('logoutAdminBtn')?.addEventListener('click', logout);
    
    // Sidebar navigation
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.dataset.page;
            showPage(page);
        });
    });
    
    // Leader dashboard - Assign program
    document.getElementById('assignProgramBtn')?.addEventListener('click', assignProgram);
    
    // Auto-fill program name when code is selected
    document.getElementById('programCodeSelect')?.addEventListener('change', function() {
        const programNameMap = {
            's01': 'Solo Singing',
            's02': 'Instrumental',
            'ns01': 'Elocution',
            'ns02': 'Debate',
            'sp01': '100m Race',
            'sp02': 'Long Jump',
            'gs01': 'Group Dance',
            'gns01': 'Group Quiz',
            'gsp01': 'Relay Race'
        };
        
        const programName = document.getElementById('programName');
        if (this.value && programNameMap[this.value]) {
            programName.value = programNameMap[this.value];
        }
    });
    
    // Admin dashboard - Add user
    document.getElementById('addUserBtn')?.addEventListener('click', addUser);
    
    // Admin dashboard - Add schedule
    document.getElementById('addScheduleBtn')?.addEventListener('click', addSchedule);
    
    // Admin dashboard - Add result
    document.getElementById('addResultBtn')?.addEventListener('click', addResult);
    document.getElementById('resultPosition')?.addEventListener('change', calculatePoints);
    document.getElementById('resultGrade')?.addEventListener('change', calculatePoints);
    document.getElementById('resultProgramCode')?.addEventListener('change', calculatePoints);
});

// Google Apps Script API functions
async function callGoogleScript(functionName, data = {}) {
    if (!googleScriptUrl) {
        alert('Google Script URL is not set. Please reload the page.');
        return { success: false, message: 'Google Script URL not set' };
    }
    
    try {
        // Add a timestamp to prevent caching
        const url = `${googleScriptUrl}?action=${functionName}&t=${Date.now()}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API Response:', functionName, result);
        return result;
    } catch (error) {
        console.error('Error calling Google Script:', error);
        return { 
            success: false, 
            message: 'Network error: ' + error.message 
        };
    }
}

// Handle login
async function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    if (!username || !password) {
        showError(errorDiv, 'Please enter username and password');
        return;
    }
    
    // Show loading
    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<span class="loading"></span> Logging in...';
    loginBtn.disabled = true;
    
    try {
        const response = await callGoogleScript('getUserCredentials', {
            username: username,
            password: password
        });
        
        if (response.success) {
            currentUser = response.user;
            console.log('Logged in as:', currentUser);
            
            // Hide login screen
            document.getElementById('loginScreen').style.display = 'none';
            
            // Show appropriate dashboard based on role
            if (currentUser.role === 'member') {
                showMemberDashboard();
            } else if (currentUser.role === 'leader' || currentUser.role === 'assistant') {
                showLeaderDashboard();
            } else if (currentUser.role === 'admin') {
                showAdminDashboard();
            }
        } else {
            showError(errorDiv, response.message || 'Invalid credentials');
        }
    } catch (error) {
        showError(errorDiv, 'Login failed. Please try again.');
        console.error('Login error:', error);
    } finally {
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    }
}

// Show member dashboard
async function showMemberDashboard() {
    document.getElementById('memberDashboard').style.display = 'block';
    document.getElementById('memberName').textContent = currentUser.name;
    
    // Load member data
    const response = await callGoogleScript('getMemberData', {
        slNo: currentUser.slNo
    });
    
    if (response.success) {
        // Update schedule
        updateScheduleTable(response.schedule);
        
        // Update programs
        updateProgramsTable(response.registrations);
        
        // Update results
        updateResultsTable(response.results);
        
        // Update points summary
        if (response.programCount) {
            updatePointsSummary(response.programCount, response.results);
        }
    } else {
        alert('Error loading member data: ' + response.message);
    }
}

// Show leader dashboard
async function showLeaderDashboard() {
    document.getElementById('leaderDashboard').style.display = 'block';
    document.getElementById('leaderName').textContent = currentUser.name;
    document.getElementById('teamDisplay').textContent = currentUser.team;
    
    // Load leader data
    const response = await callGoogleScript('getLeaderData', {
        team: currentUser.team
    });
    
    if (response.success) {
        // Update team members table
        updateTeamMembersTable(response.teamMembers, response.programCounts);
        
        // Update team programs
        updateTeamProgramsTable(response.registrations);
        
        // Load and update team results
        loadTeamResults();
        
        // Populate member select for assigning programs
        populateMemberSelect(response.teamMembers);
    } else {
        alert('Error loading leader data: ' + response.message);
    }
}

// Show admin dashboard
async function showAdminDashboard() {
    document.getElementById('adminDashboard').style.display = 'block';
    document.getElementById('adminName').textContent = currentUser.name;
    
    // Load all data
    loadAllData();
}

// Show specific page
function showPage(pageName) {
    // Get current dashboard
    let dashboard;
    if (document.getElementById('memberDashboard').style.display !== 'none') {
        dashboard = 'member';
    } else if (document.getElementById('leaderDashboard').style.display !== 'none') {
        dashboard = 'leader';
    } else {
        dashboard = 'admin';
    }
    
    // Hide all pages in current dashboard
    document.querySelectorAll(`#${dashboard}Dashboard .content-page`).forEach(page => {
        page.classList.remove('active');
    });
    
    // Deactivate all sidebar buttons in current dashboard
    document.querySelectorAll(`#${dashboard}Dashboard .sidebar-btn`).forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected page
    const pageElement = document.getElementById(`${pageName}Page`);
    if (pageElement) {
        pageElement.classList.add('active');
        
        // Activate corresponding button
        const button = document.querySelector(`#${dashboard}Dashboard .sidebar-btn[data-page="${pageName}"]`);
        if (button) button.classList.add('active');
        
        // Load data for specific pages
        if (dashboard === 'leader' && pageName === 'teamResults') {
            loadTeamResults();
        } else if (dashboard === 'admin' && pageName === 'viewAll') {
            loadAllData();
        }
    }
}

// Update schedule table
function updateScheduleTable(scheduleData) {
    const tbody = document.querySelector('#scheduleTable tbody');
    tbody.innerHTML = '';
    
    if (!scheduleData || scheduleData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align: center;">No schedule data available</td>';
        tbody.appendChild(row);
        return;
    }
    
    scheduleData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item[0] || ''}</td>
            <td>${item[1] || ''}</td>
            <td>${item[2] || ''}</td>
            <td>${item[3] || ''}</td>
            <td>${item[4] || ''}</td>
        `;
        tbody.appendChild(row);
    });
}

// Update programs table
function updateProgramsTable(programs) {
    const tbody = document.querySelector('#programsTable tbody');
    tbody.innerHTML = '';
    
    if (!programs || programs.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="3" style="text-align: center;">No programs registered</td>';
        tbody.appendChild(row);
        return;
    }
    
    programs.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item[0] || ''}</td>
            <td>${item[1] || ''}</td>
            <td>${item[4] || ''}</td>
        `;
        tbody.appendChild(row);
    });
}

// Update results table
function updateResultsTable(results) {
    const tbody = document.querySelector('#resultsTable tbody');
    tbody.innerHTML = '';
    
    if (!results || results.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" style="text-align: center;">No results available</td>';
        tbody.appendChild(row);
        return;
    }
    
    let totalPoints = 0;
    
    results.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item[0] || ''}</td>
            <td>${item[2] || ''}</td>
            <td>${item[3] || ''}</td>
            <td>${item[4] || ''}</td>
        `;
        tbody.appendChild(row);
        totalPoints += parseInt(item[4]) || 0;
    });
    
    document.getElementById('totalPoints').textContent = totalPoints;
}

// Update points summary
function updatePointsSummary(programCount, results) {
    if (!programCount) return;
    
    document.getElementById('stageCount').textContent = programCount[3] || 0;
    document.getElementById('nonStageCount').textContent = programCount[4] || 0;
    document.getElementById('sportsCount').textContent = programCount[5] || 0;
    document.getElementById('totalPrograms').textContent = programCount[6] || 0;
    
    const statusElement = document.getElementById('programStatus');
    const status = programCount[7] || 'OK';
    statusElement.textContent = status;
    statusElement.dataset.status = status;
    
    // Calculate total points from results
    const totalPoints = results ? results.reduce((sum, result) => sum + (parseInt(result[4]) || 0), 0) : 0;
    document.getElementById('totalPoints').textContent = totalPoints;
}

// Update team members table
function updateTeamMembersTable(teamMembers, programCounts) {
    const tbody = document.querySelector('#teamMembersTable tbody');
    tbody.innerHTML = '';
    
    if (!teamMembers || teamMembers.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" style="text-align: center;">No team members found</td>';
        tbody.appendChild(row);
        return;
    }
    
    teamMembers.forEach(member => {
        const programCount = programCounts?.find(pc => pc[0] === member[0]);
        const status = programCount ? (programCount[7] || 'OK') : 'Check';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${member[0] || ''}</td>
            <td>${member[1] || ''}</td>
            <td>${member[2] || ''}</td>
            <td>${member[3] || ''}</td>
            <td>${programCount ? programCount[6] : 0}</td>
            <td><span class="status-badge status-${status.toLowerCase()}">${status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Update team programs table
function updateTeamProgramsTable(registrations) {
    const tbody = document.querySelector('#teamProgramsTable tbody');
    tbody.innerHTML = '';
    
    if (!registrations || registrations.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" style="text-align: center;">No team programs registered</td>';
        tbody.appendChild(row);
        return;
    }
    
    registrations.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item[0] || ''}</td>
            <td>${item[1] || ''}</td>
            <td>${item[2] || ''}</td>
            <td>${item[3] || ''}</td>
        `;
        tbody.appendChild(row);
    });
}

// Populate member select for assigning programs
function populateMemberSelect(teamMembers) {
    const select = document.getElementById('memberSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select a member</option>';
    
    teamMembers.forEach(member => {
        if (member[3] === 'member') { // Only include members, not leaders
            const option = document.createElement('option');
            option.value = JSON.stringify({
                slNo: member[0],
                name: member[2]
            });
            option.textContent = `${member[2]} (${member[1]})`;
            select.appendChild(option);
        }
    });
}

// Assign program to member
async function assignProgram() {
    const memberSelect = document.getElementById('memberSelect');
    const programCodeSelect = document.getElementById('programCodeSelect');
    const programNameInput = document.getElementById('programName');
    const messageDiv = document.getElementById('assignMessage');
    
    if (!memberSelect.value || !programCodeSelect.value || !programNameInput.value) {
        showMessage(messageDiv, 'Please fill all fields', 'error');
        return;
    }
    
    const member = JSON.parse(memberSelect.value);
    const programData = {
        programCode: programCodeSelect.value,
        programName: programNameInput.value,
        slNo: member.slNo,
        name: member.name,
        team: currentUser.team
    };
    
    const response = await callGoogleScript('assignProgram', programData);
    
    if (response.success) {
        showMessage(messageDiv, response.message, 'success');
        
        // Clear form
        programCodeSelect.value = '';
        programNameInput.value = '';
        
        // Refresh team programs
        const leaderData = await callGoogleScript('getLeaderData', {
            team: currentUser.team
        });
        
        if (leaderData.success) {
            updateTeamProgramsTable(leaderData.registrations);
        }
    } else {
        showMessage(messageDiv, response.message, 'error');
    }
}

// Load team results
async function loadTeamResults() {
    const response = await callGoogleScript('getAllData');
    
    if (response.success) {
        // Filter results for current team
        const teamResults = response.results.filter(result => {
            // Find user for this result
            const user = response.users.find(u => u[0] === result[1]);
            return user && user[5] === currentUser.team;
        });
        
        updateTeamResultsTable(teamResults);
    }
}

// Update team results table
function updateTeamResultsTable(results) {
    const tbody = document.querySelector('#teamResultsTable tbody');
    tbody.innerHTML = '';
    
    if (!results || results.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align: center;">No team results available</td>';
        tbody.appendChild(row);
        return;
    }
    
    results.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item[0] || ''}</td>
            <td>${item[1] || ''}</td>
            <td>${item[2] || ''}</td>
            <td>${item[3] || ''}</td>
            <td>${item[4] || ''}</td>
        `;
        tbody.appendChild(row);
    });
}

// Load all data for admin
async function loadAllData() {
    const response = await callGoogleScript('getAllData');
    
    if (response.success) {
        // Update all users table
        updateAllUsersTable(response.users);
        
        // Update admin schedule table
        updateAdminScheduleTable(response.schedule);
        
        // Update all results table
        updateAllResultsTable(response.results);
        
        // Update all registrations table
        updateAllRegistrationsTable(response.registrations);
        
        // Update all program counts table
        updateAllProgramCountsTable(response.programCounts);
    } else {
        alert('Error loading all data: ' + response.message);
    }
}

// Update all users table
function updateAllUsersTable(users) {
    const tbody = document.querySelector('#allUsersTable tbody');
    tbody.innerHTML = '';
    
    if (!users || users.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align: center;">No users found</td>';
        tbody.appendChild(row);
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user[0] || ''}</td>
            <td>${user[1] || ''}</td>
            <td>${user[2] || ''}</td>
            <td>${user[3] || ''}</td>
            <td>${user[5] || ''}</td>
        `;
        tbody.appendChild(row);
    });
}

// Update admin schedule table
function updateAdminScheduleTable(schedule) {
    const tbody = document.querySelector('#adminScheduleTable tbody');
    tbody.innerHTML = '';
    
    if (!schedule || schedule.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align: center;">No schedule data available</td>';
        tbody.appendChild(row);
        return;
    }
    
    schedule.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item[0] || ''}</td>
            <td>${item[1] || ''}</td>
            <td>${item[2] || ''}</td>
            <td>${item[3] || ''}</td>
            <td>${item[4] || ''}</td>
        `;
        tbody.appendChild(row);
    });
}

// Update all results table
function updateAllResultsTable(results) {
    const tbody = document.querySelector('#allResultsTable tbody');
    tbody.innerHTML = '';
    
    if (!results || results.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align: center;">No results available</td>';
        tbody.appendChild(row);
        return;
    }
    
    results.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item[0] || ''}</td>
            <td>${item[1] || ''}</td>
            <td>${item[2] || ''}</td>
            <td>${item[3] || ''}</td>
            <td>${item[4] || ''}</td>
        `;
        tbody.appendChild(row);
    });
}

// Update all registrations table
function updateAllRegistrationsTable(registrations) {
    const tbody = document.querySelector('#allRegistrationsTable tbody');
    tbody.innerHTML = '';
    
    if (!registrations || registrations.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align: center;">No registrations available</td>';
        tbody.appendChild(row);
        return;
    }
    
    registrations.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item[0] || ''}</td>
            <td>${item[1] || ''}</td>
            <td>${item[2] || ''}</td>
            <td>${item[3] || ''}</td>
            <td>${item[4] || ''}</td>
        `;
        tbody.appendChild(row);
    });
}

// Update all program counts table
function updateAllProgramCountsTable(programCounts) {
    const tbody = document.querySelector('#allProgramCountsTable tbody');
    tbody.innerHTML = '';
    
    if (!programCounts || programCounts.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="8" style="text-align: center;">No program counts available</td>';
        tbody.appendChild(row);
        return;
    }
    
    programCounts.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item[0] || ''}</td>
            <td>${item[1] || ''}</td>
            <td>${item[2] || ''}</td>
            <td>${item[3] || ''}</td>
            <td>${item[4] || ''}</td>
            <td>${item[5] || ''}</td>
            <td>${item[6] || ''}</td>
            <td><span class="status-badge status-${(item[7] || 'check').toLowerCase()}">${item[7] || 'Check'}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Add user (admin)
async function addUser() {
    const adNo = document.getElementById('adNo').value.trim();
    const userName = document.getElementById('userName').value.trim();
    const userRole = document.getElementById('userRole').value;
    const userTeam = document.getElementById('userTeam').value;
    const userPassword = document.getElementById('userPassword').value;
    const messageDiv = document.getElementById('userMessage');
    
    if (!adNo || !userName || !userPassword) {
        showMessage(messageDiv, 'Please fill all required fields', 'error');
        return;
    }
    
    const userData = {
        adNo: adNo,
        name: userName,
        role: userRole,
        team: userTeam,
        password: userPassword
    };
    
    const response = await callGoogleScript('addUser', userData);
    
    if (response.success) {
        showMessage(messageDiv, response.message, 'success');
        
        // Clear form
        document.getElementById('adNo').value = '';
        document.getElementById('userName').value = '';
        document.getElementById('userPassword').value = '';
        
        // Refresh users table
        const allData = await callGoogleScript('getAllData');
        if (allData.success) {
            updateAllUsersTable(allData.users);
        }
    } else {
        showMessage(messageDiv, response.message, 'error');
    }
}

// Add schedule (admin)
async function addSchedule() {
    const date = document.getElementById('scheduleDate').value;
    const day = document.getElementById('scheduleDay').value.trim();
    const time = document.getElementById('scheduleTime').value.trim();
    const programCode = document.getElementById('scheduleProgramCode').value.trim();
    const programName = document.getElementById('scheduleProgramName').value.trim();
    const messageDiv = document.getElementById('scheduleMessage');
    
    if (!date || !day || !time || !programCode || !programName) {
        showMessage(messageDiv, 'Please fill all fields', 'error');
        return;
    }
    
    const scheduleData = {
        date: date,
        day: day,
        time: time,
        programCode: programCode,
        programName: programName
    };
    
    const response = await callGoogleScript('updateSchedule', scheduleData);
    
    if (response.success) {
        showMessage(messageDiv, response.message, 'success');
        
        // Clear form
        document.getElementById('scheduleDate').value = '';
        document.getElementById('scheduleDay').value = '';
        document.getElementById('scheduleTime').value = '';
        document.getElementById('scheduleProgramCode').value = '';
        document.getElementById('scheduleProgramName').value = '';
        
        // Refresh schedule table
        const allData = await callGoogleScript('getAllData');
        if (allData.success) {
            updateAdminScheduleTable(allData.schedule);
        }
    } else {
        showMessage(messageDiv, response.message, 'error');
    }
}

// Calculate points for result
function calculatePoints() {
    const position = parseInt(document.getElementById('resultPosition').value);
    const grade = document.getElementById('resultGrade').value;
    const programCode = document.getElementById('resultProgramCode').value.trim();
    const pointsField = document.getElementById('resultPoints');
    
    if (!position || !grade || !programCode) {
        pointsField.value = '';
        return;
    }
    
    let positionPoints = 0;
    let gradePoints = 0;
    
    // Determine if group program
    const isGroupProgram = programCode.startsWith('g');
    
    if (isGroupProgram) {
        // Group program points
        const groupPositionPoints = [10, 7, 5];
        positionPoints = groupPositionPoints[position - 1] || 0;
    } else {
        // Individual program points
        const individualPositionPoints = [3, 2, 1];
        positionPoints = individualPositionPoints[position - 1] || 0;
    }
    
    // Grade points (same for both)
    const gradePointMap = { A: 3, B: 2, C: 1 };
    gradePoints = gradePointMap[grade] || 0;
    
    pointsField.value = positionPoints + gradePoints;
}

// Add result (admin)
async function addResult() {
    const programCode = document.getElementById('resultProgramCode').value.trim();
    const slNo = parseInt(document.getElementById('resultSlNo').value);
    const position = parseInt(document.getElementById('resultPosition').value);
    const grade = document.getElementById('resultGrade').value;
    const points = parseInt(document.getElementById('resultPoints').value);
    const messageDiv = document.getElementById('resultMessage');
    
    if (!programCode || !slNo || !position || !grade || !points) {
        showMessage(messageDiv, 'Please fill all fields', 'error');
        return;
    }
    
    const resultData = {
        programCode: programCode,
        slNo: slNo,
        position: position,
        grade: grade,
        points: points
    };
    
    const response = await callGoogleScript('updateResult', resultData);
    
    if (response.success) {
        showMessage(messageDiv, response.message, 'success');
        
        // Clear form
        document.getElementById('resultProgramCode').value = '';
        document.getElementById('resultSlNo').value = '';
        document.getElementById('resultPoints').value = '';
        
        // Refresh results table
        const allData = await callGoogleScript('getAllData');
        if (allData.success) {
            updateAllResultsTable(allData.results);
        }
    } else {
        showMessage(messageDiv, response.message, 'error');
    }
}

// Logout
function logout() {
    currentUser = null;
    
    // Hide all dashboards
    document.getElementById('memberDashboard').style.display = 'none';
    document.getElementById('leaderDashboard').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'none';
    
    // Show login screen
    document.getElementById('loginScreen').style.display = 'block';
    
    // Clear login form
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('loginError').textContent = '';
}

// Helper functions
function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

function showMessage(element, message, type) {
    if (element) {
        element.textContent = message;
        element.className = `message ${type}`;
        element.style.display = 'block';
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

// Initialize on load
window.onload = function() {
    console.log('Fest Management System loaded');
};
