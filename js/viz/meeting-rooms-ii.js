/* ============================================================
   Viz: Meeting Rooms II (LC 253)
   Meetings as bars on a timeline. Below, a moving "sweep line"
   scans all start/end events in time order: a start bumps the
   active-room counter up, an end bumps it down. The peak value of
   that counter across the whole sweep is the minimum rooms needed.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["meeting-rooms-ii"] = {
  samples: [
    { label: "[[0,30],[5,10],[15,20]]", intervals: [[0, 30], [5, 10], [15, 20]] },
    { label: "[[7,10],[2,4]]", intervals: [[7, 10], [2, 4]] },
    { label: "[[1,5],[8,9],[8,9]]", intervals: [[1, 5], [8, 9], [8, 9]] },
    { label: "[[1,10],[2,7],[3,19],[8,12],[10,20],[11,30]]", intervals: [[1, 10], [2, 7], [3, 19], [8, 12], [10, 20], [11, 30]] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const intervals = this.samples[sampleIndex].intervals, n = intervals.length;

    const maxEnd = Math.max(...intervals.map((iv) => iv[1]));
    const scaleX = 13 / maxEnd;
    const xAt = (v) => v * scaleX - 6.5;
    const rowH = 1.4, barH = 0.9, depth = 1.0;

    const rows = intervals.map((iv, r) => {
      const w = Math.max(0.3, (iv[1] - iv[0]) * scaleX);
      const bar = DSAV.makeBar(w, barH, depth, C.bar);
      bar.position.set(xAt(iv[0]) + w / 2, (n - r) * rowH + 1, 0);
      bar.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(bar);
      const lbl = DSAV.makeLabel(`[${iv[0]},${iv[1]}]`, { fontSize: 34, color: "#fbf6ee", scale: 0.72 });
      lbl.position.set(0, 0.75, depth / 2 + 0.1); bar.add(lbl);
      return bar;
    });

    // sweep line
    const sweepH = (n + 1) * rowH + 2;
    const sweep = DSAV.makeBar(0.14, sweepH, 0.3, C.hot);
    sweep.position.set(xAt(0), sweepH / 2, 1.0);
    sweep.userData = { tgtX: xAt(0) };
    S.world.add(sweep);

    const topY = (n + 1) * rowH + 3.2;
    const roomsLbl = DSAV.makeLabel("active rooms = 0", { fontSize: 42, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.0, noDepth: true });
    roomsLbl.position.set(0, topY, 0);
    S.world.add(roomsLbl);
    const maxLbl = DSAV.makeLabel("peak = 0", { fontSize: 40, color: "#1c0d07", bg: DSAV.rgbHex(C.good), scale: 0.95, noDepth: true });
    maxLbl.position.set(0, topY + 1.0, 0);
    S.world.add(maxLbl);

    S.controls.target.set(0, topY * 0.42, 0);
    S.camera.position.set(0, topY * 0.5 + 3, 16);

    // ---- steps: event sweep (starts and ends sorted separately; tie -> end processed first) ----
    const starts = intervals.map((iv) => iv[0]).sort((a, b) => a - b);
    const ends = intervals.map((iv) => iv[1]).sort((a, b) => a - b);
    const steps = [];
    let s = 0, e = 0, active = 0, peak = 0;
    while (s < n) {
      if (starts[s] < ends[e]) {
        active++;
        peak = Math.max(peak, active);
        steps.push({ type: "start", time: starts[s], active, peak });
        s++;
      } else {
        active--;
        steps.push({ type: "end", time: ends[e], active, peak });
        e++;
      }
    }
    steps.push({ type: "done", peak });

    steps.forEach((st) => {
      st.vars = [
        { k: "time", v: st.time !== undefined ? st.time : "—" },
        { k: "active rooms", v: st.active !== undefined ? st.active : 0, cls: "hot" },
        { k: "peak so far", v: st.peak, cls: "good" }
      ];
      switch (st.type) {
        case "start": st.note = `A meeting starts at t=${st.time} → active rooms rise to <b>${st.active}</b>.` + (st.active === st.peak && st.active > 0 ? " New peak!" : ""); break;
        case "end": st.note = `A meeting ends at t=${st.time} → active rooms drop to <b>${st.active}</b>, freeing a room.`; break;
        case "done": st.note = `Sweep complete. The highest number of simultaneously active meetings was <b>${st.peak}</b> — that's the minimum rooms needed.`; st.results = [`rooms = ${st.peak}`]; break;
      }
    });

    function goTo(k) {
      const st = steps[k];
      const time = st.time !== undefined ? st.time : maxEnd;
      sweep.userData.tgtX = xAt(time);

      rows.forEach((bar, i) => {
        const iv = intervals[i];
        const active2 = iv[0] <= time && time < iv[1] && st.type !== "done";
        const past = time >= iv[1];
        let col = new T.Color(active2 ? C.good : (past ? C.dim : C.bar));
        bar.userData.targetColor = col;
        bar.userData.emissiveColor.set(active2 ? C.good : 0x000000);
        bar.userData.active = active2;
      });

      roomsLbl.userData.setText(`active rooms = ${st.active !== undefined ? st.active : 0}`);
      maxLbl.userData.setText(`peak = ${st.peak}`);
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      rows.forEach((bar) => {
        const m = bar.material;
        m.color.lerp(bar.userData.targetColor, 0.14);
        m.emissive.lerp(bar.userData.emissiveColor, 0.18);
        m.emissiveIntensity = bar.userData.active ? (0.35 + Math.sin(t) * 0.18) : 0.0;
      });
      sweep.position.x += (sweep.userData.tgtX - sweep.position.x) * 0.2;
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
