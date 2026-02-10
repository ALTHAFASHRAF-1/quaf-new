// WhatsApp Style Chat Application
// Google Sheets Backend

// =============================
// 📊 Google Sheets Integration
// =============================
class GoogleSheetsAPI {
    constructor() {
        // ⚠️ REPLACE THIS URL WITH YOUR GOOGLE APPS SCRIPT WEB APP URL
        this.apiUrl = "https://script.google.com/macros/s/AKfycbyHsnlh3LFr993ePr7hJhsOxgWbDgIiWUsC09XF1yfGVq90pifYJSdkoXibFMCcGpNb/exec";
    }

    async getSheet(sheetName) {
        try {
            const url = `${this.apiUrl}?sheet=${encodeURIComponent(sheetName)}&t=${Date.now()}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const text = await response.text();
            let data;
            
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.log('Raw response:', text);
                data = [];
            }
            
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error(`Error fetching ${sheetName}:`, error);
            return [];
        }
    }

    async addRow(sheetName, rowData) {
        try {
            console.log(`Adding row to ${sheetName}:`, rowData);
            
            const url = this.apiUrl;
            const formData = new FormData();
            formData.append('sheet', sheetName);
            formData.append('data', JSON.stringify(rowData));
            
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.text();
            console.log(`Add row result for ${sheetName}:`, result);
            
            // Try to parse JSON, but if it fails, return as-is
            try {
                return JSON.parse(result);
            } catch (e) {
                return { success: true, message: result };
            }
        } catch (error) {
            console.error('Error adding row:', error);
            return { error: error.message };
        }
    }

    async login(username, password) {
        try {
            const url = this.apiUrl;
            const formData = new FormData();
            formData.append('action', 'login');
            formData.append('username', username);
            formData.append('password', password);
            
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });
            
            const resultText = await response.text();
            console.log('Login raw response:', resultText);
            
            let result;
            try {
                result = JSON.parse(resultText);
            } catch (e) {
                console.log('Raw login response:', resultText);
                result = { success: false, error: 'Invalid server response' };
            }
            
            return result;
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error: ' + error.message };
        }
    }

    async updatePassword(username, newPassword) {
        try {
            const url = this.apiUrl;
            const formData = new FormData();
            formData.append('action', 'updatePassword');
            formData.append('username', username);
            formData.append('newPassword', newPassword);
            
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.text();
            let parsedResult;
            
            try {
                parsedResult = JSON.parse(result);
            } catch (e) {
                parsedResult = { success: true, message: result };
            }
            
            return parsedResult;
        } catch (error) {
            console.error('Error updating password:', error);
            return { error: error.message };
        }
    }

    async uploadFile(file) {
        try {
            console.log('Uploading file:', file.name, file.type, file.size);
            
            const url = this.apiUrl;
            const formData = new FormData();
            formData.append('action', 'uploadFile');
            formData.append('filename', file.name);
            formData.append('fileType', file.type);
            
            // Convert file to base64
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async function(e) {
                    const base64Content = e.target.result.split(',')[1];
                    formData.append('fileContent', base64Content);
                    
                    try {
                        const response = await fetch(url, {
                            method: 'POST',
                            body: formData
                        });
                        
                        const resultText = await response.text();
                        console.log('Upload raw response:', resultText);
                        
                        let result;
                        try {
                            result = JSON.parse(resultText);
                        } catch (e) {
                            result = { success: false, error: 'Invalid server response' };
                        }
                        
                        resolve(result);
                    } catch (error) {
                        console.error('Upload fetch error:', error);
                        resolve({ success: false, error: error.message });
                    }
                };
                reader.onerror = function(error) {
                    console.error('FileReader error:', error);
                    resolve({ success: false, error: 'Failed to read file' });
                };
                reader.readAsDataURL(file);
            });
        } catch (error) {
            console.error('Error uploading file:', error);
            return { success: false, error: error.message };
        }
    }
}

const api = new GoogleSheetsAPI();

// =============================
// 🌍 Global Variables
// =============================
let currentUser = null;
let currentChat = null;
let allUsers = [];
let refreshInterval = null;
let selectedFiles = [];
let mobileSelectedFiles = [];
const EMOJIS = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'];

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
        
        console.log('Login result:', result);
        
        if (result.success) {
            currentUser = {
                ad_no: result.user.ad_no || username,
                name: result.user.name || 'User',
                role: result.user.role || 'member'
            };

            // Show dashboard
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('dashboardContainer').classList.remove('hidden');
            
            // Update UI with user info
            updateUserUI();
            
            // Load user's chats
            await loadChatList();
            
            showLoginError('');
            
            // Start auto-refresh
            startAutoRefresh();
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
    currentChat = null;
    selectedFiles = [];
    mobileSelectedFiles = [];
    
    // Stop refresh interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    
    // Reset UI
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('dashboardContainer').classList.add('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('chatList').innerHTML = '<div class="text-center py-8"><div class="loading-dots inline-block"><span></span><span></span><span></span></div><p class="text-gray-600 mt-2">Loading chats...</p></div>';
    document.getElementById('messagesContainer').innerHTML = '<div class="text-center py-8"><i class="fab fa-whatsapp text-4xl text-gray-300 mb-3"></i><p class="text-gray-600">Select a chat to view messages</p></div>';
    document.getElementById('messageInputArea').classList.add('hidden');
    showLoginError('');
}

// =============================
// 👤 User Interface Functions
// =============================
function updateUserUI() {
    if (!currentUser) return;

    // Update welcome message
    const welcomeUser = document.getElementById('welcomeUser');
    if (welcomeUser) welcomeUser.textContent = `Welcome, ${currentUser.name}`;
    
    // Update profile info
    const profileName = document.getElementById('profileName');
    const profileAdNo = document.getElementById('profileAdNo');
    if (profileName) profileName.textContent = currentUser.name;
    if (profileAdNo) profileAdNo.textContent = `@${currentUser.ad_no}`;
    
    // Update profile pictures
    const profileUrl = `https://quaf.tech/pic/${currentUser.ad_no}.jpg`;
    const profilePic = document.getElementById('profilePic');
    const menuProfilePic = document.getElementById('menuProfilePic');
    
    if (profilePic) profilePic.src = profileUrl;
    if (menuProfilePic) menuProfilePic.src = profileUrl;
}

function toggleProfileMenu() {
    const profileMenu = document.getElementById('profileMenu');
    profileMenu.classList.toggle('hidden');
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
            const userAdNo = user['ad:no'] || user.ad_no || '';
            const userRole = (user.role || '').toLowerCase();
            return userAdNo !== currentUser.ad_no && userRole !== 'admin';
        });

        if (allUsers.length === 0) {
            chatList.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-comments text-3xl text-gray-400 mb-3"></i>
                    <p class="text-gray-600">No other users found</p>
                </div>
            `;
            return;
        }

        let html = '';
        for (const user of allUsers) {
            const adNo = user['ad:no'] || user.ad_no || '';
            const name = user.name || 'Unknown User';
            const lastMessage = await getLastMessage(adNo);
            
            html += `
                <div class="chat-item p-4" onclick="openChat('${adNo}', '${name.replace(/'/g, "\\'")}')">
                    <div class="flex items-center space-x-3">
                        <div class="relative">
                            <img src="https://quaf.tech/pic/${adNo}.jpg" alt="${name}" 
                                 class="profile-pic" 
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iI0VCRUJFQiIvPjxwYXRoIGQ9Ik0yMCAxMUMyMi4yMDYgMTEgMjQgMTIuNzk0IDI0IDE1QzI0IDE3LjIwNiAyMi4yMDYgMTkgMjAgMTlDMTcuNzk0IDE5IDE2IDE3LjIwNiAxNiAxNUMxNiAxMi43OTQgMTcuNzk0IDExIDIwIDExWk0yMCAyMUMyMy44NiAyMSAyNyAyNC4xNCAyNyAyOEgyM0gyN0MyNyAzMS44NiAyMy44NiAzNSAyMCAzNUMxNi4xNCAzNSAxMyAzMS44NiAxMyAyOEgxN0gxM0MxMyAyNC4xNCAxNi4xNCAyMSAyMCAyMVoiIGZpbGw9IiM5Nzk3OTciLz48L3N2Zz4='">
                            <div class="online-indicator"></div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-start">
                                <h4 class="font-medium text-gray-800 truncate">${name}</h4>
                                <span class="text-xs text-gray-500">${lastMessage.time || ''}</span>
                            </div>
                            <p class="text-sm text-gray-600 truncate">${lastMessage.text || 'Start chatting...'}</p>
                        </div>
                    </div>
                </div>
            `;
        }

        chatList.innerHTML = html;
    } catch (error) {
        console.error('Error loading chat list:', error);
        chatList.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-3"></i>
                <p class="text-red-500">Error loading chats</p>
            </div>
        `;
    }
}

async function getLastMessage(adNo) {
    try {
        const messages = await api.getSheet(currentUser.ad_no);
        if (!messages || messages.length === 0) return {};
        
        // Find messages with this user
        const userMessages = messages.filter(msg => 
            (msg['send_msg_ad:no'] === adNo && msg['send_msg']) ||
            (msg['reply_msg_ad:no'] === adNo && msg['reply_msg']) ||
            (msg['send_file_ad:no'] === adNo && msg['send_file']) ||
            (msg['reply_file_ad:no'] === adNo && msg['reply_file'])
        );
        
        if (userMessages.length === 0) return {};
        
        // Get the most recent message
        const lastMsg = userMessages[userMessages.length - 1];
        
        if (lastMsg['send_msg_ad:no'] === adNo && lastMsg['send_msg']) {
            return {
                text: lastMsg.send_msg,
                time: lastMsg.send_msg_time || ''
            };
        } else if (lastMsg['reply_msg_ad:no'] === adNo && lastMsg['reply_msg']) {
            return {
                text: lastMsg.reply_msg,
                time: lastMsg.reply_msg_time || ''
            };
        } else if (lastMsg['send_file_ad:no'] === adNo && lastMsg['send_file']) {
            return {
                text: '📎 File',
                time: lastMsg.send_file_time || ''
            };
        } else if (lastMsg['reply_file_ad:no'] === adNo && lastMsg['reply_file']) {
            return {
                text: '📎 File',
                time: lastMsg.reply_file_time || ''
            };
        }
        
        return {};
    } catch (error) {
        console.error('Error getting last message:', error);
        return {};
    }
}

async function openChat(adNo, name) {
    currentChat = { adNo, name };
    
    // Highlight active chat
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Update UI for desktop
    updateChatHeader(adNo, name);
    document.getElementById('messageInputArea').classList.remove('hidden');
    document.getElementById('chatArea').classList.remove('hidden');
    
    // Update UI for mobile
    updateMobileChatHeader(adNo, name);
    document.getElementById('mobileMessageInputArea').classList.remove('hidden');
    
    // Show chat area
    if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.add('hidden');
        document.getElementById('mobileChatArea').classList.remove('hidden');
    }
    
    // Load messages
    await loadMessages();
    
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
    
    chatHeader.innerHTML = `
        <div class="flex items-center space-x-3">
            <div class="relative">
                <img src="https://quaf.tech/pic/${adNo}.jpg" alt="${name}" 
                     class="profile-pic" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iI0VCRUJFQiIvPjxwYXRoIGQ9Ik0yMCAxMUMyMi4yMDYgMTEgMjQgMTIuNzk0IDI0IDE1QzI0IDE3LjIwNiAyMi4yMDYgMTkgMjAgMTlDMTcuNzk0IDE9IDE2IDE3LjIwNiAxNiAxNUMxNiAxMi43OTQgMTcuNzk0IDExIDIwIDExWk0yMCAyMUMyMy44NiAyMSAyNyAyNC4xNCAyNyAyOEgyM0gyN0MyNyAzMS44NiAyMy44NiAzNSAyMCAzNUMxNi4xNCAzNSAxMyAzMS44NiAxMyAyOEgxN0gxM0MxMyAyNC4xNCAxNi4xNCAyMSAyMCAyMVoiIGZpbGw9IiM5Nzk3OTciLz48L3N2Zz4='">
                <div class="online-indicator"></div>
            </div>
            <div>
                <h3 class="font-bold text-gray-800">${name}</h3>
                <p class="text-xs text-gray-600">Online</p>
            </div>
        </div>
    `;
}

function updateMobileChatHeader(adNo, name) {
    const mobileChatHeader = document.getElementById('mobileChatHeader');
    
    mobileChatHeader.innerHTML = `
        <div class="flex items-center space-x-3">
            <div class="relative">
                <img src="https://quaf.tech/pic/${adNo}.jpg" alt="${name}" 
                     class="profile-pic" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iI0VCRUJFQiIvPjxwYXRoIGQ9Ik0yMCAxMUMyMi4yMDYgMTEgMjQgMTIuNzk0IDI0IDE1QzI0IDE3LjIwNiAyMi4yMDYgMTkgMjAgMTlDMTcuNzk0IDE5IDE2IDE3LjIwNiAxZTE2IDE1QzE2IDEyLjc5NCAxNy43OTQgMTEgMjAgMTFaTTIwIDIxQzIzLjg2IDIxIDI3IDI0LjE0IDI3IDI4SDIzSDI3QzI3IDMxLjg2IDIzLjg2IDM1IDIwIDM1QzE2LjE0IDM1IDEzIDMxLjg2IDEzIDI4SDE3SDEzQzEzIDI0LjE0IDE2LjE0IDIxIDIwIDIxWiIgZmlsbD0iIzk3OTc5NyIvPjwvc3ZnPg==='">
                <div class="online-indicator"></div>
            </div>
            <div>
                <h3 class="font-bold text-gray-800">${name}</h3>
                <p class="text-xs text-gray-600">Online</p>
            </div>
        </div>
    `;
}

async function loadMessages() {
    if (!currentChat || !currentUser) return;
    
    try {
        const messages = await api.getSheet(currentUser.ad_no);
        const chatMessages = messages.filter(msg => 
            (msg['send_msg_ad:no'] === currentChat.adNo) ||
            (msg['reply_msg_ad:no'] === currentChat.adNo) ||
            (msg['send_file_ad:no'] === currentChat.adNo) ||
            (msg['reply_file_ad:no'] === currentChat.adNo)
        );
        
        // Update messages container
        updateMessagesContainer(chatMessages, window.innerWidth < 768);
        
    } catch (error) {
        console.error('Error loading messages:', error);
        const containerId = window.innerWidth < 768 ? 'mobileMessagesContainer' : 'messagesContainer';
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-3"></i>
                    <p class="text-red-500">Error loading messages</p>
                </div>
            `;
        }
    }
}

function updateMessagesContainer(messages, isMobile = false) {
    const containerId = isMobile ? 'mobileMessagesContainer' : 'messagesContainer';
    const container = document.getElementById(containerId);
    
    if (!container) return;

    if (messages.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-comment-slash text-4xl text-gray-300 mb-3"></i>
                <p class="text-gray-600">No messages yet</p>
                <p class="text-sm text-gray-500 mt-1">Send a message to start the conversation</p>
            </div>
        `;
        return;
    }

    let html = '';
    let lastDate = '';
    
    // Sort messages by time
    const sortedMessages = messages.sort((a, b) => {
        const getTime = (msg) => {
            return msg.send_msg_time || msg.reply_msg_time || msg.send_file_time || msg.reply_file_time || '';
        };
        return new Date(getTime(a)) - new Date(getTime(b));
    });
    
    sortedMessages.forEach(msg => {
        // Check if this is an outgoing message (sent by current user to currentChat user)
        const isOutgoingMsg = msg['send_msg_ad:no'] === currentChat.adNo;
        const isOutgoingFile = msg['send_file_ad:no'] === currentChat.adNo;
        const isOutgoing = isOutgoingMsg || isOutgoingFile;
        
        const messageClass = isOutgoing ? 'message-out' : 'message-in';
        
        let messageText = '';
        let fileUrl = '';
        let messageTime = '';
        
        if (isOutgoingMsg) {
            messageText = msg.send_msg || '';
            messageTime = msg.send_msg_time || '';
        } else if (msg['reply_msg_ad:no'] === currentChat.adNo) {
            messageText = msg.reply_msg || '';
            messageTime = msg.reply_msg_time || '';
        } else if (isOutgoingFile) {
            fileUrl = msg.send_file || '';
            messageTime = msg.send_file_time || '';
        } else if (msg['reply_file_ad:no'] === currentChat.adNo) {
            fileUrl = msg.reply_file || '';
            messageTime = msg.reply_file_time || '';
        }
        
        // Display date separator if date changed
        const messageDate = messageTime ? messageTime.split(',')[0] : '';
        if (messageDate && messageDate !== lastDate) {
            html += `
                <div class="flex justify-center my-4">
                    <span class="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full">${messageDate}</span>
                </div>
            `;
            lastDate = messageDate;
        }
        
        if (fileUrl && fileUrl.trim() !== '') {
            // File message
            const fileName = fileUrl.split('/').pop() || 'File';
            const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName);
            const isVideo = /\.(mp4|mov|avi|wmv|flv|mkv|webm)$/i.test(fileName);
            const isAudio = /\.(mp3|wav|ogg|m4a|flac)$/i.test(fileName);
            const isPDF = /\.(pdf)$/i.test(fileName);
            const isDocument = /\.(doc|docx|txt|rtf)$/i.test(fileName);
            const isSpreadsheet = /\.(xls|xlsx|csv)$/i.test(fileName);
            
            let icon = 'fa-file';
            if (isImage) icon = 'fa-image';
            else if (isVideo) icon = 'fa-video';
            else if (isAudio) icon = 'fa-music';
            else if (isPDF) icon = 'fa-file-pdf';
            else if (isDocument) icon = 'fa-file-word';
            else if (isSpreadsheet) icon = 'fa-file-excel';
            
            html += `
                <div class="mb-4 ${isOutgoing ? 'ml-auto' : ''}" style="max-width: 65%;">
                    <div class="${messageClass} p-3">
                        <div class="flex items-center space-x-3">
                            <div class="file-icon">
                                <i class="fas ${icon}"></i>
                            </div>
                            <div class="flex-1">
                                <div class="text-gray-800 font-medium truncate">${fileName}</div>
                                <a href="${fileUrl}" target="_blank" class="text-xs text-blue-500 hover:text-blue-700 mt-1 inline-block">
                                    <i class="fas fa-download mr-1"></i>Download (${formatFileSizeFromUrl(fileUrl)})
                                </a>
                            </div>
                        </div>
                        <div class="message-time">${messageTime || ''}</div>
                    </div>
                </div>
            `;
        } else if (messageText && messageText.trim() !== '') {
            // Text message
            html += `
                <div class="mb-4 ${isOutgoing ? 'ml-auto' : ''}" style="max-width: 65%;">
                    <div class="${messageClass} p-3">
                        <div class="text-gray-800 whitespace-pre-wrap break-words">${messageText}</div>
                        <div class="message-time">${messageTime || ''}</div>
                    </div>
                </div>
            `;
        }
    });

    container.innerHTML = html;
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function formatFileSizeFromUrl(url) {
    // This is a placeholder. In a real app, you'd need to get the file size from the server.
    return 'File';
}

// =============================
// ✉️ Message Sending Functions
// =============================
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (message || selectedFiles.length > 0) {
        await sendMessageInternal(message, selectedFiles, false);
        
        // Clear inputs
        messageInput.value = '';
        messageInput.style.height = 'auto';
        selectedFiles = [];
        
        // Hide file preview
        const filePreview = document.getElementById('filePreview');
        if (filePreview) {
            filePreview.classList.add('hidden');
            filePreview.innerHTML = '';
        }
        
        // Reset file input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.value = '';
    }
}

async function sendMobileMessage() {
    const messageInput = document.getElementById('mobileMessageInput');
    const message = messageInput.value.trim();
    
    if (message || mobileSelectedFiles.length > 0) {
        await sendMessageInternal(message, mobileSelectedFiles, true);
        
        // Clear inputs
        messageInput.value = '';
        messageInput.style.height = 'auto';
        mobileSelectedFiles = [];
        
        // Hide file preview
        const filePreview = document.getElementById('mobileFilePreview');
        if (filePreview) {
            filePreview.classList.add('hidden');
            filePreview.innerHTML = '';
        }
        
        // Reset file input
        const fileInput = document.getElementById('mobileFileInput');
        if (fileInput) fileInput.value = '';
    }
}

async function sendMessageInternal(message, files, isMobile = false) {
    if (!currentChat || (!message && files.length === 0)) {
        return;
    }

    const sendButton = isMobile ? 
        document.getElementById('mobileSendButton') : 
        document.getElementById('sendButton');
    const originalText = sendButton.innerHTML;
    
    try {
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        sendButton.disabled = true;

        let fileLinks = [];
        
        // Upload files if any
        if (files.length > 0) {
            for (const file of files) {
                console.log('Uploading file:', file.name);
                const uploadResult = await api.uploadFile(file);
                console.log('Upload result:', uploadResult);
                
                if (uploadResult.success && uploadResult.fileUrl) {
                    fileLinks.push(uploadResult.fileUrl);
                } else {
                    console.error('File upload failed:', uploadResult);
                    alert(`Failed to upload ${file.name}: ${uploadResult.error || 'Unknown error'}`);
                }
            }
        }

        const currentTime = new Date().toLocaleString('en-US', { 
            month: 'short',
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });

        console.log('Current time:', currentTime);
        console.log('File links:', fileLinks);

        // ===========================================
        // SENDER'S SHEET (Current User)
        // ===========================================
        let senderRow = {};
        
        if (message && fileLinks.length === 0) {
            // Only text message
            senderRow = {
                'send_msg_ad:no': currentChat.adNo,
                'send_msg': message,
                'send_msg_time': currentTime,
                'reply_msg_ad:no': '',
                'reply_msg': '',
                'reply_msg_time': '',
                'send_file_ad:no': '',
                'send_file': '',
                'send_file_time': '',
                'reply_file_ad:no': '',
                'reply_file': '',
                'reply_file_time': ''
            };
        } else if (fileLinks.length > 0 && !message) {
            // Only file(s)
            senderRow = {
                'send_msg_ad:no': '',
                'send_msg': '',
                'send_msg_time': '',
                'reply_msg_ad:no': '',
                'reply_msg': '',
                'reply_msg_time': '',
                'send_file_ad:no': currentChat.adNo,
                'send_file': fileLinks.join(', '),
                'send_file_time': currentTime,
                'reply_file_ad:no': '',
                'reply_file': '',
                'reply_file_time': ''
            };
        } else if (fileLinks.length > 0 && message) {
            // Both text and file(s)
            // Send as separate rows for clarity
            const textRow = {
                'send_msg_ad:no': currentChat.adNo,
                'send_msg': message,
                'send_msg_time': currentTime,
                'reply_msg_ad:no': '',
                'reply_msg': '',
                'reply_msg_time': '',
                'send_file_ad:no': '',
                'send_file': '',
                'send_file_time': '',
                'reply_file_ad:no': '',
                'reply_file': '',
                'reply_file_time': ''
            };
            
            const fileRow = {
                'send_msg_ad:no': '',
                'send_msg': '',
                'send_msg_time': '',
                'reply_msg_ad:no': '',
                'reply_msg': '',
                'reply_msg_time': '',
                'send_file_ad:no': currentChat.adNo,
                'send_file': fileLinks.join(', '),
                'send_file_time': currentTime,
                'reply_file_ad:no': '',
                'reply_file': '',
                'reply_file_time': ''
            };
            
            // Send text row
            console.log('Sending text row to sender:', textRow);
            const textResult = await api.addRow(currentUser.ad_no, textRow);
            console.log('Text row result:', textResult);
            
            // Send file row
            console.log('Sending file row to sender:', fileRow);
            const fileResult = await api.addRow(currentUser.ad_no, fileRow);
            console.log('File row result:', fileResult);
            
            senderRow = fileRow; // For receiver use
        }

        // ===========================================
        // RECEIVER'S SHEET (Chat User)
        // ===========================================
        let receiverRow = {};
        
        if (message && fileLinks.length === 0) {
            // Only text message
            receiverRow = {
                'send_msg_ad:no': '',
                'send_msg': '',
                'send_msg_time': '',
                'reply_msg_ad:no': currentUser.ad_no,
                'reply_msg': message,
                'reply_msg_time': currentTime,
                'send_file_ad:no': '',
                'send_file': '',
                'send_file_time': '',
                'reply_file_ad:no': '',
                'reply_file': '',
                'reply_file_time': ''
            };
        } else if (fileLinks.length > 0 && !message) {
            // Only file(s)
            receiverRow = {
                'send_msg_ad:no': '',
                'send_msg': '',
                'send_msg_time': '',
                'reply_msg_ad:no': '',
                'reply_msg': '',
                'reply_msg_time': '',
                'send_file_ad:no': '',
                'send_file': '',
                'send_file_time': '',
                'reply_file_ad:no': currentUser.ad_no,
                'reply_file': fileLinks.join(', '),
                'reply_file_time': currentTime
            };
        } else if (fileLinks.length > 0 && message) {
            // Both text and file(s) - send as separate rows
            const textRow = {
                'send_msg_ad:no': '',
                'send_msg': '',
                'send_msg_time': '',
                'reply_msg_ad:no': currentUser.ad_no,
                'reply_msg': message,
                'reply_msg_time': currentTime,
                'send_file_ad:no': '',
                'send_file': '',
                'send_file_time': '',
                'reply_file_ad:no': '',
                'reply_file': '',
                'reply_file_time': ''
            };
            
            const fileRow = {
                'send_msg_ad:no': '',
                'send_msg': '',
                'send_msg_time': '',
                'reply_msg_ad:no': '',
                'reply_msg': '',
                'reply_msg_time': '',
                'send_file_ad:no': '',
                'send_file': '',
                'send_file_time': '',
                'reply_file_ad:no': currentUser.ad_no,
                'reply_file': fileLinks.join(', '),
                'reply_file_time': currentTime
            };
            
            // Send text row to receiver
            console.log('Sending text row to receiver:', textRow);
            const textResult = await api.addRow(currentChat.adNo, textRow);
            console.log('Text row to receiver result:', textResult);
            
            // Send file row to receiver
            console.log('Sending file row to receiver:', fileRow);
            const fileResult = await api.addRow(currentChat.adNo, fileRow);
            console.log('File row to receiver result:', fileResult);
            
            receiverRow = fileRow; // For reference
        }

        // If we have a single row (not separate text/file), send it
        if (Object.keys(senderRow).length > 0 && !(fileLinks.length > 0 && message)) {
            console.log('Sending single row to sender:', senderRow);
            const senderResult = await api.addRow(currentUser.ad_no, senderRow);
            console.log('Sender result:', senderResult);
        }
        
        if (Object.keys(receiverRow).length > 0 && !(fileLinks.length > 0 && message)) {
            console.log('Sending single row to receiver:', receiverRow);
            const receiverResult = await api.addRow(currentChat.adNo, receiverRow);
            console.log('Receiver result:', receiverResult);
        }

        // Reload messages
        await loadMessages();
        
        // Reload chat list to update last message
        await loadChatList();

    } catch (error) {
        console.error('Error sending message:', error);
        alert('Error sending message: ' + error.message);
    } finally {
        sendButton.innerHTML = originalText;
        sendButton.disabled = false;
    }
}

// =============================
// 🗃️ File Handling Functions
// =============================
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    selectedFiles = selectedFiles.concat(files);
    showFilePreview(selectedFiles, 'filePreview');
}

function handleMobileFileSelect(event) {
    const files = Array.from(event.target.files);
    mobileSelectedFiles = mobileSelectedFiles.concat(files);
    showFilePreview(mobileSelectedFiles, 'mobileFilePreview');
}

function showFilePreview(files, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (files.length === 0) {
        container.classList.add('hidden');
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = '';
    
    files.forEach((file, index) => {
        const preview = document.createElement('div');
        preview.className = 'file-preview mb-2';
        
        let icon = 'fa-file';
        if (file.type.startsWith('image/')) icon = 'fa-image';
        else if (file.type.startsWith('video/')) icon = 'fa-video';
        else if (file.type.startsWith('audio/')) icon = 'fa-music';
        else if (file.type.includes('pdf')) icon = 'fa-file-pdf';
        else if (file.type.includes('word')) icon = 'fa-file-word';
        else if (file.type.includes('excel')) icon = 'fa-file-excel';
        
        preview.innerHTML = `
            <div class="file-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="flex-1">
                <div class="text-sm font-medium text-gray-800 truncate">${file.name}</div>
                <div class="text-xs text-gray-600">${formatFileSize(file.size)}</div>
            </div>
            <button onclick="removeFilePreview(${index}, '${containerId}')" class="text-gray-500 hover:text-gray-700">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(preview);
    });
    
    container.classList.remove('hidden');
}

function removeFilePreview(index, containerId) {
    if (containerId.includes('mobile')) {
        mobileSelectedFiles.splice(index, 1);
        showFilePreview(mobileSelectedFiles, containerId);
    } else {
        selectedFiles.splice(index, 1);
        showFilePreview(selectedFiles, containerId);
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// =============================
// 😀 Emoji Picker Functions
// =============================
function toggleEmojiPicker() {
    const pickerContainer = document.getElementById('emojiPickerContainer');
    pickerContainer.classList.toggle('show');
    
    // Close mobile picker if open
    const mobilePicker = document.getElementById('mobileEmojiPickerContainer');
    mobilePicker.classList.remove('show');
    
    // Initialize emojis if not already done
    if (pickerContainer.querySelector('.grid').children.length === 0) {
        initializeEmojiPicker(pickerContainer);
    }
}

function toggleMobileEmojiPicker() {
    const pickerContainer = document.getElementById('mobileEmojiPickerContainer');
    pickerContainer.classList.toggle('show');
    
    // Close desktop picker if open
    const desktopPicker = document.getElementById('emojiPickerContainer');
    desktopPicker.classList.remove('show');
    
    // Initialize emojis if not already done
    if (pickerContainer.querySelector('.grid').children.length === 0) {
        initializeEmojiPicker(pickerContainer);
    }
}

function initializeEmojiPicker(pickerContainer) {
    const grid = pickerContainer.querySelector('.grid');
    EMOJIS.forEach(emoji => {
        const button = document.createElement('button');
        button.className = 'text-lg hover:bg-gray-100 rounded p-1';
        button.textContent = emoji;
        button.onclick = function() {
            const messageInput = pickerContainer.id.includes('mobile') ? 
                document.getElementById('mobileMessageInput') : 
                document.getElementById('messageInput');
            if (messageInput) {
                const cursorPos = messageInput.selectionStart;
                const textBefore = messageInput.value.substring(0, cursorPos);
                const textAfter = messageInput.value.substring(cursorPos);
                messageInput.value = textBefore + emoji + textAfter;
                messageInput.focus();
                messageInput.selectionStart = messageInput.selectionEnd = cursorPos + emoji.length;
                autoResizeTextarea(messageInput);
            }
            pickerContainer.classList.remove('show');
        };
        grid.appendChild(button);
    });
}

// =============================
// 📱 Mobile Functions
// =============================
function closeMobileChat() {
    document.getElementById('mobileChatArea').classList.add('hidden');
    document.getElementById('sidebar').classList.remove('hidden');
    document.getElementById('mobileMessageInputArea').classList.add('hidden');
    currentChat = null;
    
    // Clear file selections
    mobileSelectedFiles = [];
    const mobileFilePreview = document.getElementById('mobileFilePreview');
    if (mobileFilePreview) {
        mobileFilePreview.classList.add('hidden');
        mobileFilePreview.innerHTML = '';
    }
}

// =============================
// 🔄 Auto Refresh
// =============================
function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    refreshInterval = setInterval(async () => {
        if (currentUser) {
            await loadChatList();
            if (currentChat) {
                await loadMessages();
            }
        }
    }, 3000); // Refresh every 3 seconds
}

// =============================
// 👥 New Chat Modal Functions
// =============================
function showNewChatModal() {
    document.getElementById('newChatModal').classList.remove('hidden');
    loadUsersForNewChat();
}

function closeNewChatModal() {
    document.getElementById('newChatModal').classList.add('hidden');
}

async function loadUsersForNewChat() {
    try {
        const usersList = document.getElementById('usersList');
        if (!usersList) return;

        if (allUsers.length === 0) {
            // Load users if not already loaded
            const users = await api.getSheet('user_credentials');
            allUsers = users.filter(user => {
                const userAdNo = user['ad:no'] || user.ad_no || '';
                const userRole = (user.role || '').toLowerCase();
                return userAdNo !== currentUser.ad_no && userRole !== 'admin';
            });
        }

        if (allUsers.length === 0) {
            usersList.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-users text-3xl text-gray-400 mb-3"></i>
                    <p class="text-gray-600">No other users found</p>
                </div>
            `;
            return;
        }

        let html = '';
        allUsers.forEach(user => {
            const adNo = user['ad:no'] || user.ad_no || '';
            const name = user.name || 'Unknown User';
            
            html += `
                <div class="chat-item p-3 rounded-lg hover:bg-gray-50 cursor-pointer" onclick="startNewChat('${adNo}', '${name.replace(/'/g, "\\'")}')">
                    <div class="flex items-center space-x-3">
                        <div class="relative">
                            <img src="https://quaf.tech/pic/${adNo}.jpg" alt="${name}" 
                                 class="profile-pic" 
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iI0VCRUJFQiIvPjxwYXRoIGQ9Ik0yMCAxMUMyMi4yMDYgMTEgMjQgMTIuNzk0IDI0IDE1QzI0IDE3LjIwNiAyMi4yMDYgMTkgMjAgMTlDMTcuNzk0IDE5IDE2IDE3LjIwNiAxNiAxNUMxNiAxMi43OTQgMTcuNzk0IDExIDIwIDExWk0yMCAyMUMyMy44NiAyMSAyNyAyNC4xNCAyNyAyOEgyM0gyN0MyNyAzMS44NiAyMy44NiAzNSAyMCAzNUMxNi4xNCAzNSAxMyAzMS44NiAxMyAyOEgxN0gxM0MxMyAyNC4xNCAxNi4xNCAyMSAyMCAyMVoiIGZpbGw9IiM5Nzk3OTciLz48L3N2Zz4='">
                            <div class="online-indicator"></div>
                        </div>
                        <div class="flex-1">
                            <h4 class="font-medium text-gray-800">${name}</h4>
                            <p class="text-sm text-gray-600">${adNo}</p>
                        </div>
                    </div>
                </div>
            `;
        });

        usersList.innerHTML = html;

    } catch (error) {
        console.error('Error loading users for new chat:', error);
        usersList.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-3"></i>
                <p class="text-red-500">Error loading users</p>
            </div>
        `;
    }
}

function startNewChat(adNo, name) {
    closeNewChatModal();
    openChat(adNo, name);
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
    
    // Close profile menu
    toggleProfileMenu();
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
    
    // Hide previous messages
    errorDiv.classList.add('hidden');
    successDiv.classList.add('hidden');
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        errorDiv.textContent = 'Please fill in all fields';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    if (newPassword.length < 4) {
        errorDiv.textContent = 'New password must be at least 4 characters';
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
            successDiv.textContent = 'Password changed successfully! You will be logged out in 3 seconds.';
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
// 📝 Utility Functions
// =============================
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
    
    if (textarea.scrollHeight > 120) {
        textarea.style.height = '120px';
        textarea.style.overflowY = 'auto';
    } else {
        textarea.style.overflowY = 'hidden';
    }
}

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
    
    // Press Enter to send message (Shift+Enter for new line)
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
    
    // Close modals when clicking outside
    document.addEventListener('click', function(event) {
        // Profile menu
        const profileMenu = document.getElementById('profileMenu');
        const profileButton = event.target.closest('button[onclick="toggleProfileMenu()"]');
        if (!profileButton && profileMenu && !profileMenu.classList.contains('hidden') && 
            !profileMenu.contains(event.target)) {
            profileMenu.classList.add('hidden');
        }

        // Emoji pickers
        const emojiPickers = ['emojiPickerContainer', 'mobileEmojiPickerContainer'];
        emojiPickers.forEach(pickerId => {
            const picker = document.getElementById(pickerId);
            if (picker && !picker.contains(event.target) && 
                !event.target.closest('button[onclick*="toggleEmojiPicker"]')) {
                picker.classList.remove('show');
            }
        });

        // Modals
        const modals = ['changePasswordModal', 'newChatModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal && event.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });
    
    // Initialize emoji pickers
    const desktopPicker = document.getElementById('emojiPickerContainer');
    const mobilePicker = document.getElementById('mobileEmojiPickerContainer');
    
    if (desktopPicker) {
        const desktopGrid = desktopPicker.querySelector('.grid');
        if (desktopGrid && desktopGrid.children.length === 0) {
            initializeEmojiPicker(desktopPicker);
        }
    }
    
    if (mobilePicker) {
        const mobileGrid = mobilePicker.querySelector('.grid');
        if (mobileGrid && mobileGrid.children.length === 0) {
            initializeEmojiPicker(mobilePicker);
        }
    }
});

// Make functions available globally
window.login = login;
window.logout = logout;
window.toggleProfileMenu = toggleProfileMenu;
window.openChangePasswordModal = openChangePasswordModal;
window.closeChangePasswordModal = closeChangePasswordModal;
window.showNewChatModal = showNewChatModal;
window.closeNewChatModal = closeNewChatModal;
window.toggleEmojiPicker = toggleEmojiPicker;
window.toggleMobileEmojiPicker = toggleMobileEmojiPicker;
window.closeMobileChat = closeMobileChat;
window.handleFileSelect = handleFileSelect;
window.handleMobileFileSelect = handleMobileFileSelect;
window.removeFilePreview = removeFilePreview;
window.autoResizeTextarea = autoResizeTextarea;
window.sendMessage = sendMessage;
window.sendMobileMessage = sendMobileMessage;
window.openChat = openChat;
window.startNewChat = startNewChat;

console.log('%c💬 WhatsApp Style Chat Application 💬', 'color: #25D366; font-size: 16px; font-weight: bold;');
console.log('%cDeveloped with Google Sheets Backend', 'color: #128C7E; font-size: 12px;');
