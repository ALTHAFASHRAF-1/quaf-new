// Configuration - Replace this URL with your actual Google Sheets CSV export URL
const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQyS3WXfgCUn_awTHYX9SgCC_QG2d3n49i_mMFMrHdPKgUbD4IQrBaLyS9mi8W4gwel9AnArlljcyX6/pub?gid=0&single=true&output=csv';

// Configuration for Google Doc template
const TEMPLATE_DOC_ID = '1Cu_j4CcNIhh5qez3Xoqf0xCGn7QzaHLrX7rfTozw8Po';

// Global variables to store the data
let pageData = {};

// DOM elements
let loadingState, errorState, mainContent, errorMessage;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM elements
    loadingState = document.getElementById('loading-state');
    errorState = document.getElementById('error-state');
    mainContent = document.getElementById('main-content');
    errorMessage = document.getElementById('error-message');
    
    // Load data from Google Sheets
    loadDataFromGoogleSheets();
});

/**
 * Load data from Google Sheets CSV
 */
async function loadDataFromGoogleSheets() {
    try {
        showLoading();
        
        // Add timestamp to prevent caching
        const url = `${GOOGLE_SHEETS_CSV_URL}&t=${Date.now()}`;
        
        // Fetch CSV data with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch(url, {
            signal: controller.signal,
            cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        
        if (!csvText || csvText.trim().length === 0) {
            throw new Error('Empty response from Google Sheets');
        }
        
        // Parse CSV data
        const parsedData = parseCSV(csvText);
        
        if (!parsedData || parsedData.length === 0) {
            throw new Error('No data found in the spreadsheet');
        }
        
        // Process the parsed data
        pageData = processData(parsedData);
        
        // Update the page content
        updatePageContent();
        
        // Show the main content
        showMainContent();
        
        console.log('Data loaded successfully:', pageData);
        
    } catch (error) {
        console.error('Error loading data:', error);
        
        let errorMsg = 'Failed to load content from Google Sheets.';
        
        if (error.name === 'AbortError') {
            errorMsg = 'Request timeout. Please check your internet connection and try again.';
        } else if (error.message.includes('HTTP error')) {
            errorMsg = 'Unable to access the data source. Please try again later.';
        } else if (error.message.includes('Empty response')) {
            errorMsg = 'The data source appears to be empty. Please contact the administrator.';
        }
        
        showError(errorMsg);
    }
}

/**
 * Parse CSV text into an array of objects
 */
function parseCSV(csvText) {
    try {
        const lines = csvText.trim().split('\n');
        
        if (lines.length < 2) {
            throw new Error('Insufficient data in CSV');
        }
        
        const headers = parseCSVLine(lines[0]);
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) { // Skip empty lines
                const values = parseCSVLine(lines[i]);
                const row = {};
                
                headers.forEach((header, index) => {
                    row[header.trim()] = values[index] ? values[index].trim() : '';
                });
                
                data.push(row);
            }
        }
        
        return data;
        
    } catch (error) {
        console.error('Error parsing CSV:', error);
        throw new Error('Failed to parse data format');
    }
}

/**
 * Parse a single CSV line, handling quoted values and commas
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Handle escaped quote
                current += '"';
                i += 2;
                continue;
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current);
            current = '';
        } else {
            current += char;
        }
        
        i++;
    }
    
    // Add the last field
    result.push(current);
    
    return result;
}

/**
 * Process the parsed CSV data into our page structure
 */
function processData(data) {
    const processedData = {};
    
    // Assuming the first row contains our data
    if (data.length > 0) {
        const row = data[0];
        
        // Basic fields with fallbacks
        processedData.heading = row.heading || row.Heading || 'Call for Papers';
        processedData.subHeading = row['sub-heading'] || row['Sub-heading'] || row['sub_heading'] || 'Islamic Insight Journal of Islamic Studies';
        processedData.edition = row.edition || row.Edition || 'Vol. 8, No. 1 (2025)';
        processedData.p1 = row.p1 || row.P1 || '';
        processedData.p2 = row.p2 || row.P2 || '';
        processedData.p3 = row.p3 || row.P3 || '';
        processedData.date = row.date || row.Date || 'mid-June 2025';
        
        // Submission Guidelines (SG1, SG2, etc.)
        processedData.submissionGuidelines = [];
        for (let i = 1; i <= 30; i++) { // Check up to SG30
            const sgKey = `SG${i}`;
            const sgKeyLower = `sg${i}`;
            const value = row[sgKey] || row[sgKeyLower] || '';
            if (value && value.trim()) {
                processedData.submissionGuidelines.push(value.trim());
            }
        }
        
        // Research Areas (RA1, RA2, etc.)
        processedData.researchAreas = [];
        for (let i = 1; i <= 30; i++) { // Check up to RA30
            const raKey = `RA${i}`;
            const raKeyLower = `ra${i}`;
            const value = row[raKey] || row[raKeyLower] || '';
            if (value && value.trim()) {
                processedData.researchAreas.push(value.trim());
            }
        }
    }
    
    // Set defaults if no data found
    if (Object.keys(processedData).length === 0) {
        processedData.heading = 'Call for Papers';
        processedData.subHeading = 'Islamic Insight Journal of Islamic Studies';
        processedData.edition = 'Vol. 8, No. 1 (2025)';
        processedData.submissionGuidelines = ['Please check back later for submission guidelines.'];
        processedData.researchAreas = ['Please check back later for research areas.'];
    }
    
    return processedData;
}

/**
 * Update the page content with loaded data
 */
function updatePageContent() {
    try {
        // Update basic fields
        updateElementContent('main-heading', pageData.heading);
        updateElementContent('sub-heading', pageData.subHeading);
        updateElementContent('edition', pageData.edition);
        updateElementContent('paragraph-1', pageData.p1);
        updateElementContent('paragraph-2', pageData.p2);
        
        // Update paragraph 3 with proper date formatting
        updateParagraph3();
        
        // Update submission guidelines
        updateSubmissionGuidelines();
        
        // Update research areas
        updateResearchAreas();
        
        // Update edition reference in paragraph 3
        updateElementContent('edition-ref', pageData.edition);
        
    } catch (error) {
        console.error('Error updating page content:', error);
    }
}

/**
 * Update paragraph 3 with formatted date
 */
function updateParagraph3() {
    const paragraph3Container = document.getElementById('paragraph-3');
    const submissionDateElement = document.getElementById('submission-date');
    
    if (paragraph3Container && pageData.p3) {
        paragraph3Container.innerHTML = `<p>${pageData.p3}</p>`;
    }
    
    if (submissionDateElement && pageData.date) {
        submissionDateElement.innerHTML = `<strong>${pageData.date}</strong>`;
    }
}

/**
 * Update submission guidelines list
 */
function updateSubmissionGuidelines() {
    const container = document.getElementById('submission-guidelines');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (pageData.submissionGuidelines && pageData.submissionGuidelines.length > 0) {
        pageData.submissionGuidelines.forEach(guideline => {
            const li = document.createElement('li');
            li.className = 'text-justify mb-2';
            li.innerHTML = `• ${guideline}`;
            container.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.innerHTML = '• Submission guidelines will be updated soon.';
        container.appendChild(li);
    }
}

/**
 * Update research areas list
 */
function updateResearchAreas() {
    const container = document.getElementById('research-areas');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (pageData.researchAreas && pageData.researchAreas.length > 0) {
        pageData.researchAreas.forEach(area => {
            const li = document.createElement('li');
            li.className = 'mb-1';
            li.innerHTML = `• ${area}`;
            container.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.innerHTML = '• Research areas will be updated soon.';
        container.appendChild(li);
    }
}

/**
 * Update text content of an element safely
 */
function updateElementContent(elementId, content) {
    const element = document.getElementById(elementId);
    if (element && content && content.trim()) {
        element.textContent = content;
    }
}

/**
 * Show loading state
 */
function showLoading() {
    if (loadingState) loadingState.style.display = 'block';
    if (errorState) errorState.style.display = 'none';
    if (mainContent) mainContent.style.display = 'none';
}

/**
 * Show error state
 */
function showError(message) {
    if (loadingState) loadingState.style.display = 'none';
    if (errorState) errorState.style.display = 'block';
    if (mainContent) mainContent.style.display = 'none';
    if (errorMessage) errorMessage.textContent = message;
}

/**
 * Show main content
 */
function showMainContent() {
    if (loadingState) loadingState.style.display = 'none';
    if (errorState) errorState.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';
}

/**
 * Create a copy of the Google Doc template
 */
async function createGoogleDocCopy() {
    try {
        // Generate a unique name for the copy
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const copyName = `Islamic Insight Article Template - ${timestamp}`;
        
        // Create the copy URL that will prompt user to sign in and create a copy
        const copyUrl = `https://docs.google.com/document/d/${TEMPLATE_DOC_ID}/copy?title=${encodeURIComponent(copyName)}`;
        
        // Open in new tab
        const newWindow = window.open(copyUrl, '_blank');
        
        if (!newWindow) {
            throw new Error('Popup blocked. Please allow popups for this site.');
        }
        
        return true;
    } catch (error) {
        console.error('Error creating Google Doc copy:', error);
        throw error;
    }
}

/**
 * Handle the create paper button click
 */
async function handleCreatePaper() {
    const btn = document.getElementById('create-paper-btn');
    const btnText = document.getElementById('btn-text');
    
    if (!btn || !btnText) return;
    
    const originalText = btnText.textContent;
    
    // Disable button and show loading state
    btn.disabled = true;
    btnText.innerHTML = '<span class="button-loading"></span> Creating copy...';
    
    try {
        // Create the copy
        await createGoogleDocCopy();
        
        // Show success message
        showNotification('Your copy is being created! A new tab will open with your personal copy of the article template.', 'success');
        
        // Track the copy creation (if tracker is available)
        if (window.userTracker) {
            window.userTracker.trackCopyCreated();
        }
        
    } catch (error) {
        console.error('Error:', error);
        let errorMsg = 'Unable to create copy automatically. Please try again or contact support.';
        
        if (error.message.includes('Popup blocked')) {
            errorMsg = 'Please allow popups for this site and try again.';
        }
        
        showNotification(errorMsg, 'error');
    } finally {
        // Reset button after a short delay
        setTimeout(() => {
            btn.disabled = false;
            btnText.textContent = originalText;
        }, 2000);
    }
}

/**
 * Show notification message
 */
function showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification-popup');
    existingNotifications.forEach(notification => notification.remove());
    
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `notification-popup ${type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'} border px-4 py-3 rounded shadow-lg`;
    notificationDiv.innerHTML = `
        <div class="flex">
            <div class="flex-1">
                <p class="text-sm font-medium">${message}</p>
            </div>
            <div class="ml-4">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-lg font-bold leading-none hover:opacity-70 transition-opacity" title="Close">&times;</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(notificationDiv);
    
    // Auto remove after 8 seconds
    setTimeout(() => {
        if (notificationDiv.parentElement) {
            notificationDiv.remove();
        }
    }, 8000);
}

/**
 * Refresh data (can be called manually)
 */
function refreshData() {
    loadDataFromGoogleSheets();
}

// Export functions for potential external use
window.CallForPapersLoader = {
    refresh: refreshData,
    getData: () => pageData,
    createPaper: handleCreatePaper
};

// Global function for the onclick handler
window.createPaperCopy = handleCreatePaper;
