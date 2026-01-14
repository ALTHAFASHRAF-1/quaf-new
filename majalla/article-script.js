// article-script.js - Enhanced version with professional language detection and styling

// Global variables
let currentArticleId = null;
let currentPdfUrl = null;
let currentLanguage = 'auto'; // 'auto', 'arabic', 'english'

// Google Drive Link Converter
function convertGoogleDriveLink(url) {
    if (!url) return url;
    
    // Check if it's already a direct link
    if (url.includes('drive.google.com/uc?') || url.includes('/preview')) {
        return url;
    }
    
    // Extract file ID from various Google Drive URL formats
    const patterns = [
        /\/file\/d\/([a-zA-Z0-9-_]+)/,
        /id=([a-zA-Z0-9-_]+)/,
        /\/open\?id=([a-zA-Z0-9-_]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            const fileId = match[1];
            // Return preview URL which works better for PDFs
            return `https://drive.google.com/file/d/${fileId}/preview`;
        }
    }
    
    return url; // Return original if no pattern matches
}

// Enhanced PDF URL getter
function getPDFUrl(article) {
    const originalUrl = article.pdfUrl || '';
    return convertGoogleDriveLink(originalUrl);
}

// Download PDF function
function downloadPDF() {
    if (!currentPdfUrl) {
        alert('PDF is not available for download.');
        return;
    }

    // Create a temporary anchor element to trigger download
    const downloadLink = document.createElement('a');
    
    // Convert Google Drive URL to direct download link if needed
    let downloadUrl = currentPdfUrl;
    
    if (downloadUrl.includes('drive.google.com')) {
        // Convert Google Drive preview link to download link
        if (downloadUrl.includes('/preview')) {
            downloadUrl = downloadUrl.replace('/preview', '');
        }
        
        // Ensure it's a direct download link
        if (downloadUrl.includes('/file/d/')) {
            const fileIdMatch = downloadUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
            if (fileIdMatch && fileIdMatch[1]) {
                downloadUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
            }
        }
    }
    
    downloadLink.href = downloadUrl;
    downloadLink.download = getPDFFileName();
    downloadLink.target = '_blank';
    
    // Append to body, click, and remove
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    console.log('Download initiated for:', downloadUrl);
}

// Helper function to generate PDF file name
function getPDFFileName() {
    const articleTitle = document.getElementById('article-title').textContent;
    let fileName = 'document.pdf';
    
    if (articleTitle && articleTitle !== 'Loading...') {
        // Clean the title for filename use
        fileName = articleTitle
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '') + '.pdf';
    }
    
    return fileName;
}

// Get article ID from URL parameter
function getArticleIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    console.log('URL parameters:', Object.fromEntries(urlParams.entries()));
    console.log('Extracted article ID:', id);
    
    if (!id) {
        console.error('No article ID found in URL');
        return null;
    }
    
    // Parse ID - handle both string and number
    const parsedId = parseInt(id);
    return isNaN(parsedId) ? id : parsedId;
}

// Enhanced article loading with better debugging
async function loadArticle(articleId) {
    console.log('Loading article with ID:', articleId);
    console.log('Type of articleId:', typeof articleId);
    
    let article = null;
    
    // Try multiple data sources with fallbacks
    if (typeof sheetsDataManager !== 'undefined') {
        console.log('Using sheetsDataManager...');
        article = await sheetsDataManager.getArticle(articleId);
    } else if (typeof JournalDataManager !== 'undefined') {
        console.log('Using JournalDataManager...');
        article = await JournalDataManager.getArticle(articleId);
    } else if (typeof articlesData !== 'undefined' && articlesData[articleId]) {
        console.log('Using articlesData...');
        article = articlesData[articleId];
    } else if (window.journalData) {
        console.log('Searching in journalData...');
        // Search through all issues
        for (const issueId in window.journalData.issues) {
            const issue = window.journalData.issues[issueId];
            const foundArticle = issue.articles.find(a => a.id == articleId);
            if (foundArticle) {
                article = foundArticle;
                break;
            }
        }
    }
    
    console.log('Found article:', article);
    
    if (!article) {
        showError('Article not found. Please check the article ID.');
        return;
    }

    currentArticleId = articleId;
    currentPdfUrl = article.pdfUrl;
    
    updateArticleDisplay(article);
}

function updateArticleDisplay(article) {
    // Update page title
    document.title = `${article.title} - Islamic Insight Journal`;
    
    // Update article title
    document.getElementById('article-title').textContent = article.title;
    
    // Update modal title
    document.getElementById('modal-pdf-title').textContent = article.title;
    
    // Update authors
    // Update authors - REPLACE the existing author update section with this:
// Update authors - REPLACE the existing author update section with this:
const authorContainer = document.getElementById('author-container');
authorContainer.innerHTML = '';

// Handle both old and new author format
const authors = article.authors || (article.author ? [{
    name: article.author,
    position: "Research Scholar",
    email: "author@example.com"
}] : []);

if (authors && authors.length > 0) {
    authors.forEach((author, index) => {
        const authorDiv = document.createElement('div');
        authorDiv.className = 'mb-4 pb-3 border-b border-gray-200 last:border-b-0';
        authorDiv.innerHTML = `
            <div class="flex items-start space-x-3">
                
                <div class="flex-1">
                    <h4 class="text-lg font-semibold text-gray-900">${author.name}</h4>
                    <p class="text-sm text-blue-600 font-medium">${author.position || 'Research Scholar'}</p>
                    <p class="text-sm text-gray-600 mt-1">
                        <i class="fas fa-envelope mr-1"></i>
                        <a href="mailto:${author.email}" class="hover:text-blue-600 transition-colors">
                            ${author.email || 'N/A'}
                        </a>
                    </p>
                </div>
            </div>
        `;
        authorContainer.appendChild(authorDiv);
    });
} else {
    authorContainer.innerHTML = `
        <div class="text-gray-500 italic">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            No author information available
        </div>
    `;
}

    
    // Update metadata
    document.getElementById('published-date').textContent = article.publishedDate || article.date || 'Not specified';
    document.getElementById('page-range').textContent = article.pages || 'Not specified';
    document.getElementById('volume-info').textContent = article.volume ? `Vol. ${article.volume}, No. ${article.number}` : 'Not specified';
    document.getElementById('issn-number').textContent = article.issn || '2581-3269';
    
    // Update PDF links
    if (currentPdfUrl) {
        const convertedUrl = convertGoogleDriveLink(currentPdfUrl);
        
        // Update currentPdfUrl to use converted URL
        currentPdfUrl = convertedUrl;
        
        // Enable PDF button
        const pdfButton = document.querySelector('button[onclick="openPDF()"]');
        if (pdfButton) {
            pdfButton.disabled = false;
            pdfButton.classList.remove('opacity-50', 'cursor-not-allowed');
            
            // Show Google Drive indicator if it's a Google Drive link
            if (convertedUrl.includes('drive.google.com')) {
                pdfButton.innerHTML = '<i class="fas fa-file-pdf mr-1"></i>VIEW FULL PDF';
            } else {
                pdfButton.innerHTML = '<i class="fas fa-file-pdf mr-1"></i>VIEW FULL PDF';
            }
        }
    } else {
        // Disable PDF button if no PDF available
        const pdfButton = document.querySelector('button[onclick="openPDF()"]');
        if (pdfButton) {
            pdfButton.disabled = true;
            pdfButton.classList.add('opacity-50', 'cursor-not-allowed');
            pdfButton.textContent = 'PDF NOT AVAILABLE';
        }
    }
    
    // Update keywords
    const keywordsContainer = document.getElementById('keywords-container');
    keywordsContainer.innerHTML = '';
    
    if (article.keywords && Array.isArray(article.keywords) && article.keywords.length > 0) {
        article.keywords.forEach(keyword => {
            if (keyword && keyword.trim()) {
                const keywordSpan = document.createElement('span');
                keywordSpan.className = 'keyword-tag';
                keywordSpan.textContent = keyword.trim();
                keywordsContainer.appendChild(keywordSpan);
            }
        });
    } else {
        keywordsContainer.innerHTML = '<span class="text-gray-500">No keywords available</span>';
    }
    
    // Update abstract
    const abstractContent = document.getElementById('abstract-content');
    if (article.abstract && article.abstract.trim()) {
        abstractContent.textContent = article.abstract;
    } else {
        abstractContent.textContent = 'No abstract available for this article.';
        abstractContent.classList.add('text-gray-500', 'italic');
    }
    
    // Show article and hide loading
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('article-container').style.display = 'block';
    
    // Apply language-specific styling
    setTimeout(() => {
        if (window.arabicStyler) {
            window.arabicStyler.styleAllContent(article);
        }
    }, 100);
    
    console.log('Article display updated successfully');
}

// Enhanced initialization
async function initializeArticlePage() {
    console.log('Initializing article page...');
    
    const articleId = getArticleIdFromUrl();
    
    if (!articleId) {
        showError('No article ID specified in the URL.');
        return;
    }

    try {
        // Wait for sheets data to load with timeout
        const dataLoaded = await Promise.race([
            initializeJournalData(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Data loading timeout')), 10000))
        ]);
        
        if (!dataLoaded) {
            throw new Error('Failed to load journal data');
        }
        
        // Small delay to ensure data is fully processed
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await loadArticle(articleId);
    } catch (error) {
        console.error('Error initializing article page:', error);
        showError('Failed to load article data. Please try again later.');
    }
}

function showError(message) {
    console.error('Showing error:', message);
    
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    
    if (loadingState) loadingState.style.display = 'none';
    if (errorState) {
        errorState.style.display = 'block';
        errorState.innerHTML = `
            <h2 class="text-xl font-bold mb-2">Article Loading Error</h2>
            <p class="mb-4">${message}</p>
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

// PDF Modal Functions
function openPDF() {
    if (!currentPdfUrl) {
        alert('PDF is not available for this article.');
        return;
    }
    
    const modal = document.getElementById('pdfModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    loadPDFInIframe();
}

function loadPDFInIframe() {
    const iframe = document.getElementById('pdfFrame');
    const fallback = document.getElementById('pdfFallback');
    
    iframe.style.display = 'block';
    fallback.classList.remove('active');
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const convertedUrl = convertGoogleDriveLink(currentPdfUrl);
    
    console.log('Original PDF URL:', currentPdfUrl);
    console.log('Converted PDF URL:', convertedUrl);
    
    // Try direct embed first
    iframe.src = convertedUrl;
    
    iframe.onload = function() {
        console.log('PDF loaded successfully');
    };
    
    iframe.onerror = function() {
        console.log('Direct embed failed, trying alternatives...');
        
        // Try Google Docs viewer as fallback
        if (convertedUrl.includes('drive.google.com')) {
            // For Google Drive, try the embedded viewer
            iframe.src = convertedUrl.replace('/preview', '/preview');
        } else {
            // For other URLs, try Google Docs viewer
            iframe.src = `https://docs.google.com/gview?url=${encodeURIComponent(convertedUrl)}&embedded=true`;
        }
        
        // Final fallback check
        setTimeout(() => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (!iframeDoc || iframeDoc.body.innerHTML === '') {
                    showFallback();
                }
            } catch (e) {
                showFallback();
            }
        }, 5000);
    };
}

function showFallback() {
    const iframe = document.getElementById('pdfFrame');
    const fallback = document.getElementById('pdfFallback');
    
    iframe.style.display = 'none';
    fallback.classList.add('active');
}

function refreshPDF() {
    loadPDFInIframe();
}

function openInNewTab() {
    if (currentPdfUrl) {
        const convertedUrl = convertGoogleDriveLink(currentPdfUrl);
        
        // For Google Drive links, try to open in view mode
        if (convertedUrl.includes('drive.google.com')) {
            const viewUrl = convertedUrl.replace('/preview', '/view');
            window.open(viewUrl, '_blank');
        } else {
            window.open(convertedUrl, '_blank');
        }
    }
}

function closePDF() {
    const modal = document.getElementById('pdfModal');
    const iframe = document.getElementById('pdfFrame');
    const fallback = document.getElementById('pdfFallback');
    
    modal.style.display = 'none';
    iframe.src = '';
    fallback.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeArticlePage);
} else {
    initializeArticlePage();
}

// Event listeners
window.onclick = function(event) {
    const modal = document.getElementById('pdfModal');
    if (event.target == modal) {
        closePDF();
    }
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closePDF();
    }
});

// Mobile menu toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileNav.classList.toggle('hidden');
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileMenuBtn.contains(event.target) && !mobileNav.contains(event.target)) {
                mobileNav.classList.add('hidden');
            }
        });
    }
});

// Enhanced Arabic Language Detection and Styling
class ArabicStyler {
    constructor() {
        this.isArabic = false;
        this.isEnglish = false;
        this.isMixed = false;
    }

    // Enhanced Arabic detection with better accuracy
    detectArabic(text) {
        if (!text || typeof text !== 'string') return false;
        
        const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
        const arabicMatches = text.match(arabicPattern) || [];
        const totalChars = text.replace(/[\s\d\p{P}]/gu, '').length;
        
        if (totalChars === 0) return false;
        
        const arabicRatio = arabicMatches.length / totalChars;
        return arabicRatio > 0.3; // 30% threshold for Arabic content
    }

    // Enhanced English detection
    detectEnglish(text) {
        if (!text || typeof text !== 'string') return false;
        
        const englishPattern = /[a-zA-Z]/g;
        const englishMatches = text.match(englishPattern) || [];
        const totalChars = text.replace(/[\s\d\p{P}]/gu, '').length;
        
        if (totalChars === 0) return false;
        
        const englishRatio = englishMatches.length / totalChars;
        return englishRatio > 0.5; // 50% threshold for English content
    }

    // Detect content language with improved logic
    detectContentLanguage(article) {
        const titleText = article.title || '';
        const abstractText = article.abstract || '';
        const combinedText = titleText + ' ' + abstractText;

        if (!combinedText.trim()) return 'english'; // Default to English

        const hasArabic = this.detectArabic(combinedText);
        const hasEnglish = this.detectEnglish(combinedText);

        // Calculate precise ratios
        const arabicMatches = (combinedText.match(/[\u0600-\u06FF]/g) || []).length;
        const englishMatches = (combinedText.match(/[a-zA-Z]/g) || []).length;
        const totalLetters = arabicMatches + englishMatches;

        if (totalLetters === 0) return 'english';

        const arabicRatio = arabicMatches / totalLetters;
        const englishRatio = englishMatches / totalLetters;

        // Determine language based on ratios
        if (hasArabic && hasEnglish) {
            this.isMixed = true;
            // Use Arabic styling if Arabic content is dominant
            return arabicRatio > 0.4 ? 'arabic' : 'english';
        } else if (hasArabic || arabicRatio > 0.2) {
            this.isArabic = true;
            return 'arabic';
        } else {
            this.isEnglish = true;
            return 'english';
        }
    }

    // Apply appropriate styling based on detected language
    applyLanguageStyling(article) {
        const detectedLang = this.detectContentLanguage(article);
        const articleContainer = document.getElementById('article-container');
        
        if (!articleContainer) return;

        // Remove existing language classes
        articleContainer.classList.remove('arabic-article', 'english-article');
        
        // Apply appropriate language class
        if (detectedLang === 'arabic') {
            articleContainer.classList.add('arabic-article');
            document.body.classList.add('arabic-layout');
            console.log('Applied Arabic styling');
        } else {
            articleContainer.classList.add('english-article');
            document.body.classList.remove('arabic-layout');
            console.log('Applied English styling');
        }

        // Set language attribute for better accessibility
        articleContainer.setAttribute('lang', detectedLang === 'arabic' ? 'ar' : 'en');

        this.styleSpecificElements(detectedLang, article);
    }

    // Style specific elements based on language with enhanced logic
    styleSpecificElements(language, article) {
        const elements = {
            title: document.getElementById('article-title'),
            abstract: document.getElementById('abstract-content'),
            authorContainer: document.getElementById('author-container'),
            articleContent: document.querySelector('.article-content'),
            keywordsContainer: document.getElementById('keywords-container'),
            authorInfo: document.querySelector('.author-info'),
            articleMetadata: document.querySelector('.article-metadata')
        };

        Object.entries(elements).forEach(([key, element]) => {
            if (element) {
                if (language === 'arabic') {
                    element.classList.add('arabic-content');
                    element.classList.remove('english-content');
                    element.setAttribute('lang', 'ar');
                    
                    // Apply RTL direction and right alignment
                    element.style.direction = 'rtl';
                    element.style.textAlign = 'right';
                    
                    // Special handling for specific elements
                    if (key === 'title') {
                        element.style.fontFamily = "'Amiri', 'Scheherazade New', serif";
                        element.style.fontSize = '2.5rem';
                        element.style.fontWeight = '600';
                        element.style.lineHeight = '1.5';
                    } else if (key === 'abstract' || key === 'articleContent') {
                        element.style.fontFamily = "'Amiri', serif";
                        element.style.fontSize = '1.15em';
                        element.style.lineHeight = '2.2';
                        element.style.textAlign = 'right';
                    }
                } else {
                    element.classList.add('english-content');
                    element.classList.remove('arabic-content');
                    element.setAttribute('lang', 'en');
                    
                    // Apply LTR direction and left alignment
                    element.style.direction = 'ltr';
                    element.style.textAlign = 'left';
                    
                    // Special handling for specific elements
                    if (key === 'title') {
                        element.style.fontFamily = "'Crimson Text', 'Times New Roman', serif";
                        element.style.fontSize = '2.25rem';
                        element.style.fontWeight = '600';
                        element.style.lineHeight = '1.4';
                    } else if (key === 'abstract' || key === 'articleContent') {
                        element.style.fontFamily = "'Crimson Text', serif";
                        element.style.fontSize = '1.05em';
                        element.style.lineHeight = '1.8';
                        element.style.textAlign = 'left';
                    }
                }
            }
        });

        // Style metadata grid for Arabic
        if (language === 'arabic') {
            const metadataGrid = document.querySelector('.article-metadata .grid');
            if (metadataGrid) {
                metadataGrid.style.direction = 'ltr';
            }
            
            // Style keywords container
            const keywordsContainer = document.getElementById('keywords-container');
            if (keywordsContainer) {
                keywordsContainer.style.justifyContent = 'flex-end';
            }
        }
    }

    // Style mixed content (paragraphs with both languages)
    styleMixedContent() {
        const paragraphs = document.querySelectorAll('.article-content p');
        
        paragraphs.forEach(p => {
            const text = p.textContent;
            if (!text) return;
            
            const hasArabic = this.detectArabic(text);
            const hasEnglish = this.detectEnglish(text);
            
            if (hasArabic && hasEnglish) {
                // Mixed content - use neutral styling
                p.classList.add('mixed-content', 'bidi-content');
                p.style.unicodeBidi = 'plaintext';
                p.style.textAlign = 'start';
                p.style.fontFamily = "'Amiri', 'Crimson Text', serif";
            } else if (hasArabic) {
                // Pure Arabic content
                p.setAttribute('lang', 'ar');
                p.classList.add('arabic-text');
                p.style.direction = 'rtl';
                p.style.textAlign = 'right';
                p.style.fontFamily = "'Amiri', serif";
                p.style.fontSize = '1.15em';
                p.style.lineHeight = '2.2';
            } else if (hasEnglish) {
                // Pure English content
                p.setAttribute('lang', 'en');
                p.classList.add('english-text');
                p.style.direction = 'ltr';
                p.style.textAlign = 'left';
                p.style.fontFamily = "'Crimson Text', serif";
                p.style.fontSize = '1.05em';
                p.style.lineHeight = '1.8';
            }
        });
    }

    // Style headers based on content
    styleHeaders() {
        const headers = document.querySelectorAll('.article-content h1, .article-content h2, .article-content h3');
        
        headers.forEach(header => {
            const text = header.textContent;
            if (!text) return;
            
            const hasArabic = this.detectArabic(text);
            
            if (hasArabic) {
                header.style.fontFamily = "'Amiri', 'Scheherazade New', serif";
                header.style.direction = 'rtl';
                header.style.textAlign = 'right';
                header.style.fontWeight = '700';
            } else {
                header.style.fontFamily = "'Crimson Text', serif";
                header.style.direction = 'ltr';
                header.style.textAlign = 'left';
                header.style.fontWeight = '600';
            }
        });
    }

    // Apply all content styling with enhanced detection
    styleAllContent(article) {
        console.log('Styling content for article:', article.title);
        
        // Apply main language styling
        this.applyLanguageStyling(article);
        
        // Apply detailed content styling after a short delay
        setTimeout(() => {
            this.styleMixedContent();
            this.styleHeaders();
            this.styleSpecialElements();
        }, 150);
    }

    // Style special elements like quotes and citations
    styleSpecialElements() {
        // Style Quranic verses
        const quranVerses = document.querySelectorAll('.quranic-verse');
        quranVerses.forEach(verse => {
            const text = verse.textContent;
            if (this.detectArabic(text)) {
                verse.style.fontFamily = "'Amiri', serif";
                verse.style.direction = 'rtl';
                verse.style.textAlign = 'center';
                verse.style.fontSize = '1.4em';
                verse.style.lineHeight = '2.5';
            } else {
                verse.style.fontFamily = "'Crimson Text', serif";
                verse.style.direction = 'ltr';
                verse.style.textAlign = 'center';
                verse.style.fontSize = '1.1em';
                verse.style.lineHeight = '1.8';
            }
        });

        // Style Hadith quotes
        const hadithQuotes = document.querySelectorAll('.hadith-quote');
        hadithQuotes.forEach(quote => {
            const text = quote.textContent;
            if (this.detectArabic(text)) {
                quote.style.fontFamily = "'Amiri', serif";
                quote.style.direction = 'rtl';
                quote.style.textAlign = 'justify';
                quote.style.fontSize = '1.25em';
                quote.style.lineHeight = '2.3';
            } else {
                quote.style.fontFamily = "'Crimson Text', serif";
                quote.style.direction = 'ltr';
                quote.style.textAlign = 'justify';
                quote.style.fontSize = '1.05em';
                quote.style.lineHeight = '1.8';
            }
        });

        // Style citation boxes
        const citations = document.querySelectorAll('.citation-box');
        citations.forEach(citation => {
            const text = citation.textContent;
            if (this.detectArabic(text)) {
                citation.style.fontFamily = "'Amiri', serif";
                citation.style.direction = 'rtl';
                citation.style.textAlign = 'right';
            } else {
                citation.style.fontFamily = "'Crimson Text', serif";
                citation.style.direction = 'ltr';
                citation.style.textAlign = 'left';
            }
        });
    }
}

// Initialize enhanced Arabic styler
window.arabicStyler = new ArabicStyler();
