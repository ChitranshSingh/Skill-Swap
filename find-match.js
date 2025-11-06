// Find Match JavaScript

let currentUser = null;
let currentUserData = null;
let allMatches = [];
let selectedMatch = null;

document.addEventListener('DOMContentLoaded', async function() {
    
    // Check authentication
    try {
        currentUser = await checkAuth(true);
        await loadCurrentUserData();
        await loadMatches();
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

    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', function() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        filterMatches(searchTerm);
    });

    // Enter key support for search
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('searchBtn').click();
        }
    });

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', function() {
        document.getElementById('searchInput').value = '';
        displayMatches(allMatches);
    });

    // Modal functionality
    const modal = document.getElementById('requestModal');
    const closeModal = document.getElementById('closeRequestModal');
    
    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Send request button
    document.getElementById('sendRequestBtn').addEventListener('click', sendMatchRequest);
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

// Load Potential Matches
async function loadMatches() {
    try {
        showLoading();

        if (!currentUserData || !currentUserData.skillsToLearn || currentUserData.skillsToLearn.length === 0) {
            document.getElementById('matchesGrid').innerHTML = `
                <div class="empty-state">
                    <p>Please add skills you want to learn in your <a href="profile.html">profile</a> to find matches.</p>
                </div>
            `;
            hideLoading();
            return;
        }

        // Get all users except current user
        const usersSnapshot = await db.collection('users').get();
        const potentialMatches = [];

        usersSnapshot.forEach(doc => {
            if (doc.id !== currentUser.uid) {
                const userData = doc.data();
                // Check if user can teach what current user wants to learn
                const canTeach = userData.skillsToTeach || [];
                const wantToLearn = currentUserData.skillsToLearn || [];
                
                const matchingSkills = canTeach.filter(skill => 
                    wantToLearn.some(wantSkill => 
                        wantSkill.toLowerCase().includes(skill.toLowerCase()) ||
                        skill.toLowerCase().includes(wantSkill.toLowerCase())
                    )
                );

                if (matchingSkills.length > 0) {
                    potentialMatches.push({
                        ...userData,
                        matchingSkills: matchingSkills,
                        matchScore: matchingSkills.length
                    });
                }
            }
        });

        // Sort by match score
        potentialMatches.sort((a, b) => b.matchScore - a.matchScore);

        allMatches = potentialMatches;
        displayMatches(potentialMatches);
        hideLoading();

    } catch (error) {
        console.error('Error loading matches:', error);
        document.getElementById('matchesGrid').innerHTML = '<p class="empty-state">Error loading matches</p>';
        hideLoading();
    }
}

// Display Matches
function displayMatches(matches) {
    const grid = document.getElementById('matchesGrid');
    
    if (matches.length === 0) {
        grid.innerHTML = '<p class="empty-state">No matches found. Try updating your skills!</p>';
        return;
    }

    grid.innerHTML = '';
    matches.forEach(match => {
        const matchCard = document.createElement('div');
        matchCard.className = 'match-card';
        
        const skills = match.matchingSkills.map(skill => 
            `<span class="skill-tag">${skill}</span>`
        ).join('');

        matchCard.innerHTML = `
            <div class="match-header">
                <div class="match-avatar">👤</div>
                <div class="match-info">
                    <h3>${match.name}</h3>
                    <p class="match-stats">
                        ⭐ ${(match.rating || 0).toFixed(1)} • 
                        📚 ${match.completedSessions || 0} sessions
                    </p>
                </div>
            </div>
            <div class="match-skills">
                <h4>Can teach:</h4>
                <div class="skills-list">${skills}</div>
            </div>
            ${match.bio ? `<p class="match-bio">${match.bio.substring(0, 100)}${match.bio.length > 100 ? '...' : ''}</p>` : ''}
            <button class="btn btn-primary btn-block match-btn" onclick="openRequestModal('${match.uid}')">
                Send Match Request
            </button>
        `;
        
        grid.appendChild(matchCard);
    });
}

// Filter Matches
function filterMatches(searchTerm) {
    if (!searchTerm) {
        displayMatches(allMatches);
        return;
    }

    const filtered = allMatches.filter(match => {
        const nameMatch = match.name.toLowerCase().includes(searchTerm);
        const skillMatch = match.matchingSkills.some(skill => 
            skill.toLowerCase().includes(searchTerm)
        );
        return nameMatch || skillMatch;
    });

    displayMatches(filtered);
}

// Open Request Modal
async function openRequestModal(userId) {
    try {
        showLoading();
        
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            alert('User not found');
            hideLoading();
            return;
        }

        selectedMatch = { uid: userId, ...userDoc.data() };
        
        document.getElementById('matchUserName').textContent = selectedMatch.name;
        
        const skills = selectedMatch.matchingSkills.map(skill => 
            `<span class="skill-tag">${skill}</span>`
        ).join('');
        
        document.getElementById('matchDetails').innerHTML = `
            <p><strong>Matching Skills:</strong></p>
            <div class="skills-list">${skills}</div>
        `;
        
        document.getElementById('requestModal').style.display = 'block';
        hideLoading();
        
    } catch (error) {
        console.error('Error opening modal:', error);
        hideLoading();
    }
}

// Send Match Request
async function sendMatchRequest() {
    try {
        showLoading();

        const message = document.getElementById('requestMessage').value.trim();

        // Check if request already exists
        const existingRequest = await db.collection('matches')
            .where('requesterId', '==', currentUser.uid)
            .where('receiverId', '==', selectedMatch.uid)
            .where('status', 'in', ['pending', 'active'])
            .get();

        if (!existingRequest.empty) {
            alert('You already have a pending or active match with this user');
            hideLoading();
            return;
        }

        // Create match request
        await db.collection('matches').add({
            requesterId: currentUser.uid,
            requesterName: currentUserData.name,
            receiverId: selectedMatch.uid,
            receiverName: selectedMatch.name,
            participants: [currentUser.uid, selectedMatch.uid],
            matchingSkills: selectedMatch.matchingSkills,
            message: message,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        document.getElementById('requestModal').style.display = 'none';
        document.getElementById('requestMessage').value = '';
        
        showSuccess('Match request sent successfully!');
        hideLoading();

    } catch (error) {
        console.error('Error sending request:', error);
        alert('Error sending request. Please try again.');
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