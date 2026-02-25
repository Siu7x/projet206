import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

try {
    const container = document.querySelector('.model-3d-container');
    const scene = new THREE.Scene();
    
    // Caméra mieux placée
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0.5, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // LUMIÈRES (Indispensable pour le relief)
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2);
    sunLight.position.set(5, 10, 7.5);
    sunLight.position.set(2, 5, 7.5);
    sunLight.position.set(7, 15, 4);
    scene.add(sunLight);

    const loader = new GLTFLoader();
    loader.load('../modele-3d/2002_peugeot_206_gti.glb', (gltf) => {
        const model = gltf.scene;
        
        // Ajustement automatique de la taille (au cas où le modèle est géant)
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center); // Centre le modèle
        
        scene.add(model);
    }, undefined, (error) => {
        console.error("Erreur chargement GLB:", error);
    });

    function animate3D() {
        requestAnimationFrame(animate3D);
        scene.rotation.y += 0.003; // Rotation légère auto
        renderer.render(scene, camera);
    }
    animate3D();

    // Redimensionnement fluide
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

} catch (e) {
    console.error("Erreur Three.js:", e);
}