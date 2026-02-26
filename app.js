/**
 * Hannah Lucas Portfolio
 * Main Application Logic
 */

import { doc, getDoc, collection, getDocs, addDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {

    // --- Dynamic Theme Integration (Firebase) ---
    await loadAppearanceSettings();

    // --- State ---
    const state = {
        soundOn: true,
        calmMode: false,
    };

    // --- DOM Elements ---
    const loader = document.getElementById('loader');
    const mainNav = document.querySelector('.main-nav');
    const toggleSoundBtn = document.getElementById('toggle-sound');
    const toggleMotionBtn = document.getElementById('toggle-motion');
    const cursorAura = document.getElementById('cursor-aura');

    // --- Loading Sequence ---
    // Simulate initial loading sequence
    setTimeout(() => {
        // Fade out loader
        loader.style.opacity = '0';

        // Show Nav
        setTimeout(() => {
            loader.style.display = 'none';
            mainNav.classList.add('visible');
            initAesthetics();
        }, 800); // Wait for fade out
    }, 3200); // 3-second loader sequence

    // --- Accessibility Toggles ---
    toggleMode();

    function toggleMode() {
        toggleSoundBtn.addEventListener('click', () => {
            state.soundOn = !state.soundOn;
            toggleSoundBtn.setAttribute('aria-pressed', state.soundOn);
            toggleSoundBtn.querySelector('.btn-text').textContent = state.soundOn ? "Sound: On" : "Sound: Off";
            // play interaction sound if turned on?
            if (state.soundOn) playTickSound();
        });

        toggleMotionBtn.addEventListener('click', () => {
            state.calmMode = !state.calmMode;
            toggleMotionBtn.setAttribute('aria-pressed', state.calmMode);
            if (state.calmMode) {
                document.body.classList.add('reduce-motion');
                toggleMotionBtn.classList.add('active'); // styling if needed
            } else {
                document.body.classList.remove('reduce-motion');
                toggleMotionBtn.classList.remove('active');
            }
        });
    }

    // --- Custom Cursor ---
    function initCursor() {
        // Only on non-touch devices
        if (window.matchMedia("(pointer: fine)").matches) {
            document.addEventListener('mousemove', (e) => {
                // Use requestAnimationFrame for smoother following
                requestAnimationFrame(() => {
                    cursorAura.style.left = e.clientX + 'px';
                    cursorAura.style.top = e.clientY + 'px';
                });
            });

            // Hover effects for links, buttons
            const interactiveElements = document.querySelectorAll('a, button, .micro-hover');

            interactiveElements.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    cursorAura.classList.add('hover-active');
                    if (state.soundOn && !state.calmMode) {
                        playSubtleHoverSound();
                    }
                });

                el.addEventListener('mouseleave', () => {
                    cursorAura.classList.remove('hover-active');
                });
            });
        } else {
            // Disable cursor aura on mobile
            cursorAura.style.display = 'none';
        }
    }

    // Initialize aesthetics after loader, making sure dynamic content is loaded FIRST
    async function initAesthetics() {
        initCursor();
        await loadDynamicContent(); // Wait for DOM to be populated
        initGSAPAnimations();
    }

    // --- Dynamic Content Loading ---
    async function loadDynamicContent() {
        if (!window.portfolioDB) {
            console.warn("Firestore not initialized. Cannot load dynamic content.");
            return;
        }

        try {
            await Promise.all([
                loadAppearanceSettings(),
                loadJourneyChapters(),
                loadReceipts()
            ]);
        } catch (error) {
            console.error("Error loading dynamic content:", error);
        }
    }

    async function loadJourneyChapters() {
        const container = document.getElementById('journey-dynamic-container');
        if (!container) return;

        console.log("Fetching Journey Chapters...");
        const chaptersQuery = query(collection(window.portfolioDB, 'chapters'), orderBy('order', 'asc'));
        const snapshot = await getDocs(chaptersQuery);

        if (snapshot.empty) {
            container.innerHTML = "<p class='text-center text-secondary py-5'>No chapters found.</p>";
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();

            // Build the specific internal HTML based on the data structure we migrated
            let innerContent = '';

            if (data.order === 1) {
                innerContent = `
                    <div class="content-wrapper text-center">
                        <p class="chapter-eyebrow text-glow">${data.eyebrow}</p>
                        <h2 class="chapter-headline">${data.headline}</h2>
                        <p class="chapter-body">${data.body}</p>
                        <p class="chapter-pullquote mt-md">${data.pullquote}</p>
                        <p class="micro-cta mt-md text-secondary">${data.microCta}</p>
                    </div>`;
            } else if (data.order === 2) {
                innerContent = `
                    <div class="content-wrapper">
                        <div class="grid-2-col">
                            <div>
                                <p class="chapter-eyebrow">${data.eyebrow}</p>
                                <h2 class="chapter-headline">${data.headline}</h2>
                            </div>
                            <div>
                                <p class="chapter-body">${data.body}</p>
                                <div class="mt-md">
                                    <p class="impact-text">${data.impactLine}</p>
                                    <button class="cyber-button mt-sm micro-hover" onclick="document.getElementById('receipt-modal-1').classList.add('active')">SEE PROOF</button>
                                </div>
                            </div>
                        </div>
                    </div>`;
            } else if (data.order === 3) {
                innerContent = `
                    <div class="content-wrapper text-center">
                        <p class="chapter-eyebrow">${data.eyebrow}</p>
                        <h2 class="chapter-headline">${data.headline}</h2>
                        <p class="chapter-body max-w-800 mx-auto">${data.body}</p>
                        <p class="impact-text mt-md">${data.impactLine}</p>
                        <p class="micro-cta mt-md text-secondary">${data.transitionLine}</p>
                    </div>`;
            } else if (data.order === 4) {
                let featuresHtml = data.features ? data.features.map(f => `
                    <div class="feature-item">
                        <h4>${f.title}</h4>
                        <p>${f.text}</p>
                    </div>`).join('') : '';

                innerContent = `
                    <div class="content-wrapper">
                        <p class="chapter-eyebrow">${data.eyebrow}</p>
                        <h2 class="chapter-headline mb-md">${data.headline}</h2>
                        <div class="grid-2-col">
                            <div>
                                <p class="chapter-body">${data.body}</p>
                                <div class="features-list mt-md">
                                    ${featuresHtml}
                                </div>
                            </div>
                            <div class="interactive-demo text-center glass-panel p-md">
                                ${data.hasDemo ? `
                                    <h3 class="mb-sm">Try it: The 1-Tap Experience</h3>
                                    <button class="primary-btn pulse-glow" id="demo-btn">I NEED HELP</button>
                                    <div class="demo-sequence mt-sm" id="demo-sequence">
                                        <p class="typing-text">Locating...</p>
                                        <p class="typing-text delay-1">Alerting 5 trusted contacts...</p>
                                        <p class="typing-text delay-2 text-glow">Help is on the way.</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        <div class="mt-xl text-center">
                            <p class="impact-text">${data.proofLine}</p>
                            ${data.tertiaryLink ? `<a href="${data.tertiaryLink.href}" class="tertiary-link mt-sm inline-btn">${data.tertiaryLink.text}</a>` : ''}
                        </div>
                    </div>`;
            } else if (data.order === 5) {
                let carouselHtml = data.mediaCarousel ? data.mediaCarousel.map(m => `
                    <div class="media-card">
                        <span class="tag">${m.tag}</span>
                        <h4>${m.title}</h4>
                        <p class="text-secondary mb-sm">${m.desc}</p>
                        <button class="cyber-button w-full">${m.btnText}</button>
                    </div>`).join('') : '';

                innerContent = `
                    <div class="content-wrapper">
                        <p class="chapter-eyebrow text-glow text-center">${data.eyebrow}</p>
                        <h2 class="chapter-headline text-center mb-md">${data.headline}</h2>
                        <p class="chapter-body text-center max-w-800 mx-auto mb-lg">${data.body}</p>
                        
                        <div class="media-carousel-wrap">
                            <div class="media-carousel">
                                ${carouselHtml}
                            </div>
                        </div>
                        <p class="micro-cta mt-xl text-center text-secondary">${data.transitionLine}</p>
                    </div>`;
            } else if (data.order === 6) {
                let grantWallHtml = data.grantWall ? data.grantWall.map(g => `<div class="grant-tile">${g}</div>`).join('') : '';

                innerContent = `
                    <div class="content-wrapper">
                        <div class="grid-2-col">
                            <div>
                                <p class="chapter-eyebrow text-glow">${data.eyebrow}</p>
                                <h2 class="chapter-headline">${data.headline}</h2>
                                <p class="chapter-body mt-sm">${data.body}</p>
                                <div class="mt-md p-md glass-panel">
                                    <p class="impact-text-sm">${data.impactLineHtml}</p>
                                </div>
                            </div>
                            <div class="grant-wall">
                                <h3 class="mb-sm text-center">${data.subheadAlt}</h3>
                                <div class="grant-tiles">
                                    ${grantWallHtml}
                                </div>
                            </div>
                        </div>
                        <div class="text-center mt-lg">
                            ${data.cta ? `<a href="${data.cta.href}" class="primary-btn inline-btn">${data.cta.text}</a>` : ''}
                        </div>
                    </div>`;
            } else if (data.order === 7) {
                let topicsHtml = data.speakingTopics ? data.speakingTopics.map(t => `
                    <div class="topic-card">
                        <h4>${t.title}</h4>
                        <p class="text-secondary">${t.text}</p>
                    </div>`).join('') : '';

                innerContent = `
                    <div class="content-wrapper">
                        <p class="chapter-eyebrow text-glow text-center">${data.eyebrow}</p>
                        <h2 class="chapter-headline text-center mb-md">${data.headline}</h2>
                        <p class="chapter-body text-center max-w-800 mx-auto mb-lg">${data.body}</p>
                        
                        <div class="speaking-topics">
                            ${topicsHtml}
                        </div>
                        
                        <div class="text-center mt-xl pb-xl">
                            ${data.bookTheme ? `
                                <h2 class="final-name">${data.bookTheme.headline}</h2>
                                <p class="final-watch">${data.bookTheme.body}</p>
                                <p class="mt-md mb-lg" style="font-style: italic; max-width: 800px; margin-left: auto; margin-right: auto; opacity: 0.8;">
                                    ${data.bookTheme.powerQuote}
                                </p>
                            ` : ''}
                            <div class="final-ctas justify-center">
                                <a href="#contact" class="primary-btn inline-btn">BOOK ME</a>
                                <a href="#press" class="cyber-button inline-btn">PRESS KIT</a>
                            </div>
                        </div>
                    </div>`;
            } else {
                // Dynamic Modules created in admin
                let moduleHtml = '';

                if (data.moduleType === 'embed' && data.embedCode) {
                    moduleHtml = `
                        <div class="mt-lg embed-container glass-panel p-sm w-full mx-auto" style="max-width: 800px;">
                            ${data.embedCode}
                        </div>
                    `;
                } else if (data.moduleType === 'gallery' && data.galleryLinks) {
                    const links = data.galleryLinks.split('\n').filter(l => l.trim());
                    const linksHtml = links.map(link => `
                        <a href="${link.trim()}" target="_blank" class="gallery-link-item cyber-button text-center w-full" style="display: block; margin-bottom: 0.5rem; text-transform: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${link.trim()}
                        </a>
                    `).join('');

                    moduleHtml = `
                        <div class="mt-lg gallery-container grid-2-col gap-sm" style="max-width: 800px; margin-left: auto; margin-right: auto;">
                            ${linksHtml}
                        </div>
                    `;
                } else if (data.mediaUrl) {
                    moduleHtml = `
                        <div class="mt-md">
                            ${data.mediaType === 'image'
                            ? `<img src="${data.mediaUrl}" alt="Chapter Media" class="w-full glass-panel" style="max-height: 500px; object-fit: cover; margin: 0 auto;">`
                            : `<video src="${data.mediaUrl}" controls class="w-full glass-panel" style="max-height: 500px; margin: 0 auto;"></video>`}
                        </div>
                    `;
                }

                innerContent = `
                    <div class="content-wrapper text-center">
                        ${data.eyebrow ? `<p class="chapter-eyebrow">${data.eyebrow}</p>` : ''}
                        <h2 class="chapter-headline">${data.headline || ''}</h2>
                        <p class="chapter-body max-w-800 mx-auto">${data.body || ''}</p>
                        ${moduleHtml}
                        ${data.pullquote ? `<p class="chapter-pullquote mt-md" style="font-style: italic; opacity: 0.8">"${data.pullquote}"</p>` : ''}
                    </div>`;
            }

            html += `
                <article class="chapter-slide" id="ch-${data.order}">
                    ${innerContent}
                </article>
            `;
        });

        container.innerHTML = html;
        console.log("Journey Chapters Rendered");
    }

    async function loadReceipts() {
        const container = document.getElementById('receipts-dynamic-container');
        const filterBar = document.getElementById('receipts-filter-bar');

        if (!container) return;

        console.log("Fetching Receipts...");
        // Order by the 'order' field we set during migration
        const receiptsQuery = query(collection(window.portfolioDB, 'receipts'), orderBy('order', 'asc'));
        const snapshot = await getDocs(receiptsQuery);

        if (snapshot.empty) {
            container.innerHTML = "<p class='text-center text-secondary py-5'>No receipts available yet.</p>";
            if (filterBar) filterBar.style.display = 'none';
            return;
        }

        let html = '';
        const categories = new Set();

        snapshot.forEach(doc => {
            const data = doc.data();
            categories.add(data.category);

            html += `
                <div class="receipt-card" data-category="${data.category}">
                    <div class="receipt-stamp">${data.stamp}</div>
                    <h3 class="mb-sm">${data.title}</h3>
                    <p class="text-secondary mb-md">${data.text}</p>
                    <button class="cyber-button w-full micro-hover">${data.btn}</button>
                </div>
            `;
        });

        container.innerHTML = html;

        // Dynamically build filter buttons if they don't exist
        if (filterBar && filterBar.children.length === 0) {
            let filterHtml = '<button class="cyber-button filter-btn active" data-filter="all">ALL RECEIPTS</button>';
            categories.forEach(cat => {
                const label = cat.charAt(0).toUpperCase() + cat.slice(1);
                filterHtml += `<button class="cyber-button filter-btn" data-filter="${cat}">${label}</button>`;
            });
            filterBar.innerHTML = filterHtml;
            // Re-bind filter events since we just created these buttons
            bindReceiptFilters();
        }

        console.log("Receipts Rendered");
    }

    // Extracted filter binding so it can be called after dynamic generation
    function bindReceiptFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const receiptCards = document.querySelectorAll('.receipt-card');

        if (filterBtns.length > 0 && receiptCards.length > 0) {
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    const filterValue = btn.getAttribute('data-filter');

                    receiptCards.forEach(card => {
                        if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                            card.style.display = 'block';
                            setTimeout(() => {
                                card.style.opacity = '1';
                                card.style.transform = 'scale(1)';
                            }, 50);
                        } else {
                            card.style.opacity = '0';
                            card.style.transform = 'scale(0.95)';
                            setTimeout(() => {
                                card.style.display = 'none';
                            }, 200);
                        }
                    });

                    if (state.soundOn && !state.calmMode) {
                        playTickSound();
                    }
                });
            });
        }
    }

    // --- Appearance Settings ---
    async function loadAppearanceSettings() {
        if (!window.portfolioDB) return;

        try {
            const docRef = doc(window.portfolioDB, 'settings', 'appearance');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                applyAppearanceToFrontend(data);
            }
        } catch (error) {
            console.error("Error loading appearance settings on frontend:", error);
        }
    }

    function applyAppearanceToFrontend(data) {
        const root = document.documentElement;

        // Convert hex to rgb string for rgba() vars
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
            document.body.classList.remove('cursor-default', 'cursor-dot', 'cursor-ring', 'cursor-glow', 'cursor-heart');
            document.body.classList.add(`cursor-${data.cursorStyle}`);
        }
    }


    function initGSAPAnimations() {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            // Animate Receipt Cards staggering in
            gsap.from(".receipt-card", {
                scrollTrigger: {
                    trigger: ".receipts-grid",
                    start: "top 80%"
                },
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: "back.out(1.7)"
            });

            // Animate Impact Blocks fading in
            gsap.utils.toArray(".impact-block").forEach(block => {
                gsap.from(block, {
                    scrollTrigger: {
                        trigger: block,
                        start: "top 85%"
                    },
                    y: 30,
                    opacity: 0,
                    duration: 1,
                    ease: "power2.out"
                });
            });

            // Animate Speaking Talk Cards
            gsap.from(".talk-card", {
                scrollTrigger: {
                    trigger: ".speaking-talks",
                    start: "top 80%"
                },
                scale: 0.9,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "power1.out"
            });
        }
    }

    // --- Audio System (Placeholders for subtle web audio synthesis) ---
    // Instead of importing bulky mp3s, we can synthesize a high-tech tick/blip
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playTickSound() {
        if (!state.soundOn || state.calmMode) return;
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.05);
        } catch (e) { }
    }

    function playSubtleHoverSound() {
        if (!state.soundOn || state.calmMode) return;
        // Even softer tick
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.03);
        } catch (e) { }
    }

    // --- Simple Routing (Single Page Navigation) ---
    const navLinks = document.querySelectorAll('.nav-links .nav-link, .site-footer .nav-link');
    const sections = document.querySelectorAll('.view-section');

    function navigateTo(targetId) {
        if (!targetId || targetId === '#') return;

        // Remove hash from target
        const sectionId = targetId.substring(1);
        const targetSection = document.getElementById(sectionId);

        if (targetSection) {
            // Hide all
            sections.forEach(sec => {
                sec.classList.remove('active');
            });
            // Show target
            targetSection.classList.add('active');
            window.scrollTo({ top: 0, behavior: state.calmMode ? 'auto' : 'smooth' });

            // Refresh ScrollTrigger so GSAP knows about the newly visible section's layout
            if (typeof ScrollTrigger !== 'undefined') {
                setTimeout(() => ScrollTrigger.refresh(), 50);
            }

            // Update Nav Active State
            document.querySelectorAll('.nav-links .nav-link').forEach(link => {
                if (link.getAttribute('href') === targetId) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });

            // Update URL cleanly
            history.pushState(null, null, targetId);
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const dest = link.getAttribute('href');
            if (dest.startsWith('#')) {
                e.preventDefault();
                navigateTo(dest);
            }
        });
    });

    // Check hash on load
    if (window.location.hash) {
        navigateTo(window.location.hash);
    }

    // --- Scrollytelling Setup (Journey) with GSAP ---
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        const journeySection = document.getElementById('journey');
        const chapters = gsap.utils.toArray('.chapter-slide');
        const progressFill = document.getElementById('journey-fill');
        const chapterIndicator = document.getElementById('chapter-indicator');

        if (journeySection && chapters.length > 0) {
            // Overall Progress Bar Animation
            gsap.to(progressFill, {
                height: "100%",
                ease: "none",
                scrollTrigger: {
                    trigger: journeySection,
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 0.3
                }
            });

            // Individual Chapter Animations
            chapters.forEach((chapter, index) => {
                const content = chapter.querySelector('.chapter-content');

                // Chapter text entrance
                gsap.fromTo(content,
                    { autoAlpha: 0, y: 50 },
                    {
                        autoAlpha: 1,
                        y: 0,
                        duration: 1,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: chapter,
                            start: "top 75%", // Triggers when top of chapter hits 75% down viewport
                            toggleActions: "play reverse play reverse",
                            onEnter: () => updateChapterIndicator(index + 1),
                            onEnterBack: () => updateChapterIndicator(index + 1)
                        }
                    }
                );
            });

            function updateChapterIndicator(chNum) {
                if (chapterIndicator) {
                    chapterIndicator.textContent = `CH. ${chNum} / 7`;
                }
            }
        }
    }

    // --- Interactive Demo (Ch 4) ---
    const demoBtn = document.getElementById('demo-btn');
    const demoSeq = document.getElementById('demo-sequence');

    if (demoBtn && demoSeq) {
        demoBtn.addEventListener('click', () => {
            demoSeq.classList.remove('active');
            // Trigger reflow
            void demoSeq.offsetWidth;
            demoSeq.classList.add('active');

            if (state.soundOn && !state.calmMode) {
                // Simulate boot sound
                try {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
                    osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
                    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.3);
                } catch (e) { }
            }
        });
    }

    // --- Easter Eggs ---
    // 1. Solution word tracker
    let keystrokes = '';
    document.addEventListener('keydown', (e) => {
        if (e.key && e.key.length === 1) { // Only track actual letters
            keystrokes += e.key.toLowerCase();
            // keep it short
            if (keystrokes.length > 20) {
                keystrokes = keystrokes.slice(-20);
            }
            if (keystrokes.includes('solution')) {
                showToast("Correct.");
                keystrokes = ''; // reset
            }
        }
    });

    function showToast(msg) {
        const toast = document.createElement('div');
        toast.textContent = msg;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = 'var(--text-primary)';
        toast.style.color = 'var(--bg-color)';
        toast.style.padding = '0.5rem 1.5rem';
        toast.style.borderRadius = '50px';
        toast.style.fontFamily = 'var(--font-heading)';
        toast.style.fontWeight = 'bold';
        toast.style.textTransform = 'uppercase';
        toast.style.zIndex = '99999';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';

        document.body.appendChild(toast);

        setTimeout(() => toast.style.opacity = '1', 10);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // 2. Footer hover 5s
    const footerName = document.getElementById('footer-name-hover');
    let hoverTimer;
    if (footerName) {
        footerName.addEventListener('mouseenter', () => {
            hoverTimer = setTimeout(() => {
                showToast("Household name loading...");
                footerName.style.textShadow = "0 0 30px var(--accent-glow)";
            }, 5000);
        });
        footerName.addEventListener('mouseleave', () => {
            clearTimeout(hoverTimer);
            footerName.style.textShadow = "";
        });
    }

    // Dynamic filter binding handles this now

    // --- Contact Form Handling ---
    const contactForm = document.getElementById('contact-form');
    const formMsg = document.getElementById('form-msg');

    if (contactForm && formMsg) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'SENDING...';
            btn.disabled = true;

            try {
                // Gather form data
                const name = document.getElementById('name').value;
                const org = document.getElementById('org').value;
                const email = document.getElementById('email').value;
                const purpose = document.getElementById('purpose').value;
                const deadline = document.getElementById('deadline').value;
                const message = document.getElementById('message').value;

                // Save to Firestore
                if (window.portfolioDB) {
                    await addDoc(collection(window.portfolioDB, "messages"), {
                        name,
                        org,
                        email,
                        purpose,
                        deadline,
                        message,
                        timestamp: new Date()
                    });
                } else {
                    console.warn("Firebase not initialized. Simulating submission only.");
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                formMsg.textContent = "Message received. If this is urgent, say so. I move fast.";
                formMsg.style.color = "var(--accent-glow)";
                formMsg.classList.add('active');
                contactForm.reset();

                if (state.soundOn && !state.calmMode) {
                    playTickSound();
                }
            } catch (error) {
                console.error("Error submitting form:", error);
                formMsg.textContent = "An error occurred. Please try again later.";
                formMsg.style.color = "#ff4444";
                formMsg.classList.add('active');
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;

                // Hide message after 5 seconds
                setTimeout(() => {
                    formMsg.classList.remove('active');
                }, 5000);
            }
        });
    }

});
