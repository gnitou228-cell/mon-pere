// auth.js
document.addEventListener('DOMContentLoaded', () => {
    /* ==========================================================================
       MODALS LOGIC
       ========================================================================== */
    const modalTriggers = document.querySelectorAll('[data-modal]');
    const modalCloses = document.querySelectorAll('.modal-close');
    const modals = document.querySelectorAll('.modal-overlay');

    // Open Modal
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = trigger.getAttribute('data-modal');
            const targetModal = document.getElementById(`modal-${modalId}`);
            
            // Close all first (if switching)
            modals.forEach(m => m.classList.remove('active'));
            
            if (targetModal) {
                targetModal.classList.add('active');
            }
        });
    });

    // Close Modal
    modalCloses.forEach(close => {
        close.addEventListener('click', () => {
            close.closest('.modal-overlay').classList.remove('active');
        });
    });

    // Close on outside click
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Toggle Password Visibility
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            const icon = btn.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('ph-eye');
                icon.classList.add('ph-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('ph-eye-slash');
                icon.classList.add('ph-eye');
            }
        });
    });

    /* ==========================================================================
       TABS LOGIC
       ========================================================================== */
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            // Get parent container to scope tabs
            const tabsContainer = tab.closest('.modal-content');
            
            // Remove active from all tabs in this modal
            tabsContainer.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            tabsContainer.querySelectorAll('.auth-tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active to clicked tab
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
        });
    });

    /* ==========================================================================
       SUPABASE CONFIGURATION
       ========================================================================== */
    // REPLACE THESE WITH YOUR ACTUAL SUPABASE URL AND ANON KEY
    const SUPABASE_URL = 'https://VOTRE_PROJET.supabase.co';
    const SUPABASE_ANON_KEY = 'VOTRE_CLE_ANON';

    let supabase;
    
    // Initialize only if keys are present and different from placeholders
    if (SUPABASE_URL !== 'https://VOTRE_PROJET.supabase.co') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.warn("Supabase n'est pas configuré. Veuillez insérer vos clés dans auth.js.");
    }

    /* ==========================================================================
       OAUTH (SOCIAL LOGIN)
       ========================================================================== */
    const handleOAuthLogin = async (provider) => {
        if (!supabase) {
            alert(`Mode démo : Connexion ${provider} indisponible sans configuration.`);
            return;
        }
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider,
        });
        
        if (error) {
            alert(`Erreur avec ${provider} : ${error.message}`);
        }
    };

    const btnGoogleLogin = document.getElementById('btn-google-login');
    const btnGoogleSignup = document.getElementById('btn-google-signup');
    const btnFacebookLogin = document.getElementById('btn-facebook-login');
    const btnFacebookSignup = document.getElementById('btn-facebook-signup');

    if(btnGoogleLogin) btnGoogleLogin.addEventListener('click', () => handleOAuthLogin('google'));
    if(btnGoogleSignup) btnGoogleSignup.addEventListener('click', () => handleOAuthLogin('google'));
    if(btnFacebookLogin) btnFacebookLogin.addEventListener('click', () => handleOAuthLogin('facebook'));
    if(btnFacebookSignup) btnFacebookSignup.addEventListener('click', () => handleOAuthLogin('facebook'));

    /* ==========================================================================
       EMAIL FORMS LOGIC
       ========================================================================== */
    const loginForm = document.getElementById('form-login');
    const signupForm = document.getElementById('form-signup');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errorDiv = document.getElementById('login-error');
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            errorDiv.style.display = 'none';
            submitBtn.textContent = 'Connexion en cours...';
            submitBtn.disabled = true;

            if (!supabase) {
                errorDiv.textContent = "Configuration Supabase manquante (Mode démo).";
                errorDiv.style.display = 'block';
                submitBtn.textContent = 'Se connecter';
                submitBtn.disabled = false;
                return;
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                errorDiv.textContent = error.message;
                errorDiv.style.display = 'block';
                submitBtn.textContent = 'Se connecter';
                submitBtn.disabled = false;
            } else {
                window.location.href = 'dashboard.html';
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const firstname = document.getElementById('signup-firstname').value;
            const lastname = document.getElementById('signup-lastname').value;
            const email = document.getElementById('signup-email').value;
            const phoneCode = document.getElementById('signup-phone-code').value;
            const phoneNumber = document.getElementById('signup-phone-number').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-password-confirm').value;
            const termsChecked = document.getElementById('signup-terms').checked;
            
            const errorDiv = document.getElementById('signup-error');
            const successDiv = document.getElementById('signup-success');
            const submitBtn = signupForm.querySelector('button[type="submit"]');

            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';

            if (password !== confirmPassword) {
                errorDiv.textContent = "Les mots de passe ne correspondent pas.";
                errorDiv.style.display = 'block';
                return;
            }

            if (!termsChecked) {
                errorDiv.textContent = "Vous devez accepter les Conditions d'utilisation.";
                errorDiv.style.display = 'block';
                return;
            }

            submitBtn.textContent = 'Création en cours...';
            submitBtn.disabled = true;

            if (!supabase) {
                errorDiv.textContent = "Configuration Supabase manquante (Mode démo).";
                errorDiv.style.display = 'block';
                submitBtn.textContent = 'S\'inscrire';
                submitBtn.disabled = false;
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        first_name: firstname,
                        last_name: lastname,
                        whatsapp: phoneCode + phoneNumber
                    }
                }
            });

            if (error) {
                errorDiv.textContent = error.message;
                errorDiv.style.display = 'block';
                submitBtn.textContent = 'S\'inscrire';
                submitBtn.disabled = false;
            } else {
                successDiv.textContent = "Compte créé ! Veuillez vérifier votre email.";
                successDiv.style.display = 'block';
                signupForm.reset();
                submitBtn.textContent = 'S\'inscrire';
                submitBtn.disabled = false;
            }
        });
    }

    /* ==========================================================================
       PHONE (OTP) FORMS LOGIC
       ========================================================================== */
    // --- LOGIN PHONE ---
    const loginPhoneForm = document.getElementById('form-login-phone');
    const loginOtpForm = document.getElementById('form-login-otp');
    let currentLoginPhone = "";

    if(loginPhoneForm) {
        loginPhoneForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phoneCode = document.getElementById('login-phone-code').value;
            const phoneNumber = document.getElementById('login-phone-number').value;
            const errorDiv = document.getElementById('login-phone-error');
            const submitBtn = loginPhoneForm.querySelector('button[type="submit"]');

            currentLoginPhone = phoneCode + phoneNumber;
            errorDiv.style.display = 'none';
            submitBtn.textContent = 'Envoi...';
            submitBtn.disabled = true;

            if (!supabase) {
                errorDiv.textContent = "Configuration Supabase manquante (Mode démo).";
                errorDiv.style.display = 'block';
                submitBtn.textContent = 'Envoyer le code';
                submitBtn.disabled = false;
                
                // Simulate success in demo mode
                setTimeout(() => {
                    loginPhoneForm.style.display = 'none';
                    loginOtpForm.style.display = 'block';
                }, 1000);
                return;
            }

            const { data, error } = await supabase.auth.signInWithOtp({
                phone: currentLoginPhone
            });

            if (error) {
                errorDiv.textContent = error.message;
                errorDiv.style.display = 'block';
                submitBtn.textContent = 'Envoyer le code';
                submitBtn.disabled = false;
            } else {
                loginPhoneForm.style.display = 'none';
                loginOtpForm.style.display = 'block';
            }
        });
    }

    if(loginOtpForm) {
        loginOtpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const otpCode = document.getElementById('login-otp-code').value;
            const errorDiv = document.getElementById('login-otp-error');
            const submitBtn = loginOtpForm.querySelector('button[type="submit"]');

            errorDiv.style.display = 'none';
            submitBtn.textContent = 'Vérification...';
            submitBtn.disabled = true;

            if (!supabase) {
                errorDiv.textContent = "Configuration Supabase manquante (Mode démo).";
                errorDiv.style.display = 'block';
                submitBtn.textContent = 'Vérifier et se connecter';
                submitBtn.disabled = false;
                return;
            }

            const { data, error } = await supabase.auth.verifyOtp({
                phone: currentLoginPhone,
                token: otpCode,
                type: 'sms'
            });

            if (error) {
                errorDiv.textContent = error.message;
                errorDiv.style.display = 'block';
                submitBtn.textContent = 'Vérifier et se connecter';
                submitBtn.disabled = false;
            } else {
                window.location.href = 'dashboard.html';
            }
        });
    }

    // --- SIGNUP PHONE ---
    const signupPhoneForm = document.getElementById('form-signup-phone');
    const signupOtpForm = document.getElementById('form-signup-otp');
    let currentSignupPhone = "";

    if(signupPhoneForm) {
        signupPhoneForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const firstname = document.getElementById('signup-phone-firstname').value;
            const lastname = document.getElementById('signup-phone-lastname').value;
            const phoneCode = document.getElementById('signup-phone-code').value;
            const phoneNumber = document.getElementById('signup-phone-number').value;
            const termsChecked = document.getElementById('signup-phone-terms').checked;
            const errorDiv = document.getElementById('signup-phone-error');
            const submitBtn = signupPhoneForm.querySelector('button[type="submit"]');

            if (!termsChecked) {
                errorDiv.textContent = "Vous devez accepter les Conditions d'utilisation.";
                errorDiv.style.display = 'block';
                return;
            }

            currentSignupPhone = phoneCode + phoneNumber;
            errorDiv.style.display = 'none';
            submitBtn.textContent = 'Envoi...';
            submitBtn.disabled = true;

            if (!supabase) {
                errorDiv.textContent = "Configuration Supabase manquante (Mode démo).";
                errorDiv.style.display = 'block';
                submitBtn.textContent = 'Envoyer le code';
                submitBtn.disabled = false;
                
                // Simulate success in demo mode
                setTimeout(() => {
                    signupPhoneForm.style.display = 'none';
                    signupOtpForm.style.display = 'block';
                }, 1000);
                return;
            }

            const { data, error } = await supabase.auth.signInWithOtp({
                phone: currentSignupPhone,
                options: {
                    data: {
                        first_name: firstname,
                        last_name: lastname,
                        whatsapp: currentSignupPhone
                    }
                }
            });

            if (error) {
                errorDiv.textContent = error.message;
                errorDiv.style.display = 'block';
                submitBtn.textContent = 'Envoyer le code';
                submitBtn.disabled = false;
            } else {
                signupPhoneForm.style.display = 'none';
                signupOtpForm.style.display = 'block';
            }
        });
    }

    if(signupOtpForm) {
        signupOtpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const otpCode = document.getElementById('signup-otp-code').value;
            const errorDiv = document.getElementById('signup-otp-error');
            const submitBtn = signupOtpForm.querySelector('button[type="submit"]');

            errorDiv.style.display = 'none';
            submitBtn.textContent = 'Vérification...';
            submitBtn.disabled = true;

            if (!supabase) {
                errorDiv.textContent = "Configuration Supabase manquante (Mode démo).";
                errorDiv.style.display = 'block';
                submitBtn.textContent = 'Vérifier et créer le compte';
                submitBtn.disabled = false;
                return;
            }

            const { data, error } = await supabase.auth.verifyOtp({
                phone: currentSignupPhone,
                token: otpCode,
                type: 'sms'
            });

            if (error) {
                errorDiv.textContent = error.message;
                errorDiv.style.display = 'block';
                submitBtn.textContent = 'Vérifier et créer le compte';
                submitBtn.disabled = false;
            } else {
                window.location.href = 'dashboard.html';
            }
        });
    }

    /* ==========================================================================
       AUTH STATE LISTENER
       ========================================================================== */
    if (supabase) {
        supabase.auth.onAuthStateChange((event, session) => {
            if (session && !window.location.pathname.includes('dashboard.html')) {
                window.location.href = 'dashboard.html';
            }
        });
    }
});
