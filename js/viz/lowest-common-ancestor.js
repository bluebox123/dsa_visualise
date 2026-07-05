/* ============================================================
   Viz: Lowest Common Ancestor of a Binary Tree (LC 236)
   Same tree layout. Post-order DFS: recurse left and right first,
   each call reports whether it found target p or q below it. A
   node where BOTH sides report a find (or the node itself is one
   of the targets, with a find on either side) is the split point
   — the LCA — highlighted gold and kept even as recursion unwinds.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["lowest-common-ancestor"] = {
  samples: [
    { label: "[3,5,1,6,2,0,8,null,null,7,4] p=5 q=1", tree: [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p: 5, q: 1 },
    { label: "[3,5,1,6,2,0,8,null,null,7,4] p=5 q=4", tree: [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p: 5, q: 4 },
    { label: "[1,2] p=1 q=2", tree: [1, 2], p: 1, q: 2 },
    { label: "[6,2,8,0,4,7,9,null,null,3,5] p=2 q=8", tree: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 2, q: 8 }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const data = this.samples[sampleIndex];
    const arr = data.tree, pVal = data.p, qVal = data.q;

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
      const isTarget = node.val === pVal || node.val === qVal;
      const sphere = new T.Mesh(new T.SphereGeometry(nodeR, 24, 24), new T.MeshStandardMaterial({ color: isTarget ? C.anchor : C.bar, roughness: 0.4, metalness: 0.2 }));
      sphere.position.set(worldX(node), worldY(node), 0);
      sphere.userData = { targetColor: new T.Color(isTarget ? C.anchor : C.bar), emissiveColor: new T.Color(0x000000), active: false };
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
    const noteBg = DSAV.makeLabel(`finding LCA(${pVal}, ${qVal})`, { fontSize: 36, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 0.85, noDepth: true });
    noteBg.position.set(0, topY, 0);
    S.world.add(noteBg);
    S.controls.target.set(0, topY * 0.4, 0);
    S.camera.position.set(0, topY * 0.5 + 3, Math.max(14, totalW * 2.2));

    // ---- steps: post-order DFS, find LCA ----
    const steps = [];
    let lcaNode = null;
    function dfs(node) {
      if (!node) return false;
      const leftFound = dfs(node.left);
      const rightFound = dfs(node.right);
      const isSelf = node.val === pVal || node.val === qVal;
      const found = leftFound || rightFound || isSelf;
      steps.push({ type: "visit", node, leftFound, rightFound, isSelf, found });
      if (!lcaNode && ((leftFound && rightFound) || (isSelf && (leftFound || rightFound)))) {
        lcaNode = node;
        steps.push({ type: "found-lca", node });
      }
      return found;
    }
    dfs(root);
    steps.push({ type: "done", node: lcaNode });

    steps.forEach((s) => {
      s.vars = [
        { k: "node", v: s.node ? s.node.val : "—" },
        { k: "found in subtree", v: s.found !== undefined ? (s.found ? "yes" : "no") : "—" }
      ];
      switch (s.type) {
        case "visit": s.note = `Post-order visit of <b>${s.node.val}</b>: left subtree ${s.leftFound ? "found a target" : "found nothing"}, right subtree ${s.rightFound ? "found a target" : "found nothing"}${s.isSelf ? `, and this node IS a target (${s.node.val})` : ""}.`; break;
        case "found-lca": s.note = `Both a left-side hit and a right-side hit (or this node itself plus one side) converge at <b>${s.node.val}</b> — this is the <b>split point</b>, i.e. the LCA.`; break;
        case "done": s.note = `DFS complete. Lowest Common Ancestor of ${pVal} and ${qVal} is <b>${s.node.val}</b>.`; s.results = [`LCA = ${s.node.val}`]; break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      nodeMeshes.forEach((mesh, node) => {
        let active = false, col = (node.val === pVal || node.val === qVal) ? C.anchor : C.bar, em = 0x000000;
        if (s.type === "visit" && node === s.node) { active = true; em = C.left; }
        if ((s.type === "found-lca" || s.type === "done") && node === (s.node || lcaNode)) { col = C.hot; em = C.hot; active = true; }
        mesh.userData.targetColor = new T.Color(col);
        mesh.userData.emissiveColor.set(em);
        mesh.userData.active = active;
      });
      noteBg.userData.setText(s.type === "found-lca" || s.type === "done" ? `LCA = ${(s.node || lcaNode).val}` : `visiting ${s.node.val}`);
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
