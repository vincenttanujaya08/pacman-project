// js/CameraController.js
// Handles both CINEMATIC and FREE camera modes

export default class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Mode
    this.mode = "cinematic";

    // Cinematic mode
    this.cinematicTarget = null;
    this.cinematicDuration = 0;
    this.cinematicElapsed = 0;
    this.cinematicStartPos = new THREE.Vector3();
    this.cinematicEndPos = new THREE.Vector3();
    this.cinematicStartLookAt = new THREE.Vector3();
    this.cinematicEndLookAt = new THREE.Vector3();
    this.cinematicEasing = this.easeInOutCubic;
    this.onCinematicComplete = null;

    // Free mode
    this.freeControls = null;
    this.moveSpeed = 0.5;
    this.sprintMultiplier = 2.5;
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      q: false,
      e: false,
      shift: false,
    };

    this.setupFreeControls();
  }

  setMode(mode) {
    if (mode === this.mode) return;

    this.mode = mode;

    if (mode === "free") {
      this.enableFreeMode();
    } else {
      this.disableFreeMode();
    }
  }

  enableFreeMode() {
    if (!this.freeControls) return;

    this.freeControls.enabled = true;

    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);

    console.log("✅ Free camera mode enabled");
    console.log("   WASD - Move");
    console.log("   Q - Down | E - Up");
    console.log("   Shift - Sprint (2.5x speed)");
    console.log("   Mouse Drag - Rotate");
    console.log("   Scroll - Zoom");
  }

  setExactPosition(pos, lookAt) {
    const wasDamping = this.freeControls.enableDamping;
    this.freeControls.enableDamping = false;

    if (lookAt) {
      this.freeControls.target.set(lookAt.x, lookAt.y, lookAt.z);
    }

    this.camera.position.set(pos.x, pos.y, pos.z);

    this.freeControls.update();
    this.freeControls.update();

    const drift = {
      x: pos.x - this.camera.position.x,
      y: pos.y - this.camera.position.y,
      z: pos.z - this.camera.position.z,
    };

    this.camera.position.set(pos.x + drift.x, pos.y + drift.y, pos.z + drift.z);

    this.freeControls.update();

    setTimeout(() => {
      this.freeControls.enableDamping = wasDamping;
    }, 100);

    console.log(
      `✅ Camera position: (${this.camera.position.x.toFixed(
        2
      )}, ${this.camera.position.y.toFixed(
        2
      )}, ${this.camera.position.z.toFixed(2)})`
    );
    if (drift.x !== 0 || drift.y !== 0 || drift.z !== 0) {
      console.log(
        `   Drift compensated: (${drift.x.toFixed(2)}, ${drift.y.toFixed(
          2
        )}, ${drift.z.toFixed(2)})`
      );
    }
  }

  disableFreeMode() {
    if (!this.freeControls) return;

    this.freeControls.enabled = false;

    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);

    Object.keys(this.keys).forEach((key) => (this.keys[key] = false));

    console.log("Cinematic mode enabled");
  }

  setupFreeControls() {
    this.freeControls = new THREE.OrbitControls(this.camera, this.domElement);
    this.freeControls.enabled = false;
    this.freeControls.enableDamping = true;
    this.freeControls.dampingFactor = 0.05;
    this.freeControls.minDistance = 1;
    this.freeControls.maxDistance = 100;
    this.freeControls.maxPolarAngle = Math.PI;

    this.onKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key === "w") this.keys.w = true;
      if (key === "a") this.keys.a = true;
      if (key === "s") this.keys.s = true;
      if (key === "d") this.keys.d = true;
      if (key === "q") this.keys.q = true;
      if (key === "e") this.keys.e = true;
      if (key === "shift") this.keys.shift = true;
    };

    this.onKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (key === "w") this.keys.w = false;
      if (key === "a") this.keys.a = false;
      if (key === "s") this.keys.s = false;
      if (key === "d") this.keys.d = false;
      if (key === "q") this.keys.q = false;
      if (key === "e") this.keys.e = false;
      if (key === "shift") this.keys.shift = false;
    };
  }

  moveTo(
    targetPos,
    lookAtPos,
    duration = 2000,
    easing = null,
    onComplete = null
  ) {
    this.cinematicStartPos.copy(this.camera.position);
    this.cinematicEndPos.copy(targetPos);

    const currentLookAt = new THREE.Vector3();
    this.camera.getWorldDirection(currentLookAt);
    currentLookAt.add(this.camera.position);
    this.cinematicStartLookAt.copy(currentLookAt);

    this.cinematicEndLookAt.copy(lookAtPos);
    this.cinematicDuration = duration;
    this.cinematicElapsed = 0;
    this.cinematicEasing = easing || this.easeInOutCubic;
    this.onCinematicComplete = onComplete;
  }

  setPosition(pos, lookAt) {
    this.camera.position.copy(pos);
    this.camera.lookAt(lookAt);
    this.cinematicElapsed = 0;
    this.cinematicDuration = 0;
  }

  orbitAround(center, radius, speed, height) {
    this.cinematicTarget = {
      type: "orbit",
      center: center,
      radius: radius,
      speed: speed,
      height: height,
      angle: 0,
    };
  }

  stopCinematic() {
    this.cinematicElapsed = 0;
    this.cinematicDuration = 0;
    this.cinematicTarget = null;
  }

  update(deltaTime) {
    if (this.mode === "cinematic") {
      this.updateCinematic(deltaTime);
    } else {
      this.updateFree(deltaTime);
    }
  }

  updateCinematic(deltaTime) {
    if (
      this.cinematicDuration > 0 &&
      this.cinematicElapsed < this.cinematicDuration
    ) {
      this.cinematicElapsed += deltaTime;
      const t = Math.min(this.cinematicElapsed / this.cinematicDuration, 1);
      const easedT = this.cinematicEasing(t);

      this.camera.position.lerpVectors(
        this.cinematicStartPos,
        this.cinematicEndPos,
        easedT
      );

      const currentLookAt = new THREE.Vector3().lerpVectors(
        this.cinematicStartLookAt,
        this.cinematicEndLookAt,
        easedT
      );
      this.camera.lookAt(currentLookAt);

      if (t >= 1 && this.onCinematicComplete) {
        const callback = this.onCinematicComplete;
        this.onCinematicComplete = null;
        callback();
      }
    }

    if (this.cinematicTarget && this.cinematicTarget.type === "orbit") {
      const target = this.cinematicTarget;
      target.angle += target.speed * (deltaTime / 1000);

      const x = target.center.x + Math.cos(target.angle) * target.radius;
      const z = target.center.z + Math.sin(target.angle) * target.radius;
      const y = target.height;

      this.camera.position.set(x, y, z);
      this.camera.lookAt(target.center);
    }
  }

  updateFree(deltaTime) {
    if (!this.freeControls || !this.freeControls.enabled) return;

    this.freeControls.update();

    const currentSpeed = this.keys.shift
      ? this.moveSpeed * this.sprintMultiplier
      : this.moveSpeed;

    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const movement = new THREE.Vector3();

    if (this.keys.w) movement.add(forward);
    if (this.keys.s) movement.sub(forward);
    if (this.keys.d) movement.add(right);
    if (this.keys.a) movement.sub(right);

    if (this.keys.q) movement.y -= 1;
    if (this.keys.e) movement.y += 1;

    if (movement.length() > 0) {
      movement.normalize().multiplyScalar(currentSpeed);
      this.camera.position.add(movement);
      this.freeControls.target.add(movement);
    }
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  easeInCubic(t) {
    return t * t * t;
  }

  linear(t) {
    return t;
  }

  dispose() {
    this.disableFreeMode();
    if (this.freeControls) {
      this.freeControls.dispose();
    }
  }
}
