import * as THREE from 'three';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from '../node_modules/three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import "../styles.css";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);

// Enable shadow maps in the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
controls.enableDamping = true;
controls.dampingFactor = 0.1;

// Position the camera
camera.position.set(15, 25, 150);
controls.update();

// Add Directional Light
const sunlight = new THREE.DirectionalLight(0xffffff, 5);
sunlight.position.set(50, 50, 50);
sunlight.castShadow = true;

// Configure shadow camera to encompass the scene
sunlight.shadow.camera.left = -200;
sunlight.shadow.camera.right = 200;
sunlight.shadow.camera.top = 200;
sunlight.shadow.camera.bottom = -200;
sunlight.shadow.camera.near = 0.5;
sunlight.shadow.camera.far = 500;

sunlight.shadow.bias = -0.001;
sunlight.shadow.mapSize.width = 4096;
sunlight.shadow.mapSize.height = 4096;
scene.add(sunlight);

// Add Ground Plane to Receive Shadows
const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
const ground = new THREE.Mesh(planeGeometry, planeMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1;
ground.receiveShadow = true;
scene.add(ground);

const gltfLoader = new GLTFLoader();
const objLoader = new OBJLoader();

// Store references to all loaded cars
let loadedCars = [];
let selectedCarIndex = 0; // Initially select the first car

// Function to handle GLTF model loading
function loadModel(path, scale, positionY = 0, counter = 0, callback) {
    gltfLoader.load(path, function (gltf) {
        const model = gltf.scene;
        model.scale.set(scale, scale, scale);
        model.position.set(-counter, positionY, -90); // Use counter for x-position
        model.castShadow = true;
        model.receiveShadow = true;

        // Traverse the model to ensure all meshes cast and receive shadows
        model.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.renderOrder = 1;
                if (child.material) {
                    child.material = child.material.clone();
                    child.material.depthWrite = true;
                }
            }
        });

        // Add the car to the scene and store it in the loadedCars array
        scene.add(model);
        loadedCars.push(model);

        // Create clones in different orientations
        const rotations = [Math.PI, Math.PI / 2, -Math.PI / 2];
        const positions = [
            new THREE.Vector3(counter, positionY, 90),    // Clone 1
            new THREE.Vector3(-90, positionY, counter),   // Clone 2
            new THREE.Vector3(90, positionY, -counter)    // Clone 3
        ];

        rotations.forEach((rot, index) => {
            const clone = model.clone();
            clone.rotation.y = rot;
            clone.position.copy(positions[index]);
            scene.add(clone);
        });

        if (callback) callback(model);
    }, undefined, function (error) {
        console.error('Error loading GLTF model:', error); // Log any errors
    });
}

// Load the cars
loadModel('src/assets/shelby/scene.gltf', 450, 0, 0, function () {
    console.log('Shelby loaded');
});
loadModel('src/assets/porsche/scene.gltf', 5, 0.55, 15, function () {
    console.log('Porsche loaded');
});
loadModel('src/assets/boxster/scene.gltf', 1.35, 3.9, 30, function () {
    console.log('Boxster loaded');
});
loadModel('src/assets/civic/scene.gltf', 500, 0, 45, function () {
    console.log('Civic loaded');
});
loadModel('src/assets/focus/scene.gltf', 500, 0, 60, function () {
    console.log('Focus loaded');
});

// Load OBJ model for the road
objLoader.load('src/assets/USARoad.obj', function (obj) {
    obj.scale.set(5, 5, 5);
    obj.position.set(0, 0, 0);
    obj.rotation.x = -Math.PI / 2;
    obj.castShadow = true;
    obj.receiveShadow = true;

    // Ensure all child meshes cast and receive shadows
    obj.traverse(function (child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
                child.material = child.material.clone();
            }
        }
    });
    scene.add(obj);
}, undefined, function (error) {
    console.error('Error loading OBJ model:', error);
});

// Event listener for car selection
window.addEventListener('keydown', function (event) {
    switch (event.key) {
        case '1':
            selectedCarIndex = 0;  // Select first car
            console.log('Car 1 selected');
            break;
        case '2':
            selectedCarIndex = 1;  // Select second car
            console.log('Car 2 selected');
            break;
        case '3':
            selectedCarIndex = 2;  // Select third car
            console.log('Car 3 selected');
            break;
        case '4':
            selectedCarIndex = 3;  // Select fourth car
            console.log('Car 4 selected');
            break;
        case '5':
            selectedCarIndex = 4;  // Select fifth car
            console.log('Car 5 selected');
            break;
        default:
            break;
    }
});

// Event listener for car movement (forward and backward)
const carMovementSpeed = 1;
window.addEventListener('keydown', function (event) {
    const selectedCar = loadedCars[selectedCarIndex];
    if (!selectedCar) return;

    switch (event.key) {
        case 'ArrowUp':
            selectedCar.position.z -= carMovementSpeed;  // Move the car forward along Z-axis
            break;
        case 'ArrowDown':
            selectedCar.position.z += carMovementSpeed;  // Move the car backward along Z-axis
            break;
        default:
            break;
    }
});

// Handle Window Resize
window.addEventListener('resize', function () {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Update controls for damping
    renderer.render(scene, camera); // Render the scene
}

animate();
