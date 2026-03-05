import { db } from './firebase.js';
import { ref, get, set, child } from 'firebase/database';
import confetti from 'canvas-confetti';
import Swal from 'sweetalert2';

let currentUser = null;
let currentDbUser = null;

export const DashboardService = {
    init: (user) => {
        currentUser = user;
        DashboardService.loadDashboard();
    },

    loadDashboard: async () => {
        if (!currentUser) return;

        const dbRef = ref(db);
        try {
            // Get user data
            const userSnapshot = await get(child(dbRef, `users/${currentUser.uid}`));
            currentDbUser = userSnapshot.val();
            const userData = currentDbUser;

            // Render header
            const headerUsername = document.getElementById('header-username');
            let displayName = (userData && userData.firstName && userData.lastName) ? `${userData.firstName} ${userData.lastName}` : (userData?.username || currentUser.email);
            headerUsername.textContent = `${displayName}`;

            // Setup Profile Click
            headerUsername.onclick = () => DashboardService.showProfileModal(userData);

            // Setup Modal Close
            document.querySelector('.close-modal').onclick = () => {
                document.getElementById('profile-modal').classList.add('hidden');
            };

            // Check if already assigned
            if (userData && userData.assignedNumber) {
                DashboardService.showAssignedResult(userData.assignedNumber, displayName);
                return;
            }

            // Otherwise, prepare game
            const settingsSnap = await get(child(dbRef, 'settings'));
            const totalPlayers = settingsSnap.exists() ? settingsSnap.val().totalPlayers : 10;

            const takenSnap = await get(child(dbRef, 'numbers_taken'));
            const takenData = takenSnap.exists() ? takenSnap.val() : {};
            const alreadyAssigned = Object.keys(takenData).map(Number);

            const availablePool = DashboardService.generateAvailablePool(totalPlayers, alreadyAssigned);

            DashboardService.renderCardsGrid(availablePool);

        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    },

    generateAvailablePool: (totalPlayers, alreadyAssigned) => {
        let pool = [];
        for (let i = 2; i <= totalPlayers; i++) {
            if (!alreadyAssigned.includes(i)) pool.push(i);
        }
        return pool;
    },

    showAssignedResult: (number, displayName) => {
        document.getElementById('dashboard-status').classList.add('hidden');
        document.getElementById('cards-grid').classList.add('hidden');
        const assignedPanel = document.getElementById('assigned-result');
        assignedPanel.classList.remove('hidden');
        if (displayName) {
            document.getElementById('welcome-message').textContent = `Welcome, ${displayName}! Your Assigned Number`;
        } else {
            document.getElementById('welcome-message').textContent = `Your Assigned Number`;
        }
        document.getElementById('user-big-number').textContent = number;
    },

    showProfileModal: (userData) => {
        if (!userData) return;
        document.getElementById('prof-name').textContent = `${userData.firstName || ''} ${userData.lastName || ''}`;
        document.getElementById('prof-username').textContent = userData.username || '';
        document.getElementById('prof-mobile').textContent = userData.mobile || '';
        document.getElementById('prof-number').textContent = userData.assignedNumber || 'Not Assigned Yet';

        document.getElementById('profile-modal').classList.remove('hidden');
    },

    renderCardsGrid: (availablePool) => {
        const grid = document.getElementById('cards-grid');
        grid.innerHTML = '';
        document.getElementById('cards-grid').classList.remove('hidden');
        document.getElementById('dashboard-status').classList.remove('hidden');
        document.getElementById('assigned-result').classList.add('hidden');

        // Render remaining cards equal to the number of available slots
        // or total slots if we want them all visible
        // Usually, in selection games, you show cards for available spots
        const numCards = availablePool.length;

        if (numCards === 0) {
            grid.innerHTML = '<h3 style="color:var(--danger)">No numbers available!</h3>';
            return;
        }

        for (let i = 0; i < numCards; i++) {
            const card = document.createElement('div');
            card.className = 'flip-card';
            card.innerHTML = `
                <div class="flip-card-inner">
                    <div class="flip-card-front flip-card-face-unrevealed"></div>
                    <div class="flip-card-back flip-card-face-revealed"></div>
                </div>
            `;
            card.addEventListener('click', () => DashboardService.handleCardSelection(card, availablePool));
            grid.appendChild(card);
        }
    },

    handleCardSelection: async (cardElem, availablePool) => {
        // Prevent double click
        if (cardElem.classList.contains('flipped')) return;

        // Pick random number from available pool
        if (availablePool.length === 0) return;
        const randomIndex = Math.floor(Math.random() * availablePool.length);
        const selectedNumber = availablePool[randomIndex];

        // Proceed to save
        try {
            await set(ref(db, `users/${currentUser.uid}/assignedNumber`), selectedNumber);
            await set(ref(db, `numbers_taken/${selectedNumber}`), currentUser.uid);

            // Flip animation
            const backFace = cardElem.querySelector('.flip-card-back');
            backFace.textContent = selectedNumber;
            cardElem.classList.add('flipped');

            // Fire confetti
            DashboardService.fireConfetti();

            // After delay, show result screen
            setTimeout(() => {
                let dName = (currentDbUser && currentDbUser.firstName && currentDbUser.lastName)
                    ? `${currentDbUser.firstName} ${currentDbUser.lastName}`
                    : (currentDbUser?.username || currentUser.email);
                DashboardService.showAssignedResult(selectedNumber, dName);
            }, 2000);

        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Selection Error',
                text: 'Could not assign number, maybe it was just taken!',
                background: '#1e1e1e',
                color: '#fff'
            });
            DashboardService.loadDashboard(); // reload to get fresh pool
        }
    },

    fireConfetti: () => {
        var duration = 3 * 1000;
        var end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#d4af37', '#ffffff']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#d4af37', '#ffffff']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }
};
