import * as THREE from 'three';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from '../node_modules/three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import "../styles.css";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

// Enable shadow maps in the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;  // Enable shadows in renderer
renderer.shadowMap.type = THREE.PCFSoftShadowMap;  // Soft shadows for realism
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.minPolarAngle = 0;               
controls.maxPolarAngle = Math.PI / 2; 
controls.enableDamping = true; 
controls.dampingFactor = 0.1;

// Position the camera
camera.position.set(15, 25, 150);
controls.update();

// Add Ambient Light
// const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
// scene.add(ambientLight);

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

// // Optional: Add helper to visualize shadow camera
// const shadowHelper = new THREE.CameraHelper(sunlight.shadow.camera);
// scene.add(shadowHelper);

sunlight.shadow.bias = -0.001;  // Adjust this value as necessary

sunlight.shadow.mapSize.width = 4096;
sunlight.shadow.mapSize.height = 4096;

// Add Ground Plane to Receive Shadows
const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
const ground = new THREE.Mesh(planeGeometry, planeMaterial);
ground.rotation.x = -Math.PI / 2; // Make the plane horizontal
ground.position.y = -1; // Position it below your models
ground.receiveShadow = true; // Enable shadow reception
scene.add(ground);

const gltfLoader = new GLTFLoader();
const objLoader = new OBJLoader();

const cars = {};  // Object to store original and cloned car references

function loadModel(name, path, scale, positionY = 0, counter = 0, callback) {
    gltfLoader.load(path, function (gltf) {
        const model = gltf.scene;
        model.scale.set(scale, scale, scale);
        model.position.set(-counter, positionY, -90);
        model.castShadow = true;
        model.receiveShadow = true;

        // Initialize an array for this car if it doesn't exist yet
        if (!cars[name]) {
            cars[name] = [];
        }

        // Store the original model
        cars[name].push(model);

        // Traverse to apply shadow properties
        model.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material = child.material.clone();
                }
            }
        });

        scene.add(model);

        // Create clones with different orientations
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

            // Store each clone
            cars[name].push(clone);

            // Add clone to scene
            scene.add(clone);
        });

        if (callback) callback(model);
    }, undefined, function (error) {
        console.error('Error loading GLTF model:', error);
    });
}


// Load Models with Appropriate Scales and Positions
loadModel('Mustang','src/assets/shelby/scene.gltf', 450, 0,0, function() {
    console.log('Shelby loaded');
});
loadModel('Porsche','src/assets/porsche/scene.gltf', 5, 0.55,15, function() {
    console.log('Porsche loaded');
});
loadModel('Boxster','src/assets/boxster/scene.gltf', 1.35, 3.9,30, function() {
    console.log('Boxster loaded');
});
loadModel('Civic','src/assets/civic/scene.gltf', 500, 0,45, function() {
    console.log('Civic loaded');
});
loadModel('Focus','src/assets/focus/scene.gltf', 500, 0,60, function() {
    console.log('Focus loaded');
});




// Load OBJ Model
objLoader.load('src/assets/USARoad.obj', function (obj) {
    obj.scale.set(5, 5, 5); // Scale the model appropriately
    obj.position.set(0, 0, 0); // Position the model
    obj.rotation.x = -Math.PI / 2; // Rotate to lie flat
    obj.castShadow = true; 
    obj.receiveShadow = true; 

    // Ensure all child meshes cast and receive shadows
    obj.traverse(function(child) {
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

// Handle Window Resize
window.addEventListener('resize', function () {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});



// Movement speed for the light
const lightMovementSpeed = 5;

// Event listener for keydown events
window.addEventListener('keydown', function(event) {
    switch (event.key) {
        case 'w':
            // Move the light up along the y-axis
            sunlight.position.y += lightMovementSpeed;
            break;
        case 's':
            // Move the light down along the y-axis
            sunlight.position.y -= lightMovementSpeed;
            break;
        case 'a':
            // Move the light left along the x-axis
            sunlight.position.x -= lightMovementSpeed;
            break;
        case 'd':
            // Move the light right along the x-axis
            sunlight.position.x += lightMovementSpeed;
            break;
        case 'z':
            // Move the light forward along the z-axis (closer to the scene)
            sunlight.position.z -= lightMovementSpeed;
            break;
        case 'x':
            // Move the light backward along the z-axis (further from the scene)
            sunlight.position.z += lightMovementSpeed;
            break;
        default:
            // Ignore other keys
            break;
    }
});

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    controls.update(); // Update controls for damping
    renderer.render(scene, camera); // Render the scene

    // // Move Shelby car and its clones
    // if (cars['Mustang']) {
    //     cars['Mustang'].forEach((car) => {
    //         if (car.position.x < 100) {
    //             car.position.x += 1;
    //         } else {
    //             car.position.x = -100;
    //         }
    //     });
    // }

    // // Move Porsche car and its clones
    // if (cars['Porsche']) {
    //     cars['Porsche'].forEach((car) => {
    //         if (car.position.x < 100) {
    //             car.position.x += 2;
    //         } else {
    //             car.position.x = -100;
    //         }
    //     });
    // }

    if (cars['Focus']) {
        const secondClone = cars['Focus'][2]; // Second clone
        if (secondClone.position.x < 500) {
            secondClone.position.x += 2;
        } else {
            secondClone.position.x = -500;
        }
    }
}

animate();

 