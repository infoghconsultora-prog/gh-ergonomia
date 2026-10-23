/* Completa las plantillas Excel originales sin rearmarlas: abre el .xlsx con JSZip, cambia solo
 * las celdas de datos (y los valores calculados que muestran las fórmulas) y vuelve a comprimir.
 * Así se conservan las imágenes de las tablas, los formatos, la protección y las fórmulas. */
(function () {
  const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const NSR = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const cache = {};

  async function plantilla(url) {
    if (!cache[url]) cache[url] = fetch(url).then(r => { if (!r.ok) throw new Error('No se pudo leer ' + url); return r.arrayBuffer(); });
    return cache[url];
  }

  async function abrir(url) {
    const zip = await JSZip.loadAsync(await plantilla(url));
    const wb = parse(await zip.file('xl/workbook.xml').async('string'));
    const rels = parse(await zip.file('xl/_rels/workbook.xml.rels').async('string'));
    const destino = {};
    lista(rels.getElementsByTagName('Relationship')).forEach(r => { destino[r.getAttribute('Id')] = r.getAttribute('Target'); });
    const hojas = {};
    lista(wb.getElementsByTagNameNS(NS, 'sheet')).forEach(s => {
      const t = destino[s.getAttributeNS(NSR, 'id')];
      hojas[s.getAttribute('name').trim()] = 'xl/' + t.replace(/^\/?xl\//, '');
    });
    return { zip, wb, hojas, docs: {} };
  }

  const lista = nl => { const a = []; for (let i = 0; i < nl.length; i++) a.push(nl.item(i)); return a; };
  const parse = s => new DOMParser().parseFromString(s, 'application/xml');

  async function hoja(libro, nombre) {
    const ruta = libro.hojas[nombre.trim()];
    if (!ruta) throw new Error('La plantilla no tiene la hoja ' + nombre);
    if (!libro.docs[ruta]) libro.docs[ruta] = parse(await libro.zip.file(ruta).async('string'));
    return libro.docs[ruta];
  }

  const colNum = c => c.split('').reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
  const partes = ref => { const m = /^([A-Z]+)(\d+)$/.exec(ref); return { col: m[1], fila: +m[2] }; };

  function celda(doc, ref, crear) {
    const { col, fila } = partes(ref);
    const data = doc.getElementsByTagNameNS(NS, 'sheetData')[0];
    let row = null;
    for (const r of hijos(data)) {
      const n = +r.getAttribute('r');
      if (n === fila) { row = r; break; }
      if (n > fila) { if (!crear) return null; row = doc.createElementNS(NS, 'row'); row.setAttribute('r', fila); data.insertBefore(row, r); break; }
    }
    if (!row) { if (!crear) return null; row = doc.createElementNS(NS, 'row'); row.setAttribute('r', fila); data.appendChild(row); }
    const cn = colNum(col);
    for (const c of hijos(row)) {
      const r = c.getAttribute('r');
      if (r === ref) return c;
      if (colNum(partes(r).col) > cn) {
        if (!crear) return null;
        const nueva = doc.createElementNS(NS, 'c'); nueva.setAttribute('r', ref); row.insertBefore(nueva, c); return nueva;
      }
    }
    if (!crear) return null;
    const nueva = doc.createElementNS(NS, 'c'); nueva.setAttribute('r', ref); row.appendChild(nueva);
    return nueva;
  }

  const hijos = el => Array.prototype.filter.call(el.childNodes, n => n.nodeType === 1);
  const vaciar = c => { while (c.firstChild) c.removeChild(c.firstChild); };

  const estiloDe = (doc, ref) => { const c = celda(doc, ref, false); return c ? c.getAttribute('s') : null; };

  // Combina un rango si no se pisa con uno existente (para que el texto ocupe el ancho de la fila).
  function fusionar(doc, rango) {
    const ws = doc.documentElement;
    let mc = doc.getElementsByTagNameNS(NS, 'mergeCells')[0];
    const [a, b] = rango.split(':').map(partes);
    const existentes = mc ? lista(mc.getElementsByTagNameNS(NS, 'mergeCell')).map(m => m.getAttribute('ref')) : [];
    const pisa = existentes.some(r => {
      const [x, y] = r.split(':').map(partes);
      if (!y) return false;
      return !(y.fila < a.fila || x.fila > b.fila || colNum(y.col) < colNum(a.col) || colNum(x.col) > colNum(b.col));
    });
    if (pisa) return false;
    if (!mc) {
      mc = doc.createElementNS(NS, 'mergeCells');
      const despues = ['phoneticPr', 'conditionalFormatting', 'dataValidations', 'hyperlinks', 'printOptions', 'pageMargins', 'pageSetup'].map(n => doc.getElementsByTagNameNS(NS, n)[0]).find(Boolean);
      ws.insertBefore(mc, despues || null);
    }
    const m = doc.createElementNS(NS, 'mergeCell'); m.setAttribute('ref', rango); mc.appendChild(m);
    mc.setAttribute('count', lista(mc.getElementsByTagNameNS(NS, 'mergeCell')).length);
    return true;
  }

  // Que la hoja entre en una sola página al imprimir.
  function unaPagina(doc) {
    const ws = doc.documentElement;
    let pr = doc.getElementsByTagNameNS(NS, 'sheetPr')[0];
    if (!pr) { pr = doc.createElementNS(NS, 'sheetPr'); ws.insertBefore(pr, ws.firstChild); }
    let fit = pr.getElementsByTagNameNS(NS, 'pageSetUpPr')[0];
    if (!fit) { fit = doc.createElementNS(NS, 'pageSetUpPr'); pr.appendChild(fit); }
    fit.setAttribute('fitToPage', '1');
    const ps = doc.getElementsByTagNameNS(NS, 'pageSetup')[0];
    if (ps) { ps.removeAttribute('scale'); ps.setAttribute('fitToWidth', '1'); ps.setAttribute('fitToHeight', '1'); }
  }

  // Escribe un valor constante (borra fórmula si había).
  function escribir(doc, ref, valor, estilo) {
    const c = celda(doc, ref, true);
    vaciar(c);
    c.removeAttribute('t');
    if (estilo != null) c.setAttribute('s', estilo);
    if (valor == null || valor === '') return c;
    if (typeof valor === 'number') {
      const v = doc.createElementNS(NS, 'v'); v.textContent = String(valor); c.appendChild(v);
    } else {
      c.setAttribute('t', 'inlineStr');
      const is = doc.createElementNS(NS, 'is'), t = doc.createElementNS(NS, 't');
      t.setAttribute('xml:space', 'preserve'); t.textContent = String(valor);
      is.appendChild(t); c.appendChild(is);
    }
    return c;
  }

  // Actualiza solo el valor calculado de una celda con fórmula (lo que se ve sin recalcular).
  function calculado(doc, ref, valor) {
    const c = celda(doc, ref, false);
    if (!c) return;
    let v = c.getElementsByTagNameNS(NS, 'v')[0];
    if (!v) { v = doc.createElementNS(NS, 'v'); c.appendChild(v); }
    if (typeof valor === 'boolean') { c.setAttribute('t', 'b'); v.textContent = valor ? '1' : '0'; }
    else if (typeof valor === 'number') { c.removeAttribute('t'); v.textContent = String(valor); }
    else { c.setAttribute('t', 'str'); v.setAttribute('xml:space', 'preserve'); v.textContent = String(valor); }
  }

  function formula(doc, ref, texto) {
    const c = celda(doc, ref, false);
    const f = c && c.getElementsByTagNameNS(NS, 'f')[0];
    if (f) f.textContent = texto;
  }

  // Al abrir: arriba de todo, en la hoja indicada, y que Excel recalcule.
  function prepararLibro(libro, hojaActiva) {
    let calc = libro.wb.getElementsByTagNameNS(NS, 'calcPr')[0];
    if (!calc) { calc = libro.wb.createElementNS(NS, 'calcPr'); libro.wb.documentElement.appendChild(calc); }
    calc.setAttribute('fullCalcOnLoad', '1');
    const nombres = lista(libro.wb.getElementsByTagNameNS(NS, 'sheet')).map(s => s.getAttribute('name').trim());
    const idx = Math.max(0, nombres.indexOf(hojaActiva));
    const bv = libro.wb.getElementsByTagNameNS(NS, 'workbookView')[0];
    if (bv) { bv.setAttribute('activeTab', idx); bv.setAttribute('firstSheet', 0); }
    // quitar la ruta local que dejó Excel al convertir
    lista(libro.wb.getElementsByTagName('mc:AlternateContent')).forEach(n => n.parentNode.removeChild(n));
  }

  async function vistasArriba(libro, hojaActiva) {
    for (const nombre of Object.keys(libro.hojas)) {
      const doc = await hoja(libro, nombre);
      lista(doc.getElementsByTagNameNS(NS, 'sheetView')).forEach(v => {
        v.removeAttribute('topLeftCell');
        if (nombre === hojaActiva) v.setAttribute('tabSelected', '1'); else v.removeAttribute('tabSelected');
        lista(v.getElementsByTagNameNS(NS, 'selection')).forEach(s => { s.setAttribute('activeCell', 'A1'); s.setAttribute('sqref', 'A1'); s.removeAttribute('pane'); });
      });
    }
  }

  async function cerrar(libro) {
    const ser = new XMLSerializer();
    libro.zip.file('xl/workbook.xml', ser.serializeToString(libro.wb));
    for (const ruta of Object.keys(libro.docs)) libro.zip.file(ruta, ser.serializeToString(libro.docs[ruta]));
    // calcChain puede quedar desfasado; Excel lo regenera solo.
    if (libro.zip.file('xl/calcChain.xml')) {
      libro.zip.remove('xl/calcChain.xml');
      const ct = await libro.zip.file('[Content_Types].xml').async('string');
      libro.zip.file('[Content_Types].xml', ct.replace(/<Override[^>]*calcChain[^>]*\/>/, ''));
      const rels = await libro.zip.file('xl/_rels/workbook.xml.rels').async('string');
      libro.zip.file('xl/_rels/workbook.xml.rels', rels.replace(/<Relationship[^>]*calcChain[^>]*\/>/, ''));
    }
    return libro.zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /* ================================================================ REBA */
  // Celdas de la hoja "HOJA DE DATOS" de reba.xls (recuadros amarillos).
  const CELDAS_REBA = { cuello: 'H17', piernas: 'H34', tronco: 'H47', carga: 'H54', antebrazo: 'H71', muneca: 'H81', brazo: 'H97', agarre: 'H106' };
  const COLS = 'S T U V W X Y Z AA AB AC AD'.split(' ');

  async function exportarReba(ex, ctx) {
    const r = REBA.calcular(ex);
    if (!r.completo) throw new Error('Faltan datos: ' + r.faltan.join(', '));
    const libro = await abrir('plantillas/reba.xlsx');
    const d = await hoja(libro, 'HOJA DE DATOS');
    const s = await hoja(libro, 'NIVEL DE RIESGO Y ACCIÓN');
    const P = r.P;
    Object.keys(CELDAS_REBA).forEach(k => escribir(d, CELDAS_REBA[k], P[k]));
    const act = REBA.ACTIVIDAD.map(a => ex.act[a.k] === 'S' ? 'S' : 'N');
    escribir(d, 'H112', act[0]); escribir(d, 'H116', act[1]); escribir(d, 'H120', act[2]);
    // La planilla original solo sumaba la primera pregunta de actividad muscular: K116 y K120
    // miraban celdas vacías (M120 y M124). Se corrige para que sume las tres, como indica el método.
    formula(d, 'K116', 'AND($M$116,H116<>"n",H116<>"N",H116<>"NO",H116<>"no")');
    formula(d, 'K120', 'AND($M$116,H120<>"n",H120<>"N",H120<>"NO",H120<>"no")');

    // Valores calculados (para que se vean bien aunque no se recalcule, p. ej. en la vista previa).
    ['17', '34', '47', '54', '71', '81', '97', '106'].forEach(f => { calculado(d, 'I' + f, false); calculado(d, 'J' + f, 1); });
    ['18', '35', '48', '55', '56', '72', '82', '98', '107', '108', '113', '117', '121'].forEach(f => calculado(d, 'I' + f, ' '));
    calculado(d, 'I57', false); calculado(d, 'J57', 0); calculado(d, 'I109', false); calculado(d, 'J109', 0);
    let fila = 10;
    for (let c = 1; c <= 3; c++) for (let p = 1; p <= 4; p++) for (let t = 1; t <= 5; t++) {
      const ok = c === P.cuello && p === P.piernas && t === P.tronco;
      calculado(d, 'N' + fila, ok); calculado(d, 'O' + fila, ok ? REBA.TABLA_A[t - 1][c - 1][p - 1] : 0); fila++;
    }
    calculado(d, 'P9', r.tablaA);
    fila = 76;
    for (let a = 1; a <= 2; a++) for (let m = 1; m <= 3; m++) for (let b = 1; b <= 6; b++) {
      const ok = a === P.antebrazo && m === P.muneca && b === P.brazo;
      calculado(d, 'N' + fila, ok); calculado(d, 'O' + fila, ok ? REBA.TABLA_B[b - 1][a - 1][m - 1] : 0); fila++;
    }
    calculado(d, 'P75', r.tablaB);
    calculado(d, 'Q3', r.A); calculado(d, 'Q4', r.B);
    for (let i = 1; i <= 12; i++) COLS.forEach((col, j) => {
      const ok = r.A === i && r.B === j + 1;
      calculado(d, col + (11 + i), ok); calculado(d, col + (26 + i), ok ? REBA.TABLA_C[i - 1][j] : 0);
    });
    calculado(d, 'Q5', r.C);
    const L = act.map(v => v === 'S' ? 1 : 0);
    ['112', '116', '120'].forEach((f, i) => { calculado(d, 'I' + f, false); calculado(d, 'J' + f, 1); calculado(d, 'K' + f, !!L[i]); calculado(d, 'L' + f, L[i]); });
    calculado(d, 'M116', 1); calculado(d, 'Q117', r.actividad); calculado(d, 'Q6', r.reba);

    calculado(s, 'B2', ' '); calculado(s, 'B26', ' ');
    calculado(s, 'F9', P.cuello); calculado(s, 'F10', P.piernas); calculado(s, 'F11', P.tronco); calculado(s, 'F12', P.carga);
    calculado(s, 'F16', P.antebrazo); calculado(s, 'F17', P.muneca); calculado(s, 'F18', P.brazo); calculado(s, 'F19', P.agarre);
    REBA.ACTIVIDAD.forEach((a, i) => { calculado(s, 'H' + (23 + i), L[i]); calculado(s, 'B' + (23 + i), L[i] ? a.si : a.no); });
    calculado(s, 'E32', r.reba); calculado(s, 'E34', r.accion); calculado(s, 'E36', r.riesgo); calculado(s, 'E38', r.actuacion);

    if (ctx && ctx.rotulo) escribir(d, 'B3', ctx.rotulo);
    prepararLibro(libro, 'HOJA DE DATOS');
    await vistasArriba(libro, 'HOJA DE DATOS');
    return cerrar(libro);
  }

  /* ================================================================ Planillas 886/15 */
  const X = 'X';
  const fechaAR = iso => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return d + '/' + m + '/' + y; };

  async function exportar886(proy, pu, calc) {
    const libro = await abrir('plantillas/planillas-886.xlsx');
    const e = proy.empresa || {};
    const fecha = fechaAR(proy.fecha);
    const area = pu.area || '';
    const tareasTxt = (pu.tareas || []).map((t, i) => t && t.nombre ? (i + 1) : null).filter(Boolean).join(', ');
    let hojaN = 1;

    // ---- Planilla 1
    const p1 = await hoja(libro, 'Matriz IFR');
    escribir(p1, 'A3', '     Razón Social: ' + (e.razonSocial || ''));
    escribir(p1, 'G3', '    C.U.I.T.: ' + (e.cuit || ''));
    escribir(p1, 'J3', 'CIIU: ' + (e.ciiu || ''));
    escribir(p1, 'A4', '     Dirección del establecimiento: ' + (e.direccion || ''));
    escribir(p1, 'G4', '   Provincia: ' + (e.provincia || ''));
    escribir(p1, 'A6', '     Área y Sector en estudio: ' + area);
    escribir(p1, 'F6', '    N° de trabajadores: ' + (pu.nTrabajadores || ''));
    escribir(p1, 'A7', '     Puesto de trabajo: ' + (pu.nombre || ''));
    escribir(p1, 'A8', '    Procedimiento de trabajo escrito: ' + (pu.procEscrito || 'SI / NO'));
    escribir(p1, 'F8', '   Capacitación: ' + (pu.capacitacion || 'SI / NO'));
    escribir(p1, 'A9', '     Nombre del trabajador/es: ' + (pu.trabajadores || ''));
    escribir(p1, 'A10', '     Manifestación temprana: ' + (pu.manifestacion || 'SI / NO'));
    escribir(p1, 'F10', '  Ubicación del síntoma: ' + (pu.ubicacionSintoma || ''));
    ['C', 'E', 'G'].forEach((col, i) => {
      const t = (pu.tareas || [])[i];
      escribir(p1, col + '15', t && t.nombre ? (i + 1) + '. ' + t.nombre : i + 1);
    });
    P886.FACTORES.forEach((f, i) => {
      const fila = 16 + i, d = (pu.p1 || {})[f.id] || {}, niv = calc.p1[f.id];
      ['C', 'E', 'G'].forEach((col, t) => escribir(p1, col + fila, d.tareas && d.tareas[t] ? X : ''));
      escribir(p1, 'I' + fila, d.tiempo || '');
      ['J', 'K', 'L'].forEach((col, t) => {
        const v = niv.niveles[t];
        escribir(p1, col + fila, v == null ? ((pu.tareas || [])[t] && pu.tareas[t].nombre ? '–' : '') : v);
      });
    });
    escribir(p1, 'J33', 'Fecha: ' + fecha);
    escribir(p1, 'J34', 'Hoja N°: ' + hojaN++);

    // ---- Planillas 2
    for (const f of P886.FACTORES) {
      const h = await hoja(libro, f.hoja);
      escribir(h, 'A2', 'Área y Sector en estudio: ' + area);
      escribir(h, 'A3', 'Puesto de trabajo: ' + (pu.nombre || ''));
      escribir(h, 'G3', 'Tarea N°: ' + tareasTxt);
      f.bloques.forEach(b => {
        const r = ((pu.p2 || {})[b.id]) || {};
        b.paso1.forEach((q, i) => { const v = (r.paso1 || [])[i]; escribir(h, 'H' + q[1], v === 'SI' ? X : ''); escribir(h, 'I' + q[1], v === 'NO' ? X : ''); });
        b.paso2.forEach((q, i) => { const v = (r.paso2 || [])[i]; escribir(h, 'H' + q[1], v === 'SI' ? X : ''); escribir(h, 'I' + q[1], v === 'NO' ? X : ''); });
      });
      escribir(h, f.fecha, 'Fecha: ' + fecha);
      escribir(h, f.hojaN, 'Hoja N°: ' + hojaN++);
    }

    // ---- Planilla 3
    const p3 = await hoja(libro, 'Matriz de IMP');
    const m3 = pu.p3 || {};
    escribir(p3, 'A2', '      Razón Social: ' + (e.razonSocial || ''));
    escribir(p3, 'L2', 'Nombre del trabajador/es: ' + (pu.trabajadores || ''));
    escribir(p3, 'A3', '      Dirección del establecimiento: ' + (e.direccion || ''));
    escribir(p3, 'A4', '      Área y Sector en estudio: ' + area);
    escribir(p3, 'A5', '     Puesto de Trabajo: ' + (pu.nombre || ''));
    escribir(p3, 'A6', '     Tarea analizada: ' + (pu.tareas || []).filter(t => t && t.nombre).map(t => t.nombre).join(' / '));
    escribir(p3, 'B9', ' Medidas Preventivas Generales                         Fecha: ' + fechaAR(m3.fecha || proy.fecha));
    P886.GENERALES.forEach((g, i) => {
      const v = (m3.generales || [])[i];
      escribir(p3, 'J' + (10 + i), v === 'SI' ? X : ''); escribir(p3, 'K' + (10 + i), v === 'NO' ? X : '');
    });
    const medidas = (m3.medidas || []).filter(m => m && m.texto);
    const sTexto = estiloDe(p3, 'B10'), sObs = estiloDe(p3, 'L10'), sNum = estiloDe(p3, 'A10');
    medidas.slice(0, 29).forEach((m, i) => {
      const f = 14 + i;
      fusionar(p3, 'B' + f + ':K' + f);
      escribir(p3, 'A' + f, i + 1, sNum);
      escribir(p3, 'B' + f, m.texto + (m.tipo ? ' (' + (m.tipo === 'Ing' ? 'Ingeniería' : 'Administrativa') + ')' : ''), sTexto);
      escribir(p3, 'L' + f, m.obs || '', sObs);
    });
    escribir(p3, 'A43', '       Observaciones: ' + (m3.observaciones || ''));
    escribir(p3, 'L48', 'Hoja N°: ' + hojaN++);

    // ---- Planilla 4
    const p4 = await hoja(libro, 'Seguimiento');
    escribir(p4, 'A2', '      Razón Social: ' + (e.razonSocial || ''));
    escribir(p4, 'I2', '   C.U.I.T.: ' + (e.cuit || ''));
    escribir(p4, 'A3', '      Dirección del establecimiento: ' + (e.direccion || ''));
    escribir(p4, 'A4', '      Área y Sector en estudio: ' + area);
    medidas.slice(0, 26).forEach((m, i) => {
      const f = 8 + i;
      ['B', 'D', 'G', 'I', 'K'].forEach((c, j) => fusionar(p4, c + f + ':' + 'CEHJL'[j] + f));
      escribir(p4, 'A' + f, i + 1);
      escribir(p4, 'B' + f, pu.nombre || '');
      escribir(p4, 'D' + f, fecha);
      escribir(p4, 'F' + f, calc.nivelPuesto || '');
      escribir(p4, 'G' + f, m.tipo !== 'Ing' ? fechaAR(m.fechaImpl) : '');
      escribir(p4, 'I' + f, m.tipo === 'Ing' ? fechaAR(m.fechaImpl) : '');
      escribir(p4, 'K' + f, fechaAR(m.fechaCierre));
    });
    escribir(p4, 'J36', 'Hoja N°: ' + hojaN++);

    for (const nombre of Object.keys(libro.hojas)) unaPagina(await hoja(libro, nombre));
    prepararLibro(libro, 'Matriz IFR');
    await vistasArriba(libro, 'Matriz IFR');
    return cerrar(libro);
  }

  window.XLSXGH = { exportarReba, exportar886, abrir, hoja, escribir, calculado, cerrar };
})();
