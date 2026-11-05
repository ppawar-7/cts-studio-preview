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

/**
 * Detect open connections in VDD and VSS power distribution graphs.
 * Uses Breadth-First Search (BFS) from sources to ensure all loads are reachable.
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

  const rings = Array.isArray(powerNetwork.rings) ? powerNetwork.rings : [];
  const straps = Array.isArray(powerNetwork.straps) ? powerNetwork.straps : [];
  const vias = Array.isArray(powerNetwork.vias) ? powerNetwork.vias : [];
  const sources = Array.isArray(powerNetwork.sources) ? powerNetwork.sources : [];
  const loads = Array.isArray(powerNetwork.loads) ? powerNetwork.loads : [];

  // Build adjacency graphs per net
  const buildGraphForNet = (targetNet) => {
    const adj = new Map();

    const addEdge = (u, v) => {
      if (!adj.has(u)) adj.set(u, new Set());
      if (!adj.has(v)) adj.set(v, new Set());
      adj.get(u).add(v);
      adj.get(v).add(u);
    };

    // Add nodes
    rings.filter((r) => r.net === targetNet).forEach((r) => {
      if (!adj.has(r.id)) adj.set(r.id, new Set());
    });
    straps.filter((s) => s.net === targetNet).forEach((s) => {
      if (!adj.has(s.id)) adj.set(s.id, new Set());
    });

    // Vias connect straps and rings if coordinates intersect
    vias.filter((v) => v.net === targetNet).forEach((via) => {
      // Find which ring and which strap this via connects
      const matchingRings = rings.filter((r) => {
        if (r.net !== targetNet) return false;
        // Check if via is on ring perimeter (within 5µm tolerance)
        const onLeft = Math.abs(via.x - r.x) <= 5 && via.y >= r.y - 5 && via.y <= r.y + r.height + 5;
        const onRight = Math.abs(via.x - (r.x + r.width)) <= 5 && via.y >= r.y - 5 && via.y <= r.y + r.height + 5;
        const onTop = Math.abs(via.y - r.y) <= 5 && via.x >= r.x - 5 && via.x <= r.x + r.width + 5;
        const onBottom = Math.abs(via.y - (r.y + r.height)) <= 5 && via.x >= r.x - 5 && via.x <= r.x + r.width + 5;
        return onLeft || onRight || onTop || onBottom;
      });

      const matchingStraps = straps.filter((s) => {
        if (s.net !== targetNet) return false;
        const minX = Math.min(s.x1, s.x2) - 5;
        const maxX = Math.max(s.x1, s.x2) + 5;
        const minY = Math.min(s.y1, s.y2) - 5;
        const maxY = Math.max(s.y1, s.y2) + 5;
        return via.x >= minX && via.x <= maxX && via.y >= minY && via.y <= maxY;
      });

      // Connect matching rings and straps through this via
      matchingRings.forEach((r) => {
        matchingStraps.forEach((s) => {
          addEdge(r.id, s.id);
        });
      });
    });

    return adj;
  };

  const checkNetReachability = (netName) => {
    const adj = buildGraphForNet(netName);
    const netSources = sources.filter((s) => s.net === netName).map((s) => s.nodeId);
    const netLoads = loads.filter((l) => l.net === netName);

    if (netSources.length === 0) {
      return {
        isOpen: true,
        disconnected: netLoads.map((l) => ({ nodeId: l.nodeId, reason: `No source pad defined for ${netName}` })),
      };
    }

    // BFS
    const visited = new Set();
    const queue = [...netSources];
    queue.forEach((id) => visited.add(id));

    while (queue.length > 0) {
      const curr = queue.shift();
      const neighbors = adj.get(curr) || new Set();
      neighbors.forEach((nbr) => {
        if (!visited.has(nbr)) {
          visited.add(nbr);
          queue.push(nbr);
        }
      });
    }

    const disconnected = netLoads.filter((l) => !visited.has(l.nodeId)).map((l) => ({
      nodeId: l.nodeId,
      reason: `Node ${l.nodeId} is not topologically reachable from ${netName} power pads`,
    }));

    return {
      isOpen: disconnected.length > 0,
      disconnected,
    };
  };

  const vddCheck = checkNetReachability('VDD');
  const vssCheck = checkNetReachability('VSS');

  return {
    vddOpen: vddCheck.isOpen,
    vssOpen: vssCheck.isOpen,
    vddDisconnectedLoads: vddCheck.disconnected,
    vssDisconnectedLoads: vssCheck.disconnected,
    educationalNote: 'PDN connectivity is checked using a deterministic graph BFS from power pad sources to strap segment loads.',
  };
}

/**
 * Detect electrical shorts between VDD and VSS networks.
 */
export function detectVDDVSSShort(powerNetwork) {
  if (!powerNetwork) return { hasShort: false, shorts: [] };

  const vias = Array.isArray(powerNetwork.vias) ? powerNetwork.vias : [];
  const rings = Array.isArray(powerNetwork.rings) ? powerNetwork.rings : [];
  const straps = Array.isArray(powerNetwork.straps) ? powerNetwork.straps : [];

  const shorts = [];

  // Check 1: Via net mismatch (via connecting a VDD entity and a VSS entity)
  vias.forEach((v) => {
    const touchesVDD = rings.some((r) => r.net === 'VDD' && Math.abs(v.x - r.x) <= 5 && Math.abs(v.y - r.y) <= 5) ||
                       straps.some((s) => s.net === 'VDD' && Math.min(s.x1, s.x2) <= v.x + 5 && Math.max(s.x1, s.x2) >= v.x - 5 && Math.min(s.y1, s.y2) <= v.y + 5 && Math.max(s.y1, s.y2) >= v.y - 5);
    const touchesVSS = rings.some((r) => r.net === 'VSS' && Math.abs(v.x - r.x) <= 5 && Math.abs(v.y - r.y) <= 5) ||
                       straps.some((s) => s.net === 'VSS' && Math.min(s.x1, s.x2) <= v.x + 5 && Math.max(s.x1, s.x2) >= v.x - 5 && Math.min(s.y1, s.y2) <= v.y + 5 && Math.max(s.y1, s.y2) >= v.y - 5);

    if (touchesVDD && touchesVSS) {
      shorts.push({
        viaId: v.id,
        net1: 'VDD',
        net2: 'VSS',
        location: `(${v.x}, ${v.y})`,
        reason: `Via ${v.id} physically bridges VDD and VSS metal geometries`,
      });
    }
  });

  return {
    hasShort: shorts.length > 0,
    shorts,
  };
}

/**
 * Detect missing vias at geometric intersections of power rings and straps on different metal layers.
 */
export function detectMissingVias(powerNetwork) {
  if (!powerNetwork) return { missingViaCount: 0, details: [] };

  const rings = Array.isArray(powerNetwork.rings) ? powerNetwork.rings : [];
  const straps = Array.isArray(powerNetwork.straps) ? powerNetwork.straps : [];
  const vias = Array.isArray(powerNetwork.vias) ? powerNetwork.vias : [];

  const missing = [];

  straps.forEach((strap) => {
    // Find matching ring on the same net
    const ring = rings.find((r) => r.net === strap.net);
    if (!ring) return;

    // A strap crossing the ring perimeter should have vias on both sides
    // Check intersection with ring left side (x = ring.x)
    const crossings = [];
    if (Math.min(strap.x1, strap.x2) <= ring.x && Math.max(strap.x1, strap.x2) >= ring.x) {
      crossings.push({ x: ring.x, y: strap.y1 });
    }
    // Check intersection with ring right side (x = ring.x + ring.width)
    const rightX = ring.x + ring.width;
    if (Math.min(strap.x1, strap.x2) <= rightX && Math.max(strap.x1, strap.x2) >= rightX) {
      crossings.push({ x: rightX, y: strap.y1 });
    }

    crossings.forEach((pt) => {
      // Is there a via near this crossing point on the same net?
      const hasVia = vias.some((v) => v.net === strap.net && Math.abs(v.x - pt.x) <= 8 && Math.abs(v.y - pt.y) <= 8);
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
          reason: `Strap ${strap.id} crosses Ring ${ring.id} at (${pt.x}, ${pt.y}) without an electrical via connection`,
        });
      }
    });
  });

  return {
    missingViaCount: missing.length,
    details: missing,
  };
}

/**
 * Simplified analytical educational IR Drop estimation.
 * Uses sheet resistance model (rho_M4 = 0.08 Ω/sq, rho_M5 = 0.05 Ω/sq).
 *
 * @param {Object} powerNetwork
 * @param {Array<{ nodeId: string, currentMa: number }>} loads
 */
export function computeIRDropEstimate(powerNetwork, loads = []) {
  const DEFAULT_CURRENT_MA = 15; // 15 mA typical block load
  const RHO_M4 = 0.08; // Ohm/sq
  const RHO_M5 = 0.05; // Ohm/sq

  const defaultLoads = loads.length > 0 ? loads : [
    { nodeId: 'strap_vdd_1', currentMa: DEFAULT_CURRENT_MA },
  ];

  const perLoad = defaultLoads.map((load) => {
    // Model resistance proportional to strap length / width
    const strap = (powerNetwork?.straps || []).find((s) => s.id === load.nodeId) || {
      width: 4,
      x1: 20,
      x2: 380,
    };

    const length = Math.abs((strap.x2 || 380) - (strap.x1 || 20));
    const width = Math.max(1, strap.width || 4);
    const numSquares = length / width;
    const strapResistance = numSquares * RHO_M4; // in Ohms

    // IR = I (Amps) * R (Ohms) -> mV = mA * Ohms
    const estimatedDropMv = Number((load.currentMa * strapResistance * 0.5).toFixed(2)); // distributed midpoint factor 0.5

    return {
      nodeId: load.nodeId,
      currentMa: load.currentMa,
      estimatedDropMv,
      severity: estimatedDropMv > 35 ? 'critical' : estimatedDropMv > 20 ? 'moderate' : 'nominal',
    };
  });

  const maxDropMv = perLoad.length > 0 ? Math.max(...perLoad.map((l) => l.estimatedDropMv)) : 0;

  return {
    maxDropMv,
    perLoad,
    assumptions: 'Analytical distributed RC proxy: sheet resistance M4=0.08Ω/sq, midpoint tap current distribution, uniform load assumption.',
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
