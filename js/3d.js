import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

try {
    const container = document.querySelector('.model-3d-container');
    const scene = new THREE.Scene();
    
    // Caméra mieux placée
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0.5, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    // OPTIMISATION : Limiter le pixel ratio à 2 pour éviter de faire lagger les mobiles
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // LUMIÈRES (Indispensable pour le relief)
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2);
    sunLight.position.set(7, 15, 4);
    scene.add(sunLight);

    // --- OPTIMISATION : Configuration du décodeur Draco ---
    const dracoLoader = new DRACOLoader();
    // Utilisation du CDN unpkg lié aux librairies officielles de Three.js (plus fiable)
    dracoLoader.setDecoderPath('https://unpkg.com/three/examples/jsm/libs/draco/gltf/');
    
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader); // On connecte Draco au GLTFLoader

    let carPivot; // Variable pour contrôler la rotation de la voiture

    loader.load('../modele-3d/2002_peugeot_206_gti.glb', (gltf) => {
        const model = gltf.scene;
        
        // 1. Centrer parfaitement le modèle (corrige le problème de décalage)
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        
        // 2. Créer un groupe "Pivot" et l'agrandir
        carPivot = new THREE.Group();
        carPivot.add(model);
        carPivot.scale.set(1, 1, 1); // 👈 MODIFIE ICI : Passe à 3.0 ou 4.0 si encore trop petit
        
        scene.add(carPivot);
        console.log("✅ Modèle 3D chargé avec succès dans la scène !");
    }, undefined, (error) => {
        console.error("Erreur chargement GLB:", error);
    });

    // OPTIMISATION : Ne calculer l'animation que si la voiture est visible à l'écran
    let isVisible = true;
    const observer = new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
    });
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
    console.error("Erreur Three.js:", e);
}