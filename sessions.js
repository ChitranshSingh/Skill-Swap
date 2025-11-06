// Sessions JavaScript

let currentUser = null;
let currentUserData = null;
let selectedSession = null;
let selectedRating = 0;

document.addEventListener('DOMContentLoaded', async function() {
    
    // Check authentication
    try {
        currentUser = await checkAuth(true);
        await loadCurrentUserData();
        await loadMatchRequests();
        await loadActiveMatches();
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

    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Schedule session button
    document.getElementById('scheduleSessionBtn').addEventListener('click', scheduleSession);

    // Rating modal
    const ratingModal = document.getElementById('ratingModal');
    const closeRatingModal = document.getElementById('closeRatingModal');
    
    closeRatingModal.addEventListener('click', function() {
        ratingModal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target === ratingModal) {
            ratingModal.style.display = 'none';
        }
    });

    // Star rating
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.getAttribute('data-rating'));
            updateStars(selectedRating);
        });
    });

    // Submit rating
    document.getElementById('submitRatingBtn').addEventListener('click', submitRating);
});

// Load Current User Data
async function loadCurrentUserData() {
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            currentUserData = userDoc.data();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Switch Tab
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (tabName === 'matches') {
        document.getElementById('matchesTab').classList.add('active');
        loadMatchRequests();
    } else if (tabName === 'scheduled') {
        document.getElementById('scheduledTab').classList.add('active');
        loadScheduledSessions();
    } else if (tabName === 'completed') {
        document.getElementById('completedTab').classList.add('active');
        loadCompletedSessions();
    }
}

// Load Match Requests
async function loadMatchRequests() {
    try {
        showLoading();
        
        // Get received match requests
        const receivedSnapshot = await db.collection('matches')
            .where('receiverId', '==', currentUser.uid)
            .where('status', '==', 'pending')
            .get();

        // Get sent match requests
        const sentSnapshot = await db.collection('matches')
            .where('requesterId', '==', currentUser.uid)
            .where('status', '==', 'pending')
            .get();

        const container = document.getElementById('matchRequestsList');
        
        if (receivedSnapshot.empty && sentSnapshot.empty) {
            container.innerHTML = '<p class="empty-state">No pending match requests</p>';
            hideLoading();
            return;
        }

        container.innerHTML = '';

        // Display received requests
        if (!receivedSnapshot.empty) {
            const receivedTitle = document.createElement('h3');
            receivedTitle.textContent = 'Received Requests';
            receivedTitle.style.marginBottom = '1rem';
            container.appendChild(receivedTitle);
        }

        receivedSnapshot.forEach(doc => {
            const request = doc.data();
            const requestCard = createMatchRequestCard(doc.id, request, 'received');
            container.appendChild(requestCard);
        });

        // Display sent requests
        if (!sentSnapshot.empty) {
            const sentTitle = document.createElement('h3');
            sentTitle.textContent = 'Sent Requests';
            sentTitle.style.marginTop = '2rem';
            sentTitle.style.marginBottom = '1rem';
            container.appendChild(sentTitle);
        }

        sentSnapshot.forEach(doc => {
            const request = doc.data();
            const requestCard = createMatchRequestCard(doc.id, request, 'sent');
            container.appendChild(requestCard);
        });

        hideLoading();

    } catch (error) {
        console.error('Error loading match requests:', error);
        hideLoading();
    }
}

// Create Match Request Card
function createMatchRequestCard(id, request, type) {
    const card = document.createElement('div');
    card.className = 'request-card';
    
    const name = type === 'received' ? request.requesterName : request.receiverName;
    const skills = request.matchingSkills.map(s => `<span class="skill-tag">${s}</span>`).join('');
    
    card.innerHTML = `
        <div class="request-header">
            <div class="match-avatar">👤</div>
            <div>
                <h4>${name}</h4>
                <p class="request-date">${request.createdAt ? new Date(request.createdAt.toDate()).toLocaleDateString() : 'Recently'}</p>
            </div>
        </div>
        <div class="request-skills">
            <strong>Skills:</strong> ${skills}
        </div>
        ${request.message ? `<p class="request-message">"${request.message}"</p>` : ''}
        <div class="request-actions">
            ${type === 'received' ? `
                <button class="btn btn-primary" onclick="acceptMatch('${id}')">Accept</button>
                <button class="btn btn-secondary" onclick="rejectMatch('${id}')">Decline</button>
            ` : `
                <button class="btn btn-secondary" onclick="cancelMatch('${id}')">Cancel Request</button>
            `}
        </div>
    `;
    
    return card;
}

// Accept Match
async function acceptMatch(matchId) {
    try {
        showLoading();
        
        await db.collection('matches').doc(matchId).update({
            status: 'active',
            acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showSuccess('Match accepted! You can now schedule sessions.');
        await loadMatchRequests();
        await loadActiveMatches();
        hideLoading();
        
    } catch (error) {
        console.error('Error accepting match:', error);
        alert('Error accepting match');
        hideLoading();
    }
}

// Reject Match
async function rejectMatch(matchId) {
    try {
        if (!confirm('Are you sure you want to decline this match request?')) {
            return;
        }
        
        showLoading();
        
        await db.collection('matches').doc(matchId).update({
            status: 'rejected'
        });
        
        showSuccess('Match request declined');
        await loadMatchRequests();
        hideLoading();
        
    } catch (error) {
        console.error('Error rejecting match:', error);
        alert('Error declining match');
        hideLoading();
    }
}

// Cancel Match
async function cancelMatch(matchId) {
    try {
        if (!confirm('Are you sure you want to cancel this request?')) {
            return;
        }
        
        showLoading();
        
        await db.collection('matches').doc(matchId).delete();
        
        showSuccess('Request cancelled');
        await loadMatchRequests();
        hideLoading();
        
    } catch (error) {
        console.error('Error cancelling match:', error);
        alert('Error cancelling request');
        hideLoading();
    }
}

// Load Active Matches for Scheduling
async function loadActiveMatches() {
    try {
        const matchesSnapshot = await db.collection('matches')
            .where('participants', 'array-contains', currentUser.uid)
            .where('status', '==', 'active')
            .get();

        const select = document.getElementById('matchSelect');
        select.innerHTML = '<option value="">Select a match...</option>';

        matchesSnapshot.forEach(doc => {
            const match = doc.data();
            const partnerId = match.participants.find(id => id !== currentUser.uid);
            const partnerName = partnerId === match.requesterId ? match.requesterName : match.receiverName;
            
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = partnerName;
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading active matches:', error);
    }
}

// Schedule Session
async function scheduleSession() {
    try {
        const matchId = document.getElementById('matchSelect').value;
        const subject = document.getElementById('sessionSubject').value.trim();
        const dateTime = document.getElementById('sessionDateTime').value;
        const meetLink = document.getElementById('sessionMeetLink').value.trim();
        const notes = document.getElementById('sessionNotes').value.trim();

        if (!matchId || !subject || !dateTime) {
            alert('Please fill in all required fields');
            return;
        }

        showLoading();

        // Get match details
        const matchDoc = await db.collection('matches').doc(matchId).get();
        const matchData = matchDoc.data();

        // Create session
        await db.collection('sessions').add({
            matchId: matchId,
            participants: matchData.participants,
            subject: subject,
            scheduledAt: new Date(dateTime),
            meetLink: meetLink,
            notes: notes,
            status: 'scheduled',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Clear form
        document.getElementById('matchSelect').value = '';
        document.getElementById('sessionSubject').value = '';
        document.getElementById('sessionDateTime').value = '';
        document.getElementById('sessionMeetLink').value = '';
        document.getElementById('sessionNotes').value = '';

        showSuccess('Session scheduled successfully!');
        await loadScheduledSessions();
        hideLoading();

    } catch (error) {
        console.error('Error scheduling session:', error);
        alert('Error scheduling session');
        hideLoading();
    }
}

// Load Scheduled Sessions
async function loadScheduledSessions() {
    try {
        showLoading();
        
        const sessionsSnapshot = await db.collection('sessions')
            .where('participants', 'array-contains', currentUser.uid)
            .where('status', '==', 'scheduled')
            .orderBy('scheduledAt', 'asc')
            .get();

        const container = document.getElementById('scheduledSessionsList');
        
        if (sessionsSnapshot.empty) {
            container.innerHTML = '<p class="empty-state">No scheduled sessions</p>';
            hideLoading();
            return;
        }

        container.innerHTML = '';

        for (const doc of sessionsSnapshot.docs) {
            const session = doc.data();
            const sessionCard = await createSessionCard(doc.id, session, 'scheduled');
            container.appendChild(sessionCard);
        }

        hideLoading();

    } catch (error) {
        console.error('Error loading scheduled sessions:', error);
        hideLoading();
    }
}

// Load Completed Sessions
async function loadCompletedSessions() {
    try {
        showLoading();
        
        const sessionsSnapshot = await db.collection('sessions')
            .where('participants', 'array-contains', currentUser.uid)
            .where('status', '==', 'completed')
            .orderBy('createdAt', 'desc')
            .get();

        const container = document.getElementById('completedSessionsList');
        
        if (sessionsSnapshot.empty) {
            container.innerHTML = '<p class="empty-state">No completed sessions yet</p>';
            hideLoading();
            return;
        }

        container.innerHTML = '';

        for (const doc of sessionsSnapshot.docs) {
            const session = doc.data();
            const sessionCard = await createSessionCard(doc.id, session, 'completed');
            container.appendChild(sessionCard);
        }

        hideLoading();

    } catch (error) {
        console.error('Error loading completed sessions:', error);
        hideLoading();
    }
}

// Create Session Card
async function createSessionCard(id, session, type) {
    const card = document.createElement('div');
    card.className = 'session-card';
    
    // Get partner details
    const partnerId = session.participants.find(pid => pid !== currentUser.uid);
    const partnerDoc = await db.collection('users').doc(partnerId).get();
    const partnerName = partnerDoc.exists ? partnerDoc.data().name : 'Unknown User';
    
    const date = session.scheduledAt ? new Date(session.scheduledAt.toDate()).toLocaleString() : 'TBD';
    
    card.innerHTML = `
        <div class="session-header">
            <h4>${session.subject}</h4>
            <span class="session-status">${type}</span>
        </div>
        <p><strong>With:</strong> ${partnerName}</p>
        <p><strong>Date:</strong> ${date}</p>
        ${session.meetLink ? `<p><strong>Meeting Link:</strong> <a href="${session.meetLink}" target="_blank">Join Meeting</a></p>` : ''}
        ${session.notes ? `<p><strong>Notes:</strong> ${session.notes}</p>` : ''}
        <div class="session-actions">
            ${type === 'scheduled' ? `
                <button class="btn btn-primary" onclick="completeSession('${id}', '${partnerId}', '${partnerName}')">Mark Complete</button>
                <button class="btn btn-secondary" onclick="cancelSession('${id}')">Cancel</button>
            ` : ''}
        </div>
    `;
    
    return card;
}

// Complete Session
async function completeSession(sessionId, partnerId, partnerName) {
    try {
        if (!confirm('Mark this session as completed?')) {
            return;
        }
        
        showLoading();
        
        await db.collection('sessions').doc(sessionId).update({
            status: 'completed',
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update user stats
        await db.collection('users').doc(currentUser.uid).update({
            completedSessions: firebase.firestore.FieldValue.increment(1),
            points: firebase.firestore.FieldValue.increment(10)
        });

        await db.collection('users').doc(partnerId).update({
            completedSessions: firebase.firestore.FieldValue.increment(1),
            points: firebase.firestore.FieldValue.increment(10)
        });

        showSuccess('Session completed! +10 points');
        await loadScheduledSessions();
        
        // Open rating modal
        selectedSession = { id: sessionId, partnerId: partnerId, partnerName: partnerName };
        openRatingModal(partnerName);
        
        hideLoading();
        
    } catch (error) {
        console.error('Error completing session:', error);
        alert('Error marking session as complete');
        hideLoading();
    }
}

// Cancel Session
async function cancelSession(sessionId) {
    try {
        if (!confirm('Are you sure you want to cancel this session?')) {
            return;
        }
        
        showLoading();
        
        await db.collection('sessions').doc(sessionId).delete();
        
        showSuccess('Session cancelled');
        await loadScheduledSessions();
        hideLoading();
        
    } catch (error) {
        console.error('Error cancelling session:', error);
        alert('Error cancelling session');
        hideLoading();
    }
}

// Open Rating Modal
function openRatingModal(partnerName) {
    document.getElementById('ratingUserName').textContent = partnerName;
    selectedRating = 0;
    updateStars(0);
    document.getElementById('ratingFeedback').value = '';
    document.getElementById('ratingModal').style.display = 'block';
}

// Update Stars Display
function updateStars(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.style.opacity = '1';
            star.style.transform = 'scale(1.2)';
        } else {
            star.style.opacity = '0.3';
            star.style.transform = 'scale(1)';
        }
    });
}

// Submit Rating
async function submitRating() {
    try {
        if (selectedRating === 0) {
            alert('Please select a rating');
            return;
        }
        
        showLoading();
        
        const feedback = document.getElementById('ratingFeedback').value.trim();
        
        // Save rating
        await db.collection('ratings').add({
            sessionId: selectedSession.id,
            raterId: currentUser.uid,
            ratedUserId: selectedSession.partnerId,
            rating: selectedRating,
            feedback: feedback,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update partner's average rating
        const ratingsSnapshot = await db.collection('ratings')
            .where('ratedUserId', '==', selectedSession.partnerId)
            .get();
        
        let totalRating = 0;
        ratingsSnapshot.forEach(doc => {
            totalRating += doc.data().rating;
        });
        
        const avgRating = totalRating / ratingsSnapshot.size;
        
        await db.collection('users').doc(selectedSession.partnerId).update({
            rating: avgRating
        });

        document.getElementById('ratingModal').style.display = 'none';
        showSuccess('Thank you for your feedback!');
        hideLoading();
        
    } catch (error) {
        console.error('Error submitting rating:', error);
        alert('Error submitting rating');
        hideLoading();
    }
}

// Show Success Message
function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.classList.remove('hidden');
    
    setTimeout(() => {
        successDiv.classList.add('hidden');
    }, 3000);
}