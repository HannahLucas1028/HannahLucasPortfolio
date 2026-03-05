import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyA44JCcIGO9xcIPd8UpqMegHy_6Txl3DHM",
    authDomain: "hannahlucasportfolio.firebaseapp.com",
    projectId: "hannahlucasportfolio",
    storageBucket: "hannahlucasportfolio.firebasestorage.app",
    messagingSenderId: "663067156333",
    appId: "1:663067156333:web:c50699e77e606953e20464"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function syncAppearance() {
    try {
        const docSnap = await getDoc(doc(db, "settings", "appearance"));
        if (docSnap.exists()) {
            console.log("SUCCESS:", docSnap.data());
        }
    } catch (e) {
        console.error("ERROR FETCHING SETTINGS:", e);
    }
}
syncAppearance();
