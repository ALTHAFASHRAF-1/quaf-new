// tracking.js - Client-side tracking functionality

/**
 * Configuration
 */
const TRACKING_CONFIG = {
    // Replace with your deployed Google Apps Script web app URL
    API_URL: 'https://script.google.com/macros/s/AKfycbxwY9P5yJnCKLqzJVJnRR4muBeJ8R2DuPb2QbcIXBfH7f-53GjrmDvCPlWQDobSBNSUxQ/exec',
    
    // Enable/disable tracking
    ENABLED: true,
    
    // Session duration (24 hours)
    SESSION_DURATION: 24 * 60 * 60 * 1000,
    
    // Retry configuration
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
};

/**
 * Tracking utility class
 */
class UserTracker {
    constructor() {
        this.sessionId = this.getOrCreateSessionId();
        this.userIdHash = this.getOrCreateUserIdHash();
        this.isInitialized = false;
        this.initializeTracking();
    }

    /**
     * Initialize tracking when page loads
     */
    initializeTracking() {
        if (!TRACKING_CONFIG.ENABLED) {
            console.log('Tracking is disabled');
            return;
        }

        try {
            // Track page view
            this.trackPageView();

            // Set up button click tracking
            this.setupButtonTracking();
            
            this.isInitialized = true;
            console.log('User tracking initialized successfully');
            
        } catch (error) {
            console.error('Error initializing tracking:', error);
        }
    }

    /**
     * Generate or retrieve session ID
     */
    getOrCreateSessionId() {
        const SESSION_KEY = 'ii_session_id';
        const SESSION_TIME_KEY = 'ii_session_time';
        
        try {
            let sessionId = localStorage.getItem(SESSION_KEY);
            let sessionTime = localStorage.getItem(SESSION_TIME_KEY);
            
            const now = Date.now();
            
            // Check if session has expired
            if (!sessionId || !sessionTime || (now - parseInt(sessionTime)) > TRACKING_CONFIG.SESSION_DURATION) {
                sessionId = 'ii_' + now + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem(SESSION_KEY, sessionId);
                localStorage.setItem(SESSION_TIME_KEY, now.toString());
            }
            
            return sessionId;
            
        } catch (error) {
            console.error('Error managing session ID:', error);
            // Fallback to in-memory session ID
            return 'ii_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    }

    /**
     * Generate or retrieve user ID hash
     */
    getOrCreateUserIdHash() {
        const USER_KEY = 'ii_user_hash';
        
        try {
            let userHash = localStorage.getItem(USER_KEY);
            
            if (!userHash) {
                // Create a pseudo-anonymous hash based on browser characteristics
                const fingerprint = [
                    navigator.userAgent || '',
                    navigator.language || '',
                    screen.width + 'x' + screen.height,
                    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
                    new Date().getTimezoneOffset().toString()
                ].join('|');
                
                userHash = this.simpleHash(fingerprint);
                localStorage.setItem(USER_KEY, userHash);
            }
            
            return userHash;
            
        } catch (error) {
            console.error('Error managing user hash:', error);
            // Fallback to basic hash
            return this.simpleHash(navigator.userAgent + Date.now());
        }
    }

    /**
     * Simple hash function
     */
    simpleHash(str) {
        let hash = 0;
        if (!str) return 'hash_default';
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash &= hash; // Convert to 32bit integer
        }
        return 'hash_' + Math.abs(hash).toString(36);
    }

    /**
     * Get user environment data
     */
    getUserEnvironment() {
        try {
            return {
                userAgent: navigator.userAgent || '',
                pageUrl: window.location.href || '',
                referrer: document.referrer || '',
                screenResolution: (screen.width || 0) + 'x' + (screen.height || 0),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
                language: navigator.language || '',
                platform: navigator.platform || '',
                sessionId: this.sessionId,
                userIdHash: this.userIdHash
            };
        } catch (error) {
            console.error('Error getting user environment:', error);
            return {
                userAgent: '',
                pageUrl: window.location.href || '',
                referrer: '',
                screenResolution: '',
                timezone: '',
                language: '',
                platform: '',
                sessionId: this.sessionId,
                userIdHash: this.userIdHash
            };
        }
    }

    /**
     * Send tracking data to server with retry logic
     */
    async sendTrackingData(action, additionalData = {}) {
        if (!TRACKING_CONFIG.ENABLED) return null;

        const trackingData = {
            action: action,
            timestamp: new Date().toISOString(),
            ...this.getUserEnvironment(),
            ...additionalData
        };

        let lastError = null;
        
        for (let attempt = 1; attempt <= TRACKING_CONFIG.MAX_RETRIES; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
                
                const response = await fetch(TRACKING_CONFIG.API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(trackingData),
                    mode: 'cors',
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log(`Tracking data sent successfully (attempt ${attempt}):`, result);
                return result;

            } catch (error) {
                lastError = error;
                console.error(`Tracking attempt ${attempt} failed:`, error);
                
                if (attempt < TRACKING_CONFIG.MAX_RETRIES) {
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, TRACKING_CONFIG.RETRY_DELAY * attempt));
                }
            }
        }
        
        console.error('All tracking attempts failed:', lastError);
        return null;
    }

    /**
     * Track page view
     */
    async trackPageView() {
        try {
            await this.sendTrackingData('page_view');
        } catch (error) {
            console.error('Error tracking page view:', error);
        }
    }

    /**
     * Track button click
     */
    async trackButtonClick(buttonId, buttonText) {
        try {
            await this.sendTrackingData('button_click', {
                buttonId: buttonId,
                buttonText: buttonText
            });
        } catch (error) {
            console.error('Error tracking button click:', error);
        }
    }

    /**
     * Track copy creation
     */
    async trackCopyCreated() {
        try {
            await this.sendTrackingData('copy_created');
        } catch (error) {
            console.error('Error tracking copy creation:', error);
        }
    }

    /**
     * Track link click
     */
    async trackLinkClick(linkText, linkHref) {
        try {
            await this.sendTrackingData('link_click', {
                linkText: linkText,
                linkHref: linkHref
            });
        } catch (error) {
            console.error('Error tracking link click:', error);
        }
    }

    /**
     * Set up button click tracking
     */
    setupButtonTracking() {
        try {
            // Track the Create Full Paper button
            const createPaperBtn = document.getElementById('create-paper-btn');
            if (createPaperBtn) {
                createPaperBtn.addEventListener('click', (e) => {
                    this.trackButtonClick('create-paper-btn', 'Create Full Paper');
                    
                    // Track copy creation after a short delay
                    setTimeout(() => {
                        this.trackCopyCreated();
                    }, 1000);
                });
            }

            // Track other important buttons and links
            document.addEventListener('click', (e) => {
                const target = e.target;
                
                // Track navigation links
                if (target.tagName === 'A' && target.href) {
                    const linkText = target.textContent.trim();
                    const linkHref = target.href;
                    
                    // Don't track empty links or javascript: links
                    if (linkText && linkHref && !linkHref.startsWith('javascript:')) {
                        this.trackLinkClick(linkText, linkHref);
                    }
                }
                
                // Track other buttons
                if (target.tagName === 'BUTTON' && target.id && target.id !== 'create-paper-btn') {
                    const buttonText = target.textContent.trim();
                    this.trackButtonClick(target.id, buttonText);
                }
            });
            
        } catch (error) {
            console.error('Error setting up button tracking:', error);
        }
    }

    /**
     * Get tracking status
     */
    getStatus() {
        return {
            enabled: TRACKING_CONFIG.ENABLED,
            initialized: this.isInitialized,
            sessionId: this.sessionId,
            userIdHash: this.userIdHash
        };
    }
}

/**
 * Initialize tracking when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize tracker
        window.userTracker = new UserTracker();
        
        // Make it available globally for debugging
        window.getTrackingStatus = () => window.userTracker.getStatus();
        
    } catch (error) {
        console.error('Error initializing user tracker:', error);
    }
});

/**
 * Export for global use
 */
if (typeof window !== 'undefined') {
    window.UserTracker = UserTracker;
}
