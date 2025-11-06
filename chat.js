// Chat Functionality

let currentUser = null;
let currentChatId = null;
let currentPartnerId = null;
let messagesListener = null;

document.addEventListener('DOMContentLoaded', async function() {
    try {
        currentUser = await checkAuth(true);
        await loadConversations();
    } catch (error) {
        console.error('Auth error:', error);
        return;
    }

    // Send message on button click
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);

    // Send message on Enter key
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Search conversations
    document.getElementById('searchConversations').addEventListener('input', function(e) {
        filterConversations(e.target.value);
    });
});

// Load user conversations
async function loadConversations() {
    try {
        showLoading();

        // Get all active matches
        const matchesSnapshot = await db.collection('matches')
            .where('participants', 'array-contains', currentUser.uid)
            .where('status', '==', 'active')
            .get();

        const container = document.getElementById('conversationsList');
        
        if (matchesSnapshot.empty) {
            container.innerHTML = `
                <div class="empty-conversations">
                    <div class="empty-icon">💬</div>
                    <p>No conversations yet</p>
                    <small>Accept match requests to start chatting</small>
                </div>
            `;
            hideLoading();
            return;
        }

        container.innerHTML = '';

        for (const doc of matchesSnapshot.docs) {
            const match = doc.data();
            const partnerId = match.participants.find(id => id !== currentUser.uid);
            
            // Get partner details
            const partnerDoc = await db.collection('users').doc(partnerId).get();
            if (!partnerDoc.exists) continue;
            
            const partner = partnerDoc.data();
            
            // Get last message
            const chatId = [currentUser.uid, partnerId].sort().join('_');
            const lastMessageDoc = await db.collection('chats').doc(chatId)
                .collection('messages')
                .orderBy('timestamp', 'desc')
                .limit(1)
                .get();

            let lastMessage = 'Start a conversation';
            let lastMessageTime = '';
            let unreadCount = 0;

            if (!lastMessageDoc.empty) {
                const msgData = lastMessageDoc.docs[0].data();
                lastMessage = msgData.text;
                if (lastMessage.length > 40) {
                    lastMessage = lastMessage.substring(0, 40) + '...';
                }
                lastMessageTime = formatMessageTime(msgData.timestamp);

                // Count unread messages
                const unreadSnapshot = await db.collection('chats').doc(chatId)
                    .collection('messages')
                    .where('senderId', '==', partnerId)
                    .where('read', '==', false)
                    .get();
                unreadCount = unreadSnapshot.size;
            }

            const conversationItem = createConversationItem(
                partnerId,
                partner.name,
                partner.photoURL,
                lastMessage,
                lastMessageTime,
                unreadCount,
                chatId
            );

            container.appendChild(conversationItem);
        }

        hideLoading();

    } catch (error) {
        console.error('Error loading conversations:', error);
        hideLoading();
    }
}

// Create conversation item
function createConversationItem(userId, name, photoURL, lastMessage, time, unreadCount, chatId) {
    const div = document.createElement('div');
    div.className = 'conversation-item';
    div.setAttribute('data-user-id', userId);
    div.setAttribute('data-chat-id', chatId);

    const avatarHTML = photoURL 
        ? `<img src="${photoURL}" alt="${name}">`
        : `<div class="avatar-placeholder">${name.charAt(0).toUpperCase()}</div>`;

    div.innerHTML = `
        <div class="conversation-avatar">
            ${avatarHTML}
        </div>
        <div class="conversation-info">
            <div class="conversation-header">
                <h4>${name}</h4>
                <span class="message-time">${time}</span>
            </div>
            <div class="conversation-preview">
                <p>${lastMessage}</p>
                ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ''}
            </div>
        </div>
    `;

    div.addEventListener('click', function() {
        openChat(userId, name, photoURL, chatId);
    });

    return div;
}

// Open chat with a user
async function openChat(userId, userName, photoURL, chatId) {
    try {
        // Update UI
        document.getElementById('chatWelcome').classList.add('hidden');
        document.getElementById('chatActive').classList.remove('hidden');

        // Update chat header
        document.getElementById('chatUserName').textContent = userName;
        const avatarImg = document.getElementById('chatAvatarImg');
        if (photoURL) {
            avatarImg.src = photoURL;
            avatarImg.style.display = 'block';
        } else {
            avatarImg.style.display = 'none';
        }

        // Highlight selected conversation
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeConv = document.querySelector(`[data-user-id="${userId}"]`);
        if (activeConv) {
            activeConv.classList.add('active');
        }

        // Set current chat
        currentPartnerId = userId;
        currentChatId = chatId;

        // Load messages
        await loadMessages(chatId);

        // Mark messages as read
        await markMessagesAsRead(chatId);

    } catch (error) {
        console.error('Error opening chat:', error);
    }
}

// Load messages with real-time listener
async function loadMessages(chatId) {
    // Remove previous listener
    if (messagesListener) {
        messagesListener();
    }

    const messagesArea = document.getElementById('messagesArea');
    messagesArea.innerHTML = '';

    // Set up real-time listener
    messagesListener = db.collection('chats').doc(chatId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const message = change.doc.data();
                    appendMessage(message);
                }
            });

            // Scroll to bottom
            messagesArea.scrollTop = messagesArea.scrollHeight;
        });
}

// Append message to chat
function appendMessage(message) {
    const messagesArea = document.getElementById('messagesArea');
    const isOwn = message.senderId === currentUser.uid;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'message-own' : 'message-other'}`;

    const time = message.timestamp ? formatMessageTime(message.timestamp) : 'Now';

    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${escapeHtml(message.text)}</p>
            <span class="message-timestamp">${time}</span>
        </div>
    `;

    messagesArea.appendChild(messageDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

// Send message
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();

    if (!text || !currentChatId) return;

    try {
        const chatRef = db.collection('chats').doc(currentChatId);
        
        // Create chat document if it doesn't exist
        await chatRef.set({
            participants: [currentUser.uid, currentPartnerId],
            lastMessage: text,
            lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Add message
        await chatRef.collection('messages').add({
            senderId: currentUser.uid,
            text: text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            read: false
        });

        // Clear input
        input.value = '';

        // Update conversation list
        updateConversationPreview(currentChatId, text);

    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message');
    }
}

// Mark messages as read
async function markMessagesAsRead(chatId) {
    try {
        const unreadMessages = await db.collection('chats').doc(chatId)
            .collection('messages')
            .where('senderId', '==', currentPartnerId)
            .where('read', '==', false)
            .get();

        const batch = db.batch();
        unreadMessages.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });

        await batch.commit();

        // Update unread badge
        const convItem = document.querySelector(`[data-chat-id="${chatId}"]`);
        if (convItem) {
            const badge = convItem.querySelector('.unread-badge');
            if (badge) {
                badge.remove();
            }
        }

    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

// Update conversation preview
function updateConversationPreview(chatId, text) {
    const convItem = document.querySelector(`[data-chat-id="${chatId}"]`);
    if (convItem) {
        const preview = convItem.querySelector('.conversation-preview p');
        if (preview) {
            preview.textContent = text.length > 40 ? text.substring(0, 40) + '...' : text;
        }
        const timeSpan = convItem.querySelector('.message-time');
        if (timeSpan) {
            timeSpan.textContent = 'Now';
        }
    }
}

// Filter conversations
function filterConversations(searchTerm) {
    const items = document.querySelectorAll('.conversation-item');
    const term = searchTerm.toLowerCase();

    items.forEach(item => {
        const name = item.querySelector('h4').textContent.toLowerCase();
        const message = item.querySelector('.conversation-preview p').textContent.toLowerCase();
        
        if (name.includes(term) || message.includes(term)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Format message time
function formatMessageTime(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60000) {
        return 'Now';
    }

    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes}m ago`;
    }

    // Less than 24 hours
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
    }

    // Less than 7 days
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days}d ago`;
    }

    // Format as date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Clean up listeners when leaving page
window.addEventListener('beforeunload', function() {
    if (messagesListener) {
        messagesListener();
    }
});