/* ============================================================
   Viz: Binary Tree Maximum Path Sum (LC 124)
   Same tree layout. Post-order DFS returns each node's best
   downward "gain" (best single-branch continuation, clamped to
   ≥0 since negative contributions are worth discarding). At every
   node we ALSO check the "through" path — left gain + node.val +
   right gain — which can bend at this node; that updates a global
   best-so-far even though only one side of it can be returned
   upward.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["max-path-sum"] = {
  samples: [
    { label: "[1,2,3]", tree: [1, 2, 3] },
    { label: "[-10,9,20,null,null,15,7]", tree: [-10, 9, 20, null, null, 15, 7] },
    { label: "[2,-1]", tree: [2, -1] },
    { label: "[5,4,8,11,null,13,4,7,2,null,null,null,1]", tree: [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1] }
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
      const gainLbl = DSAV.makeLabel("", { fontSize: 30, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 0.6, noDepth: true });
      gainLbl.position.set(0, -0.85, 0); gainLbl.visible = false; sphere.add(gainLbl); sphere.gainLbl = gainLbl;
      nodeMeshes.set(node, sphere);
      [node.left, node.right].forEach((child) => {
        if (!child) return;
        const geo = new T.BufferGeometry().setFromPoints([new T.Vector3(worldX(node), worldY(node), 0), new T.Vector3(worldX(child), worldY(child), 0)]);
        S.world.add(new T.Line(geo, new T.LineBasicMaterial({ color: 0x6b331d })));
        render(child);
      });
    })(root);

    const topY = (maxDepth + 1) * spacingY + 2.5;
    const bestLbl = DSAV.makeLabel("best = −∞", { fontSize: 42, color: "#1c0d07", bg: DSAV.rgbHex(C.good), scale: 1.0, noDepth: true });
    bestLbl.position.set(0, topY, 0);
    S.world.add(bestLbl);
    S.controls.target.set(0, topY * 0.4, 0);
    S.camera.position.set(0, topY * 0.5 + 3, Math.max(14, totalW * 2.2));

    // ---- steps: post-order, gain + through-path check ----
    const steps = [];
    let best = -Infinity;
    function dfs(node) {
      if (!node) return 0;
      const leftGain = Math.max(dfs(node.left), 0);
      const rightGain = Math.max(dfs(node.right), 0);
      const through = node.val + leftGain + rightGain;
      const prevBest = best;
      best = Math.max(best, through);
      steps.push({ type: "visit", node, leftGain, rightGain, through, best, improved: best > prevBest });
      return node.val + Math.max(leftGain, rightGain);
    }
    dfs(root);
    steps.push({ type: "done", best });

    steps.forEach((s) => {
      s.vars = [
        { k: "node", v: s.node ? s.node.val : "—" },
        { k: "left gain", v: s.leftGain !== undefined ? s.leftGain : "—" },
        { k: "right gain", v: s.rightGain !== undefined ? s.rightGain : "—" },
        { k: "through path", v: s.through !== undefined ? s.through : "—", cls: "hot" },
        { k: "best so far", v: s.best, cls: "good" }
      ];
      if (s.type === "visit") {
        s.note = `At <b>${s.node.val}</b>: best downward gains are ${s.leftGain} (left) and ${s.rightGain} (right), clamped at 0 (negative branches aren't worth taking). ` +
          `Path bending through this node = ${s.node.val} + ${s.leftGain} + ${s.rightGain} = <b>${s.through}</b>.` + (s.improved ? " New best!" : "");
      } else {
        s.note = `DFS complete. The maximum path sum anywhere in the tree is <b>${s.best}</b>.`;
        s.results = [`max path sum = ${s.best}`];
      }
    });

    function goTo(k) {
      const s = steps[k];
      nodeMeshes.forEach((mesh, node) => {
        let active = false, em = 0x000000;
        mesh.gainLbl.visible = false;
        if (s.type === "visit" && node === s.node) {
          active = true; em = s.improved ? C.good : C.hot;
          mesh.gainLbl.visible = true;
          mesh.gainLbl.userData.setText(`gain=${s.node.val + Math.max(s.leftGain, s.rightGain)}`);
        }
        mesh.userData.targetColor = new T.Color(C.bar);
        mesh.userData.emissiveColor.set(em);
        mesh.userData.active = active;
      });
      bestLbl.userData.setText(`best = ${s.best}`);
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
