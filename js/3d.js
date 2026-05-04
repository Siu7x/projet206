import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

try {
    const container = document.querySelector('.model-3d-container');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingProgress = document.getElementById('loading-progress');
    const scene = new THREE.Scene();
    
    // Caméra mieux placée
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    
    // Ajustement de la distance selon la largeur de l'écran
    if (window.innerWidth <= 1024 && window.innerWidth > 768) {
        camera.position.set(0, 0.5, 14); // Plus loin sur iPad
    } else {
        camera.position.set(0, 0.5, 11);
    }

    // OPTIMISATION : Désactiver l'anti-aliasing sur mobile pour plus de fluidité
    const renderer = new THREE.WebGLRenderer({ 
        antialias: window.innerWidth > 768, 
        alpha: true 
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    // OPTIMISATION : Limiter le pixel ratio à 2 pour éviter de faire lagger les mobiles
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // LUMIÈRES (Indispensable pour le relief)
    const ambientLight = new THREE.AmbientLight(0xffffff, 3.5); // Augmenté
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 3); // Augmenté
    sunLight.position.set(7, 15, 4);
    scene.add(sunLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 2); // Ajout d'une lumière arrière
    backLight.position.set(-7, 5, -10);
    scene.add(backLight);

    // --- Loading Manager ---
    const manager = new THREE.LoadingManager();

    manager.onStart = function (url, itemsLoaded, itemsTotal) {
        console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
        if (loadingOverlay) {
            loadingOverlay.classList.add('visible'); // Add visible class to trigger transition and display flex
        }
    };

    manager.onProgress = function (url, itemsLoaded, itemsTotal) {
        console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
        if (loadingProgress) {
            const progress = Math.round((itemsLoaded / itemsTotal) * 100);
            loadingProgress.textContent = `${progress}%`;
        }
    };

    manager.onLoad = function () {
        console.log('Loading complete!');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('visible'); // Remove visible class to trigger fade out
            // After transition, set display to none to fully remove from layout
            loadingOverlay.addEventListener('transitionend', () => {
                if (!loadingOverlay.classList.contains('visible')) { // Check if it's actually hidden
                    loadingOverlay.style.display = 'none';
                }
            }, { once: true });
        }
    };

    manager.onError = function (url) {
        console.error('There was an error loading ' + url);
        // Hide on error too
        if (loadingOverlay) loadingOverlay.classList.remove('visible');
    };

    // --- OPTIMISATION : Configuration du décodeur Draco ---
    const dracoLoader = new DRACOLoader();
    // Utilisation du CDN unpkg lié aux librairies officielles de Three.js (plus fiable)
    dracoLoader.setDecoderPath('https://unpkg.com/three/examples/jsm/libs/draco/gltf/');
    
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader); // On connecte Draco au GLTFLoader
    
    // Pass the manager to the loaders
    dracoLoader.manager = manager;
    loader.manager = manager;
    let carPivot; // Variable pour contrôler la rotation de la voiture
    let loadingStarted = false;

    const loadModel = () => {
        loader.load('../modele-3d/2002_peugeot_206_gti.glb', (gltf) => {
            const model = gltf.scene;
            
            // 1. Centrer parfaitement le modèle
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
            
            // 2. Créer un groupe "Pivot" et l'agrandir
            carPivot = new THREE.Group();
            carPivot.add(model);
            carPivot.scale.set(1, 1, 1);
            
            scene.add(carPivot);
            console.log("✅ Modèle 3D chargé avec succès !");
        }, undefined, (error) => {
            console.error("Erreur chargement GLB:", error);
        });
    };

    // OPTIMISATION : Ne calculer l'animation que si la voiture est visible à l'écran
    let isVisible = false;
    const observer = new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;

        // LAZY LOADING : On ne télécharge le modèle que lorsqu'il approche de l'écran
        if (isVisible && !loadingStarted) {
            loadingStarted = true;
            loadModel();
        }
    }, { rootMargin: '200px' }); // On commence à charger 200px avant l'arrivée dans le viewport

    observer.observe(container);

    function animate3D() {
        requestAnimationFrame(animate3D);
        
        if (isVisible) {
            if (carPivot) {
                carPivot.rotation.y += 0.001; // On tourne juste la voiture, pas toute la scène !
            }
            renderer.render(scene, camera);
        }
    }
    animate3D();

    // Redimensionnement fluide
    window.addEventListener('resize', () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        // Sécurité : éviter que l'inspecteur d'éléments fasse crasher la caméra avec une hauteur de 0
        if (width > 0 && height > 0) {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        }
    });

} catch (e) {
    console.error("Erreur Three.js:", e); // Hide on general Three.js error
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('visible');
        loadingOverlay.addEventListener('transitionend', () => {
            if (!loadingOverlay.classList.contains('visible')) {
                loadingOverlay.style.display = 'none';
            }
        }, { once: true });
    }
}