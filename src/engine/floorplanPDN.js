/**
 * floorplanPDN.js
 * ================
 * Educational Power Distribution Network (PDN) graph connectivity and integrity model.
 * Models power rings, straps, and interlayer vias.
 *
 * Checks:
 * 1. Graph connectivity from power/ground pads (sources) to strap segments (loads).
 * 2. VDD vs VSS short circuits.
 * 3. Missing via detection at orthogonal metal layer crossings.
 * 4. Analytical educational IR-Drop estimation.
 */

// ─── Shared geometric helpers ───────────────────────────────────────────────
// All PDN shapes are axis-aligned. A ring is four edge rectangles of width
// `lineWidth` centred on its outline; a strap is a rectangle of width `width`
// centred on its (x1,y1)-(x2,y2) centreline. A via is a point that joins the
// two metal layers it names (layer1/layer2).

const DEFAULT_RING_WIDTH = 6;
const DEFAULT_STRAP_WIDTH = 4;
// Snap tolerance (µm) beyond the drawn half-width used when matching a via to metal.
const SNAP_TOL = 2;

const SHEET_RES_OHM_PER_SQ = { M1: 0.125, M2: 0.125, M3: 0.125, M4: 0.08, M5: 0.05, M6: 0.03 };
const DEFAULT_CURRENT_MA = 15; // educational default block load per strap

function ringEdgeRects(ring) {
  const hw = (Number(ring.lineWidth) || DEFAULT_RING_WIDTH) / 2;
  const { x, y, width: w, height: h } = ring;
  return [
    { side: 'left', minX: x - hw, maxX: x + hw, minY: y - hw, maxY: y + h + hw },
    { side: 'right', minX: x + w - hw, maxX: x + w + hw, minY: y - hw, maxY: y + h + hw },
    { side: 'top', minX: x - hw, maxX: x + w + hw, minY: y - hw, maxY: y + hw },
    { side: 'bottom', minX: x - hw, maxX: x + w + hw, minY: y + h - hw, maxY: y + h + hw },
  ];
}

function strapRect(strap) {
  const hw = (Number(strap.width) || DEFAULT_STRAP_WIDTH) / 2;
  return {
    minX: Math.min(strap.x1, strap.x2) - hw,
    maxX: Math.max(strap.x1, strap.x2) + hw,
    minY: Math.min(strap.y1, strap.y2) - hw,
    maxY: Math.max(strap.y1, strap.y2) + hw,
  };
}

function pointInRect(px, py, r, tol = SNAP_TOL) {
  return px >= r.minX - tol && px <= r.maxX + tol && py >= r.minY - tol && py <= r.maxY + tol;
}

function rectsOverlap(a, b) {
  return Math.min(a.maxX, b.maxX) > Math.max(a.minX, b.minX) && Math.min(a.maxY, b.maxY) > Math.max(a.minY, b.minY);
}

function pointOnRing(ring, px, py, tol) {
  return ringEdgeRects(ring).some((r) => pointInRect(px, py, r, tol));
}

function pointOnStrap(strap, px, py, tol) {
  return pointInRect(px, py, strapRect(strap), tol);
}

function viaLayers(via) {
  return [via.layer1, via.layer2].filter(Boolean);
}

/** True when the via lands on metal of `layer` (or the via has no layer data — legacy). */
function viaTouchesLayer(via, layer) {
  const ls = viaLayers(via);
  return ls.length === 0 || !layer || ls.includes(layer);
}

/** True when the via electrically joins a shape on layerA to a shape on layerB. */
function viaJoinsLayers(via, layerA, layerB) {
  const ls = viaLayers(via);
  if (ls.length === 0) return true; // legacy vias without layer data
  if (layerA === layerB) return ls.includes(layerA);
  return ls.includes(layerA) && ls.includes(layerB);
}

function isHorizontal(strap) {
  return Math.abs(strap.y2 - strap.y1) <= Math.abs(strap.x2 - strap.x1);
}

/**
 * Build the via-level connectivity of one net: which ring/strap pairs each via joins.
 * Returns adjacency map plus per-strap feed via positions (vias joining the strap to a ring).
 */
function buildNetGraph(powerNetwork, targetNet) {
  const rings = (powerNetwork.rings || []).filter((r) => r.net === targetNet);
  const straps = (powerNetwork.straps || []).filter((s) => s.net === targetNet);
  const vias = (powerNetwork.vias || []).filter((v) => !v.net || v.net === targetNet);
  const shapes = [
    ...rings.map((r) => ({ id: r.id, kind: 'ring', layer: r.layer, hit: (x, y) => pointOnRing(r, x, y) })),
    ...straps.map((s) => ({ id: s.id, kind: 'strap', layer: s.layer, hit: (x, y) => pointOnStrap(s, x, y) })),
  ];

  const adj = new Map(shapes.map((sh) => [sh.id, new Set()]));
  const feeds = new Map(straps.map((s) => [s.id, []]));

  vias.forEach((via) => {
    const touched = shapes.filter((sh) => viaTouchesLayer(via, sh.layer) && sh.hit(via.x, via.y));
    for (let i = 0; i < touched.length; i++) {
      for (let j = i + 1; j < touched.length; j++) {
        const a = touched[i];
        const b = touched[j];
        if (!viaJoinsLayers(via, a.layer, b.layer)) continue;
        adj.get(a.id).add(b.id);
        adj.get(b.id).add(a.id);
        if (a.kind === 'strap' && b.kind === 'ring') feeds.get(a.id).push({ x: via.x, y: via.y, viaId: via.id });
        if (b.kind === 'strap' && a.kind === 'ring') feeds.get(b.id).push({ x: via.x, y: via.y, viaId: via.id });
      }
    }
  });

  return { adj, feeds, rings, straps };
}

function reachableFrom(adj, startIds) {
  const visited = new Set(startIds.filter((id) => adj.has(id)));
  const queue = [...visited];
  while (queue.length > 0) {
    const curr = queue.shift();
    (adj.get(curr) || new Set()).forEach((nbr) => {
      if (!visited.has(nbr)) {
        visited.add(nbr);
        queue.push(nbr);
      }
    });
  }
  return visited;
}

/**
 * Detect open connections in VDD and VSS power distribution graphs.
 * Uses Breadth-First Search (BFS) from sources to ensure all loads are reachable.
 * Every strap of a net is treated as a load (in addition to any explicit loads),
 * so a newly added floating strap cannot escape the check. A via only joins
 * shapes whose layers it actually names.
 *
 * @param {Object} powerNetwork - { rings, straps, vias, sources, loads }
 */
export function detectOpenConnections(powerNetwork) {
  if (!powerNetwork) {
    return {
      vddOpen: true,
      vssOpen: true,
      vddDisconnectedLoads: [{ nodeId: 'all', reason: 'Missing power network configuration' }],
      vssDisconnectedLoads: [{ nodeId: 'all', reason: 'Missing power network configuration' }],
      educationalNote: 'Power network model was null or uninitialized.',
    };
  }

  const sources = Array.isArray(powerNetwork.sources) ? powerNetwork.sources : [];
  const loads = Array.isArray(powerNetwork.loads) ? powerNetwork.loads : [];

  const checkNetReachability = (netName) => {
    const { adj, straps } = buildNetGraph(powerNetwork, netName);
    const netSources = sources.filter((s) => s.net === netName).map((s) => s.nodeId);
    const loadIds = new Set([
      ...loads.filter((l) => l.net === netName).map((l) => l.nodeId),
      ...straps.map((s) => s.id),
    ]);

    if (netSources.length === 0) {
      return {
        isOpen: loadIds.size > 0,
        disconnected: [...loadIds].map((id) => ({ nodeId: id, reason: `No source pad defined for ${netName}` })),
      };
    }

    const visited = reachableFrom(adj, netSources);
    // A listed source that is not drawn anywhere is still treated as the pad itself.
    netSources.forEach((id) => visited.add(id));

    const disconnected = [...loadIds].filter((id) => !visited.has(id)).map((id) => ({
      nodeId: id,
      reason: `Node ${id} is not topologically reachable from ${netName} power pads`,
    }));

    return { isOpen: disconnected.length > 0, disconnected };
  };

  const vddCheck = checkNetReachability('VDD');
  const vssCheck = checkNetReachability('VSS');

  return {
    vddOpen: vddCheck.isOpen,
    vssOpen: vssCheck.isOpen,
    vddDisconnectedLoads: vddCheck.disconnected,
    vssDisconnectedLoads: vssCheck.disconnected,
    educationalNote: 'PDN connectivity is checked using a deterministic graph BFS from power pad sources to every strap (and any listed load). Vias only join the layers they name.',
  };
}

/**
 * Detect electrical shorts between VDD and VSS networks.
 * 1. A via that lands on VDD metal and VSS metal on the layers it joins.
 * 2. VDD and VSS shapes that overlap on the same metal layer.
 */
export function detectVDDVSSShort(powerNetwork) {
  if (!powerNetwork) return { hasShort: false, shorts: [] };

  const vias = Array.isArray(powerNetwork.vias) ? powerNetwork.vias : [];
  const rings = Array.isArray(powerNetwork.rings) ? powerNetwork.rings : [];
  const straps = Array.isArray(powerNetwork.straps) ? powerNetwork.straps : [];

  const shapes = [
    ...rings.flatMap((r) => ringEdgeRects(r).map((rect) => ({ id: r.id, net: r.net, layer: r.layer, rect }))),
    ...straps.map((s) => ({ id: s.id, net: s.net, layer: s.layer, rect: strapRect(s) })),
  ];

  const shorts = [];
  const tol = 0.5; // a via must physically sit on the metal to bridge it

  vias.forEach((v) => {
    const hits = shapes.filter((sh) => viaTouchesLayer(v, sh.layer) && pointInRect(v.x, v.y, sh.rect, tol));
    const vdd = hits.find((h) => h.net === 'VDD');
    const vss = hits.find((h) => h.net === 'VSS');
    if (vdd && vss) {
      shorts.push({
        viaId: v.id,
        net1: 'VDD',
        net2: 'VSS',
        location: `(${v.x}, ${v.y})`,
        reason: `Via ${v.id} physically bridges ${vdd.id} (VDD, ${vdd.layer}) and ${vss.id} (VSS, ${vss.layer})`,
      });
    }
  });

  const seen = new Set();
  shapes.forEach((a) => {
    if (a.net !== 'VDD') return;
    shapes.forEach((b) => {
      if (b.net !== 'VSS' || a.layer !== b.layer) return;
      const key = `${a.id}|${b.id}`;
      if (seen.has(key) || !rectsOverlap(a.rect, b.rect)) return;
      seen.add(key);
      shorts.push({
        viaId: null,
        net1: 'VDD',
        net2: 'VSS',
        location: `${a.id} ∩ ${b.id}`,
        reason: `${a.id} (VDD) and ${b.id} (VSS) overlap on ${a.layer}`,
      });
    });
  });

  return { hasShort: shorts.length > 0, shorts };
}

/**
 * Detect missing vias where a strap crosses a same-net ring edge on a different metal layer.
 * Horizontal straps are checked against the left/right ring edges, vertical straps against
 * the top/bottom edges. A via only counts if it joins the strap layer to the ring layer.
 */
export function detectMissingVias(powerNetwork) {
  if (!powerNetwork) return { missingViaCount: 0, details: [] };

  const rings = Array.isArray(powerNetwork.rings) ? powerNetwork.rings : [];
  const straps = Array.isArray(powerNetwork.straps) ? powerNetwork.straps : [];
  const vias = Array.isArray(powerNetwork.vias) ? powerNetwork.vias : [];

  const missing = [];

  straps.forEach((strap) => {
    rings.filter((r) => r.net === strap.net && r.layer !== strap.layer).forEach((ring) => {
      const crossings = [];
      if (isHorizontal(strap)) {
        const y = strap.y1;
        if (y < ring.y || y > ring.y + ring.height) return;
        const lo = Math.min(strap.x1, strap.x2);
        const hi = Math.max(strap.x1, strap.x2);
        [ring.x, ring.x + ring.width].forEach((x) => { if (lo <= x && hi >= x) crossings.push({ x, y }); });
      } else {
        const x = strap.x1;
        if (x < ring.x || x > ring.x + ring.width) return;
        const lo = Math.min(strap.y1, strap.y2);
        const hi = Math.max(strap.y1, strap.y2);
        [ring.y, ring.y + ring.height].forEach((y) => { if (lo <= y && hi >= y) crossings.push({ x, y }); });
      }

      const snap = Math.max(Number(ring.lineWidth) || DEFAULT_RING_WIDTH, Number(strap.width) || DEFAULT_STRAP_WIDTH) / 2 + SNAP_TOL;
      crossings.forEach((pt) => {
        const hasVia = vias.some((v) => (!v.net || v.net === strap.net) &&
          Math.abs(v.x - pt.x) <= snap && Math.abs(v.y - pt.y) <= snap &&
          viaJoinsLayers(v, strap.layer, ring.layer));
        if (!hasVia) {
          missing.push({
            strapId: strap.id,
            ringId: ring.id,
            net: strap.net,
            x: pt.x,
            y: pt.y,
            layer1: strap.layer,
            layer2: ring.layer,
            expectedViaLocation: `(${pt.x}, ${pt.y})`,
            layers: `${strap.layer} to ${ring.layer}`,
            reason: `Strap ${strap.id} crosses Ring ${ring.id} at (${pt.x}, ${pt.y}) without an electrical ${strap.layer}–${ring.layer} via`,
          });
        }
      });
    });
  });

  return { missingViaCount: missing.length, details: missing };
}

/**
 * Educational static IR-drop estimate for each strap load.
 *
 * Model (stated, not hidden):
 *   R_strap = (length / width) × ρ_layer          (ρ: M4 0.08 Ω/sq, M5 0.05 Ω/sq, …)
 *   Current I is drawn uniformly along the strap.
 *   Fed at both ends (≥2 ring vias):  V_max = I·R / 8  (at the midpoint)
 *   Fed at one end   (1 ring via)  :  V_max = I·R / 2  (at the far end)
 *   Not reachable from a pad       :  open — no finite drop is reported.
 * Ring resistance, via resistance and current crowding are ignored.
 *
 * @param {Object} powerNetwork
 * @param {Array<{ nodeId: string, currentMa?: number }>} loads
 */
export function computeIRDropEstimate(powerNetwork, loads = []) {
  const pn = powerNetwork || { rings: [], straps: [], vias: [], sources: [], loads: [] };
  const straps = pn.straps || [];
  const requested = Array.isArray(loads) && loads.length > 0
    ? loads
    : straps.filter((s) => s.net === 'VDD').map((s) => ({ nodeId: s.id, net: s.net }));

  const sources = pn.sources || [];
  const graphCache = new Map();
  const netInfo = (net) => {
    if (!graphCache.has(net)) {
      const g = buildNetGraph(pn, net);
      const srcIds = sources.filter((s) => s.net === net).map((s) => s.nodeId);
      graphCache.set(net, { ...g, reach: reachableFrom(g.adj, srcIds) });
    }
    return graphCache.get(net);
  };

  const perLoad = requested.map((load) => {
    const currentMa = Number.isFinite(Number(load.currentMa)) && load.currentMa !== null && load.currentMa !== ''
      ? Number(load.currentMa)
      : DEFAULT_CURRENT_MA;
    const strap = straps.find((s) => s.id === load.nodeId);
    if (!strap) {
      return { nodeId: load.nodeId, currentMa, estimatedDropMv: null, feedPoints: 0, resistanceOhm: null, severity: 'unknown',
        reason: `Load ${load.nodeId} is not a strap in this power network` };
    }

    const info = netInfo(strap.net);
    const feeds = info.feeds.get(strap.id) || [];
    const reachable = info.reach.has(strap.id);
    const length = Math.hypot(strap.x2 - strap.x1, strap.y2 - strap.y1);
    const width = Math.max(0.1, Number(strap.width) || DEFAULT_STRAP_WIDTH);
    const rho = SHEET_RES_OHM_PER_SQ[strap.layer] ?? SHEET_RES_OHM_PER_SQ.M4;
    const resistanceOhm = Number(((length / width) * rho).toFixed(4));
    const distinctFeeds = new Set(feeds.map((f) => `${f.x},${f.y}`)).size;

    if (!reachable) {
      return { nodeId: load.nodeId, currentMa, estimatedDropMv: null, feedPoints: distinctFeeds, resistanceOhm, severity: 'open',
        reason: `${strap.id} is not connected to a ${strap.net} pad — the drop is unbounded (open net)` };
    }

    const feedPoints = Math.max(1, distinctFeeds);
    const factor = feedPoints >= 2 ? 1 / 8 : 1 / 2;
    const estimatedDropMv = Number((currentMa * resistanceOhm * factor).toFixed(2));
    return {
      nodeId: load.nodeId,
      currentMa,
      estimatedDropMv,
      feedPoints,
      resistanceOhm,
      severity: estimatedDropMv > 35 ? 'critical' : estimatedDropMv > 20 ? 'moderate' : 'nominal',
    };
  });

  const finite = perLoad.filter((l) => typeof l.estimatedDropMv === 'number');
  const maxDropMv = finite.length > 0 ? Math.max(...finite.map((l) => l.estimatedDropMv)) : 0;

  return {
    maxDropMv,
    hasOpenLoad: perLoad.some((l) => l.severity === 'open'),
    perLoad,
    assumptions: 'Strap-only distributed-load model: R = (L/W)·ρ_layer (M4 0.08 Ω/sq, M5 0.05 Ω/sq); uniform current; V_max = I·R/8 when fed at both ends, I·R/2 when fed at one end; default 15 mA per strap; ring and via resistance ignored.',
    educationalDisclaimer: 'Educational simulation model — not foundry-qualified for commercial tapeout signoff.',
  };
}

/**
 * Immutable powerNetwork helper: Add a ring.
 */
export function addRing(powerNetwork, ring) {
  const prev = powerNetwork || { rings: [], straps: [], vias: [], sources: [], loads: [] };
  return {
    ...prev,
    rings: [...(prev.rings || []), ring],
  };
}

/**
 * Immutable powerNetwork helper: Add a strap.
 */
export function addStrap(powerNetwork, strap) {
  const prev = powerNetwork || { rings: [], straps: [], vias: [], sources: [], loads: [] };
  return {
    ...prev,
    straps: [...(prev.straps || []), strap],
  };
}

/**
 * Immutable powerNetwork helper: Add a via.
 */
export function addVia(powerNetwork, via) {
  const prev = powerNetwork || { rings: [], straps: [], vias: [], sources: [], loads: [] };
  return {
    ...prev,
    vias: [...(prev.vias || []), via],
  };
}

/**
 * Immutable powerNetwork helper: Remove a via by ID.
 */
export function removeVia(powerNetwork, viaId) {
  if (!powerNetwork) return powerNetwork;
  return {
    ...powerNetwork,
    vias: (powerNetwork.vias || []).filter((v) => v.id !== viaId),
  };
}
