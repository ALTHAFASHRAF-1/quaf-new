// Global variables for search functionality
let allArticles = [];
let isDataLoaded = false;

// DOM Elements
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const contactForm = document.getElementById('contact-form');

// Enhanced search elements
const searchToggleBtn = document.getElementById('search-toggle-btn');
const navbarSearchInput = document.getElementById('navbar-search-input');
const navbarSearchResults = document.getElementById('navbar-search-results');
const searchIcon = document.getElementById('search-icon');
const navItems = document.getElementById('nav-items');

// Mobile search elements
const mobileSearchToggleBtn = document.getElementById('mobile-search-toggle-btn');
const mobileSearchInput = document.getElementById('mobile-search-input');
const mobileSearchResults = document.getElementById('mobile-search-results');
const mobileSearchIcon = document.getElementById('mobile-search-icon');

// Search state tracking
let isDesktopSearchExpanded = false;
let isMobileSearchExpanded = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadJournalData();
    
    // Initialize current issue loader
    currentIssueLoader = new CurrentIssueLoader();
});

// Load journal data from sheets
async function loadJournalData() {
    try {
        console.log('Loading journal data for search...');
        
        // Wait for the data to be loaded by sheets-loader.js
        if (typeof sheetsDataManager !== 'undefined') {
            await sheetsDataManager.loadFromSheets();
            allArticles = await sheetsDataManager.getAllArticles();
        } else {
            // Fallback: wait for global data to be available
            await new Promise((resolve) => {
                const checkData = () => {
                    if (window.journalData && window.articlesData) {
                        allArticles = Object.values(window.articlesData);
                        resolve();
                    } else {
                        setTimeout(checkData, 100);
                    }
                };
                checkData();
            });
        }
        
        isDataLoaded = true;
        console.log('Articles loaded for search:', allArticles.length);
        
        // Initialize current issue after data is loaded
        if (currentIssueLoader) {
            await currentIssueLoader.init();
        }
        
    } catch (error) {
        console.error('Error loading journal data:', error);
        isDataLoaded = false;
        if (currentIssueLoader) {
            currentIssueLoader.showError();
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle - Fixed the event listener
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Mobile menu button clicked'); // Debug log
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Desktop navbar search functionality
    if (searchToggleBtn) {
        searchToggleBtn.addEventListener('click', toggleNavbarSearch);
        navbarSearchInput.addEventListener('input', handleNavbarSearch);
        navbarSearchInput.addEventListener('focus', function() {
            if (navbarSearchInput.value.trim()) {
                navbarSearchResults.classList.remove('hidden');
            }
        });
    }

    // Mobile search functionality
    if (mobileSearchToggleBtn) {
        mobileSearchToggleBtn.addEventListener('click', toggleMobileSearch);
        mobileSearchInput.addEventListener('input', handleMobileSearch);
        mobileSearchInput.addEventListener('focus', function() {
            if (mobileSearchInput.value.trim()) {
                mobileSearchResults.classList.remove('hidden');
            }
        });
    }

    // Enhanced keyboard support for search
    if (navbarSearchInput) {
        navbarSearchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                toggleNavbarSearch();
            }
        });
    }

    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                toggleMobileSearch();
            }
        });
    }

    // Close search results when clicking outside
    document.addEventListener('click', function(e) {
        // Desktop search
        if (navbarSearchInput && navbarSearchResults && searchToggleBtn &&
            !navbarSearchInput.contains(e.target) && 
            !navbarSearchResults.contains(e.target) && 
            !searchToggleBtn.contains(e.target)) {
            navbarSearchResults.classList.add('hidden');
        }

        // Mobile search
        if (mobileSearchInput && mobileSearchResults && mobileSearchToggleBtn &&
            !mobileSearchInput.contains(e.target) && 
            !mobileSearchResults.contains(e.target) && 
            !mobileSearchToggleBtn.contains(e.target)) {
            mobileSearchResults.classList.add('hidden');
        }

        // Close mobile menu when clicking outside
        if (mobileMenu && mobileMenuBtn && 
            !mobileMenu.contains(e.target) && 
            !mobileMenuBtn.contains(e.target)) {
            mobileMenu.classList.add('hidden');
        }
    });

    // Contact form
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                if (mobileMenu) {
                    mobileMenu.classList.add('hidden');
                }
            }
        });
    });
}

// Enhanced toggle navbar search with better state management
function toggleNavbarSearch() {
    isDesktopSearchExpanded = !isDesktopSearchExpanded;

    if (isDesktopSearchExpanded) {
        // Expand search
        navbarSearchInput.classList.add('expanded');
        navItems.classList.add('hidden-for-search');
        searchIcon.className = 'fas fa-times text-lg';
        navbarSearchInput.focus();
    } else {
        // Collapse search
        navbarSearchInput.classList.remove('expanded');
        navItems.classList.remove('hidden-for-search');
        searchIcon.className = 'fas fa-search text-lg';
        navbarSearchResults.classList.add('hidden');
        navbarSearchInput.value = '';
    }
}

// Enhanced toggle mobile search with proper cross functionality
function toggleMobileSearch() {
    isMobileSearchExpanded = !isMobileSearchExpanded;

    if (isMobileSearchExpanded) {
        // Expand search
        mobileSearchInput.classList.add('expanded');
        mobileSearchIcon.className = 'fas fa-times text-lg';
        mobileSearchInput.focus();
    } else {
        // Collapse search
        mobileSearchInput.classList.remove('expanded');
        mobileSearchIcon.className = 'fas fa-search text-lg';
        mobileSearchResults.classList.add('hidden');
        mobileSearchInput.value = '';
    }
}

// Handle navbar search with improved filtering
function handleNavbarSearch() {
    const query = navbarSearchInput.value.toLowerCase().trim();

    if (!query) {
        navbarSearchResults.classList.add('hidden');
        return;
    }

    if (!isDataLoaded) {
        displaySearchLoading(navbarSearchResults);
        return;
    }

    const filteredArticles = searchArticles(query);
    displayNavbarSearchResults(filteredArticles, query);
}

// Handle mobile search with improved filtering
function handleMobileSearch() {
    const query = mobileSearchInput.value.toLowerCase().trim();

    if (!query) {
        mobileSearchResults.classList.add('hidden');
        return;
    }

    if (!isDataLoaded) {
        displaySearchLoading(mobileSearchResults);
        return;
    }

    const filteredArticles = searchArticles(query);
    displayMobileSearchResults(filteredArticles, query);
}

// Search articles function
function searchArticles(query) {
    if (!allArticles || allArticles.length === 0) {
        return [];
    }

    return allArticles.filter(article => {
        const searchableText = [
            article.title || '',
            article.author || '',
            ...(article.authors ? article.authors.map(a => a.name || '') : []),
            article.abstract || '',
            ...(article.keywords || []),
            article.issueTitle || '',
            `Vol. ${article.volume} No. ${article.number}` || ''
        ].join(' ').toLowerCase();

        return searchableText.includes(query);
    });
}

// Display loading state
function displaySearchLoading(resultsContainer) {
    resultsContainer.innerHTML = `
        <div class="search-loading">
            <div class="spinner"></div>
            <span class="ml-2 text-gray-600">Loading articles...</span>
        </div>
    `;
    resultsContainer.classList.remove('hidden');
}

// Enhanced display navbar search results with redirect functionality
function displayNavbarSearchResults(results, query) {
    if (results.length === 0) {
        navbarSearchResults.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                <i class="fas fa-search text-2xl mb-2 text-gray-400"></i>
                <p>No articles found for "<strong>${query}</strong>"</p>
            </div>
        `;
    } else {
        navbarSearchResults.innerHTML = results.slice(0, 10).map(article => `
            <div class="search-result-item" onclick="redirectToArticle(${article.id}); toggleNavbarSearch();">
                <h4 class="font-semibold text-gray-900 mb-1 text-sm">${highlightSearchTerm(article.title, query)}</h4>
                ${getAuthorDisplay(article) ? `<p class="text-sm text-gray-600 mb-2">${highlightSearchTerm(getAuthorDisplay(article), query)}</p>` : ''}
                <p class="text-xs text-gray-500">${highlightSearchTerm((article.abstract || '').substring(0, 120), query)}${article.abstract && article.abstract.length > 120 ? '...' : ''}</p>
                <div class="flex flex-wrap gap-1 mt-2">
                    <span class="badge badge-blue text-xs">${article.issueTitle || `Vol. ${article.volume} No. ${article.number}`}</span>
                    ${article.publishedDate ? `<span class="badge badge-green text-xs">${article.publishedDate}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    navbarSearchResults.classList.remove('hidden');
}

// Enhanced display mobile search results with redirect functionality
function displayMobileSearchResults(results, query) {
    if (results.length === 0) {
        mobileSearchResults.innerHTML = `
            <div class="p-3 text-center text-gray-500 text-sm">
                <i class="fas fa-search text-lg mb-1 text-gray-400"></i>
                <p>No articles found for "<strong>${query}</strong>"</p>
            </div>
        `;
    } else {
        mobileSearchResults.innerHTML = results.slice(0, 8).map(article => `
            <div class="search-result-item text-sm" onclick="redirectToArticle(${article.id}); toggleMobileSearch();">
                <h4 class="font-semibold text-gray-900 mb-1">${highlightSearchTerm(article.title, query)}</h4>
                ${getAuthorDisplay(article) ? `<p class="text-xs text-gray-600 mb-1">${highlightSearchTerm(getAuthorDisplay(article), query)}</p>` : ''}
                <p class="text-xs text-gray-500">${highlightSearchTerm((article.abstract || '').substring(0, 100), query)}${article.abstract && article.abstract.length > 100 ? '...' : ''}</p>
                <div class="flex flex-wrap gap-1 mt-1">
                    <span class="badge badge-blue text-xs">${article.issueTitle || `Vol. ${article.volume} No. ${article.number}`}</span>
                </div>
            </div>
        `).join('');
    }

    mobileSearchResults.classList.remove('hidden');
}

// Helper function to get author display
function getAuthorDisplay(article) {
    if (article.authors && article.authors.length > 0) {
        return article.authors.map(author => author.name).join(', ');
    }
    return article.author || '';
}

// Redirect to article page
function redirectToArticle(articleId) {
    window.location.href = `articles.html?id=${articleId}`;
}

// Highlight search terms in results
function highlightSearchTerm(text, query) {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
}

// Handle contact form submission
function handleContactForm(e) {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const name = formData.get('name') || document.getElementById('name').value;
    const email = formData.get('email') || document.getElementById('email').value;
    const subject = formData.get('subject') || document.getElementById('subject').value;
    const message = formData.get('message') || document.getElementById('message').value;

    // Simulate form submission
    alert('Thank you for your message! We will get back to you soon.');
    contactForm.reset();
}

// Listen for the journalDataLoaded event
window.addEventListener('journalDataLoaded', function() {
    console.log('Journal data loaded event received');
    loadJournalData();
});

// Current Issue Loader
class CurrentIssueLoader {
    constructor() {
        this.currentIssue = null;
    }

    async init() {
        try {
            this.showLoading(true);
            
            // Wait for journal data to be loaded
            if (!window.journalData) {
                await this.waitForJournalData();
            }

            if (!window.journalData || !window.journalData.issues) {
                throw new Error('Journal data not available');
            }

            this.loadCurrentIssue();
            this.renderCurrentIssue();
            
            this.showLoading(false);
            document.getElementById('current-issue-container').style.display = 'block';

        } catch (error) {
            console.error('Error loading current issue:', error);
            this.showError();
        }
    }

    waitForJournalData(timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkData = () => {
                if (window.journalData && window.journalData.issues) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Timeout waiting for journal data'));
                } else {
                    setTimeout(checkData, 100);
                }
            };
            
            checkData();
        });
    }

    loadCurrentIssue() {
        const issues = Object.entries(window.journalData.issues).map(([issueId, issue]) => ({
            id: issueId,
            ...issue
        }));

        // Sort to get the latest issue (by year, then volume, then number)
        issues.sort((a, b) => {
            if (b.year !== a.year) return b.year - a.year;
            if (b.volume !== a.volume) return b.volume - a.volume;
            return b.number - a.number;
        });

        if (issues.length > 0) {
            this.currentIssue = issues[0];
        }
    }

    renderCurrentIssue() {
        if (!this.currentIssue) {
            this.showError();
            return;
        }

        const issue = this.currentIssue;
        const abstract = issue.description || issue.abstract || this.generateDefaultAbstract(issue);
        
        const currentIssueHTML = `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden current-issue-card">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-0">
                    <!-- Journal cover - Left side -->
                    <div class="lg:col-span-1 p-2 flex justify-center items-center bg-gray-50">
                        <div class="current-issue-image-container">
                            <img src="${issue.coverImage || 'https://via.placeholder.com/300x400/4f46e5/ffffff?text=Journal+Cover'}" 
                                 alt="${issue.title}" 
                                 class="current-issue-image"
                                 onerror="this.src='https://via.placeholder.com/300x400/4f46e5/ffffff?text=Journal+Cover'">
                        </div>
                    </div>
                    <!-- Content - Right side -->
                    <div class="lg:col-span-2 p-6">
                        <h3 class="text-xl sm:text-2xl font-semibold academic-title text-gray-900 mb-4">
                            ${issue.title}
                        </h3>
                        
                        <p class="text-gray-700 mb-6 leading-relaxed text-justify">
                            ${abstract}
                        </p>
                        
                        <div class="mb-6 space-y-2">
                            <p class="text-sm text-gray-600">
                                <i class="far fa-calendar-alt mr-2"></i><strong>Published:</strong> ${this.formatDate(issue.publishedDate)}
                            </p>
                            <p class="text-sm text-gray-600">
                                <i class="fas fa-book mr-2"></i><strong>Volume:</strong> ${issue.volume}, Number ${issue.number}
                            </p>
                            <p class="text-sm text-gray-600">
                                <i class="fas fa-file-alt mr-2"></i><strong>Articles:</strong> ${issue.articles ? issue.articles.length : 0} article${issue.articles && issue.articles.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        
                        <div class="flex justify-between items-center">
                            <button 
                                onclick="window.location.href='issues.html?issue=${issue.id}'" 
                                class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                View Articles <i class="fas fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('current-issue-container').innerHTML = currentIssueHTML;
    }

    generateDefaultAbstract(issue) {
        return `Islamic Insight Journal of Islamic Studies (IIJIS) functions as a bilingual (English and Arabic) platform for disseminating exceptional academic research on Islam and the Muslim world. This issue contains ${issue.articles ? issue.articles.length : 0} scholarly articles covering various aspects of Islamic studies, including Quranic studies, Hadith analysis, Islamic jurisprudence, theology, philosophy, and contemporary Islamic thought.`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    showLoading(show) {
        const loadingState = document.getElementById('current-issue-loading');
        const errorState = document.getElementById('current-issue-error');
        const container = document.getElementById('current-issue-container');

        if (loadingState) {
            loadingState.style.display = show ? 'block' : 'none';
        }
        if (errorState) {
            errorState.style.display = 'none';
        }
        if (container && !show) {
            container.style.display = 'block';
        }
    }

    showError() {
        const loadingState = document.getElementById('current-issue-loading');
        const errorState = document.getElementById('current-issue-error');
        const container = document.getElementById('current-issue-container');
        
        if (loadingState) loadingState.style.display = 'none';
        if (container) container.style.display = 'none';
        if (errorState) errorState.style.display = 'block';
    }
}

// Initialize Current Issue Loader
let currentIssueLoader;

// Also listen for the journalDataLoaded event
window.addEventListener('journalDataLoaded', async function() {
    console.log('Journal data loaded event received');
    await loadJournalData();
});    
