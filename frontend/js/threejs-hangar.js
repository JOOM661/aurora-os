// 3D Hangar with Three.js

class Hangar3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.fighter = null;
        this.controls = null;
        this.lights = [];
        this.rotationSpeed = 0.005;
        this.autoRotate = true;
    }

    init(containerId) {
        // Get container
        const container = document.getElementById(containerId);
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(5, 3, 5);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);
        
        // Add lights
        this.addLights();
        
        // Create fighter jet
        this.createFighterJet();
        
        // Add grid helper
        const gridHelper = new THREE.GridHelper(10, 10, 0x00ff00, 0x003300);
        this.scene.add(gridHelper);
        
        // Add axes helper
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);
        
        // Add orbit controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(container));
        
        // Start animation loop
        this.animate();
    }

    addLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 5);
        this.scene.add(directionalLight);
        
        // Point light (hangar lights)
        const pointLight = new THREE.PointLight(0x00ffff, 0.5, 20);
        pointLight.position.set(0, 5, 0);
        this.scene.add(pointLight);
        
        this.lights.push(ambientLight, directionalLight, pointLight);
    }

    createFighterJet() {
        const group = new THREE.Group();
        
        // Fuselage (main body)
        const fuselageGeometry = new THREE.CylinderGeometry(0.3, 0.2,
