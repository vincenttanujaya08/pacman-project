import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// ==== RENDERER + CANVAS ====
const canvas = document.querySelector("#glCanvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// ===== SCENE & CAMERA =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202030);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);

// ===== LIGHTING - IMPROVED =====
// Ambient light (cahaya dasar)
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

// Hemisphere light (cahaya atas-bawah)
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
scene.add(hemi);

// Main directional light (cahaya utama + shadow)
const mainLight = new THREE.DirectionalLight(0xffffff, 1.8);
mainLight.position.set(80, 150, 80);
mainLight.castShadow = true;

// Shadow settings
mainLight.shadow.mapSize.width = 4096;
mainLight.shadow.mapSize.height = 4096;
mainLight.shadow.camera.near = 0.1;
mainLight.shadow.camera.far = 800;
mainLight.shadow.camera.left = -200;
mainLight.shadow.camera.right = 200;
mainLight.shadow.camera.top = 200;
mainLight.shadow.camera.bottom = -200;
mainLight.shadow.bias = -0.00001;
mainLight.shadow.normalBias = 0.02;

scene.add(mainLight);

// Fill light (cahaya tambahan dari samping) - WITH SHADOW
const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
fillLight.position.set(-80, 80, -80);
fillLight.castShadow = true;
fillLight.shadow.mapSize.width = 2048;
fillLight.shadow.mapSize.height = 2048;
fillLight.shadow.camera.near = 0.1;
fillLight.shadow.camera.far = 600;
fillLight.shadow.camera.left = -150;
fillLight.shadow.camera.right = 150;
fillLight.shadow.camera.top = 150;
fillLight.shadow.camera.bottom = -150;
fillLight.shadow.bias = -0.00001;
scene.add(fillLight);

// Rim light (cahaya dari belakang)
const rimLight = new THREE.DirectionalLight(0xaaaaff, 0.5);
rimLight.position.set(0, 20, -100);
scene.add(rimLight);
// ==================================================
// CROSSHAIR
// ==================================================
const crosshair = document.createElement("div");
crosshair.style.position = "fixed";
crosshair.style.top = "50%";
crosshair.style.left = "50%";
crosshair.style.transform = "translate(-50%, -50%)";
crosshair.style.width = "4px";
crosshair.style.height = "4px";
crosshair.style.backgroundColor = "white";
crosshair.style.borderRadius = "50%";
crosshair.style.pointerEvents = "none";
crosshair.style.zIndex = "1000";
crosshair.style.boxShadow = "0 0 0 2px black";
crosshair.style.display = "none";
document.body.appendChild(crosshair);

// ==================================================
// SHARED PLAYER POSITION (sync antara mode)
// ==================================================
const playerPosition = new THREE.Vector3(5, 4, -20);

// ==================================================
// CAMERA MODE
// ==================================================
let cameraMode = "third"; // "third", "fps", "follow"
let followTarget = null; // objek yang diikutin

// Third Person State
const thirdPersonState = {
  distance: 80,
  azimuth: 0,
  elevation: 0.3,
  minElevation: -Math.PI / 3,
  maxElevation: Math.PI / 2.5,
};

// FPS State
const fpsState = {
  yaw: 0,
  pitch: 0,
  minPitch: -Math.PI / 2.5,
  maxPitch: Math.PI / 2.5,
};

// Follow State
const followState = {
  distance: 50, // jarak dari karakter
  height: 5, // tinggi camera dari karakter
  offsetFront: 25, // offset di depan karakter (camera mundur)
};

// Bola merah
const targetSphereGeometry = new THREE.SphereGeometry(2, 16, 16);
const targetSphereMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  transparent: true,
  opacity: 0.6,
  wireframe: true,
});
const targetSphere = new THREE.Mesh(targetSphereGeometry, targetSphereMaterial);
scene.add(targetSphere);
targetSphere.position.copy(playerPosition);

// ==================================================
// CHARACTER TRACKING
// ==================================================
const characters = {}; // { pacman: Object3D, ghost_red: Object3D, ... }
const characterPreviousPositions = new Map(); // track posisi sebelumnya

function registerCharacter(name, obj) {
  if (!obj) return;
  characters[name] = obj;
  characterPreviousPositions.set(name, obj.position.clone());
  console.log(`✅ Character registered: ${name}`);
}

// ==================================================
// INPUT
// ==================================================
const keys = {};
window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;

  if (k === "1") {
    cameraMode = "third";
    followTarget = null;
    document.exitPointerLock();
    targetSphere.visible = true;
    crosshair.style.display = "none";
    console.log("📷 Mode: THIRD PERSON");
  } else if (k === "2") {
    cameraMode = "fps";
    followTarget = null;
    targetSphere.visible = false;
    crosshair.style.display = "block";
    console.log("📷 Mode: FIRST PERSON");
  } else if (k === "3") {
    cameraMode = "follow";
    followTarget = characters.pacman;
    targetSphere.visible = false;
    crosshair.style.display = "none";
    document.exitPointerLock();
    console.log("📷 Mode: FOLLOW PACMAN");
  } else if (k === "4") {
    cameraMode = "follow";
    followTarget = characters.ghost_red;
    targetSphere.visible = false;
    crosshair.style.display = "none";
    document.exitPointerLock();
    console.log("📷 Mode: FOLLOW GHOST RED");
  } else if (k === "5") {
    cameraMode = "follow";
    followTarget = characters.ghost_blue;
    targetSphere.visible = false;
    crosshair.style.display = "none";
    document.exitPointerLock();
    console.log("📷 Mode: FOLLOW GHOST BLUE");
  } else if (k === "6") {
    cameraMode = "follow";
    followTarget = characters.ghost_pinky;
    targetSphere.visible = false;
    crosshair.style.display = "none";
    document.exitPointerLock();
    console.log("📷 Mode: FOLLOW GHOST PINK");
  } else if (k === "7") {
    cameraMode = "follow";
    followTarget = characters.ghost_orange;
    targetSphere.visible = false;
    crosshair.style.display = "none";
    document.exitPointerLock();
    console.log("📷 Mode: FOLLOW GHOST ORANGE");
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

window.addEventListener("blur", () => {
  for (const k in keys) keys[k] = false;
});

// Mouse control
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let isPointerLocked = false;

canvas.addEventListener("mousedown", (e) => {
  if (cameraMode === "third") {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  } else if (cameraMode === "fps") {
    canvas.requestPointerLock();
  }
});

window.addEventListener("mouseup", () => {
  isDragging = false;
});

canvas.addEventListener("mousemove", (e) => {
  if (cameraMode === "third" && isDragging) {
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    thirdPersonState.azimuth -= dx * 0.01;
    thirdPersonState.elevation -= dy * 0.01;
    thirdPersonState.elevation = Math.max(
      thirdPersonState.minElevation,
      Math.min(thirdPersonState.maxElevation, thirdPersonState.elevation)
    );
  }
});

canvas.addEventListener(
  "wheel",
  (e) => {
    if (cameraMode === "third") {
      e.preventDefault();
      thirdPersonState.distance += e.deltaY * 0.05;
      thirdPersonState.distance = Math.max(
        20,
        Math.min(150, thirdPersonState.distance)
      );
    } else if (cameraMode === "follow") {
      e.preventDefault();
      followState.distance += e.deltaY * 0.05;
      followState.distance = Math.max(10, Math.min(100, followState.distance));
    }
  },
  { passive: false }
);

document.addEventListener("pointerlockchange", () => {
  isPointerLocked = document.pointerLockElement === canvas;
});

document.addEventListener("mousemove", (e) => {
  if (cameraMode === "fps" && isPointerLocked) {
    const sensitivity = 0.002;
    fpsState.yaw -= e.movementX * sensitivity;
    fpsState.pitch -= e.movementY * sensitivity;

    fpsState.pitch = Math.max(
      fpsState.minPitch,
      Math.min(fpsState.maxPitch, fpsState.pitch)
    );
  }
});

// ==================================================
// COLLISION DETECTION
// ==================================================
const raycaster = new THREE.Raycaster();
let staticCollidableObjects = [];
let doorInfos = [];

function checkCollisionInDirection(from, direction, distance) {
  raycaster.set(from, direction.clone().normalize());
  raycaster.far = distance;

  const closedDoors = doorInfos.filter((d) => d.isColliding).map((d) => d.mesh);
  const collidables = [...staticCollidableObjects, ...closedDoors];

  const intersects = raycaster.intersectObjects(collidables, false);
  return intersects.length > 0 ? intersects[0] : null;
}

function smoothCollisionResponse(oldPos, newPos) {
  const moveVector = new THREE.Vector3().subVectors(newPos, oldPos);
  const moveDistance = moveVector.length();

  if (moveDistance < 0.01) return newPos;

  const collision = checkCollisionInDirection(
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
    const slideCollision = checkCollisionInDirection(
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

// ==================================================
// THIRD PERSON MODE
// ==================================================
function updateThirdPersonMovement(dt) {
  const speed = (keys["shift"] ? 50 : 25) * dt;
  const vSpeed = 25 * dt;

  const fX = Math.sin(thirdPersonState.azimuth);
  const fZ = Math.cos(thirdPersonState.azimuth);
  const rX = Math.cos(thirdPersonState.azimuth);
  const rZ = -Math.sin(thirdPersonState.azimuth);

  let dx = 0,
    dy = 0,
    dz = 0;

  if (keys["w"]) {
    dx -= fX * speed;
    dz -= fZ * speed;
  }
  if (keys["s"]) {
    dx += fX * speed;
    dz += fZ * speed;
  }
  if (keys["a"]) {
    dx -= rX * speed;
    dz -= rZ * speed;
  }
  if (keys["d"]) {
    dx += rX * speed;
    dz += rZ * speed;
  }
  if (keys["q"]) dy -= vSpeed;
  if (keys["e"]) dy += vSpeed;

  const oldPos = playerPosition.clone();
  const newPos = new THREE.Vector3(
    playerPosition.x + dx,
    playerPosition.y + dy,
    playerPosition.z + dz
  );

  const safePos = smoothCollisionResponse(oldPos, newPos);
  playerPosition.copy(safePos);
  targetSphere.position.copy(playerPosition);
}

function updateThirdPersonCamera() {
  const camX =
    playerPosition.x +
    thirdPersonState.distance *
      Math.cos(thirdPersonState.elevation) *
      Math.sin(thirdPersonState.azimuth);

  const camY =
    playerPosition.y +
    thirdPersonState.distance * Math.sin(thirdPersonState.elevation);

  const camZ =
    playerPosition.z +
    thirdPersonState.distance *
      Math.cos(thirdPersonState.elevation) *
      Math.cos(thirdPersonState.azimuth);

  camera.position.set(camX, camY, camZ);
  // Manual orientation using world-up to avoid roll when orbiting
  {
    const target = playerPosition.clone();
    const worldUp = new THREE.Vector3(0, 1, 0);
    const z = new THREE.Vector3()
      .subVectors(camera.position, target)
      .normalize();
    const x = new THREE.Vector3().crossVectors(worldUp, z).normalize();
    const y = new THREE.Vector3().crossVectors(z, x).normalize();
    const mat = new THREE.Matrix4();
    mat.makeBasis(x, y, z);
    camera.quaternion.setFromRotationMatrix(mat);
  }
}

// ==================================================
// FPS MODE
// ==================================================
function updateFPSMovement(dt) {
  const speed = (keys["shift"] ? 50 : 25) * dt;

  const forward = new THREE.Vector3(
    Math.sin(fpsState.yaw),
    0,
    Math.cos(fpsState.yaw)
  ).normalize();

  const right = new THREE.Vector3(
    -Math.cos(fpsState.yaw),
    0,
    Math.sin(fpsState.yaw)
  ).normalize();

  let movement = new THREE.Vector3(0, 0, 0);

  if (keys["w"]) movement.add(forward.clone().multiplyScalar(speed));
  if (keys["s"]) movement.add(forward.clone().multiplyScalar(-speed));
  if (keys["a"]) movement.add(right.clone().multiplyScalar(-speed));
  if (keys["d"]) movement.add(right.clone().multiplyScalar(speed));
  if (keys["q"]) movement.y -= speed;
  if (keys["e"]) movement.y += speed;

  const oldPos = playerPosition.clone();
  const desiredPos = oldPos.clone().add(movement);

  const safePos = smoothCollisionResponse(oldPos, desiredPos);
  playerPosition.copy(safePos);
}

function updateFPSCamera() {
  camera.position.copy(playerPosition);

  const lookX = Math.cos(fpsState.pitch) * Math.sin(fpsState.yaw);
  const lookY = Math.sin(fpsState.pitch);
  const lookZ = Math.cos(fpsState.pitch) * Math.cos(fpsState.yaw);

  const lookAt = new THREE.Vector3(
    camera.position.x + lookX,
    camera.position.y + lookY,
    camera.position.z + lookZ
  );
  // Manual orientation using world-up to avoid roll
  {
    const worldUp = new THREE.Vector3(0, 1, 0);
    const z = new THREE.Vector3()
      .subVectors(camera.position, lookAt)
      .normalize();
    const x = new THREE.Vector3().crossVectors(worldUp, z).normalize();
    const y = new THREE.Vector3().crossVectors(z, x).normalize();
    const mat = new THREE.Matrix4();
    mat.makeBasis(x, y, z);
    camera.quaternion.setFromRotationMatrix(mat);
  }
}

// ==================================================
// FOLLOW MODE
// ==================================================
// ==================================================
// FOLLOW MODE
// ==================================================
function updateFollowCamera() {
  if (!followTarget) return;

  // Get target position
  const targetPos = new THREE.Vector3();
  followTarget.getWorldPosition(targetPos);

  // Get previous position untuk hitung arah gerak
  const characterName = Object.keys(characters).find(
    (key) => characters[key] === followTarget
  );
  const prevPos = characterPreviousPositions.get(characterName);

  // Hitung arah gerak karakter
  const moveDir = new THREE.Vector3().subVectors(targetPos, prevPos);

  let desiredCamPos;

  // Kalau karakter bergerak, update arah camera
  if (moveDir.length() > 0.01) {
    moveDir.normalize();
    moveDir.y = 0; // horizontal only

    // Camera di DEPAN karakter (offset positif di arah gerak)
    const cameraOffset = moveDir
      .clone()
      .multiplyScalar(followState.offsetFront);

    desiredCamPos = new THREE.Vector3(
      targetPos.x + cameraOffset.x,
      targetPos.y + followState.height,
      targetPos.z + cameraOffset.z
    );
  } else {
    // Karakter diam, camera tetap di posisi default
    desiredCamPos = new THREE.Vector3(
      targetPos.x,
      targetPos.y + followState.height,
      targetPos.z + followState.distance
    );
  }

  // ✅ COLLISION CHECK: Raycast dari target ke camera
  const dirToCamera = new THREE.Vector3().subVectors(desiredCamPos, targetPos);
  const distToCamera = dirToCamera.length();

  raycaster.set(targetPos, dirToCamera.normalize());
  raycaster.far = distToCamera;

  const closedDoors = doorInfos.filter((d) => d.isColliding).map((d) => d.mesh);
  const collidables = [...staticCollidableObjects, ...closedDoors];
  const intersects = raycaster.intersectObjects(collidables, false);

  let finalCamPos;

  if (intersects.length > 0) {
    // ✅ Ada collision, camera stop di depan tembok
    const hitPoint = intersects[0].point;

    // Pull back sedikit dari hit point (offset 2 unit)
    const pullBack = dirToCamera.clone().multiplyScalar(-2);
    finalCamPos = hitPoint.clone().add(pullBack);

    // Pastikan gak terlalu deket sama target
    const minDist = 5;
    const currentDist = finalCamPos.distanceTo(targetPos);
    if (currentDist < minDist) {
      const safeDist = dirToCamera.clone().multiplyScalar(minDist);
      finalCamPos = targetPos.clone().add(safeDist);
    }
  } else {
    // ✅ Gak ada collision, use desired position
    finalCamPos = desiredCamPos;
  }

  // Smooth follow
  camera.position.lerp(finalCamPos, 0.1);

  // Look at karakter
  const lookTarget = targetPos.clone();
  lookTarget.y += 5; // look sedikit ke atas dari center karakter
  // Manual orientation using world-up to avoid roll
  {
    const worldUp = new THREE.Vector3(0, 1, 0);
    const z = new THREE.Vector3()
      .subVectors(camera.position, lookTarget)
      .normalize();
    const x = new THREE.Vector3().crossVectors(worldUp, z).normalize();
    const y = new THREE.Vector3().crossVectors(z, x).normalize();
    const mat = new THREE.Matrix4();
    mat.makeBasis(x, y, z);
    camera.quaternion.setFromRotationMatrix(mat);
  }

  // Update previous position
  characterPreviousPositions.set(characterName, targetPos.clone());
}

// ==================================================
// DOOR PROXIMITY
// ==================================================
const DOOR_OPEN_DISTANCE = 15;
const DOOR_CLOSE_DISTANCE = 20;

function updateDoorProximity() {
  doorInfos.forEach((doorInfo) => {
    const doorWorldPos = new THREE.Vector3();
    doorInfo.mesh.getWorldPosition(doorWorldPos);

    const distance = playerPosition.distanceTo(doorWorldPos);

    if (distance < DOOR_OPEN_DISTANCE && doorInfo.isColliding) {
      doorInfo.isColliding = false;
    } else if (distance > DOOR_CLOSE_DISTANCE && !doorInfo.isColliding) {
      doorInfo.isColliding = true;
    }
  });
}

// ==================================================
// LOAD MODEL
// ==================================================
const loader = new GLTFLoader();
let pacmanMixer = null;
const animatedObjectNames = new Set();

function loadModels() {
  loader.load(
    "models/remaster.glb",
    (gltf) => {
      const model = gltf.scene;

      if (gltf.animations && gltf.animations.length > 0) {
        gltf.animations[0].tracks.forEach((track) => {
          animatedObjectNames.add(track.name.split(".")[0]);
        });
      }

      let doorCount = 0;

      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;

          let isAnimated = false;
          let animatedParent = null;
          let current = o;

          while (current) {
            if (animatedObjectNames.has(current.name)) {
              isAnimated = true;
              animatedParent = current.name;
              break;
            }
            current = current.parent;
          }

          if (isAnimated) {
            const parentLower = animatedParent.toLowerCase();

            if (parentLower.includes("door_section")) {
              doorCount++;
              doorInfos.push({
                mesh: o,
                parentName: animatedParent,
                isColliding: true,
              });
            } else if (parentLower.includes("pac_man")) {
              registerCharacter("pacman", o.parent || o);
            } else if (parentLower.includes("blinky")) {
              registerCharacter("ghost_red", o.parent || o);
            } else if (parentLower.includes("inky")) {
              registerCharacter("ghost_blue", o.parent || o);
            } else if (parentLower.includes("pinky")) {
              registerCharacter("ghost_pink", o.parent || o);
            } else if (parentLower.includes("clyde")) {
              registerCharacter("ghost_orange", o.parent || o);
            }
          } else {
            staticCollidableObjects.push(o);
          }
        }
      });

      model.position.set(0, 0, 0);
      model.scale.set(10, 10, 10);
      scene.add(model);

      console.log("========================================");
      console.log("✅ MODEL LOADED");
      console.log("========================================");
      console.log(`📦 Static objects: ${staticCollidableObjects.length}`);
      console.log(`🚪 Doors: ${doorInfos.length}`);
      console.log(`👾 Characters: ${Object.keys(characters).length}`);
      console.log("");
      console.log("🎮 CONTROLS:");
      console.log("  [1] Third Person (Manual)");
      console.log("  [2] First Person (FPS)");
      console.log("  [3] Follow Pacman");
      console.log("  [4] Follow Ghost Red");
      console.log("  [5] Follow Ghost Blue");
      console.log("  [6] Follow Ghost Pink");
      console.log("  [7] Follow Ghost Orange");
      console.log("");
      console.log("  WASD: Move (modes 1-2)");
      console.log("  Mouse: Look/Rotate");
      console.log("  Scroll: Zoom");
      console.log("========================================");

      if (gltf.animations && gltf.animations.length > 0) {
        pacmanMixer = new THREE.AnimationMixer(model);
        const action = pacmanMixer.clipAction(gltf.animations[0]);
        action.play();
      }
    },
    undefined,
    (err) => console.error("❌ Error:", err)
  );
}

loadModels();

window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
});

let lastTime = 0;
function animate(nowMs) {
  const t = nowMs * 0.001;
  const dt = Math.min(Math.max(t - lastTime, 0), 0.1);
  lastTime = t;

  if (cameraMode === "third") {
    updateThirdPersonMovement(dt);
    updateThirdPersonCamera();
  } else if (cameraMode === "fps") {
    updateFPSMovement(dt);
    updateFPSCamera();
  } else if (cameraMode === "follow") {
    updateFollowCamera();
  }

  updateDoorProximity();

  if (pacmanMixer) {
    pacmanMixer.update(dt);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
