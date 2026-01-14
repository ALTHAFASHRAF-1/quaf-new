// journal-dynamic.js - Enhanced dynamic content loader for journal issues with professional styling

class JournalIssueLoader {
    constructor() {
        this.currentIssue = null;
        this.articlesData = [];
        this.allArticles = [];
        this.currentSearchTerm = '';
        this.isDesktopSearchExpanded = false;
        this.isMobileSearchExpanded = false;
        this.currentIssueId = null;
    }

    // Add this method inside the JournalIssueLoader class:
getDisplayAuthors(article) {
    let authorNames = '';
    
    if (article.authors && Array.isArray(article.authors) && article.authors.length > 0) {
        // Use new authors array format
        authorNames = article.authors.map(author => author.name).join(', ');
    } else if (article.author) {
        // Fallback to old single author format
        authorNames = article.author;
    } else {
        authorNames = 'Unknown Author';
    }
    
    // Apply search highlighting if needed
    if (this.currentSearchTerm) {
        return this.highlightSearchTerm(authorNames, this.currentSearchTerm);
    } else {
        return this.escapeHtml(authorNames);
    }
}


    // Get issue ID from URL parameters or default to latest
    getCurrentIssueId() {
        const urlParams = new URLSearchParams(window.location.search);
        const issueParam = urlParams.get('issue');
        
        if (issueParam && window.journalData && window.journalData.issues && window.journalData.issues[issueParam]) {
            return issueParam;
        }

        const bodyIssue = document.body.getAttribute('data-issue');
        if (bodyIssue && window.journalData && window.journalData.issues && window.journalData.issues[bodyIssue]) {
            return bodyIssue;
        }

        // Default to the first issue if available
        if (window.journalData && window.journalData.issues) {
            const issueIds = Object.keys(window.journalData.issues);
            if (issueIds.length > 0) {
                return issueIds[0];
            }
        }

        return 'issue1';
    }

    // Initialize all articles from all issues for search
    initAllArticles() {
        this.allArticles = [];
        if (!window.journalData || !window.journalData.issues) {
            console.warn('No journal data available for search initialization');
            return;
        }

        Object.entries(window.journalData.issues).forEach(([issueId, issue]) => {
            if (issue.articles && Array.isArray(issue.articles)) {
                issue.articles.forEach(article => {
                    this.allArticles.push({
                        ...article,
                        issueId: issueId,
                        issueTitle: issue.title,
                        issueYear: issue.year,
                        issueVolume: issue.volume,
                        issueNumber: issue.number
                    });
                });
            }
        });
        
        console.log('Initialized all articles for search:', this.allArticles.length);
    }

    // Enhanced content language detection
    detectContentLanguage(article) {
        const titleText = article.title || '';
        const abstractText = article.abstract || '';
        const combinedText = titleText + ' ' + abstractText;

        if (!combinedText.trim()) return 'english';

        // Arabic detection pattern
        const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
        const englishPattern = /[a-zA-Z]/g;
        
        const arabicMatches = (combinedText.match(arabicPattern) || []).length;
        const englishMatches = (combinedText.match(englishPattern) || []).length;
        const totalLetters = arabicMatches + englishMatches;

        if (totalLetters === 0) return 'english';

        const arabicRatio = arabicMatches / totalLetters;
        
        // Use Arabic styling if Arabic content is significant (>30%)
        return arabicRatio > 0.3 ? 'arabic' : 'english';
    }

    // Style article content based on detected language
    styleArticleContent(article, element) {
        if (!element) return;
        
        const language = this.detectContentLanguage(article);
        
        // Apply language-specific classes and attributes
        element.classList.remove('arabic-content', 'english-content');
        element.classList.add(`${language}-content`);
        element.setAttribute('lang', language === 'arabic' ? 'ar' : 'en');
        
        // Apply language-specific styling
        if (language === 'arabic') {
            element.style.direction = 'rtl';
            element.style.textAlign = 'right';
            element.style.fontFamily = "'Amiri', 'Scheherazade New', serif";
            
            // Style title specifically for Arabic
            const title = element.querySelector('h3');
            if (title) {
                title.style.fontFamily = "'Amiri', serif";
                title.style.fontWeight = '700';
                title.style.fontSize = '1.25rem';
                title.style.lineHeight = '1.5';
            }
            
            // Style description for Arabic
            const description = element.querySelector('.article-description p');
            if (description) {
                description.style.fontFamily = "'Amiri', serif";
                description.style.fontSize = '1.1em';
                description.style.lineHeight = '2';
                description.style.textAlign = 'justify';
            }
            
            // Style author name for Arabic
            const author = element.querySelector('.text-blue-600');
            if (author) {
                author.style.fontFamily = "'Amiri', serif";
                author.style.fontWeight = '600';
            }
            
        } else {
            element.style.direction = 'ltr';
            element.style.textAlign = 'left';
            element.style.fontFamily = "'Crimson Text', 'Times New Roman', serif";
            
            // Style title specifically for English
            const title = element.querySelector('h3');
            if (title) {
                title.style.fontFamily = "'Crimson Text', serif";
                title.style.fontWeight = '600';
                title.style.fontSize = '1.25rem';
                title.style.lineHeight = '1.4';
            }
            
            // Style description for English
            const description = element.querySelector('.article-description p');
            if (description) {
                description.style.fontFamily = "'Crimson Text', serif";
                description.style.fontSize = '1rem';
                description.style.lineHeight = '1.7';
                description.style.textAlign = 'justify';
            }
            
            // Style author name for English
            const author = element.querySelector('.text-blue-600');
            if (author) {
                author.style.fontFamily = "'Crimson Text', serif";
                author.style.fontWeight = '600';
            }
        }
        
        // Style keywords container
        const keywordsContainer = element.querySelector('.flex.flex-wrap');
        if (keywordsContainer) {
            if (language === 'arabic') {
                keywordsContainer.style.justifyContent = 'flex-end';
                keywordsContainer.style.direction = 'rtl';
            } else {
                keywordsContainer.style.justifyContent = 'flex-start';
                keywordsContainer.style.direction = 'ltr';
            }
        }
        
        // Style individual keywords
        const keywords = element.querySelectorAll('.inline-block.bg-gray-100');
        keywords.forEach(keyword => {
            if (language === 'arabic') {
                keyword.style.fontFamily = "'Amiri', serif";
                keyword.style.direction = 'rtl';
            } else {
                keyword.style.fontFamily = "'Crimson Text', serif";
                keyword.style.direction = 'ltr';
            }
        });
    }

    // Load issue data and update page content
    async loadIssue() {
        try {
            this.showLoading(true);

            this.currentIssueId = this.getCurrentIssueId();
            console.log('Loading issue:', this.currentIssueId);
            
            if (!window.journalData || !window.journalData.issues) {
                throw new Error('Journal data not loaded');
            }

            this.currentIssue = window.journalData.issues[this.currentIssueId];

            if (!this.currentIssue) {
                throw new Error(`Issue ${this.currentIssueId} not found`);
            }

            this.articlesData = this.currentIssue.articles || [];
            this.initAllArticles();
            this.updatePageContent();
            this.setupEventListeners();
            this.setupIssueSelector();
            this.setupIssueNavigation();

            setTimeout(() => {
                this.loadArticles();
                this.showLoading(false);
                document.getElementById('main-content').style.display = 'grid';
            }, 300);

        } catch (error) {
            console.error('Error loading issue:', error);
            this.showError(error.message);
        }
    }

    // Show/hide loading state
    showLoading(show) {
        const loadingState = document.getElementById('loading-state');
        const errorState = document.getElementById('error-state');
        const mainContent = document.getElementById('main-content');

        if (loadingState) {
            loadingState.style.display = show ? 'block' : 'none';
        }
        if (errorState) {
            errorState.style.display = 'none';
        }
        if (mainContent && !show) {
            mainContent.style.display = 'grid';
        }
    }

    // Show error message
    showError(message) {
        console.error('Showing error:', message);
        
        const loadingState = document.getElementById('loading-state');
        const errorState = document.getElementById('error-state');
        const mainContent = document.getElementById('main-content');
        
        if (loadingState) loadingState.style.display = 'none';
        if (mainContent) mainContent.style.display = 'none';
        if (errorState) {
            errorState.style.display = 'block';
            errorState.innerHTML = `
                <div class="text-red-500 mb-4">
                    <i class="fas fa-exclamation-triangle text-4xl"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Content</h3>
                <p class="text-gray-600 mb-4">${message}</p>
                <div class="space-x-4">
                    <a href="index.html" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors">
                        Return to Homepage
                    </a>
                    <button onclick="location.reload()" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors">
                        Retry Loading
                    </button>
                </div>
            `;
        }
    }

    // Update dynamic content on the page
    updatePageContent() {
        document.title = `${this.currentIssue.title} - Islamic Insight Journal`;

        const mainHeader = document.querySelector('.text-3xl.sm\\:text-4xl.lg\\:text-5xl');
        if (mainHeader) {
            mainHeader.textContent = this.currentIssue.title;
        }

        const coverImage = document.querySelector('.journal-cover');
        if (coverImage) {
            coverImage.src = this.currentIssue.coverImage || 'https://via.placeholder.com/300x400/4f46e5/ffffff?text=Journal+Cover';
            coverImage.alt = `${this.currentIssue.title} Cover`;
            coverImage.onerror = () => {
                coverImage.src = 'https://via.placeholder.com/300x400/4f46e5/ffffff?text=Journal+Cover';
            };
        }

        const publishedSpan = document.querySelector('[data-field="published"]');
        if (publishedSpan) {
            publishedSpan.textContent = this.formatDate(this.currentIssue.publishedDate);
        }

        const volumeSpan = document.querySelector('[data-field="volume"]');
        if (volumeSpan) {
            volumeSpan.textContent = `${this.currentIssue.volume}, Number ${this.currentIssue.number}`;
        }

        const articleCountSpan = document.getElementById('article-count');
        if (articleCountSpan) {
            const count = this.articlesData.length;
            articleCountSpan.textContent = `${count} article${count !== 1 ? 's' : ''} in this issue`;
        }

        const newUrl = `${window.location.pathname}?issue=${this.currentIssueId}`;
        window.history.replaceState({}, '', newUrl);

        this.updateMetaTags();
    }

    // Update meta tags for SEO
    updateMetaTags() {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = `${this.currentIssue.title} - Islamic Insight Journal of Islamic Studies - Published ${this.formatDate(this.currentIssue.publishedDate)}`;

        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
            metaKeywords = document.createElement('meta');
            metaKeywords.name = 'keywords';
            document.head.appendChild(metaKeywords);
        }
        const allKeywords = this.articlesData.flatMap(article => article.keywords || []);
        metaKeywords.content = [...new Set(allKeywords)].join(', ');
    }

    // Setup issue selector dropdown
    setupIssueSelector() {
        if (!window.IssueNavigation) {
            console.warn('IssueNavigation not available');
            return;
        }

        const issueSelector = document.getElementById('issue-selector');
        const mobileIssueSelector = document.getElementById('mobile-issue-selector');
        const issues = IssueNavigation.generateIssueSelector();

        const options = issues.map(issue => 
            `<option value="${issue.id}" ${issue.id === this.currentIssueId ? 'selected' : ''}>
                ${issue.title}
            </option>`
        ).join('');

        if (issueSelector) {
            issueSelector.innerHTML = '<option value="">Select Issue</option>' + options;
            issueSelector.addEventListener('change', (e) => {
                if (e.target.value) {
                    window.location.href = IssueNavigation.getIssueUrl(e.target.value);
                }
            });
        }

        if (mobileIssueSelector) {
            mobileIssueSelector.innerHTML = '<option value="">Select Issue</option>' + options;
            mobileIssueSelector.addEventListener('change', (e) => {
                if (e.target.value) {
                    window.location.href = IssueNavigation.getIssueUrl(e.target.value);
                }
            });
        }
    }

    // Setup issue navigation (Previous/Next buttons)
    setupIssueNavigation() {
        if (!window.IssueNavigation) {
            console.warn('IssueNavigation not available');
            return;
        }

        const prevButton = document.getElementById('prev-issue-btn');
        const nextButton = document.getElementById('next-issue-btn');

        const prevIssue = IssueNavigation.getPreviousIssue(this.currentIssueId);
        const nextIssue = IssueNavigation.getNextIssue(this.currentIssueId);

        if (prevButton) {
            if (prevIssue) {
                prevButton.disabled = false;
                prevButton.classList.remove('opacity-50', 'cursor-not-allowed');
                prevButton.onclick = () => window.location.href = prevIssue.url;
                prevButton.title = `Go to ${prevIssue.title}`;
            } else {
                prevButton.disabled = true;
                prevButton.classList.add('opacity-50', 'cursor-not-allowed');
                prevButton.onclick = null;
                prevButton.title = 'No previous issue';
            }
        }

        if (nextButton) {
            if (nextIssue) {
                nextButton.disabled = false;
                nextButton.classList.remove('opacity-50', 'cursor-not-allowed');
                nextButton.onclick = () => window.location.href = nextIssue.url;
                nextButton.title = `Go to ${nextIssue.title}`;
            } else {
                nextButton.disabled = true;
                nextButton.classList.add('opacity-50', 'cursor-not-allowed');
                nextButton.onclick = null;
                nextButton.title = 'No next issue';
            }
        }
    }

    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    // Setup all event listeners
    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Desktop search
        const searchToggleBtn = document.getElementById('search-toggle-btn');
        if (searchToggleBtn) {
            searchToggleBtn.addEventListener('click', () => this.toggleNavbarSearch());
        }

        const navbarSearchInput = document.getElementById('navbar-search-input');
        if (navbarSearchInput) {
            navbarSearchInput.addEventListener('input', () => this.handleNavbarSearch());
            navbarSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.toggleNavbarSearch();
                }
                if (e.key === 'Enter') {
                    this.handleSearchEnter();
                }
            });
        }

        // Mobile search
        const mobileSearchToggleBtn = document.getElementById('mobile-search-toggle-btn');
        if (mobileSearchToggleBtn) {
            mobileSearchToggleBtn.addEventListener('click', () => this.toggleMobileSearch());
        }

        const mobileSearchInput = document.getElementById('mobile-search-input');
        if (mobileSearchInput) {
            mobileSearchInput.addEventListener('input', () => this.handleMobileSearch());
            mobileSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.toggleMobileSearch();
                }
                if (e.key === 'Enter') {
                    this.handleSearchEnter();
                }
            });
        }

        // Close search on outside click
        document.addEventListener('click', (e) => this.handleOutsideClick(e));

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    if (mobileMenu) {
                        mobileMenu.classList.add('hidden');
                    }
                }
            });
        });

        window.addEventListener('popstate', () => {
            this.loadIssue();
        });
    }

    // Handle search enter key
    handleSearchEnter() {
        const navbarSearchResults = document.getElementById('navbar-search-results');
        const mobileSearchResults = document.getElementById('mobile-search-results');
        const firstResult = navbarSearchResults?.querySelector('.search-result-item') || 
                           mobileSearchResults?.querySelector('.search-result-item');

        if (firstResult) {
            firstResult.click();
        }
    }

    // Toggle navbar search
    toggleNavbarSearch() {
        const navbarSearchInput = document.getElementById('navbar-search-input');
        const navbarSearchResults = document.getElementById('navbar-search-results');
        const searchIcon = document.getElementById('search-icon');
        const navItems = document.getElementById('nav-items');

        this.isDesktopSearchExpanded = !this.isDesktopSearchExpanded;

        if (this.isDesktopSearchExpanded) {
            navbarSearchInput.classList.add('expanded');
            navItems.classList.add('hidden-for-search');
            searchIcon.className = 'fas fa-times text-lg';
            navbarSearchInput.focus();
        } else {
            navbarSearchInput.classList.remove('expanded');
            navItems.classList.remove('hidden-for-search');
            searchIcon.className = 'fas fa-search text-lg';
            navbarSearchResults.classList.add('hidden');
            navbarSearchInput.value = '';
            this.currentSearchTerm = '';
            this.loadArticles();
        }
    }

    // Toggle mobile search
    toggleMobileSearch() {
        const mobileSearchInput = document.getElementById('mobile-search-input');
        const mobileSearchResults = document.getElementById('mobile-search-results');
        const mobileSearchIcon = document.getElementById('mobile-search-icon');

        this.isMobileSearchExpanded = !this.isMobileSearchExpanded;

        if (this.isMobileSearchExpanded) {
            mobileSearchInput.classList.add('expanded');
            mobileSearchIcon.className = 'fas fa-times text-lg';
            mobileSearchInput.focus();
        } else {
            mobileSearchInput.classList.remove('expanded');
            mobileSearchIcon.className = 'fas fa-search text-lg';
            mobileSearchResults.classList.add('hidden');
            mobileSearchInput.value = '';
            this.currentSearchTerm = '';
            this.loadArticles();
        }
    }

    // Find the searchAllArticles method and replace the author search condition:
searchAllArticles(query) {
    return this.allArticles.filter(article => {
        // Get all author names for search
        let allAuthorNames = '';
        if (article.authors && Array.isArray(article.authors)) {
            allAuthorNames = article.authors.map(author => author.name).join(' ');
        } else if (article.author) {
            allAuthorNames = article.author;
        }
        
        return article.title.toLowerCase().includes(query) ||
               allAuthorNames.toLowerCase().includes(query) ||
               article.abstract.toLowerCase().includes(query) ||
               (article.keywords && article.keywords.some(keyword => keyword.toLowerCase().includes(query))) ||
               article.issueTitle.toLowerCase().includes(query);
    });
}

    // Handle navbar search with multi-issue capability
    handleNavbarSearch() {
        const navbarSearchInput = document.getElementById('navbar-search-input');
        const query = navbarSearchInput.value.toLowerCase().trim();
        this.currentSearchTerm = query;

        if (!query) {
            document.getElementById('navbar-search-results').classList.add('hidden');
            this.loadArticles();
            return;
        }

        const filteredArticles = this.searchAllArticles(query);
        this.displayNavbarSearchResults(filteredArticles, query);

        const currentIssueResults = filteredArticles.filter(article => article.issueId === this.currentIssueId);
        this.loadArticles(currentIssueResults);
    }

    // Handle mobile search with multi-issue capability
    handleMobileSearch() {
        const mobileSearchInput = document.getElementById('mobile-search-input');
        const query = mobileSearchInput.value.toLowerCase().trim();
        this.currentSearchTerm = query;

        if (!query) {
            document.getElementById('mobile-search-results').classList.add('hidden');
            this.loadArticles();
            return;
        }

        const filteredArticles = this.searchAllArticles(query);
        this.displayMobileSearchResults(filteredArticles, query);

        const currentIssueResults = filteredArticles.filter(article => article.issueId === this.currentIssueId);
        this.loadArticles(currentIssueResults);
    }

    // Display navbar search results with issue information
    displayNavbarSearchResults(results, query) {
        const navbarSearchResults = document.getElementById('navbar-search-results');

        if (results.length === 0) {
            navbarSearchResults.innerHTML = `
                <div class="p-4 text-center text-gray-500">
                    <i class="fas fa-search text-2xl mb-2 text-gray-400"></i>
                    <p>No articles found for "<strong>${this.escapeHtml(query)}</strong>"</p>
                </div>
            `;
        } else {
            navbarSearchResults.innerHTML = results.slice(0, 8).map(article => `
                <div class="search-result-item" onclick="journalLoader.navigateToArticle('${article.issueId}', ${article.id});">
                    <h4 class="font-semibold text-gray-900 mb-1 text-sm">${this.highlightSearchTerm(article.title, query)}</h4>
                    <p class="text-sm text-gray-600 mb-1">${this.highlightSearchTerm(article.author, query)}</p>
                    <p class="text-xs text-blue-600 mb-1">${this.highlightSearchTerm(article.issueTitle, query)}</p>
                    <p class="text-xs text-gray-500">${this.highlightSearchTerm(this.truncateText(article.abstract, 100), query)}...</p>
                </div>
            `).join('');
        }

        navbarSearchResults.classList.remove('hidden');
    }

    // Display mobile search results with issue information
    displayMobileSearchResults(results, query) {
        const mobileSearchResults = document.getElementById('mobile-search-results');

        if (results.length === 0) {
            mobileSearchResults.innerHTML = `
                <div class="p-3 text-center text-gray-500 text-sm">
                    <i class="fas fa-search text-lg mb-1 text-gray-400"></i>
                    <p>No articles found for "<strong>${this.escapeHtml(query)}</strong>"</p>
                </div>
            `;
        } else {
            mobileSearchResults.innerHTML = results.slice(0, 6).map(article => `
                <div class="search-result-item text-sm" onclick="journalLoader.navigateToArticle('${article.issueId}', ${article.id});">
                    <h4 class="font-semibold text-gray-900 mb-1">${this.highlightSearchTerm(article.title, query)}</h4>
                    <p class="text-xs text-gray-600 mb-1">${this.highlightSearchTerm(article.author, query)}</p>
                    <p class="text-xs text-blue-600 mb-1">${this.highlightSearchTerm(article.issueTitle, query)}</p>
                    <p class="text-xs text-gray-500">${this.highlightSearchTerm(this.truncateText(article.abstract, 80), query)}...</p>
                </div>
            `).join('');
        }

        mobileSearchResults.classList.remove('hidden');
    }

    // Navigate to article in different issue
    navigateToArticle(issueId, articleId) {
        if (issueId === this.currentIssueId) {
            this.scrollToArticle(articleId);
        } else {
            window.location.href = `${window.location.pathname}?issue=${issueId}#article-${articleId}`;
        }
    }

    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text || '';
    
    // Truncate at maxLength and find the last complete word
    let truncated = text.substr(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    // If we found a space and it's not too far back, cut at the last word
    if (lastSpaceIndex > maxLength * 0.8) {
        truncated = truncated.substr(0, lastSpaceIndex);
    }
    
    return truncated;
}


    highlightSearchTerm(text, query) {
        if (!query || !text) return this.escapeHtml(text || '');
        const escapedText = this.escapeHtml(text);
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        return escapedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    }

    handleOutsideClick(e) {
        const navbarSearchInput = document.getElementById('navbar-search-input');
        const navbarSearchResults = document.getElementById('navbar-search-results');
        const searchToggleBtn = document.getElementById('search-toggle-btn');
        const mobileSearchInput = document.getElementById('mobile-search-input');
        const mobileSearchResults = document.getElementById('mobile-search-results');
        const mobileSearchToggleBtn = document.getElementById('mobile-search-toggle-btn');

        if (navbarSearchInput && navbarSearchResults && searchToggleBtn) {
            if (!navbarSearchInput.contains(e.target) && 
                !navbarSearchResults.contains(e.target) && 
                !searchToggleBtn.contains(e.target)) {
                navbarSearchResults.classList.add('hidden');
            }
        }

        if (mobileSearchInput && mobileSearchResults && mobileSearchToggleBtn) {
            if (!mobileSearchInput.contains(e.target) && 
                !mobileSearchResults.contains(e.target) && 
                !mobileSearchToggleBtn.contains(e.target)) {
                mobileSearchResults.classList.add('hidden');
            }
        }
    }

    scrollToArticle(articleId) {
        const navbarSearchResults = document.getElementById('navbar-search-results');
        const mobileSearchResults = document.getElementById('mobile-search-results');

        if (navbarSearchResults) navbarSearchResults.classList.add('hidden');
        if (mobileSearchResults) mobileSearchResults.classList.add('hidden');

        const articleElement = document.getElementById(`article-${articleId}`);
        if (articleElement) {
            articleElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            articleElement.classList.add('ring-2', 'ring-blue-500');
            setTimeout(() => {
                articleElement.classList.remove('ring-2', 'ring-blue-500');
            }, 2000);
        }
    }

    // Enhanced load and display articles with professional styling
    loadArticles(articlesToShow = null) {
        const articlesGrid = document.getElementById('articlesGrid');
        const articles = articlesToShow || this.articlesData;

        if (articles.length === 0) {
            const searchMessage = this.currentSearchTerm ? 
                `No articles found in this issue for "${this.currentSearchTerm}"` : 
                'No articles found';

            articlesGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="text-gray-400 mb-4">
                        <i class="fas fa-search text-4xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-600 mb-2">${searchMessage}</h3>
                    <p class="text-gray-500">Try adjusting your search terms or browse all articles.</p>
                    <button onclick="journalLoader.clearSearch()" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                        Clear Search
                    </button>
                </div>
            `;
            return;
        }

        const articlesHTML = articles.map((article, index) => {
            // Detect content language for styling
            const language = this.detectContentLanguage(article);
            const isArabic = language === 'arabic';
            
            const contentClass = isArabic ? 'arabic-content' : 'english-content';
            const langAttr = isArabic ? 'ar' : 'en';
            const directionStyle = isArabic ? 'direction: rtl; text-align: right;' : 'direction: ltr; text-align: left;';
            const fontFamily = isArabic ? "'Amiri', 'Scheherazade New', serif" : "'Crimson Text', 'Times New Roman', serif";
            
            return `
    <div id="article-${article.id}" class="article-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden fade-in ${contentClass}" 
         style="animation-delay: ${index * 0.1}s; ${directionStyle} font-family: ${fontFamily};" lang="${langAttr}">
        <div class="p-6 article-content">
            <h3 class="text-xl font-semibold academic-title text-gray-900 mb-3 leading-tight" 
    style="font-family: ${fontFamily}; font-weight: ${isArabic ? '700' : '600'}; font-size: ${isArabic ? '20px' : '20px'}; ${directionStyle}">
    ${this.currentSearchTerm ? this.highlightSearchTerm(article.title, this.currentSearchTerm) : this.escapeHtml(article.title)}
</h3>

            <div class="mb-3" style="${directionStyle}">
            <p class="text-sm font-medium text-blue-600" 
            style="font-family: ${fontFamily}; font-weight: 600; ${directionStyle}">
            ${this.getDisplayAuthors(article)}
            </p>
            </div>

            <!-- METADATA SECTION - FORCE LTR FOR ARABIC ARTICLES -->
            <div class="mb-4 text-sm text-gray-600" style="direction: ltr !important; text-align: left !important;">
                <i class="far fa-calendar-alt mr-2"></i>
                <span>${this.formatDate(article.date)}</span>
                <span class="mx-2">•</span>
                <span>Pages ${article.pages}</span>
                ${article.doi ? `<span class="mx-2">•</span><span>DOI: ${article.doi}</span>` : ''}
            </div>

            <div class="article-description" style="${directionStyle}">
    <p class="text-gray-700 leading-relaxed mb-4" 
       style="font-family: ${fontFamily}; font-size: ${isArabic ? '11px' : '12px'}; 
              line-height: ${isArabic ? '1.2' : '1.3'}; text-align: right; ${directionStyle}">
        ${this.currentSearchTerm ? 
            this.highlightSearchTerm(this.truncateText(article.abstract, 300), this.currentSearchTerm) : 
            this.truncateText(article.abstract, 300)}${article.abstract.length > 300 ? '...' : ''}
    </p>


    <div class="mb-4">
        <div class="flex flex-wrap gap-2 ${isArabic ? 'justify-end' : 'justify-start'}" 
             style="direction: ${isArabic ? 'rtl' : 'ltr'};">
            ${(article.keywords || []).filter(k => k.trim()).map(keyword => 
                `<span class="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                        style="font-family: ${fontFamily}; direction: ${isArabic ? 'rtl' : 'ltr'};">
                    ${this.currentSearchTerm ? this.highlightSearchTerm(keyword, this.currentSearchTerm) : this.escapeHtml(keyword)}
                </span>`
            ).join('')}
        </div>
    </div>
</div>

            <!-- FOOTER SECTION - FORCE LTR FOR ARABIC ARTICLES -->
            <div class="article-footer" style="direction: ltr !important; text-align: left !important;">
                <div class="flex justify-between items-center">
                    <a href="${article.htmlFile}" 
                       class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center"
                       style="font-family: ${fontFamily};">
                        Read More <i class="fas fa-arrow-right ml-2"></i>
                    </a>

                    <div class="flex space-x-2">
                        <button onclick="journalLoader.downloadPDF(${article.id})" 
                                class="text-gray-600 hover:text-blue-600 transition-colors p-2" 
                                title="Download PDF">
                            <i class="fas fa-download"></i>
                        </button>
                        <button onclick="journalLoader.shareArticle(${article.id})" 
                                class="text-gray-600 hover:text-blue-600 transition-colors p-2" 
                                title="Share Article">
                            <i class="fas fa-share-alt"></i>
                        </button>
                        <button onclick="journalLoader.citeArticle(${article.id})" 
                                class="text-gray-600 hover:text-blue-600 transition-colors p-2" 
                                title="Citation">
                            <i class="fas fa-quote-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;
        }).join('');

        articlesGrid.innerHTML = articlesHTML;

        // Apply enhanced content styling after DOM update
        setTimeout(() => {
            articles.forEach((article, index) => {
                const articleElement = document.getElementById(`article-${article.id}`);
                if (articleElement) {
                    this.styleArticleContent(article, articleElement);
                }
            });
        }, 100);

        // Check if we need to scroll to a specific article (from URL hash)
        if (window.location.hash) {
            const targetId = window.location.hash.substring(1);
            setTimeout(() => {
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetElement.classList.add('ring-2', 'ring-blue-500');
                    setTimeout(() => {
                        targetElement.classList.remove('ring-2', 'ring-blue-500');
                    }, 2000);
                }
            }, 500);
        }
    }

    clearSearch() {
        const navbarSearchInput = document.getElementById('navbar-search-input');
        const mobileSearchInput = document.getElementById('mobile-search-input');
        const navItems = document.getElementById('nav-items');
        const searchIcon = document.getElementById('search-icon');
        const mobileSearchIcon = document.getElementById('mobile-search-icon');
        const navbarSearchResults = document.getElementById('navbar-search-results');
        const mobileSearchResults = document.getElementById('mobile-search-results');

        if (navbarSearchInput) {
            navbarSearchInput.value = '';
            navbarSearchInput.classList.remove('expanded');
        }
        if (mobileSearchInput) {
            mobileSearchInput.value = '';
            mobileSearchInput.classList.remove('expanded');
        }
        if (navItems) navItems.classList.remove('hidden-for-search');
        if (searchIcon) searchIcon.className = 'fas fa-search text-lg';
        if (mobileSearchIcon) mobileSearchIcon.className = 'fas fa-search text-lg';
        if (navbarSearchResults) navbarSearchResults.classList.add('hidden');
        if (mobileSearchResults) mobileSearchResults.classList.add('hidden');

        this.currentSearchTerm = '';
        this.isDesktopSearchExpanded = false;
        this.isMobileSearchExpanded = false;
        this.loadArticles();
    }

    // Placeholder methods for article interactions
    downloadPDF(articleId) {
        const article = this.articlesData.find(a => a.id === articleId);
        if (article) {
            console.log(`Downloading PDF for article: ${article.title}`);
            alert(`PDF download for "${article.title}" would start here.\n\nIn a real implementation, this would link to the actual PDF file.`);
        }
    }

    shareArticle(articleId) {
        const article = this.articlesData.find(a => a.id === articleId);
        if (!article) return;

        const shareData = {
            title: article.title,
            text: `${article.title} by ${article.author}`,
            url: `${window.location.origin}${window.location.pathname}?issue=${this.currentIssueId}#article-${articleId}`
        };

        if (navigator.share && navigator.canShare(shareData)) {
            navigator.share(shareData);
        } else {
            const shareText = `${shareData.title}\nBy ${article.author}\n${shareData.url}`;
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Article link copied to clipboard!');
            }).catch(() => {
                prompt('Copy this link to share:', shareData.url);
            });
        }
    }

    citeArticle(articleId) {
        const article = this.articlesData.find(a => a.id === articleId);
        if (!article) return;

        const citation = this.generateCitation(article);

        const citationText = `APA Style Citation:\n\n${citation.apa}\n\n` +
                            `MLA Style Citation:\n\n${citation.mla}\n\n` +
                            `Chicago Style Citation:\n\n${citation.chicago}`;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(citation.apa).then(() => {
                alert(`${citationText}\n\nAPA citation copied to clipboard!`);
            });
        } else {
            alert(citationText);
        }
    }

    generateCitation(article) {
        const year = new Date(article.date).getFullYear();
        const issue = this.currentIssue;

        return {
            apa: `${article.author} (${year}). ${article.title}. Islamic Insight Journal, ${issue.volume}(${issue.number}), ${article.pages}. ${article.doi ? `https://doi.org/${article.doi}` : ''}`,

            mla: `${article.author}. "${article.title}." Islamic Insight Journal, vol. ${issue.volume}, no. ${issue.number}, ${year}, pp. ${article.pages}.`,

            chicago: `${article.author}. "${article.title}." Islamic Insight Journal ${issue.volume}, no. ${issue.number} (${year}): ${article.pages}. ${article.doi ? `https://doi.org/${article.doi}.` : ''}`
        };
    }
}

// Initialize the journal loader
let journalLoader;
document.addEventListener('DOMContentLoaded', async function() {
    // Wait for sheets data to load
    try {
        console.log('Initializing journal data...');
        await initializeJournalData();
        
        console.log('Creating journal loader...');
        journalLoader = new JournalIssueLoader();
        await journalLoader.loadIssue();
    } catch (error) {
        console.error('Failed to initialize:', error);
        // Show error if initialization fails
        const errorState = document.getElementById('error-state');
        if (errorState) {
            errorState.style.display = 'block';
            errorState.innerHTML = `
                <div class="text-red-500 mb-4">
                    <i class="fas fa-exclamation-triangle text-4xl"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to Load Data</h3>
                <p class="text-gray-600 mb-4">Unable to connect to the journal database. Please try again later.</p>
                <button onclick="location.reload()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Retry
                </button>
            `;
        }
        const loadingState = document.getElementById('loading-state');
        if (loadingState) loadingState.style.display = 'none';
    }
});

// Handle page visibility change to reload if needed
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && journalLoader) {
        // Optionally refresh data when page becomes visible
    }
});
