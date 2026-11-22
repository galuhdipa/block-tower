import * as THREE from "three";

// Part 1: a public Ethereum JSON-RPC gateway (no key needed). Any public RPC URL works.
const RPC = "https://ethereum-rpc.publicnode.com";
const SAMPLE = [180, 142, 210, 95, 166, 201, 130].map((t, i) => ({ number: i, txCount: t }));
const track = window.track || ((name, params) => console.log("[analytics]", name, params));

async function rpc(method, params = []) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
  });
  if (!res.ok) throw new Error("RPC HTTP " + res.status);
  const body = await res.json();
  if (body.error) throw new Error("RPC " + body.error.message);
  return body.result;
}

async function getRecentBlocks(n = 7) {
  const latest = parseInt(await rpc("eth_blockNumber"), 16);
  const nums = Array.from({ length: n }, (_, i) => latest - i);
  const blocks = await Promise.all(
    nums.map(num => rpc("eth_getBlockByNumber", ["0x" + num.toString(16), false])));
  return blocks.map((b, i) => ({ number: nums[i], txCount: b.transactions.length }));
}

// Three.js scene
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));   // Part 4: performance

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf8fafc);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
camera.position.set(0, 4, 10);
camera.lookAt(0, 1.5, 0);
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(4, 8, 6);
scene.add(sun);

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

const group = new THREE.Group();
scene.add(group);
const material = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
const latestMaterial = new THREE.MeshStandardMaterial({ color: 0xf59e0b });

// Load data (with fallback)
let blocks, source = "live";
try {
  blocks = await getRecentBlocks();
} catch (err) {
  blocks = SAMPLE;
  source = "sample";
  track("data_fallback", { reason: err.message });
}

blocks.forEach((b, i) => {
  const h = Math.max(0.2, b.txCount / 50);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.8, h, 0.8), i === 0 ? latestMaterial : material);
  bar.position.set((i - (blocks.length - 1) / 2) * 1.2, h / 2, 0);
  group.add(bar);
});

document.getElementById("summary").textContent = source === "live"
  ? `Latest block #${blocks[0].number} (orange bar) contains ${blocks[0].txCount} transactions.`
  : "Live data unavailable, showing sample data.";

// Same data as text (accessibility + crawlable)
const tbody = document.querySelector("#data-table tbody");
for (const b of blocks) {
  const tr = document.createElement("tr");
  const c1 = document.createElement("td");
  const c2 = document.createElement("td");
  c1.textContent = source === "live" ? "#" + b.number : "Sample " + (b.number + 1);
  c2.textContent = b.txCount;
  tr.append(c1, c2);
  tbody.append(tr);
}
track("data_loaded", { source, block_count: blocks.length });

// Part 4: accessibility (reduced motion + pause button)
const btn = document.getElementById("toggle");
let paused = matchMedia("(prefers-reduced-motion: reduce)").matches;
btn.textContent = paused ? "Play animation" : "Pause animation";
btn.addEventListener("click", () => {
  paused = !paused;
  btn.textContent = paused ? "Play animation" : "Pause animation";
  track("toggle_animation", { state: paused ? "paused" : "playing" });
});

renderer.setAnimationLoop(() => {
  if (!paused) group.rotation.y += 0.005;
  renderer.render(scene, camera);
});
