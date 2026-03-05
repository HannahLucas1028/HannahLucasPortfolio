/**
 * HML Portfolio — Full-Screen Portrait WebGL Background
 * Features:
 *   • Full viewport cover (object-fit: cover logic in shader)
 *   • Scroll-driven parallax: portrait shifts vertically as user scrolls
 *   • Gentle breathing / floating animation
 *   • Mouse-reactive liquid distortion ripple rings
 *   • Chromatic aberration tint (cyan/magenta split)
 *   • Radial vignette to bleed into site content
 *   • Page Visibility pause (saves GPU when tab hidden)
 *   • Debounced resize handler
 */

document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth < 768 && !window.matchMedia('(pointer: fine)').matches) return;
    initWebGLBackground();
});

function initWebGLBackground() {
    const container = document.getElementById('webgl-container');
    if (!container || !window.THREE) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
        window.innerWidth / -2, window.innerWidth / 2,
        window.innerHeight / 2, window.innerHeight / -2,
        1, 1000
    );
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.domElement.style.willChange = 'transform';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const loader = new THREE.TextureLoader();
    loader.load('./assets/portrait.jpg', (texture) => {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;

        const imgAspect = texture.image.width / texture.image.height;

        const uniforms = {
            u_time:       { value: 0.0 },
            u_mouse:      { value: new THREE.Vector2(0.5, 0.5) },
            u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            u_tex:        { value: texture },
            u_img_aspect: { value: imgAspect },
            u_scroll:     { value: 0.0 },
            u_parallax:   { value: 0.18 },
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
            uniform float     u_parallax;
            varying vec2 vUv;

            vec2 coverUV(vec2 uv, vec2 res, float imgAspect) {
                float screenAspect = res.x / res.y;
                vec2 scale;
                if (screenAspect > imgAspect) {
                    scale = vec2(1.0, imgAspect / screenAspect);
                } else {
                    scale = vec2(screenAspect / imgAspect, 1.0);
                }
                return (uv - 0.5) * scale + 0.5;
            }

            void main() {
                vec2 mouse = vec2(u_mouse.x, 1.0 - u_mouse.y);

                // Scroll parallax — portrait drifts up as user scrolls down
                vec2 uv = vUv;
                uv.y += (u_scroll - 0.5) * u_parallax;

                // Gentle anti-gravity breathing
                uv.y += sin(u_time * 0.45) * 0.004;

                // Cover-fit the portrait to the full viewport
                uv = coverUV(uv, u_resolution, u_img_aspect);

                // Mouse ripple — concentric rings radiating from cursor
                float dist   = distance(uv, mouse);
                float ripple = smoothstep(0.35, 0.0, dist);
                vec2  dir    = normalize(uv - mouse + 0.0001);
                float rings  = sin(dist * 60.0 - u_time * 3.5) * ripple * 0.006;
                uv += dir * rings;

                // Bounds — areas outside portrait are fully transparent
                if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                    gl_FragColor = vec4(0.0);
                    return;
                }

                // Chromatic aberration — magenta/cyan split that intensifies near cursor
                float aberr = 0.003 + ripple * 0.005;
                float r = texture2D(u_tex, uv + vec2( aberr, 0.0)).r;
                float g = texture2D(u_tex, uv                    ).g;
                float b = texture2D(u_tex, uv + vec2(-aberr, 0.0)).b;

                // Vignette — deepest at corners, open in the centre
                float vx   = uv.x * (1.0 - uv.x);
                float vy   = uv.y * (1.0 - uv.y);
                float vign = pow(clamp(vx * vy * 20.0, 0.0, 1.0), 0.5);

                // Final alpha: partially transparent so site bg bleeds through beautifully
                float alpha = vign * 0.80;

                gl_FragColor = vec4(r, g, b, alpha);
            }
        `;

        const geo  = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
        const mat  = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false });
        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);

        // Mouse
        let mouseX = 0.5, mouseY = 0.5, targetX = 0.5, targetY = 0.5;
        window.addEventListener('mousemove', (e) => {
            targetX = e.clientX / window.innerWidth;
            targetY = e.clientY / window.innerHeight;
        });

        // Scroll
        let scrollVal = 0, targetScroll = 0;
        window.addEventListener('scroll', () => {
            const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
            targetScroll = window.scrollY / max;
        }, { passive: true });

        // Resize (debounced)
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                renderer.setSize(window.innerWidth, window.innerHeight);
                camera.left = window.innerWidth / -2; camera.right = window.innerWidth / 2;
                camera.top = window.innerHeight / 2; camera.bottom = window.innerHeight / -2;
                camera.updateProjectionMatrix();
                mesh.geometry.dispose();
                mesh.geometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
                uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
            }, 150);
        });

        // Render loop — pauses when tab is hidden
        const clock = new THREE.Clock();
        let isVisible = !document.hidden;
        document.addEventListener('visibilitychange', () => {
            isVisible = !document.hidden;
            if (isVisible) clock.start();
        });

        function animate() {
            requestAnimationFrame(animate);
            if (!isVisible) return;
            mouseX    += (targetX      - mouseX)    * 0.06;
            mouseY    += (targetY      - mouseY)    * 0.06;
            scrollVal += (targetScroll - scrollVal) * 0.04;
            uniforms.u_time.value   = clock.getElapsedTime();
            uniforms.u_mouse.value.set(mouseX, mouseY);
            uniforms.u_scroll.value = scrollVal;
            renderer.render(scene, camera);
        }
        animate();
    });
}
