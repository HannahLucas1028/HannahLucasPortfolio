/**
 * Hannah Lucas Portfolio
 * Main Application Logic
 */

import { doc, getDoc, collection, getDocs, addDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {

    // --- Dynamic Theme Integration (Firebase) ---
    // Non-blocking: fire and forget so loader starts immediately
    loadAppearanceSettings();

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

    // --- Loading Sequence (GSAP) ---
    const loaderCounter = document.querySelector('.loader-counter');
    const loaderText = document.querySelector('.loader-text');
    
    let counter = { val: 0 };
    
    if (loaderCounter && window.gsap) {
        gsap.to(counter, {
            val: 100,
            roundProps: "val",
            duration: 2.5,
            ease: "power2.inOut",
            onUpdate: function() {
                loaderCounter.textContent = counter.val + "%";
                if (counter.val > 80) {
                    loaderText.textContent = "ANTI-GRAVITY READY";
                    loaderText.setAttribute('data-text', "ANTI-GRAVITY READY");
                    loaderText.classList.add('text-glow');
                }
            },
            onComplete: function() {
                gsap.to(loader, {
                    opacity: 0,
                    duration: 0.8,
                    ease: "power2.inOut",
                    onComplete: () => {
                        loader.style.display = 'none';
                        mainNav.classList.add('visible');
                        initAesthetics();
                    }
                });
            }
        });
    } else {
        // Fallback if GSAP fails to load
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                mainNav.classList.add('visible');
                initAesthetics();
            }, 800);
        }, 2000);
    }

    // --- Accessibility Toggles ---
    toggleMode();

    function toggleMode() {
        toggleSoundBtn.addEventListener('click', () => {
            state.soundOn = !state.soundOn;
            toggleSoundBtn.setAttribute('aria-pressed', state.soundOn);
            toggleSoundBtn.querySelector('.btn-text').textContent = state.soundOn ? "Sound: On" : "Sound: Off";
            
            document.querySelectorAll('.journey-video').forEach(video => {
                video.muted = !state.soundOn;
            });

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

    // --- Hover Sounds ---
    function initHoverSounds() {
        // Only on non-touch devices
        if (window.matchMedia("(pointer: fine)").matches) {
            const interactiveElements = document.querySelectorAll('a, button, .micro-hover');

            interactiveElements.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    if (state.soundOn && !state.calmMode) {
                        playSubtleHoverSound();
                    }
                });
            });
        }
    }

    // Initialize aesthetics after loader, making sure dynamic content is loaded FIRST
    async function initAesthetics() {
        initHoverSounds(); 
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
                loadVerifications()
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
                                    <button class="cyber-button mt-sm micro-hover" onclick="document.getElementById('verification-modal-1').classList.add('active')">OPEN VALIDATION</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="impact-spike flashbulb" style="padding:2.5rem 2rem;margin-top:0;">
                        <p class="spike-title">10,000 BLANKETS.</p>
                        <p class="spike-sub">Haiti, 2010. She was in fourth grade. Nationwide.</p>
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
                                        <p class="typing-text">Signal sent…</p>
                                        <p class="typing-text delay-1">Trusted contacts alerted…</p>
                                        <p class="typing-text delay-2 text-glow">Help is on the way.</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        <div class="mt-xl text-center">
                            <p class="impact-text">${data.validationLine}</p>
                            ${data.tertiaryLink ? `<a href="${data.tertiaryLink.href}" class="tertiary-link mt-sm inline-btn">${data.tertiaryLink.text}</a>` : ''}
                            ${data.micro ? `<p class="micro-cta mt-md text-secondary">${data.micro}</p>` : ''}
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
                        ${data.micro ? `<p class="micro-cta mt-md text-center text-secondary">${data.micro}</p>` : ''}
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
                                ${data.micro ? `<p class="micro-cta mt-md text-secondary">${data.micro}</p>` : ''}
                            </div>
                            <div class="grant-wall">
                                <h3 class="mb-sm text-center">${data.subheadAlt}</h3>
                                <div class="grant-tiles">
                                    ${grantWallHtml}
                                </div>
                            </div>
                        </div>
                        <div class="impact-counter" id="ch6-counter" style="margin:2rem 0;">
                            <div class="counter-node">
                                <span class="counter-num" data-target="14">0</span>
                                <span class="counter-label">Days</span>
                            </div>
                            <span class="counter-arrow">→</span>
                            <div class="counter-node">
                                <span class="counter-num" data-target="50" data-prefix="$" data-suffix="K+">$0K+</span>
                                <span class="counter-label">Raised</span>
                            </div>
                            <span class="counter-arrow">→</span>
                            <div class="counter-node">
                                <span class="counter-num" data-static="true">Grants</span>
                                <span class="counter-label">Delivered</span>
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
                            <div class="dossier-unlock mt-lg mb-lg">
                                <span class="dossier-label">CHAPTER 7 — CLEARANCE GRANTED</span>
                                <h2 class="dossier-title">NEXT ERA: HISTORY MAKER.</h2>
                            </div>
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
                            : `<video src="${data.mediaUrl}" loop muted playsinline class="w-full glass-panel journey-video" style="max-height: 500px; margin: 0 auto;"></video>`}
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

        // CH6 Counter Animation — trigger on scroll
        const ch6Counter = document.getElementById('ch6-counter');
        if (ch6Counter) {
            const counterNums = ch6Counter.querySelectorAll('.counter-num[data-target]');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        counterNums.forEach(el => {
                            const target = parseInt(el.dataset.target, 10);
                            const prefix = el.dataset.prefix || '';
                            const suffix = el.dataset.suffix || '';
                            let current = 0;
                            const step = Math.ceil(target / 40);
                            const timer = setInterval(() => {
                                current = Math.min(current + step, target);
                                el.textContent = prefix + current + suffix;
                                if (current >= target) clearInterval(timer);
                            }, 40);
                        });
                        observer.disconnect();
                    }
                });
            }, { threshold: 0.4 });
            observer.observe(ch6Counter);
        }

        const videos = container.querySelectorAll('.journey-video');
        videos.forEach(v => {
            v.muted = !state.soundOn;
        });

        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    video.muted = !state.soundOn;
                    video.play().catch(e => console.warn("Autoplay prevented", e));
                } else {
                    video.pause();
                }
            });
        }, { threshold: 0.3 });

        videos.forEach(v => videoObserver.observe(v));

        console.log("Journey Chapters Rendered");
    }

    async function loadVerifications() {
        const container = document.getElementById('verifications-dynamic-container');
        const filterBar = document.getElementById('verifications-filter-bar');

        if (!container) return;

        console.log("Fetching Verifications...");
        // Order by the 'order' field we set during migration
        const receiptsQuery = query(collection(window.portfolioDB, 'verifications'), orderBy('order', 'asc'));
        const snapshot = await getDocs(receiptsQuery);

        if (snapshot.empty) {
            container.innerHTML = "<p class='text-center text-secondary py-5'>No verification entries available yet.</p>";
            if (filterBar) filterBar.style.display = 'none';
            return;
        }

        let html = '';
        const categories = new Set();

        snapshot.forEach(doc => {
            const data = doc.data();
            categories.add(data.category);

            const btnText = data.link && data.link.toLowerCase() !== "validation pending" ? "View Source" : "Validation Pending";
            const btnAction = data.link && data.link.toLowerCase() !== "validation pending" ? `onclick="window.open('${data.link}', '_blank')"` : "disabled";
            const description = data.desc || data.text || ''; // Fallback for old data

            html += `
                <div class="verification-card${data.featured ? ' featured' : ''}" data-category="${data.category || ''}">
                    <div class="verification-stamp">${data.stamp || ''}${data.featured ? '<span class=\"featured-badge\">★ FEATURED</span>' : ''}</div>
                    <h3 class="mb-sm">${data.title || ''}</h3>
                    <p class="text-secondary mb-md">${description}</p>
                    <button class="cyber-button w-full" style="cursor: pointer;" ${btnAction}>${btnText}</button>
                </div>
            `;
        });

        container.innerHTML = html;

        // CH6 Counter Animation — trigger on scroll
        const ch6Counter = document.getElementById('ch6-counter');
        if (ch6Counter) {
            const counterNums = ch6Counter.querySelectorAll('.counter-num[data-target]');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        counterNums.forEach(el => {
                            const target = parseInt(el.dataset.target, 10);
                            const prefix = el.dataset.prefix || '';
                            const suffix = el.dataset.suffix || '';
                            let current = 0;
                            const step = Math.ceil(target / 40);
                            const timer = setInterval(() => {
                                current = Math.min(current + step, target);
                                el.textContent = prefix + current + suffix;
                                if (current >= target) clearInterval(timer);
                            }, 40);
                        });
                        observer.disconnect();
                    }
                });
            }, { threshold: 0.4 });
            observer.observe(ch6Counter);
        }

        // Dynamically build filter buttons if they don't exist
        if (filterBar && filterBar.children.length === 0) {
            let filterHtml = '<button class="cyber-button filter-btn active" data-filter="all">ALL VALIDATION</button>';
            categories.forEach(cat => {
                const label = cat.charAt(0).toUpperCase() + cat.slice(1);
                filterHtml += `<button class="cyber-button filter-btn" data-filter="${cat}">${label}</button>`;
            });
            filterHtml += '<input type="text" id="verification-search" placeholder="Search archive..." class="glass-input cyber-input ml-md filter-search-input" style="padding: 0.5rem 1rem; border-radius: 4px; width: auto; display: inline-block;">';
            filterBar.innerHTML = filterHtml;
            // Re-bind filter events since we just created these buttons
            bindReceiptFilters();
        }

        console.log("Verifications Rendered");
    }

    // Extracted filter binding so it can be called after dynamic generation
    function bindReceiptFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const searchInput = document.getElementById('verification-search');
        const receiptCards = document.querySelectorAll('.verification-card');

        const applyFilters = () => {
            const activeBtn = document.querySelector('.filter-btn.active');
            const filterValue = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
            const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';

            receiptCards.forEach(card => {
                const matchesCategory = filterValue === 'all' || card.getAttribute('data-category') === filterValue;
                const matchesSearch = searchQuery === '' || card.innerText.toLowerCase().includes(searchQuery);

                if (matchesCategory && matchesSearch) {
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
        };

        if (filterBtns.length > 0 && receiptCards.length > 0) {
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    applyFilters();

                    if (state.soundOn && !state.calmMode) {
                        playTickSound();
                    }
                });
            });
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', applyFilters);
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
            } else {
                // Feature explicitly requested by User: Magenta Heart Cursor default
                const root = document.documentElement;
                root.style.setProperty('--cursor-color', '#d500b5'); // Dark electric magenta
                document.body.classList.remove('cursor-default', 'cursor-dot', 'cursor-ring', 'cursor-glow');
                document.body.classList.add('cursor-heart');
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
        // Apply Default Cursor Styles
        if (data.cursorStyle) {
            document.body.classList.remove('cursor-default', 'cursor-dot', 'cursor-ring', 'cursor-glow', 'cursor-heart');
            document.body.classList.add(`cursor-${data.cursorStyle}`);
        } else {
            document.body.classList.remove('cursor-default', 'cursor-dot', 'cursor-ring', 'cursor-glow'); // Remove other potential defaults
            document.body.classList.add('cursor-heart');
        }
    }


    function initGSAPAnimations() {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            // Animate Verification Cards staggering in
            gsap.from(".verification-card", {
                scrollTrigger: {
                    trigger: ".verifications-grid",
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

    // --- Audio System (lazy-init on first gesture — satisfies browser autoplay policy) ---
    let _audioCtx = null;
    function getAudioCtx() {
        if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return _audioCtx;
    }

    function playTickSound() {
        if (!state.soundOn || state.calmMode) return;
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        } catch (e) { }
    }

    function playSubtleHoverSound() {
        if (!state.soundOn || state.calmMode) return;
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1200, ctx.currentTime);
            gain.gain.setValueAtTime(0.02, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
            osc.start();
            osc.stop(ctx.currentTime + 0.03);
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
                    const ctx = getAudioCtx();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(400, ctx.currentTime);
                    osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
                    gain.gain.setValueAtTime(0.05, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.3);
                } catch (e) { }
            }
        });
    }

    // --- Easter Eggs ---
    // 'solution' word easter egg — handled by module-level keydown listener below (avoids duplicate listeners)

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


// --- Magnetic Buttons ---
document.querySelectorAll('.primary-btn, .cyber-button').forEach(btn => {
    btn.style.transition = 'transform 0.3s ease-out';
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transition = 'none';
        btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.transition = 'transform 0.3s ease-out';
        btn.style.transform = `translate(0px, 0px)`;
    });
});

// --- Easter Egg Terminal ---
const terminalOverlay = document.getElementById('terminal-overlay');
const closeTerminalBtn = document.getElementById('close-terminal');
let secretBuffer = "";
const keywords = ["gravity", "hannah"];

document.addEventListener('keydown', (e) => {
    // Ignore input if user is typing in a form field
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    
    // Only capture letters
    if (/^[a-zA-Z]$/.test(e.key)) {
        secretBuffer += e.key.toLowerCase();
        
        // Keep buffer length to max keyword length to prevent huge memory buildup
        if (secretBuffer.length > 10) {
            secretBuffer = secretBuffer.slice(1);
        }

        keywords.forEach(word => {
            if (secretBuffer.includes(word)) {
                terminalOverlay.style.display = 'flex';
                secretBuffer = ""; // Reset
                
                // Animate text entry if desired, or just show
                gsap.fromTo("#terminal-output p, #terminal-output ul li", 
                    { opacity: 0, x: -10 }, 
                    { opacity: 1, x: 0, duration: 0.1, stagger: 0.1, ease: "power1.inOut" }
                );
            }
        });
    }
});

if (closeTerminalBtn) {
    closeTerminalBtn.addEventListener('click', () => {
        terminalOverlay.style.display = 'none';
        secretBuffer = "";
    });
}

// --- Seamless Section Transitions ---
const shutterPanels = document.querySelectorAll('.shutter-panel');
const shutterLogo = document.querySelector('.shutter-logo');

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        // Skip for empty hash or simple toggles
        if (this.getAttribute('href') === '#') return;
        if (this.classList.contains('skip-link') && this.getAttribute('href') === '#verifications') {
            // Let the standard smooth scroll happen without shutter, or we can use shutter here too.
            // Let's use the shutter for ALL main navigation anchor links.
        }

        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement && window.gsap) {
            // Close mobile menu if open
            const navLinks = document.querySelector('.nav-links');
            if (navLinks.classList.contains('open')) {
                navLinks.classList.remove('open');
            }

            // GSAP Sequence: Wipe Down -> Scroll -> Wipe Down (Reveal)
            let tl = gsap.timeline();
            
            // Bring panels down
            tl.to(shutterPanels, {
                y: "0%", 
                duration: 0.6, 
                stagger: 0.1, 
                ease: "power3.inOut"
            })
            // Show Logo
            .to(shutterLogo, {
                opacity: 1,
                duration: 0.2
            }, "-=0.2")
            // Instantly scroll while covered
            .call(() => {
                window.scrollTo({
                    top: targetElement.offsetTop,
                    behavior: 'auto' // Instant scroll
                });
            })
            // Hide Logo
            .to(shutterLogo, {
                opacity: 0,
                duration: 0.2
            }, "+=0.2") // Little pause while covered
            // Wipe panels down and away
            .to(shutterPanels, {
                y: "100%", 
                duration: 0.6, 
                stagger: 0.1, 
                ease: "power3.inOut"
            })
            // Reset for next time
            .set(shutterPanels, { y: "-100%" });
        } else if (targetElement) {
            // Fallback for no GSAP
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
