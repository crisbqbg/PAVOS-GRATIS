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
        this.submitBtn = document.getElementById('submitBtn');
        this.pavosMessage = document.getElementById('pavosMessage');
        
        // New UI elements
        this.emailValid = document.getElementById('emailValid');
        this.emailInvalid = document.getElementById('emailInvalid');
        this.strengthBars = [
            document.getElementById('strength1'),
            document.getElementById('strength2'),
            document.getElementById('strength3'),
            document.getElementById('strength4')
        ];
        this.strengthText = document.getElementById('strengthText');
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

    static getPasswordStrength(password) {
        if (!password) return { strength: 0, text: 'Enter at least 6 characters', color: 'bg-gray-700' };
        
        let strength = 0;
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        };
        
        // Basic length check
        if (password.length >= 6) strength++;
        if (password.length >= 8) strength++;
        if (checks.lowercase && checks.uppercase) strength++;
        if (checks.number) strength++;
        if (checks.special) strength++;
        
        const levels = [
            { min: 0, text: 'Very weak', color: 'bg-red-500' },
            { min: 1, text: 'Weak', color: 'bg-orange-500' },
            { min: 2, text: 'Fair', color: 'bg-yellow-500' },
            { min: 3, text: 'Good', color: 'bg-blue-500' },
            { min: 4, text: 'Strong', color: 'bg-green-500' },
            { min: 5, text: 'Very strong', color: 'bg-green-600' }
        ];
        
        const level = levels.reverse().find(l => strength >= l.min) || levels[0];
        return { strength: Math.min(strength, 4), ...level };
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
            // Ocultar mensaje de éxito y mostrar PAVOS
            this.elements.successMessage.classList.add('hidden');
            this.showPavosMessage();
        }, REDIRECT_DELAY);
    }

    showPavosMessage() {
        this.elements.pavosMessage.classList.remove('hidden');
        
        // Efectos de sonido simulados con vibración (si está disponible)
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }
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

    updateEmailValidation(isValid, hasValue) {
        if (!hasValue) {
            this.elements.emailValid.style.display = 'none';
            this.elements.emailInvalid.style.display = 'none';
            return;
        }
        
        if (isValid) {
            this.elements.emailValid.style.display = 'block';
            this.elements.emailInvalid.style.display = 'none';
        } else {
            this.elements.emailValid.style.display = 'none';
            this.elements.emailInvalid.style.display = 'block';
        }
    }

    updatePasswordStrength(strength, text, color) {
        this.elements.strengthBars.forEach((bar, index) => {
            if (index < strength) {
                bar.className = `h-1 flex-1 rounded-full ${color} transition-all duration-300`;
            } else {
                bar.className = 'h-1 flex-1 rounded-full bg-gray-700 transition-all duration-300';
            }
        });
        
        this.elements.strengthText.textContent = text;
        this.elements.strengthText.className = `text-xs ${strength >= 3 ? 'text-green-400' : strength >= 2 ? 'text-yellow-400' : 'text-gray-500'} transition-colors`;
    }

    setSubmitButtonState(disabled) {
        this.elements.submitBtn.disabled = disabled;
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
            this.uiManager.updateEmailValidation(validation.valid, email.length > 0);
        });

        // Password validation with strength indicator
        this.elements.passwordInput.addEventListener('input', () => {
            const password = this.elements.passwordInput.value;
            const strengthInfo = ValidationService.getPasswordStrength(password);
            
            this.uiManager.updatePasswordStrength(
                strengthInfo.strength,
                strengthInfo.text,
                strengthInfo.color
            );
            
            // Border color based on validation
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
            this.uiManager.showError('Please enter a valid email address with @ and domain (e.g., user@example.com)');
            this.elements.emailInput.focus();
            return;
        }

        // Validate password
        const passwordValidation = ValidationService.validatePassword(password);
        if (!passwordValidation.valid) {
            this.uiManager.showError('Your password must be at least 6 characters long for security');
            this.elements.passwordInput.focus();
            return;
        }

        // Validate reCAPTCHA
        const captchaValidation = ValidationService.validateCaptcha();
        if (!captchaValidation.valid) {
            this.uiManager.showError('Please verify you\'re human by completing the reCAPTCHA');
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
