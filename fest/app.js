// Global variables
let currentUser = null;
let googleScriptUrl = 'https://script.google.com/macros/s/AKfycbw4jv2l7Ksh0Nrewmr6SDwl3f7uploLSEqVBkiWmiq8lX0Bcs3XafmaFtPE4wmpISFg/exec'; // Add your Google Apps Script Web App URL here

// Google Apps Script API functions
async function callGoogleScript(functionName, data = {}) {
    try {
        const response = await fetch(`${googleScriptUrl}?action=${functionName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error('Error calling Google Script:', error);
        return { success: false, message: 'Network error' };
    }
}

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get Google Script URL from query parameter or prompt
    const urlParams = new URLSearchParams(window.location.search);
    googleScriptUrl = urlParams.get('scriptUrl') || prompt('Please enter your Google Apps Script Web App URL:');
    
    if (!googleScriptUrl) {
        alert('Google Script URL is required. Please reload the page and provide the URL.');
        return;
    }
    
    // Login functionality
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
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

// Handle login
async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    if (!username || !password) {
        errorDiv.textContent = 'Please enter username and password';
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
            errorDiv.textContent = response.message || 'Invalid credentials';
        }
    } catch (error) {
        errorDiv.textContent = 'Login failed. Please try again.';
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
    document.getElementById(`${pageName}Page`).classList.add('active');
    
    // Activate corresponding button
    document.querySelector(`#${dashboard}Dashboard .sidebar-btn[data-page="${pageName}"]`).classList.add('active');
    
    // Load data for specific pages
    if (dashboard === 'leader' && pageName === 'teamResults') {
        loadTeamResults();
    } else if (dashboard === 'admin' && pageName === 'viewAll') {
        loadAllData();
    }
}

// Update schedule table
function updateScheduleTable(scheduleData) {
    const tbody = document.querySelector('#scheduleTable tbody');
    tbody.innerHTML = '';
    
    scheduleData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item[0]}</td>
            <td>${item[1]}</td>
            <td>${item[2]}</td>
            <td>${item[3]}</td>
            <td>${item[4]}</td>
        `;
        tbody.appendChild(row);
    });
}

// Update programs table
function updateProgramsTable(programs) {
    const tbody = document.querySelector('#programsTable tbody');
    tbody.innerHTML = '';
    
    programs.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item[0]}</td>
            <td>${item[1]}</td>
            <td>${item[4]}</td>
        `;
        tbody.appendChild(row);
    });
}

// Update results table
function updateResultsTable(results) {
    const tbody = document.querySelector('#resultsTable tbody');
    tbody.innerHTML = '';
    
    let totalPoints = 0;
    
    results.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item[0]}</td>
            <td>${item[2]}</td>
            <td>${item[3]}</td>
            <td>${item[4]}</td>
        `;
        tbody.appendChild(row);
        totalPoints += parseInt(item[4]) || 0;
    });
    
    document.getElementById('totalPoints').textContent = totalPoints;
}

// Update points summary
function updatePointsSummary(programCount, results) {
    document.getElementById('stageCount').textContent = programCount[3] || 0;
    document.getElementById('nonStageCount').textContent = programCount[4] || 0;
    document.getElementById('sportsCount').textContent = programCount[5] || 0;
    document.getElementById('totalPrograms').textContent = programCount[6] || 0;
    
    const statusElement = document.getElementById('programStatus');
    statusElement.textContent = programCount[7] || 'OK';
    statusElement.dataset.status = programCount[7] || 'OK';
    
    // Calculate total points from results
    const totalPoints = results.reduce((sum, result) => sum + (parseInt(result[4]) || 0), 0);
    document.getElementById('totalPoints').textContent = totalPoints;
}

// Update team members table
function updateTeamMembersTable(teamMembers, programCounts) {
    const tbody = document.querySelector('#teamMembersTable tbody');
    tbody.innerHTML = '';
    
    teamMembers.forEach(member => {
        const programCount = programCounts?.find(pc => pc[0] === member[0]);
        const status = programCount ? programCount[7] : 'OK';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${member[0]}</td>
            <td>${member[1]}</td>
            <td>${member[2]}</td>
            <td>${member[3]}</td>
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
    
    registrations.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item[0]}</td>
            <td>${item[1]}</td>
            <td>${item[2]}</td>
            <td>${item[3]}</td>
        `;
        tbody.appendChild(row);
    });
}

// Populate member select for assigning programs
function populateMemberSelect(teamMembers) {
    const select = document.getElementById('memberSelect');
    select.innerHTML = '<option value="">Select a member</option>';
    
    teamMembers.forEach(member => {
        const option = document.createElement('option');
        option.value = JSON.stringify({
            slNo: member[0],
            name: member[2]
        });
        option.textContent = `${member[2]} (${member[3]})`;
        select.appendChild(option);
    });
}

// Assign program to member
async function assignProgram() {
    const memberSelect = document.getElementById('memberSelect');
    const programCodeSelect = document.getElementById('programCodeSelect');
    const programNameInput = document.getElementById('programName');
    const messageDiv = document.getElementById('assignMessage');
    
    if (!memberSelect.value || !programCodeSelect.value || !programNameInput.value) {
        messageDiv.textContent = 'Please fill all fields';
        messageDiv.className = 'message error';
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
        messageDiv.textContent = response.message;
        messageDiv.className = 'message success';
        
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
        messageDiv.textContent = response.message;
        messageDiv.className = 'message error';
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
    
    results.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item[0]}</td>
            <td>${item[1]}</td>
            <td>${item[2]}</td>
            <td>${item[3]}</td>
            <td>${item[4]}</td>
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
    }
}

// Update all users table
function updateAllUsersTable(users) {
    const tbody = document.querySelector('#allUsersTable tbody');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user[0]}</td>
            <td>${user[1]}</td>
            <td>${user[2]}</td>
            <td>${user[3]}</td>
            <td>${user[5]}</td>
        `;
        tbody.appendChild(row);
    });
}

// Update admin schedule table
function updateAdminScheduleTable(schedule) {
    const tbody = document.querySelector('#adminScheduleTable tbody');
    tbody.innerHTML = '';
    
    schedule.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item[0]}</td>
            <td>${item[1]}</td>
            <td>${item[2]}</td>
            <td>${item[3]}</td>
            <td>${item[4]}</td>
        `;
        tbody.appendChild(row);
    });
}

// Update all results table
function updateAllResultsTable(results) {
    const tbody = document.querySelector('#allResultsTable tbody');
    tbody.innerHTML = '';
    
    results.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item[0]}</td>
            <td>${item[1]}</td>
            <td>${item[2]}</td>
            <td>${item[3]}</td>
            <td>${item[4]}</td>
        `;
        tbody.appendChild(row);
    });
}

// Update all registrations table
function updateAllRegistrationsTable(registrations) {
    const tbody = document.querySelector('#allRegistrationsTable tbody');
    tbody.innerHTML = '';
    
    registrations.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item[0]}</td>
            <td>${item[1]}</td>
            <td>${item[2]}</td>
            <td>${item[3]}</td>
            <td>${item[4]}</td>
        `;
        tbody.appendChild(row);
    });
}

// Update all program counts table
function updateAllProgramCountsTable(programCounts) {
    const tbody = document.querySelector('#allProgramCountsTable tbody');
    tbody.innerHTML = '';
    
    programCounts.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item[0]}</td>
            <td>${item[1]}</td>
            <td>${item[2]}</td>
            <td>${item[3]}</td>
            <td>${item[4]}</td>
            <td>${item[5]}</td>
            <td>${item[6]}</td>
            <td><span class="status-badge status-${item[7].toLowerCase()}">${item[7]}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Add user (admin)
async function addUser() {
    const adNo = document.getElementById('adNo').value;
    const userName = document.getElementById('userName').value;
    const userRole = document.getElementById('userRole').value;
    const userTeam = document.getElementById('userTeam').value;
    const userPassword = document.getElementById('userPassword').value;
    const messageDiv = document.getElementById('userMessage');
    
    if (!adNo || !userName || !userPassword) {
        messageDiv.textContent = 'Please fill all required fields';
        messageDiv.className = 'message error';
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
        messageDiv.textContent = response.message;
        messageDiv.className = 'message success';
        
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
        messageDiv.textContent = response.message;
        messageDiv.className = 'message error';
    }
}

// Add schedule (admin)
async function addSchedule() {
    const date = document.getElementById('scheduleDate').value;
    const day = document.getElementById('scheduleDay').value;
    const time = document.getElementById('scheduleTime').value;
    const programCode = document.getElementById('scheduleProgramCode').value;
    const programName = document.getElementById('scheduleProgramName').value;
    const messageDiv = document.getElementById('scheduleMessage');
    
    if (!date || !day || !time || !programCode || !programName) {
        messageDiv.textContent = 'Please fill all fields';
        messageDiv.className = 'message error';
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
        messageDiv.textContent = response.message;
        messageDiv.className = 'message success';
        
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
        messageDiv.textContent = response.message;
        messageDiv.className = 'message error';
    }
}

// Calculate points for result
function calculatePoints() {
    const position = parseInt(document.getElementById('resultPosition').value);
    const grade = document.getElementById('resultGrade').value;
    const programCode = document.getElementById('resultProgramCode').value;
    const pointsField = document.getElementById('resultPoints');
    
    if (!position || !grade || !programCode) return;
    
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
    const programCode = document.getElementById('resultProgramCode').value;
    const slNo = parseInt(document.getElementById('resultSlNo').value);
    const position = parseInt(document.getElementById('resultPosition').value);
    const grade = document.getElementById('resultGrade').value;
    const points = parseInt(document.getElementById('resultPoints').value);
    const messageDiv = document.getElementById('resultMessage');
    
    if (!programCode || !slNo || !position || !grade || !points) {
        messageDiv.textContent = 'Please fill all fields';
        messageDiv.className = 'message error';
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
        messageDiv.textContent = response.message;
        messageDiv.className = 'message success';
        
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
        messageDiv.textContent = response.message;
        messageDiv.className = 'message error';
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

// Initialize
window.onload = function() {
    // Add enter key support for login
    document.getElementById('password')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
};
