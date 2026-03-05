import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db, ADMIN_UID } from "./firebase.js";
import { ref, set, get } from "firebase/database";
import Swal from 'sweetalert2';
import { router } from './router.js';

export const AuthService = {
    // Map username to username@gmail.com
    login: async (username, password) => {
        const email = `${username}@gmail.com`;
        try {
            // Try signing in
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Login Error',
                text: 'Invalid username or password. Please check your credentials.',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#d4af37'
            });
            return null;
        }
    },

    register: async (firstName, lastName, mobile, username, password) => {
        const email = `${username}@gmail.com`;
        try {
            const newCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = newCredential.user;

            // Create base user profile structure
            await set(ref(db, `users/${user.uid}`), {
                firstName: firstName,
                lastName: lastName,
                mobile: mobile,
                username: username,
                email: email,
                assignedNumber: null
            });

            return user;
        } catch (createError) {
            let msg = createError.message;
            if (createError.code === 'auth/email-already-in-use') {
                msg = 'Username is already taken. Please choose another one.';
            } else if (createError.code === 'auth/weak-password') {
                msg = 'Password should be at least 6 characters.';
            }

            Swal.fire({
                icon: 'error',
                title: 'Registration Failed',
                text: msg,
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#d4af37'
            });
            return null;
        }
    },

    logout: async () => {
        await signOut(auth);
        router.navigate('login');
    },

    isAdmin: (user) => {
        return user && user.uid === ADMIN_UID;
    }
};
