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
        const fuselageGeometry = new THREE.CylinderGeometry(0.3, 0.2, 3, 8);
        const fuselageMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x333333,
            shininess: 100,
            specular: 0x555555
        });
        const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        fuselage.rotation.z = Math.PI / 2;
        group.add(fuselage);
        
        // Cockpit
        const cockpitGeometry = new THREE.SphereGeometry(0.25, 8, 8);
        const cockpitMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x0000ff,
            transparent: true,
            opacity: 0.7
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.x = 1.2;
        group.add(cockpit);
        
        // Wings
        const wingGeometry = new THREE.BoxGeometry(2.5, 0.1, 0.8);
        const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
        const wing = new THREE.Mesh(wingGeometry, wingMaterial);
        wing.position.z = 0.2;
        group.add(wing);
        
        // Tail wings
        const tailWingGeometry = new THREE.BoxGeometry(1, 0.1, 0.5);
        const tailWing = new THREE.Mesh(tailWingGeometry, wingMaterial);
        tailWing.position.x = -1.2;
        tailWing.position.z = 0.1;
        group.add(tailWing);
        
        // Vertical stabilizer
        const stabilizerGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.4);
        const stabilizer = new THREE.Mesh(stabilizerGeometry, wingMaterial);
        stabilizer.position.x = -1.2;
        stabilizer.position.y = 0.4;
        group.add(stabilizer);
        
        // Engine nozzles
        const nozzleGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.5, 8);
        const nozzleMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
        const leftNozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
        leftNozzle.position.x = -1.4;
        leftNozzle.position.y = -0.1;
        leftNozzle.position.z = 0.2;
        leftNozzle.rotation.z = Math.PI / 2;
        group.add(leftNozzle);
        
        const rightNozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
        rightNozzle.position.x = -1.4;
        rightNozzle.position.y = -0.1;
        rightNozzle.position.z = -0.2;
        rightNozzle.rotation.z = Math.PI / 2;
        group.add(rightNozzle);
        
        // Missiles
        const missileGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6);
        const missileMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        
        for (let i = 0; i < 4; i++) {
            const missile = new THREE.Mesh(missileGeometry, missileMaterial);
            missile.position.x = 0.5;
            missile.position.y = 0;
            missile.position.z = 0.4 + i * 0.3;
            missile.rotation.z = Math.PI / 2;
            group.add(missile);
        }
        
        // Add fighter to scene
        this.fighter = group;
        this.scene.add(this.fighter);
        
        // Add label
        this.addLabel();
    }

    addLabel() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        
        // Draw text
        context.fillStyle = 'rgba(0, 0, 0, 0)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = '40px Arial';
        context.fillStyle = '#00ffff';
        context.textAlign = 'center';
        context.fillText('FX-99', canvas.width / 2, 50);
        
        context.font = '24px Arial';
        context.fillText('NEMESIS', canvas.width / 2, 90);
        
        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.y = 2;
        sprite.scale.set(4, 2, 1);
        
        this.scene.add(sprite);
    }

    onWindowResize(container) {
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.autoRotate && this.fighter) {
            this.fighter.rotation.y += this.rotationSpeed;
        }
        
        if (this.controls) {
            this.controls.update();
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    rotateLeft() {
        if (this.fighter) {
            this.fighter.rotation.y += Math.PI / 8;
        }
    }

    rotateRight() {
        if (this.fighter) {
            this.fighter.rotation.y -= Math.PI / 8;
        }
    }

    zoomIn() {
        this.camera.position.multiplyScalar(0.9);
    }

    zoomOut() {
        this.camera.position.multiplyScalar(1.1);
    }

    toggleAutoRotate() {
        this.autoRotate = !this.autoRotate;
    }

    destroy() {
        if (this.renderer && this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
    }
}

// Export to global scope
window.hangar3D = new Hangar3D();
