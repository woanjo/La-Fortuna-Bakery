
document.addEventListener('DOMContentLoaded', function () {
    // API address for local development.
    const API_BASE = 'http://127.0.0.1:5000';

    // --------------------------------------------------
    // 1. DYNAMIC FOOTER YEAR
    // --------------------------------------------------

    const yearSpan = document.getElementById('currentYear');

    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // --------------------------------------------------
    // 2. PASSWORD VISIBILITY TOGGLE
    // --------------------------------------------------

    function setupPasswordToggle(buttonId, inputId, iconId) {
        const toggleButton = document.getElementById(buttonId);
        const passwordInput = document.getElementById(inputId);
        const eyeIcon = document.getElementById(iconId);

        if (!toggleButton || !passwordInput || !eyeIcon) {
            return;
        }

        toggleButton.addEventListener('click', function () {
            const isPassword = passwordInput.type === 'password';

            passwordInput.type = isPassword ? 'text' : 'password';

            eyeIcon.classList.toggle('fa-eye', !isPassword);
            eyeIcon.classList.toggle('fa-eye-slash', isPassword);

            toggleButton.setAttribute(
                'aria-label',
                isPassword ? 'Hide password' : 'Show password'
            );
        });
    }

    setupPasswordToggle(
        'togglePasswordBtn',
        'password',
        'eyeIcon'
    );

    setupPasswordToggle(
        'toggleNewPassBtn',
        'newPass',
        'newPassEye'
    );

    // --------------------------------------------------
    // 3. ADMINISTRATOR LOGIN
    // --------------------------------------------------

    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberMeInput = document.getElementById('rememberMe');

    if (loginForm && loginBtn && usernameInput && passwordInput) {
        const originalLoginButton = loginBtn.innerHTML;

        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const username = usernameInput.value.trim();
            const password = passwordInput.value;
            const rememberMe = rememberMeInput
                ? rememberMeInput.checked
                : false;

            if (!username || !password) {
                showToast(
                    'Enter your username and password.',
                    'error'
                );
                return;
            }

            loginBtn.disabled = true;
            loginBtn.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';

            try {
                const response = await fetch(
                    `${API_BASE}/api/auth/admin/login`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                            username: username,
                            password: password,
                            remember_me: rememberMe
                        })
                    }
                );

                let result;

                try {
                    result = await response.json();
                } catch {
                    throw new Error(
                        'The server returned an invalid response.'
                    );
                }

                if (!response.ok) {
                    throw new Error(
                        result.message ||
                        result.error ||
                        'Administrator login failed.'
                    );
                }

                showToast(
                    'Welcome back, Administrator!',
                    'success'
                );

                // Redirect to the administrator dashboard.
                setTimeout(function () {
                    window.location.assign('dashboard.html');
                }, 500);

            } catch (error) {
                console.error(
                    'Administrator login error:',
                    error
                );

                let errorMessage = error.message;

                if (
                    error instanceof TypeError ||
                    errorMessage === 'Failed to fetch'
                ) {
                    errorMessage =
                        'Unable to connect to the server. Make sure the Flask backend is running.';
                }

                showToast(
                    errorMessage || 'Unable to log in. Please try again.',
                    'error'
                );

            } finally {
                loginBtn.disabled = false;
                loginBtn.innerHTML = originalLoginButton;
            }
        });
    }

    // --------------------------------------------------
    // 4. FORGOT PASSWORD
    // --------------------------------------------------
    // Password recovery is intentionally disabled.
    // The previous OTP process was only a frontend simulation.
    // A real implementation requires backend verification,
    // secure reset tokens, expiration, and email delivery.

    const resetModal = document.getElementById('resetModal');
    const openForgotModalBtn = document.getElementById('openForgotModalBtn');
    const closeResetModalBtn = document.getElementById('closeResetModalBtn');

    function closeResetModal() {
        if (resetModal) {
            resetModal.classList.add('hidden');
        }
    }

    if (openForgotModalBtn) {
        openForgotModalBtn.addEventListener('click', function (event) {
            event.preventDefault();

            showToast(
                'Password recovery is not available yet. Please contact your system administrator.',
                'info'
            );
        });
    }

    if (closeResetModalBtn) {
        closeResetModalBtn.addEventListener(
            'click',
            closeResetModal
        );
    }

    if (resetModal) {
        resetModal.addEventListener('click', function (event) {
            if (event.target === resetModal) {
                closeResetModal();
            }
        });
    }

    document.addEventListener('keydown', function (event) {
        if (
            event.key === 'Escape' &&
            resetModal &&
            !resetModal.classList.contains('hidden')
        ) {
            closeResetModal();
        }
    });

    // Prevent the old simulated reset forms from reporting success.
    const resetFormIds = [
        'emailForm',
        'otpForm',
        'newPasswordForm'
    ];

    resetFormIds.forEach(function (formId) {
        const form = document.getElementById(formId);

        if (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();

                showToast(
                    'Password recovery is not configured yet.',
                    'info'
                );
            });
        }
    });

    // --------------------------------------------------
    // 5. BACK TO PUBLIC WEBSITE
    // --------------------------------------------------

    const backToPublicLink = document.getElementById(
        'backToPublicLink'
    );

    if (backToPublicLink) {
        if (backToPublicLink.tagName.toLowerCase() === 'a') {
            backToPublicLink.href = '../User/index.html';
        } else {
            backToPublicLink.addEventListener('click', function () {
                window.location.assign('../User/index.html');
            });
        }
    }
});


// --------------------------------------------------
// 6. TOAST NOTIFICATION SYSTEM
// --------------------------------------------------

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');

    if (!container) {
        console.warn('Toast container was not found:', message);
        return;
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    let iconClass = 'fa-circle-info';

    if (type === 'success') {
        iconClass = 'fa-circle-check';
    } else if (type === 'error') {
        iconClass = 'fa-circle-exclamation';
    }

    const icon = document.createElement('i');
    icon.className = `fa-solid ${iconClass} toast-icon`;

    const text = document.createElement('span');
    text.className = 'toast-text';

    // textContent prevents HTML from being interpreted as markup.
    text.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(text);

    container.appendChild(toast);

    setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';

        setTimeout(function () {
            toast.remove();
        }, 300);
    }, 3500);
}
