// Main JavaScript for Landing Page

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize theme
    initializeTheme();
    
    // Modal Elements
    const modal = document.getElementById('authModal');
    const closeBtn = document.querySelector('.close');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authTitle = document.getElementById('authTitle');

    // Navigation Elements
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    // Button Elements
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const heroGetStarted = document.getElementById('heroGetStarted');
    const heroLearnMore = document.getElementById('heroLearnMore');
    const ctaSignup = document.getElementById('ctaSignup');

    // Switch between login and signup
    const switchToSignup = document.getElementById('switchToSignup');
    const switchToLogin = document.getElementById('switchToLogin');

    // Form submit buttons
    const loginSubmit = document.getElementById('loginSubmit');
    const signupSubmit = document.getElementById('signupSubmit');
    const googleLogin = document.getElementById('googleLogin');
    const googleSignup = document.getElementById('googleSignup');

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', toggleTheme);

    // Counter animation
    animateCounters();

    // Hamburger menu toggle
    hamburger.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    });

    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                const target = document.querySelector(href);
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Active nav on scroll
    let sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // Open modal functions
    function openLoginModal() {
        modal.style.display = 'block';
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        authTitle.textContent = 'Welcome Back';
        document.querySelector('.modal-subtitle').textContent = 'Continue your learning journey';
    }

    function openSignupModal() {
        modal.style.display = 'block';
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        authTitle.textContent = 'Create Account';
        document.querySelector('.modal-subtitle').textContent = 'Start your learning journey today';
    }

    // Button click events
    loginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openLoginModal();
    });

    signupBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openSignupModal();
    });

    heroGetStarted.addEventListener('click', function() {
        openSignupModal();
    });

    ctaSignup.addEventListener('click', function() {
        openSignupModal();
    });

    heroLearnMore.addEventListener('click', function() {
        document.querySelector('#about').scrollIntoView({
            behavior: 'smooth'
        });
    });

    // Close modal
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Switch between forms
    switchToSignup.addEventListener('click', function(e) {
        e.preventDefault();
        openSignupModal();
    });

    switchToLogin.addEventListener('click', function(e) {
        e.preventDefault();
        openLoginModal();
    });

    // Login form submission
    loginSubmit.addEventListener('click', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            showError('Please fill in all fields');
            return;
        }

        await loginWithEmail(email, password);
    });

    // Signup form submission
    signupSubmit.addEventListener('click', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;

        if (!name || !email || !password) {
            showError('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            showError('Password must be at least 6 characters');
            return;
        }

        await signupWithEmail(name, email, password);
    });

    // Google authentication
    googleLogin.addEventListener('click', async function(e) {
        e.preventDefault();
        await signInWithGoogle();
    });

    googleSignup.addEventListener('click', async function(e) {
        e.preventDefault();
        await signInWithGoogle();
    });

    // Enter key support
    document.getElementById('loginPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginSubmit.click();
        }
    });

    document.getElementById('signupPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            signupSubmit.click();
        }
    });

    // Check if user is already logged in
    auth.onAuthStateChanged(user => {
        if (user && window.location.pathname.includes('index.html')) {
            const confirmRedirect = confirm('You are already logged in. Go to dashboard?');
            if (confirmRedirect) {
                window.location.href = 'dashboard.html';
            }
        }
    });
});

// Theme Functions
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    // Add animation effect
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        themeToggle.style.transform = 'rotate(0deg)';
    }, 300);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-icon');
    icon.textContent = theme === 'light' ? '🌙' : '☀️';
}

// Counter Animation
function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    const speed = 200;

    const observerOptions = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = +counter.getAttribute('data-target');
                const increment = target / speed;

                const updateCount = () => {
                    const count = +counter.innerText;
                    if (count < target) {
                        counter.innerText = Math.ceil(count + increment);
                        setTimeout(updateCount, 10);
                    } else {
                        counter.innerText = target.toLocaleString();
                    }
                };

                updateCount();
                observer.unobserve(counter);
            }
        });
    }, observerOptions);

    counters.forEach(counter => observer.observe(counter));
}