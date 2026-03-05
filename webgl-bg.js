/**
 * HML Portfolio — Full-Screen Portrait WebGL Background
 *
 * Root cause fix: html { zoom:0.75 } makes window.innerWidth/Height return
 * LARGER values than the actual screen (1/0.75x = 1.333x). We use
 * screen.width/height directly for renderer dimensions and also account for
 * devicePixelRatio properly. The CSS on #webgl-container counters the zoom.
 *
 * Face positioning: Portrait subject's face center is roughly at 35% down
 * in the image. We use u_faceY uniform to shift the crop anchor so the face
 * maps to 50% of the viewport (center screen) at all times.
 *
 * Animations:
 *  - Breathing float (Y sine wave)
 *  - Mouse parallax (subtle XY tilt like a 3D card)
 *  - Scroll parallax (portrait drifts slowly as page scrolls)
 *  - Mouse ripple rings (distortion centered on cursor)
 *  - Chromatic aberration (magenta/cyan split, intensifies near cursor)
 *  - Deep vignette (edges dissolve into the site's dark background)
 */

document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth < 600 && !window.matchMedia('(pointer: fine)').matches) return;
    initWebGLBackground();
});

function initWebGLBackground() {
    const container = document.getElementById('webgl-container');
    if (!container || !window.THREE) return;

    // Use screen dimensions — unaffected by CSS zoom
    const W = () => window.screen.width  || window.innerWidth;
    const H = () => window.screen.height || window.innerHeight;

    const scene    = new THREE.Scene();
    const camera   = new THREE.OrthographicCamera(W()/-2, W()/2, H()/2, H()/-2, 1, 1000);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(W(), H());
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';
    container.appendChild(renderer.domElement);

    const loader = new THREE.TextureLoader();
    loader.load('./assets/portrait.jpg', (texture) => {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;

        const imgW = texture.image.width;
        const imgH = texture.image.height;

        const uniforms = {
            u_time:       { value: 0.0 },
            u_mouse:      { value: new THREE.Vector2(0.5, 0.5) },
            u_resolution: { value: new THREE.Vector2(W(), H()) },
            u_tex:        { value: texture },
            u_img_aspect: { value: imgW / imgH },
            u_scroll:     { value: 0.0 },
            // Where is the face center in the IMAGE (0=top, 1=bottom)?
            // Generated portrait: face is ~37% down. We map this to 50% of screen.
            u_face_y:     { value: 0.42 },
        };

        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            precision highp float;
            uniform float     u_time;
            uniform vec2      u_mouse;
            uniform vec2      u_resolution;
            uniform sampler2D u_tex;
            uniform float     u_img_aspect;
            uniform float     u_scroll;
            uniform float     u_face_y;
            varying vec2 vUv;

            // Full-viewport cover: image always fills screen edge-to-edge,
            // cropping excess. faceY=content center in image coordinates that
            // should map to screen center (0.5).
            vec2 coverUV(vec2 uv, vec2 res, float imgAspect, float faceY) {
                float screenAspect = res.x / res.y;
                // Scale factors to map image into screen space
                float scaleX, scaleY;
                if (screenAspect > imgAspect) {
                    // Screen wider than image: fit width (fill X), crop Y
                    scaleX = 1.0;
                    scaleY = imgAspect / screenAspect;
                } else {
                    // Screen taller than image: fit height (fill Y), crop X
                    scaleX = screenAspect / imgAspect;
                    scaleY = 1.0;
                }
                // Center-crop horizontally
                float x = (uv.x - 0.5) * scaleX + 0.5;
                // Anchor vertically to face center: face at faceY maps to 0.5
                float y = (uv.y - 0.5) * scaleY + faceY;
                return vec2(x, y);
            }

            void main() {
                vec2 mouse = vec2(u_mouse.x, 1.0 - u_mouse.y); // flip Y for WebGL
                vec2 uv    = vUv;

                // Scroll parallax — portrait drifts up gently as user scrolls
                uv.y += (u_scroll - 0.5) * 0.12;

                // Breathing float
                uv.y += sin(u_time * 0.5) * 0.003;

                // Subtle mouse parallax (3D card tilt feel)
                uv.x += (mouse.x - 0.5) * 0.015;
                uv.y += (mouse.y - 0.5) * 0.01;

                // Cover + face-center anchor
                vec2 cuv = coverUV(uv, u_resolution, u_img_aspect, u_face_y);

                // Mouse ripple rings
                float dist   = distance(cuv, mouse);
                float ripple = smoothstep(0.4, 0.0, dist);
                vec2  dir    = normalize(cuv - mouse + 0.0001);
                float rings  = sin(dist * 55.0 - u_time * 3.0) * ripple * 0.005;
                cuv += dir * rings;

                // Out-of-bounds → transparent
                if (cuv.x < 0.0 || cuv.x > 1.0 || cuv.y < 0.0 || cuv.y > 1.0) {
                    gl_FragColor = vec4(0.0);
                    return;
                }

                // Chromatic aberration (magenta/cyan)
                float ab = 0.003 + ripple * 0.005;
                float r = texture2D(u_tex, cuv + vec2( ab, 0.0)).r;
                float g = texture2D(u_tex, cuv             ).g;
                float b = texture2D(u_tex, cuv + vec2(-ab, 0.0)).b;

                // Vignette — soft dark edge dissolve
                float vx   = cuv.x * (1.0 - cuv.x);
                float vy   = cuv.y * (1.0 - cuv.y);
                float vign = pow(clamp(vx * vy * 10.0, 0.0, 1.0), 0.3);

                // Alpha: transparent enough to let site's dark bg bleed in atmospherically
                // Gentle exposure boost so the portrait reads clearly over the dark site bg
                float exposure = 1.4;
                gl_FragColor = vec4(r * exposure, g * exposure, b * exposure, vign * 0.95);
            }
        `;

        const geo  = new THREE.PlaneGeometry(W(), H());
        const mat  = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false });
        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);

        // Mouse
        let mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5;
        window.addEventListener('mousemove', (e) => {
            tx = e.clientX / window.innerWidth;
            ty = e.clientY / window.innerHeight;
        });

        // Scroll
        let sv = 0, ts = 0;
        window.addEventListener('scroll', () => {
            const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
            ts = window.scrollY / max;
        }, { passive: true });

        // Resize (debounced, uses screen dims)
        let rtimer;
        const doResize = () => {
            const w = W(), h = H();
            renderer.setSize(w, h);
            camera.left = w/-2; camera.right = w/2;
            camera.top  = h/2;  camera.bottom = h/-2;
            camera.updateProjectionMatrix();
            mesh.geometry.dispose();
            mesh.geometry = new THREE.PlaneGeometry(w, h);
            uniforms.u_resolution.value.set(w, h);
        };
        window.addEventListener('resize', () => { clearTimeout(rtimer); rtimer = setTimeout(doResize, 100); });
        window.addEventListener('orientationchange', () => { clearTimeout(rtimer); rtimer = setTimeout(doResize, 200); });

        // Render loop — pauses when tab hidden
        const clock = new THREE.Clock();
        let visible = !document.hidden;
        document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) clock.start(); });

        (function animate() {
            requestAnimationFrame(animate);
            if (!visible) return;
            mx += (tx - mx) * 0.06;
            my += (ty - my) * 0.06;
            sv += (ts - sv) * 0.04;
            uniforms.u_time.value   = clock.getElapsedTime();
            uniforms.u_mouse.value.set(mx, my);
            uniforms.u_scroll.value = sv;
            renderer.render(scene, camera);
        })();
    });
}
