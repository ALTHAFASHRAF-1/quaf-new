// Configuration
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyDHIWxlWlw_54CKNvIY04wv9YeDOS3KfEhRZ9zkxNKTDYAMqaFEyPLIELr2a-mX4Q7Rg/exec";
    
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

    // Login Handler with timeout
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
        
        try {
            // Add timeout to fetch
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const resp = await fetch(`${SCRIPT_URL}?action=login&name=${encodeURIComponent(name)}&pswd=${encodeURIComponent(pswd)}`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            const result = await resp.json();
            
            if (result.status === "success") {
                currentUser = result.user;
                await initDashboard();
            } else {
                errMsg.innerText = result.message || "Invalid credentials";
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                errMsg.innerText = "Connection timeout. Please try again.";
            } else {
                errMsg.innerText = "Connection error. Please try again.";
            }
            console.error('Login error:', error);
        } finally {
            // Reset button state
            loginText.innerText = "Sign In";
            loginSpinner.classList.add('hidden');
            loginBtn.disabled = false;
        }
    }

    // Initialize Dashboard
    async function initDashboard() {
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
            const cacheKey = `admin_dashboard_${currentUser.sl_no}`;
            const cachedData = dataCache.get(cacheKey);
            
            if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
                processAdminData(cachedData.data);
                return;
            }
            
            // Single API call for all admin data
            const response = await fetch(`${SCRIPT_URL}?action=getAdminDashboard`);
            const result = await response.json();
            
            if (result.status === "success") {
                // Cache the data
                dataCache.set(cacheKey, {
                    data: result.dashboard,
                    timestamp: Date.now()
                });
                
                processAdminData(result.dashboard);
            } else {
                showError('Failed to load dashboard data');
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
            showError('Error loading dashboard data. Please refresh.');
        }
    }

    function processAdminData(dashboard) {
        // Initialize all tables
        initUsersTable(dashboard.users);
        initProgramsTable(dashboard.programs);
        initRegistrationTable(dashboard.registration);
        initScheduleTable(dashboard.schedule);
        initResultsTable(dashboard.results);
    }

    // Load Leader Data with single API call
    async function loadLeaderData() {
        try {
            const cacheKey = `leader_dashboard_${currentUser.team}`;
            const cachedData = dataCache.get(cacheKey);
            
            if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
                processLeaderData(cachedData.data);
                return;
            }
            
            const response = await fetch(`${SCRIPT_URL}?action=getLeaderDashboard&team=${encodeURIComponent(currentUser.team)}`);
            const result = await response.json();
            
            if (result.status === "success") {
                dataCache.set(cacheKey, {
                    data: result.dashboard,
                    timestamp: Date.now()
                });
                
                processLeaderData(result.dashboard);
            } else {
                showError('Failed to load dashboard data');
            }
        } catch (error) {
            console.error('Error loading leader data:', error);
            showError('Error loading dashboard data. Please refresh.');
        }
    }

    function processLeaderData(dashboard) {
        teamMembers = dashboard.teamMembers || [];
        allPrograms = dashboard.allPrograms || [];
        
        renderTeamMembers();
        renderAllPrograms();
        renderTeamRegistration(dashboard.teamRegistration || []);
        renderTeamSchedule(dashboard.teamSchedule || []);
        renderTeamResults(dashboard.teamResults || []);
        renderTeamPoints(dashboard.teamPoints || []);
    }

    // Load Member Data with single API call
    async function loadMemberData() {
        try {
            const cacheKey = `member_dashboard_${currentUser.name}`;
            const cachedData = dataCache.get(cacheKey);
            
            if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
                processMemberData(cachedData.data);
                return;
            }
            
            const response = await fetch(`${SCRIPT_URL}?action=getMemberDashboard&name=${encodeURIComponent(currentUser.name)}`);
            const result = await response.json();
            
            if (result.status === "success") {
                dataCache.set(cacheKey, {
                    data: result.dashboard,
                    timestamp: Date.now()
                });
                
                processMemberData(result.dashboard);
            } else {
                showError('Failed to load dashboard data');
            }
        } catch (error) {
            console.error('Error loading member data:', error);
            showError('Error loading dashboard data. Please refresh.');
        }
    }

    function processMemberData(dashboard) {
        renderMemberPrograms(dashboard.memberPrograms || []);
        renderMemberSchedule(dashboard.memberSchedule || []);
        renderMemberResults(dashboard.memberResults || []);
    }

    // Optimized DataTables initialization
    function initUsersTable(users) {
        if (userDataTable) {
            userDataTable.destroy();
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
                                <button onclick="editUser('${data.sl_no}')" class="text-blue-600 hover:text-blue-800">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteUser('${data.sl_no}', '${data.name}')" class="text-red-600 hover:text-red-800">
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
        if (programsDataTable) {
            programsDataTable.destroy();
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
                                <button onclick="editProgram('${data.code}')" class="text-blue-600 hover:text-blue-800">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteProgram('${data.code}', '${data.name}')" class="text-red-600 hover:text-red-800">
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
        if (registrationDataTable) {
            registrationDataTable.destroy();
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
                                <button onclick="editRegistration('${data.id}')" class="text-blue-600 hover:text-blue-800">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteRegistration('${data.id}', '${data.name}')" class="text-red-600 hover:text-red-800">
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
        if (scheduleDataTable) {
            scheduleDataTable.destroy();
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
                                <button onclick="editSchedule('${data.id}')" class="text-blue-600 hover:text-blue-800">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteSchedule('${data.id}', '${data.name}')" class="text-red-600 hover:text-red-800">
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
        if (resultsDataTable) {
            resultsDataTable.destroy();
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
                                <button onclick="editResult('${data.id}')" class="text-blue-600 hover:text-blue-800">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteResult('${data.id}', '${data.name}')" class="text-red-600 hover:text-red-800">
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
        const container = document.querySelector('#resultsLeaderContent .grid');
        container.innerHTML = '';
        
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
        
        try {
            const response = await fetch(`${SCRIPT_URL}?action=addUser`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
            
            const result = await response.json();
            
            if (result.status === "success") {
                alert('User added successfully!');
                closeModal('addUserModal');
                clearCache(); // Clear all cached data
                loadAdminData(); // Refresh the table
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Error saving user. Please try again.');
        }
    }

    async function saveProgram() {
        const programData = {
            code: document.getElementById('programCode').value,
            name: document.getElementById('programName').value,
            category: document.getElementById('programCategory').value
        };
        
        if (!programData.code || !programData.name || !programData.category) {
            alert('Please fill in all fields');
            return;
        }
        
        try {
            const response = await fetch(`${SCRIPT_URL}?action=addProgram`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(programData)
            });
            
            const result = await response.json();
            
            if (result.status === "success") {
                alert('Program added successfully!');
                closeModal('addProgramModal');
                clearCache();
                loadAdminData();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving program:', error);
            alert('Error saving program. Please try again.');
        }
    }

    async function saveRegistration() {
        const regData = {
            code: document.getElementById('regCode').value,
            program_name: document.getElementById('regProgramName').value,
            category: document.getElementById('regCategory').value,
            sl_no: document.getElementById('regSlNo').value,
            name: document.getElementById('regName').value,
            team: document.getElementById('regTeam').value
        };
        
        if (!regData.code || !regData.program_name || !regData.category || !regData.sl_no || !regData.name || !regData.team) {
            alert('Please fill in all fields');
            return;
        }
        
        try {
            const response = await fetch(`${SCRIPT_URL}?action=addRegistration`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(regData)
            });
            
            const result = await response.json();
            
            if (result.status === "success") {
                alert('Registration added successfully!');
                closeModal('addRegistrationModal');
                clearCache();
                loadAdminData();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving registration:', error);
            alert('Error saving registration. Please try again.');
        }
    }

    async function saveSchedule() {
        const scheduleData = {
            code: document.getElementById('scheduleCode').value,
            program_name: document.getElementById('scheduleProgramName').value,
            category: document.getElementById('scheduleCategory').value,
            sl_no: document.getElementById('scheduleSlNo').value,
            name: document.getElementById('scheduleName').value,
            team: document.getElementById('scheduleTeam').value,
            date: document.getElementById('scheduleDate').value,
            time: document.getElementById('scheduleTime').value,
            venue: document.getElementById('scheduleVenue').value
        };
        
        if (!scheduleData.code || !scheduleData.program_name || !scheduleData.category || !scheduleData.sl_no || !scheduleData.name || !scheduleData.team || !scheduleData.date || !scheduleData.time || !scheduleData.venue) {
            alert('Please fill in all fields');
            return;
        }
        
        try {
            const response = await fetch(`${SCRIPT_URL}?action=addSchedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(scheduleData)
            });
            
            const result = await response.json();
            
            if (result.status === "success") {
                alert('Schedule added successfully!');
                closeModal('addScheduleModal');
                clearCache();
                loadAdminData();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving schedule:', error);
            alert('Error saving schedule. Please try again.');
        }
    }

    async function saveResult() {
        const resultData = {
            code: document.getElementById('resultCode').value,
            program_name: document.getElementById('resultProgramName').value,
            category: document.getElementById('resultCategory').value,
            sl_no: document.getElementById('resultSlNo').value,
            name: document.getElementById('resultName').value,
            team: document.getElementById('resultTeam').value,
            position: document.getElementById('resultPosition').value,
            grade: document.getElementById('resultGrade').value,
            points: document.getElementById('resultPoints').value
        };
        
        if (!resultData.code || !resultData.program_name || !resultData.category || !resultData.sl_no || !resultData.name || !resultData.team || !resultData.position || !resultData.points) {
            alert('Please fill in all required fields');
            return;
        }
        
        try {
            const response = await fetch(`${SCRIPT_URL}?action=addResult`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(resultData)
            });
            
            const result = await response.json();
            
            if (result.status === "success") {
                alert('Result added successfully!');
                closeModal('addResultModal');
                clearCache();
                loadAdminData();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving result:', error);
            alert('Error saving result. Please try again.');
        }
    }

    async function saveLeaderRegistration() {
        const memberSelect = document.getElementById('leaderMemberSelect');
        const programSelect = document.getElementById('leaderProgramSelect');
        
        const memberName = memberSelect.value;
        const programName = programSelect.value;
        const programCode = document.getElementById('autoProgramCode').value;
        const programCategory = document.getElementById('autoProgramCategory').value;
        
        if (!memberName || !programName) {
            alert('Please select both member and program');
            return;
        }
        
        // Find member details
        const member = teamMembers.find(m => m.name === memberName);
        if (!member) {
            alert('Member not found');
            return;
        }
        
        const regData = {
            code: programCode,
            program_name: programName,
            category: programCategory,
            sl_no: member.sl_no,
            name: memberName,
            team: currentUser.team
        };
        
        try {
            const response = await fetch(`${SCRIPT_URL}?action=addRegistration`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(regData)
            });
            
            const result = await response.json();
            
            if (result.status === "success") {
                alert('Registration added successfully!');
                closeModal('leaderRegistrationModal');
                clearCache();
                loadLeaderData();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving registration:', error);
            alert('Error saving registration. Please try again.');
        }
    }

    // Edit Functions
    async function editUser(slNo) {
        try {
            const response = await fetch(`${SCRIPT_URL}?action=getUser&sl_no=${slNo}`);
            const result = await response.json();
            
            if (result.status === "success") {
                const user = result.user;
                currentEditType = 'user';
                currentEditId = slNo;
                
                const formContent = `
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">SL.No</label>
                            <input type="number" id="editUserSlNo" value="${user.sl_no}" class="form-input w-full p-3 rounded-lg">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
                            <input type="text" id="editUserName" value="${user.name}" class="form-input w-full p-3 rounded-lg">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
                            <select id="editUserRole" class="form-input w-full p-3 rounded-lg">
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                                <option value="leader" ${user.role === 'leader' ? 'selected' : ''}>Leader</option>
                                <option value="member" ${user.role === 'member' ? 'selected' : ''}>Member</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <input type="password" id="editUserPassword" placeholder="Leave blank to keep current" class="form-input w-full p-3 rounded-lg">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Team</label>
                            <input type="text" id="editUserTeam" value="${user.team}" class="form-input w-full p-3 rounded-lg">
                        </div>
                    </div>
                `;
                
                document.getElementById('editModalTitle').innerText = 'Edit User';
                document.getElementById('editFormContent').innerHTML = formContent;
                document.getElementById('editModal').style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading user:', error);
            alert('Error loading user data');
        }
    }

    // Delete Functions
    async function deleteUser(slNo, userName) {
        if (confirm(`Are you sure you want to delete user: ${userName}?`)) {
            try {
                const response = await fetch(`${SCRIPT_URL}?action=deleteUser&sl_no=${slNo}`);
                const result = await response.json();
                
                if (result.status === "success") {
                    alert('User deleted successfully!');
                    clearCache();
                    loadAdminData();
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Error deleting user');
            }
        }
    }

    async function deleteProgram(code, name) {
        if (confirm(`Are you sure you want to delete program: ${name}?`)) {
            try {
                const response = await fetch(`${SCRIPT_URL}?action=deleteProgram&code=${code}`);
                const result = await response.json();
                
                if (result.status === "success") {
                    alert('Program deleted successfully!');
                    clearCache();
                    loadAdminData();
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                console.error('Error deleting program:', error);
                alert('Error deleting program');
            }
        }
    }

    // Update Record
    async function updateRecord() {
        // Implementation for update
        alert('Update functionality to be implemented');
        closeModal('editModal');
    }

    // Clear cache function
    function clearCache() {
        dataCache.clear();
    }

    // Show error function
    function showError(message) {
        alert(message);
    }

    // Logout
    function logout() {
        if (confirm("Are you sure you want to logout?")) {
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
        const refreshBtn = document.createElement('button');
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        refreshBtn.className = 'fixed bottom-4 right-4 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors';
        refreshBtn.title = 'Refresh Data';
        refreshBtn.onclick = function() {
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
