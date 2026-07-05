/* ============================================================
   Viz: Validate Binary Search Tree (LC 98)
   Tree laid out with depth as height, in-order position as x.
   Recursive DFS passes down a (min, max) bound to each node; a
   node glows green if it satisfies its bound, red the instant one
   fails — that's proof the tree isn't a valid BST.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["validate-bst"] = {
  samples: [
    { label: "[2,1,3]  (valid)", tree: [2, 1, 3] },
    { label: "[5,1,4,null,null,3,6]  (invalid)", tree: [5, 1, 4, null, null, 3, 6] },
    { label: "[5,4,6,null,null,3,7]  (invalid)", tree: [5, 4, 6, null, null, 3, 7] },
    { label: "[10,5,15,null,null,6,20]  (invalid)", tree: [10, 5, 15, null, null, 6, 20] }
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

    const topY = (maxDepth + 1) * spacingY + 2.6;
    const noteBg = DSAV.makeLabel("checking...", { fontSize: 38, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 0.9, noDepth: true });
    noteBg.position.set(0, topY, 0);
    S.world.add(noteBg);
    S.controls.target.set(0, topY * 0.4, 0);
    S.camera.position.set(0, topY * 0.5 + 3, Math.max(14, totalW * 2.2));

    // ---- steps: DFS with (min,max) bounds ----
    const steps = [];
    let failed = false;
    (function dfs(node, lo, hi) {
      if (!node || failed) return;
      const inBounds = (lo === null || node.val > lo) && (hi === null || node.val < hi);
      steps.push({ type: "check", node, lo, hi, inBounds });
      if (!inBounds) { failed = true; return; }
      dfs(node.left, lo, node.val);
      if (failed) return;
      dfs(node.right, node.val, hi);
    })(root, null, null);
    steps.push({ type: "done", valid: !failed });

    steps.forEach((s) => {
      s.vars = [
        { k: "node", v: s.node ? s.node.val : "—" },
        { k: "lower bound", v: s.lo === null || s.lo === undefined ? "−∞" : s.lo },
        { k: "upper bound", v: s.hi === null || s.hi === undefined ? "+∞" : s.hi }
      ];
      if (s.type === "check") {
        s.note = s.inBounds
          ? `Node <b>${s.node.val}</b> is within (${s.lo === null ? "−∞" : s.lo}, ${s.hi === null ? "+∞" : s.hi}) — valid so far. Recurse left with upper bound ${s.node.val}, right with lower bound ${s.node.val}.`
          : `Node <b>${s.node.val}</b> violates its bound (${s.lo === null ? "−∞" : s.lo}, ${s.hi === null ? "+∞" : s.hi}) — <b>not a valid BST</b>.`;
      } else {
        s.note = s.valid ? `Every node satisfied its inherited bound — this <b>is</b> a valid BST.` : `A bound was violated — this tree is <b>not</b> a valid BST.`;
        s.results = [s.valid ? "true (valid BST)" : "false (invalid)"];
      }
    });

    function goTo(k) {
      const s = steps[k];
      nodeMeshes.forEach((mesh, node) => {
        let active = false, col = C.bar, em = 0x000000;
        if (s.type === "check" && node === s.node) { active = true; col = s.inBounds ? C.good : C.bad; em = col; }
        mesh.userData.targetColor = new T.Color(col);
        mesh.userData.emissiveColor.set(em);
        mesh.userData.active = active;
      });
      noteBg.userData.setText(s.type === "check" ? (s.inBounds ? "ok" : "violation!") : (s.valid ? "valid BST" : "invalid"));
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      nodeMeshes.forEach((mesh) => {
        const m = mesh.material;
        m.color.lerp(mesh.userData.targetColor, 0.16);
        m.emissive.lerp(mesh.userData.emissiveColor, 0.22);
        m.emissiveIntensity = mesh.userData.active ? (0.4 + Math.sin(t) * 0.2) : 0.0;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
