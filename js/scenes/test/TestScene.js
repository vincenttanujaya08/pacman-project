// js/scenes/test/TestScene.js
// Simple test scene to verify everything works

import BaseScene from "../BaseScene.js";

export default class TestScene extends BaseScene {
  constructor(name, renderer, camera) {
    super(name, renderer, camera);

    this.cube = null;
    this.time = 0;
  }

  async init() {
    await super.init();

    // Create a spinning cube
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshPhongMaterial({
      color: 0xffd700, // Pac-Man yellow
      shininess: 100,
    });
    this.cube = new THREE.Mesh(geometry, material);
    this.cube.castShadow = true;
    this.cube.receiveShadow = true;
    this.addObject(this.cube, "testCube");

    // Add floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    floor.receiveShadow = true;
    this.addObject(floor, "floor");

    // Add some Pac-Man colored spheres
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffa500]; // Ghost colors
    for (let i = 0; i < 4; i++) {
      const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
      const sphereMaterial = new THREE.MeshPhongMaterial({ color: colors[i] });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.castShadow = true;

      const angle = (i / 4) * Math.PI * 2;
      sphere.position.x = Math.cos(angle) * 5;
      sphere.position.y = 0;
      sphere.position.z = Math.sin(angle) * 5;

      this.addObject(sphere, `sphere${i}`);
    }

    // Add text
    const textSprite = this.createTextSprite("PAC-MAN 45TH", {
      fontSize: 64,
      textColor: "#FFD700",
    });
    textSprite.position.set(0, 4, 0);
    textSprite.scale.set(8, 2, 1);
    this.addObject(textSprite, "titleText");

    // Enhanced lighting for better visuals
    this.scene.remove(this.lights[0]); // Remove default lights
    this.scene.remove(this.lights[1]);
    this.lights = [];

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);
    this.lights.push(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    this.scene.add(mainLight);
    this.lights.push(mainLight);

    const fillLight = new THREE.DirectionalLight(0x4444ff, 0.3);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);
    this.lights.push(fillLight);
  }

  enter() {
    super.enter();

    console.log("[TestScene] Starting cinematic camera demo...");

    // Demo cinematic camera movement
    this.demoCinematicCamera();
  }

  demoCinematicCamera() {
    // Get camera controller from app
    const cameraController = window.app.cameraController;

    // Only do cinematic if in cinematic mode
    if (cameraController.mode !== "cinematic") return;

    // Move camera to starting position
    cameraController.setPosition(
      new THREE.Vector3(0, 3, 15),
      new THREE.Vector3(0, 0, 0)
    );

    // Wait a bit, then start camera movement
    setTimeout(() => {
      // Move closer to the cube
      cameraController.moveTo(
        new THREE.Vector3(5, 5, 8),
        new THREE.Vector3(0, 0, 0),
        3000,
        cameraController.easeInOutCubic,
        () => {
          console.log("Camera movement 1 complete!");

          // After that, orbit around
          setTimeout(() => {
            console.log("Starting orbit...");
            cameraController.orbitAround(
              new THREE.Vector3(0, 0, 0),
              10,
              0.5, // speed
              5 // height
            );
          }, 1000);
        }
      );
    }, 500);
  }

  update(deltaTime) {
    super.update(deltaTime);

    if (!this.isActive) return;

    this.time += deltaTime;

    // Rotate cube
    if (this.cube) {
      this.cube.rotation.x += 0.001 * deltaTime;
      this.cube.rotation.y += 0.002 * deltaTime;

      // Bounce
      this.cube.position.y = Math.sin(this.time * 0.001) * 0.5;
    }

    // Animate spheres
    for (let i = 0; i < 4; i++) {
      const sphere = this.getObject(`sphere${i}`);
      if (sphere) {
        const angle = (i / 4) * Math.PI * 2 + this.time * 0.0005;
        sphere.position.x = Math.cos(angle) * 5;
        sphere.position.z = Math.sin(angle) * 5;
        sphere.position.y = Math.sin(this.time * 0.002 + i) * 0.5;
      }
    }
  }

  exit() {
    super.exit();

    // Stop camera orbit if active
    const cameraController = window.app.cameraController;
    if (cameraController) {
      cameraController.stopCinematic();
    }
  }
}
