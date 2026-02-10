// WhatsApp Style Chat Application
// Google Sheets Backend

// =============================
// 📊 Google Sheets Integration
// =============================
class GoogleSheetsAPI {
    constructor() {
        // ⚠️ REPLACE THIS URL WITH YOUR GOOGLE APPS SCRIPT WEB APP URL
        this.apiUrl = "https://script.google.com/macros/s/AKfycbwFTDifpbJuA5l-iJNxRnFIJm2D9iG-duhaxyzE-krb00d75NKPeoQvY1tjZrYlFX-h/exec";
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
            const url = this.apiUrl;
            const formData = new FormData();
            formData.append('sheet', sheetName);
            formData.append('data', JSON.stringify(rowData));
            
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.text();
            return { success: true, message: result };
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
}

const api = new GoogleSheetsAPI();

// =============================
// 🌍 Global Variables
// =============================
let currentUser = null;
let currentChat = null;
let allUsers = [];
let refreshInterval = null;
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
    document.getElementById('chatList').innerHTML = '<div class="text-center py-8"><div class="loading-dots inline-block"><span></span><span></span><span></span></div><p class="text-[#8696a0] mt-2">Loading chats...</p></div>';
    document.getElementById('messagesContainer').innerHTML = '<div class="text-center py-8"><i class="fab fa-whatsapp text-4xl text-[#303d45] mb-3"></i><p class="text-[#8696a0]">Select a chat to view messages</p></div>';
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
    
    if (profilePic) {
        profilePic.src = profileUrl;
        profilePic.onerror = function() {
            this.style.display = 'none';
            const fallback = document.getElementById('profileFallback');
            if (fallback) {
                fallback.classList.remove('hidden');
                fallback.textContent = currentUser.name.charAt(0).toUpperCase();
            }
        };
    }
    
    if (menuProfilePic) {
        menuProfilePic.src = profileUrl;
        menuProfilePic.onerror = function() {
            this.style.display = 'none';
            const fallback = document.getElementById('menuProfileFallback');
            if (fallback) {
                fallback.classList.remove('hidden');
                fallback.textContent = currentUser.name.charAt(0).toUpperCase();
            }
        };
    }
}

function toggleProfileMenu() {
    const profileMenu = document.getElementById('profileMenu');
    profileMenu.classList.toggle('hidden');
}

function showProfileFallback(img) {
    img.style.display = 'none';
    const fallback = document.getElementById('profileFallback');
    if (fallback) {
        fallback.classList.remove('hidden');
        if (currentUser) {
            fallback.textContent = currentUser.name.charAt(0).toUpperCase();
        }
    }
}

function showMenuProfileFallback(img) {
    img.style.display = 'none';
    const fallback = document.getElementById('menuProfileFallback');
    if (fallback) {
        fallback.classList.remove('hidden');
        if (currentUser) {
            fallback.textContent = currentUser.name.charAt(0).toUpperCase();
        }
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
            const userAdNo = user['ad:no'] || user.ad_no || '';
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
                                 onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.classList.remove('hidden')">
                            <div class="profile-pic-fallback hidden">${name.charAt(0).toUpperCase()}</div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-start">
                                <h4 class="font-medium text-white truncate">${name}</h4>
                                <span class="text-xs text-[#8696a0]">${lastMessage.time || ''}</span>
                            </div>
                            <p class="text-sm text-[#8696a0] truncate">${lastMessage.text || 'Start chatting...'}</p>
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
                <p class="text-red-400">Error loading chats</p>
            </div>
        `;
    }
}

async function getLastMessage(adNo) {
    try {
        const messages = await api.getSheet(currentUser.ad_no);
        if (!messages || messages.length === 0) return {};
        
        // Find messages with this user
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            // Check if this is a conversation with the target user
            if ((msg.send_msg && msg.send_msg.trim() !== '') || 
                (msg.reply_msg && msg.reply_msg.trim() !== '')) {
                return {
                    text: msg.send_msg || msg.reply_msg || '',
                    time: msg.time || msg.time_1 || ''
                };
            }
        }
        return {};
    } catch (error) {
        return {};
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
                     onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.classList.remove('hidden')">
                <div class="profile-pic-fallback hidden">${name.charAt(0).toUpperCase()}</div>
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
    
    mobileChatHeader.innerHTML = `
        <div class="flex items-center space-x-3">
            <div class="relative">
                <img src="https://quaf.tech/pic/${adNo}.jpg" alt="${name}" 
                     class="profile-pic" 
                     onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.classList.remove('hidden')">
                <div class="profile-pic-fallback hidden">${name.charAt(0).toUpperCase()}</div>
            </div>
            <div>
                <h3 class="font-bold text-white">${name}</h3>
                <p class="text-xs text-[#8696a0]">Online</p>
            </div>
        </div>
    `;
}

async function loadMessages() {
    if (!currentChat || !currentUser) return;
    
    try {
        const messages = await api.getSheet(currentUser.ad_no);
        const chatMessages = messages.filter(msg => 
            (msg.send_msg && msg.send_msg.trim() !== '') || 
            (msg.reply_msg && msg.reply_msg.trim() !== '')
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
                    <p class="text-red-400">Error loading messages</p>
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
                <i class="fas fa-comment-slash text-4xl text-[#303d45] mb-3"></i>
                <p class="text-[#8696a0]">No messages yet</p>
                <p class="text-sm text-[#8696a0] mt-1">Send a message to start the conversation</p>
            </div>
        `;
        return;
    }

    let html = '';
    messages.forEach(msg => {
        const isOutgoing = msg.send_msg && msg.send_msg.trim() !== '';
        const messageClass = isOutgoing ? 'message-out ml-auto' : 'message-in';
        const messageText = isOutgoing ? msg.send_msg : msg.reply_msg;
        const messageTime = isOutgoing ? msg.time : msg.time_1;
        
        if (messageText && messageText.startsWith('File:')) {
            // File message
            const fileName = messageText.replace('File: ', '');
            
            html += `
                <div class="mb-4 ${messageClass} p-3">
                    <div class="flex items-center space-x-3">
                        <div class="file-icon">
                            <i class="fas fa-file"></i>
                        </div>
                        <div class="flex-1">
                            <div class="text-white font-medium">${fileName}</div>
                            <div class="text-xs text-[#8696a0] mt-1">Click to download</div>
                        </div>
                    </div>
                    <div class="message-time text-right">${messageTime || ''}</div>
                </div>
            `;
        } else {
            // Text message
            html += `
                <div class="mb-4 ${messageClass} p-3">
                    <div class="text-white whitespace-pre-wrap break-words">${messageText || ''}</div>
                    <div class="message-time text-right">${messageTime || ''}</div>
                </div>
            `;
        }
    });

    container.innerHTML = html;
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// =============================
// ✉️ Message Sending Functions
// =============================
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    const fileInput = document.getElementById('fileInput');
    
    await sendMessageInternal(message, fileInput);
    
    // Clear inputs
    messageInput.value = '';
    messageInput.style.height = 'auto';
    if (fileInput) fileInput.value = '';
    
    // Hide file preview
    const filePreview = document.getElementById('filePreview');
    if (filePreview) {
        filePreview.classList.add('hidden');
        filePreview.innerHTML = '';
    }
}

async function sendMobileMessage() {
    const messageInput = document.getElementById('mobileMessageInput');
    const message = messageInput.value.trim();
    const fileInput = document.getElementById('mobileFileInput');
    
    await sendMessageInternal(message, fileInput);
    
    // Clear inputs
    messageInput.value = '';
    messageInput.style.height = 'auto';
    if (fileInput) fileInput.value = '';
    
    // Hide file preview
    const filePreview = document.getElementById('mobileFilePreview');
    if (filePreview) {
        filePreview.classList.add('hidden');
        filePreview.innerHTML = '';
    }
}

async function sendMessageInternal(message, fileInput) {
    if (!currentChat || (!message && (!fileInput || fileInput.files.length === 0))) {
        return;
    }

    const sendButton = document.getElementById('sendButton') || 
                       document.getElementById('mobileSendButton');
    const originalText = sendButton.innerHTML;
    
    try {
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        sendButton.disabled = true;

        let messageText = message;
        let isFile = false;
        
        if (fileInput && fileInput.files.length > 0) {
            // For file upload, you need to implement actual file upload to Google Drive
            // This is a simplified version
            const file = fileInput.files[0];
            messageText = `File: ${file.name}`;
            isFile = true;
        }

        // Add to sender's sheet (current user)
        const senderRow = {
            'send_msg': messageText,
            'time': new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            'reply_msg': '',
            'time_1': '',
            'send_file': isFile ? messageText : '',
            'time_2': isFile ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '',
            'reply_file': '',
            'time_3': ''
        };

        // Add to receiver's sheet (chat user)
        const receiverRow = {
            'send_msg': '',
            'time': '',
            'reply_msg': messageText,
            'time_1': new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            'send_file': '',
            'time_2': '',
            'reply_file': isFile ? messageText : '',
            'time_3': isFile ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''
        };

        // Send both rows
        await api.addRow(currentUser.ad_no, senderRow);
        await api.addRow(currentChat.adNo, receiverRow);

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
    const files = event.target.files;
    if (files.length > 0) {
        showFilePreview(files, 'filePreview');
    }
}

function handleMobileFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
        showFilePreview(files, 'mobileFilePreview');
    }
}

function showFilePreview(files, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    Array.from(files).forEach(file => {
        const preview = document.createElement('div');
        preview.className = 'file-preview';
        
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
                <div class="text-sm font-medium text-white truncate">${file.name}</div>
                <div class="text-xs text-[#8696a0]">${formatFileSize(file.size)}</div>
            </div>
            <button onclick="removeFilePreview(this, '${containerId}')" class="text-[#8696a0] hover:text-white">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(preview);
    });
    
    container.classList.remove('hidden');
}

function removeFilePreview(button, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    button.closest('.file-preview').remove();
    
    if (container.children.length === 0) {
        container.classList.add('hidden');
    }
    
    // Clear file input
    const fileInput = containerId.includes('mobile') ? 
        document.getElementById('mobileFileInput') : 
        document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
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
        button.className = 'text-lg hover:bg-[#202c33] rounded p-1';
        button.textContent = emoji;
        button.onclick = function() {
            const messageInput = pickerContainer.id.includes('mobile') ? 
                document.getElementById('mobileMessageInput') : 
                document.getElementById('messageInput');
            if (messageInput) {
                messageInput.value += emoji;
                messageInput.focus();
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
    }, 5000); // Refresh every 5 seconds
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
                    <i class="fas fa-users text-3xl text-[#8696a0] mb-3"></i>
                    <p class="text-[#8696a0]">No other users found</p>
                </div>
            `;
            return;
        }

        let html = '';
        allUsers.forEach(user => {
            const adNo = user['ad:no'] || user.ad_no || '';
            const name = user.name || 'Unknown User';
            
            html += `
                <div class="chat-item p-3 rounded-lg hover:bg-[#202c33] cursor-pointer" onclick="startNewChat('${adNo}', '${name.replace(/'/g, "\\'")}')">
                    <div class="flex items-center space-x-3">
                        <div class="relative">
                            <img src="https://quaf.tech/pic/${adNo}.jpg" alt="${name}" 
                                 class="profile-pic" 
                                 onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.classList.remove('hidden')">
                            <div class="profile-pic-fallback hidden">${name.charAt(0).toUpperCase()}</div>
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
        usersList.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-3"></i>
                <p class="text-red-400">Error loading users</p>
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
    initializeEmojiPicker(document.getElementById('emojiPickerContainer'));
    initializeEmojiPicker(document.getElementById('mobileEmojiPickerContainer'));
});

// Make functions available globally
window.login = login;
window.logout = logout;
window.toggleProfileMenu = toggleProfileMenu;
window.showProfileFallback = showProfileFallback;
window.showMenuProfileFallback = showMenuProfileFallback;
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
