import './style.css';
import { auth } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthService } from './auth.js';
import { router } from './router.js';
import { DashboardService } from './dashboard.js';
import { AdminService } from './admin.js';

document.addEventListener('DOMContentLoaded', () => {

    // Initialize Router
    router.init();

    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const btnLogout = document.getElementById('btn-logout');

    const registerForm = document.getElementById('register-form');

    let isAppInitialized = false;

    // auth state listener
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in
            if (AuthService.isAdmin(user)) {
                AdminService.init();
                router.navigate('admin');
            } else {
                DashboardService.init(user);
                router.navigate('dashboard');
            }
        } else {
            // User is signed out
            // Only force to login if not already on login/register
            const currentHash = window.location.hash.replace('#', '');
            if (currentHash !== 'register') {
                router.navigate('login');
            }
        }
        isAppInitialized = true;
    });

    // Login Form Submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const btnLogin = document.getElementById('btn-login');

        if (!username || !password) return;

        btnLogin.disabled = true;
        btnLogin.textContent = 'Authenticating...';

        const user = await AuthService.login(username, password);

        btnLogin.disabled = false;
        btnLogin.textContent = 'Login to Play';

        if (user) {
            loginForm.reset();
        }
    });

    // Register Form Submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fName = document.getElementById('reg-firstname').value.trim();
        const lName = document.getElementById('reg-lastname').value.trim();
        const mobile = document.getElementById('reg-mobile').value.trim();
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        const btnReg = document.getElementById('btn-register');

        if (!fName || !lName || !mobile || !username || !password) return;

        btnReg.disabled = true;
        btnReg.textContent = 'Registering...';

        const user = await AuthService.register(fName, lName, mobile, username, password);

        btnReg.disabled = false;
        btnReg.textContent = 'Register';

        if (user) {
            registerForm.reset();
            import('sweetalert2').then(({ default: Swal }) => {
                Swal.fire({
                    icon: 'success',
                    title: 'Registration Successful!',
                    text: 'Welcome to Senul Seettu.',
                    background: '#1e1e1e',
                    color: '#fff',
                    confirmButtonColor: '#d4af37'
                });
            });
        }
    });

    // Logout
    btnLogout.addEventListener('click', () => {
        AuthService.logout();
    });

    // Handle view specific initializations if re-entering route or refreshing components while in it
    window.addEventListener('routeChanged', (e) => {
        const path = e.detail.path;
        const user = auth.currentUser;
        if (user && path === 'dashboard' && !AuthService.isAdmin(user)) {
            DashboardService.loadDashboard();
        } else if (user && path === 'admin' && AuthService.isAdmin(user)) {
            // Admin initialized already, but we might want to refresh data
            AdminService.fetchTotalPlayers();
        }
    });

});
