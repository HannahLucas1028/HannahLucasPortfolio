import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, updateDoc, getDoc, addDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA44JCcIGO9xcIPd8UpqMegHy_6Txl3DHM",
    authDomain: "hannahlucasportfolio.firebaseapp.com",
    projectId: "hannahlucasportfolio",
    storageBucket: "hannahlucasportfolio.firebasestorage.app",
    messagingSenderId: "663067156333",
    appId: "1:663067156333:web:c50699e77e606953e20464"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM Elements
const authContainer = document.getElementById('auth-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginBtn = document.getElementById('login-google-btn');
const logoutBtn = document.getElementById('logout-btn');
const authError = document.getElementById('auth-error');
const userEmailDisplay = document.getElementById('user-email-display');

// The Authorized Admin Email
const ADMIN_EMAIL = "2455hannah@gmail.com";

// --- Authentication UI Logic ---

const provider = new GoogleAuthProvider();

loginBtn.addEventListener('click', async () => {
    try {
        authError.style.display = 'none';
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        if (user.email !== ADMIN_EMAIL) {
            await signOut(auth);
            throw new Error(`Unauthorized Account: ${user.email}. Access Denied.`);
        }

    } catch (error) {
        console.error("Login Error:", error);
        authError.textContent = error.message;
        authError.style.display = 'block';
    }
});

logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
});

// Listen for Auth State Changes
onAuthStateChanged(auth, (user) => {
    if (user && user.email === ADMIN_EMAIL) {
        // User is signed in and authorized.
        authContainer.style.display = 'none';
        dashboardContainer.style.display = 'flex';
        userEmailDisplay.textContent = user.email;
        loadDashboardData();
    } else {
        // No user is signed in, or unauthorized user.
        authContainer.style.display = 'flex';
        dashboardContainer.style.display = 'none';
        userEmailDisplay.textContent = "";
        if (user && user.email !== ADMIN_EMAIL) {
            authError.textContent = "Unauthorized access. Please use the correct admin account.";
            authError.style.display = 'block';
        }
    }
});

// --- Navigation Logic ---
const navItems = document.querySelectorAll('.admin-nav-item');
const panels = document.querySelectorAll('.admin-panel');
const panelTitle = document.getElementById('panel-title');

// --- Cursor Logic ---
const cursorAura = document.getElementById('cursor-aura');

if (cursorAura) {
    document.addEventListener('mousemove', (e) => {
        requestAnimationFrame(() => {
            cursorAura.style.left = `${e.clientX}px`;
            cursorAura.style.top = `${e.clientY}px`;
        });
    });

    const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, .admin-nav-item');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorAura.classList.add('hover-active');
        });
        el.addEventListener('mouseleave', () => {
            cursorAura.classList.remove('hover-active');
        });
    });
}

async function syncAppearance() {
    try {
        const docSnap = await getDoc(doc(db, "settings", "appearance"));
        const accentGlowSelector = document.querySelector(':root');
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.accentColor) {
                accentGlowSelector.style.setProperty('--accent-glow', data.accentColor);
            }
            if (data.cursorStyle) {
                document.body.className = `cursor-${data.cursorStyle}`;
            }
            if (data.colorCursor) {
                accentGlowSelector.style.setProperty('--cursor-color', data.colorCursor);
            }
        } else {
            // Feature explicitly requested by User: Magenta Heart Cursor default
            accentGlowSelector.style.setProperty('--cursor-color', '#bb0099');
            document.body.classList.remove('cursor-default', 'cursor-dot', 'cursor-ring', 'cursor-glow');
            document.body.classList.add('cursor-heart');
        }
    } catch (e) {
        console.error("Error syncing appearance:", e);
    }
}

syncAppearance();

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();

        // Remove active class from all nav items and panels
        navItems.forEach(n => n.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        // Add active class to clicked item and target panel
        item.classList.add('active');
        const targetId = item.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');

        // Update Title
        panelTitle.textContent = item.textContent;
    });
});

// --- Data Loading Logic ---
async function loadDashboardData() {
    console.log("Loading dashboard data...");

    // Load Stats & Data
    try {
        const chaptersSnap = await getDocs(collection(db, "chapters"));
        document.getElementById('stat-chapters').textContent = chaptersSnap.size;

        const receiptsSnap = await getDocs(collection(db, "receipts"));
        document.getElementById('stat-receipts').textContent = receiptsSnap.size;

        renderChaptersTable(chaptersSnap);
        renderReceiptsTable(receiptsSnap);

        // Also load Media Gallery and Messages
        loadMediaGallery();

        const messagesSnap = await getDocs(collection(db, "messages"));
        renderMessagesTable(messagesSnap);

    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

// --- Render Tables ---
function renderChaptersTable(snapshot) {
    const tbody = document.getElementById('chapters-table-body');
    tbody.innerHTML = '';

    if (snapshot.empty) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-secondary">No chapters found.</td></tr>';
        return;
    }

    // Sort by id exactly as in app.js
    const chapters = [];
    snapshot.forEach(doc => chapters.push({ id: doc.id, ...doc.data() }));
    chapters.sort((a, b) => parseInt(a.id) - parseInt(b.id));

    chapters.forEach(chapter => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${chapter.id}</td>
            <td><strong>${chapter.headline}</strong></td>
            <td class="action-cell">
                <button class="cyber-button btn-sm" onclick="editChapter('${chapter.id}')">Edit</button>
                <button class="primary-btn btn-sm btn-danger" onclick="deleteDocument('chapters', '${chapter.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderReceiptsTable(snapshot) {
    const tbody = document.getElementById('receipts-table-body');
    tbody.innerHTML = '';

    if (snapshot.empty) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-secondary">No receipts found.</td></tr>';
        return;
    }

    snapshot.forEach(doc => {
        const receipt = doc.data();
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span style="font-size:0.7rem; padding: 0.2rem 0.5rem; background: rgba(255,255,255,0.1); border-radius: 4px;">${receipt.category || 'N/A'}</span></td>
            <td>${receipt.title}</td>
            <td>${receipt.stamp || 'N/A'}</td>
            <td class="action-cell">
                <button class="cyber-button btn-sm" onclick="editReceipt('${doc.id}')">Edit</button>
                <button class="primary-btn btn-sm btn-danger" onclick="deleteDocument('receipts', '${doc.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderMessagesTable(snapshot) {
    const tbody = document.getElementById('messages-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (snapshot.empty) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-secondary">No messages found.</td></tr>';
        return;
    }

    // Sort by timestamp descending
    const messages = [];
    snapshot.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));
    messages.sort((a, b) => b.timestamp - a.timestamp);

    messages.forEach(msg => {
        const dateStr = msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleDateString() : 'N/A';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-size: 0.8rem; color: var(--text-secondary);">${dateStr}</td>
            <td><strong>${msg.name}</strong><br><span style="font-size:0.8rem; color:var(--text-secondary);">${msg.org || ''}</span><br><a href="mailto:${msg.email}" style="font-size:0.8rem; color:var(--accent-glow);">${msg.email}</a></td>
            <td><span style="font-size:0.7rem; padding: 0.2rem 0.5rem; background: rgba(255,255,255,0.1); border-radius: 4px;">${msg.purpose || 'N/A'}</span></td>
            <td style="max-width:300px;">
                <p style="font-size: 0.9rem; margin-bottom: 0.5rem;">${msg.message}</p>
                ${msg.deadline ? `<p style="font-size: 0.8rem; color: var(--accent-glow);">Deadline: ${msg.deadline}</p>` : ''}
                <button class="primary-btn btn-danger btn-sm mt-sm" onclick="deleteDocument('messages', '${msg.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- Modal & Form Logic ---

window.toggleModuleFields = () => {
    const type = document.getElementById('chapter-module-type').value;
    document.getElementById('module-standard-fields').classList.toggle('hidden', type !== 'standard');
    document.getElementById('module-embed-fields').classList.toggle('hidden', type !== 'embed');
    document.getElementById('module-gallery-fields').classList.toggle('hidden', type !== 'gallery');
};

window.openChapterModal = () => {
    document.getElementById('chapter-form').reset();
    document.getElementById('chapter-id').value = '';
    document.getElementById('chapter-order').removeAttribute('readonly');
    document.getElementById('chapter-module-type').value = 'standard';
    toggleModuleFields();
    document.getElementById('chapter-modal-title').textContent = 'Add Chapter';
    document.getElementById('chapter-modal').style.display = 'flex';
};

window.openReceiptModal = () => {
    document.getElementById('receipt-form').reset();
    document.getElementById('receipt-id').value = '';
    document.getElementById('receipt-modal-title').textContent = 'Add Receipt';
    document.getElementById('receipt-modal').style.display = 'flex';
};

window.closeModal = (modalId) => {
    document.getElementById(modalId).style.display = 'none';
};

window.editChapter = async (id) => {
    try {
        const docRef = doc(db, 'chapters', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('chapter-id').value = id;
            document.getElementById('chapter-order').value = id;
            document.getElementById('chapter-order').setAttribute('readonly', true); // Prevent changing ID of existing doc
            document.getElementById('chapter-headline').value = data.headline || '';
            document.getElementById('chapter-body').value = data.body || '';

            document.getElementById('chapter-module-type').value = data.moduleType || 'standard';
            toggleModuleFields();

            document.getElementById('chapter-media').value = data.mediaUrl || '';
            document.getElementById('chapter-media-type').value = data.mediaType || 'video';
            document.getElementById('chapter-pullquote').value = data.pullquote || '';

            document.getElementById('chapter-embed-code').value = data.embedCode || '';
            document.getElementById('chapter-gallery-links').value = data.galleryLinks || '';

            document.getElementById('chapter-modal-title').textContent = 'Edit Chapter';
            document.getElementById('chapter-modal').style.display = 'flex';
        }
    } catch (e) {
        console.error("Error fetching chapter:", e);
    }
};

window.editReceipt = async (id) => {
    try {
        const docRef = doc(db, 'receipts', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('receipt-id').value = id;
            document.getElementById('receipt-category').value = data.category || '';
            document.getElementById('receipt-stamp').value = data.stamp || '';
            document.getElementById('receipt-title').value = data.title || '';
            document.getElementById('receipt-desc').value = data.desc || '';
            document.getElementById('receipt-link').value = data.link || '';

            document.getElementById('receipt-modal-title').textContent = 'Edit Receipt';
            document.getElementById('receipt-modal').style.display = 'flex';
        }
    } catch (e) {
        console.error("Error fetching receipt:", e);
    }
};

// --- Form Submit Handlers ---

document.getElementById('chapter-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('chapter-id').value;
    const orderId = document.getElementById('chapter-order').value;
    const docId = id || orderId;

    const chapterData = {
        headline: document.getElementById('chapter-headline').value,
        body: document.getElementById('chapter-body').value,
        moduleType: document.getElementById('chapter-module-type').value,
        mediaUrl: document.getElementById('chapter-media').value,
        mediaType: document.getElementById('chapter-media-type').value,
        pullquote: document.getElementById('chapter-pullquote').value,
        embedCode: document.getElementById('chapter-embed-code').value,
        galleryLinks: document.getElementById('chapter-gallery-links').value
    };

    try {
        await setDoc(doc(db, 'chapters', docId), chapterData);
        alert("Chapter saved successfully!");
        window.closeModal('chapter-modal');
        loadDashboardData();
    } catch (error) {
        console.error("Error saving chapter:", error);
        alert("Failed to save chapter.");
    }
});

document.getElementById('receipt-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('receipt-id').value;

    const receiptData = {
        category: document.getElementById('receipt-category').value,
        stamp: document.getElementById('receipt-stamp').value,
        title: document.getElementById('receipt-title').value,
        desc: document.getElementById('receipt-desc').value,
        link: document.getElementById('receipt-link').value
    };

    try {
        if (id) {
            await setDoc(doc(db, 'receipts', id), receiptData);
        } else {
            await addDoc(collection(db, 'receipts'), receiptData);
        }
        alert("Receipt saved successfully!");
        window.closeModal('receipt-modal');
        loadDashboardData();
    } catch (error) {
        console.error("Error saving receipt:", error);
        alert("Failed to save receipt.");
    }
});

// --- Basic Delete Operation ---
window.deleteDocument = async (collectionName, id) => {
    if (confirm(`Are you sure you want to delete ${collectionName} ID: ${id}?`)) {
        try {
            await deleteDoc(doc(db, collectionName, id));
            alert("Deleted successfully.");
            loadDashboardData(); // Refresh
        } catch (error) {
            console.error("Error deleting document:", error);
            alert("Error deleting document. Check console.");
        }
    }
}

// --- Media Upload Logic ---
const uploadInput = document.getElementById('media-upload-input');
const uploadStatus = document.getElementById('upload-status');
const progressBar = document.getElementById('upload-progress-bar');
const progressContainer = document.getElementById('upload-progress-container');
const gallery = document.getElementById('media-gallery');

uploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create a storage reference
    const storageRef = ref(storage, 'media/' + file.name);

    // Upload the file and metadata
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Show progress
    progressContainer.style.display = 'block';
    uploadStatus.textContent = 'Uploading: ' + file.name;

    uploadTask.on('state_changed',
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressBar.style.width = progress + '%';
        },
        (error) => {
            console.error("Upload failed", error);
            uploadStatus.textContent = "Upload failed. Try again.";
            uploadStatus.style.color = '#ff4444';
        },
        async () => {
            uploadStatus.textContent = 'Upload complete! Finding URL...';
            progressBar.style.width = '100%';

            try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                uploadStatus.innerHTML = `Success! URL: <a href="${downloadURL}" target="_blank" style="color:var(--accent-glow);word-break:break-all;">${downloadURL}</a>`;

                // Refresh gallery
                loadMediaGallery();

            } catch (err) {
                console.error(err);
                uploadStatus.textContent = "Error getting URL.";
            }

            // Hide progress bar after a bit
            setTimeout(() => {
                progressContainer.style.display = 'none';
                progressBar.style.width = '0%';
            }, 3000);
        }
    );
});

// --- Media Gallery ---
async function loadMediaGallery() {
    gallery.innerHTML = '<p class="text-secondary text-sm">Loading media...</p>';

    try {
        const listRef = ref(storage, 'media');
        const res = await listAll(listRef);

        gallery.innerHTML = '';

        if (res.items.length === 0) {
            gallery.innerHTML = '<p class="text-secondary text-sm">No media found.</p>';
            return;
        }

        res.items.forEach(async (itemRef) => {
            const url = await getDownloadURL(itemRef);

            const card = document.createElement('div');
            card.className = 'glass-panel p-sm';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.gap = '0.5rem';

            // Check if Image or Video by extension roughly
            const nameLower = itemRef.name.toLowerCase();
            let previewHtml = '';
            if (nameLower.endsWith('.mp4') || nameLower.endsWith('.webm') || nameLower.endsWith('.ogg')) {
                previewHtml = `<video src="${url}" controls style="width:100%; height:150px; object-fit:cover; border-radius:4px;"></video>`;
            } else if (nameLower.endsWith('.mp3') || nameLower.endsWith('.wav')) {
                previewHtml = `<audio src="${url}" controls style="width:100%; margin-top:1rem;"></audio>`;
            } else {
                // Default to image preview
                previewHtml = `<img src="${url}" style="width:100%; height:150px; object-fit:cover; border-radius:4px;" alt="${itemRef.name}" loading="lazy">`;
            }

            card.innerHTML = `
                ${previewHtml}
                <p class="text-sm text-secondary" style="word-break: break-all; font-size: 0.7rem;">${itemRef.name}</p>
                <div style="display:flex; gap:0.5rem; margin-top:auto;">
                    <button class="cyber-button btn-sm" onclick="navigator.clipboard.writeText('${url}'); alert('Saved to clipboard!');">Copy URL</button>
                    <button class="primary-btn btn-danger btn-sm" onclick="deleteMediaFile('${itemRef.name}')">Delete</button>
                </div>
            `;
            gallery.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading gallery", error);
        gallery.innerHTML = '<p class="text-secondary text-sm" style="color:#ff4444;">Error loading media.</p>';
    }
}

window.deleteMediaFile = async (fileName) => {
    if (confirm(`Delete ${fileName} forever?`)) {
        try {
            const desRef = ref(storage, 'media/' + fileName);
            await deleteObject(desRef);
            alert("Deleted file.");
            loadMediaGallery();
        } catch (e) {
            console.error(e);
            alert("Delete failed.");
        }
    }
}

// Ensure the gallery loads initially when we render the dashboard
const originalLoadDashboardData = loadDashboardData;
loadDashboardData = async function () {
    await originalLoadDashboardData();
    loadMediaGallery();
    loadAppearanceSettings();
}

// --- Appearance Settings Logic ---
async function loadAppearanceSettings() {
    try {
        const docRef = doc(db, 'settings', 'appearance');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

            if (data.colorBg) document.getElementById('color-bg').value = data.colorBg;
            if (data.colorSurface) document.getElementById('color-surface').value = data.colorSurface;
            if (data.colorAccent) document.getElementById('color-accent').value = data.colorAccent;
            if (data.colorTextPrimary) document.getElementById('color-text-primary').value = data.colorTextPrimary;
            if (data.colorTextSecondary) document.getElementById('color-text-secondary').value = data.colorTextSecondary;

            if (data.fontHeading) document.getElementById('font-heading').value = data.fontHeading;
            if (data.fontBody) document.getElementById('font-body').value = data.fontBody;
            if (data.cursorStyle) document.getElementById('cursor-style').value = data.cursorStyle;
            if (data.colorCursor) document.getElementById('color-cursor').value = data.colorCursor;

            updateHexLabels();
            applyAppearanceToAdmin(data);
        }
    } catch (error) {
        console.error("Error loading appearance settings:", error);
    }
}

function updateHexLabels() {
    document.getElementById('color-bg-hex').textContent = document.getElementById('color-bg').value;
    document.getElementById('color-surface-hex').textContent = document.getElementById('color-surface').value;
    document.getElementById('color-accent-hex').textContent = document.getElementById('color-accent').value;
    document.getElementById('color-text-primary-hex').textContent = document.getElementById('color-text-primary').value;
    document.getElementById('color-text-secondary-hex').textContent = document.getElementById('color-text-secondary').value;
    document.getElementById('color-cursor-hex').textContent = document.getElementById('color-cursor').value;
}

// Event listeners for color pickers to update hex labels dynamically
['color-bg', 'color-surface', 'color-accent', 'color-text-primary', 'color-text-secondary', 'color-cursor'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateHexLabels);
});

document.getElementById('save-appearance-btn').addEventListener('click', async () => {
    const btn = document.getElementById('save-appearance-btn');
    btn.textContent = 'Saving...';
    btn.disabled = true;

    const appearanceData = {
        colorBg: document.getElementById('color-bg').value,
        colorSurface: document.getElementById('color-surface').value,
        colorAccent: document.getElementById('color-accent').value,
        colorTextPrimary: document.getElementById('color-text-primary').value,
        colorTextSecondary: document.getElementById('color-text-secondary').value,
        fontHeading: document.getElementById('font-heading').value,
        fontBody: document.getElementById('font-body').value,
        cursorStyle: document.getElementById('cursor-style').value,
        colorCursor: document.getElementById('color-cursor').value
    };

    try {
        await setDoc(doc(db, 'settings', 'appearance'), appearanceData, { merge: true });
        btn.textContent = 'Saved!';
        applyAppearanceToAdmin(appearanceData);
        setTimeout(() => {
            btn.textContent = 'Save Changes';
            btn.disabled = false;
        }, 2000);
    } catch (error) {
        console.error("Error saving appearance:", error);
        btn.textContent = 'Error';
        setTimeout(() => {
            btn.textContent = 'Save Changes';
            btn.disabled = false;
        }, 2000);
    }
});

// Helper to apply colors immediately to the admin dashboard for preview
function applyAppearanceToAdmin(data) {
    const root = document.documentElement;

    // Convert hex to rgb string for our rgba() vars
    const hexToRgbStr = (hex) => {
        if (!hex) return '255, 255, 255';
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const num = parseInt(hex, 16);
        return `${num >> 16}, ${num >> 8 & 255}, ${num & 255}`;
    };

    if (data.colorBg) {
        root.style.setProperty('--bg-color', data.colorBg);
        root.style.setProperty('--bg-color-rgb', hexToRgbStr(data.colorBg));
    }
    if (data.colorSurface) {
        root.style.setProperty('--bg-surface', `rgba(${hexToRgbStr(data.colorSurface)}, 0.85)`);
        root.style.setProperty('--bg-surface-rgb', hexToRgbStr(data.colorSurface));
    }
    if (data.colorAccent) {
        root.style.setProperty('--accent-glow', data.colorAccent);
        root.style.setProperty('--accent-glow-rgb', hexToRgbStr(data.colorAccent));
    }
    if (data.colorTextPrimary) {
        root.style.setProperty('--text-primary', data.colorTextPrimary);
        root.style.setProperty('--text-primary-rgb', hexToRgbStr(data.colorTextPrimary));
    }
    if (data.colorTextSecondary) {
        root.style.setProperty('--text-secondary', data.colorTextSecondary);
        root.style.setProperty('--text-secondary-rgb', hexToRgbStr(data.colorTextSecondary));
    }
    if (data.colorCursor) {
        root.style.setProperty('--cursor-color', data.colorCursor);
        root.style.setProperty('--cursor-color-rgb', hexToRgbStr(data.colorCursor));
    }

    if (data.fontHeading) {
        root.style.setProperty('--font-heading', data.fontHeading);
    }
    if (data.fontBody) {
        root.style.setProperty('--font-body', data.fontBody);
    }
    if (data.cursorStyle) {
        root.style.setProperty('--cursor-style', data.cursorStyle);
        // Clear old cursor classes and add the new one
        document.body.classList.remove('cursor-dot', 'cursor-ring', 'cursor-glow', 'cursor-heart');
        document.body.classList.add(`cursor-${data.cursorStyle}`);
    }
}



// --- Custom Cursor Admin Init ---
const cursorAura = document.querySelector('.cursor-aura');

function initAdminCursor() {
    // Only on non-touch devices
    if (window.matchMedia("(pointer: fine)").matches && cursorAura) {
        document.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => {
                cursorAura.style.left = e.clientX + 'px';
                cursorAura.style.top = e.clientY + 'px';
            });
        });

        // Hover effects for links, buttons, inputs
        const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, .micro-hover');

        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorAura.classList.add('hover-active');
            });

            el.addEventListener('mouseleave', () => {
                cursorAura.classList.remove('hover-active');
            });
        });
    } else if (cursorAura) {
        // Disable cursor aura on mobile
        cursorAura.style.display = 'none';
    }
}

// Call init on load
document.addEventListener('DOMContentLoaded', () => {
    initAdminCursor();
});
