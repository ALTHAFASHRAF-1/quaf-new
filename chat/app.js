// WhatsApp Style Chat Application
// Google Sheets Backend

// =============================
// 📊 Google Sheets Integration
// =============================
class GoogleSheetsAPI {
    constructor() {
        // ⚠️ REPLACE THIS URL WITH YOUR GOOGLE APPS SCRIPT WEB APP URL
        this.apiUrl = "https://script.google.com/macros/s/AKfycbxGIklkc4BHmIIlSmFLgtCegzYVUGHEke6td3ZyWJViHxZOvhGHNL1gyW75jhcQyVPM/exec";
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

    async getUserSheet(adNo) {
        try {
            return await this.getSheet(adNo);
        } catch (error) {
            console.error(`Error fetching user sheet ${adNo}:`, error);
            return [];
        }
    }

    async sendMessage(senderAdNo, receiverAdNo, message, isFile = false, fileName = '', fileUrl = '') {
        try {
            const timestamp = new Date().toISOString();
            const currentTime = new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });

            // Add to sender's sheet (send column)
            const senderRow = {
                'send_msg': isFile ? `File: ${fileName}` : message,
                'time': currentTime,
                'reply_msg': '',
                'time_1': '',
                'send_file': isFile ? fileUrl : '',
                'time_2': isFile ? currentTime : '',
                'reply_file': '',
                'time_3': ''
            };

            // Add to receiver's sheet (reply column)
            const receiverRow = {
                'send_msg': '',
                'time': '',
                'reply_msg': isFile ? `File: ${fileName}` : message,
                'time_1': currentTime,
                'send_file': '',
                'time_2': '',
                'reply_file': isFile ? fileUrl : '',
                'time_3': isFile ? currentTime : ''
            };

            const senderResult = await this.addRow(senderAdNo, senderRow);
            const receiverResult = await this.addRow(receiverAdNo, receiverRow);

            if (senderResult && !senderResult.error && receiverResult && !receiverResult.error) {
                return { success: true, timestamp };
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            return { error: error.message };
        }
    }

    async uploadFile(file) {
        try {
            // Note: This is a simplified version
            // In a real implementation, you would upload to Google Drive
            // and get a shareable link
            
            // For now, return a mock URL
            return `https://drive.google.com/file/d/mock_${file.name}_${Date.now()}`;
        } catch (error) {
            console.error('Error uploading file:', error);
            return null;
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
        const result = await api.login(username, password);
        
        console.log('Login result:', result);
        
        if (result.success && result.user) {
            currentUser = {
                ad_no: result.user.ad_no || username,
                name: result.user.name || 'User',
                role: result.user.role?.toLowerCase() || 'member'
            };

            // Show dashboard
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('dashboardContainer').classList.remove('hidden');
            
            // Update UI with user info
            updateUserUI();
            
            // Load user's chats
            await loadChatList();
            
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
    
    // Stop refresh intervals
    if (chatRefreshInterval) clearInterval(chatRefreshInterval);
    if (messageRefreshInterval) clearInterval(messageRefreshInterval);
    
    // Reset UI
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('dashboardContainer').classList.add('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    showLoginError('');
    
    // Clear all intervals
    const highestIntervalId = setInterval(() => {});
    for (let i = 0; i < highestIntervalId; i++) {
        clearInterval(i);
    }
}

// =============================
// 👤 Update User UI
// =============================
function updateUserUI() {
    if (!currentUser) return;

    const welcomeUser = document.getElementById('welcomeUser');
    const profileName = document.getElementById('profileName');
    const profileAdNo = document.getElementById('profileAdNo');
    const profilePic = document.getElementById('profilePic');
    const menuProfilePic = document.getElementById('menuProfilePic');

    // Update welcome message
    if (welcomeUser) welcomeUser.textContent = `Welcome, ${currentUser.name}`;
    
    // Update profile info
    if (profileName) profileName.textContent = currentUser.name;
    if (profileAdNo) profileAdNo.textContent = `@${currentUser.ad_no}`;
    
    // Update profile pictures
    const profileUrl = `https://quaf.tech/pic/${currentUser.ad_no}.jpg`;
    if (profilePic) {
        profilePic.src = profileUrl;
        profilePic.onerror = function() {
            this.style.display = 'none';
            document.getElementById('profileFallback').classList.remove('hidden');
        };
    }
    
    if (menuProfilePic) {
        menuProfilePic.src = profileUrl;
        menuProfilePic.onerror = function() {
            this.style.display = 'none';
            document.getElementById('menuProfileFallback').classList.remove('hidden');
        };
    }
}

// =============================
// 💬 Chat Functions
// =============================
async function loadChatList() {
    try {
        const chatList = document.getElementById('chatList');
        if (!chatList) return;

        // Get all users except current user
        const users = await api.getSheet('user_credentials');
        allUsers = users.filter(user => {
            const userAdNo = user.ad_no || '';
            const userRole = (user.role || '').toLowerCase();
            return userAdNo !== currentUser.ad_no && userRole !== 'admin';
        });

        if (allUsers.length === 0) {
            chatList.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-comments text-3xl text-[#8696a0] mb-3"></i>
                    <p class="text-[#8696a0]">No other users found</p>
                </div>
            `;
            return;
        }

        let html = '';
        allUsers.forEach(user => {
            const adNo = user.ad_no || '';
            const name = user.name || 'Unknown User';
            const profileUrl = `https://quaf.tech/pic/${adNo}.jpg`;
            
            // Get last message from user's sheet
            // This would be implemented to show last message preview
            
            html += `
                <div class="chat-item p-4" onclick="openChat('${adNo}', '${name}')">
                    <div class="flex items-center space-x-3">
                        <div class="relative">
                            <img src="${profileUrl}" alt="${name}" 
                                 class="profile-pic" 
                                 onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden')">
                            <div class="profile-pic-fallback hidden">
                                <i class="fas fa-user"></i>
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-start">
                                <h4 class="font-medium text-white truncate">${name}</h4>
                                <span class="text-xs text-[#8696a0]">Just now</span>
                            </div>
                            <p class="text-sm text-[#8696a0] truncate">Start chatting...</p>
                        </div>
                    </div>
                </div>
            `;
        });

        chatList.innerHTML = html;

        // Start refreshing chat list
        if (chatRefreshInterval) clearInterval(chatRefreshInterval);
        chatRefreshInterval = setInterval(loadChatList, 10000); // Refresh every 10 seconds

    } catch (error) {
        console.error('Error loading chat list:', error);
    }
}

async function openChat(adNo, name) {
    currentChat = { adNo, name };
    
    // Update UI for desktop
    updateChatHeader(adNo, name);
    document.getElementById('messageInputArea').classList.remove('hidden');
    
    // Update UI for mobile
    updateMobileChatHeader(adNo, name);
    document.getElementById('mobileMessageInputArea').classList.remove('hidden');
    
    // Show chat area
    if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.add('hidden');
        document.getElementById('mobileChatArea').classList.remove('hidden');
    }
    
    // Load messages
    await loadMessages(adNo);
    
    // Start refreshing messages
    if (messageRefreshInterval) clearInterval(messageRefreshInterval);
    messageRefreshInterval = setInterval(() => loadMessages(adNo), 3000); // Refresh every 3 seconds
    
    // Focus on input
    setTimeout(() => {
        const input = window.innerWidth < 768 ? 
            document.getElementById('mobileMessageInput') : 
            document.getElementById('messageInput');
        if (input) input.focus();
    }, 100);
}

function updateChatHeader(adNo, name) {
    const chatHeader = document.getElementById('chatHeader');
    const profileUrl = `https://quaf.tech/pic/${adNo}.jpg`;
    
    chatHeader.innerHTML = `
        <div class="flex items-center space-x-3">
            <div class="relative">
                <img src="${profileUrl}" alt="${name}" 
                     class="profile-pic" 
                     onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden')">
                <div class="profile-pic-fallback hidden">
                    <i class="fas fa-user"></i>
                </div>
            </div>
            <div>
                <h3 class="font-bold text-white">${name}</h3>
                <p class="text-xs text-[#8696a0]">Online</p>
            </div>
        </div>
    `;
}

function updateMobileChatHeader(adNo, name) {
    const mobileChatHeader = document.getElementById('mobileChatHeader');
    const profileUrl = `https://quaf.tech/pic/${adNo}.jpg`;
    
    mobileChatHeader.innerHTML = `
        <div class="flex items-center space-x-3">
            <div class="relative">
                <img src="${profileUrl}" alt="${name}" 
                     class="profile-pic" 
                     onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden')">
                <div class="profile-pic-fallback hidden">
                    <i class="fas fa-user"></i>
                </div>
            </div>
            <div>
                <h3 class="font-bold text-white">${name}</h3>
                <p class="text-xs text-[#8696a0]">Online</p>
            </div>
        </div>
    `;
}

async function loadMessages(adNo) {
    try {
        // Load both sheets (current user and chat user)
        const [currentUserSheet, chatUserSheet] = await Promise.all([
            api.getUserSheet(currentUser.ad_no),
            api.getUserSheet(adNo)
        ]);

        // Combine and sort messages
        const messages = [];
        
        // Messages sent by current user (from send columns)
        if (Array.isArray(currentUserSheet)) {
            currentUserSheet.forEach(row => {
                if (row.send_msg && row.send_msg.trim() !== '') {
                    messages.push({
                        type: 'out',
                        message: row.send_msg,
                        time: row.time,
                        isFile: row.send_file !== '',
                        fileUrl: row.send_file
                    });
                }
            });
        }
        
        // Messages received from chat user (from reply columns)
        if (Array.isArray(chatUserSheet)) {
            chatUserSheet.forEach(row => {
                if (row.reply_msg && row.reply_msg.trim() !== '') {
                    messages.push({
                        type: 'in',
                        message: row.reply_msg,
                        time: row.time_1,
                        isFile: row.reply_file !== '',
                        fileUrl: row.reply_file
                    });
                }
            });
        }
        
        // Sort by time (assuming chronological order)
        messages.sort((a, b) => {
            // Simple time comparison - in real app, use actual timestamps
            return a.time.localeCompare(b.time);
        });

        // Update messages container
        updateMessagesContainer(messages, window.innerWidth < 768);

    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function updateMessagesContainer(messages, isMobile = false) {
    const containerId = isMobile ? 'mobileMessagesContainer' : 'messagesContainer';
    const container = document.getElementById(containerId);
    
    if (!container) return;

    if (messages.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-comment-slash text-4xl text-[#303d45] mb-3"></i>
                <p class="text-[#8696a0]">No messages yet</p>
                <p class="text-sm text-[#8696a0] mt-1">Send a message to start the conversation</p>
            </div>
        `;
        return;
    }

    let html = '';
    messages.forEach(msg => {
        const messageClass = msg.type === 'out' ? 'message-out ml-auto' : 'message-in';
        
        if (msg.isFile && msg.fileUrl) {
            // File message
            const fileName = msg.message.replace('File: ', '');
            const fileType = getFileType(fileName);
            const fileIcon = getFileIcon(fileType);
            
            html += `
                <div class="mb-4 ${messageClass} p-3">
                    <div class="flex items-center space-x-3">
                        <div class="file-icon">
                            <i class="fas ${fileIcon}"></i>
                        </div>
                        <div class="flex-1">
                            <a href="${msg.fileUrl}" target="_blank" 
                               class="text-white hover:underline font-medium">
                                ${fileName}
                            </a>
                            <div class="text-xs text-[#8696a0] mt-1">
                                Click to download
                            </div>
                        </div>
                    </div>
                    <div class="message-time text-right">${msg.time}</div>
                </div>
            `;
        } else {
            // Text message
            html += `
                <div class="mb-4 ${messageClass} p-3">
                    <div class="text-white whitespace-pre-wrap break-words">${msg.message}</div>
                    <div class="message-time text-right">${msg.time}</div>
                </div>
            `;
        }
    });

    container.innerHTML = html;
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function getFileType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return 'image';
    if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'word';
    if (['xls', 'xlsx'].includes(ext)) return 'excel';
    if (['ppt', 'pptx'].includes(ext)) return 'powerpoint';
    return 'file';
}

function getFileIcon(fileType) {
    const icons = {
        'image': 'fa-image',
        'video': 'fa-video',
        'audio': 'fa-music',
        'pdf': 'fa-file-pdf',
        'word': 'fa-file-word',
        'excel': 'fa-file-excel',
        'powerpoint': 'fa-file-powerpoint',
        'file': 'fa-file'
    };
    return icons[fileType] || 'fa-file';
}

// =============================
// ✉️ Send Message Functions
// =============================
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    const fileInput = document.getElementById('fileInput');
    const filePreview = document.getElementById('filePreview');
    
    await sendMessageInternal(message, fileInput, filePreview);
    
    // Clear inputs
    messageInput.value = '';
    messageInput.style.height = 'auto';
    fileInput.value = '';
    filePreview.classList.add('hidden');
    filePreview.innerHTML = '';
}

async function sendMobileMessage() {
    const messageInput = document.getElementById('mobileMessageInput');
    const message = messageInput.value.trim();
    const fileInput = document.getElementById('mobileFileInput');
    const filePreview = document.getElementById('mobileFilePreview');
    
    await sendMessageInternal(message, fileInput, filePreview);
    
    // Clear inputs
    messageInput.value = '';
    messageInput.style.height = 'auto';
    fileInput.value = '';
    filePreview.classList.add('hidden');
    filePreview.innerHTML = '';
}

async function sendMessageInternal(message, fileInput, filePreview) {
    if (!currentChat || (!message && fileInput.files.length === 0)) {
        return;
    }

    const sendButton = document.getElementById('sendButton') || 
                       document.getElementById('mobileSendButton');
    const originalText = sendButton.innerHTML;
    
    try {
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        sendButton.disabled = true;

        let result;
        
        if (fileInput.files.length > 0) {
            // Send file
            const file = fileInput.files[0];
            const fileUrl = await api.uploadFile(file);
            
            if (fileUrl) {
                result = await api.sendMessage(
                    currentUser.ad_no,
                    currentChat.adNo,
                    `File: ${file.name}`,
                    true,
                    file.name,
                    fileUrl
                );
            } else {
                throw new Error('Failed to upload file');
            }
        } else {
            // Send text message
            result = await api.sendMessage(
                currentUser.ad_no,
                currentChat.adNo,
                message
            );
        }

        if (result && !result.error) {
            // Reload messages
            await loadMessages(currentChat.adNo);
        } else {
            throw new Error(result?.error || 'Failed to send message');
        }

    } catch (error) {
        console.error('Error sending message:', error);
        alert('Error sending message: ' + error.message);
    } finally {
        sendButton.innerHTML = originalText;
        sendButton.disabled = false;
    }
}

// =============================
// 👥 Users List for New Chat
// =============================
async function loadUsersForNewChat() {
    try {
        const usersList = document.getElementById('usersList');
        if (!usersList) return;

        if (allUsers.length === 0) {
            // Load users if not already loaded
            const users = await api.getSheet('user_credentials');
            allUsers = users.filter(user => {
                const userAdNo = user.ad_no || '';
                const userRole = (user.role || '').toLowerCase();
                return userAdNo !== currentUser.ad_no && userRole !== 'admin';
            });
        }

        if (allUsers.length === 0) {
            usersList.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-users text-3xl text-[#8696a0] mb-3"></i>
                    <p class="text-[#8696a0]">No other users found</p>
                </div>
            `;
            return;
        }

        let html = '';
        allUsers.forEach(user => {
            const adNo = user.ad_no || '';
            const name = user.name || 'Unknown User';
            const profileUrl = `https://quaf.tech/pic/${adNo}.jpg`;
            
            html += `
                <div class="chat-item p-3 rounded-lg" onclick="startNewChat('${adNo}', '${name}')">
                    <div class="flex items-center space-x-3">
                        <div class="relative">
                            <img src="${profileUrl}" alt="${name}" 
                                 class="profile-pic" 
                                 onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden')">
                            <div class="profile-pic-fallback hidden">
                                <i class="fas fa-user"></i>
                            </div>
                        </div>
                        <div class="flex-1">
                            <h4 class="font-medium text-white">${name}</h4>
                            <p class="text-sm text-[#8696a0]">${adNo}</p>
                        </div>
                    </div>
                </div>
            `;
        });

        usersList.innerHTML = html;

    } catch (error) {
        console.error('Error loading users for new chat:', error);
    }
}

function startNewChat(adNo, name) {
    closeNewChatModal();
    openChat(adNo, name);
}

// =============================
// 🔐 Change Password Functions
// =============================
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
    
    // Search chats
    const searchInput = document.getElementById('searchChats');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterChats(searchTerm);
        });
    }
    
    // Press Enter to send message
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    const mobileMessageInput = document.getElementById('mobileMessageInput');
    if (mobileMessageInput) {
        mobileMessageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMobileMessage();
            }
        });
    }
});

function filterChats(searchTerm) {
    const chatItems = document.querySelectorAll('#chatList .chat-item');
    
    chatItems.forEach(item => {
        const name = item.querySelector('h4').textContent.toLowerCase();
        const lastMessage = item.querySelector('p').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || lastMessage.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Export for use in console
window.login = login;
window.logout = logout;
window.openChangePasswordModal = openChangePasswordModal;
window.showNewChatModal = showNewChatModal;
window.startNewChat = startNewChat;
window.openChat = openChat;
window.sendMessage = sendMessage;
window.sendMobileMessage = sendMobileMessage;
window.closeMobileChat = closeMobileChat;

console.log('%c💬 WhatsApp Style Chat Application 💬', 'color: #25D366; font-size: 16px; font-weight: bold;');
console.log('%cDeveloped with Google Sheets Backend', 'color: #128C7E; font-size: 12px;');
