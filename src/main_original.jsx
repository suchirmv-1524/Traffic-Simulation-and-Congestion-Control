import * as THREE from 'three';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from '../node_modules/three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import "../styles.css";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);

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

camera.position.set(15, 25, 150);
controls.update();

const sunlight = new THREE.DirectionalLight(0xffffff, 5);
sunlight.position.set(50, 50, 50);
sunlight.castShadow = true;
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
//scene.add(new THREE.AmbientLight(0x404040)); // Add ambient light

const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
const ground = new THREE.Mesh(planeGeometry, planeMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1;
ground.receiveShadow = true;
scene.add(ground);

const gltfLoader = new GLTFLoader();
const objLoader = new OBJLoader();

const cars = {};  // Object to store original and cloned car references

function loadModel(name, path, scale, positionY = 0, counter = 0, callback) {
    gltfLoader.load(path, (gltf) => {
        const model = gltf.scene;
        model.scale.set(scale, scale, scale);
        model.position.set(-counter, positionY, -90); // Use counter for x-position
        model.castShadow = true;
        model.receiveShadow = true;

        // Initialize an array for this car if it doesn't exist yet
        if (!cars[name]) {
            cars[name] = [];
        }

        // Store the original model
        cars[name].push(model);

        model.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material = child.material.clone();
                child.material.depthWrite = true;
            }
        });

        scene.add(model);
        //loadedCars.push(model);

        // Create clones in different orientations
        const rotations = [Math.PI, Math.PI / 2, -Math.PI / 2];
        const positions = [
            new THREE.Vector3(counter, positionY, 90),    
            new THREE.Vector3(-90, positionY, counter),   
            new THREE.Vector3(90, positionY, -counter)    
        ];

        rotations.forEach((rot, index) => {
            const clone = model.clone();
            clone.rotation.y = rot;
            clone.position.copy(positions[index]);
            // Store each clone
            cars[name].push(clone);
            scene.add(clone);
        });

        if (callback) callback(model);
    }, undefined, (error) => {
        console.error('Error loading GLTF model:', error); // Log any errors
    });
}

/*// Load the cars
const carModels = [
    { path: '/assets/shelby/scene.gltf', scale: 450, positionY: 0, counter: 0 },
    { path: '/assets/porsche/scene.gltf', scale: 5, positionY: 0.55, counter: 15 },
    { path: '/assets/boxster/scene.gltf', scale: 1.35, positionY: 3.9, counter: 30 },
    { path: '/assets/civic/scene.gltf', scale: 500, positionY: 0, counter: 45 },
    { path: '/assets/focus/scene.gltf', scale: 500, positionY: 0, counter: 60 }
];

carModels.forEach(({ path, scale, positionY, counter }) => {
    loadModel(path, scale, positionY, counter, () => {
        console.log(`${path} loaded`);
    });
}); */

// Load Models with Appropriate Scales and Positions
loadModel('Mustang','/assets/shelby/scene.gltf', 450, 0,0, function() {
    console.log('Shelby loaded');
});
loadModel('Porsche','/assets/porsche/scene.gltf', 5, 0.55,15, function() {
    console.log('Porsche loaded');
});
loadModel('Boxster','/assets/boxster/scene.gltf', 1.35, 3.9,30, function() {
    console.log('Boxster loaded');
});
loadModel('Civic','/assets/civic/scene.gltf', 500, 0,45, function() {
    console.log('Civic loaded');
});
loadModel('Focus','/assets/focus/scene.gltf', 500, 0,60, function() {
    console.log('Focus loaded');
});

// Load OBJ model for the road
objLoader.load('/assets/USARoad.obj', (obj) => {
    obj.scale.set(5, 5, 5);
    obj.position.set(0, 0, 0);
    obj.rotation.x = -Math.PI / 2;
    obj.castShadow = true;
    obj.receiveShadow = true;

    obj.traverse(child => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material = child.material.clone();
        }
    });
    scene.add(obj);
}, undefined, (error) => {
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

// Event listener for car selection
window.addEventListener('keydown', (event) => {
    if (event.key >= '1' && event.key <= '5') {
        selectedCarIndex = parseInt(event.key) - 1; // Select car based on key pressed
        console.log(`Car ${selectedCarIndex + 1} selected`);
    }
});

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