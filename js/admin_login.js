document.addEventListener('DOMContentLoaded', function () {
    // 1. Dynamic Footer Year
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // 2. Main Login Password Visibility Toggle Logic
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');

    if (togglePasswordBtn && passwordInput && eyeIcon) {
        togglePasswordBtn.addEventListener('click', function () {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.classList.remove('fa-eye');
                eyeIcon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                eyeIcon.classList.remove('fa-eye-slash');
                eyeIcon.classList.add('fa-eye');
            }
        });
    }

    // 3. New Password Visibility Toggle Logic (Modal)
    const toggleNewPassBtn = document.getElementById('toggleNewPassBtn');
    const newPassInput = document.getElementById('newPass');
    const newPassEye = document.getElementById('newPassEye');

    if (toggleNewPassBtn && newPassInput && newPassEye) {
        toggleNewPassBtn.addEventListener('click', function () {
            if (newPassInput.type === 'password') {
                newPassInput.type = 'text';
                newPassEye.classList.remove('fa-eye');
                newPassEye.classList.add('fa-eye-slash');
            } else {
                newPassInput.type = 'password';
                newPassEye.classList.remove('fa-eye-slash');
                newPassEye.classList.add('fa-eye');
            }
        });
    }

    // 4. Modal Visibility & Multi-step Logic
    const resetModal = document.getElementById('resetModal');
    const openForgotModalBtn = document.getElementById('openForgotModalBtn');
    const closeResetModalBtn = document.getElementById('closeResetModalBtn');
    const resetEmailInput = document.getElementById('resetEmail');

    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');

    const dot1 = document.getElementById('dot1');
    const dot2 = document.getElementById('dot2');
    const dot3 = document.getElementById('dot3');

    function goToStep(stepNum) {
        step1.classList.remove('active');
        step2.classList.remove('active');
        step3.classList.remove('active');
        dot1.classList.remove('active');
        dot2.classList.remove('active');
        dot3.classList.remove('active');

        if (stepNum === 1) {
            step1.classList.add('active');
            dot1.classList.add('active');
            if (resetEmailInput) resetEmailInput.focus();
        } else if (stepNum === 2) {
            step2.classList.add('active');
            dot2.classList.add('active');
            const firstOtp = document.querySelector('.otp-box');
            if (firstOtp) firstOtp.focus();
        } else if (stepNum === 3) {
            step3.classList.add('active');
            dot3.classList.add('active');
            if (newPassInput) newPassInput.focus();
        }
    }

    function openModal() {
        if (resetModal) {
            resetModal.classList.remove('hidden');
            goToStep(1);
        }
    }

    function closeModal() {
        if (resetModal) {
            resetModal.classList.add('hidden');
        }
    }

    if (openForgotModalBtn) openForgotModalBtn.addEventListener('click', openModal);
    if (closeResetModalBtn) closeResetModalBtn.addEventListener('click', closeModal);

    if (resetModal) {
        resetModal.addEventListener('click', function (e) {
            if (e.target === resetModal) {
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && resetModal && !resetModal.classList.contains('hidden')) {
            closeModal();
        }
    });

    // 5. Form Submissions
    // Login Form
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');

    if (loginForm && loginBtn) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            loginBtn.disabled = true;
            loginBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...`;

            setTimeout(() => {
                loginBtn.disabled = false;
                loginBtn.innerHTML = `<span>Login</span> <i class="fa-solid fa-arrow-right-to-bracket btn-icon"></i>`;
                showToast('Welcome back, Administrator! Logging in...', 'success');
            }, 1200);
        });
    }

    // Step 1: Send Code
    const emailForm = document.getElementById('emailForm');
    const sendCodeBtn = document.getElementById('sendCodeBtn');
    const sentEmailDisplay = document.getElementById('sentEmailDisplay');

    if (emailForm) {
        emailForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const email = resetEmailInput.value;
            if (sentEmailDisplay) sentEmailDisplay.textContent = email;

            sendCodeBtn.disabled = true;
            sendCodeBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sending...`;

            setTimeout(() => {
                sendCodeBtn.disabled = false;
                sendCodeBtn.innerHTML = `<span>Send Verification Code</span> <i class="fa-regular fa-paper-plane"></i>`;
                showToast(`Verification code sent to ${email}`, 'success');
                goToStep(2);
            }, 1000);
        });
    }

    // OTP Box Navigation Logic
    const otpBoxes = document.querySelectorAll('.otp-box');
    otpBoxes.forEach((box, index) => {
        box.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < otpBoxes.length - 1) {
                otpBoxes[index + 1].focus();
            }
        });
        box.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpBoxes[index - 1].focus();
            }
        });
    });

    // Step 2: Verify OTP
    const otpForm = document.getElementById('otpForm');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');

    if (otpForm) {
        otpForm.addEventListener('submit', function (e) {
            e.preventDefault();
            verifyOtpBtn.disabled = true;
            verifyOtpBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Verifying...`;

            setTimeout(() => {
                verifyOtpBtn.disabled = false;
                verifyOtpBtn.innerHTML = `<span>Verify & Continue</span> <i class="fa-solid fa-arrow-right"></i>`;
                showToast('Code verified successfully!', 'success');
                goToStep(3);
            }, 1000);
        });
    }

    // Step 3: New Password Form
    const newPasswordForm = document.getElementById('newPasswordForm');
    const savePasswordBtn = document.getElementById('savePasswordBtn');
    const confirmPass = document.getElementById('confirmPass');

    if (newPasswordForm) {
        newPasswordForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (newPassInput.value !== confirmPass.value) {
                showToast('Passwords do not match!', 'error');
                return;
            }

            savePasswordBtn.disabled = true;
            savePasswordBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Updating...`;

            setTimeout(() => {
                savePasswordBtn.disabled = false;
                savePasswordBtn.innerHTML = `<span>Reset Password</span> <i class="fa-solid fa-circle-check"></i>`;
                closeModal();
                showToast('Password updated successfully! You can now log in.', 'success');
                emailForm.reset();
                otpForm.reset();
                newPasswordForm.reset();
            }, 1200);
        });
    }

    // Resend Code Link
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    if (resendOtpBtn) {
        resendOtpBtn.addEventListener('click', function () {
            showToast('A new 6-digit security code has been sent.', 'info');
        });
    }

    // Back to public site link
    const backToPublicLink = document.getElementById('backToPublicLink');
    if (backToPublicLink) {
        backToPublicLink.addEventListener('click', function (e) {
            e.preventDefault();
            showToast('Redirecting to Public Website...', 'info');
        });
    }
});

// Toast Notification System
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-exclamation';
    
    toast.innerHTML = `
        <i class="fa-solid ${iconClass} toast-icon"></i>
        <span class="toast-text">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}