/**
 * WebGL 3D Background using Three.js
 * Creates an interconnected particle/node network representing AI Neural Networks
 */

// Scene Setup
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();

// Camera Setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 50;

// Renderer Setup
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Particle / Node Variables
const particleCount = 500;
const distanceThreshold = 18;

// Arrays to hold geometry data
const positions = new Float32Array(particleCount * 3);
const velocities = [];
const colors = new Float32Array(particleCount * 3);

// Color palette
const colorCyan = new THREE.Color(0x00f2fe);
const colorPurple = new THREE.Color(0x4facfe);
const colorWhite = new THREE.Color(0xffffff);

// Initialize Particles
for(let i = 0; i < particleCount; i++) {
    const x = (Math.random() - 0.5) * 120;
    const y = (Math.random() - 0.5) * 120;
    const z = (Math.random() - 0.5) * 120;

    positions[i*3] = x;
    positions[i*3+1] = y;
    positions[i*3+2] = z;

    // Assign random colors between cyan and purple
    const colorMix = Math.random();
    const particleColor = new THREE.Color().lerpColors(colorCyan, colorPurple, colorMix);

    // Add some white highlights
    if (Math.random() > 0.8) {
        particleColor.lerp(colorWhite, 0.5);
    }

    colors[i*3] = particleColor.r;
    colors[i*3+1] = particleColor.g;
    colors[i*3+2] = particleColor.b;

    velocities.push({
        x: (Math.random() - 0.5) * 0.04,
        y: (Math.random() - 0.5) * 0.04,
        z: (Math.random() - 0.5) * 0.04
    });
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

// Particle Material (Glowing dots with color)
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.7,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
});

const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particleSystem);

// Lines Setup to connect valid nodes
const linesMaterial = new THREE.LineBasicMaterial({
    color: 0x4facfe,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending
});

const linesGeometry = new THREE.BufferGeometry();
const lineNetwork = new THREE.LineSegments(linesGeometry, linesMaterial);
scene.add(lineNetwork);

// Add subtle fog for depth
scene.fog = new THREE.FogExp2(0x030308, 0.008);

// Mouse Interaction
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX) * 0.05;
    mouseY = (event.clientY - windowHalfY) * 0.05;
});

// Window Resize Handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// Clock for frame independent movement
const clock = new THREE.Clock();

// Animation Loop
const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // Mouse parallax effect on camera
    targetX = mouseX * 0.5;
    targetY = mouseY * 0.5;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (-targetY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);


    // Update Particle Positions
    const positions = particleSystem.geometry.attributes.position.array;

    for(let i = 0; i < particleCount; i++) {
        // Move by velocity
        positions[i*3]   += velocities[i].x;
        positions[i*3+1] += velocities[i].y;
        positions[i*3+2] += velocities[i].z;

        // Bounce off bounds
        if(positions[i*3] > 60 || positions[i*3] < -60) velocities[i].x *= -1;
        if(positions[i*3+1] > 60 || positions[i*3+1] < -60) velocities[i].y *= -1;
        if(positions[i*3+2] > 60 || positions[i*3+2] < -60) velocities[i].z *= -1;
    }

    particleSystem.geometry.attributes.position.needsUpdate = true;

    // Recalculate Lines
    const linePositions = [];

    for(let i = 0; i < particleCount; i++) {
        for(let j = i + 1; j < particleCount; j++) {
            const dx = positions[i*3] - positions[j*3];
            const dy = positions[i*3+1] - positions[j*3+1];
            const dz = positions[i*3+2] - positions[j*3+2];
            const distSq = dx*dx + dy*dy + dz*dz;

            if(distSq < distanceThreshold * distanceThreshold) {
                linePositions.push(
                    positions[i*3], positions[i*3+1], positions[i*3+2],
                    positions[j*3], positions[j*3+1], positions[j*3+2]
                );
            }
        }
    }

    lineNetwork.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

    // Slow scene rotation
    scene.rotation.y = elapsedTime * 0.04;
    scene.rotation.x = elapsedTime * 0.015;

    // Render
    renderer.render(scene, camera);

    window.requestAnimationFrame(tick);
};

tick();
