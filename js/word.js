/* Informe de ergonomía en Word (.docx) armado con docx.js, con la misma estructura que los
 * informes de GH: portada, índice, marco legal y teórico, y por puesto planillas 886/15 + REBA. */
(function (root) {
  const D = root.docx;
  const { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle,
    ShadingType, VerticalAlign, PageBreak, TableLayoutType, Footer, PageNumber, HeadingLevel, TableOfContents, TabStopType } = D;

  const ANCHO = 9638;                  // ancho útil A4 con márgenes de 1134 dxa (2 cm)
  const PX = 96 / 72;                  // docx.js mide imágenes en píxeles; trabajamos en puntos
  const VERDE_GH = '9BBB59', VERDE_CLARO = 'EAF1DD', GRIS = 'F2F2F2', AMARILLO = 'FFFF99';
  const AZUL_REBA = '000080', VERDE_REBA = '008000', ROJO_REBA = '990000';
  const COLOR_NIVEL = { 1: 'C6EFCE', 2: 'FFEB9C', 3: 'FFC7CE' };
  const COLOR_REBA = { verde: 'C6EFCE', amarillo: 'FFEB9C', naranja: 'FCD5B4', rojo: 'FFC7CE' };
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const fechaAR = iso => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return d + '/' + m + '/' + y; };
  const fechaGuion = iso => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return d + '-' + m + '-' + y; };
  const fechaLarga = iso => { if (!iso) return ''; const [y, m, d] = iso.split('-').map(Number); return d + ' de ' + MESES[m - 1] + ' de ' + y; };

  /* ---------------------------------------------------------- utilidades */
  const run = (text, o) => new TextRun(Object.assign({ text: String(text == null ? '' : text) }, o || {}));
  const P = (children, o) => new Paragraph(Object.assign({ children: Array.isArray(children) ? children : [children] }, o || {}));
  const T = (text, o, po) => P([run(text, o)], po);
  const vacio = (pt) => P([run('')], { spacing: { after: pt || 0, before: 0 } });
  const saltoPagina = () => P([new PageBreak()]);
  const LINEA = (c, s) => ({ style: BorderStyle.SINGLE, size: s || 4, color: c || '000000' });
  const BORDES = (c, s) => ({ top: LINEA(c, s), bottom: LINEA(c, s), left: LINEA(c, s), right: LINEA(c, s) });
  const NADA = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const SIN_BORDES = { top: NADA, bottom: NADA, left: NADA, right: NADA };
  const SIN_BORDES_TABLA = { top: NADA, bottom: NADA, left: NADA, right: NADA, insideHorizontal: NADA, insideVertical: NADA };

  function bytesDe(dataUrl) {
    const b64 = dataUrl.split(',')[1] || '';
    if (typeof atob === 'function') { const s = atob(b64); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }
  function tipoDe(bytes) { return bytes[0] === 0x89 && bytes[1] === 0x50 ? 'png' : 'jpg'; }
  function dims(b) {
    if (tipoDe(b) === 'png') return { w: (b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19], h: (b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23] };
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xFF) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return { h: (b[i + 5] << 8) | b[i + 6], w: (b[i + 7] << 8) | b[i + 8] };
      i += 2 + ((b[i + 2] << 8) | b[i + 3]);
    }
    return { w: 800, h: 600 };
  }
  function imagen(bytes, maxW, maxH) {
    if (!bytes) return run('');
    const d = dims(bytes), k = Math.min(maxW / d.w, maxH / d.h);
    return new ImageRun({ type: tipoDe(bytes), data: bytes, transformation: { width: Math.round(d.w * k * PX), height: Math.round(d.h * k * PX) } });
  }

  function celda(contenido, o) {
    o = o || {};
    const hijos = (Array.isArray(contenido) ? contenido : [contenido]).map(c => typeof c === 'string' || typeof c === 'number' || c == null
      ? P([run(c == null ? '' : c, Object.assign({ size: o.size || 18, bold: o.bold, italics: o.italics, color: o.color, font: o.font }))], { alignment: o.align || AlignmentType.LEFT, spacing: { before: 20, after: 20 } })
      : c);
    return new TableCell({
      children: hijos, width: o.w ? { size: o.w, type: WidthType.DXA } : undefined, columnSpan: o.span, rowSpan: o.rowSpan,
      borders: o.borders || BORDES(o.borde), verticalAlign: o.valign || VerticalAlign.CENTER,
      shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill, color: 'auto' } : undefined,
      margins: { top: 30, bottom: 30, left: 80, right: 80 }
    });
  }
  const tabla = (filas, cols, o) => new Table(Object.assign({ width: { size: cols.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: cols, layout: TableLayoutType.FIXED, rows: filas }, o || {}));
  const fila = (celdas, o) => new TableRow(Object.assign({ children: celdas, cantSplit: true }, o || {}));

  const H1 = (t) => P([run(t, { bold: true, size: 24 })], { heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 }, keepNext: true });
  const H2 = (t, nueva) => P([run(t, { bold: true, size: 22 })], { heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 120 }, keepNext: true, pageBreakBefore: !!nueva });
  const H3 = (t, nueva) => P([run(t, { bold: true, size: 22 })], { heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 120 }, keepNext: true, pageBreakBefore: !!nueva });
  const texto = (t, o) => P([run(t)], Object.assign({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 120, line: 276 } }, o || {}));
  const vineta = (t, nivel) => P([run(t)], { bullet: { level: nivel || 0 }, alignment: AlignmentType.JUSTIFIED, spacing: { after: 60, line: 264 } });

  /* ---------------------------------------------------------- textos fijos (los del informe GH) */
  const MARCO_TEORICO = 'La Ergonomía es el término aplicado al campo de los estudios y diseños como interface entre el hombre y la máquina para prevenir la enfermedad y el daño mejorando la realización del trabajo. Intenta asegurar que los trabajos y tareas se diseñen para ser compatibles con la capacidad de los trabajadores. (Res. 295/03 Anexo I).';
  const FACTORES_ACT = [
    ['Carga postural: ', 'La carga postural es una forma especial de trabajo de sostenimiento del cuerpo, el cual genera una solicitación debido a que se mantiene una posición corporal inadecuada, donde se entrega energía sin mediar fuerza externa.'],
    ['Sobreesfuerzos: ', 'Los sobreesfuerzos son la consecuencia de una exigencia fisiológica excesiva en el desarrollo de fuerza mecánica para realizar una determinada acción de trabajo. El sobreesfuerzo supone una exigencia de fuerza que supera a la considerada como extremo aceptable y sitúa al trabajador en niveles de riesgo no tolerables.'],
    ['Microtraumatismos repetitivos: ', 'Son pequeños traumas físicos producidos por la realización de ciertos trabajos por causa de movimientos repetitivos, esfuerzos excesivos, movimiento manual de cargas y/o posturas inadecuadas o forzadas, sobre todo de muñecas y hombros. De ellos se derivan lesiones de cierta gravedad e importancia, localizadas sobre todo en las extremidades superiores, que se materializan en desgarros y deterioros de los tejidos y articulaciones.'],
    ['Metabolismo de trabajo: ', 'Es el conjunto de requerimientos psico-físicos a los que el trabajador se ve sometido a lo largo de la jornada laboral.']
  ];

  /* ---------------------------------------------------------- gráfico "Etapas del trastorno" */
  function graficoEtapas() {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas'); c.width = 1100; c.height = 420;
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = '#000'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(110, 40); g.lineTo(110, 340); g.lineTo(1040, 340); g.stroke();
    g.beginPath(); g.moveTo(100, 50); g.lineTo(110, 30); g.lineTo(120, 50); g.fill();
    g.beginPath(); g.moveTo(1030, 330); g.lineTo(1050, 340); g.lineTo(1030, 350); g.fill();
    g.strokeStyle = '#B4009E'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(110, 130);
    g.bezierCurveTo(400, 140, 600, 150, 760, 170); g.bezierCurveTo(900, 190, 990, 260, 1020, 340); g.stroke();
    g.strokeStyle = '#000'; g.lineWidth = 1.5;
    [[640, 160], [890, 215]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x, y); g.lineTo(x, 340); g.stroke(); });
    g.fillStyle = '#333'; g.font = '30px Calibri, Arial, sans-serif';
    g.fillText('Acción', 20, 32); g.fillText('Tiempo', 960, 400);
    g.fillText('Fatiga', 300, 118); g.fillText('Molestia/Dolor', 640, 140); g.fillText('Lesión', 930, 250);
    g.fillText('Fase I', 330, 325); g.fillText('Fase II', 720, 325); g.fillText('Fase III', 900, 325);
    return bytesDe(c.toDataURL('image/png'));
  }

  /* ---------------------------------------------------------- firmas */
  function bloqueFirmas(ctx, fecha, hoja) {
    const prof = ctx.p.profesional || {};
    const firma = prof.firma ? bytesDe(prof.firma) : null;
    const c = (t, img) => celda([P(img ? [imagen(img, 120, 46)] : [run('')], { alignment: AlignmentType.CENTER, spacing: { before: img ? 0 : 520 } }),
      P([run('______________________', { size: 16 })], { alignment: AlignmentType.CENTER }), P([run(t, { size: 15 })], { alignment: AlignmentType.CENTER })],
    { borders: SIN_BORDES, valign: VerticalAlign.BOTTOM });
    return [
      vacio(120),
      tabla([fila([c('Firma del Empleador'), c('Firma del Responsable del Servicio de Higiene y Seguridad', firma), c('Firma del Responsable del Servicio de Medicina del Trabajo')])], [3212, 3213, 3213], { borders: SIN_BORDES_TABLA }),
      P([run('Fecha: ' + (fecha || ''), { size: 16 }), run('\tHoja N°: ' + hoja, { size: 16 })], { alignment: AlignmentType.RIGHT, spacing: { before: 120 } })
    ];
  }
  function firmaProfesional(ctx) {
    const prof = ctx.p.profesional || {};
    const out = [];
    if (prof.firma) out.push(P([imagen(bytesDe(prof.firma), 140, 60)], { alignment: AlignmentType.RIGHT, spacing: { before: 200 } }));
    if (prof.nombre) out.push(P([run([prof.titulo, prof.nombre].filter(Boolean).join(' '), { size: 18, bold: true })], { alignment: AlignmentType.RIGHT, spacing: { before: prof.firma ? 0 : 300 } }));
    if (prof.matricula) out.push(P([run(prof.matricula, { size: 16 })], { alignment: AlignmentType.RIGHT }));
    return out;
  }

  const barraTitulo = (t, o) => tabla([fila([celda(t, Object.assign({ bold: true, italics: true, size: 20, fill: GRIS, borde: '000000' }, o || {}))])], [ANCHO]);
  const siNo = v => [v === 'SI' ? 'X' : '', v === 'NO' ? 'X' : ''];

  /* ---------------------------------------------------------- Planilla 1 */
  function planilla1(ctx, pu, calc, hoja) {
    const e = ctx.p.empresa || {}, out = [];
    const L = (lbl, v) => [run(lbl + ' ', { size: 17, italics: true }), run(v || '', { size: 17, bold: true })];
    const cl = (lbl, v, w, span) => celda([P(L(lbl, v), { spacing: { before: 20, after: 20 } })], { w, span });
    out.push(barraTitulo('ANEXO I - Planilla 1: IDENTIFICACIÓN DE FACTORES DE RIESGOS'));
    out.push(tabla([
      fila([cl('Razón Social:', e.razonSocial, 4800, 2), cl('C.U.I.T.:', e.cuit, 2919), cl('CIIU:', e.ciiu, 1919)]),
      fila([cl('Dirección del establecimiento:', e.direccion, 4800, 2), cl('Provincia:', e.provincia, 4838, 2)]),
      fila([cl('Área y Sector en estudio:', pu.area, 4800, 2), cl('N° de trabajadores:', pu.nTrabajadores, 4838, 2)]),
      fila([cl('Puesto de trabajo:', pu.nombre, ANCHO, 4)]),
      fila([cl('Procedimiento de trabajo escrito:', pu.procEscrito || 'SI / NO', 4800, 2), cl('Capacitación:', pu.capacitacion || 'SI / NO', 4838, 2)]),
      fila([cl('Nombre del trabajador/es:', pu.trabajadores, ANCHO, 4)]),
      fila([cl('Manifestación temprana:', pu.manifestacion || 'SI / NO', 4800, 2), cl('Ubicación del síntoma:', pu.ubicacionSintoma, 4838, 2)])
    ], [2400, 2400, 2919, 1919]));
    out.push(T('PASO 1: Identificar para el puesto de trabajo, las tareas y los factores de riesgo que se presentan de forma habitual en cada una de ellas.', { size: 17, bold: true }, { spacing: { before: 120, after: 80 } }));
    const W = [380, 2050, 1500, 1500, 1500, 1108, 533, 533, 534];
    const tareas = [0, 1, 2].map(t => (pu.tareas[t] && pu.tareas[t].nombre) ? (t + 1) + '. ' + pu.tareas[t].nombre : String(t + 1));
    const cab = 'D9D9D9';
    const filas = [
      fila([celda('', { w: W[0], rowSpan: 2, fill: cab }), celda('Factor de riesgo de la jornada habitual de trabajo', { w: W[1], rowSpan: 2, size: 15, bold: true, fill: cab }),
        celda('Tareas habituales del Puesto de Trabajo', { span: 3, size: 15, bold: true, align: AlignmentType.CENTER, fill: cab }),
        celda('Tiempo total de exposición al Factor de Riesgo', { w: W[5], rowSpan: 2, size: 14, bold: true, align: AlignmentType.CENTER, fill: cab }),
        celda('Nivel de Riesgo', { span: 3, size: 15, bold: true, align: AlignmentType.CENTER, fill: cab })]),
      fila([...tareas.map((t, i) => celda(t, { w: W[2 + i], size: 15, align: AlignmentType.CENTER, fill: cab })),
        ...[1, 2, 3].map(i => celda('tarea ' + i, { w: W[5 + i], size: 13, align: AlignmentType.CENTER, fill: cab }))])
    ];
    P886.FACTORES.forEach(f => {
      const d = (pu.p1 || {})[f.id] || {}, niv = calc.p1[f.id].niveles;
      filas.push(fila([
        celda(f.id, { w: W[0], bold: true, size: 16, align: AlignmentType.CENTER }), celda(f.nombre, { w: W[1], size: 16 }),
        ...[0, 1, 2].map(t => celda((d.tareas || [])[t] ? '✓' : '', { w: W[2 + t], size: 20, bold: true, align: AlignmentType.CENTER })),
        celda(d.tiempo || '', { w: W[5], size: 16, align: AlignmentType.CENTER }),
        ...[0, 1, 2].map(t => celda(niv[t] == null ? ((pu.tareas[t] && pu.tareas[t].nombre) ? '–' : '') : niv[t], { w: W[6 + t], size: 16, bold: true, align: AlignmentType.CENTER, fill: niv[t] ? COLOR_NIVEL[niv[t]] : undefined }))
      ]));
    });
    out.push(tabla(filas, W));
    out.push(T('Si alguno de los factores de riesgo se encuentra presente, continuar con la Evaluación Inicial de Factores de Riesgo que se identificaron, completando la Planilla 2.', { size: 16, italics: true }, { spacing: { before: 80 } }));
    out.push(...bloqueFirmas(ctx, fechaAR(ctx.p.fecha), hoja));
    return out;
  }

  /* ---------------------------------------------------------- Planilla 2 */
  function planilla2(ctx, pu, f, hoja, assets) {
    const out = [];
    const tareas = (pu.tareas || []).map((t, i) => t && t.nombre ? i + 1 : null).filter(Boolean).join(', ');
    out.push(barraTitulo('ANEXO I - Planilla 2: EVALUACIÓN INICIAL DE FACTORES DE RIESGOS'));
    out.push(tabla([
      fila([celda([P([run('Área y Sector en estudio: ', { size: 17, italics: true }), run(pu.area || '', { size: 17, bold: true })])], { span: 2 })]),
      fila([celda([P([run('Puesto de trabajo: ', { size: 17, italics: true }), run(pu.nombre || '', { size: 17, bold: true })])], { w: 6838 }),
        celda([P([run('Tarea N°: ', { size: 17, italics: true }), run(tareas, { size: 17, bold: true })])], { w: 2800 })])
    ], [6838, 2800]));
    const W = [500, 7338, 900, 900];
    f.bloques.forEach(b => {
      const r = (pu.p2 || {})[b.id] || {};
      out.push(vacio(60));
      out.push(barraTitulo(b.subtitulo || f.titulo, { size: 18, align: AlignmentType.CENTER }));
      const tablaPaso = (lista, resp) => tabla([
        fila([celda('N°', { w: W[0], bold: true, size: 16, align: AlignmentType.CENTER, fill: GRIS }), celda('DESCRIPCIÓN', { w: W[1], bold: true, size: 16, align: AlignmentType.CENTER, fill: GRIS }),
          celda('SI', { w: W[2], bold: true, size: 16, align: AlignmentType.CENTER, fill: GRIS }), celda('NO', { w: W[3], bold: true, size: 16, align: AlignmentType.CENTER, fill: GRIS })]),
        ...lista.map((q, i) => { const [s, n] = siNo((resp || [])[i]); return fila([celda(i + 1, { w: W[0], size: 16, align: AlignmentType.CENTER }), celda(q[0], { w: W[1], size: 16 }), celda(s, { w: W[2], size: 18, bold: true, align: AlignmentType.CENTER }), celda(n, { w: W[3], size: 18, bold: true, align: AlignmentType.CENTER })]); })
      ], W);
      out.push(T(b.paso1Titulo, { size: 17, bold: true }, { spacing: { before: 100, after: 60 } }));
      out.push(tablaPaso(b.paso1, r.paso1));
      b.nota1.forEach(n => out.push(T(n, { size: 15 }, { spacing: { after: 0 } })));
      out.push(T('PASO 2: Determinación del Nivel de Riesgo', { size: 17, bold: true }, { spacing: { before: 100, after: 60 } }));
      out.push(tablaPaso(b.paso2, r.paso2));
      out.push(T(b.nota2 || P886.NOTA2, { size: 15 }, { spacing: { after: 0 } }));
      if (b.nota2extra) out.push(T(b.nota2extra, { size: 15 }));
      const res = EVAL.resultadoBloque(b, r), est = EVAL.ESTADOS[res.estado];
      out.push(P([run('Resultado: ', { size: 16, bold: true }), run(est.t + (res.motivo ? ' (' + res.motivo + ')' : ''), { size: 16, bold: true, color: { verde: '00703C', amarillo: '9C6500', rojo: 'C00000', gris: '7F7F7F' }[est.c] })], { spacing: { before: 60 } }));
    });
    if (f.borg) {
      out.push(vacio(60));
      out.push(tabla([fila([celda('Escala de Borg', { span: 2, bold: true, size: 16, fill: GRIS })]), ...P886.BORG.map(b => fila([celda(b[0], { w: 5000, size: 15 }), celda(b[1], { w: 1200, size: 15, align: AlignmentType.CENTER })]))], [5000, 1200]));
    }
    if (f.fanger && assets.fanger) {
      out.push(P([imagen(assets.fanger, 300, 220)], { alignment: AlignmentType.CENTER, spacing: { before: 80 } }));
      out.push(T('Fuente: Fanger, P.O. Thermal confort. Mc.Graw Hill. New York. 1972.', { size: 14, italics: true }, { alignment: AlignmentType.CENTER }));
    }
    out.push(...bloqueFirmas(ctx, fechaAR(ctx.p.fecha), hoja));
    return out;
  }

  /* ---------------------------------------------------------- Planillas 3 y 4 */
  function planilla3(ctx, pu, calc, hoja) {
    const e = ctx.p.empresa || {}, m = pu.p3 || {}, out = [];
    const L = (lbl, v) => celda([P([run(lbl + ' ', { size: 17, italics: true }), run(v || '', { size: 17, bold: true })])], { span: 2 });
    out.push(barraTitulo('ANEXO I - Planilla 3: IDENTIFICACIÓN DE MEDIDAS CORRECTIVAS Y PREVENTIVAS'));
    out.push(tabla([
      fila([L('Razón Social:', e.razonSocial)]), fila([L('Dirección del establecimiento:', e.direccion)]), fila([L('Área y Sector en estudio:', pu.area)]),
      fila([L('Puesto de Trabajo:', pu.nombre)]), fila([L('Tarea analizada:', (pu.tareas || []).filter(t => t && t.nombre).map(t => t.nombre).join(' / '))]),
      fila([L('Nombre del trabajador/es:', pu.trabajadores)])
    ], [4819, 4819]));
    out.push(vacio(60));
    const W = [450, 5588, 650, 650, 2300];
    out.push(tabla([
      fila([celda('Medidas Correctivas y Preventivas (M.C.P.)', { span: 5, bold: true, size: 17, align: AlignmentType.CENTER, fill: GRIS })]),
      fila([celda('N°', { w: W[0], bold: true, size: 15, fill: GRIS }), celda('Medidas Preventivas Generales          Fecha: ' + fechaAR(m.fecha || ctx.p.fecha), { w: W[1], bold: true, size: 15, fill: GRIS }),
        celda('SI', { w: W[2], bold: true, size: 15, align: AlignmentType.CENTER, fill: GRIS }), celda('NO', { w: W[3], bold: true, size: 15, align: AlignmentType.CENTER, fill: GRIS }), celda('Observaciones', { w: W[4], bold: true, size: 15, fill: GRIS })]),
      ...P886.GENERALES.map((g, i) => { const [s, n] = siNo((m.generales || [])[i]); return fila([celda(i + 1, { w: W[0], size: 15, align: AlignmentType.CENTER }), celda(g, { w: W[1], size: 15 }), celda(s, { w: W[2], bold: true, align: AlignmentType.CENTER }), celda(n, { w: W[3], bold: true, align: AlignmentType.CENTER }), celda('', { w: W[4] })]); })
    ], W));
    const meds = (m.medidas || []).filter(x => x && x.texto);
    const W2 = [450, 6888, 2300];
    out.push(tabla([
      fila([celda('N°', { w: W2[0], bold: true, size: 15, fill: GRIS }), celda('Medidas Correctivas y Preventivas Específicas (Administrativas y de Ingeniería)', { w: W2[1], bold: true, size: 15, fill: GRIS }), celda('Observaciones', { w: W2[2], bold: true, size: 15, fill: GRIS })]),
      ...(meds.length ? meds : [{ texto: '' }]).map((x, i) => fila([celda(meds.length ? i + 1 : '', { w: W2[0], size: 15, align: AlignmentType.CENTER }), celda(x.texto + (x.tipo ? ' (' + (x.tipo === 'Ing' ? 'Ingeniería' : 'Administrativa') + ')' : ''), { w: W2[1], size: 15 }), celda(x.obs || '', { w: W2[2], size: 15 })])),
      fila([celda([P([run('Observaciones: ', { size: 15, bold: true }), run(m.observaciones || '', { size: 15 })])], { span: 3 })])
    ], W2));
    out.push(...bloqueFirmas(ctx, fechaAR(m.fecha || ctx.p.fecha), hoja));
    return out;
  }
  function planilla4(ctx, pu, calc, hoja) {
    const e = ctx.p.empresa || {}, m = pu.p3 || {}, out = [];
    out.push(barraTitulo('ANEXO I - Planilla 4: MATRIZ DE SEGUIMIENTO DE MEDIDAS PREVENTIVAS'));
    const L = (lbl, v, span, w) => celda([P([run(lbl + ' ', { size: 17, italics: true }), run(v || '', { size: 17, bold: true })])], { span, w });
    out.push(tabla([
      fila([L('Razón Social:', e.razonSocial, 1, 6438), L('C.U.I.T.:', e.cuit, 1, 3200)]),
      fila([L('Dirección del establecimiento:', e.direccion, 2)]), fila([L('Área y Sector en estudio:', pu.area, 2)])
    ], [6438, 3200]));
    out.push(vacio(60));
    const W = [800, 2238, 1200, 900, 1500, 1500, 1500];
    const cab = ['N° M.C.P', 'Nombre del Puesto', 'Fecha de Evaluación', 'Nivel de riesgo', 'Fecha de implementación de la Medida Administrativa', 'Fecha de implementación de la Medida de Ingeniería', 'Fecha de Cierre'];
    const meds = (m.medidas || []).filter(x => x && x.texto);
    const filas = [fila(cab.map((c, i) => celda(c, { w: W[i], size: 14, bold: true, align: AlignmentType.CENTER, fill: GRIS })))];
    const n = Math.max(meds.length, 6);
    for (let i = 0; i < n; i++) {
      const x = meds[i];
      filas.push(fila([
        celda(x ? i + 1 : '', { w: W[0], size: 15, align: AlignmentType.CENTER }), celda(x ? pu.nombre : '', { w: W[1], size: 15 }), celda(x ? fechaAR(ctx.p.fecha) : '', { w: W[2], size: 15, align: AlignmentType.CENTER }),
        celda(x ? (calc.nivelPuesto || '') : '', { w: W[3], size: 15, bold: true, align: AlignmentType.CENTER, fill: x && calc.nivelPuesto ? COLOR_NIVEL[calc.nivelPuesto] : undefined }),
        celda(x && x.tipo !== 'Ing' ? fechaAR(x.fechaImpl) : '', { w: W[4], size: 15, align: AlignmentType.CENTER }), celda(x && x.tipo === 'Ing' ? fechaAR(x.fechaImpl) : '', { w: W[5], size: 15, align: AlignmentType.CENTER }),
        celda(x ? fechaAR(x.fechaCierre) : '', { w: W[6], size: 15, align: AlignmentType.CENTER })
      ]));
    }
    out.push(tabla(filas, W));
    out.push(...bloqueFirmas(ctx, fechaAR(ctx.p.fecha), hoja));
    return out;
  }

  /* ---------------------------------------------------------- REBA (réplica de la hoja de datos) */
  function seccionReba(ctx, pu, ex, assets, fotoMedida) {
    const r = REBA.calcular(ex), out = [];
    const tarea = pu.tareas && pu.tareas[ex.tarea] && pu.tareas[ex.tarea].nombre !== ex.nombre ? pu.tareas[ex.tarea].nombre : null;
    out.push(P([run('Examen: ', { bold: true, size: 20 }), run(ex.nombre || '', { size: 20 }), ...(tarea ? [run('   ·   Tarea ' + (ex.tarea + 1) + ': ', { bold: true, size: 20 }), run(tarea, { size: 20 })] : []), run('   ·   Lado: ' + (ex.lado || 'Derecho'), { size: 20 })], { spacing: { before: 60, after: 80 } }));
    if (ex.notas) out.push(texto(ex.notas));
    if (fotoMedida) {
      out.push(P([imagen(bytesDe(fotoMedida), 360, 260)], { alignment: AlignmentType.CENTER, spacing: { after: 40 } }));
      const a = ex.ang || {};
      const partes = [['Tronco', a.tronco], ['Cuello', a.cuello], ['Brazo', a.brazo], ['Flexión de codo', a.antebrazo], ['Muñeca', a.muneca], ['Rodilla', a.rodilla]].filter(x => typeof x[1] === 'number').map(x => x[0] + ' ' + x[1] + 'º');
      out.push(T('Ángulos medidos sobre la fotografía: ' + partes.join(' · ') + '.', { size: 16, italics: true }, { alignment: AlignmentType.CENTER, spacing: { after: 120 } }));
    }
    if (!r.completo) { out.push(texto('Examen incompleto: faltan ' + r.faltan.join(', ') + '.')); return out; }
    const azul = t => T(t, { bold: true, color: AZUL_REBA, size: 22, font: 'Arial' }, { spacing: { before: 160, after: 100 } });
    const verde = (t, tam) => T(t, { bold: true, color: VERDE_REBA, size: tam || 18, font: 'Arial' }, { spacing: { before: 100, after: 40 }, keepNext: true });
    const caja = v => celda(String(v), { w: 760, size: 32, font: 'Comic Sans MS', align: AlignmentType.CENTER, fill: AMARILLO, borders: BORDES('000000', 12) });
    // Recuadro amarillo chico abajo a la derecha de la tabla, como en la planilla original.
    const cajaAbajo = v => celda([tabla([fila([caja(v)], { height: { value: 520, rule: 'atLeast' } })], [760]), P([run('', { size: 2 })], { spacing: { before: 0, after: 0 } })],
      { w: 900, borders: SIN_BORDES, valign: VerticalAlign.BOTTOM });
    const bloque = (nombre, img, v, maxH) => [verde(nombre),
      tabla([fila([celda([P([imagen(assets.reba[img], 330, maxH || 170)])], { w: 6400, borders: SIN_BORDES, valign: VerticalAlign.BOTTOM }), cajaAbajo(v)])], [6400, 900], { borders: SIN_BORDES_TABLA })];
    out.push(azul('MÉTODO R.E.B.A. (HOJA DE DATOS):'));
    out.push(verde('Grupo A: Análisis de cuello, piernas y tronco', 20));
    out.push(...bloque('CUELLO', 'cuello', r.P.cuello, 90), ...bloque('PIERNAS', 'piernas', r.P.piernas, 170), ...bloque('TRONCO', 'tronco', r.P.tronco, 130), ...bloque('CARGA / FUERZA', 'carga', r.P.carga, 40));
    out.push(verde('Grupo B: Análisis de brazos, antebrazos y muñecas', 20));
    out.push(...bloque('ANTEBRAZOS', 'antebrazos', r.P.antebrazo, 110), ...bloque('MUÑECAS', 'munecas', r.P.muneca, 90), ...bloque('BRAZOS', 'brazos', r.P.brazo, 150), ...bloque('AGARRE', 'agarre', r.P.agarre, 70));
    out.push(verde('ACTIVIDAD MUSCULAR'));
    REBA.ACTIVIDAD.forEach(a => {
      out.push(tabla([fila([celda(a.t.replace('?', ' (S/N)?'), { w: 6400, bold: true, size: 17, borders: BORDES('000000', 12) }), caja(ex.act[a.k] === 'S' ? 'S' : 'N')])], [6400, 760]));
      out.push(vacio(60));
    });
    // Resumen de datos y niveles de riesgo y acción
    out.push(azul('RESUMEN DE DATOS:'));
    const par = (lbl, rango, v) => P([run(lbl, { bold: true, size: 17, font: 'Arial' }), run(rango, { bold: true, size: 12, font: 'Arial', superScript: true }), run(':\t', { bold: true, size: 17 }), run(String(v), { color: ROJO_REBA, size: 20, font: 'Comic Sans MS' })],
      { tabStops: [{ type: TabStopType.LEFT, position: 4300 }], indent: { left: 1200 }, spacing: { after: 20 } });
    out.push(verde('Grupo A: Análisis de cuello, piernas y tronco'));
    out.push(par('PUNTUACIÓN CUELLO', '(1-3)', r.P.cuello), par('PUNTUACIÓN PIERNAS', '(1-4)', r.P.piernas), par('PUNTUACIÓN TRONCO', '(1-5)', r.P.tronco), par('PUNTUACIÓN CARGA/FUERZA', '(0-3)', r.P.carga));
    out.push(verde('Grupo B: Análisis de brazos, antebrazos y muñecas'));
    out.push(par('PUNTUACIÓN ANTEBRAZOS', '(1-2)', r.P.antebrazo), par('PUNTUACIÓN MUÑECAS', '(1-3)', r.P.muneca), par('PUNTUACIÓN BRAZOS', '(1-6)', r.P.brazo), par('PUNTUACIÓN AGARRE', '(0-3)', r.P.agarre));
    out.push(verde('Actividad muscular:'));
    REBA.ACTIVIDAD.forEach(a => out.push(T(ex.act[a.k] === 'S' ? a.si : a.no, { color: ROJO_REBA, size: 18, font: 'Comic Sans MS' }, { spacing: { after: 0 } })));
    out.push(vacio(120));
    const lv = (lbl, rango, v) => P([run(lbl, { bold: true, color: VERDE_REBA, size: 17, font: 'Arial' }), run(rango, { bold: true, color: VERDE_REBA, size: 12, superScript: true }), run('\t' + v, { color: ROJO_REBA, size: 22, font: 'Comic Sans MS' })],
      { tabStops: [{ type: TabStopType.LEFT, position: 3000 }], spacing: { after: 100 } });
    out.push(tabla([fila([celda([
      T('NIVELES DE RIESGO Y ACCIÓN:', { bold: true, color: AZUL_REBA, size: 18, font: 'Arial' }, { spacing: { after: 120 } }),
      lv('Puntuación final REBA', '(1-15)', r.reba), lv('Nivel de acción', '(0-4)', r.accion), lv('Nivel de riesgo', '', r.riesgo), lv('Actuación', '', r.actuacion)
    ], { w: 7200, borders: BORDES('990033', 18), fill: undefined })])], [7200], { alignment: AlignmentType.CENTER }));
    out.push(P([run('Equivalencia Res. SRT 886/15: ', { bold: true, size: 18 }), run('nivel de riesgo ' + r.nivel886 + ' (' + ['', 'tolerable', 'moderado', 'no tolerable'][r.nivel886] + ').', { size: 18 })], { spacing: { before: 120 } }));
    return out;
  }

  function tablaMedidas(pu) {
    const m = pu.p3 || {}, meds = (m.medidas || []).filter(x => x && x.texto);
    const B = BORDES(VERDE_GH, 12);
    const c = (t, o) => celda([P(Array.isArray(t) ? t : [run(t, { size: 20, bold: o && o.bold })], { alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })], { borders: B, w: ANCHO });
    return tabla([
      fila([c('Medidas Correctivas y Preventivas Específicas (Administrativas y de Ingeniería)', { bold: true })]),
      ...meds.map(x => fila([c(x.texto)])),
      fila([c([run('Observaciones: ', { size: 20 }), run(m.observaciones || '', { size: 20, bold: true })])])
    ], [ANCHO]);
  }

  /* ---------------------------------------------------------- documento */
  async function generarInforme(p, opts) {
    opts = opts || {};
    const cargar = opts.cargar || (async url => new Uint8Array(await (await fetch(url)).arrayBuffer()));
    const assets = { reba: {} };
    for (const k of ['cuello', 'piernas', 'tronco', 'carga', 'antebrazos', 'munecas', 'brazos', 'agarre']) assets.reba[k] = await cargar('assets/reba/' + k + '.png');
    assets.logo = await cargar('assets/logo-gh.png');
    assets.fanger = await cargar('assets/fanger.png');
    const ctx = { p };
    const usarEscaneos = !(p.opciones && p.opciones.escaneos === false);
    const fotosMedidas = opts.fotosMedidas || {};
    const calcs = p.puestos.map(pu => EVAL.calcularPuesto(pu));

    // ---- portada
    const portada = [
      vacio(1400),
      T('EVALUACIÓN DE AMBIENTE LABORAL', { size: 32, font: 'Arial' }, { alignment: AlignmentType.CENTER, spacing: { after: 480 } }),
      T('INFORME DE ERGONOMÍA', { size: 32 }, { alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
      p.portada ? P([imagen(bytesDe(p.portada), 300, 220)], { alignment: AlignmentType.CENTER, spacing: { after: 300 } }) : vacio(600),
      T(p.titulo || (p.empresa || {}).razonSocial || '', { size: 56 }, { alignment: AlignmentType.CENTER, spacing: { after: 360 } }),
      T('DECRETO 351/79. RES. 886/15', { bold: true, size: 26 }, { alignment: AlignmentType.CENTER }),
      T(fechaAR(p.fecha), { bold: true, size: 26 }, { alignment: AlignmentType.CENTER, spacing: { after: 240 } }),
      T('PROTOCOLO DE ERGONOMÍA.', { bold: true, italics: true, size: 22 }, { alignment: AlignmentType.CENTER }),
      T('Res. 886/15', { bold: true, italics: true, size: 20 }, { alignment: AlignmentType.CENTER, spacing: { after: 1400 } }),
      P([imagen(assets.logo, 130, 70)], { alignment: AlignmentType.RIGHT })
    ];

    // ---- índice e introducción
    const c = [];
    c.push(T('ÍNDICE', { bold: true, size: 24 }, { spacing: { after: 200 } }));
    c.push(new TableOfContents('Índice', { hyperlink: true, headingStyleRange: '1-3' }));
    c.push(T('(Si el índice aparece vacío, hacé clic derecho sobre él y elegí "Actualizar campo".)', { size: 16, italics: true, color: '7F7F7F' }));
    c.push(saltoPagina());
    c.push(H1('1. INTRODUCCIÓN'));
    c.push(texto(opts.intro || ''));
    c.push(H1('2. OBJETIVO DEL INFORME'));
    c.push(texto('El objetivo del presente informe es reflejar los resultados obtenidos en los diferentes análisis de los distintos puestos de trabajo.'));
    c.push(T('Puestos de trabajo analizados:', { bold: true }, { spacing: { after: 80 } }));
    c.push(tabla(p.puestos.map((pu, i) => fila([celda(pu.nombre, { w: 4200, bold: true, size: 22, borders: BORDES(VERDE_GH, 12), fill: i % 2 ? VERDE_CLARO : undefined })])), [4200]));
    c.push(H1('3. MARCO LEGAL'));
    c.push(texto('Las normas utilizadas fueron: Ley 19.587 de Higiene y Seguridad en el Trabajo y su Decreto Reglamentario 351/79, Resolución MTEySS 295/03 y Resolución SRT 886/15.'));
    c.push(H1('4. MARCO TEÓRICO'));
    c.push(texto(MARCO_TEORICO));
    c.push(H2('4.1 Factores actuantes'));
    FACTORES_ACT.forEach(([a, b]) => c.push(P([run(a, { bold: true }), run(b)], { bullet: { level: 0 }, alignment: AlignmentType.JUSTIFIED, spacing: { after: 60, line: 264 } })));
    c.push(H2('4.2 Concepto de microtraumatismo repetitivo'));
    c.push(vineta('Microtraumatismos Repetitivos (MTR): son pequeños traumas físicos producidos por la realización de ciertos trabajos por causa de movimientos repetitivos, esfuerzos excesivos, movimiento manual de cargas y/o posturas inadecuadas o forzadas, sobre todo de muñecas y hombros.'));
    c.push(vineta('Trastornos por Traumas Acumulados: se considera trastorno traumático acumulativo a la lesión músculo-esquelética derivada de:'));
    ['Mantenimiento de posturas forzadas de muñeca y hombros.', 'Aplicación de una fuerza manual excesiva.', 'Ciclos de trabajo muy repetitivos, dando lugar a movimientos rápidos de pequeños grupos musculares o tendinosos.', 'Tiempos de descanso insuficientes.'].forEach(t => c.push(vineta(t, 1)));
    c.push(texto('Síntomas: dolor, entumecimiento del miembro, hinchazón, pérdida de función (fuerza / limitación del movimiento).', { indent: { left: 720 } }));
    c.push(vineta('Etapas del trastorno:'));
    const etapas = opts.graficoEtapas !== false ? graficoEtapas() : null;
    if (etapas) c.push(P([imagen(etapas, 400, 160)], { alignment: AlignmentType.CENTER, spacing: { after: 120 } }));
    c.push(H2('4.3 Metodología del análisis'));
    c.push(texto('Se basa en la identificación de factores de riesgos:', { spacing: { after: 60 } }));
    ['Posturas', 'Repetitividad', 'Fuerza', 'Falta de descanso'].forEach(t => c.push(vineta(t)));
    c.push(texto('Para ello hay que definir correctamente las tareas reales del personal en evaluación. En cada puesto se completan las planillas del Anexo I de la Resolución SRT 886/15 (identificación de factores de riesgo, evaluación inicial, medidas correctivas y preventivas y seguimiento) y, cuando la evaluación inicial no permite presumir que el riesgo es tolerable, se realiza la evaluación de riesgos mediante el método R.E.B.A.', { spacing: { before: 80, after: 120 } }));
    c.push(H2('4.4 Método R.E.B.A.'));
    c.push(texto('El método R.E.B.A. (Rapid Entire Body Assessment, Hignett y McAtamney, 2000) evalúa la carga postural de todo el cuerpo. Se puntúan el cuello, las piernas y el tronco (Grupo A) y los brazos, antebrazos y muñecas (Grupo B), corregidos por la carga o fuerza, el tipo de agarre y la actividad muscular. La puntuación final (1 a 15) define el nivel de acción y de riesgo:'));
    const WN = [1900, 1700, 1900, 4138];
    c.push(tabla([
      fila(['Puntuación REBA', 'Nivel de acción', 'Nivel de riesgo', 'Actuación'].map((t, i) => celda(t, { w: WN[i], bold: true, size: 18, align: AlignmentType.CENTER, fill: GRIS }))),
      ...[['1', 0], ['2 – 3', 1], ['4 – 7', 2], ['8 – 10', 3], ['11 – 15', 4]].map(([pt, a]) => { const n = REBA.NIVELES[a]; return fila([celda(pt, { w: WN[0], align: AlignmentType.CENTER, size: 18 }), celda(String(a), { w: WN[1], align: AlignmentType.CENTER, size: 18 }), celda(n.riesgo, { w: WN[2], align: AlignmentType.CENTER, size: 18, bold: true, fill: COLOR_REBA[n.color] }), celda(n.actuacion, { w: WN[3], size: 18 })]); })
    ], WN));
    c.push(texto('Para volcar el resultado en la Planilla 1 de la Res. SRT 886/15 se toma: niveles de acción 0 y 1 como nivel de riesgo 1 (tolerable), nivel de acción 2 como nivel 2 (moderado) y niveles de acción 3 y 4 como nivel 3 (no tolerable).', { spacing: { before: 120 } }));

    // ---- evaluación de puestos
    c.push(H1('5. EVALUACIÓN DE PUESTOS DE TRABAJO'));
    const WP = [900, 4369, 4369];
    c.push(tabla([
      fila([celda('', { w: WP[0], fill: 'DBE5F1' }), celda('Área o sector', { w: WP[1], bold: true, size: 20, align: AlignmentType.CENTER, fill: 'DBE5F1' }), celda('Puesto', { w: WP[2], bold: true, size: 20, align: AlignmentType.CENTER, fill: 'DBE5F1' })]),
      ...p.puestos.map((pu, i) => fila([celda('5.' + (i + 1), { w: WP[0], size: 20 }), celda(pu.area, { w: WP[1], size: 20 }), celda(pu.nombre, { w: WP[2], size: 20 })]))
    ], WP));

    p.puestos.forEach((pu, i) => {
      const n = '5.' + (i + 1), calc = calcs[i];
      c.push(H2(n + ' ' + (pu.nombre || ''), true));
      if (pu.fotos && pu.fotos[0]) c.push(P([imagen(bytesDe(pu.fotos[0]), 300, 230)], { alignment: AlignmentType.CENTER, spacing: { before: 120, after: 240 } }));
      c.push(texto('A continuación, se presentan las planillas de la Resolución 886/15 correspondientes al análisis ergonómico del puesto de trabajo: ' + (pu.descripcion || pu.nombre) + '.', { spacing: { after: 60 } }));
      c.push(texto('Y luego se presenta el análisis de Método R.E.B.A. para el mismo puesto de trabajo.'));
      c.push(...firmaProfesional(ctx));

      c.push(H3(n + '.1 PLANILLAS DE IDENTIFICACIÓN Y EVALUACIÓN DE RIESGOS: ' + (pu.nombre || ''), true));
      if (usarEscaneos && pu.escaneos && pu.escaneos.length) {
        pu.escaneos.forEach((img, k) => { if (k) c.push(saltoPagina()); c.push(P([imagen(bytesDe(img), 480, 640)], { alignment: AlignmentType.CENTER })); });
      } else {
        let hoja = 1;
        c.push(...planilla1(ctx, pu, calc, hoja++));
        P886.FACTORES.forEach(f => { c.push(saltoPagina()); c.push(...planilla2(ctx, pu, f, hoja++, assets)); });
        c.push(saltoPagina()); c.push(...planilla3(ctx, pu, calc, hoja++));
        c.push(saltoPagina()); c.push(...planilla4(ctx, pu, calc, hoja++));
      }

      c.push(H3(n + '.2 ANÁLISIS MÉTODO R.E.B.A. PARA ' + (pu.nombre || ''), true));
      if (!pu.reba.length) c.push(texto('No se realizaron exámenes R.E.B.A. para este puesto: la evaluación inicial no lo requirió.'));
      pu.reba.forEach((ex, k) => { if (k) c.push(saltoPagina()); c.push(...seccionReba(ctx, pu, ex, assets, fotosMedidas[ex.id])); });
      c.push(vacio(200));
      c.push(tablaMedidas(pu));
      c.push(...firmaProfesional(ctx));
    });

    // ---- conclusiones
    c.push(H1('6. RESUMEN DE RESULTADOS'));
    const cuenta = [0, 0, 0, 0];
    calcs.forEach(k => { cuenta[k.nivelPuesto || 0]++; });
    const partes = [];
    if (cuenta[1]) partes.push(cuenta[1] + ' con nivel de riesgo 1 (tolerable)');
    if (cuenta[2]) partes.push(cuenta[2] + ' con nivel de riesgo 2 (moderado)');
    if (cuenta[3]) partes.push(cuenta[3] + ' con nivel de riesgo 3 (no tolerable)');
    c.push(texto('Se evaluaron ' + p.puestos.length + ' puestos de trabajo' + (partes.length ? ': ' + partes.join(', ').replace(/, ([^,]*)$/, ' y $1') + '.' : '.')));
    const WR = [2900, 1300, 1500, 1638, 2300];
    c.push(tabla([
      fila(['Puesto', 'REBA máx.', 'Nivel de acción', 'Riesgo REBA', 'Nivel Res. 886/15'].map((t, i) => celda(t, { w: WR[i], bold: true, size: 18, align: AlignmentType.CENTER, fill: GRIS }))),
      ...p.puestos.map((pu, i) => {
        const k = calcs[i], nv = k.reba.max ? REBA.nivelDe(k.reba.max) : null, n886 = k.nivelPuesto;
        return fila([celda(pu.nombre, { w: WR[0], size: 18, bold: true }), celda(k.reba.max || '–', { w: WR[1], size: 18, align: AlignmentType.CENTER, fill: nv ? COLOR_REBA[nv.color] : undefined }),
          celda(nv ? nv.accion : '–', { w: WR[2], size: 18, align: AlignmentType.CENTER }), celda(nv ? nv.riesgo : '–', { w: WR[3], size: 18, align: AlignmentType.CENTER }),
          celda(n886 ? n886 + ' · ' + ['', 'Tolerable', 'Moderado', 'No tolerable'][n886] : '–', { w: WR[4], size: 18, align: AlignmentType.CENTER, bold: true, fill: n886 ? COLOR_NIVEL[n886] : undefined })]);
      })
    ], WR));
    c.push(texto('Las medidas correctivas y preventivas de cada puesto se detallan en su sección y en la Planilla 3; su seguimiento se registra en la Planilla 4. Los puestos con nivel de riesgo 1 deberán ser reevaluados con frecuencia anual.', { spacing: { before: 160 } }));
    c.push(...firmaProfesional(ctx));

    const pie = new Footer({
      children: [tabla([fila([
        celda([P([imagen(assets.logo, 70, 36)])], { w: 2600, borders: SIN_BORDES, valign: VerticalAlign.BOTTOM }),
        celda([P([new TextRun({ children: ['Página ', PageNumber.CURRENT, ' de ', PageNumber.TOTAL_PAGES], size: 20 })], { alignment: AlignmentType.CENTER })], { w: 4438, borders: SIN_BORDES, valign: VerticalAlign.BOTTOM }),
        celda([P([run('FECHA: ' + fechaGuion(p.fecha), { size: 18 })], { alignment: AlignmentType.RIGHT })], { w: 2600, borders: SIN_BORDES, valign: VerticalAlign.BOTTOM })
      ])], [2600, 4438, 2600], { borders: SIN_BORDES_TABLA })]
    });
    const pagina = { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134, footer: 400 } };
    const doc = new Document({
      creator: 'GH Mediciones', title: 'Informe de ergonomía ' + (p.titulo || ''), features: { updateFields: opts.actualizarCampos !== false },
      styles: {
        default: { document: { run: { font: 'Calibri', size: 22 } } },
        paragraphStyles: [
          { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: 'Calibri', size: 24, bold: true, color: '000000' } },
          { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: 'Calibri', size: 22, bold: true, color: '000000' } },
          { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: 'Calibri', size: 22, bold: true, color: '000000' } }
        ]
      },
      sections: [
        { properties: { page: pagina }, children: portada },
        { properties: { page: pagina }, footers: { default: pie }, children: c }
      ]
    });
    return Packer.toBlob ? Packer.toBlob(doc) : Packer.toBuffer(doc);
  }

  root.WORDGH = { generarInforme };
})(typeof window !== 'undefined' ? window : globalThis);
