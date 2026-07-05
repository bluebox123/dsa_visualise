/* ============================================================
   Viz: Serialize and Deserialize Binary Tree (LC 297)
   Same tree layout. Preorder DFS visits node, then left, then
   right, emitting "#" for every null child it encounters — those
   nulls are drawn as small ghost markers so you can see exactly
   where the encoding records "nothing here". Each visited node
   appends its value to a growing serialized string readout.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["serialize-tree"] = {
  samples: [
    { label: "[1,2,3,null,null,4,5]", tree: [1, 2, 3, null, null, 4, 5] },
    { label: "[1]", tree: [1] },
    { label: "[]", tree: [] },
    { label: "[1,2,null,3,null,4]", tree: [1, 2, null, 3, null, 4] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const arr = this.samples[sampleIndex].tree;

    function buildTree(arr) {
      if (!arr.length || arr[0] === null) return null;
      const root = { val: arr[0], left: null, right: null };
      const queue = [root];
      let i = 1;
      while (queue.length && i < arr.length) {
        const node = queue.shift();
        if (i < arr.length) { const v = arr[i++]; if (v !== null) { node.left = { val: v, left: null, right: null }; queue.push(node.left); } }
        if (i < arr.length) { const v = arr[i++]; if (v !== null) { node.right = { val: v, left: null, right: null }; queue.push(node.right); } }
      }
      return root;
    }
    const root = buildTree(arr);

    let xCounter = 0;
    const positions = new Map();
    let maxDepth = 0;
    (function assign(node, depth) {
      if (!node) return;
      assign(node.left, depth + 1);
      positions.set(node, { x: xCounter++, depth });
      maxDepth = Math.max(maxDepth, depth);
      assign(node.right, depth + 1);
    })(root, 0);

    const spacingX = 2.0, spacingY = 2.2, totalW = Math.max(xCounter, 1), nodeR = 0.55;
    const nodeMeshes = new Map();
    const ghostMeshes = new Map();
    function worldX(node) { return (positions.get(node).x - (totalW - 1) / 2) * spacingX; }
    function worldY(node) { return (maxDepth - positions.get(node).depth) * spacingY + 1; }

    (function render(node) {
      if (!node) return;
      const sphere = new T.Mesh(new T.SphereGeometry(nodeR, 24, 24), new T.MeshStandardMaterial({ color: C.bar, roughness: 0.4, metalness: 0.2 }));
      sphere.position.set(worldX(node), worldY(node), 0);
      sphere.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(sphere);
      const lbl = DSAV.makeLabel(String(node.val), { fontSize: 44, color: "#1c0d07", scale: 0.9 });
      lbl.position.set(0, 0, nodeR + 0.05); sphere.add(lbl);
      nodeMeshes.set(node, sphere);
      [["left", node.left], ["right", node.right]].forEach(([side, child]) => {
        if (child) {
          const geo = new T.BufferGeometry().setFromPoints([new T.Vector3(worldX(node), worldY(node), 0), new T.Vector3(worldX(child), worldY(child), 0)]);
          S.world.add(new T.Line(geo, new T.LineBasicMaterial({ color: 0x6b331d })));
          render(child);
        } else {
          const off = side === "left" ? -0.9 : 0.9;
          const ghost = new T.Mesh(new T.SphereGeometry(0.28, 12, 12), new T.MeshBasicMaterial({ color: 0x6b331d, wireframe: true, transparent: true, opacity: 0.6 }));
          ghost.position.set(worldX(node) + off, worldY(node) - spacingY * 0.6, 0);
          ghost.visible = false;
          ghostMeshes.set(`${node.val}-${side}`, ghost);
          S.world.add(ghost);
        }
      });
    })(root);

    const topY = (maxDepth + 1) * spacingY + 2.6;
    const serLbl = DSAV.makeLabel("serialized: (empty)", { fontSize: 34, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 0.8, noDepth: true });
    serLbl.position.set(0, topY, 0);
    S.world.add(serLbl);
    S.controls.target.set(0, topY * 0.4, 0);
    S.camera.position.set(0, topY * 0.5 + 3, Math.max(14, totalW * 2.4));

    // ---- steps: preorder DFS, emit tokens ----
    const steps = [];
    const tokens = [];
    function dfs(node, side, parentVal) {
      if (!node) {
        tokens.push("#");
        steps.push({ type: "null", side, parentVal, tokens: [...tokens] });
        return;
      }
      tokens.push(String(node.val));
      steps.push({ type: "visit", node, tokens: [...tokens] });
      dfs(node.left, "left", node.val);
      dfs(node.right, "right", node.val);
    }
    dfs(root, null, null);
    steps.push({ type: "done", tokens: [...tokens] });

    steps.forEach((s) => {
      s.vars = [
        { k: "tokens emitted", v: s.tokens.length },
        { k: "serialized so far", v: s.tokens.join(","), cls: "good" }
      ];
      switch (s.type) {
        case "visit": s.note = `Preorder: emit node <b>${s.node.val}</b>, then recurse left, then right.`; break;
        case "null": s.note = `No ${s.side} child here (parent was ${s.parentVal}) — emit a <b>"#"</b> marker so deserialization knows to stop.`; break;
        case "done": s.note = `Preorder DFS complete. The "#" markers make the string unambiguous — deserialization just replays the same preorder recursion, consuming tokens.`; s.results = [`"${s.tokens.join(",")}"`]; break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      ghostMeshes.forEach((ghost) => { ghost.visible = false; });
      if (s.type === "null") {
        const ghost = ghostMeshes.get(`${s.parentVal}-${s.side}`);
        if (ghost) ghost.visible = true;
      }
      nodeMeshes.forEach((mesh, node) => {
        let active = false, em = 0x000000;
        if (s.type === "visit" && node === s.node) { active = true; em = C.good; }
        mesh.userData.targetColor = new T.Color(C.bar);
        mesh.userData.emissiveColor.set(em);
        mesh.userData.active = active;
      });
      serLbl.userData.setText(`serialized: ${s.tokens.join(",")}`);
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      nodeMeshes.forEach((mesh) => {
        const m = mesh.material;
        m.color.lerp(mesh.userData.targetColor, 0.16);
        m.emissive.lerp(mesh.userData.emissiveColor, 0.2);
        m.emissiveIntensity = mesh.userData.active ? (0.4 + Math.sin(t) * 0.2) : 0.0;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
