/* Motor del método REBA (Hignett & McAtamney, 2000).
 * Las tablas A, B y C son las mismas que usa la planilla reba.xls de GH (verificadas celda por celda). */
(function () {
  // TABLA_A[tronco-1][cuello-1][piernas-1]
  const TABLA_A = [
    [[1, 2, 3, 4], [1, 2, 3, 4], [3, 3, 5, 6]],
    [[2, 3, 4, 5], [3, 4, 5, 6], [4, 5, 6, 7]],
    [[2, 4, 5, 6], [4, 5, 6, 7], [5, 6, 7, 8]],
    [[3, 5, 6, 7], [5, 6, 7, 8], [6, 7, 8, 9]],
    [[4, 6, 7, 8], [6, 7, 8, 9], [7, 8, 9, 9]]
  ];
  // TABLA_B[brazo-1][antebrazo-1][muñeca-1]
  const TABLA_B = [
    [[1, 2, 2], [1, 2, 3]],
    [[1, 2, 3], [2, 3, 4]],
    [[3, 4, 5], [4, 5, 5]],
    [[4, 5, 5], [5, 6, 7]],
    [[6, 7, 8], [7, 8, 8]],
    [[7, 8, 8], [8, 9, 9]]
  ];
  // TABLA_C[puntuación A-1][puntuación B-1]
  const TABLA_C = [
    [1, 1, 1, 2, 3, 3, 4, 5, 6, 7, 7, 7],
    [1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 7, 8],
    [2, 3, 3, 3, 4, 5, 6, 7, 7, 8, 8, 8],
    [3, 4, 4, 4, 5, 6, 7, 8, 8, 9, 9, 9],
    [4, 4, 4, 5, 6, 7, 8, 8, 9, 9, 9, 9],
    [6, 6, 6, 7, 8, 8, 9, 9, 10, 10, 10, 10],
    [7, 7, 7, 8, 9, 9, 9, 10, 10, 11, 11, 11],
    [8, 8, 8, 9, 10, 10, 10, 10, 10, 11, 11, 11],
    [9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12, 12],
    [10, 10, 10, 11, 11, 11, 11, 12, 12, 12, 12, 12],
    [11, 11, 11, 11, 12, 12, 12, 12, 12, 12, 12, 12],
    [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]
  ];

  // Opciones de cada segmento, tal cual las tablas de la hoja de datos.
  const SEGMENTOS = {
    cuello: {
      nombre: 'Cuello', grupo: 'A', img: 'cuello', rango: '1-3',
      ops: [{ v: 1, t: '0º–20º flexión', p: 1 }, { v: 2, t: '>20º flexión o en extensión', p: 2 }],
      corr: [{ k: 'torsion', t: 'Torsión o inclinación lateral', p: 1 }]
    },
    piernas: {
      nombre: 'Piernas', grupo: 'A', img: 'piernas', rango: '1-4',
      ops: [{ v: 1, t: 'Soporte bilateral, andando o sentado', p: 1 }, { v: 2, t: 'Soporte unilateral, soporte ligero o postura inestable', p: 2 }],
      rod: [{ v: 0, t: 'Rodillas < 30º', p: 0 }, { v: 1, t: 'Flexión de rodillas 30º–60º', p: 1 }, { v: 2, t: 'Rodillas > 60º (salvo sedente)', p: 2 }]
    },
    tronco: {
      nombre: 'Tronco', grupo: 'A', img: 'tronco', rango: '1-5',
      ops: [{ v: 1, t: 'Erguido', p: 1 }, { v: 2, t: '0º–20º flexión / 0º–20º extensión', p: 2 }, { v: 3, t: '20º–60º flexión / >20º extensión', p: 3 }, { v: 4, t: '> 60º flexión', p: 4 }],
      corr: [{ k: 'torsion', t: 'Torsión o inclinación lateral', p: 1 }]
    },
    carga: {
      nombre: 'Carga / fuerza', grupo: 'A', img: 'carga', rango: '0-3',
      ops: [{ v: 0, t: '< 5 kg', p: 0 }, { v: 1, t: '5 a 10 kg', p: 1 }, { v: 2, t: '> 10 kg', p: 2 }],
      corr: [{ k: 'brusca', t: 'Instauración rápida o brusca', p: 1 }]
    },
    antebrazo: {
      nombre: 'Antebrazos', grupo: 'B', img: 'antebrazos', rango: '1-2',
      ops: [{ v: 1, t: '60º–100º flexión', p: 1 }, { v: 2, t: 'Flexión < 60º o > 100º', p: 2 }]
    },
    muneca: {
      nombre: 'Muñecas', grupo: 'B', img: 'munecas', rango: '1-3',
      ops: [{ v: 1, t: '0º–15º flexión / extensión', p: 1 }, { v: 2, t: '>15º flexión / extensión', p: 2 }],
      corr: [{ k: 'torsion', t: 'Torsión o desviación lateral', p: 1 }]
    },
    brazo: {
      nombre: 'Brazos', grupo: 'B', img: 'brazos', rango: '1-6',
      ops: [{ v: 1, t: '0º–20º flexión / extensión', p: 1 }, { v: 2, t: '>20º extensión', p: 2 }, { v: 3, t: 'Flexión 20º–45º', p: 2 }, { v: 4, t: 'Flexión 45º–90º', p: 3 }, { v: 5, t: '>90º flexión', p: 4 }],
      corr: [{ k: 'abd', t: 'Abducción o rotación', p: 1 }, { k: 'elev', t: 'Elevación del hombro', p: 1 }, { k: 'apoyo', t: 'Apoyo o postura a favor de la gravedad', p: -1 }]
    },
    agarre: {
      nombre: 'Agarre', grupo: 'B', img: 'agarre', rango: '0-3',
      ops: [{ v: 0, t: 'Bueno: buen agarre y fuerza de agarre', p: 0 }, { v: 1, t: 'Regular: agarre aceptable', p: 1 }, { v: 2, t: 'Malo: posible pero no aceptable', p: 2 }, { v: 3, t: 'Inaceptable: incómodo, sin agarre manual', p: 3 }]
    }
  };
  const ORDEN = ['cuello', 'piernas', 'tronco', 'carga', 'antebrazo', 'muneca', 'brazo', 'agarre'];
  const ACTIVIDAD = [
    { k: 'estatica', t: '¿Una o más partes del cuerpo permanecen estáticas, por ej. aguantadas más de 1 min.?', si: 'Una o más partes del cuerpo permanecen estáticas', no: 'No hay partes del cuerpo estáticas' },
    { k: 'repetitivos', t: '¿Existen movimientos repetitivos, por ej. repetición superior a 4 veces/min.?', si: 'Existen movimientos repetitivos', no: 'No existen movimientos repetitivos' },
    { k: 'inestable', t: '¿Se producen cambios posturales importantes o se adoptan posturas inestables?', si: 'Se producen cambios posturales importantes o posturas inestables', no: 'No se producen cambios posturales importantes ni posturas inestables' }
  ];
  const NIVELES = [
    { accion: 0, riesgo: 'Inapreciable', actuacion: 'No es necesaria actuación', color: 'verde' },
    { accion: 1, riesgo: 'Bajo', actuacion: 'Puede ser necesaria la actuación', color: 'verde' },
    { accion: 2, riesgo: 'Medio', actuacion: 'Es necesaria la actuación', color: 'amarillo' },
    { accion: 3, riesgo: 'Alto', actuacion: 'Es necesaria la actuación cuanto antes', color: 'naranja' },
    { accion: 4, riesgo: 'Muy alto', actuacion: 'Es necesaria la actuación de inmediato', color: 'rojo' }
  ];

  function nivelDe(reba) {
    if (!reba) return null;
    const a = reba === 1 ? 0 : reba <= 3 ? 1 : reba <= 7 ? 2 : reba <= 10 ? 3 : 4;
    return NIVELES[a];
  }
  // Nivel de riesgo de la Res. 886/15 (1 tolerable, 2 moderado, 3 no tolerable) a partir del REBA.
  const nivel886 = reba => { const n = nivelDe(reba); return !n ? null : n.accion <= 1 ? 1 : n.accion === 2 ? 2 : 3; };

  function examenVacio(nombre) {
    return {
      id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      nombre: nombre || 'Postura 1', tarea: 0, lado: 'Derecho', notas: '',
      seg: {
        cuello: { op: null, torsion: false }, piernas: { op: null, rod: 0, sentado: false },
        tronco: { op: null, torsion: false }, carga: { op: null, brusca: false },
        antebrazo: { op: null }, muneca: { op: null, torsion: false },
        brazo: { op: null, abd: false, elev: false, apoyo: false }, agarre: { op: null }
      },
      act: { estatica: null, repetitivos: null, inestable: null },
      ang: {}, foto: null
    };
  }

  // Puntuación final de cada segmento (lo que va en los recuadros amarillos de la hoja de datos).
  function puntajes(ex) {
    const s = ex.seg, P = {};
    const opP = (k) => { const o = SEGMENTOS[k].ops.find(o => o.v === s[k].op); return o ? o.p : null; };
    let p;
    p = opP('cuello'); P.cuello = p == null ? null : p + (s.cuello.torsion ? 1 : 0);
    p = opP('piernas'); P.piernas = p == null ? null : p + (s.piernas.sentado ? 0 : (s.piernas.rod || 0));
    p = opP('tronco'); P.tronco = p == null ? null : p + (s.tronco.torsion ? 1 : 0);
    p = opP('carga'); P.carga = p == null ? null : p + (s.carga.brusca ? 1 : 0);
    P.antebrazo = opP('antebrazo');
    p = opP('muneca'); P.muneca = p == null ? null : p + (s.muneca.torsion ? 1 : 0);
    p = opP('brazo'); P.brazo = p == null ? null : Math.min(6, Math.max(1, p + (s.brazo.abd ? 1 : 0) + (s.brazo.elev ? 1 : 0) - (s.brazo.apoyo ? 1 : 0)));
    P.agarre = opP('agarre');
    return P;
  }

  function calcular(ex) {
    const P = puntajes(ex);
    const faltan = ORDEN.filter(k => P[k] == null).map(k => SEGMENTOS[k].nombre);
    ACTIVIDAD.forEach(a => { if (ex.act[a.k] !== 'S' && ex.act[a.k] !== 'N') faltan.push('Actividad muscular'); });
    const r = { P, faltan: [...new Set(faltan)] };
    if (P.tronco && P.cuello && P.piernas) r.tablaA = TABLA_A[P.tronco - 1][P.cuello - 1][P.piernas - 1];
    if (r.tablaA != null && P.carga != null) r.A = r.tablaA + P.carga;
    if (P.brazo && P.antebrazo && P.muneca) r.tablaB = TABLA_B[P.brazo - 1][P.antebrazo - 1][P.muneca - 1];
    if (r.tablaB != null && P.agarre != null) r.B = r.tablaB + P.agarre;
    if (r.A && r.B) r.C = TABLA_C[Math.min(r.A, 12) - 1][Math.min(r.B, 12) - 1];
    r.actividad = ACTIVIDAD.reduce((n, a) => n + (ex.act[a.k] === 'S' ? 1 : 0), 0);
    r.completo = r.faltan.length === 0;
    if (r.completo) {
      r.reba = r.C + r.actividad;
      Object.assign(r, nivelDe(r.reba));
      r.nivel886 = nivel886(r.reba);
    }
    return r;
  }

  // ---------------------------------------------------------- ángulos
  // Convención: ángulo positivo = flexión (hacia adelante), negativo = extensión.
  function opsDesdeAngulos(ex) {
    const a = ex.ang || {}, s = ex.seg;
    if (num(a.tronco)) { const t = a.tronco; s.tronco.op = Math.abs(t) < 5 ? 1 : (t >= -20 && t <= 20) ? 2 : (t > 60 ? 4 : 3); }
    if (num(a.cuello)) s.cuello.op = (a.cuello >= -5 && a.cuello <= 20) ? 1 : 2;
    if (num(a.brazo)) { const b = a.brazo; s.brazo.op = b < -20 ? 2 : b <= 20 ? 1 : b <= 45 ? 3 : b <= 90 ? 4 : 5; }
    if (num(a.antebrazo)) s.antebrazo.op = (a.antebrazo >= 60 && a.antebrazo <= 100) ? 1 : 2;
    if (num(a.muneca)) s.muneca.op = Math.abs(a.muneca) <= 15 ? 1 : 2;
    if (num(a.rodilla)) s.piernas.rod = a.rodilla > 60 ? 2 : a.rodilla >= 30 ? 1 : 0;
  }
  const num = v => typeof v === 'number' && isFinite(v);

  // Ángulo representativo de cada opción, para dibujar la figura cuando no hay medición.
  function angulosFigura(ex) {
    const a = ex.ang || {}, s = ex.seg;
    const rep = (v, def) => num(v) ? v : def;
    return {
      tronco: rep(a.tronco, [0, 0, 12, 40, 75][s.tronco.op || 0]),
      cuello: rep(a.cuello, [10, 10, 32][s.cuello.op || 0]),
      brazo: rep(a.brazo, [8, 8, -35, 32, 68, 115][s.brazo.op || 0]),
      antebrazo: rep(a.antebrazo, [80, 80, 30][s.antebrazo.op || 0]),
      muneca: rep(a.muneca, [0, 5, 28][s.muneca.op || 0]),
      rodilla: rep(a.rodilla, [5, 45, 85][s.piernas.rod || 0]),
      sentado: !!s.piernas.sentado
    };
  }

  // Color por puntuación parcial del segmento (verde → rojo).
  function colorSeg(p, max) {
    if (p == null) return 'var(--gray-2)';
    const f = max <= 1 ? 0 : (p - 1) / (max - 1);
    return f <= 0.01 ? 'var(--green)' : f < 0.5 ? 'var(--yellow)' : f < 0.8 ? 'var(--orange)' : 'var(--red)';
  }

  function figuraSVG(ex, opts) {
    opts = opts || {};
    const g = angulosFigura(ex), P = puntajes(ex);
    const rad = d => d * Math.PI / 180;
    const dir = th => [Math.sin(rad(th)), -Math.cos(rad(th))];
    const mas = (p, th, L) => { const d = dir(th); return [p[0] + d[0] * L, p[1] + d[1] * L]; };
    const L = { tronco: 92, cuello: 16, cabeza: 17, brazo: 56, ante: 50, mano: 17, muslo: 70, pierna: 68 };
    // Piernas primero (cadera en el origen) para apoyar los pies en el piso.
    let cadera = [0, 0], rodilla, tobillo, asiento = null;
    if (g.sentado) {
      rodilla = mas(cadera, 90, L.muslo); tobillo = mas(rodilla, 180, L.pierna);
      asiento = true;
    } else {
      const k = Math.max(0, Math.min(150, g.rodilla));
      const thMuslo = 180 - k * 0.55; rodilla = mas(cadera, thMuslo, L.muslo); tobillo = mas(rodilla, thMuslo + k, L.pierna);
    }
    const hombro = mas(cadera, g.tronco, L.tronco);
    const thCabeza = g.tronco + g.cuello;
    const baseCuello = mas(hombro, thCabeza, L.cuello);
    const cabeza = mas(baseCuello, thCabeza, L.cabeza);
    const thBrazo = g.tronco + 180 - g.brazo;
    const codo = mas(hombro, thBrazo, L.brazo);
    const thAnte = thBrazo - g.antebrazo;
    const muneca = mas(codo, thAnte, L.ante);
    const mano = mas(muneca, thAnte - g.muneca, L.mano);
    const pts = [cadera, rodilla, tobillo, hombro, cabeza, codo, muneca, mano];
    const minX = Math.min(...pts.map(p => p[0])) - 40, maxX = Math.max(...pts.map(p => p[0])) + 40;
    const minY = Math.min(...pts.map(p => p[1])) - 34, piso = tobillo[1] + 6;
    const W = Math.max(260, maxX - minX), H = piso - minY + 18;
    const cx = (minX + maxX) / 2;
    const vb = [cx - W / 2, minY, W, H].map(n => n.toFixed(1)).join(' ');
    const ln = (a, b, c, w) => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
    const dot = (p, r) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${r}" fill="var(--bg-grouped-secondary)" stroke="var(--label-secondary)" stroke-width="2"/>`;
    const cTr = colorSeg(P.tronco, 5), cCu = colorSeg(P.cuello, 3), cBr = colorSeg(P.brazo, 6), cAn = colorSeg(P.antebrazo, 2), cMu = colorSeg(P.muneca, 3), cPi = colorSeg(P.piernas, 4);
    let s = `<svg class="figura" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Postura evaluada">`;
    s += `<line x1="${(cx - W / 2).toFixed(1)}" y1="${piso.toFixed(1)}" x2="${(cx + W / 2).toFixed(1)}" y2="${piso.toFixed(1)}" stroke="var(--separator)" stroke-width="2"/>`;
    if (asiento) s += `<rect x="${(cadera[0] - 24).toFixed(1)}" y="${(cadera[1] + 7).toFixed(1)}" width="${(L.muslo + 16).toFixed(1)}" height="7" rx="3.5" fill="var(--gray-4)"/><line x1="${(cadera[0] - 4).toFixed(1)}" y1="${(cadera[1] + 14).toFixed(1)}" x2="${(cadera[0] - 4).toFixed(1)}" y2="${piso.toFixed(1)}" stroke="var(--gray-4)" stroke-width="5" stroke-linecap="round"/>`;
    // vertical de referencia del tronco
    s += `<line x1="0" y1="0" x2="0" y2="${(-L.tronco - 20).toFixed(1)}" stroke="var(--label-tertiary)" stroke-width="1.5" stroke-dasharray="4 5"/>`;
    s += ln(cadera, rodilla, cPi, 11) + ln(rodilla, tobillo, cPi, 10) + ln(tobillo, [tobillo[0] + 20, tobillo[1]], cPi, 8);
    s += ln(cadera, hombro, cTr, 14) + ln(hombro, baseCuello, cCu, 9);
    s += `<circle cx="${cabeza[0].toFixed(1)}" cy="${cabeza[1].toFixed(1)}" r="15" fill="${cCu}"/>`;
    s += ln(hombro, codo, cBr, 10) + ln(codo, muneca, cAn, 9) + ln(muneca, mano, cMu, 7);
    [cadera, rodilla, hombro, codo, muneca].forEach(p => { s += dot(p, 4); });
    if (opts.etiquetas !== false) {
      const t = (p, txt, dx, dy) => `<text x="${(p[0] + dx).toFixed(1)}" y="${(p[1] + dy).toFixed(1)}" font-size="12" fill="var(--label-secondary)" font-family="var(--font-system)">${txt}</text>`;
      s += t(hombro, Math.round(g.tronco) + 'º', -34, 26);
      s += t(codo, Math.round(g.antebrazo) + 'º', 8, 14);
      s += t(rodilla, Math.round(g.sentado ? 90 : g.rodilla) + 'º', 10, 4);
    }
    return s + '</svg>';
  }

  // ---------------------------------------------------------- medición sobre foto
  const PUNTOS = [
    { k: 'oreja', t: 'Oreja' }, { k: 'hombro', t: 'Hombro' }, { k: 'codo', t: 'Codo' }, { k: 'muneca', t: 'Muñeca' },
    { k: 'nudillo', t: 'Nudillos (mano)' }, { k: 'cadera', t: 'Cadera' }, { k: 'rodilla', t: 'Rodilla' }, { k: 'tobillo', t: 'Tobillo' }
  ];
  const norm = d => { while (d > 180) d -= 360; while (d < -180) d += 360; return d; };

  // pts en coordenadas de imagen (y hacia abajo). mira: +1 si la persona mira a la derecha, -1 a la izquierda.
  function angulosDesdePuntos(pts, mira) {
    const th = (a, b) => (a && b) ? Math.atan2((b.x - a.x) * mira, -(b.y - a.y)) * 180 / Math.PI : null;
    const out = {};
    const t = th(pts.cadera, pts.hombro);
    if (t != null) out.tronco = Math.round(t);
    const tc = th(pts.hombro, pts.oreja);
    if (t != null && tc != null) out.cuello = Math.round(norm(tc - t));
    const tb = th(pts.hombro, pts.codo);
    if (t != null && tb != null) out.brazo = Math.round(norm(t + 180 - tb));
    const ta = th(pts.codo, pts.muneca);
    if (tb != null && ta != null) out.antebrazo = Math.round(Math.abs(norm(tb - ta)));
    const tm = th(pts.muneca, pts.nudillo);
    if (ta != null && tm != null) out.muneca = Math.round(norm(ta - tm));
    const tm1 = th(pts.cadera, pts.rodilla), tp = th(pts.rodilla, pts.tobillo);
    if (tm1 != null && tp != null) out.rodilla = Math.round(Math.abs(norm(tp - tm1)));
    return out;
  }
  // Hacia dónde mira: los codos/manos suelen estar del lado de adelante.
  function adivinarMira(pts) {
    const h = pts.hombro;
    if (!h) return 1;
    const ref = pts.muneca || pts.codo || pts.rodilla;
    return ref && ref.x < h.x ? -1 : 1;
  }

  window.REBA = {
    TABLA_A, TABLA_B, TABLA_C, SEGMENTOS, ORDEN, ACTIVIDAD, NIVELES, PUNTOS,
    nivelDe, nivel886, examenVacio, puntajes, calcular, opsDesdeAngulos, figuraSVG,
    angulosDesdePuntos, adivinarMira, colorSeg
  };
})();
