/* ============================================================
   DSA Arsenal — Stage
   Thin wrapper around Three.js: scene, camera, OrbitControls,
   lights, resize handling, a per-frame tick registry (used for
   smooth lerped motion), and reusable 3D helpers (labels, bars,
   pointer arrows). Every visualisation builds on top of this.
   ============================================================ */
window.DSAV = window.DSAV || {};

(function () {
  const T = window.THREE;

  const COLORS = {
    bg: 0x1c0d07,
    ground: 0x2c150c,
    grid: 0x6b331d,
    bar: 0xb6a184,       // pearl-muted
    barPos: 0xcf8552,    // copper
    barNeg: 0x7fb2c9,    // info blue for negatives
    left: 0xe6ad6b,      // amber
    right: 0xc8794a,     // rust-300
    anchor: 0x8bbf7a,    // green
    dim: 0x4d2415,
    good: 0x8bbf7a,
    bad: 0xe08a6f,       // soft red (matches --bad)
    hot: 0xf4c884,
    text: 0xfbf6ee,
    water: 0x5aa9c4
  };

  DSAV.COLORS = COLORS;

  function rgbHex(num) {
    return "#" + num.toString(16).padStart(6, "0");
  }
  DSAV.rgbHex = rgbHex;

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ---- text sprite (crisp canvas texture) ---- */
  function makeLabel(text, opts) {
    opts = opts || {};
    const fs = opts.fontSize || 52;
    const pad = 20;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const font = `600 ${fs}px "JetBrains Mono", monospace`;
    ctx.font = font;
    const w = Math.max(fs + pad * 2, Math.ceil(ctx.measureText(text).width) + pad * 2);
    const h = fs + pad * 2;
    canvas.width = w;
    canvas.height = h;

    function paint(txt) {
      ctx.clearRect(0, 0, w, h);
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (opts.bg) {
        ctx.fillStyle = opts.bg;
        roundRect(ctx, 1, 1, w - 2, h - 2, 16);
        ctx.fill();
      }
      ctx.fillStyle = opts.color || "#fbf6ee";
      ctx.fillText(txt, w / 2, h / 2 + 2);
    }
    paint(text);

    const tex = new T.CanvasTexture(canvas);
    tex.minFilter = T.LinearFilter;
    tex.anisotropy = 4;
    const mat = new T.SpriteMaterial({ map: tex, transparent: true, depthTest: !opts.noDepth });
    const sprite = new T.Sprite(mat);
    const scale = (opts.scale || 1) * 0.01;
    sprite.scale.set(w * scale, h * scale, 1);
    sprite.userData.setText = function (newText) {
      paint(newText);
      tex.needsUpdate = true;
    };
    return sprite;
  }

  /* ---- box bar ---- */
  function makeBar(w, h, d, color) {
    const geo = new T.BoxGeometry(w, h, d);
    const mat = new T.MeshStandardMaterial({
      color: color,
      roughness: 0.55,
      metalness: 0.15,
      emissive: 0x000000
    });
    const mesh = new T.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /* ---- pointer arrow (cone) that points up, with an optional label ---- */
  function makePointer(color, label) {
    const group = new T.Group();
    const geo = new T.ConeGeometry(0.34, 0.72, 24);
    const mat = new T.MeshStandardMaterial({
      color, roughness: 0.4, metalness: 0.3, emissive: color, emissiveIntensity: 0.3
    });
    const cone = new T.Mesh(geo, mat);
    cone.castShadow = true;
    group.add(cone);
    if (label) {
      const spr = makeLabel(label, { fontSize: 44, color: "#1c0d07", bg: rgbHex(color), scale: 1.0 });
      spr.position.y = -0.9;
      group.add(spr);
    }
    group.userData.cone = cone;
    return group;
  }

  /* lerp an object toward object.userData.tgt (Vector3) */
  function lerpToTarget(obj, speed) {
    const t = obj.userData.tgt;
    if (!t) return;
    obj.position.x += (t.x - obj.position.x) * speed;
    obj.position.y += (t.y - obj.position.y) * speed;
    obj.position.z += (t.z - obj.position.z) * speed;
  }

  /* ============================================================
     Stage
     ============================================================ */
  function Stage(container) {
    const scene = new T.Scene();
    scene.background = new T.Color(COLORS.bg);
    scene.fog = new T.Fog(COLORS.bg, 22, 58);

    const rect = container.getBoundingClientRect();
    const camera = new T.PerspectiveCamera(48, (rect.width || 640) / (rect.height || 440), 0.1, 200);
    camera.position.set(0, 6.5, 17);

    const renderer = new T.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(rect.width || 640, rect.height || 440);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // lights
    scene.add(new T.HemisphereLight(0xf3ebdd, 0x2c150c, 0.55));
    const key = new T.DirectionalLight(0xffe9cc, 1.05);
    key.position.set(6, 14, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 60;
    key.shadow.camera.left = -22; key.shadow.camera.right = 22;
    key.shadow.camera.top = 22; key.shadow.camera.bottom = -22;
    scene.add(key);
    const rim = new T.DirectionalLight(0xcf8552, 0.5);
    rim.position.set(-8, 6, -6);
    scene.add(rim);
    scene.add(new T.AmbientLight(0xffffff, 0.25));

    // ground
    const ground = new T.Mesh(
      new T.PlaneGeometry(80, 80),
      new T.MeshStandardMaterial({ color: COLORS.ground, roughness: 0.95, metalness: 0.05 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new T.GridHelper(60, 60, COLORS.grid, 0x3a1c11);
    grid.material.opacity = 0.35;
    grid.material.transparent = true;
    scene.add(grid);

    // controls
    const controls = new T.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 6;
    controls.maxDistance = 42;
    controls.maxPolarAngle = Math.PI * 0.52;
    controls.target.set(0, 1.6, 0);

    // world group (viz builds here so it can be cleared)
    const world = new T.Group();
    scene.add(world);

    const ticks = [];
    function onTick(fn) { ticks.push(fn); }

    let raf = null;
    let disposed = false;
    const clock = new T.Clock();

    function animate() {
      if (disposed) return;
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      for (let i = 0; i < ticks.length; i++) ticks[i](dt);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // resize
    const ro = new ResizeObserver(() => {
      const r = container.getBoundingClientRect();
      if (!r.width || !r.height) return;
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
      renderer.setSize(r.width, r.height);
    });
    ro.observe(container);

    function dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    }

    /* smooth camera framing helper */
    function frame(targetX, targetY, dist) {
      controls.target.set(targetX, targetY, 0);
      camera.position.set(targetX * 0.4, targetY + 4.5, dist);
    }

    return {
      scene, world, camera, renderer, controls,
      onTick, dispose, frame, THREE: T, lerpToTarget
    };
  }

  DSAV.Stage = Stage;
  DSAV.makeLabel = makeLabel;
  DSAV.makeBar = makeBar;
  DSAV.makePointer = makePointer;
  DSAV.lerpToTarget = lerpToTarget;
})();
