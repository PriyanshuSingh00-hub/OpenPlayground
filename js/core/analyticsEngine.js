/**
 * Analytics Engine - Tracks user learning journey and project exploration
 * Privacy-first: All data stored locally in localStorage
 */

class AnalyticsEngine {
    constructor() {
        this.storageKey = 'openPlaygroundAnalytics';
        this.data = this.loadData();
        this.sessionStart = Date.now();
        this.currentProject = null;

        // Achievement definitions
        this.achievements = {
            first_view: {
                id: 'first_view',
                name: 'First Steps',
                description: 'View your first project',
                icon: '🎯',
                condition: (stats) => stats.totalProjectsViewed >= 1
            },
            explorer_10: {
                id: 'explorer_10',
                name: 'Explorer',
                description: 'View 10 different projects',
                icon: '🔍',
                condition: (stats) => stats.totalProjectsViewed >= 10
            },
            explorer_25: {
                id: 'explorer_25',
                name: 'Adventurer',
                description: 'View 25 different projects',
                icon: '🗺️',
                condition: (stats) => stats.totalProjectsViewed >= 25
            },
            explorer_50: {
                id: 'explorer_50',
                name: 'Voyager',
                description: 'View 50 different projects',
                icon: '🚀',
                condition: (stats) => stats.totalProjectsViewed >= 50
            },
            category_master: {
                id: 'category_master',
                name: 'Category Master',
                description: 'Explore all project categories',
                icon: '👑',
                condition: (stats) => stats.categoriesExplored >= 6
            },
            streak_3: {
                id: 'streak_3',
                name: 'Getting Started',
                description: 'Maintain a 3-day streak',
                icon: '🔥',
                condition: (stats) => stats.currentStreak >= 3
            },
            streak_7: {
                id: 'streak_7',
                name: 'Week Warrior',
                description: 'Maintain a 7-day streak',
                icon: '⚡',
                condition: (stats) => stats.currentStreak >= 7
            },
            streak_30: {
                id: 'streak_30',
                name: 'Monthly Master',
                description: 'Maintain a 30-day streak',
                icon: '🏆',
                condition: (stats) => stats.currentStreak >= 30
            },
            bookworm: {
                id: 'bookworm',
                name: 'Bookworm',
                description: 'Bookmark 10 projects',
                icon: '📚',
                condition: (stats) => stats.totalBookmarks >= 10
            },
            night_owl: {
                id: 'night_owl',
                name: 'Night Owl',
                description: 'Explore projects after midnight',
                icon: '🦉',
                condition: (stats) => stats.nightOwlSession
            },
            early_bird: {
                id: 'early_bird',
                name: 'Early Bird',
                description: 'Explore projects before 6 AM',
                icon: '🐦',
                condition: (stats) => stats.earlyBirdSession
            },
            game_lover: {
                id: 'game_lover',
                name: 'Game Lover',
                description: 'View 10 game projects',
                icon: '🎮',
                condition: (stats) => (stats.categoryViews?.game || 0) >= 10
            },
            utility_expert: {
                id: 'utility_expert',
                name: 'Utility Expert',
                description: 'View 10 utility projects',
                icon: '🛠️',
                condition: (stats) => (stats.categoryViews?.utility || 0) >= 10
            }
        };

        this.init();
    }

    init() {
        this.updateStreak();
        this.checkTimeBasedAchievements();
        this.startSessionTracking();
    }

    loadData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load analytics data:', e);
        }

        return this.getDefaultData();
    }

    getDefaultData() {
        return {
            // Core stats
            totalProjectsViewed: 0,
            uniqueProjectsViewed: [],
            categoryViews: {},
            totalTimeSpent: 0, // in minutes
            
            // Streak tracking
            currentStreak: 0,
            longestStreak: 0,
            lastVisitDate: null,
            visitDates: [],
            
            // Achievements
            unlockedAchievements: [],
            
            // Goals
            goals: [],
            
            // Bookmarks count
            totalBookmarks: 0,
            
            // Time-based
            nightOwlSession: false,
            earlyBirdSession: false,
            
            // Weekly data
            weeklyActivity: {},
            
            // Project history with timestamps
            viewHistory: [],
            
            // Learning path
            learningPath: [],
            
            // First visit
            firstVisit: new Date().toISOString(),
            
            // Preferences for recommendations
            preferredCategories: []
        };
    }

    saveData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (e) {
            console.error('Failed to save analytics data:', e);
        }
    }

    // Track project view
    trackProjectView(project) {
        if (!project || !project.title) return;

        const now = new Date();
        const category = (project.category || 'other').toLowerCase();

        // Update total views
        this.data.totalProjectsViewed++;

        // Track unique projects
        if (!this.data.uniqueProjectsViewed.includes(project.title)) {
            this.data.uniqueProjectsViewed.push(project.title);
        }

        // Update category views
        this.data.categoryViews[category] = (this.data.categoryViews[category] || 0) + 1;

        // Add to view history
        this.data.viewHistory.push({
            title: project.title,
            category: category,
            timestamp: now.toISOString(),
            link: project.link
        });

        // Keep only last 100 entries
        if (this.data.viewHistory.length > 100) {
            this.data.viewHistory = this.data.viewHistory.slice(-100);
        }

        // Update learning path
        this.updateLearningPath(project, category);

        // Update weekly activity
        const weekKey = this.getWeekKey(now);
        if (!this.data.weeklyActivity[weekKey]) {
            this.data.weeklyActivity[weekKey] = { views: 0, categories: [], projects: [] };
        }
        this.data.weeklyActivity[weekKey].views++;
        if (!this.data.weeklyActivity[weekKey].categories.includes(category)) {
            this.data.weeklyActivity[weekKey].categories.push(category);
        }
        if (!this.data.weeklyActivity[weekKey].projects.includes(project.title)) {
            this.data.weeklyActivity[weekKey].projects.push(project.title);
        }

        // Update preferred categories
        this.updatePreferredCategories();

        // Check achievements
        this.checkAchievements();

        this.saveData();
    }

    updateLearningPath(project, category) {
        const entry = {
            title: project.title,
            category: category,
            date: new Date().toISOString().split('T')[0]
        };

        // Don't add duplicate consecutive entries
        const lastEntry = this.data.learningPath[this.data.learningPath.length - 1];
        if (!lastEntry || lastEntry.title !== project.title) {
            this.data.learningPath.push(entry);
        }

        // Keep last 50 entries
        if (this.data.learningPath.length > 50) {
            this.data.learningPath = this.data.learningPath.slice(-50);
        }
    }

    updatePreferredCategories() {
        const categoryEntries = Object.entries(this.data.categoryViews);
        categoryEntries.sort((a, b) => b[1] - a[1]);
        this.data.preferredCategories = categoryEntries.slice(0, 3).map(e => e[0]);
    }

    // Streak management
    updateStreak() {
        const today = new Date().toISOString().split('T')[0];
        const lastVisit = this.data.lastVisitDate;

        if (!lastVisit) {
            // First visit
            this.data.currentStreak = 1;
            this.data.lastVisitDate = today;
            this.data.visitDates.push(today);
        } else if (lastVisit === today) {
            // Already visited today
            return;
        } else {
            const lastDate = new Date(lastVisit);
            const todayDate = new Date(today);
            const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive day
                this.data.currentStreak++;
            } else {
                // Streak broken
                this.data.currentStreak = 1;
            }

            this.data.lastVisitDate = today;
            if (!this.data.visitDates.includes(today)) {
                this.data.visitDates.push(today);
            }
        }

        // Update longest streak
        if (this.data.currentStreak > this.data.longestStreak) {
            this.data.longestStreak = this.data.currentStreak;
        }

        this.saveData();
    }

    checkTimeBasedAchievements() {
        const hour = new Date().getHours();

        if (hour >= 0 && hour < 5) {
            this.data.nightOwlSession = true;
        }

        if (hour >= 4 && hour < 6) {
            this.data.earlyBirdSession = true;
        }

        this.saveData();
    }

    startSessionTracking() {
        // Track time spent
        setInterval(() => {
            this.data.totalTimeSpent += 1; // Add 1 minute
            this.saveData();
        }, 60000); // Every minute
    }

    // Check and unlock achievements
    checkAchievements() {
        const stats = this.getStats();

        Object.values(this.achievements).forEach(achievement => {
            if (!this.data.unlockedAchievements.includes(achievement.id)) {
                if (achievement.condition(stats)) {
                    this.unlockAchievement(achievement);
                }
            }
        });
    }

    unlockAchievement(achievement) {
        this.data.unlockedAchievements.push(achievement.id);
        this.saveData();

        // Show notification
        this.showAchievementNotification(achievement);
    }

    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-content">
                <div class="achievement-title">Achievement Unlocked!</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // Get computed stats
    getStats() {
        return {
            totalProjectsViewed: this.data.totalProjectsViewed,
            uniqueProjects: this.data.uniqueProjectsViewed.length,
            categoriesExplored: Object.keys(this.data.categoryViews).length,
            categoryViews: this.data.categoryViews,
            totalTimeSpent: this.data.totalTimeSpent,
            currentStreak: this.data.currentStreak,
            longestStreak: this.data.longestStreak,
            totalBookmarks: this.data.totalBookmarks,
            nightOwlSession: this.data.nightOwlSession,
            earlyBirdSession: this.data.earlyBirdSession,
            unlockedAchievements: this.data.unlockedAchievements,
            preferredCategories: this.data.preferredCategories,
            learningPath: this.data.learningPath,
            viewHistory: this.data.viewHistory,
            weeklyActivity: this.data.weeklyActivity,
            goals: this.data.goals,
            visitDates: this.data.visitDates,
            firstVisit: this.data.firstVisit
        };
    }

    // Goals management
    addGoal(goal) {
        const newGoal = {
            id: Date.now(),
            text: goal.text,
            target: goal.target || 5,
            category: goal.category || null,
            progress: 0,
            createdAt: new Date().toISOString(),
            deadline: goal.deadline || null,
            completed: false
        };

        this.data.goals.push(newGoal);
        this.saveData();
        return newGoal;
    }

    updateGoalProgress(goalId, progress) {
        const goal = this.data.goals.find(g => g.id === goalId);
        if (goal) {
            goal.progress = progress;
            if (progress >= goal.target) {
                goal.completed = true;
            }
            this.saveData();
        }
    }

    deleteGoal(goalId) {
        this.data.goals = this.data.goals.filter(g => g.id !== goalId);
        this.saveData();
    }

    // Update bookmark count
    updateBookmarkCount(count) {
        this.data.totalBookmarks = count;
        this.checkAchievements();
        this.saveData();
    }

    // Get recommendations based on user preferences
    getRecommendations(allProjects) {
        if (!allProjects || allProjects.length === 0) return [];

        const viewedTitles = new Set(this.data.uniqueProjectsViewed);
        const preferredCategories = this.data.preferredCategories;

        // Filter out already viewed projects
        let candidates = allProjects.filter(p => !viewedTitles.has(p.title));

        // Score projects based on category preference
        const scored = candidates.map(project => {
            const category = (project.category || 'other').toLowerCase();
            let score = 0;

            // Prefer categories user has explored
            const prefIndex = preferredCategories.indexOf(category);
            if (prefIndex !== -1) {
                score += (3 - prefIndex) * 10; // Higher score for top preferences
            }

            // Add some randomness
            score += Math.random() * 5;

            return { project, score };
        });

        // Sort by score and return top 6
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, 6).map(s => s.project);
    }

    // Get category distribution for radar chart
    getCategoryDistribution() {
        const categories = ['game', 'utility', 'animation', 'education', 'productivity', 'other'];
        const distribution = {};

        categories.forEach(cat => {
            distribution[cat] = this.data.categoryViews[cat] || 0;
        });

        return distribution;
    }

    // Get weekly summary
    getWeeklySummary() {
        const weekKey = this.getWeekKey(new Date());
        const weekData = this.data.weeklyActivity[weekKey] || { views: 0, categories: [], projects: [] };

        return {
            projectsViewed: weekData.views,
            categoriesExplored: weekData.categories.length,
            uniqueProjects: weekData.projects.length,
            topCategory: this.getTopCategory(weekData.categories)
        };
    }

    getWeekKey(date) {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const weekNumber = Math.ceil(((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
        return `${date.getFullYear()}-W${weekNumber}`;
    }

    getTopCategory(categories) {
        if (!categories || categories.length === 0) return null;

        const counts = {};
        categories.forEach(cat => {
            counts[cat] = (counts[cat] || 0) + 1;
        });

        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    }

    // Format time
    formatTime(minutes) {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }

    // Export data for report
    exportData() {
        return {
            stats: this.getStats(),
            achievements: this.data.unlockedAchievements.map(id => this.achievements[id]),
            weeklyActivity: this.data.weeklyActivity,
            learningPath: this.data.learningPath,
            goals: this.data.goals,
            exportDate: new Date().toISOString()
        };
    }

    // Reset all data
    resetData() {
        this.data = this.getDefaultData();
        this.saveData();
    }
}

// Export singleton
const analyticsEngine = new AnalyticsEngine();
export { analyticsEngine, AnalyticsEngine };
