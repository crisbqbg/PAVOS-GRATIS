// Epic Games Login - Main Application Logic

// ==================== CONSTANTS ====================
const PLATFORM_NAMES = {
    facebook: 'Facebook',
    google: 'Google',
    playstation: 'PlayStation',
    xbox: 'Xbox',
    nintendo: 'Nintendo Switch'
};

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MIN_PASSWORD_LENGTH = 6;
const LOGIN_DELAY = 2000;
const REDIRECT_DELAY = 1500;

// ==================== DOM ELEMENTS ====================
class DOMElements {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.togglePassword = document.getElementById('togglePassword');
        this.eyeIcon = document.getElementById('eyeIcon');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.successMessage = document.getElementById('successMessage');
        this.successEmail = document.getElementById('successEmail');
        this.loading = document.getElementById('loading');
        this.socialButtons = document.querySelectorAll('.social-btn');
        this.rememberCheckbox = document.getElementById('remember');
    }
}

// ==================== VALIDATION ====================
class ValidationService {
    static validateEmail(email) {
        if (!email || !email.trim()) {
            return { valid: false, message: '❌ Email address is required' };
        }
        
        if (!EMAIL_PATTERN.test(email)) {
            return { 
                valid: false, 
                message: '❌ Please enter a valid email address (must contain @ and .)' 
            };
        }
        
        return { valid: true };
    }

    static validatePassword(password) {
        if (!password || !password.trim()) {
            return { valid: false, message: '❌ Password is required' };
        }
        
        if (password.length < MIN_PASSWORD_LENGTH) {
            return { 
                valid: false, 
                message: `❌ Password must be at least ${MIN_PASSWORD_LENGTH} characters long` 
            };
        }
        
        return { valid: true };
    }

    static validateCaptcha() {
        try {
            const captchaResponse = grecaptcha.getResponse();
            if (!captchaResponse) {
                return { 
                    valid: false, 
                    message: '❌ Please complete the reCAPTCHA verification' 
                };
            }
            return { valid: true };
        } catch (error) {
            console.error('reCAPTCHA validation error:', error);
            return { 
                valid: false, 
                message: '❌ reCAPTCHA verification failed. Please refresh the page.' 
            };
        }
    }

    static getBorderColor(value, isValid) {
        if (!value) return '#3A3A3E';
        return isValid ? '#00D563' : '#EF4444';
    }
}

// ==================== UI MANAGER ====================
class UIManager {
    constructor(elements) {
        this.elements = elements;
    }

    showError(message) {
        this.elements.errorText.textContent = message;
        this.elements.errorMessage.classList.remove('hidden', 'animate-shake');
        void this.elements.errorMessage.offsetWidth; // Trigger reflow
        this.elements.errorMessage.classList.add('animate-shake');
        this.elements.successMessage.classList.add('hidden');
    }

    hideError() {
        this.elements.errorMessage.classList.add('hidden');
    }

    showLoading() {
        this.elements.loginForm.classList.add('hidden');
        this.elements.loading.classList.remove('hidden');
        this.hideError();
    }

    hideLoading() {
        this.elements.loading.classList.add('hidden');
    }

    showSuccess(email) {
        this.hideLoading();
        this.elements.successMessage.classList.remove('hidden');
        this.elements.successEmail.textContent = email;
        
        setTimeout(() => {
            this.showRedirectMessage();
        }, REDIRECT_DELAY);
    }

    showRedirectMessage() {
        const redirectMsg = document.createElement('div');
        redirectMsg.className = 'text-sm mt-4 text-white opacity-80 animate-slide-up';
        redirectMsg.innerHTML = '🚀 Redirecting to your account...';
        this.elements.successMessage.appendChild(redirectMsg);
    }

    updateInputBorder(input, color) {
        input.style.borderColor = color;
    }

    toggleFormVisibility(show) {
        if (show) {
            this.elements.loginForm.classList.remove('hidden');
        } else {
            this.elements.loginForm.classList.add('hidden');
        }
    }
}

// ==================== PASSWORD MANAGER ====================
class PasswordManager {
    constructor(elements, uiManager) {
        this.elements = elements;
        this.uiManager = uiManager;
        this.isVisible = false;
    }

    toggle() {
        this.isVisible = !this.isVisible;
        const type = this.isVisible ? 'text' : 'password';
        this.elements.passwordInput.setAttribute('type', type);
        this.updateIcon();
    }

    updateIcon() {
        if (this.isVisible) {
            this.elements.eyeIcon.classList.remove('fa-eye');
            this.elements.eyeIcon.classList.add('fa-eye-slash');
        } else {
            this.elements.eyeIcon.classList.remove('fa-eye-slash');
            this.elements.eyeIcon.classList.add('fa-eye');
        }
    }
}

// ==================== AUTH SERVICE ====================
class AuthService {
    static async login(email, password, rememberMe) {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                // Store credentials if remember me is checked
                if (rememberMe) {
                    localStorage.setItem('epic_remember_email', email);
                } else {
                    localStorage.removeItem('epic_remember_email');
                }
                
                resolve({ success: true, user: { email } });
            }, LOGIN_DELAY);
        });
    }

    static async socialLogin(platform) {
        // Simulate social login redirect
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ 
                    success: false, 
                    message: `🎮 ${PLATFORM_NAMES[platform]} login would redirect to authentication...` 
                });
            }, 500);
        });
    }

    static getRememberedEmail() {
        return localStorage.getItem('epic_remember_email') || '';
    }
}

// ==================== MAIN APPLICATION ====================
class EpicGamesLogin {
    constructor() {
        this.elements = new DOMElements();
        this.uiManager = new UIManager(this.elements);
        this.passwordManager = new PasswordManager(this.elements, this.uiManager);
        this.init();
    }

    init() {
        this.loadRememberedEmail();
        this.attachEventListeners();
        this.setupRealTimeValidation();
    }

    loadRememberedEmail() {
        const rememberedEmail = AuthService.getRememberedEmail();
        if (rememberedEmail) {
            this.elements.emailInput.value = rememberedEmail;
            this.elements.rememberCheckbox.checked = true;
        }
    }

    attachEventListeners() {
        // Form submission
        this.elements.loginForm.addEventListener('submit', (e) => this.handleSubmit(e));

        // Password visibility toggle
        this.elements.togglePassword.addEventListener('click', () => {
            this.passwordManager.toggle();
        });

        // Social login buttons
        this.elements.socialButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleSocialLogin(e));
        });

        // Clear error on input
        [this.elements.emailInput, this.elements.passwordInput].forEach(input => {
            input.addEventListener('input', () => {
                this.uiManager.hideError();
            });
        });
    }

    setupRealTimeValidation() {
        // Email validation
        this.elements.emailInput.addEventListener('input', () => {
            const email = this.elements.emailInput.value.trim();
            const validation = ValidationService.validateEmail(email);
            const color = ValidationService.getBorderColor(email, validation.valid);
            this.uiManager.updateInputBorder(this.elements.emailInput, color);
        });

        // Password validation
        this.elements.passwordInput.addEventListener('input', () => {
            const password = this.elements.passwordInput.value;
            const validation = ValidationService.validatePassword(password);
            
            let color = '#3A3A3E';
            if (password.length > 0) {
                color = validation.valid ? '#00D563' : '#F59E0B';
            }
            
            this.uiManager.updateInputBorder(this.elements.passwordInput, color);
        });
    }

    async handleSubmit(e) {
        e.preventDefault();

        // Get form values
        const email = this.elements.emailInput.value.trim();
        const password = this.elements.passwordInput.value.trim();
        const rememberMe = this.elements.rememberCheckbox.checked;

        // Validate email
        const emailValidation = ValidationService.validateEmail(email);
        if (!emailValidation.valid) {
            this.uiManager.showError(emailValidation.message);
            this.elements.emailInput.focus();
            return;
        }

        // Validate password
        const passwordValidation = ValidationService.validatePassword(password);
        if (!passwordValidation.valid) {
            this.uiManager.showError(passwordValidation.message);
            this.elements.passwordInput.focus();
            return;
        }

        // Validate reCAPTCHA
        const captchaValidation = ValidationService.validateCaptcha();
        if (!captchaValidation.valid) {
            this.uiManager.showError(captchaValidation.message);
            return;
        }

        // Show loading state
        this.uiManager.showLoading();

        try {
            // Attempt login
            const result = await AuthService.login(email, password, rememberMe);
            
            if (result.success) {
                this.uiManager.showSuccess(email);
            } else {
                this.uiManager.hideLoading();
                this.uiManager.toggleFormVisibility(true);
                this.uiManager.showError('❌ Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.uiManager.hideLoading();
            this.uiManager.toggleFormVisibility(true);
            this.uiManager.showError('❌ An error occurred. Please try again later.');
        }
    }

    async handleSocialLogin(e) {
        e.preventDefault();
        const button = e.currentTarget;
        const platform = button.dataset.platform;

        if (!platform) return;

        try {
            const result = await AuthService.socialLogin(platform);
            
            if (result.message) {
                this.uiManager.showError(result.message);
                setTimeout(() => this.uiManager.hideError(), 3000);
            }
        } catch (error) {
            console.error('Social login error:', error);
            this.uiManager.showError('❌ Social login failed. Please try again.');
        }
    }
}

// ==================== INITIALIZE APP ====================
document.addEventListener('DOMContentLoaded', () => {
    new EpicGamesLogin();
    console.log('🎮 Epic Games Login initialized successfully!');
});
