/* ============================================================
   Viz: Binary Tree Right Side View (LC 199)
   Same tree layout as Level Order. BFS processes each level; only
   the LAST node visited in each level (the rightmost) is kept —
   it glows green and joins the growing "view" list. Every other
   node in that level briefly highlights amber then fades.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["right-side-view"] = {
  samples: [
    { label: "[1,2,3,null,5,null,4]", tree: [1, 2, 3, null, 5, null, 4] },
    { label: "[1,null,3]", tree: [1, null, 3] },
    { label: "[]", tree: [] },
    { label: "[1,2,3,4,null,null,null,5]", tree: [1, 2, 3, 4, null, null, null, 5] }
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
        const geo = new T.BufferGeometry().setFromPoints([new T.Vector3(worldX(node), worldY(node), 0), new T.Vector3(worldX(child), worldY(child), 0)]);
        S.world.add(new T.Line(geo, new T.LineBasicMaterial({ color: 0x6b331d })));
        render(child);
      });
    })(root);

    const topY = (maxDepth + 1) * spacingY + 2.5;
    const viewLbl = DSAV.makeLabel("view: []", { fontSize: 40, color: "#1c0d07", bg: DSAV.rgbHex(C.good), scale: 0.95, noDepth: true });
    viewLbl.position.set(0, topY, 0);
    S.world.add(viewLbl);
    S.controls.target.set(0, topY * 0.4, 0);
    S.camera.position.set(0, topY * 0.5 + 3, Math.max(14, totalW * 2.2));

    // ---- steps: BFS, keep last node of each level ----
    const steps = [];
    const view = [];
    if (root) {
      let queue = [root];
      let depth = 0;
      while (queue.length) {
        const last = queue[queue.length - 1];
        view.push(last.val);
        steps.push({ type: "level", depth, nodes: [...queue], last, view: [...view] });
        const next = [];
        for (const n of queue) { if (n.left) next.push(n.left); if (n.right) next.push(n.right); }
        queue = next;
        depth++;
      }
    }
    steps.push({ type: "done", view: [...view] });

    steps.forEach((s) => {
      s.vars = [
        { k: "level", v: s.depth !== undefined ? s.depth : "—" },
        { k: "view so far", v: `[${s.view.join(", ")}]`, cls: "good" }
      ];
      if (s.type === "level") s.note = `Level ${s.depth} has nodes [${s.nodes.map((n) => n.val).join(", ")}]. The <b>rightmost</b> one, ${s.last.val}, is what you'd see standing to the right of the tree.`;
      else { s.note = `BFS complete. The right side view is the last node kept from every level.`; s.results = [`[${s.view.join(", ")}]`]; }
    });

    function goTo(k) {
      const s = steps[k];
      const levelSet = new Set(s.nodes || []);
      nodeMeshes.forEach((mesh, node) => {
        let active = false, col = C.bar, em = 0x000000;
        if (levelSet.has(node)) {
          active = true;
          if (node === s.last) { col = C.good; em = C.good; } else { col = C.hot; em = 0x3a1c05; }
        }
        mesh.userData.targetColor = new T.Color(col);
        mesh.userData.emissiveColor.set(em);
        mesh.userData.active = active;
      });
      viewLbl.userData.setText(`view: [${s.view.join(", ")}]`);
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
