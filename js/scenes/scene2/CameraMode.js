// js/scenes/scene2/CameraMode.js
// Advanced camera system: FPS + Third Person modes

export default class CameraMode {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    // Current mode
    this.mode = "third"; // "third" or "fps"

    // Player position (will be set dynamically by Scene2)
    this.playerPosition = new THREE.Vector3(0, 50, 100);

    // Red sphere (target for third person)
    this.targetSphere = null;

    // Third person state
    this.thirdPerson = {
      distance: 80,
      azimuth: 0,
      elevation: 0.3,
      minElevation: -Math.PI / 3,
      maxElevation: Math.PI / 2.5,
    };

    // FPS state
    this.fps = {
      yaw: 0,
      pitch: 0,
      minPitch: -Math.PI / 2.5,
      maxPitch: Math.PI / 2.5,
    };

    // Input
    this.keys = {};
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.isPointerLocked = false;

    // Crosshair for FPS
    this.crosshair = null;

    this.init();
  }

  init() {
    // Create red sphere
    const sphereGeom = new THREE.SphereGeometry(2, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.6,
      wireframe: true,
    });
    this.targetSphere = new THREE.Mesh(sphereGeom, sphereMat);
    this.targetSphere.position.copy(this.playerPosition);
    this.scene.add(this.targetSphere);

    // Create crosshair
    this.crosshair = document.createElement("div");
    this.crosshair.style.position = "fixed";
    this.crosshair.style.top = "50%";
    this.crosshair.style.left = "50%";
    this.crosshair.style.transform = "translate(-50%, -50%)";
    this.crosshair.style.width = "4px";
    this.crosshair.style.height = "4px";
    this.crosshair.style.backgroundColor = "white";
    this.crosshair.style.borderRadius = "50%";
    this.crosshair.style.pointerEvents = "none";
    this.crosshair.style.zIndex = "1000";
    this.crosshair.style.boxShadow = "0 0 0 2px black";
    this.crosshair.style.display = "none";
    document.body.appendChild(this.crosshair);

    // Setup event listeners
    this.setupEventListeners();

    // Start in third person
    this.setMode("third");

    console.log("✅ Camera mode system initialized");
    console.log("   Press [V] to toggle Third Person / FPS");
  }

  setupEventListeners() {
    // Keyboard
    this.onKeyDown = (e) => {
      const key = e.key.toLowerCase();
      this.keys[key] = true;

      // Toggle mode with V key
      if (key === "v") {
        this.toggleMode();
      }
    };

    this.onKeyUp = (e) => {
      const key = e.key.toLowerCase();
      this.keys[key] = false;
    };

    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);

    // Mouse for third person
    this.onMouseDown = (e) => {
      if (this.mode === "third") {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      } else if (this.mode === "fps") {
        this.renderer.domElement.requestPointerLock();
      }
    };

    this.onMouseUp = () => {
      this.isDragging = false;
    };

    this.onMouseMove = (e) => {
      if (this.mode === "third" && this.isDragging) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        this.thirdPerson.azimuth -= dx * 0.01;
        this.thirdPerson.elevation -= dy * 0.01;
        this.thirdPerson.elevation = Math.max(
          this.thirdPerson.minElevation,
          Math.min(this.thirdPerson.maxElevation, this.thirdPerson.elevation)
        );
      }
    };

    this.renderer.domElement.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    this.renderer.domElement.addEventListener("mousemove", this.onMouseMove);

    // Mouse for FPS (pointer lock)
    this.onPointerMove = (e) => {
      if (this.mode === "fps" && this.isPointerLocked) {
        const sensitivity = 0.002;
        this.fps.yaw -= e.movementX * sensitivity;
        this.fps.pitch -= e.movementY * sensitivity;

        this.fps.pitch = Math.max(
          this.fps.minPitch,
          Math.min(this.fps.maxPitch, this.fps.pitch)
        );
      }
    };

    document.addEventListener("mousemove", this.onPointerMove);

    // Pointer lock change
    this.onPointerLockChange = () => {
      this.isPointerLocked =
        document.pointerLockElement === this.renderer.domElement;
    };

    document.addEventListener("pointerlockchange", this.onPointerLockChange);

    // Scroll for zoom
    this.onWheel = (e) => {
      if (this.mode === "third") {
        e.preventDefault();
        this.thirdPerson.distance += e.deltaY * 0.05;
        this.thirdPerson.distance = Math.max(
          20,
          Math.min(150, this.thirdPerson.distance)
        );
      }
    };

    this.renderer.domElement.addEventListener("wheel", this.onWheel, {
      passive: false,
    });

    // Window blur (reset keys)
    this.onBlur = () => {
      for (const k in this.keys) this.keys[k] = false;
    };

    window.addEventListener("blur", this.onBlur);
  }

  setMode(mode) {
    this.mode = mode;

    if (mode === "third") {
      this.targetSphere.visible = true;
      this.crosshair.style.display = "none";
      document.exitPointerLock();
      console.log("📷 Camera Mode: THIRD PERSON");
    } else if (mode === "fps") {
      this.targetSphere.visible = false;
      this.crosshair.style.display = "block";
      console.log("📷 Camera Mode: FIRST PERSON (FPS)");
      console.log("   Click canvas to lock mouse");
    }
  }

  toggleMode() {
    if (this.mode === "third") {
      this.setMode("fps");
    } else {
      this.setMode("third");
    }
  }

  update(deltaTime) {
    if (this.mode === "third") {
      this.updateThirdPerson(deltaTime);
    } else if (this.mode === "fps") {
      this.updateFPS(deltaTime);
    }
  }

  updateThirdPerson(deltaTime) {
    // Movement
    const speed = (this.keys["shift"] ? 50 : 25) * deltaTime;
    const vSpeed = 25 * deltaTime;

    const fX = Math.sin(this.thirdPerson.azimuth);
    const fZ = Math.cos(this.thirdPerson.azimuth);
    const rX = Math.cos(this.thirdPerson.azimuth);
    const rZ = -Math.sin(this.thirdPerson.azimuth);

    if (this.keys["w"]) {
      this.playerPosition.x -= fX * speed;
      this.playerPosition.z -= fZ * speed;
    }
    if (this.keys["s"]) {
      this.playerPosition.x += fX * speed;
      this.playerPosition.z += fZ * speed;
    }
    if (this.keys["a"]) {
      this.playerPosition.x -= rX * speed;
      this.playerPosition.z -= rZ * speed;
    }
    if (this.keys["d"]) {
      this.playerPosition.x += rX * speed;
      this.playerPosition.z += rZ * speed;
    }
    if (this.keys["q"]) this.playerPosition.y -= vSpeed;
    if (this.keys["e"]) this.playerPosition.y += vSpeed;

    // Update sphere
    this.targetSphere.position.copy(this.playerPosition);

    // Camera position
    const camX =
      this.playerPosition.x +
      this.thirdPerson.distance *
        Math.cos(this.thirdPerson.elevation) *
        Math.sin(this.thirdPerson.azimuth);

    const camY =
      this.playerPosition.y +
      this.thirdPerson.distance * Math.sin(this.thirdPerson.elevation);

    const camZ =
      this.playerPosition.z +
      this.thirdPerson.distance *
        Math.cos(this.thirdPerson.elevation) *
        Math.cos(this.thirdPerson.azimuth);

    this.camera.position.set(camX, camY, camZ);

    // Look at player
    const target = this.playerPosition.clone();
    const worldUp = new THREE.Vector3(0, 1, 0);
    const z = new THREE.Vector3()
      .subVectors(this.camera.position, target)
      .normalize();
    const x = new THREE.Vector3().crossVectors(worldUp, z).normalize();
    const y = new THREE.Vector3().crossVectors(z, x).normalize();
    const mat = new THREE.Matrix4();
    mat.makeBasis(x, y, z);
    this.camera.quaternion.setFromRotationMatrix(mat);
  }

  updateFPS(deltaTime) {
    // Movement
    const speed = (this.keys["shift"] ? 50 : 25) * deltaTime;

    const forward = new THREE.Vector3(
      Math.sin(this.fps.yaw),
      0,
      Math.cos(this.fps.yaw)
    ).normalize();

    const right = new THREE.Vector3(
      -Math.cos(this.fps.yaw),
      0,
      Math.sin(this.fps.yaw)
    ).normalize();

    if (this.keys["w"])
      this.playerPosition.add(forward.clone().multiplyScalar(speed));
    if (this.keys["s"])
      this.playerPosition.add(forward.clone().multiplyScalar(-speed));
    if (this.keys["a"])
      this.playerPosition.add(right.clone().multiplyScalar(-speed));
    if (this.keys["d"])
      this.playerPosition.add(right.clone().multiplyScalar(speed));
    if (this.keys["q"]) this.playerPosition.y -= speed;
    if (this.keys["e"]) this.playerPosition.y += speed;

    // Camera position = player position
    this.camera.position.copy(this.playerPosition);

    // Camera rotation
    const lookX = Math.cos(this.fps.pitch) * Math.sin(this.fps.yaw);
    const lookY = Math.sin(this.fps.pitch);
    const lookZ = Math.cos(this.fps.pitch) * Math.cos(this.fps.yaw);

    const lookAt = new THREE.Vector3(
      this.camera.position.x + lookX,
      this.camera.position.y + lookY,
      this.camera.position.z + lookZ
    );

    const worldUp = new THREE.Vector3(0, 1, 0);
    const z = new THREE.Vector3()
      .subVectors(this.camera.position, lookAt)
      .normalize();
    const x = new THREE.Vector3().crossVectors(worldUp, z).normalize();
    const y = new THREE.Vector3().crossVectors(z, x).normalize();
    const mat = new THREE.Matrix4();
    mat.makeBasis(x, y, z);
    this.camera.quaternion.setFromRotationMatrix(mat);
  }

  dispose() {
    // Remove event listeners
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
    this.renderer.domElement.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mouseup", this.onMouseUp);
    this.renderer.domElement.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mousemove", this.onPointerMove);
    document.removeEventListener("pointerlockchange", this.onPointerLockChange);
    this.renderer.domElement.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("blur", this.onBlur);

    // Remove sphere
    if (this.targetSphere) {
      this.scene.remove(this.targetSphere);
      this.targetSphere.geometry.dispose();
      this.targetSphere.material.dispose();
    }

    // Remove crosshair
    if (this.crosshair) {
      this.crosshair.remove();
    }
  }
}
