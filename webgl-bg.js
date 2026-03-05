/**
 * Interactive WebGL Background (Three.js)
 * Implements a sultry, anti-gravity floating portrait with mouse-reactive liquid distortion.
 */

// We wait for DOMContentLoaded or let the script defer
document.addEventListener('DOMContentLoaded', () => {
    // Only init if not on a low-end mobile device for performance
    if (window.innerWidth < 768 && !window.matchMedia("(pointer: fine)").matches) {
        return; // Skip WebGL on most phones to save battery/performance
    }

    initWebGLBackground();
});

function initWebGLBackground() {
    const container = document.getElementById('webgl-container');
    if (!container || !window.THREE) return;

    // Scene setup
    const scene = new THREE.Scene();
    
    // Camera setup
    const camera = new THREE.OrthographicCamera(
        window.innerWidth / -2, window.innerWidth / 2,
        window.innerHeight / 2, window.innerHeight / -2,
        1, 1000
    );
    camera.position.z = 1;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Cap at 1.5x for performance
    renderer.domElement.style.willChange = 'transform';
    container.appendChild(renderer.domElement);

    // Texture Loader
    const loader = new THREE.TextureLoader();
    // Using the placeholder portrait generated
    const textureUrl = './assets/placeholder-portrait.png';

    loader.load(textureUrl, (texture) => {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        // Custom Shader Material for Liquid Distortion
        const uniforms = {
            u_time: { value: 0.0 },
            u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
            u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            u_tex: { value: texture },
            u_image_aspect: { value: texture.image.width / texture.image.height }
        };

        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform float u_time;
            uniform vec2 u_mouse;
            uniform vec2 u_resolution;
            uniform sampler2D u_tex;
            uniform float u_image_aspect;

            varying vec2 vUv;

            void main() {
                // Background cover logic for aspect ratio
                vec2 ratio = vec2(
                    min((u_resolution.x / u_resolution.y) / u_image_aspect, 1.0),
                    min((u_resolution.y / u_resolution.x) * u_image_aspect, 1.0)
                );
                
                vec2 uv = vec2(
                    vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
                    vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
                );

                // Liquid distortion based on mouse
                vec2 mouse = u_mouse;
                // invert y for webgl coordinates
                mouse.y = 1.0 - mouse.y; 

                float dist = distance(uv, mouse);
                float effect = smoothstep(0.4, 0.0, dist);
                
                // Add gentle anti-gravity wavy breathing to the whole image
                vec2 wave = vec2(
                    sin(uv.y * 10.0 + u_time * 0.5) * 0.005,
                    cos(uv.x * 10.0 + u_time * 0.5) * 0.005
                );

                // Mouse push effect
                vec2 dir = normalize(uv - mouse);
                vec2 distortion = wave + (dir * effect * 0.02);

                vec4 color = texture2D(u_tex, uv + distortion);

                // Add slight color aberration/tinting for futuristic high-fashion vibe
                float tintR = texture2D(u_tex, uv + distortion + vec2(0.002, 0.0)).r;
                float tintB = texture2D(u_tex, uv + distortion - vec2(0.002, 0.0)).b;
                
                // Opacity fade to integrate with existing gradient background
                float alphaFade = 1.0 - smoothstep(0.5, 1.0, uv.y); // Fade out at the bottom

                // Output final color mixed with aberration
                gl_FragColor = vec4(tintR, color.g, tintB, color.a * 0.75 * alphaFade); 
            }
        `;

        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            depthWrite: false
        });

        // Create Plane spanning the whole screen
        const geometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // Mouse interaction
        let mouseX = 0.5;
        let mouseY = 0.5;
        let targetMouseX = 0.5;
        let targetMouseY = 0.5;

        // Listen on window for broad movement
        window.addEventListener('mousemove', (e) => {
            targetMouseX = e.clientX / window.innerWidth;
            targetMouseY = e.clientY / window.innerHeight;
        });

        // Handle resize (debounced to avoid thrashing)
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                renderer.setSize(window.innerWidth, window.innerHeight);
                camera.left = window.innerWidth / -2;
                camera.right = window.innerWidth / 2;
                camera.top = window.innerHeight / 2;
                camera.bottom = window.innerHeight / -2;
                camera.updateProjectionMatrix();
                mesh.geometry.dispose();
                mesh.geometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
                uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
            }, 150);
        });

        // Animation Loop — paused when tab is hidden to save GPU/CPU
        const clock = new THREE.Clock();
        let rafId = null;
        let isVisible = !document.hidden;

        function animate() {
            rafId = requestAnimationFrame(animate);
            if (!isVisible) return; // Skip render when tab hidden

            // Smooth mouse interpolation (LERP)
            mouseX += (targetMouseX - mouseX) * 0.05;
            mouseY += (targetMouseY - mouseY) * 0.05;

            uniforms.u_time.value = clock.getElapsedTime();
            uniforms.u_mouse.value.set(mouseX, mouseY);

            renderer.render(scene, camera);
        }

        document.addEventListener('visibilitychange', () => {
            isVisible = !document.hidden;
            if (isVisible) clock.start(); // Restart clock so time doesn't jump
        });

        animate();
    });
}
