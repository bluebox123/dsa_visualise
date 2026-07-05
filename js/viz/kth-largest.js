/* ============================================================
   Viz: Kth Largest Element in an Array (LC 215)
   Value bars. A "keep set" of size k floats above as a row of
   candidate slots (min-heap of the k largest seen). Scanning
   left to right: if the heap has room, take the value in; once
   full, a new value only enters if it beats the heap's smallest
   member, which then gets evicted. The heap's min at the end is
   the k-th largest.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["kth-largest"] = {
  samples: [
    { label: "[3,2,1,5,6,4]  k=2", nums: [3, 2, 1, 5, 6, 4], k: 2 },
    { label: "[3,2,3,1,2,4,5,5,6]  k=4", nums: [3, 2, 3, 1, 2, 4, 5, 5, 6], k: 4 },
    { label: "[1]  k=1", nums: [1], k: 1 },
    { label: "[7,6,5,4,3,2,1]  k=3", nums: [7, 6, 5, 4, 3, 2, 1], k: 3 }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const data = this.samples[sampleIndex];
    const nums = data.nums, k = data.k, n = nums.length;

    const spacing = Math.min(2.2, 15 / n);
    const depth = 1.2;
    const maxV = Math.max(...nums);
    const unit = 4.4 / maxV;
    const xAt = (i) => (i - (n - 1) / 2) * spacing;
    const hAt = (v) => Math.max(0.4, v * unit);

    const bars = [];
    nums.forEach((v, i) => {
      const h = hAt(v);
      const bar = DSAV.makeBar(1.3, h, depth, C.bar);
      bar.position.set(xAt(i), h / 2, 0);
      bar.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(bar);
      bars.push(bar);
      const val = DSAV.makeLabel(String(v), { fontSize: 44, color: "#fbf6ee", scale: 0.95 });
      val.position.set(xAt(i), h + 0.4, depth / 2);
      S.world.add(val);
    });

    const zFront = depth / 2 + 1.1;
    const pCur = DSAV.makePointer(C.left, "i");
    pCur.position.y = 0.55; pCur.userData.tgt = new T.Vector3(0, 0.55, zFront);
    S.world.add(pCur);

    // heap slots (k of them) floating above
    const heapY = maxV * unit + 2.2;
    const heapSpacing = 1.7;
    const slots = [];
    for (let i = 0; i < k; i++) {
      const slot = DSAV.makeBar(1.4, 0.9, 1.0, C.dim);
      slot.position.set((i - (k - 1) / 2) * heapSpacing, heapY, 0);
      slot.visible = true;
      const glyph = DSAV.makeLabel("", { fontSize: 60, color: "#1c0d07", scale: 1.1 });
      glyph.position.set(0, 0, 0.55);
      slot.add(glyph);
      slot.glyph = glyph;
      slot.userData = { targetColor: new T.Color(C.dim), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(slot);
      slots.push(slot);
    }
    const heapLbl = DSAV.makeLabel(`top-${k} min-heap`, { fontSize: 40, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 0.95, noDepth: true });
    heapLbl.position.set(0, heapY + 1.1, 0);
    S.world.add(heapLbl);

    S.controls.target.set(0, heapY * 0.5, 0);
    S.camera.position.set(0, heapY * 0.55 + 3, Math.max(15, Math.max(n, k) * 2.1));

    // ---- steps: simulate a min-heap of size k with a sorted array (small n) ----
    const steps = [];
    let heap = [];
    for (let i = 0; i < n; i++) {
      const v = nums[i];
      if (heap.length < k) {
        heap.push(v); heap.sort((a, b) => a - b);
        steps.push({ type: "add", i, v, heap: [...heap] });
      } else if (v > heap[0]) {
        const evicted = heap[0];
        heap[0] = v; heap.sort((a, b) => a - b);
        steps.push({ type: "swap", i, v, evicted, heap: [...heap] });
      } else {
        steps.push({ type: "reject", i, v, heap: [...heap] });
      }
    }
    steps.push({ type: "done", heap: [...heap] });

    steps.forEach((s) => {
      s.vars = [
        { k: "i", v: s.i !== undefined ? s.i : "—" },
        { k: "value", v: s.v !== undefined ? s.v : "—" },
        { k: "heap (min-heap)", v: `[${s.heap.join(", ")}]`, cls: "hot" },
        { k: `k-th largest`, v: s.heap.length === k ? s.heap[0] : "—", cls: "good" }
      ];
      switch (s.type) {
        case "add": s.note = `Heap has room (< k=${k}) — add <b>${s.v}</b> straight in.`; break;
        case "swap": s.note = `Heap is full at k=${k}; smallest member is ${s.evicted}. <b>${s.v}</b> beats it, so evict ${s.evicted} and insert ${s.v}.`; break;
        case "reject": s.note = `Heap is full; smallest member is ${s.heap[0]}. <b>${s.v}</b> doesn't beat it — discard.`; break;
        case "done": s.note = `Scan complete. The heap's minimum is the <b>${k}-th largest</b>: <b>${s.heap[0]}</b>.`; s.results = [`${k}-th largest = ${s.heap[0]}`]; break;
      }
    });

    function goTo(idx) {
      const s = steps[idx];
      bars.forEach((bar, i) => {
        let col = new T.Color(C.dim), em = 0x000000, active = false;
        if (s.i !== undefined && i <= s.i) { col = new T.Color(C.bar); }
        if (i === s.i) {
          active = true;
          col = new T.Color(s.type === "reject" ? C.bad : C.left);
          em = col.getHex();
        }
        bar.userData.targetColor = col;
        bar.userData.emissiveColor.set(em);
        bar.userData.active = active;
      });
      pCur.visible = s.i !== undefined;
      if (s.i !== undefined) pCur.userData.tgt.set(xAt(s.i), 0.55, zFront);

      slots.forEach((slot, si) => {
        if (si < s.heap.length) {
          slot.glyph.userData.setText(String(s.heap[si]));
          const isMin = si === 0;
          slot.userData.targetColor = new T.Color(isMin ? C.good : C.hot);
          slot.userData.emissiveColor.set(isMin ? C.good : C.hot);
          slot.userData.active = true;
        } else {
          slot.glyph.userData.setText("");
          slot.userData.targetColor = new T.Color(C.dim);
          slot.userData.emissiveColor.set(0x000000);
          slot.userData.active = false;
        }
      });
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      [...bars, ...slots].forEach((obj) => {
        const m = obj.material;
        m.color.lerp(obj.userData.targetColor, 0.14);
        m.emissive.lerp(obj.userData.emissiveColor, 0.18);
        m.emissiveIntensity = obj.userData.active ? (0.3 + Math.sin(t) * 0.15) : 0.0;
      });
      DSAV.lerpToTarget(pCur, 0.16);
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
