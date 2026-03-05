# 🎰 Project Rebuild: Senul Seettu Premium (V2.0)

This document provides complete instructions for redesigning and rebuilding the "Senul Seettu" web application. The goal is to move from a simple session-based system to a secure, profile-based platform with a modern casino aesthetic.

---

## 1. Core Project Requirements
* **Number Generation:** Numbers must start from **2** (Number 1 is excluded).
* **User Profiles:** Every user must have a unique profile. One user = One assigned number.
* **Persistent Storage:** Once a number is assigned to a profile, it must remain linked to that user even if they refresh or log in from another device.
* **Admin Access:** Exclusive access to the Admin Panel is restricted to a specific Firebase UID: `lmnBm1FBQNgD6CJGAFuHRzaC6DD2`.
* **Credential Mapping:** Usernames must be converted to emails for Firebase Auth (e.g., `Senul` becomes `Senul@gmail.com`).

---

## 2. Technical Stack
* **Frontend:** HTML5, CSS3 (Tailwind CSS recommended), JavaScript (ES6+).
* **Backend:** Firebase Authentication & Firebase Realtime Database.
* **External Libraries:**
    * `canvas-confetti`: For victory animations.
    * `SweetAlert2`: For professional-looking alerts and modals.
    * `html2canvas`: For exporting results as PNG.

---

## 3. User Authentication Logic
The system uses a custom mapping for login to simplify the user experience while maintaining security.

### A. Login Process
1.  **Input:** User enters `Username` and `Password`.
2.  **Transformation:** Append `@gmail.com` to the username string before calling Firebase Auth.
    * *Logic:* `const email = username + "@gmail.com";`
3.  **Authentication:** Use `signInWithEmailAndPassword` or `createUserWithEmailAndPassword`.

### B. Authorization (Admin Level)
1.  Upon successful login, check the user's UID.
2.  **Admin Check:** `if (user.uid === "lmnBm1FBQNgD6CJGAFuHRzaC6DD2")` -> Grant access to the Admin Dashboard.
3.  Standard users are redirected to the "Card Selection" screen.

---

## 4. Gameplay & Number Logic
### A. Initial Number Setup
* The range of available numbers starts at **2**.
* The total count is determined by the `totalPlayers` value set in the Admin Panel.

### B. One-Time Assignment
1.  Check the database node `/users/${uid}/assignedNumber`.
2.  If the value exists: Display their existing number and skip the card selection.
3.  If it does not exist: Allow the user to click a card to trigger the `getRandomNumber()` function.

### C. Logic Snippet
```javascript
// Start from 2
function generateAvailablePool(totalPlayers, alreadyAssigned) {
    let pool = [];
    for (let i = 2; i <= totalPlayers; i++) {
        if (!alreadyAssigned.includes(i)) pool.push(i);
    }
    return pool;
}