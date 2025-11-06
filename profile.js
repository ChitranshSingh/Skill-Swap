// Profile JavaScript

let currentUser = null;
let userData = null;

document.addEventListener('DOMContentLoaded', async function() {
    
    // Check authentication
    try {
        currentUser = await checkAuth(true);
        await loadProfileData(currentUser);
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

    // Add teaching skill
    document.getElementById('addTeachSkill').addEventListener('click', function() {
        const input = document.getElementById('teachSkillInput');
        const skill = input.value.trim();
        
        if (skill) {
            addSkill(skill, 'skillsToTeach');
            input.value = '';
        }
    });

    // Add learning skill
    document.getElementById('addLearnSkill').addEventListener('click', function() {
        const input = document.getElementById('learnSkillInput');
        const skill = input.value.trim();
        
        if (skill) {
            addSkill(skill, 'skillsToLearn');
            input.value = '';
        }
    });

    // Enter key support for skill inputs
    document.getElementById('teachSkillInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('addTeachSkill').click();
        }
    });

    document.getElementById('learnSkillInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('addLearnSkill').click();
        }
    });

    // Save availability
    document.getElementById('saveAvailability').addEventListener('click', saveAvailability);

    // Save bio
    document.getElementById('saveBio').addEventListener('click', saveBio);
});

// Load Profile Data
async function loadProfileData(user) {
    try {
        showLoading();

        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            console.error('User document not found');
            hideLoading();
            return;
        }

        userData = userDoc.data();

        // Update profile info
        document.getElementById('profileName').textContent = userData.name || user.displayName || 'Student';
        document.getElementById('profileEmail').textContent = userData.email || user.email;
        document.getElementById('profileSessions').textContent = userData.completedSessions || 0;
        document.getElementById('profileRating').textContent = (userData.rating || 0).toFixed(1);
        document.getElementById('profilePoints').textContent = userData.points || 0;

        // Load skills
        displaySkills(userData.skillsToTeach || [], 'teachSkillsList', 'skillsToTeach');
        displaySkills(userData.skillsToLearn || [], 'learnSkillsList', 'skillsToLearn');

        // Load availability
        if (userData.availability) {
            Object.keys(userData.availability).forEach(day => {
                const checkbox = document.getElementById(`available${day.charAt(0).toUpperCase() + day.slice(1)}`);
                if (checkbox) {
                    checkbox.checked = userData.availability[day];
                }
            });
        }

        // Load bio
        if (userData.bio) {
            document.getElementById('userBio').value = userData.bio;
        }

        hideLoading();

    } catch (error) {
        console.error('Error loading profile:', error);
        hideLoading();
    }
}

// Display Skills
function displaySkills(skills, containerId, fieldName) {
    const container = document.getElementById(containerId);
    
    if (!skills || skills.length === 0) {
        container.innerHTML = '<p class="empty-state">No skills added yet</p>';
        return;
    }

    container.innerHTML = '';
    skills.forEach(skill => {
        const skillItem = document.createElement('div');
        skillItem.className = 'skill-item';
        skillItem.innerHTML = `
            <span class="skill-tag">${skill}</span>
            <button class="btn-remove" onclick="removeSkill('${skill}', '${fieldName}')">×</button>
        `;
        container.appendChild(skillItem);
    });
}

// Add Skill
async function addSkill(skill, fieldName) {
    try {
        showLoading();

        // Get current skills
        const currentSkills = userData[fieldName] || [];
        
        // Check if skill already exists
        if (currentSkills.includes(skill)) {
            alert('This skill is already added');
            hideLoading();
            return;
        }

        // Add skill to Firestore
        await db.collection('users').doc(currentUser.uid).update({
            [fieldName]: firebase.firestore.FieldValue.arrayUnion(skill)
        });

        // Update local data
        userData[fieldName] = [...currentSkills, skill];

        // Refresh display
        const containerId = fieldName === 'skillsToTeach' ? 'teachSkillsList' : 'learnSkillsList';
        displaySkills(userData[fieldName], containerId, fieldName);

        showSuccess('Skill added successfully!');
        hideLoading();

    } catch (error) {
        console.error('Error adding skill:', error);
        alert('Error adding skill. Please try again.');
        hideLoading();
    }
}

// Remove Skill
async function removeSkill(skill, fieldName) {
    try {
        if (!confirm(`Remove "${skill}" from your profile?`)) {
            return;
        }

        showLoading();

        // Remove skill from Firestore
        await db.collection('users').doc(currentUser.uid).update({
            [fieldName]: firebase.firestore.FieldValue.arrayRemove(skill)
        });

        // Update local data
        userData[fieldName] = userData[fieldName].filter(s => s !== skill);

        // Refresh display
        const containerId = fieldName === 'skillsToTeach' ? 'teachSkillsList' : 'learnSkillsList';
        displaySkills(userData[fieldName], containerId, fieldName);

        showSuccess('Skill removed successfully!');
        hideLoading();

    } catch (error) {
        console.error('Error removing skill:', error);
        alert('Error removing skill. Please try again.');
        hideLoading();
    }
}

// Save Availability
async function saveAvailability() {
    try {
        showLoading();

        const availability = {
            monday: document.getElementById('availableMonday').checked,
            tuesday: document.getElementById('availableTuesday').checked,
            wednesday: document.getElementById('availableWednesday').checked,
            thursday: document.getElementById('availableThursday').checked,
            friday: document.getElementById('availableFriday').checked,
            saturday: document.getElementById('availableSaturday').checked,
            sunday: document.getElementById('availableSunday').checked
        };

        await db.collection('users').doc(currentUser.uid).update({
            availability: availability
        });

        showSuccess('Availability updated successfully!');
        hideLoading();

    } catch (error) {
        console.error('Error saving availability:', error);
        alert('Error saving availability. Please try again.');
        hideLoading();
    }
}

// Save Bio
async function saveBio() {
    try {
        showLoading();

        const bio = document.getElementById('userBio').value.trim();

        await db.collection('users').doc(currentUser.uid).update({
            bio: bio
        });

        showSuccess('Bio updated successfully!');
        hideLoading();

    } catch (error) {
        console.error('Error saving bio:', error);
        alert('Error saving bio. Please try again.');
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