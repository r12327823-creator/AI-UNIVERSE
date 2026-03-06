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
    alpha: true, // Transparent b/g so CSS shows through (if needed)
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Particle / Node Variables
const particleCount = 400;
const distanceThreshold = 15; // How close nodes must be to connect lines

// Arrays to hold geometry data
const positions = new Float32Array(particleCount * 3);
const velocities = [];

// Initialize Particles
for(let i = 0; i < particleCount; i++) {
    const x = (Math.random() - 0.5) * 120; // Spread x
    const y = (Math.random() - 0.5) * 120; // Spread y
    const z = (Math.random() - 0.5) * 120; // Spread z
    
    positions[i*3] = x;
    positions[i*3+1] = y;
    positions[i*3+2] = z;
    
    // Give each particle a slight random velocity
    velocities.push({
        x: (Math.random() - 0.5) * 0.05,
        y: (Math.random() - 0.5) * 0.05,
        z: (Math.random() - 0.5) * 0.05
    });
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// Particle Material (Glowing cyan dots)
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.5,
    color: 0x00f2fe,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particleSystem);

// Lines Setup to connect valid nodes
const linesMaterial = new THREE.LineBasicMaterial({
    color: 0x4facfe,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending
});

const linesGeometry = new THREE.BufferGeometry();
// Create a separate mesh for lines
const lineNetwork = new THREE.LineSegments(linesGeometry, linesMaterial);
scene.add(lineNetwork);

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
    const lineColors = []; // Optional if gradient needed
    
    // O(n^2) check. Since n=400, ~80k checks. Browsers handle this ok, but can optimize with Octrees if slow.
    for(let i = 0; i < particleCount; i++) {
        for(let j = i + 1; j < particleCount; j++) {
            const dx = positions[i*3] - positions[j*3];
            const dy = positions[i*3+1] - positions[j*3+1];
            const dz = positions[i*3+2] - positions[j*3+2];
            const distSq = dx*dx + dy*dy + dz*dz;
            
            if(distSq < distanceThreshold * distanceThreshold) {
                // Add line points
                linePositions.push(
                    positions[i*3], positions[i*3+1], positions[i*3+2],
                    positions[j*3], positions[j*3+1], positions[j*3+2]
                );
            }
        }
    }
    
    lineNetwork.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    
    // Slow scene rotation
    scene.rotation.y = elapsedTime * 0.05;
    scene.rotation.x = elapsedTime * 0.02;

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
};

tick();
