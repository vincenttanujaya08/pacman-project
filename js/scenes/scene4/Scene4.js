// js/scenes/scene4/Scene4.js
// Full implementation with collision system + cinematic intro

import BaseScene from "../BaseScene.js";
import config from "./config.js";
import Scene4Cinematic from "./Scene4Cinematic.js";

export default class Scene4 extends BaseScene {
  constructor(name, renderer, camera) {
    super(name, renderer, camera);

    this.config = config;
    this.mazeModel = null;

    // Lights
    this.ambientLight = null;
    this.hemisphereLight = null;
    this.mainLight = null;
    this.fillLight = null;
    this.rimLight = null;

    // Cinematic
    this.cinematic = null;
    this.cinematicComplete = false;

    // FPS state (from original)
    this.isFPSActive = false;
    this.keys = {};
    this.yaw = config.camera.rotation.yaw;
    this.pitch = config.camera.rotation.pitchNormal;
    this.playerPosition = new THREE.Vector3();
    this.isPointerLocked = false;
    this.mouseSensitivity = 0.002;
    this.moveSpeed = 25;
    this.sprintSpeed = 50;

    // Collision (from original)
    this.staticCollidableObjects = [];
    this.doorInfos = [];
    this.animatedObjectNames = new Set();
    this.raycaster = new THREE.Raycaster();
    this.DOOR_OPEN_DISTANCE = 15;
    this.DOOR_CLOSE_DISTANCE = 20;

    // Animation mixer
    this.mixer = null;

    // Setup mode
    this.setupMode = true;
    this.currentScale = config.scale.maze.x;
    this.infoElement = null;

    this.setupKeyboardControls();
  }

  async init() {
    await super.init();

    console.log(`[${this.name}] Init started...`);

    // Remove default lights
    this.lights.forEach((light) => this.scene.remove(light));
    this.lights = [];

    // Background
    this.scene.background = new THREE.Color(this.config.background.color);

    // Setup lighting
    this.setupLighting();

    // Load maze
    try {
      console.log("Loading maze model...");
      const loader = new THREE.GLTFLoader();

      const mazeGltf = await new Promise((resolve, reject) => {
        loader.load(
          this.config.models.maze,
          (gltf) => resolve(gltf),
          (progress) => {
            const percent = ((progress.loaded / progress.total) * 100).toFixed(
              2
            );
            console.log(`Loading maze: ${percent}%`);
          },
          (error) => reject(error)
        );
      });

      this.mazeModel = mazeGltf.scene;

      // Extract animated object names
      if (mazeGltf.animations && mazeGltf.animations.length > 0) {
        mazeGltf.animations[0].tracks.forEach((track) => {
          this.animatedObjectNames.add(track.name.split(".")[0]);
        });
      }

      let doorCount = 0;

      // Setup collision detection (from original)
      this.mazeModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          let isAnimated = false;
          let animatedParent = null;
          let current = child;

          // Check if mesh is part of animated object
          while (current) {
            if (this.animatedObjectNames.has(current.name)) {
              isAnimated = true;
              animatedParent = current.name;
              break;
            }
            current = current.parent;
          }

          if (isAnimated) {
            const parentLower = animatedParent.toLowerCase();

            // Door detection
            if (parentLower.includes("door_section")) {
              doorCount++;
              this.doorInfos.push({
                mesh: child,
                parentName: animatedParent,
                isColliding: true,
              });
            }
          } else {
            // Static collidable objects
            this.staticCollidableObjects.push(child);
          }
        }
      });

      this.mazeModel.position.set(
        this.config.positions.maze.x,
        this.config.positions.maze.y,
        this.config.positions.maze.z
      );

      this.mazeModel.rotation.set(
        this.config.rotations.maze.x,
        this.config.rotations.maze.y,
        this.config.rotations.maze.z
      );

      this.mazeModel.scale.set(
        this.config.scale.maze.x,
        this.config.scale.maze.y,
        this.config.scale.maze.z
      );

      this.mazeModel.visible = true;

      this.addObject(this.mazeModel, "maze");

      console.log("✅ Maze loaded");
      console.log(`📦 Static objects: ${this.staticCollidableObjects.length}`);
      console.log(`🚪 Doors: ${this.doorInfos.length}`);

      // Setup animation mixer
      if (mazeGltf.animations && mazeGltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.mazeModel);
        const action = this.mixer.clipAction(mazeGltf.animations[0]);
        action.play();
        console.log("✅ Maze animations playing");
      }
    } catch (error) {
      console.error("❌ Error loading maze:", error);
    }

    // Create cinematic controller
    this.cinematic = new Scene4Cinematic(
      this.scene,
      this.camera,
      this.mazeModel,
      this.config
    );
    console.log("✅ Cinematic controller ready");

    // Setup mouse controls
    this.setupMouseControls();

    // Create info display
    this.createInfoDisplay();

    console.log("✅ Scene 4 ready!");
    console.log("💡 Intro cinematic will auto-start");
    console.log("💡 FPS mode active after falling");
  }

  setupLighting() {
    // Ambient light
    this.ambientLight = new THREE.AmbientLight(
      this.config.lighting.ambient.color,
      this.config.lighting.ambient.intensity
    );
    this.scene.add(this.ambientLight);
    this.lights.push(this.ambientLight);

    // Hemisphere light
    this.hemisphereLight = new THREE.HemisphereLight(
      this.config.lighting.hemisphere.skyColor,
      this.config.lighting.hemisphere.groundColor,
      this.config.lighting.hemisphere.intensity
    );
    this.scene.add(this.hemisphereLight);
    this.lights.push(this.hemisphereLight);

    // Main directional light
    this.mainLight = new THREE.DirectionalLight(
      this.config.lighting.main.color,
      this.config.lighting.main.intensity
    );
    this.mainLight.position.set(
      this.config.lighting.main.position.x,
      this.config.lighting.main.position.y,
      this.config.lighting.main.position.z
    );
    this.mainLight.castShadow = true;

    this.mainLight.shadow.mapSize.width = 4096;
    this.mainLight.shadow.mapSize.height = 4096;
    this.mainLight.shadow.camera.near = 0.1;
    this.mainLight.shadow.camera.far = 800;
    this.mainLight.shadow.camera.left = -200;
    this.mainLight.shadow.camera.right = 200;
    this.mainLight.shadow.camera.top = 200;
    this.mainLight.shadow.camera.bottom = -200;
    this.mainLight.shadow.bias = -0.00001;
    this.mainLight.shadow.normalBias = 0.02;

    this.scene.add(this.mainLight);
    this.lights.push(this.mainLight);

    // Fill light
    this.fillLight = new THREE.DirectionalLight(
      this.config.lighting.fill.color,
      this.config.lighting.fill.intensity
    );
    this.fillLight.position.set(
      this.config.lighting.fill.position.x,
      this.config.lighting.fill.position.y,
      this.config.lighting.fill.position.z
    );
    this.fillLight.castShadow = true;
    this.fillLight.shadow.mapSize.width = 2048;
    this.fillLight.shadow.mapSize.height = 2048;
    this.fillLight.shadow.camera.near = 0.1;
    this.fillLight.shadow.camera.far = 600;
    this.fillLight.shadow.camera.left = -150;
    this.fillLight.shadow.camera.right = 150;
    this.fillLight.shadow.camera.top = 150;
    this.fillLight.shadow.camera.bottom = -150;
    this.fillLight.shadow.bias = -0.00001;

    this.scene.add(this.fillLight);
    this.lights.push(this.fillLight);

    // Rim light
    this.rimLight = new THREE.DirectionalLight(
      this.config.lighting.rim.color,
      this.config.lighting.rim.intensity
    );
    this.rimLight.position.set(
      this.config.lighting.rim.position.x,
      this.config.lighting.rim.position.y,
      this.config.lighting.rim.position.z
    );
    this.scene.add(this.rimLight);
    this.lights.push(this.rimLight);

    console.log("✅ Lighting setup complete");
  }

  setupKeyboardControls() {
    this.onKeyDown = (e) => {
      const key = e.key.toLowerCase();
      this.keys[key] = true;
    };

    this.onKeyUp = (e) => {
      const key = e.key.toLowerCase();
      this.keys[key] = false;
    };

    this.onKeyPress = (e) => {
      const key = e.key;

      // Scale controls (testing)
      if (key === "1") {
        this.currentScale -= 0.5;
        this.updateMazeScale();
      }
      if (key === "2") {
        this.currentScale += 0.5;
        this.updateMazeScale();
      }

      // Print config
      if (key === "p" || key === "P") {
        this.printCurrentConfig();
      }

      // Reset
      if (key === "r" || key === "R") {
        this.resetToDefault();
      }
    };

    // Window blur - clear all keys
    this.onBlur = () => {
      for (const k in this.keys) this.keys[k] = false;
    };

    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);
    document.addEventListener("keypress", this.onKeyPress);
    window.addEventListener("blur", this.onBlur);
  }

  setupMouseControls() {
    this.onMouseDown = (e) => {
      console.log("🖱️ Mouse clicked on canvas");
      console.log("   FPS active:", this.isFPSActive);
      console.log("   Already locked:", this.isPointerLocked);

      if (this.isFPSActive && !this.isPointerLocked) {
        console.log("   Requesting pointer lock...");
        this.renderer.domElement.requestPointerLock();
      }
    };

    this.onPointerMove = (e) => {
      if (!this.isPointerLocked || !this.isFPSActive) return;

      this.yaw -= e.movementX * this.mouseSensitivity;
      this.pitch -= e.movementY * this.mouseSensitivity;

      // Clamp pitch
      this.pitch = Math.max(
        -Math.PI / 2.5,
        Math.min(Math.PI / 2.5, this.pitch)
      );
    };

    this.onPointerLockChange = () => {
      this.isPointerLocked =
        document.pointerLockElement === this.renderer.domElement;

      console.log("🔒 Pointer lock changed:", this.isPointerLocked);

      if (this.isPointerLocked) {
        console.log("✅ Mouse locked - FPS controls active");
      } else {
        console.log("❌ Mouse unlocked");
      }
    };

    this.onPointerLockError = (e) => {
      console.error("❌ Pointer lock error:", e);
    };

    this.renderer.domElement.addEventListener("mousedown", this.onMouseDown);
    document.addEventListener("mousemove", this.onPointerMove);
    document.addEventListener("pointerlockchange", this.onPointerLockChange);
    document.addEventListener("pointerlockerror", this.onPointerLockError);

    console.log("✅ Mouse controls setup");
    console.log("   Canvas element:", this.renderer.domElement);
  }

  // Collision detection (from original)
  checkCollisionInDirection(from, direction, distance) {
    this.raycaster.set(from, direction.clone().normalize());
    this.raycaster.far = distance;

    const closedDoors = this.doorInfos
      .filter((d) => d.isColliding)
      .map((d) => d.mesh);
    const collidables = [...this.staticCollidableObjects, ...closedDoors];

    const intersects = this.raycaster.intersectObjects(collidables, false);
    return intersects.length > 0 ? intersects[0] : null;
  }

  smoothCollisionResponse(oldPos, newPos) {
    const moveVector = new THREE.Vector3().subVectors(newPos, oldPos);
    const moveDistance = moveVector.length();

    if (moveDistance < 0.01) return newPos;

    const collision = this.checkCollisionInDirection(
      oldPos,
      moveVector,
      moveDistance + 0.5
    );

    if (!collision) {
      return newPos;
    }

    const hitPoint = collision.point;
    const hitNormal = collision.face
      ? collision.face.normal.clone()
      : new THREE.Vector3(0, 1, 0);

    const worldNormal = hitNormal
      .clone()
      .applyQuaternion(
        collision.object.getWorldQuaternion(new THREE.Quaternion())
      );

    const slideVector = moveVector
      .clone()
      .sub(worldNormal.clone().multiplyScalar(moveVector.dot(worldNormal)));

    const slidePos = oldPos.clone().add(slideVector);
    const slideDistance = slideVector.length();

    if (slideDistance > 0.01) {
      const slideCollision = this.checkCollisionInDirection(
        oldPos,
        slideVector,
        slideDistance + 0.5
      );

      if (!slideCollision) {
        return slidePos;
      }
    }

    return oldPos;
  }

  updateDoorProximity() {
    this.doorInfos.forEach((doorInfo) => {
      const doorWorldPos = new THREE.Vector3();
      doorInfo.mesh.getWorldPosition(doorWorldPos);

      const distance = this.playerPosition.distanceTo(doorWorldPos);

      if (distance < this.DOOR_OPEN_DISTANCE && doorInfo.isColliding) {
        doorInfo.isColliding = false;
      } else if (distance > this.DOOR_CLOSE_DISTANCE && !doorInfo.isColliding) {
        doorInfo.isColliding = true;
      }
    });
  }

  updateMazeScale() {
    if (this.mazeModel) {
      this.mazeModel.scale.set(
        this.currentScale,
        this.currentScale,
        this.currentScale
      );
      console.log(`🏰 Maze scale: ${this.currentScale.toFixed(2)}`);
      this.updateInfo();
    }
  }

  createInfoDisplay() {
    this.infoElement = document.createElement("div");
    this.infoElement.id = "scene4-info";
    this.infoElement.style.position = "fixed";
    this.infoElement.style.top = "100px";
    this.infoElement.style.left = "20px";
    this.infoElement.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    this.infoElement.style.color = "#00ff00";
    this.infoElement.style.padding = "15px";
    this.infoElement.style.fontFamily = "monospace";
    this.infoElement.style.fontSize = "14px";
    this.infoElement.style.borderRadius = "5px";
    this.infoElement.style.border = "2px solid #00ff00";
    this.infoElement.style.zIndex = "999";
    this.infoElement.style.lineHeight = "1.5";
    this.infoElement.style.display = "none";
    document.body.appendChild(this.infoElement);

    this.updateInfo();
  }

  updateInfo() {
    if (!this.infoElement) return;

    const cinematicStatus =
      this.cinematic && this.cinematic.isPlaying ? "Playing" : "Complete";

    const fpsStatus = this.isFPSActive ? "ACTIVE" : "Waiting...";

    this.infoElement.innerHTML = `
      <strong>🎮 SCENE 4 - FPS MODE</strong><br>
      <br>
      <strong>🎬 STATUS</strong><br>
      Cinematic: ${cinematicStatus}<br>
      FPS: ${fpsStatus}<br>
      Pointer Lock: ${this.isPointerLocked ? "YES" : "NO"}<br>
      <br>
      <strong>📦 MODEL</strong><br>
      Maze Scale: ${this.currentScale.toFixed(2)}<br>
      Doors: ${this.doorInfos.length}<br>
      Static: ${this.staticCollidableObjects.length}<br>
      <br>
      <strong>🎯 CONTROLS</strong><br>
      WASD: Move<br>
      Shift: Sprint<br>
      Q/E: Down/Up<br>
      Mouse: Look<br>
      Click: Lock Mouse<br>
      <br>
      <strong>[P] Print Config | [R] Reset</strong>
    `;
  }

  printCurrentConfig() {
    console.log("");
    console.log("========================================");
    console.log("📋 SCENE 4 CONFIG");
    console.log("========================================");
    console.log("Maze scale:", this.currentScale.toFixed(2));
    console.log("Camera pos:", {
      x: this.camera.position.x.toFixed(2),
      y: this.camera.position.y.toFixed(2),
      z: this.camera.position.z.toFixed(2),
    });
    console.log("Camera rot:", {
      yaw: this.yaw.toFixed(3),
      pitch: this.pitch.toFixed(3),
    });
    console.log("FPS active:", this.isFPSActive);
    console.log("Pointer locked:", this.isPointerLocked);
    console.log("========================================");
  }

  resetToDefault() {
    this.currentScale = this.config.scale.maze.x;
    this.updateMazeScale();

    this.updateInfo();
    console.log("✅ Reset to defaults");
  }

  activateFPS() {
    this.isFPSActive = true;
    this.playerPosition.copy(this.camera.position);
    this.yaw = this.cinematic.getYaw();
    this.pitch = this.cinematic.getPitch();

    console.log("🎮 FPS MODE ACTIVATED");
    console.log(
      "   Position:",
      this.playerPosition.x.toFixed(2),
      this.playerPosition.y.toFixed(2),
      this.playerPosition.z.toFixed(2)
    );
    console.log(
      "   Yaw:",
      this.yaw.toFixed(3),
      "Pitch:",
      this.pitch.toFixed(3)
    );
    console.log("   WASD: Move | Shift: Sprint | Q/E: Down/Up");
    console.log("   ⚠️ CLICK CANVAS TO LOCK MOUSE!");

    this.updateInfo();

    // Show instruction overlay
    this.showClickInstruction();
  }

  showClickInstruction() {
    const instruction = document.createElement("div");
    instruction.style.position = "fixed";
    instruction.style.top = "50%";
    instruction.style.left = "50%";
    instruction.style.transform = "translate(-50%, -50%)";
    instruction.style.padding = "20px 40px";
    instruction.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
    instruction.style.color = "#00ff00";
    instruction.style.fontSize = "24px";
    instruction.style.fontWeight = "bold";
    instruction.style.border = "3px solid #00ff00";
    instruction.style.borderRadius = "10px";
    instruction.style.zIndex = "9999";
    instruction.style.textAlign = "center";
    instruction.style.fontFamily = "monospace";
    instruction.innerHTML =
      "🖱️ CLICK TO LOCK MOUSE<br><span style='font-size:16px'>Then use mouse to look around</span>";

    document.body.appendChild(instruction);

    // Remove on first click
    const removeInstruction = () => {
      instruction.remove();
      document.removeEventListener("click", removeInstruction);
    };

    document.addEventListener("click", removeInstruction);
  }

  enter() {
    super.enter();

    console.log("🎮 Scene 4 entered!");

    // Show info display
    if (this.infoElement) {
      this.infoElement.style.display = "block";
    }

    this.updateInfo();

    // Auto-start cinematic after short delay
    setTimeout(() => {
      if (this.cinematic) {
        console.log("🎬 Auto-starting intro cinematic...");
        this.cinematic.start();
      }
    }, 500);

    console.log("💡 Intro starting in 0.5s...");
    console.log("💡 FPS mode will activate after falling");
  }

  update(deltaTime) {
    super.update(deltaTime);

    if (!this.isActive) return;

    const dt = deltaTime / 1000; // Convert to seconds

    // Update animation mixer
    if (this.mixer) {
      this.mixer.update(dt);
    }

    // Update cinematic
    if (this.cinematic && this.cinematic.isPlaying) {
      const wasPlaying = this.cinematic.isPlaying;
      this.cinematic.update(deltaTime);

      // Check if cinematic just finished
      if (wasPlaying && !this.cinematic.isPlaying && !this.isFPSActive) {
        console.log("🎬 Cinematic complete - activating FPS!");
        this.activateFPS();
        this.cinematicComplete = true;
      }
    }

    // Update FPS movement and camera
    if (this.isFPSActive) {
      this.updateFPSMovement(dt);
      this.updateFPSCamera();
      this.updateDoorProximity();
    }

    // Update info display
    this.updateInfo();
  }

  updateFPSMovement(dt) {
    const speed = this.keys["shift"] ? this.sprintSpeed : this.moveSpeed;

    const forward = new THREE.Vector3(
      Math.sin(this.yaw),
      0,
      Math.cos(this.yaw)
    ).normalize();

    const right = new THREE.Vector3(
      -Math.cos(this.yaw),
      0,
      Math.sin(this.yaw)
    ).normalize();

    let movement = new THREE.Vector3(0, 0, 0);

    if (this.keys["w"])
      movement.add(forward.clone().multiplyScalar(speed * dt));
    if (this.keys["s"])
      movement.add(forward.clone().multiplyScalar(-speed * dt));
    if (this.keys["a"]) movement.add(right.clone().multiplyScalar(-speed * dt));
    if (this.keys["d"]) movement.add(right.clone().multiplyScalar(speed * dt));
    if (this.keys["q"]) movement.y -= speed * dt;
    if (this.keys["e"]) movement.y += speed * dt;

    const oldPos = this.playerPosition.clone();
    const desiredPos = oldPos.clone().add(movement);

    const safePos = this.smoothCollisionResponse(oldPos, desiredPos);
    this.playerPosition.copy(safePos);

    // Update camera position
    this.camera.position.copy(this.playerPosition);
  }

  updateFPSCamera() {
    const lookX = Math.cos(this.pitch) * Math.sin(this.yaw);
    const lookY = Math.sin(this.pitch);
    const lookZ = Math.cos(this.pitch) * Math.cos(this.yaw);

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
    const mat = new THREE.Matrix4().makeBasis(x, y, z);

    this.camera.quaternion.setFromRotationMatrix(mat);
  }

  exit() {
    super.exit();

    // Exit pointer lock
    document.exitPointerLock();

    // Hide info display
    if (this.infoElement) {
      this.infoElement.style.display = "none";
    }

    // Stop cinematic
    if (this.cinematic) {
      this.cinematic.stop();
    }

    // Disable FPS
    this.isFPSActive = false;

    // Clear keys
    for (const key in this.keys) {
      this.keys[key] = false;
    }
  }

  dispose() {
    // Remove event listeners
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
    document.removeEventListener("keypress", this.onKeyPress);
    window.removeEventListener("blur", this.onBlur);
    this.renderer.domElement.removeEventListener("mousedown", this.onMouseDown);
    document.removeEventListener("mousemove", this.onPointerMove);
    document.removeEventListener("pointerlockchange", this.onPointerLockChange);
    document.removeEventListener("pointerlockerror", this.onPointerLockError);

    // Remove info element
    if (this.infoElement) {
      this.infoElement.remove();
      this.infoElement = null;
    }

    // Stop mixer
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }

    // Dispose cinematic
    if (this.cinematic) {
      this.cinematic.dispose();
      this.cinematic = null;
    }

    super.dispose();
  }
}
