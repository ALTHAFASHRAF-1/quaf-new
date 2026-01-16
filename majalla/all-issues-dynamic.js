// all-issues-dynamic.js - Dynamic All Issues Page Loader

class AllIssuesLoader {
    constructor() {
        this.allIssues = [];
        this.filteredIssues = [];
        this.currentSearchTerm = '';
        this.isDesktopSearchExpanded = false;
        this.isMobileSearchExpanded = false;
        this.currentFilters = {
            year: '',
            volume: '',
            sortOrder: 'newest'
        };
    }

    // Initialize and load all issues
    async init() {
        try {
            this.showLoading(true);
            
            // Wait for journal data to be loaded
            if (!window.journalData) {
                console.log('Waiting for journal data...');
                await this.waitForJournalData();
            }

            if (!window.journalData || !window.journalData.issues) {
                throw new Error('Journal data not available');
            }

            this.loadAllIssues();
            this.setupEventListeners();
            this.setupFilters();
            this.renderIssues();
            
            this.showLoading(false);
            document.getElementById('featured').style.display = 'block';

        } catch (error) {
            console.error('Error initializing all issues:', error);
            this.showError(error.message);
        }
    }

    // Wait for journal data to be loaded
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

    // Load all issues from journal data
    loadAllIssues() {
        this.allIssues = [];
        
        Object.entries(window.journalData.issues).forEach(([issueId, issue]) => {
            const issueData = {
                id: issueId,
                title: issue.title || `Volume ${issue.volume}, Number ${issue.number}`,
                volume: issue.volume,
                number: issue.number,
                year: issue.year,
                publishedDate: issue.publishedDate,
                coverImage: issue.coverImage,
                abstract: issue.description || issue.abstract || this.generateDefaultAbstract(issue),
                articleCount: issue.articles ? issue.articles.length : 0,
                categories: this.generateCategories(issue, issueId),
                redirectUrl: `issues.html?issue=${issueId}`,
                keywords: this.extractKeywords(issue)
            };
            
            this.allIssues.push(issueData);
        });

        // Sort by default (newest first)
        this.sortIssues('newest');
        this.filteredIssues = [...this.allIssues];
        
        console.log('Loaded all issues:', this.allIssues.length);
    }

    // Generate default abstract for issues
    generateDefaultAbstract(issue) {
        return `Islamic Insight Journal of Islamic Studies (IIJIS) ${issue.title}. This issue contains ${issue.articles ? issue.articles.length : 0} scholarly articles covering various aspects of Islamic studies, including Quranic studies, Hadith analysis, Islamic jurisprudence, theology, philosophy, and contemporary Islamic thought.`;
    }

    // Generate categories for each issue
    generateCategories(issue, issueId) {
        const categories = [];
        
        // Determine if it's the latest issue
        const allYears = Object.values(window.journalData.issues).map(i => i.year);
        const latestYear = Math.max(...allYears);
        
        if (issue.year === latestYear) {
            const latestIssues = Object.values(window.journalData.issues)
                .filter(i => i.year === latestYear)
                .sort((a, b) => b.volume - a.volume || b.number - a.number);
            
            if (latestIssues[0] === issue) {
                categories.push('Latest');
                categories.push('Current Issue');
            }
        }
        
        if (categories.length === 0) {
            categories.push('Previous');
            categories.push('Published');
        }
        
        // Add special categories
        if (issue.volume === 1 && issue.number === 1) {
            categories.push('First Issue');
        }
        
        
        
        return categories;
    }

    // Extract keywords from issue articles
    extractKeywords(issue) {
        const keywords = ['Islamic Studies', 'Academic Research', 'Peer Review'];
        
        if (issue.articles && Array.isArray(issue.articles)) {
            issue.articles.forEach(article => {
                if (article.keywords && Array.isArray(article.keywords)) {
                    keywords.push(...article.keywords);
                }
            });
        }
        
        return [...new Set(keywords)];
    }

    // Sort issues
    sortIssues(order) {
        this.allIssues.sort((a, b) => {
            if (order === 'newest') {
                if (b.year !== a.year) return b.year - a.year;
                if (b.volume !== a.volume) return b.volume - a.volume;
                return b.number - a.number;
            } else {
                if (a.year !== b.year) return a.year - b.year;
                if (a.volume !== b.volume) return a.volume - b.volume;
                return a.number - b.number;
            }
        });
    }

    // Setup filter dropdowns
    setupFilters() {
        const years = [...new Set(this.allIssues.map(issue => issue.year))].sort((a, b) => b - a);
        const volumes = [...new Set(this.allIssues.map(issue => issue.volume))].sort((a, b) => b - a);

        // Populate year filter
        const yearFilter = document.getElementById('year-filter');
        if (yearFilter) {
            yearFilter.innerHTML = '<option value="">All Years</option>' +
                years.map(year => `<option value="${year}">${year}</option>`).join('');
        }

        // Populate volume filter
        const volumeFilter = document.getElementById('volume-filter');
        if (volumeFilter) {
            volumeFilter.innerHTML = '<option value="">All Volumes</option>' +
                volumes.map(volume => `<option value="${volume}">Volume ${volume}</option>`).join('');
        }

        // Update issues count
        this.updateIssuesCount();
    }

    // Apply filters and search
    applyFiltersAndSearch() {
        let filtered = [...this.allIssues];

        // Apply year filter
        if (this.currentFilters.year) {
            filtered = filtered.filter(issue => issue.year.toString() === this.currentFilters.year);
        }

        // Apply volume filter
        if (this.currentFilters.volume) {
            filtered = filtered.filter(issue => issue.volume.toString() === this.currentFilters.volume);
        }

        // Apply search
        if (this.currentSearchTerm) {
            const searchTerm = this.currentSearchTerm.toLowerCase();
            filtered = filtered.filter(issue => 
                issue.title.toLowerCase().includes(searchTerm) ||
                issue.abstract.toLowerCase().includes(searchTerm) ||
                issue.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm)) ||
                issue.categories.some(category => category.toLowerCase().includes(searchTerm)) ||
                `volume ${issue.volume}`.includes(searchTerm) ||
                issue.year.toString().includes(searchTerm)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            if (this.currentFilters.sortOrder === 'newest') {
                if (b.year !== a.year) return b.year - a.year;
                if (b.volume !== a.volume) return b.volume - a.volume;
                return b.number - a.number;
            } else {
                if (a.year !== b.year) return a.year - b.year;
                if (a.volume !== b.volume) return a.volume - b.volume;
                return a.number - b.number;
            }
        });

        this.filteredIssues = filtered;
        this.renderIssues();
        this.updateIssuesCount();
    }

    // Update issues count display
    updateIssuesCount() {
        const issuesCount = document.getElementById('issues-count');
        if (issuesCount) {
            const total = this.allIssues.length;
            const showing = this.filteredIssues.length;
            
            if (showing === total) {
                issuesCount.textContent = `Showing all ${total} issue${total !== 1 ? 's' : ''}`;
            } else {
                issuesCount.textContent = `Showing ${showing} of ${total} issue${total !== 1 ? 's' : ''}`;
            }
        }
    }

    // Render issues
    renderIssues() {
        const issuesGrid = document.getElementById('issues-grid');
        const noResults = document.getElementById('no-results');

        if (this.filteredIssues.length === 0) {
            issuesGrid.style.display = 'none';
            noResults.style.display = 'block';
            return;
        }

        issuesGrid.style.display = 'block';
        noResults.style.display = 'none';

        const issuesHTML = this.filteredIssues.map((issue, index) => 
            this.createIssueCard(issue, index)
        ).join('');

        issuesGrid.innerHTML = issuesHTML;
    }

    // Create issue card HTML
    createIssueCard(issue, index) {
        const badgeColors = ['badge-blue', 'badge-green', 'badge-red', 'badge-purple', 'badge-yellow'];
        const categoryBadges = issue.categories.map((category, idx) => 
            `<span class="badge ${badgeColors[idx % badgeColors.length]}">${category}</span>`
        ).join('');

        const highlightedTitle = this.currentSearchTerm ? 
            this.highlightSearchTerm(issue.title, this.currentSearchTerm) : 
            this.escapeHtml(issue.title);

        const highlightedAbstract = this.currentSearchTerm ? 
            this.highlightSearchTerm(issue.abstract, this.currentSearchTerm) : 
            this.escapeHtml(issue.abstract);

        return `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden current-issue-card fade-in" style="animation-delay: ${index * 0.1}s">
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
                        <div class="mb-4">
                            ${categoryBadges}
                        </div>
                        
                        <h3 class="text-xl sm:text-2xl font-semibold academic-title text-gray-900 mb-4">
                            ${highlightedTitle}
                        </h3>
                        
                        <p class="text-gray-700 mb-6 leading-relaxed text-justify">
                            ${highlightedAbstract}
                        </p>
                        
                        <div class="mb-6 space-y-2">
                            <p class="text-sm text-gray-600">
                                <i class="far fa-calendar-alt mr-2"></i><strong>Published:</strong> ${this.formatDate(issue.publishedDate)}
                            </p>
                            <p class="text-sm text-gray-600">
                                <i class="fas fa-book mr-2"></i><strong>Volume:</strong> ${issue.volume}, Number ${issue.number}
                            </p>
                            <p class="text-sm text-gray-600">
                                <i class="fas fa-file-alt mr-2"></i><strong>Articles:</strong> ${issue.articleCount} article${issue.articleCount !== 1 ? 's' : ''}
                            </p>
                        </div>
                        
                        <div class="flex justify-between items-center">
                            <button 
                                onclick="allIssuesLoader.redirectToIssue('${issue.redirectUrl}')" 
                                class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                View Articles <i class="fas fa-arrow-right ml-2"></i>
                            </button>
                            
                            <div class="flex space-x-2">
                                <button onclick="allIssuesLoader.shareIssue('${issue.id}')" 
                                        class="text-gray-600 hover:text-blue-600 transition-colors p-2" 
                                        title="Share Issue">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                                <button onclick="allIssuesLoader.bookmarkIssue('${issue.id}')" 
                                        class="text-gray-600 hover:text-blue-600 transition-colors p-2" 
                                        title="Bookmark Issue">
                                    <i class="far fa-bookmark"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Utility functions
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    highlightSearchTerm(text, query) {
        if (!query || !text) return this.escapeHtml(text || '');
        const escapedText = this.escapeHtml(text);
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        return escapedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    }

    // Setup event listeners
    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Filter event listeners
        const yearFilter = document.getElementById('year-filter');
        const volumeFilter = document.getElementById('volume-filter');
        const sortNewest = document.getElementById('sort-newest');
        const sortOldest = document.getElementById('sort-oldest');

        if (yearFilter) {
            yearFilter.addEventListener('change', (e) => {
                this.currentFilters.year = e.target.value;
                this.applyFiltersAndSearch();
            });
        }

        if (volumeFilter) {
            volumeFilter.addEventListener('change', (e) => {
                this.currentFilters.volume = e.target.value;
                this.applyFiltersAndSearch();
            });
        }

        if (sortNewest) {
            sortNewest.addEventListener('click', () => {
                this.currentFilters.sortOrder = 'newest';
                sortNewest.classList.add('bg-blue-600', 'text-white');
                sortNewest.classList.remove('bg-white', 'border-gray-300', 'text-gray-700');
                sortOldest.classList.remove('bg-blue-600', 'text-white');
                sortOldest.classList.add('bg-white', 'border-gray-300', 'text-gray-700');
                this.applyFiltersAndSearch();
            });
        }

        if (sortOldest) {
            sortOldest.addEventListener('click', () => {
                this.currentFilters.sortOrder = 'oldest';
                sortOldest.classList.add('bg-blue-600', 'text-white');
                sortOldest.classList.remove('bg-white', 'border-gray-300', 'text-gray-700');
                sortNewest.classList.remove('bg-blue-600', 'text-white');
                sortNewest.classList.add('bg-white', 'border-gray-300', 'text-gray-700');
                this.applyFiltersAndSearch();
            });
        }

        // Search functionality
        this.setupSearchListeners();

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
    }

    // Setup search event listeners
    setupSearchListeners() {
        // Desktop search
        const searchToggleBtn = document.getElementById('search-toggle-btn');
        const navbarSearchInput = document.getElementById('navbar-search-input');

        if (searchToggleBtn) {
            searchToggleBtn.addEventListener('click', () => this.toggleNavbarSearch());
        }

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
        const mobileSearchInput = document.getElementById('mobile-search-input');

        if (mobileSearchToggleBtn) {
            mobileSearchToggleBtn.addEventListener('click', () => this.toggleMobileSearch());
        }

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
    }

    // Search functionality
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
            this.applyFiltersAndSearch();
        }
    }

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
            this.applyFiltersAndSearch();
        }
    }

    handleNavbarSearch() {
        const navbarSearchInput = document.getElementById('navbar-search-input');
        const query = navbarSearchInput.value.toLowerCase().trim();
        this.currentSearchTerm = query;

        if (!query) {
            document.getElementById('navbar-search-results').classList.add('hidden');
            this.applyFiltersAndSearch();
            return;
        }

        const filteredIssues = this.searchIssues(query);
        this.displayNavbarSearchResults(filteredIssues.slice(0, 6), query);
        this.applyFiltersAndSearch();
    }

    handleMobileSearch() {
        const mobileSearchInput = document.getElementById('mobile-search-input');
        const query = mobileSearchInput.value.toLowerCase().trim();
        this.currentSearchTerm = query;

        if (!query) {
            document.getElementById('mobile-search-results').classList.add('hidden');
            this.applyFiltersAndSearch();
            return;
        }

        const filteredIssues = this.searchIssues(query);
        this.displayMobileSearchResults(filteredIssues.slice(0, 4), query);
        this.applyFiltersAndSearch();
    }

    searchIssues(query) {
        return this.allIssues.filter(issue => 
            issue.title.toLowerCase().includes(query) ||
            issue.abstract.toLowerCase().includes(query) ||
            issue.keywords.some(keyword => keyword.toLowerCase().includes(query)) ||
            issue.categories.some(category => category.toLowerCase().includes(query)) ||
            `volume ${issue.volume}`.includes(query) ||
            issue.year.toString().includes(query)
        );
    }

    displayNavbarSearchResults(results, query) {
        const navbarSearchResults = document.getElementById('navbar-search-results');

        if (results.length === 0) {
            navbarSearchResults.innerHTML = `
                <div class="p-4 text-center text-gray-500">
                    <i class="fas fa-search text-2xl mb-2 text-gray-400"></i>
                    <p>No issues found for "<strong>${this.escapeHtml(query)}</strong>"</p>
                </div>
            `;
        } else {
            navbarSearchResults.innerHTML = results.map(issue => `
                <div class="search-result-item" onclick="allIssuesLoader.redirectToIssue('${issue.redirectUrl}');">
                    <h4 class="font-semibold text-gray-900 mb-1 text-sm">${this.highlightSearchTerm(issue.title, query)}</h4>
                    <p class="text-xs text-blue-600 mb-1">Volume ${issue.volume}, Number ${issue.number} • ${issue.year}</p>
                    <p class="text-xs text-gray-500">${this.highlightSearchTerm(this.truncateText(issue.abstract, 100), query)}...</p>
                    <div class="flex flex-wrap gap-1 mt-2">
                        ${issue.categories.slice(0, 2).map(cat => `<span class="badge badge-blue text-xs">${cat}</span>`).join('')}
                    </div>
                </div>
            `).join('');
        }

        navbarSearchResults.classList.remove('hidden');
    }

    displayMobileSearchResults(results, query) {
        const mobileSearchResults = document.getElementById('mobile-search-results');

        if (results.length === 0) {
            mobileSearchResults.innerHTML = `
                <div class="p-3 text-center text-gray-500 text-sm">
                    <i class="fas fa-search text-lg mb-1 text-gray-400"></i>
                    <p>No issues found for "<strong>${this.escapeHtml(query)}</strong>"</p>
                </div>
            `;
        } else {
            mobileSearchResults.innerHTML = results.map(issue => `
                <div class="search-result-item text-sm" onclick="allIssuesLoader.redirectToIssue('${issue.redirectUrl}');">
                    <h4 class="font-semibold text-gray-900 mb-1">${this.highlightSearchTerm(issue.title, query)}</h4>
                    <p class="text-xs text-blue-600 mb-1">Vol. ${issue.volume}, No. ${issue.number} • ${issue.year}</p>
                    <p class="text-xs text-gray-500">${this.highlightSearchTerm(this.truncateText(issue.abstract, 80), query)}...</p>
                </div>
            `).join('');
        }

        mobileSearchResults.classList.remove('hidden');
    }

    handleSearchEnter() {
        const navbarSearchResults = document.getElementById('navbar-search-results');
        const mobileSearchResults = document.getElementById('mobile-search-results');
        const firstResult = navbarSearchResults?.querySelector('.search-result-item') || 
                           mobileSearchResults?.querySelector('.search-result-item');

        if (firstResult) {
            firstResult.click();
        }
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

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text || '';
        return text.substr(0, maxLength).replace(/\s+\S*$/, '');
    }

    // Action methods
    redirectToIssue(url) {
        window.location.href = url;
    }

    shareIssue(issueId) {
        const issue = this.allIssues.find(i => i.id === issueId);
        if (!issue) return;

        const shareData = {
            title: issue.title,
            text: `${issue.title} - Islamic Insight Journal`,
            url: `${window.location.origin}/${issue.redirectUrl}`
        };

        if (navigator.share && navigator.canShare(shareData)) {
            navigator.share(shareData);
        } else {
            const shareText = `${shareData.title}\n${shareData.url}`;
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Issue link copied to clipboard!');
            }).catch(() => {
                prompt('Copy this link to share:', shareData.url);
            });
        }
    }

    bookmarkIssue(issueId) {
        const issue = this.allIssues.find(i => i.id === issueId);
        if (!issue) return;

        // Simple bookmark implementation using localStorage
        const bookmarks = JSON.parse(localStorage.getItem('journalBookmarks') || '[]');
        
        if (bookmarks.includes(issueId)) {
            const index = bookmarks.indexOf(issueId);
            bookmarks.splice(index, 1);
            localStorage.setItem('journalBookmarks', JSON.stringify(bookmarks));
            alert('Issue removed from bookmarks');
        } else {
            bookmarks.push(issueId);
            localStorage.setItem('journalBookmarks', JSON.stringify(bookmarks));
            alert('Issue bookmarked successfully!');
        }
    }

    clearFilters() {
        // Reset all filters
        this.currentFilters = {
            year: '',
            volume: '',
            sortOrder: 'newest'
        };
        this.currentSearchTerm = '';

        // Reset UI elements
        const yearFilter = document.getElementById('year-filter');
        const volumeFilter = document.getElementById('volume-filter');
        const sortNewest = document.getElementById('sort-newest');
        const sortOldest = document.getElementById('sort-oldest');
        const navbarSearchInput = document.getElementById('navbar-search-input');
        const mobileSearchInput = document.getElementById('mobile-search-input');

        if (yearFilter) yearFilter.value = '';
        if (volumeFilter) volumeFilter.value = '';
        if (navbarSearchInput) navbarSearchInput.value = '';
        if (mobileSearchInput) mobileSearchInput.value = '';

        if (sortNewest) {
            sortNewest.classList.add('bg-blue-600', 'text-white');
            sortNewest.classList.remove('bg-white', 'border-gray-300', 'text-gray-700');
        }
        if (sortOldest) {
            sortOldest.classList.remove('bg-blue-600', 'text-white');
            sortOldest.classList.add('bg-white', 'border-gray-300', 'text-gray-700');
        }

        // Hide search results
        const navbarSearchResults = document.getElementById('navbar-search-results');
        const mobileSearchResults = document.getElementById('mobile-search-results');
        if (navbarSearchResults) navbarSearchResults.classList.add('hidden');
        if (mobileSearchResults) mobileSearchResults.classList.add('hidden');

        // Reapply filters
        this.applyFiltersAndSearch();
    }

    // Show/hide loading state
    showLoading(show) {
        const loadingState = document.getElementById('loading-state');
        const errorState = document.getElementById('error-state');
        const featuredSection = document.getElementById('featured');

        if (loadingState) {
            loadingState.style.display = show ? 'block' : 'none';
        }
        if (errorState) {
            errorState.style.display = 'none';
        }
        if (featuredSection && !show) {
            featuredSection.style.display = 'block';
        }
    }

    // Show error message
    showError(message) {
        console.error('Showing error:', message);
        
        const loadingState = document.getElementById('loading-state');
        const errorState = document.getElementById('error-state');
        const featuredSection = document.getElementById('featured');
        
        if (loadingState) loadingState.style.display = 'none';
        if (featuredSection) featuredSection.style.display = 'none';
        if (errorState) {
            errorState.style.display = 'block';
            const errorContent = errorState.querySelector('p');
            if (errorContent) {
                errorContent.textContent = message;
            }
        }
    }
}

// Initialize the all issues loader
let allIssuesLoader;

document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('Initializing all issues page...');
        
        // Wait for sheets data to load
        await initializeJournalData();
        
        allIssuesLoader = new AllIssuesLoader();
        await allIssuesLoader.init();
        
        console.log('All issues page initialized successfully');
    } catch (error) {
        console.error('Failed to initialize all issues page:', error);
        
        // Show error if initialization fails
        const errorState = document.getElementById('error-state');
        if (errorState) {
            errorState.style.display = 'block';
        }
        const loadingState = document.getElementById('loading-state');
        if (loadingState) {
            loadingState.style.display = 'none';
        }
    }
});

// Handle page visibility change
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && allIssuesLoader) {
        // Optionally refresh data when page becomes visible
        console.log('Page became visible');
    }
});

// Handle browser back/forward
window.addEventListener('popstate', function() {
    if (allIssuesLoader) {
        // Handle any URL parameter changes
        console.log('Browser navigation detected');
    }
});
