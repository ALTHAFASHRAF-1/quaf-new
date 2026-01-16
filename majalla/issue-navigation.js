// issue-navigation.js - Issue navigation helper

class IssueNavigation {
    static generateIssueSelector() {
        if (!window.journalData || !window.journalData.issues) {
            console.warn('Journal data not available for issue selector');
            return [];
        }

        return Object.entries(window.journalData.issues)
            .map(([issueId, issue]) => ({
                id: issueId,
                title: issue.title,
                year: issue.year,
                volume: issue.volume,
                number: issue.number,
                url: `issues.html?issue=${issueId}`
            }))
            .sort((a, b) => {
                if (b.year !== a.year) return b.year - a.year;
                if (b.volume !== a.volume) return b.volume - a.volume;
                return b.number - a.number;
            });
    }

    static getIssueUrl(issueId) {
        return `issues.html?issue=${issueId}`;
    }

    static getPreviousIssue(currentIssueId) {
        const issues = this.generateIssueSelector();
        const currentIndex = issues.findIndex(issue => issue.id === currentIssueId);
        
        if (currentIndex > 0) {
            return {
                ...issues[currentIndex - 1],
                url: this.getIssueUrl(issues[currentIndex - 1].id)
            };
        }
        
        return null;
    }

    static getNextIssue(currentIssueId) {
        const issues = this.generateIssueSelector();
        const currentIndex = issues.findIndex(issue => issue.id === currentIssueId);
        
        if (currentIndex >= 0 && currentIndex < issues.length - 1) {
            return {
                ...issues[currentIndex + 1],
                url: this.getIssueUrl(issues[currentIndex + 1].id)
            };
        }
        
        return null;
    }
}

// Make available globally
window.IssueNavigation = IssueNavigation;
