// Dashboard JavaScript

document.addEventListener('DOMContentLoaded', async function() {
    
    // Check authentication
    try {
        const user = await checkAuth(true);
        loadDashboardData(user);
    } catch (error) {
        console.error('Auth error:', error);
        return;
    }

    // Mobile menu toggle
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    
    hamburger.addEventListener('click', function() {
        navLinks.classList.toggle('active');
    });

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            await logout();
        }
    });
});

// Load Dashboard Data
async function loadDashboardData(user) {
    try {
        showLoading();

        // Get user data from Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            console.error('User document not found');
            hideLoading();
            return;
        }

        const userData = userDoc.data();

        // Update user name
        document.getElementById('userName').textContent = userData.name || user.displayName || 'Student';

        // Update stats
        document.getElementById('sessionsCount').textContent = userData.completedSessions || 0;
        document.getElementById('userRating').textContent = (userData.rating || 0).toFixed(1);
        document.getElementById('userPoints').textContent = userData.points || 0;

        // Load teaching skills
        loadSkills(userData.skillsToTeach || [], 'teachingSkills');

        // Load learning skills
        loadSkills(userData.skillsToLearn || [], 'learningSkills');

        // Load badges
        loadBadges(userData.badges || []);

        // Load matches count
        await loadMatchesCount(user.uid);

        // Load recent activity
        await loadRecentActivity(user.uid);

        hideLoading();

    } catch (error) {
        console.error('Error loading dashboard:', error);
        hideLoading();
    }
}

// Load Skills
function loadSkills(skills, elementId) {
    const container = document.getElementById(elementId);
    
    if (!skills || skills.length === 0) {
        const profileLink = elementId === 'teachingSkills' ? 'profile.html' : 'profile.html';
        container.innerHTML = `<p class="empty-state">No skills added yet. <a href="${profileLink}">Add skills</a></p>`;
        return;
    }

    container.innerHTML = '';
    skills.forEach(skill => {
        const skillTag = document.createElement('span');
        skillTag.className = 'skill-tag';
        skillTag.textContent = skill;
        container.appendChild(skillTag);
    });
}

// Load Badges
function loadBadges(badges) {
    const container = document.getElementById('userBadges');
    
    if (!badges || badges.length === 0) {
        container.innerHTML = '<p class="empty-state">Complete sessions to earn badges!</p>';
        return;
    }

    container.innerHTML = '';
    badges.forEach(badge => {
        const badgeItem = document.createElement('div');
        badgeItem.className = 'badge-item';
        badgeItem.innerHTML = `
            <div class="badge-icon">${badge.icon}</div>
            <h4>${badge.name}</h4>
            <p>${badge.description}</p>
        `;
        container.appendChild(badgeItem);
    });
}

// Load Matches Count
async function loadMatchesCount(userId) {
    try {
        // Get matches where user is either requester or receiver
        const matchesSnapshot = await db.collection('matches')
            .where('participants', 'array-contains', userId)
            .where('status', '==', 'active')
            .get();

        document.getElementById('matchesCount').textContent = matchesSnapshot.size;

    } catch (error) {
        console.error('Error loading matches:', error);
    }
}

// Load Recent Activity
async function loadRecentActivity(userId) {
    try {
        const activityContainer = document.getElementById('recentActivity');
        
        // Get recent sessions
        const sessionsSnapshot = await db.collection('sessions')
            .where('participants', 'array-contains', userId)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();

        if (sessionsSnapshot.empty) {
            activityContainer.innerHTML = '<p class="empty-state">No recent activity</p>';
            return;
        }

        activityContainer.innerHTML = '';
        
        for (const doc of sessionsSnapshot.docs) {
            const session = doc.data();
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            // Get partner name
            const partnerId = session.participants.find(id => id !== userId);
            const partnerDoc = await db.collection('users').doc(partnerId).get();
            const partnerName = partnerDoc.exists ? partnerDoc.data().name : 'Unknown User';
            
            // Format date
            const date = session.createdAt ? new Date(session.createdAt.toDate()).toLocaleDateString() : 'Recent';
            
            activityItem.innerHTML = `
                <div class="activity-item-header">
                    <h4>${session.status === 'completed' ? '✅' : '⏳'} Session with ${partnerName}</h4>
                    <span class="activity-time">${date}</span>
                </div>
                <p>Subject: ${session.subject || 'General'} • Status: ${session.status || 'pending'}</p>
            `;
            
            activityContainer.appendChild(activityItem);
        }

    } catch (error) {
        console.error('Error loading activity:', error);
        document.getElementById('recentActivity').innerHTML = '<p class="empty-state">Error loading activity</p>';
    }
}

// Award badge based on milestones
async function checkAndAwardBadges(userId, userData) {
    const badges = userData.badges || [];
    const newBadges = [];

    // First Session Badge
    if (userData.completedSessions >= 1 && !badges.find(b => b.id === 'first_session')) {
        newBadges.push({
            id: 'first_session',
            name: 'First Step',
            icon: '🎯',
            description: 'Completed your first session'
        });
    }

    // 10 Sessions Badge
    if (userData.completedSessions >= 10 && !badges.find(b => b.id === 'ten_sessions')) {
        newBadges.push({
            id: 'ten_sessions',
            name: 'Regular Learner',
            icon: '📚',
            description: 'Completed 10 sessions'
        });
    }

    // High Rating Badge
    if (userData.rating >= 4.5 && !badges.find(b => b.id === 'high_rating')) {
        newBadges.push({
            id: 'high_rating',
            name: 'Star Teacher',
            icon: '⭐',
            description: 'Maintained 4.5+ rating'
        });
    }

    // If new badges earned, update Firestore
    if (newBadges.length > 0) {
        await db.collection('users').doc(userId).update({
            badges: firebase.firestore.FieldValue.arrayUnion(...newBadges)
        });
    }
}