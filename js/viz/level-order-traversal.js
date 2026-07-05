/* ============================================================
   Viz: Binary Tree Level Order Traversal (LC 102)
   Tree laid out with depth as height and in-order position as x.
   A BFS queue processes one full level at a time — every node in
   the current level lights up together, then its children queue
   up for the next level. Each level's collected values appear as
   a result row.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["level-order-traversal"] = {
  samples: [
    { label: "[3,9,20,null,null,15,7]", tree: [3, 9, 20, null, null, 15, 7] },
    { label: "[1]", tree: [1] },
    { label: "[]", tree: [] },
    { label: "[1,2,3,4,5,6,7]", tree: [1, 2, 3, 4, 5, 6, 7] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const arr = this.samples[sampleIndex].tree;

    // build node objects from level-order array (LeetCode-style, null = missing)
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

    // assign x via in-order index, y via depth
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

    const spacingX = 2.0, spacingY = 2.2;
    const totalW = Math.max(xCounter, 1);
    const nodeR = 0.55;
    const nodeMeshes = new Map();

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
      [node.left, node.right].forEach((child) => {
        if (!child) return;
        const from = new T.Vector3(worldX(node), worldY(node), 0);
        const to = new T.Vector3(worldX(child), worldY(child), 0);
        const geo = new T.BufferGeometry().setFromPoints([from, to]);
        const line = new T.Line(geo, new T.LineBasicMaterial({ color: 0x6b331d }));
        S.world.add(line);
        render(child);
      });
    })(root);

    const topY = (maxDepth + 1) * spacingY + 2.5;
    const levelLbl = DSAV.makeLabel(root ? "level 0" : "empty tree", { fontSize: 42, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.0, noDepth: true });
    levelLbl.position.set(0, topY, 0);
    S.world.add(levelLbl);

    S.controls.target.set(0, topY * 0.4, 0);
    S.camera.position.set(0, topY * 0.5 + 3, Math.max(14, totalW * 2.2));

    // ---- steps: BFS level by level ----
    const steps = [];
    const allLevels = [];
    if (root) {
      let queue = [root];
      let depth = 0;
      while (queue.length) {
        const levelVals = queue.map((n) => n.val);
        allLevels.push(levelVals);
        steps.push({ type: "level", depth, nodes: [...queue], levels: allLevels.map((l) => [...l]) });
        const next = [];
        for (const n of queue) { if (n.left) next.push(n.left); if (n.right) next.push(n.right); }
        queue = next;
        depth++;
      }
    }
    steps.push({ type: "done", levels: allLevels.map((l) => [...l]) });

    steps.forEach((s) => {
      s.vars = [
        { k: "level", v: s.depth !== undefined ? s.depth : "—" },
        { k: "levels so far", v: s.levels.length }
      ];
      if (s.type === "level") s.note = `Process every node in level ${s.depth} together: [${s.nodes.map((n) => n.val).join(", ")}]. Queue up their children for the next level.`;
      else { s.note = `BFS complete. Collected one array per level.`; s.results = s.levels.map((l) => `[${l.join(", ")}]`); }
    });

    function goTo(k) {
      const s = steps[k];
      const activeSet = new Set(s.nodes || []);
      nodeMeshes.forEach((mesh, node) => {
        const active = activeSet.has(node);
        mesh.userData.targetColor = new T.Color(active ? C.good : C.bar);
        mesh.userData.emissiveColor.set(active ? C.good : 0x000000);
        mesh.userData.active = active;
      });
      levelLbl.userData.setText(s.type === "level" ? `level ${s.depth}` : "done");
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      nodeMeshes.forEach((mesh) => {
        const m = mesh.material;
        m.color.lerp(mesh.userData.targetColor, 0.15);
        m.emissive.lerp(mesh.userData.emissiveColor, 0.2);
        m.emissiveIntensity = mesh.userData.active ? (0.4 + Math.sin(t) * 0.2) : 0.0;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
