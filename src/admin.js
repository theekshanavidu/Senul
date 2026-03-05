import { db } from './firebase.js';
import { ref, get, set, child, remove, update, onValue } from 'firebase/database';
import Swal from 'sweetalert2';
import html2canvas from 'html2canvas';

export const AdminService = {

    init: () => {
        AdminService.fetchTotalPlayers();
        AdminService.setupLiveResults();
        AdminService.setupEventListeners();
    },

    setupEventListeners: () => {
        // Form: Set Total Players
        document.getElementById('form-total-players').addEventListener('submit', async (e) => {
            e.preventDefault();
            const total = parseInt(document.getElementById('total-players').value);
            if (total < 2) return Swal.fire('Error', 'Must be at least 2', 'error');

            try {
                await set(ref(db, 'settings/totalPlayers'), total);
                Swal.fire({ title: 'Success', text: 'Total players updated', icon: 'success' });
            } catch (err) {
                Swal.fire('Error', err.message, 'error');
            }
        });

        // Form: Manual Override
        document.getElementById('form-override').addEventListener('submit', async (e) => {
            e.preventDefault();
            const uname = document.getElementById('override-username').value;
            const newNum = parseInt(document.getElementById('override-number').value);

            try {
                // Find User UID by username
                const usersSnap = await get(ref(db, 'users'));
                const usersObj = usersSnap.val() || {};
                let targetUid = null;
                let targetData = null;

                for (let uid in usersObj) {
                    if (usersObj[uid].username.toLowerCase() === uname.toLowerCase()) {
                        targetUid = uid;
                        targetData = usersObj[uid];
                        break;
                    }
                }

                if (!targetUid) {
                    return Swal.fire('Error', 'User not found in DB', 'error');
                }

                // Check if number is taken by someone else
                const takenSnap = await get(ref(db, `numbers_taken/${newNum}`));
                if (takenSnap.exists() && takenSnap.val() !== targetUid) {
                    return Swal.fire('Error', 'Number already taken by another user!', 'error');
                }

                // Remove user's previous number if any
                if (targetData.assignedNumber) {
                    await remove(ref(db, `numbers_taken/${targetData.assignedNumber}`));
                }

                // Set new number
                await set(ref(db, `users/${targetUid}/assignedNumber`), newNum);
                await set(ref(db, `numbers_taken/${newNum}`), targetUid);

                Swal.fire('Success', 'Number forcefully assigned!', 'success');
                e.target.reset();

            } catch (err) {
                Swal.fire('Error', err.message, 'error');
            }
        });

        // Form: Reset Password (Old form on page, let's keep it functional but adapt Modal below)
        const formResetDesktop = document.getElementById('form-reset-password');
        if (formResetDesktop) {
            formResetDesktop.addEventListener('submit', async (e) => {
                e.preventDefault();
                Swal.fire({
                    icon: 'info',
                    text: 'Please reset passwords by clicking "View Profile" next to the user in the Live Results Table.',
                    confirmButtonColor: '#d4af37'
                });
            });
        }

        // Export Results
        document.getElementById('btn-export').addEventListener('click', () => {
            const tableArea = document.getElementById('results-export-area');
            html2canvas(tableArea, { backgroundColor: '#0f0f0f' }).then(canvas => {
                const link = document.createElement('a');
                link.download = 'senul-seettu-results.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        });

        // Global Reset
        document.getElementById('btn-reset-all').addEventListener('click', async () => {
            const confirm = await Swal.fire({
                title: 'Are you sure?',
                text: "This will wipe all assigned numbers and reset settings!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d4af37',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, reset it!'
            });

            if (confirm.isConfirmed) {
                try {
                    // Update settings
                    await set(ref(db, 'settings/totalPlayers'), 10);
                    // Remove all numbers_taken
                    await remove(ref(db, 'numbers_taken'));

                    // Wipe from user profiles
                    const usersSnap = await get(ref(db, 'users'));
                    const usersObj = usersSnap.val() || {};
                    const updates = {};
                    for (let uid in usersObj) {
                        updates[`${uid}/assignedNumber`] = null;
                    }

                    if (Object.keys(updates).length > 0) {
                        await update(ref(db, 'users'), updates);
                    }

                    Swal.fire('Reset!', 'System has been reset to defaults.', 'success');
                } catch (error) {
                    Swal.fire('Error', error.message, 'error');
                }
            }
        });
    },

    fetchTotalPlayers: () => {
        onValue(ref(db, 'settings/totalPlayers'), (snap) => {
            if (snap.exists()) {
                document.getElementById('total-players').value = snap.val();
            }
        });
    },

    setupLiveResults: () => {
        const tbody = document.getElementById('results-tbody');
        if (!tbody) return;

        onValue(ref(db, 'users'), (snap) => {
            tbody.innerHTML = '';
            if (!snap.exists()) return;
            const users = snap.val();
            for (let uid in users) {
                const u = users[uid];
                // Show ALL users in the table, even without assigned number
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${u.firstName || ''} ${u.lastName || ''}</td>
                    <td>${u.username}</td>
                    <td><strong>${u.assignedNumber || 'None'}</strong></td>
                    <td>${u.mobile || 'N/A'}</td>
                    <td><button class="btn-outline btn-small view-prof-btn" data-uid="${uid}">View Profile</button></td>
                `;
                tbody.appendChild(tr);
            }

            // Attach listeners to newly created buttons
            const viewBtns = document.querySelectorAll('.view-prof-btn');
            viewBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const uid = btn.getAttribute('data-uid');
                    AdminService.showAdminProfileModal(users[uid], uid);
                });
            });
        });
    },

    showAdminProfileModal: (user, uid) => {
        // We will repurpose the existing profile modal or create a dynamic sweetalert one. 
        // A SweetAlert modal is much better for Admins to view and take actions on a user.
        const htmlContent = `
            <div style="text-align: left; padding: 10px;">
                <p><strong>Name:</strong> ${user.firstName || ''} ${user.lastName || ''}</p>
                <p><strong>Username:</strong> ${user.username || ''}</p>
                <p><strong>Email:</strong> ${user.email || ''}</p>
                <p><strong>Mobile:</strong> ${user.mobile || ''}</p>
                <p><strong>Assigned Number:</strong> ${user.assignedNumber || 'None'}</p>
                <hr style="border: 0.5px solid #444; margin: 15px 0;">
                <h4 style="color:var(--gold); margin-bottom: 10px;">Reset Password Note</h4>
                <p style="font-size: 0.9em; color:#aaa;">Client side apps cannot directly change user passwords without them logging in. Please reset via <strong>Firebase Console > Authentication -> ${user.email} -> Update Password</strong></p>
                <!-- Because there is no simple way to implement password resets on client-side JS without user's old password, we show exactly where to go -->
            </div>
        `;

        Swal.fire({
            title: 'User Profile & Actions',
            html: htmlContent,
            background: '#1e1e1e',
            color: '#fff',
            showCloseButton: true,
            confirmButtonText: 'Copy User Email to Clipboard',
            confirmButtonColor: '#d4af37'
        }).then((result) => {
            if (result.isConfirmed) {
                navigator.clipboard.writeText(user.email);
                Swal.fire('Copied!', 'Email copied to clipboard.', 'success');
            }
        });
    }

};
