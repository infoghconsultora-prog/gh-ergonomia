/* App de Ergonomía de GH: Protocolo Res. SRT 886/15 + método REBA.
 * Estado en memoria, guardado automático en Drive vía el backend (Apps Script). */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const app = $('#app');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = p => (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const hoyISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const fechaAR = iso => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return d + '/' + m + '/' + y; };
  const fechaLarga = iso => { if (!iso) return ''; const [y, m, d] = iso.split('-').map(Number); return d + ' de ' + MESES[m - 1] + ' de ' + y; };
  const RAPIDO = '_reba_rapido';

  /* ------------------------------------------------------------ íconos (trazo SF-like) */
  const sv = (d, extra) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra || ''}>${d}</svg>`;
  const I = {
    mas: sv('<path d="M12 5v14M5 12h14"/>'),
    doc: sv('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'),
    persona: sv('<circle cx="12" cy="4.5" r="2"/><path d="M12 7.5v7M8 10.5l4-1.5 4 1.5M9.5 21l2.5-6.5 2.5 6.5"/>'),
    basura: sv('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>'),
    check: sv('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 'stroke-width="2.6"'),
    chev: sv('<path d="M9 6l6 6-6 6"/>'),
    camara: sv('<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>'),
    bajar: sv('<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>'),
    carpeta: sv('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
    copiar: sv('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'),
    regla: sv('<path d="M4 20L20 4M4 20h6M4 20v-6M8 16l1.5 1.5M11 13l1.5 1.5M14 10l1.5 1.5"/>'),
    cerrar: sv('<path d="M6 6l12 12M18 6L6 18"/>', 'stroke-width="2.4"'),
    tabla: sv('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>'),
    grafico: sv('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    salida: sv('<path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>'),
    lapiz: sv('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>'),
    arriba: sv('<path d="M12 19V5M6 11l6-6 6 6"/>'),
    abajo: sv('<path d="M12 5v14M6 13l6 6 6-6"/>'),
    libro: sv('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7"/>'),
    chispa: sv('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>')
  };

  /* ------------------------------------------------------------ estado */
  const S = { lista: null, p: null, tab: {}, exSel: {}, empresas: [], nuevo: null, medir: null, guardado: 'ok', destino: null };

  // Las rutas conservan la forma del servidor local; acá se traducen a acciones del backend (Apps Script).
  async function api(metodo, url, cuerpo) {
    const u = new URL(url, 'http://x'), ruta = u.pathname, id = ruta.split('/')[3];
    if (ruta === '/api/proyectos' && metodo === 'GET') return (await GH.llamar('listarProyectos')).lista;
    if (ruta.startsWith('/api/proyectos/')) {
      if (metodo === 'GET') return (await GH.llamar('getProyecto', { id })).proyecto;
      if (metodo === 'PUT') return GH.llamar('putProyecto', { id, datos: cuerpo }, true);
      if (metodo === 'DELETE') return GH.llamar('deleteProyecto', { id }, true);
    }
    if (ruta === '/api/empresas') return (await GH.llamar('getEmpresas')).empresas;
    if (ruta === '/api/carpetas') return GH.llamar('listarCarpeta', { ruta: u.searchParams.get('ruta') || '' });
    if (ruta === '/api/guardar') return GH.llamar('guardarArchivo', cuerpo, true);
    if (ruta === '/api/revelar') {                       // en la web: abrir la carpeta en Drive
      const dir = /\.(xlsx|docx|pdf)$/i.test(cuerpo.ruta) ? cuerpo.ruta.split('/').slice(0, -1).join('/') : cuerpo.ruta;
      const w = window.open('', '_blank');
      try { const r = await GH.llamar('listarCarpeta', { ruta: dir }); w.location = r.url; w.opener = null; }
      catch (e) { w.close(); throw e; }
      return { ok: true };
    }
    throw new Error('ruta desconocida');
  }

  function aviso(msg, opts) {
    opts = opts || {};
    const el = $('#aviso');
    el.className = 'aviso' + (opts.error ? ' error' : '');
    el.innerHTML = `<span>${esc(msg)}</span>` + (opts.accion ? `<button class="btn chico tenue" id="aviso-acc">${esc(opts.accion.t)}</button>` : '');
    el.hidden = false;
    if (opts.accion) $('#aviso-acc').onclick = opts.accion.fn;
    clearTimeout(aviso.t);
    aviso.t = setTimeout(() => { el.hidden = true; }, opts.ms || (opts.accion ? 9000 : 3800));
  }

  /* ------------------------------------------------------------ guardado automático */
  let tGuardar = null;
  function cambio() {
    if (!S.p) return;
    S.guardado = 'pendiente'; pintarEstado();
    clearTimeout(tGuardar);
    tGuardar = setTimeout(guardarYa, 700);
  }
  let colaGuardar = Promise.resolve();                    // un guardado a la vez, en orden
  async function guardarYa() {
    clearTimeout(tGuardar);
    if (!S.p) return;
    S.guardado = 'guardando'; pintarEstado();
    try {
      const pr = S.p;
      if (pr.tipo !== 'reba') {
        const av = pr.puestos.map(pu => EVAL.calcularPuesto(pu).avance);
        pr.avance = { hechos: av.reduce((a, x) => a + x.hechos, 0), total: av.reduce((a, x) => a + x.total, 0) };
      }
      const r = await (colaGuardar = colaGuardar.then(() => api('PUT', '/api/proyectos/' + pr.id, pr)));
      pr.modificado = r.modificado;
      S.guardado = 'ok';
    } catch (e) {
      S.guardado = 'error'; aviso('No se pudo guardar: ' + e.message, { error: true });
    }
    pintarEstado();
  }
  function pintarEstado() {
    const el = $('#estado');
    if (!S.p) { el.innerHTML = ''; return; }
    const t = { ok: 'Guardado', pendiente: 'Cambios sin guardar', guardando: 'Guardando…', error: 'Error al guardar' }[S.guardado];
    el.className = 'estado ' + (S.guardado === 'ok' ? '' : S.guardado === 'error' ? 'error' : 'guardando');
    el.innerHTML = `<span class="punto"></span>${t}`;
  }
  window.addEventListener('beforeunload', e => { if (S.guardado === 'pendiente' || S.guardado === 'guardando') { guardarYa(); e.preventDefault(); e.returnValue = ''; } });

  /* ------------------------------------------------------------ modelo */
  function puestoNuevo(nombre, area) {
    return {
      id: uid('pu'), nombre: nombre || '', area: area || '', descripcion: '', nTrabajadores: '', procEscrito: '', capacitacion: '',
      trabajadores: '', manifestacion: 'NO', ubicacionSintoma: '', tareas: [{ nombre: '' }, { nombre: '' }, { nombre: '' }],
      p1: {}, p2: {}, reba: [], p3: { generales: ['', '', ''], medidas: [], observaciones: '', fecha: '' }, fotos: [], escaneos: []
    };
  }
  const puesto = id => (S.p && S.p.puestos || []).find(p => p.id === id);
  function rutaActual() { return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean); }
  function puestoActual() { const r = rutaActual(); return r[0] === 'p' && r[2] === 'puesto' ? puesto(r[3]) : (r[0] === 'reba' && S.p ? S.p.puestos[0] : null); }
  function examenActual() {
    const pu = puestoActual(); if (!pu) return null;
    const id = S.exSel[pu.id];
    return pu.reba.find(e => e.id === id) || pu.reba[0] || null;
  }

  /* ------------------------------------------------------------ enlaces de datos */
  function raiz(n) { return n === 'p' ? S.p : n === 'pu' ? puestoActual() : n === 'ex' ? examenActual() : n === 'nuevo' ? S.nuevo : null; }
  function setRuta(ruta, valor) {
    const ks = ruta.split('.');
    let o = raiz(ks.shift());
    if (!o) return;
    ks.slice(0, -1).forEach((k, i) => { if (o[k] == null) o[k] = /^\d+$/.test(ks[i + 1]) ? [] : {}; o = o[k]; });
    o[ks[ks.length - 1]] = valor;
  }
  function getRuta(ruta) {
    const ks = ruta.split('.');
    let o = raiz(ks.shift());
    for (const k of ks) { if (o == null) return undefined; o = o[k]; }
    return o;
  }
  const val = (ruta) => esc(getRuta(ruta) == null ? '' : getRuta(ruta));
  const inp = (ruta, ph, extra) => `<input data-bind="${ruta}" value="${val(ruta)}" placeholder="${esc(ph || '')}" ${extra || ''}>`;
  const campo = (lbl, html, cls) => `<label class="campo ${cls || ''}"><span>${lbl}</span>${html}</label>`;
  const segSN = (act, attrs, v, ops) => `<div class="seg">${(ops || ['SI', 'NO']).map(o => `<button type="button" class="${v === o ? 'on' : ''} ${o === 'SI' || o === 'S' ? 'si' : 'no'}" data-act="${act}" ${attrs} data-v="${o}">${o === 'S' ? 'Sí' : o === 'N' ? 'No' : o === 'SI' ? 'Sí' : o === 'NO' ? 'No' : o}</button>`).join('')}</div>`;

  document.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.bind) {
      let v = el.value;
      if (el.type === 'number' || el.dataset.num) v = el.value === '' ? '' : Number(el.value);
      if (el.type === 'checkbox') v = el.checked;
      setRuta(el.dataset.bind, v);
      cambio();
      if (el.dataset.live) vivos[el.dataset.live] && vivos[el.dataset.live](el);
    }
    if (el.dataset.ang) cambiarAngulo(el);
  });
  document.addEventListener('change', e => {
    const el = e.target;
    if (el.dataset.bind && el.dataset.rerender != null) render();
    if (el.dataset.archivo) cargarArchivos(el);
  });
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = ACT[el.dataset.act];
    if (!fn) return;
    e.preventDefault();
    Promise.resolve().then(() => fn(el, e)).catch(err => { console.error(err); aviso(err.message || String(err), { error: true }); });
  });
  const vivos = {
    nav: () => pintarLateral(),
    reba: () => refrescarReba(),
    titulo: () => pintarMigas()
  };

  /* ------------------------------------------------------------ imágenes */
  function leerImagen(file, max, calidad) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onerror = () => rej(new Error('No se pudo leer ' + file.name));
      fr.onload = () => {
        const im = new Image();
        im.onerror = () => rej(new Error(file.name + ' no es una imagen'));
        im.onload = () => {
          const k = Math.min(1, (max || 1800) / Math.max(im.width, im.height));
          const c = document.createElement('canvas');
          c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          const g = c.getContext('2d');
          const png = /png/i.test(file.type) && max <= 800;
          if (!png) { g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); }
          g.drawImage(im, 0, 0, c.width, c.height);
          res(c.toDataURL(png ? 'image/png' : 'image/jpeg', calidad || 0.84));
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  async function cargarArchivos(el) {
    const files = [...el.files];
    if (!files.length) return;
    const destino = el.dataset.archivo;
    const imgs = [];
    for (const f of files) imgs.push(await leerImagen(f, destino === 'firma' ? 700 : destino === 'escaneos' ? 2200 : 1800, destino === 'escaneos' ? 0.8 : 0.84));
    const pu = puestoActual();
    if (destino === 'fotos') pu.fotos.push(...imgs);
    else if (destino === 'escaneos') pu.escaneos.push(...imgs);
    else if (destino === 'portada') S.p.portada = imgs[0];
    else if (destino === 'firma') S.p.profesional.firma = imgs[0];
    else if (destino === 'medir') { S.medir.img = imgs[0]; S.medir.pts = {}; S.medir.actual = 'oreja'; return pintarMedir(true); }
    el.value = '';
    cambio(); render();
  }
  const subir = (destino, multiple, label, cls) => `<label class="${cls || 'btn tenue'}">${label}<input type="file" accept="image/*" class="oculto" data-archivo="${destino}" ${multiple ? 'multiple' : ''}></label>`;

  /* ------------------------------------------------------------ navegación */
  window.addEventListener('hashchange', ir);
  async function ir() {
    const r = rutaActual();
    try {
      if (r[0] === 'p' && r[1]) await cargarProyecto(r[1]);
      else if (r[0] === 'reba') await cargarRapido();
      else { if (S.p && S.guardado !== 'ok') await guardarYa(); S.p = null; S.lista = null; }
    } catch (e) { aviso(e.message, { error: true }); location.hash = '#/'; return; }
    render();
    window.scrollTo({ top: 0 });
  }
  async function cargarProyecto(id) {
    if (S.p && S.p.id === id) return;
    if (S.p && S.guardado !== 'ok') await guardarYa();
    S.p = await api('GET', '/api/proyectos/' + id);
    S.guardado = 'ok';
  }
  async function cargarRapido() {
    if (S.p && S.p.id === RAPIDO) return;
    try { S.p = await api('GET', '/api/proyectos/' + RAPIDO); }
    catch (e) {
      const pu = puestoNuevo('REBA rápido', '');
      S.p = { id: RAPIDO, tipo: 'reba', titulo: 'REBA rápido', puestos: [pu] };
      await api('PUT', '/api/proyectos/' + RAPIDO, S.p);
    }
    S.guardado = 'ok';
  }

  function pintarMigas() {
    const r = rutaActual(), m = $('#migas');
    const sep = '<span class="sep">›</span>';
    let h = '';
    if (r[0] === 'p' && S.p) {
      h = sep + `<a href="#/p/${S.p.id}">${esc(S.p.titulo || 'Informe')}</a>`;
      if (r[2] === 'puesto') { const pu = puesto(r[3]); if (pu) h += sep + `<b>${esc(pu.nombre || 'Puesto')}</b>`; }
      if (r[2] === 'resumen') h += sep + '<b>Resumen</b>';
      if (r[2] === 'exportar') h += sep + '<b>Exportar</b>';
    } else if (r[0] === 'reba') h = sep + '<b>REBA rápido</b>';
    m.innerHTML = h;
  }

  function render() {
    pintarMigas(); pintarEstado();
    const r = rutaActual();
    if (r[0] === 'p' && S.p) return vistaInforme(r);
    if (r[0] === 'reba' && S.p) return vistaRapido();
    return vistaInicio();
  }

  /* ============================================================ INICIO */
  async function vistaInicio() {
    if (!S.lista) {
      app.innerHTML = '<div class="vacio">Cargando…</div>';
      try { S.lista = (await api('GET', '/api/proyectos')).filter(p => p.tipo !== 'reba'); }
      catch (e) { app.innerHTML = `<div class="vacio">No se pudo leer la lista de informes (${esc(e.message)}). Recargá la página para reintentar.</div>`; return; }
    }
    const tarjetas = S.lista.map(p => {
      const av = p.avance && p.avance.total ? Math.round(100 * p.avance.hechos / p.avance.total) : 0;
      const nv = p.rebaMax ? REBA.nivelDe(p.rebaMax) : null;
      return `<div class="informe" data-act="ir" data-href="#/p/${esc(p.id)}" tabindex="0">
        <button class="btn icono plano borrar" data-act="borrarInforme" data-id="${esc(p.id)}" title="Mover a la papelera">${I.basura}</button>
        <div class="mayus">${esc(p.empresa || '—')}</div>
        <div class="titulo-3">${esc(p.titulo)}</div>
        <div class="nota">${p.fecha ? esc(fechaLarga(p.fecha)) : 'Sin fecha'} · ${p.puestos} puesto${p.puestos === 1 ? '' : 's'} · ${p.examenes} REBA</div>
        <div class="barra-avance" title="Avance ${av}%"><i style="width:${av}%"></i></div>
        <div class="pie"><span class="mini">${av}% completo</span>${nv ? `<span class="chip ${nv.color}">REBA máx. ${p.rebaMax} · ${nv.riesgo}</span>` : ''}</div>
      </div>`;
    }).join('');
    app.innerHTML = `
      <div class="hero"><div>
        <div class="mayus">GH Mediciones</div>
        <h1 class="titulo-grande">Ergonomía</h1>
        <div class="sub">Protocolo Res. SRT 886/15 y método REBA: del relevamiento al informe en Word y Excel.</div>
      </div></div>
      <div class="acciones-inicio">
        <button class="accion" data-act="nuevoInforme"><span class="ic">${I.doc}</span><span><span class="titulo-3">Nuevo informe</span><br><span class="nota">Empresa, cantidad de puestos y a evaluar cada uno.</span></span></button>
        <button class="accion" data-act="ir" data-href="#/reba"><span class="ic">${I.persona}</span><span><span class="titulo-3">REBA rápido</span><br><span class="nota">Un examen suelto, con su Excel igual al original.</span></span></button>
      </div>
      <div class="encab"><h2 class="titulo-2">Informes</h2><span class="nota">${S.lista.length} en total</span></div>
      ${S.lista.length ? `<div class="lista-informes">${tarjetas}</div>` : `<div class="vacio card">Todavía no hay informes. Empezá con <b>Nuevo informe</b>.</div>`}`;
  }

  /* ------------------------------------------------------------ nuevo informe */
  async function abrirNuevo() {
    if (!S.empresas.length) S.empresas = await api('GET', '/api/empresas').catch(() => []);
    let prof = {};
    try { prof = JSON.parse(localStorage.getItem('gh-ergo-profesional') || '{}'); } catch (e) { /* sin preferencia guardada */ }
    S.nuevo = {
      empresa: { razonSocial: '', cuit: '', ciiu: '', direccion: '', provincia: 'San Juan', establecimiento: '' },
      fecha: hoyISO(), titulo: '', profesional: { nombre: prof.nombre || '', titulo: prof.titulo || 'Ing.', matricula: prof.matricula || '' },
      cantidad: 3, puestos: [{ area: '', nombre: '' }, { area: '', nombre: '' }, { area: '', nombre: '' }]
    };
    pintarNuevo();
  }
  function pintarNuevo() {
    const n = S.nuevo;
    while (n.puestos.length < n.cantidad) n.puestos.push({ area: n.puestos.length ? n.puestos[n.puestos.length - 1].area : '', nombre: '' });
    n.puestos.length = n.cantidad;
    const filas = n.puestos.map((p, i) => `<div class="fila" style="padding:8px 0;gap:10px">
        <span class="nav-item" style="width:auto;padding:0;min-height:0"><span class="n">${i + 1}</span></span>
        <input data-bind="nuevo.puestos.${i}.area" value="${esc(p.area)}" placeholder="Área o sector" style="flex:1">
        <input data-bind="nuevo.puestos.${i}.nombre" value="${esc(p.nombre)}" placeholder="Puesto (ej. Soldador)" style="flex:1.3">
      </div>`).join('');
    abrirCapa(`<div class="hoja">
      <div class="hoja-cab"><h2>Nuevo informe</h2><button class="btn icono" data-act="cerrarCapa" title="Cerrar">${I.cerrar}</button></div>
      <div class="hoja-cuerpo">
        <div class="mayus" style="margin:6px 4px 8px">Empresa</div>
        <div class="card"><div class="campos">
          ${campo('Razón social', `<input data-bind="nuevo.empresa.razonSocial" list="lista-empresas" value="${esc(n.empresa.razonSocial)}" placeholder="Ej. Razón social S.A." data-live="empresa">`, 'ancho')}
          <datalist id="lista-empresas">${S.empresas.map(e => `<option value="${esc(e.razonSocial)}">`).join('')}</datalist>
          ${campo('C.U.I.T.', inp('nuevo.empresa.cuit', '30-00000000-0'))}
          ${campo('CIIU', inp('nuevo.empresa.ciiu', ''))}
          ${campo('Dirección del establecimiento', inp('nuevo.empresa.direccion', 'Calle 123, departamento'), 'ancho')}
          ${campo('Provincia', inp('nuevo.empresa.provincia', 'San Juan'))}
          ${campo('Lugar evaluado (para la introducción)', inp('nuevo.empresa.establecimiento', 'Ej. Planta industrial, departamento'))}
        </div></div>
        <div class="mayus" style="margin:18px 4px 8px">Informe</div>
        <div class="card"><div class="campos">
          ${campo('Título en la portada', inp('nuevo.titulo', 'Ej. EMPRESA - SITIO'))}
          ${campo('Fecha de la evaluación', `<input type="date" data-bind="nuevo.fecha" value="${esc(n.fecha)}">`)}
          ${campo('Profesional', `<div style="display:flex;gap:8px"><input data-bind="nuevo.profesional.titulo" value="${esc(n.profesional.titulo)}" style="width:70px" placeholder="Ing."><input data-bind="nuevo.profesional.nombre" value="${esc(n.profesional.nombre)}" placeholder="Nombre y apellido"></div>`)}
          ${campo('Matrícula', inp('nuevo.profesional.matricula', 'Ej. M.P. 0000'))}
        </div></div>
        <div class="encab" style="margin-top:20px"><div class="mayus">Puestos de trabajo</div>
          <div style="display:flex;align-items:center;gap:8px"><span class="nota">Cantidad</span>
            <button class="btn icono" data-act="cantPuestos" data-d="-1">−</button><b style="min-width:24px;text-align:center;font-size:17px">${n.cantidad}</b><button class="btn icono" data-act="cantPuestos" data-d="1">${I.mas}</button></div></div>
        <div class="card" style="padding:6px 16px">${filas}</div>
        <p class="nota" style="margin:10px 4px 0">Después podés agregar, quitar o renombrar puestos. Cada puesto trae sus planillas 1 a 4 y sus exámenes REBA.</p>
      </div>
      <div class="hoja-pie"><button class="btn" data-act="cerrarCapa">Cancelar</button><button class="btn lleno" data-act="crearInforme">Crear informe</button></div>
    </div>`);
  }
  vivos.empresa = el => {
    const e = S.empresas.find(x => x.razonSocial.toLowerCase() === el.value.trim().toLowerCase());
    if (!e) return;
    Object.assign(S.nuevo.empresa, e);
    if (!S.nuevo.titulo) S.nuevo.titulo = (e.razonSocial.replace(/\s+(S\.?A\.?|S\.?R\.?L\.?|S\.?A\.?S\.?)$/i, '') + (e.establecimiento ? ' - ' + e.establecimiento.split(',')[0].replace(/^Mina\s+/i, '') : '')).toUpperCase();
    pintarNuevo();
  };

  function abrirCapa(html) { const c = $('#capa'); c.innerHTML = html; c.hidden = false; const f = $('input,select,textarea', c); if (f) setTimeout(() => f.focus(), 60); }
  function cerrarCapa() { const c = $('#capa'); c.hidden = true; c.innerHTML = ''; S.nuevo = null; S.medir = null; }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#capa').hidden) cerrarCapa(); });
  $('#capa').addEventListener('mousedown', e => { if (e.target.id === 'capa') cerrarCapa(); });

  /* ============================================================ INFORME */
  function vistaInforme(r) {
    const sub = r[2] || 'datos';
    let cuerpo = '';
    if (sub === 'puesto') { const pu = puesto(r[3]); cuerpo = pu ? vistaPuesto(pu) : '<div class="vacio">Ese puesto ya no existe.</div>'; }
    else if (sub === 'resumen') cuerpo = vistaResumen();
    else if (sub === 'exportar') cuerpo = vistaExportar();
    else cuerpo = vistaDatos();
    app.innerHTML = `<div class="layout"><aside class="lateral" id="lateral"></aside><section id="contenido">${cuerpo}</section></div>`;
    pintarLateral();
    if (sub === 'puesto' && (S.tab[r[3]] || 'ident') === 'reba') pintarFigura();
  }

  function anillo(h, t) {
    const f = t ? h / t : 0, R = 8, C = 2 * Math.PI * R;
    return `<svg class="anillo" viewBox="0 0 20 20"><circle cx="10" cy="10" r="${R}" fill="none" stroke="var(--gray-5)" stroke-width="3"/><circle cx="10" cy="10" r="${R}" fill="none" stroke="${f >= 1 ? 'var(--green)' : 'var(--accent)'}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${(C * f).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 10 10)"/></svg>`;
  }
  function pintarLateral() {
    const el = $('#lateral'); if (!el || !S.p) return;
    const r = rutaActual(), sub = r[2] || 'datos', base = '#/p/' + S.p.id;
    const items = S.p.puestos.map((pu, i) => {
      const c = EVAL.calcularPuesto(pu), nv = c.reba.max ? REBA.nivelDe(c.reba.max) : null;
      return `<button class="nav-item ${sub === 'puesto' && r[3] === pu.id ? 'on' : ''}" data-act="ir" data-href="${base}/puesto/${pu.id}">
        <span class="n">${i + 1}</span><span class="txt">${esc(pu.nombre || 'Sin nombre')}</span>
        ${nv ? `<span class="chip ${nv.color}" title="REBA máximo">${c.reba.max}</span>` : ''}${anillo(c.avance.hechos, c.avance.total)}</button>`;
    }).join('');
    el.innerHTML = `<h2>${esc(S.p.titulo || 'Informe')}</h2><div class="sub">${esc((S.p.empresa || {}).razonSocial || '')}${S.p.fecha ? ' · ' + fechaAR(S.p.fecha) : ''}</div>
      <button class="nav-item ${sub === 'datos' ? 'on' : ''}" data-act="ir" data-href="${base}"><span class="n">${I.lapiz.replace('<svg', '<svg width="13" height="13"')}</span><span class="txt">Datos del informe</span></button>
      <div class="encab nav-titulo" style="margin:16px 10px 6px"><span class="mayus">Puestos · ${S.p.puestos.length}</span><button class="btn icono plano" data-act="agregarPuesto" title="Agregar puesto">${I.mas}</button></div>
      ${items}
      <div class="nav-sep"></div>
      <button class="nav-item ${sub === 'resumen' ? 'on' : ''}" data-act="ir" data-href="${base}/resumen"><span class="n">${I.grafico.replace('<svg', '<svg width="13" height="13"')}</span><span class="txt">Resumen de riesgos</span></button>
      <button class="nav-item ${sub === 'exportar' ? 'on' : ''}" data-act="ir" data-href="${base}/exportar"><span class="n">${I.salida.replace('<svg', '<svg width="13" height="13"')}</span><span class="txt">Exportar Word y Excel</span></button>`;
  }

  /* ------------------------------------------------------------ datos generales */
  function vistaDatos() {
    const p = S.p;
    p.profesional = p.profesional || {};
    const intro = textoIntro(p);
    return `<div class="encab"><h1 class="titulo-1">Datos del informe</h1></div>
      <div class="card"><div class="titulo-3" style="margin-bottom:12px">Empresa</div><div class="campos">
        ${campo('Razón social', inp('p.empresa.razonSocial', '', 'data-live="nav"'), 'ancho')}
        ${campo('C.U.I.T.', inp('p.empresa.cuit'))}${campo('CIIU', inp('p.empresa.ciiu'))}
        ${campo('Dirección del establecimiento', inp('p.empresa.direccion'), 'ancho')}
        ${campo('Provincia', inp('p.empresa.provincia'))}
        ${campo('Lugar evaluado', inp('p.empresa.establecimiento', 'Ej. Planta industrial, departamento'))}
      </div></div>
      <div class="card"><div class="titulo-3" style="margin-bottom:12px">Informe</div><div class="campos">
        ${campo('Título en la portada', inp('p.titulo', '', 'data-live="titulo"'))}
        ${campo('Fecha de la evaluación', `<input type="date" data-bind="p.fecha" value="${val('p.fecha')}" data-rerender>`)}
        ${campo('Foto de portada', `<div class="fotos">${p.portada ? `<div class="ft" style="background-image:url(${p.portada})"><button data-act="quitarPortada" title="Quitar">${I.cerrar}</button></div>` : ''}${subir('portada', false, p.portada ? 'Cambiar' : '+ Foto', 'agregar')}</div>`, 'ancho')}
        ${campo('Introducción', `<textarea data-bind="p.textos.intro" placeholder="${esc(intro)}" rows="4">${val('p.textos.intro')}</textarea><span class="mini">Si lo dejás vacío se usa el texto de ejemplo (gris), armado con la empresa, el lugar y la fecha.</span>`, 'ancho')}
      </div></div>
      <div class="card"><div class="titulo-3" style="margin-bottom:12px">Profesional</div><div class="campos">
        ${campo('Título', inp('p.profesional.titulo', 'Ing.'))}
        ${campo('Nombre y apellido', inp('p.profesional.nombre'))}
        ${campo('Matrícula', inp('p.profesional.matricula'))}
        ${campo('Firma escaneada (PNG o JPG)', `<div class="destino">${p.profesional.firma ? `<img class="firma-img" src="${p.profesional.firma}" alt="Firma"><button class="btn chico peligro" data-act="quitarFirma">Quitar</button>` : ''}${subir('firma', false, p.profesional.firma ? 'Cambiar' : 'Subir firma', 'btn tenue chico')}</div><span class="mini">Va al pie de cada sección del informe Word.</span>`, 'ancho')}
      </div></div>`;
  }
  function textoIntro(p) {
    const e = p.empresa || {};
    return 'El presente informe contiene los resultados del análisis ergonómico, realizado el ' + (fechaLarga(p.fecha) || '___') +
      ', en los distintos puestos de trabajo realizados por la empresa ' + (e.razonSocial || '___') +
      (e.establecimiento ? ', en ' + e.establecimiento : '') + (e.provincia ? ' en la Provincia de ' + e.provincia : '') + '.';
  }

  /* ------------------------------------------------------------ puesto */
  const TABS = [['ident', 'Identificación', 'Planilla 1'], ['eval', 'Evaluación inicial', 'Planilla 2'], ['reba', 'Método REBA', 'Evaluación de riesgos'], ['medidas', 'Medidas', 'Planillas 3 y 4']];
  function vistaPuesto(pu) {
    const tab = S.tab[pu.id] || 'ident';
    const c = EVAL.calcularPuesto(pu);
    const idx = S.p.puestos.indexOf(pu);
    const foto = pu.fotos[0];
    const tabs = TABS.map(([k, t, s], i) => `<button class="${tab === k ? 'on' : ''}" data-act="tab" data-t="${k}" title="${s}"><span class="ok ${c.avance.pasos[i] ? 'si' : ''}">${c.avance.pasos[i] ? I.check : ''}</span>${t}</button>`).join('');
    let cuerpo = '';
    if (tab === 'ident') cuerpo = tabIdent(pu, c);
    else if (tab === 'eval') cuerpo = tabEval(pu, c);
    else if (tab === 'reba') cuerpo = tabReba(pu);
    else cuerpo = tabMedidas(pu, c);
    const nivelP = c.nivelPuesto;
    return `<div class="cab-puesto">
        <label class="foto" style="${foto ? `background-image:url(${foto})` : ''}" title="Fotos del puesto">${foto ? '' : I.camara}<input type="file" accept="image/*" multiple class="oculto" data-archivo="fotos"></label>
        <div class="datos">
          <input class="nombre" data-bind="pu.nombre" value="${val('pu.nombre')}" placeholder="Nombre del puesto" data-live="nav">
          <div class="linea">
            <input data-bind="pu.area" value="${val('pu.area')}" placeholder="Área o sector">
            <span data-nivelp>${chipNivel(nivelP)}</span>
            <span style="flex:1"></span>
            <button class="btn icono plano" data-act="moverPuesto" data-d="-1" ${idx === 0 ? 'disabled' : ''} title="Subir">${I.arriba}</button>
            <button class="btn icono plano" data-act="moverPuesto" data-d="1" ${idx === S.p.puestos.length - 1 ? 'disabled' : ''} title="Bajar">${I.abajo}</button>
            <button class="btn icono plano" data-act="duplicarPuesto" title="Duplicar puesto">${I.copiar}</button>
            <button class="btn icono peligro" data-act="borrarPuesto" title="Eliminar puesto">${I.basura}</button>
          </div>
        </div>
      </div>
      <div class="tabs">${tabs}</div>
      ${cuerpo}`;
  }

  const chipNivel = n => n ? `<span class="chip ${['', 'verde', 'amarillo', 'rojo'][n]}">Nivel de riesgo ${n} · ${['', 'Tolerable', 'Moderado', 'No tolerable'][n]}</span>` : '';

  // ---- Planilla 1
  function tabIdent(pu, c) {
    const tareasOk = [0, 1, 2].map(t => !!(pu.tareas[t] && pu.tareas[t].nombre));
    const filas = P886.FACTORES.map(f => {
      const d = pu.p1[f.id] || {}, res = c.p1[f.id];
      const marcas = [0, 1, 2].map(t => `<td><button class="marca-x ${(d.tareas || [])[t] ? 'on' : ''}" data-act="marcaP1" data-f="${f.id}" data-t="${t}" ${tareasOk[t] ? '' : 'disabled'} title="${tareasOk[t] ? 'Presente en la tarea ' + (t + 1) : 'Escribí primero la tarea ' + (t + 1)}">${I.check}</button></td>`).join('');
      const niveles = [0, 1, 2].map(t => {
        const n = res.niveles[t], manual = (d.nivel || [])[t] != null;
        return `<td><button class="nivel ${n ? 'n' + n : ''} ${manual ? 'manual' : ''}" data-act="nivelP1" data-f="${f.id}" data-t="${t}" ${tareasOk[t] ? '' : 'disabled'} title="${manual ? 'Valor manual (tocá para cambiar)' : 'Automático según Planilla 2 y REBA (tocá para fijarlo a mano)'}">${n || (tareasOk[t] ? '–' : '')}</button></td>`;
      }).join('');
      const est = EVAL.ESTADOS[res.resultado.estado];
      return `<tr><td><span class="letra">${f.id}</span>${f.nombre}</td>${marcas}
        <td><input class="tiempo" data-bind="pu.p1.${f.id}.tiempo" value="${val('pu.p1.' + f.id + '.tiempo')}" placeholder="—"></td>${niveles}
        <td style="text-align:left"><span class="chip ${est.c}">${est.t}</span></td></tr>`;
    }).join('');
    return `${avisos(c)}<div class="card"><div class="titulo-3" style="margin-bottom:12px">Datos del puesto</div><div class="campos">
        ${campo('N° de trabajadores', `<input type="number" min="0" data-bind="pu.nTrabajadores" value="${val('pu.nTrabajadores')}">`)}
        ${campo('Procedimiento de trabajo escrito', segSN('sn', 'data-k="procEscrito"', pu.procEscrito))}
        ${campo('Capacitación', segSN('sn', 'data-k="capacitacion"', pu.capacitacion))}
        ${campo('Manifestación temprana', segSN('sn', 'data-k="manifestacion"', pu.manifestacion))}
        ${campo('Ubicación del síntoma', inp('pu.ubicacionSintoma', 'Ej. zona lumbar'))}
        ${campo('Nombre del trabajador/es', inp('pu.trabajadores', 'Opcional'), 'ancho')}
        ${campo('Descripción para el informe', inp('pu.descripcion', 'Ej. Operador de compactador'), 'ancho')}
      </div></div>
      <div class="card"><div class="titulo-3" style="margin-bottom:4px">Tareas habituales del puesto</div>
        <p class="nota" style="margin:0 0 12px">Hasta 3 por planilla, en orden cronológico del ciclo de trabajo.</p>
        <div class="tareas">${[0, 1, 2].map(t => campo(`<b>${t + 1}</b>Tarea ${t + 1}`, `<input data-bind="pu.tareas.${t}.nombre" value="${val('pu.tareas.' + t + '.nombre')}" placeholder="${t === 0 ? 'Ej. Operación de equipo compactador' : 'Opcional'}" data-rerender>`)).join('')}</div>
      </div>
      <div class="card"><div class="encab" style="margin:0 0 6px"><div class="titulo-3">Factores de riesgo · Planilla 1</div><span class="nota">Marcá en qué tarea aparece cada factor. El nivel se calcula solo.</span></div>
        <div style="overflow-x:auto"><table class="matriz"><thead><tr><th>Factor de riesgo</th><th>T1</th><th>T2</th><th>T3</th><th>Tiempo de<br>exposición</th><th>Nivel<br>T1</th><th>Nivel<br>T2</th><th>Nivel<br>T3</th><th style="text-align:left">Planilla 2</th></tr></thead><tbody>${filas}</tbody></table></div>
        <p class="nota" style="margin:12px 0 0">Nivel 1 tolerable · 2 moderado · 3 no tolerable. Si la Planilla 2 pide evaluar, se usa el REBA de esa tarea (acción 0–1 → 1, 2 → 2, 3–4 → 3). Tocá un nivel para fijarlo a mano.</p>
      </div>
      <div class="card"><div class="titulo-3" style="margin-bottom:12px">Fotos del puesto</div>
        <div class="fotos">${pu.fotos.map((f, i) => `<div class="ft" style="background-image:url(${f})"><button data-act="quitarFoto" data-i="${i}" title="Quitar">${I.cerrar}</button></div>`).join('')}${subir('fotos', true, '+ Agregar', 'agregar')}</div>
        <p class="nota" style="margin:10px 0 0">La primera va en el informe. También sirven para medir ángulos en el REBA.</p>
      </div>`;
  }
  const avisos = c => c.avisos.length ? `<div class="avisos"><b>Para revisar</b><ul>${c.avisos.map(a => `<li>${esc(a)}</li>`).join('')}</ul></div>` : '';

  // ---- Planilla 2
  function tabEval(pu, c) {
    const factores = P886.FACTORES.map(f => {
      const res = c.p1[f.id], est = EVAL.ESTADOS[res.resultado.estado];
      const d = pu.p1[f.id] || {};
      const tareas = (d.tareas || []).map((x, i) => x ? i + 1 : null).filter(Boolean);
      const abierto = S.abiertos && S.abiertos[pu.id + f.id] != null ? S.abiertos[pu.id + f.id] : (res.presente || res.resultado.estado === 'pendiente' && false);
      const bloques = f.bloques.map(b => bloqueP2(pu, b)).join('');
      return `<details class="factor ${res.presente ? 'presente' : ''}" ${abierto ? 'open' : ''} data-fac="${pu.id + f.id}">
        <summary><span class="letra">${f.id}</span><span class="nom">${f.titulo.replace(/^2\.-?\s?[A-I]:?\s*/, '').replace(/^2\.[A-I]:\s*/, '')}</span>
          <span class="nota">${tareas.length ? 'Tarea ' + tareas.join(', ') : 'No identificado'}</span>
          <span class="chip ${est.c}">${est.t}</span><span class="chev">${I.chev.replace('<svg', '<svg width="16" height="16"')}</span></summary>
        <div class="cuerpo">${bloques}
          ${f.borg ? `<div class="borg"><b style="grid-column:1/-1;margin-bottom:4px">Escala de Borg</b>${P886.BORG.map(b => `<span>${b[0]}</span><b>${b[1]}</b>`).join('')}</div>` : ''}
          ${f.fanger ? `<img class="fanger" src="assets/fanger.png" alt="Curvas de confort de Fanger">` : ''}
        </div></details>`;
    }).join('');
    return `${avisos(c)}<div class="encab" style="margin-top:0"><p class="nota" style="margin:0">Las 9 planillas del Anexo I. Si el paso 1 da todo NO, el factor es tolerable; si algo da SI, se habilita el paso 2.</p>
      <button class="btn tenue chico" data-act="noFaltantes">${I.check}Paso 1 en NO para lo no identificado</button></div>${factores}`;
  }
  function bloqueP2(pu, b) {
    const r = pu.p2[b.id] || {}, res = EVAL.resultadoBloque(b, r), est = EVAL.ESTADOS[res.estado];
    const p1 = r.paso1 || [], p2 = r.paso2 || [];
    const algunSi = p1.some(v => v === 'SI');
    const critico = b.critico >= 0 && p1[b.critico] === 'SI';
    const preg = (lista, paso, resp) => lista.map((q, i) => `<div class="pregunta"><span class="num">${i + 1}</span><span class="txt">${esc(q[0])}</span>
      ${segSN('p2', `data-b="${b.id}" data-paso="${paso}" data-i="${i}"`, resp[i])}</div>`).join('');
    return `${b.subtitulo ? `<div class="titulo-3" style="margin:14px 0 2px">${esc(b.subtitulo)}</div>` : ''}
      <div class="paso"><h4>${esc(b.paso1Titulo)}</h4>${preg(b.paso1, 1, p1)}<div class="mini" style="margin-top:6px">${b.nota1.map(esc).join(' ')}</div></div>
      <div class="paso ${algunSi && !critico ? '' : 'apagado'}"><h4>Paso 2: Determinación del nivel de riesgo</h4>${preg(b.paso2, 2, p2)}
        <div class="mini" style="margin-top:6px">${esc(b.nota2 || P886.NOTA2)}${b.nota2extra ? ' ' + esc(b.nota2extra) : ''}</div></div>
      <div class="resultado"><span class="chip ${est.c}">${est.t}</span><span class="nota">${res.motivo ? esc(res.motivo) : res.estado === 'pendiente' ? 'Faltan respuestas del paso ' + res.paso : res.estado === 'evaluar' ? 'Corresponde la evaluación de riesgos (REBA).' : res.paso === 1 ? 'Todas las respuestas del paso 1 son NO.' : 'Todas las respuestas del paso 2 son NO.'}</span></div>`;
  }

  // ---- Medidas (Planillas 3 y 4)
  function tabMedidas(pu, c) {
    const m = pu.p3;
    const meds = m.medidas.map((x, i) => `<div class="medida"><span class="n">${i + 1}</span>
      <textarea data-bind="pu.p3.medidas.${i}.texto" rows="2" placeholder="Medida correctiva o preventiva">${val('pu.p3.medidas.' + i + '.texto')}</textarea>
      <div class="lado">${segSN('tipoMedida', `data-i="${i}"`, x.tipo || 'Adm', ['Adm', 'Ing'])}
        <input data-bind="pu.p3.medidas.${i}.obs" value="${val('pu.p3.medidas.' + i + '.obs')}" placeholder="Observaciones">
        <label class="mini">Implementación<input type="date" data-bind="pu.p3.medidas.${i}.fechaImpl" value="${val('pu.p3.medidas.' + i + '.fechaImpl')}"></label>
        <label class="mini">Cierre<input type="date" data-bind="pu.p3.medidas.${i}.fechaCierre" value="${val('pu.p3.medidas.' + i + '.fechaCierre')}"></label>
        <button class="btn chico plano" data-act="quitarMedida" data-i="${i}" style="grid-column:span 2;justify-self:end;color:var(--red-ink)">${I.basura}Quitar</button></div></div>`).join('');
    const rb = c.reba.max, nv = rb ? REBA.nivelDe(rb) : null;
    return `${avisos(c)}<div class="card"><div class="encab" style="margin:0 0 4px"><div class="titulo-3">Medidas preventivas generales</div>${campo('Fecha', `<input type="date" data-bind="pu.p3.fecha" value="${val('pu.p3.fecha')}" style="width:170px">`)}</div>
        ${P886.GENERALES.map((g, i) => `<div class="pregunta"><span class="num">${i + 1}</span><span class="txt">${esc(g)}</span>${segSN('general', `data-i="${i}"`, (m.generales || [])[i])}</div>`).join('')}
      </div>
      <div class="card"><div class="encab" style="margin:0 0 4px"><div class="titulo-3">Medidas específicas (administrativas y de ingeniería)</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn tenue chico" data-act="sugerirMedidas">${I.chispa}Sugerir según el nivel${c.nivelPuesto ? ' ' + c.nivelPuesto : ''}</button><button class="btn tenue chico" data-act="biblioteca">${I.libro}Biblioteca</button><button class="btn chico" data-act="agregarMedida">${I.mas}Agregar</button></div></div>
        ${meds || '<p class="nota">Sin medidas todavía. Usá <b>Sugerir</b> para cargar las que GH viene usando según el nivel de riesgo.</p>'}
      </div>
      <div class="card"><div class="encab" style="margin:0 0 8px"><div class="titulo-3">Observaciones</div><button class="btn tenue chico" data-act="obsSugerida">${I.chispa}Texto sugerido</button></div>
        <textarea data-bind="pu.p3.observaciones" rows="3" placeholder="${esc(P886.observacion(c.nivelPuesto || 1, nv && nv.riesgo))}">${val('pu.p3.observaciones')}</textarea>
      </div>
      <div class="card"><div class="titulo-3" style="margin-bottom:4px">Planillas firmadas escaneadas <span class="nota">(opcional)</span></div>
        <p class="nota" style="margin:0 0 12px">Si cargás las hojas firmadas por el empleador, el Word usa estas imágenes en lugar de las planillas digitales.</p>
        <div class="fotos">${pu.escaneos.map((f, i) => `<div class="ft" style="background-image:url(${f});background-position:top"><button data-act="quitarEscaneo" data-i="${i}" title="Quitar">${I.cerrar}</button></div>`).join('')}${subir('escaneos', true, '+ Hojas', 'agregar')}</div>
      </div>`;
  }

  /* ============================================================ REBA */
  function tabReba(pu, rapido) {
    const ex = examenActual();
    const chips = pu.reba.map(e => {
      const r = REBA.calcular(e);
      return `<button class="examen-chip ${ex && e.id === ex.id ? 'on' : ''}" data-act="selExamen" data-id="${e.id}"><span class="sc" data-chip="${e.id}">${r.completo ? r.reba : '…'}</span><span data-chipn="${e.id}">${esc(e.nombre || 'Examen')}</span></button>`;
    }).join('');
    const cab = `<div class="reba-cab"><div class="examenes">${chips}<button class="btn tenue chico" data-act="nuevoExamen">${I.mas}Nuevo examen</button></div></div>`;
    if (!ex) return cab + `<div class="card vacio"><div class="titulo-3" style="margin-bottom:6px">Sin exámenes REBA</div><p class="nota">Hacé uno por tarea o por la postura más exigente del puesto.</p><button class="btn lleno grande" data-act="nuevoExamen">${I.mas}Crear examen REBA</button></div>`;
    return cab + editorReba(ex, pu, rapido);
  }

  const ANG = { cuello: ['cuello', -45, 75], tronco: ['tronco', -40, 120], brazo: ['brazo', -60, 180], antebrazo: ['antebrazo', 0, 160], muneca: ['muneca', -70, 70], piernas: ['rodilla', 0, 150] };
  function editorReba(ex, pu, rapido) {
    const tareas = (pu.tareas || []).map((t, i) => t && t.nombre ? `<option value="${i}" ${ex.tarea === i ? 'selected' : ''}>Tarea ${i + 1}: ${esc(t.nombre)}</option>` : '').join('');
    const segA = ['cuello', 'piernas', 'tronco', 'carga'].map(k => segCard(ex, k)).join('');
    const segB = ['antebrazo', 'muneca', 'brazo', 'agarre'].map(k => segCard(ex, k)).join('');
    const act = REBA.ACTIVIDAD.map(a => `<div class="pregunta"><span class="txt">${esc(a.t)}</span>${segSN('actReba', `data-k="${a.k}"`, ex.act[a.k], ['S', 'N'])}</div>`).join('');
    return `<div class="card examen-datos"><div class="campos">
        ${campo('Nombre del examen', `<input data-bind="ex.nombre" value="${val('ex.nombre')}" data-live="reba" placeholder="Ej. Postura de soldadura en banco">`)}
        ${!rapido && tareas ? campo('Tarea', `<select data-bind="ex.tarea" data-num="1" data-rerender>${tareas}</select>`) : campo('Puesto / tarea', inp('ex.puestoLibre', 'Opcional', 'data-live="reba"'))}
        ${campo('Lado evaluado', segSN('lado', '', ex.lado || 'Derecho', ['Derecho', 'Izquierdo']))}</div>
        <div class="examen-acciones">
          <button class="btn tenue" data-act="medir" title="Medir ángulos sobre una foto">${I.regla}Medir sobre foto</button>
          ${ex.foto && ex.foto.img ? '<span class="chip acento">Ángulos medidos en foto</span>' : ''}
          <span style="flex:1"></span>
          <button class="btn chico" data-act="duplicarExamen" title="Duplicar examen">${I.copiar}Duplicar</button>
          <button class="btn chico peligro" data-act="borrarExamen" title="Eliminar examen">${I.basura}Eliminar</button>
        </div></div>
      <div class="reba">
        <div>
          <div class="reba-grupo">Grupo A · Cuello, piernas y tronco</div>${segA}
          <div class="reba-grupo">Grupo B · Brazos, antebrazos y muñecas</div>${segB}
          <div class="reba-grupo">Actividad muscular</div>
          <div class="seg-card actividad">${act}</div>
          <div class="seg-card">${campo('Notas del examen (van al informe)', `<textarea data-bind="ex.notas" rows="2" placeholder="Ej. Operario agachado para soldar piezas apoyadas en el piso.">${val('ex.notas')}</textarea>`)}</div>
        </div>
        <aside class="panel" id="panel-reba"></aside>
      </div>`;
  }

  function segCard(ex, k) {
    const D = REBA.SEGMENTOS[k], s = ex.seg[k], P = REBA.puntajes(ex);
    const ang = ANG[k];
    let extra = '';
    if (k === 'piernas') {
      extra = `<div class="mini" style="margin:12px 0 6px;font-weight:600">Flexión de rodillas</div><div class="opciones" data-rod>${opsRod(ex)}</div>
        <div class="correcciones"><button class="corr ${s.sentado ? 'on' : ''}" data-act="corrReba" data-k="piernas" data-c="sentado">Postura sedente (no suma rodillas)</button></div>`;
    }
    const corr = D.corr ? `<div class="correcciones" data-corr="${k}">${opsCorr(ex, k)}</div>` : '';
    let slider = '';
    if (ang) {
      const v = ex.ang[ang[0]], tiene = typeof v === 'number';
      slider = `<div class="angulo ${tiene ? '' : 'sin'}" data-angwrap="${ang[0]}"><span>Ángulo${k === 'piernas' ? ' de rodilla' : ''}</span>
        <input type="range" min="${ang[1]}" max="${ang[2]}" step="1" value="${tiene ? v : (k === 'piernas' ? 0 : 0)}" data-ang="${ang[0]}" aria-label="Ángulo de ${D.nombre}">
        <output data-angout="${ang[0]}">${tiene ? v + 'º' : 'sin medir'}</output>
        <button class="btn icono plano" data-act="borrarAngulo" data-a="${ang[0]}" title="Quitar el ángulo" ${tiene ? '' : 'hidden'}>${I.cerrar}</button></div>`;
    }
    return `<div class="seg-card" data-segcard="${k}"><div class="top"><h3>${D.nombre}</h3><span class="rango">puntuación ${D.rango}</span><div class="caja ${P[k] == null ? 'vacia' : ''}" data-caja="${k}">${P[k] == null ? '?' : P[k]}</div></div>
      <div class="opciones" data-ops="${k}">${opsSeg(ex, k)}</div>${extra}${corr}${slider}
      <details class="tabla-img"><summary>Ver tabla original</summary><img src="assets/reba/${D.img}.png" alt="Tabla ${D.nombre}"></details></div>`;
  }
  const opsSeg = (ex, k) => REBA.SEGMENTOS[k].ops.map(o => `<button class="op ${ex.seg[k].op === o.v ? 'on' : ''}" data-act="opReba" data-k="${k}" data-v="${o.v}"><span class="rad"></span><span>${esc(o.t)}</span><span class="pt">${o.p}</span></button>`).join('');
  const opsRod = ex => REBA.SEGMENTOS.piernas.rod.map(o => `<button class="op ${(ex.seg.piernas.rod || 0) === o.v ? 'on' : ''}" data-act="rodReba" data-v="${o.v}"><span class="rad"></span><span>${esc(o.t)}</span><span class="pt">+${o.p}</span></button>`).join('');
  const opsCorr = (ex, k) => REBA.SEGMENTOS[k].corr.map(c => `<button class="corr ${ex.seg[k][c.k] ? 'on' : ''}" data-act="corrReba" data-k="${k}" data-c="${c.k}">${c.p > 0 ? '+' : ''}${c.p} ${esc(c.t)}</button>`).join('');

  function pintarFigura() {
    const panel = $('#panel-reba'), ex = examenActual();
    if (!panel || !ex) return;
    const r = REBA.calcular(ex);
    const color = r.completo ? r.color : '';
    panel.innerHTML = `<div class="figura-card">${REBA.figuraSVG(ex)}
        <div class="leyenda"><span><i style="background:var(--green)"></i>mínimo</span><span><i style="background:var(--yellow)"></i>medio</span><span><i style="background:var(--orange)"></i>alto</span><span><i style="background:var(--red)"></i>máximo</span></div></div>
      <div class="resultado-reba ${color}">
        <div class="lbl">Puntuación final REBA</div>
        <div class="num">${r.completo ? r.reba : '—'}</div>
        ${r.completo ? `<div class="riesgo">Riesgo ${r.riesgo.toLowerCase()}</div><div class="act">${esc(r.actuacion)} · Nivel de acción ${r.accion}</div>` : `<div class="faltan">Faltan: ${esc(r.faltan.join(', '))}</div>`}
        <div class="cadena">
          <div><b>${r.A != null ? r.A : '–'}</b><span>Punt. A</span></div><div><b>${r.B != null ? r.B : '–'}</b><span>Punt. B</span></div>
          <div><b>${r.C != null ? r.C : '–'}</b><span>Tabla C</span></div><div><b>+${r.actividad}</b><span>Actividad</span></div>
        </div>
        ${r.completo ? `<div class="faltan">Res. 886/15: nivel de riesgo ${r.nivel886} (${['', 'tolerable', 'moderado', 'no tolerable'][r.nivel886]})</div>` : ''}
      </div>
      <button class="btn lleno grande" data-act="xlsReba" ${r.completo ? '' : 'disabled'}>${I.bajar}Excel REBA</button>
      <p class="mini" style="margin:0 6px">Mismo archivo que la planilla original: hoja de datos con los recuadros amarillos y hoja de nivel de riesgo, lista para copiar al informe.</p>`;
  }
  function refrescarReba() {
    const ex = examenActual(); if (!ex) return;
    const P = REBA.puntajes(ex);
    REBA.ORDEN.forEach(k => {
      const ops = $(`[data-ops="${k}"]`); if (ops) ops.innerHTML = opsSeg(ex, k);
      const caja = $(`[data-caja="${k}"]`); if (caja) { caja.textContent = P[k] == null ? '?' : P[k]; caja.classList.toggle('vacia', P[k] == null); }
      const cr = $(`[data-corr="${k}"]`); if (cr) cr.innerHTML = opsCorr(ex, k);
    });
    const rod = $('[data-rod]'); if (rod) rod.innerHTML = opsRod(ex);
    const r = REBA.calcular(ex);
    const chip = $(`[data-chip="${ex.id}"]`); if (chip) chip.textContent = r.completo ? r.reba : '…';
    const chn = $(`[data-chipn="${ex.id}"]`); if (chn) chn.textContent = ex.nombre || 'Examen';
    pintarFigura();
    pintarLateral();
    const np = $('[data-nivelp]'), pu = puestoActual();
    if (np && pu) np.innerHTML = chipNivel(EVAL.calcularPuesto(pu).nivelPuesto);
  }
  function cambiarAngulo(el) {
    const ex = examenActual(); if (!ex) return;
    const k = el.dataset.ang, v = Number(el.value);
    ex.ang[k] = v;
    REBA.opsDesdeAngulos({ ang: { [k]: v }, seg: ex.seg });
    const out = $(`[data-angout="${k}"]`); if (out) out.textContent = v + 'º';
    const w = $(`[data-angwrap="${k}"]`); if (w) { w.classList.remove('sin'); const b = $('button', w); if (b) b.hidden = false; }
    cambio(); refrescarReba();
  }

  /* ------------------------------------------------------------ medición sobre foto */
  function abrirMedir() {
    const ex = examenActual(), pu = puestoActual();
    const f = ex.foto || {};
    S.medir = { img: f.img || pu.fotos[0] || null, pts: Object.assign({}, f.pts || {}), mira: f.mira || 0, actual: null };
    S.medir.actual = (REBA.PUNTOS.find(p => !S.medir.pts[p.k]) || {}).k || null;
    pintarMedir();
  }
  function pintarMedir(soloLienzo) {
    const M = S.medir, pu = puestoActual();
    if (!soloLienzo || !$('#lienzo-medir')) {
      const miniaturas = pu.fotos.map((f, i) => `<button class="btn chico ${M.img === f ? 'tenue' : ''}" data-act="fotoMedir" data-i="${i}">Foto ${i + 1}</button>`).join('');
      abrirCapa(`<div class="hoja ancha"><div class="hoja-cab"><h2>Medir ángulos sobre la foto</h2><button class="btn icono" data-act="cerrarCapa">${I.cerrar}</button></div>
        <div class="hoja-cuerpo"><div class="destino" style="margin-bottom:12px">${miniaturas}${subir('medir', false, 'Usar otra imagen', 'btn chico tenue')}
          <span style="flex:1"></span><span class="nota">La persona mira hacia</span>${segSN('miraMedir', '', (M.mira || REBA.adivinarMira(M.pts)) === -1 ? '←' : '→', ['←', '→'])}</div>
          <div class="medir"><div class="lienzo" id="lienzo-medir">${M.img ? '<canvas id="cv-medir"></canvas>' : '<span class="nota" style="color:#ccc">Subí una foto lateral del trabajador</span>'}</div>
          <div><div class="mayus" style="margin-bottom:6px">Puntos (tocá para marcar)</div><div class="pasos-medir" id="pasos-medir"></div>
            <div class="mayus" style="margin:14px 0 6px">Ángulos medidos</div><div class="angs" id="angs-medir"></div>
            <p class="mini">Hacé clic en la foto para ubicar el punto activo; arrastrá un punto para corregirlo. Usá una foto de perfil, lo más perpendicular posible.</p></div></div></div>
        <div class="hoja-pie"><button class="btn" data-act="limpiarMedir">Borrar puntos</button><button class="btn lleno" data-act="aplicarMedir">Usar estos ángulos</button></div></div>`);
    }
    $('#pasos-medir').innerHTML = REBA.PUNTOS.map(p => `<button class="${M.actual === p.k ? 'on' : ''} ${M.pts[p.k] ? 'hecho' : ''}" data-act="puntoMedir" data-k="${p.k}"><i></i>${p.t}</button>`).join('');
    const mira = M.mira || REBA.adivinarMira(M.pts);
    const a = REBA.angulosDesdePuntos(M.pts, mira);
    const fila = (t, k) => `<span>${t}</span><b>${typeof a[k] === 'number' ? a[k] + 'º' : '—'}</b>`;
    $('#angs-medir').innerHTML = fila('Tronco', 'tronco') + fila('Cuello', 'cuello') + fila('Brazo', 'brazo') + fila('Antebrazo (flexión de codo)', 'antebrazo') + fila('Muñeca', 'muneca') + fila('Rodilla', 'rodilla');
    if (M.img) dibujarMedir();
  }
  let imgMedir = null;
  function dibujarMedir() {
    const M = S.medir, cv = $('#cv-medir'); if (!cv) return;
    if (!imgMedir || imgMedir.src !== M.img) {
      imgMedir = new Image(); imgMedir.onload = () => dibujarMedir(); imgMedir.src = M.img;
      if (!imgMedir.complete) return;
    }
    const im = imgMedir;
    const maxW = Math.min(860, ($('#lienzo-medir').clientWidth || 860)), maxH = window.innerHeight * 0.68;
    const k = Math.min(maxW / im.width, maxH / im.height);
    cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
    cv._k = k;
    const g = cv.getContext('2d');
    g.drawImage(im, 0, 0, cv.width, cv.height);
    dibujarEsqueleto(g, M.pts, k, M.mira || REBA.adivinarMira(M.pts), M.actual);
    if (!cv._eventos) instalarEventosMedir(cv);
  }
  function dibujarEsqueleto(g, pts, k, mira, activo) {
    const P = n => pts[n] ? [pts[n].x * k, pts[n].y * k] : null;
    const linea = (a, b, color, w) => { const A = P(a), B = P(b); if (!A || !B) return; g.strokeStyle = color; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke(); };
    const sc = Math.max(1, g.canvas.width / 700);
    const cad = P('cadera');
    if (cad) { g.setLineDash([6 * sc, 6 * sc]); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.5 * sc; g.beginPath(); g.moveTo(cad[0], cad[1]); g.lineTo(cad[0], cad[1] - 160 * sc); g.stroke(); g.setLineDash([]); }
    [['cadera', 'hombro', '#FF9F0A'], ['hombro', 'oreja', '#FFD60A'], ['hombro', 'codo', '#64D2FF'], ['codo', 'muneca', '#0A84FF'], ['muneca', 'nudillo', '#BF5AF2'], ['cadera', 'rodilla', '#30D158'], ['rodilla', 'tobillo', '#30D158']]
      .forEach(([a, b, c]) => { linea(a, b, 'rgba(0,0,0,.45)', 7 * sc); linea(a, b, c, 4 * sc); });
    const ang = REBA.angulosDesdePuntos(pts, mira);
    const rotulo = (n, txt) => { const p = P(n); if (!p || txt == null) return; g.font = `600 ${13 * sc}px -apple-system, sans-serif`; const w = g.measureText(txt).width + 10 * sc; g.fillStyle = 'rgba(0,0,0,.65)'; g.fillRect(p[0] + 10 * sc, p[1] - 22 * sc, w, 20 * sc); g.fillStyle = '#fff'; g.fillText(txt, p[0] + 15 * sc, p[1] - 7 * sc); };
    rotulo('hombro', ang.tronco != null ? 'tronco ' + ang.tronco + 'º' : null);
    rotulo('oreja', ang.cuello != null ? 'cuello ' + ang.cuello + 'º' : null);
    rotulo('codo', ang.brazo != null ? 'brazo ' + ang.brazo + 'º' + (ang.antebrazo != null ? ' · codo ' + ang.antebrazo + 'º' : '') : null);
    rotulo('rodilla', ang.rodilla != null ? 'rodilla ' + ang.rodilla + 'º' : null);
    rotulo('nudillo', ang.muneca != null ? 'muñeca ' + ang.muneca + 'º' : null);
    REBA.PUNTOS.forEach(p => {
      const q = P(p.k); if (!q) return;
      g.beginPath(); g.arc(q[0], q[1], (p.k === activo ? 8 : 6) * sc, 0, Math.PI * 2);
      g.fillStyle = '#fff'; g.fill(); g.lineWidth = 3 * sc; g.strokeStyle = p.k === activo ? '#6B9A1E' : '#111'; g.stroke();
    });
  }
  function instalarEventosMedir(cv) {
    cv._eventos = true;
    let arrastre = null;
    const pos = e => { const r = cv.getBoundingClientRect(); const k = cv._k * (r.width / cv.width); return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k, k }; };
    cv.addEventListener('pointerdown', e => {
      const M = S.medir, p = pos(e);
      const cerca = REBA.PUNTOS.find(q => M.pts[q.k] && Math.hypot(M.pts[q.k].x - p.x, M.pts[q.k].y - p.y) < 14 / p.k);
      if (cerca) { arrastre = cerca.k; M.actual = cerca.k; cv.setPointerCapture(e.pointerId); pintarMedir(true); return; }
      if (!M.actual) return;
      M.pts[M.actual] = { x: Math.round(p.x), y: Math.round(p.y) };
      M.actual = (REBA.PUNTOS.find(q => !M.pts[q.k]) || {}).k || null;
      pintarMedir(true);
    });
    cv.addEventListener('pointermove', e => { if (!arrastre) return; const p = pos(e); S.medir.pts[arrastre] = { x: Math.round(p.x), y: Math.round(p.y) }; pintarMedir(true); });
    cv.addEventListener('pointerup', () => { arrastre = null; });
  }
  // PNG de la foto con el esqueleto medido (para el informe Word).
  function fotoMedidaPNG(ex) {
    return new Promise(res => {
      if (!ex.foto || !ex.foto.img || !Object.keys(ex.foto.pts || {}).length) return res(null);
      const im = new Image();
      im.onload = () => {
        const k = Math.min(1, 1100 / Math.max(im.width, im.height));
        const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        const g = c.getContext('2d'); g.drawImage(im, 0, 0, c.width, c.height);
        dibujarEsqueleto(g, ex.foto.pts, k, ex.foto.mira || REBA.adivinarMira(ex.foto.pts), null);
        res(c.toDataURL('image/jpeg', 0.88));
      };
      im.onerror = () => res(null);
      im.src = ex.foto.img;
    });
  }
  window.addEventListener('resize', () => { if (S.medir && S.medir.img) dibujarMedir(); });

  /* ============================================================ RESUMEN */
  function vistaResumen() {
    const filas = S.p.puestos.map(pu => {
      const c = EVAL.calcularPuesto(pu);
      const celdas = P886.FACTORES.map(f => { const n = Math.max(0, ...c.p1[f.id].niveles.filter(Boolean)); return `<td class="${n ? 'n' + n : ''}">${n || '–'}</td>`; }).join('');
      const nv = c.reba.max ? REBA.nivelDe(c.reba.max) : null;
      return `<tr><td class="nombre"><a href="#/p/${S.p.id}/puesto/${pu.id}">${esc(pu.nombre || 'Sin nombre')}</a><div class="mini">${esc(pu.area || '')}</div></td>${celdas}
        <td class="rebac ${nv ? nv.color : ''}">${c.reba.max || '–'}</td><td class="${c.nivelPuesto ? 'n' + c.nivelPuesto : ''}">${c.nivelPuesto || '–'}</td></tr>`;
    }).join('');
    const exs = [];
    S.p.puestos.forEach(pu => pu.reba.forEach(ex => { const r = REBA.calcular(ex); exs.push({ pu, ex, r }); }));
    const filasEx = exs.map(({ pu, ex, r }) => `<div class="fila"><span style="flex:1.2"><b>${esc(pu.nombre)}</b><div class="mini">${esc(ex.nombre)}${pu.tareas[ex.tarea] && pu.tareas[ex.tarea].nombre && pu.tareas[ex.tarea].nombre !== ex.nombre ? ' · Tarea ' + (ex.tarea + 1) + ': ' + esc(pu.tareas[ex.tarea].nombre) : ''}</div></span>
      ${r.completo ? `<span class="chip ${r.color}">REBA ${r.reba} · ${r.riesgo}</span><span class="nota" style="flex:1">${esc(r.actuacion)}</span>` : `<span class="chip gris">Incompleto</span><span style="flex:1"></span>`}</div>`).join('');
    return `<div class="encab"><h1 class="titulo-1">Resumen de riesgos</h1></div>
      <div class="card" style="overflow-x:auto"><table class="heat"><thead><tr><th></th>${P886.FACTORES.map(f => `<th class="rot"><span>${f.id} · ${f.nombre}</span></th>`).join('')}<th class="rot"><span>REBA máximo</span></th><th class="rot"><span>Nivel del puesto</span></th></tr></thead><tbody>${filas}</tbody></table>
        <p class="nota" style="margin:12px 0 0">Nivel máximo de cada factor entre las tareas del puesto (Planilla 1). 1 tolerable · 2 moderado · 3 no tolerable.</p></div>
      <div class="encab"><h2 class="titulo-2">Exámenes REBA</h2><span class="nota">${exs.length}</span></div>
      <div class="grupo">${filasEx || '<div class="fila nota">Sin exámenes todavía.</div>'}</div>`;
  }

  /* ============================================================ EXPORTAR */
  function nombreArchivo(s) { return String(s || '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function anioInforme() { return (S.p.fecha || hoyISO()).slice(0, 4); }
  function vistaExportar() {
    const p = S.p;
    const dest = p.destino || 'descargas';
    const rebas = [];
    p.puestos.forEach(pu => pu.reba.forEach(ex => rebas.push({ pu, ex, r: REBA.calcular(ex) })));
    const conEscaneo = p.puestos.filter(pu => pu.escaneos.length).length;
    return `<div class="encab"><h1 class="titulo-1">Exportar</h1></div>
      <div class="card"><div class="encab" style="margin:0"><div><div class="titulo-3">Dónde guardar</div><div class="nota">Se recuerda para este informe.</div></div>
        ${segSN('destino', '', dest === 'drive' ? 'Carpeta del Drive' : 'Descargas', ['Descargas', 'Carpeta del Drive'])}</div>
        ${dest === 'drive' ? `<div class="destino" style="margin-top:12px"><span class="ruta">${p.carpeta ? '1. INFORMES / ' + esc(p.carpeta.split('/').join(' / ')) : 'Elegí la carpeta del informe'}</span><button class="btn tenue chico" data-act="elegirCarpeta">${I.carpeta}Elegir carpeta</button>${p.carpeta ? `<button class="btn plano chico" data-act="revelar" data-ruta="${esc(p.carpeta)}">Abrir en Drive</button>` : ''}</div>` : ''}
      </div>
      <div class="exportes" style="margin-top:16px">
        <div class="card export-card"><span class="ic word">${I.doc}</span><div><div class="titulo-3">Informe completo (Word)</div>
          <p class="nota" style="margin:4px 0 0">Portada, índice, marco legal y teórico, y por cada puesto: foto, planillas 1 a 4, análisis REBA con las tablas originales, medidas y observaciones. Cierra con un resumen de riesgos.</p></div>
          <label class="toggle"><input type="checkbox" data-bind="p.opciones.escaneos" ${p.opciones && p.opciones.escaneos === false ? '' : 'checked'}><i></i><span class="nota">Usar planillas escaneadas si las hay (${conEscaneo} puesto${conEscaneo === 1 ? '' : 's'})</span></label>
          <label class="toggle"><input type="checkbox" data-bind="p.opciones.fotoMedida" ${p.opciones && p.opciones.fotoMedida === false ? '' : 'checked'}><i></i><span class="nota">Incluir la foto con los ángulos medidos</span></label>
          <button class="btn lleno grande" data-act="exportWord">${I.bajar}Generar Word</button></div>
        <div class="card export-card"><span class="ic excel">${I.tabla}</span><div><div class="titulo-3">Planillas Res. 886/15 (Excel)</div>
          <p class="nota" style="margin:4px 0 0">El formulario editable oficial de la SRT, completo: Planilla 1, las nueve Planillas 2, Planilla 3 y Planilla 4. Un archivo por puesto.</p></div>
          <div class="lista-arch">${p.puestos.map(pu => `<div class="fila"><span class="txt">${esc(pu.nombre || 'Sin nombre')}</span><button class="btn chico tenue" data-act="exportP886" data-id="${pu.id}">${I.bajar}Excel</button></div>`).join('')}</div>
          <button class="btn" data-act="exportP886Todos">${I.bajar}Todos los puestos</button></div>
        <div class="card export-card"><span class="ic rb">${I.persona}</span><div><div class="titulo-3">Exámenes REBA (Excel)</div>
          <p class="nota" style="margin:4px 0 0">Un Excel por examen, igual a la planilla REBA original, para copiar la hoja de datos y el nivel de riesgo al informe.</p></div>
          <div class="lista-arch">${rebas.map(({ pu, ex, r }) => `<div class="fila"><span class="txt">${esc(pu.nombre)} · ${esc(ex.nombre)}</span>${r.completo ? `<span class="chip ${r.color}">${r.reba}</span><button class="btn chico tenue" data-act="exportRebaUno" data-pu="${pu.id}" data-ex="${ex.id}">${I.bajar}Excel</button>` : '<span class="chip gris">Incompleto</span>'}</div>`).join('') || '<p class="nota">Sin exámenes.</p>'}</div>
          <button class="btn" data-act="exportRebaTodos" ${rebas.some(x => x.r.completo) ? '' : 'disabled'}>${I.bajar}Todos los REBA</button></div>
      </div>`;
  }

  async function entregar(blob, nombre) {
    const p = S.p;
    if (p && p.destino === 'drive') {
      if (!p.carpeta) { await elegirCarpeta(); if (!p.carpeta) throw new Error('Elegí una carpeta del Drive.'); }
      const b64 = await blobB64(blob);
      const r = await api('POST', '/api/guardar', { ruta: p.carpeta, nombre, base64: b64 });
      return r.ruta;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 30000);
    return null;
  }
  const blobB64 = blob => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.onerror = rej; fr.readAsDataURL(blob); });
  function avisoGuardado(rutas, n) {
    rutas = rutas.filter(Boolean);
    if (rutas.length) aviso((n || rutas.length) === 1 ? 'Guardado en el Drive: ' + rutas[0].split('/').pop() : 'Guardados ' + rutas.length + ' archivos en el Drive', { accion: { t: 'Mostrar', fn: () => api('POST', '/api/revelar', { ruta: rutas[0] }) } });
    else aviso(n > 1 ? n + ' archivos descargados' : 'Archivo descargado');
  }
  async function zipDe(archivos, nombre) {
    const z = new JSZip();
    archivos.forEach(a => z.file(a.nombre, a.blob));
    return { blob: await z.generateAsync({ type: 'blob' }), nombre };
  }

  function rotuloReba(pu, ex) {
    const t = pu.tareas && pu.tareas[ex.tarea] && pu.tareas[ex.tarea].nombre;
    if (S.p.tipo === 'reba') return [ex.puestoLibre, ex.nombre].filter(Boolean).join(' · ');
    return [pu.nombre, t, t === ex.nombre ? null : ex.nombre].filter(Boolean).join(' · ');
  }
  async function archivoReba(pu, ex) {
    const blob = await XLSXGH.exportarReba(ex, { rotulo: rotuloReba(pu, ex) });
    const base = S.p.tipo === 'reba' ? ['REBA', ex.puestoLibre, ex.nombre] : ['REBA', pu.nombre, ex.nombre];
    return { blob, nombre: nombreArchivo(base.filter(Boolean).join(' - ')) + '.xlsx' };
  }
  async function archivo886(pu) {
    const blob = await XLSXGH.exportar886(S.p, pu, EVAL.calcularPuesto(pu));
    return { blob, nombre: nombreArchivo('Planillas Res 886-15 - ' + (pu.nombre || 'puesto')) + '.xlsx' };
  }

  async function elegirCarpeta() {
    return new Promise(resolve => {
      let ruta = S.p.carpeta || '';
      const pintar = async () => {
        let d;
        try { d = await api('GET', '/api/carpetas?ruta=' + encodeURIComponent(ruta)); }
        catch (e) { ruta = ''; d = await api('GET', '/api/carpetas'); }
        const partes = d.ruta ? d.ruta.split('/') : [];
        const migas = ['1. INFORMES'].concat(partes).map((n, i) => `<button class="btn plano chico" data-nav="${esc(partes.slice(0, i).join('/'))}">${esc(n)}</button>`).join('<span class="sep">›</span>');
        abrirCapa(`<div class="hoja"><div class="hoja-cab"><h2>Carpeta del informe</h2><button class="btn icono" data-cerrar>${I.cerrar}</button></div>
          <div class="hoja-cuerpo"><div class="destino" style="margin-bottom:10px">${migas}</div>
          <div class="grupo explorador">${d.carpetas.map(c => `<button class="nav-item fila" data-nav="${esc((d.ruta ? d.ruta + '/' : '') + c)}">${I.carpeta.replace('<svg', '<svg width="18" height="18"')}<span class="txt">${esc(c)}</span>${I.chev.replace('<svg', '<svg width="14" height="14"')}</button>`).join('') || '<div class="fila nota">Sin subcarpetas</div>'}</div>
          ${d.archivos.length ? `<p class="mini" style="margin:10px 4px 0">${d.archivos.length} archivo(s) en esta carpeta: ${esc(d.archivos.slice(0, 6).join(', '))}${d.archivos.length > 6 ? '…' : ''}</p>` : ''}</div>
          <div class="hoja-pie"><button class="btn" data-cerrar>Cancelar</button><button class="btn lleno" data-elegir ${d.ruta ? '' : 'disabled'}>Guardar acá</button></div></div>`);
        const capa = $('#capa');
        capa.onclick = e => {
          const n = e.target.closest('[data-nav]');
          if (n) { ruta = n.dataset.nav; pintar(); return; }
          if (e.target.closest('[data-cerrar]')) { capa.onclick = null; cerrarCapa(); resolve(null); return; }
          if (e.target.closest('[data-elegir]')) { capa.onclick = null; S.p.carpeta = d.ruta; cambio(); cerrarCapa(); render(); resolve(d.ruta); }
        };
      };
      pintar();
    });
  }

  /* ============================================================ REBA rápido */
  function vistaRapido() {
    const pu = S.p.puestos[0];
    app.innerHTML = `<div class="encab"><div><h1 class="titulo-1">REBA rápido</h1><div class="nota">Exámenes sueltos, sin informe. Cada uno sale como Excel igual a la planilla original.</div></div></div>${tabReba(pu, true)}`;
    pintarFigura();
  }

  /* ============================================================ acciones */
  const ACT = {
    ir: el => { location.hash = el.dataset.href; },
    cerrarCapa: () => cerrarCapa(),
    nuevoInforme: () => abrirNuevo(),
    cantPuestos: el => { S.nuevo.cantidad = Math.max(1, Math.min(40, S.nuevo.cantidad + Number(el.dataset.d))); pintarNuevo(); },
    crearInforme: async () => {
      const n = S.nuevo;
      if (!n.empresa.razonSocial.trim()) { aviso('Falta la razón social', { error: true }); return; }
      const id = uid('inf');
      const p = {
        id, tipo: 'informe', creado: Date.now(), empresa: n.empresa, fecha: n.fecha, profesional: n.profesional, textos: {}, opciones: {},
        titulo: (n.titulo || n.empresa.razonSocial).trim(),
        puestos: n.puestos.map((x, i) => puestoNuevo((x.nombre || 'Puesto ' + (i + 1)).trim().toUpperCase(), (x.area || '').trim().toUpperCase()))
      };
      try { localStorage.setItem('gh-ergo-profesional', JSON.stringify({ nombre: n.profesional.nombre, titulo: n.profesional.titulo, matricula: n.profesional.matricula })); } catch (e) { /* almacenamiento no disponible */ }
      await api('PUT', '/api/proyectos/' + id, p);
      cerrarCapa();
      location.hash = '#/p/' + id + '/puesto/' + p.puestos[0].id;
    },
    borrarInforme: async (el, ev) => {
      ev.stopPropagation();
      const it = S.lista.find(x => x.id === el.dataset.id);
      if (!confirm('¿Mover "' + (it ? it.titulo : 'este informe') + '" a la papelera? Queda en datos/papelera por si hace falta recuperarlo.')) return;
      await api('DELETE', '/api/proyectos/' + el.dataset.id);
      S.lista = null; render();
    },
    agregarPuesto: () => {
      const ult = S.p.puestos[S.p.puestos.length - 1];
      const pu = puestoNuevo('PUESTO ' + (S.p.puestos.length + 1), ult ? ult.area : '');
      S.p.puestos.push(pu); cambio();
      location.hash = '#/p/' + S.p.id + '/puesto/' + pu.id;
      setTimeout(() => { const i = $('.cab-puesto input.nombre'); if (i) { i.focus(); i.select(); } }, 80);
    },
    borrarPuesto: () => {
      const pu = puestoActual();
      if (!confirm('¿Eliminar el puesto "' + (pu.nombre || '') + '" con sus planillas y exámenes REBA?')) return;
      const i = S.p.puestos.indexOf(pu);
      S.p.puestos.splice(i, 1); cambio();
      const sig = S.p.puestos[Math.max(0, i - 1)];
      location.hash = '#/p/' + S.p.id + (sig ? '/puesto/' + sig.id : '');
    },
    duplicarPuesto: () => {
      const pu = puestoActual();
      const copia = JSON.parse(JSON.stringify(pu));
      copia.id = uid('pu'); copia.nombre = pu.nombre + ' (copia)';
      copia.reba.forEach(e => { e.id = uid('r'); });
      S.p.puestos.splice(S.p.puestos.indexOf(pu) + 1, 0, copia); cambio();
      location.hash = '#/p/' + S.p.id + '/puesto/' + copia.id;
    },
    moverPuesto: el => {
      const pu = puestoActual(), a = S.p.puestos, i = a.indexOf(pu), j = i + Number(el.dataset.d);
      if (j < 0 || j >= a.length) return;
      a.splice(i, 1); a.splice(j, 0, pu); cambio(); render();
    },
    tab: el => { S.tab[puestoActual().id] = el.dataset.t; render(); },
    sn: el => { const pu = puestoActual(); pu[el.dataset.k] = pu[el.dataset.k] === el.dataset.v ? '' : el.dataset.v; cambio(); render(); },
    marcaP1: el => {
      const pu = puestoActual(), f = el.dataset.f, t = +el.dataset.t;
      const d = pu.p1[f] = pu.p1[f] || {}; d.tareas = d.tareas || [false, false, false];
      d.tareas[t] = !d.tareas[t]; cambio(); render();
    },
    nivelP1: el => {
      const pu = puestoActual(), f = el.dataset.f, t = +el.dataset.t;
      const d = pu.p1[f] = pu.p1[f] || {}; d.nivel = d.nivel || [null, null, null];
      const ciclo = [null, 1, 2, 3, '-'];
      d.nivel[t] = ciclo[(ciclo.indexOf(d.nivel[t] == null ? null : d.nivel[t]) + 1) % ciclo.length];
      cambio(); render();
    },
    quitarFoto: el => { puestoActual().fotos.splice(+el.dataset.i, 1); cambio(); render(); },
    quitarEscaneo: el => { puestoActual().escaneos.splice(+el.dataset.i, 1); cambio(); render(); },
    quitarPortada: () => { S.p.portada = null; cambio(); render(); },
    quitarFirma: () => { S.p.profesional.firma = null; cambio(); render(); },
    p2: el => {
      const pu = puestoActual(), b = el.dataset.b, paso = el.dataset.paso === '1' ? 'paso1' : 'paso2', i = +el.dataset.i;
      const r = pu.p2[b] = pu.p2[b] || { paso1: [], paso2: [] };
      r[paso] = r[paso] || [];
      r[paso][i] = r[paso][i] === el.dataset.v ? null : el.dataset.v;
      recordarAbiertos(); cambio(); render();
    },
    noFaltantes: () => {
      const pu = puestoActual();
      let n = 0;
      P886.FACTORES.forEach(f => {
        const pres = ((pu.p1[f.id] || {}).tareas || []).some(Boolean);
        if (pres) return;
        f.bloques.forEach(b => {
          const r = pu.p2[b.id] = pu.p2[b.id] || { paso1: [], paso2: [] };
          b.paso1.forEach((_, i) => { if (!r.paso1[i]) { r.paso1[i] = 'NO'; n++; } });
        });
      });
      cambio(); render(); aviso(n ? n + ' respuestas marcadas en NO' : 'No había nada para completar');
    },
    general: el => { const m = puestoActual().p3; m.generales = m.generales || []; m.generales[+el.dataset.i] = m.generales[+el.dataset.i] === el.dataset.v ? '' : el.dataset.v; cambio(); render(); },
    tipoMedida: el => { puestoActual().p3.medidas[+el.dataset.i].tipo = el.dataset.v; cambio(); render(); },
    agregarMedida: () => { puestoActual().p3.medidas.push({ texto: '', tipo: 'Adm' }); cambio(); render(); setTimeout(() => { const t = $$('.medida textarea').pop(); if (t) t.focus(); }, 50); },
    quitarMedida: el => { puestoActual().p3.medidas.splice(+el.dataset.i, 1); cambio(); render(); },
    sugerirMedidas: () => {
      const pu = puestoActual(), c = EVAL.calcularPuesto(pu), n = c.nivelPuesto || 1;
      const ya = new Set(pu.p3.medidas.map(m => m.texto));
      const operador = /operad|equip|compact|volc|carg|topad|excav|chofer|conduc|camion/i.test(pu.nombre + ' ' + pu.descripcion + ' ' + pu.tareas.map(t => t.nombre).join(' '));
      const oficina = /administ|oficina|segurid|pañol|almac|recepci/i.test(pu.nombre + ' ' + pu.area);
      let nuevas = P886.MEDIDAS.filter(m => m.grupo === 'General' && m.nivel.includes(n));
      if (operador) nuevas = nuevas.concat(P886.MEDIDAS.filter(m => m.grupo === 'Operación de equipos').slice(0, 1));
      if (oficina && /administ|oficina|segurid/i.test(pu.nombre + pu.area)) nuevas = nuevas.concat(P886.MEDIDAS.filter(m => m.grupo === 'Oficina').slice(0, 2));
      let k = 0;
      nuevas.forEach(m => { if (!ya.has(m.t)) { pu.p3.medidas.push({ texto: m.t, tipo: m.tipo }); k++; } });
      if (!pu.p3.observaciones) { const nv = c.reba.max ? REBA.nivelDe(c.reba.max) : null; pu.p3.observaciones = P886.observacion(n, nv && nv.riesgo); }
      if (pu.p3.generales.every(x => !x)) pu.p3.generales = ['SI', 'SI', 'SI'];
      cambio(); render(); aviso(k ? k + ' medidas agregadas para nivel ' + n : 'Ya estaban todas las sugeridas');
    },
    biblioteca: () => {
      const pu = puestoActual(), ya = new Set(pu.p3.medidas.map(m => m.texto));
      const grupos = [...new Set(P886.MEDIDAS.map(m => m.grupo))];
      abrirCapa(`<div class="hoja"><div class="hoja-cab"><h2>Biblioteca de medidas</h2><button class="btn icono" data-act="cerrarCapa">${I.cerrar}</button></div><div class="hoja-cuerpo">
        ${grupos.map(g => `<div class="mayus" style="margin:14px 4px 8px">${esc(g)}</div><div class="biblio">${P886.MEDIDAS.map((m, i) => m.grupo === g ? `<button class="${ya.has(m.t) ? 'usada' : ''}" data-act="usarMedida" data-i="${i}"><span class="tp">${m.tipo}</span><span>${esc(m.t)}</span></button>` : '').join('')}</div>`).join('')}
        </div><div class="hoja-pie"><button class="btn lleno" data-act="cerrarCapa">Listo</button></div></div>`);
    },
    usarMedida: el => {
      const m = P886.MEDIDAS[+el.dataset.i], pu = puestoActual();
      if (pu.p3.medidas.some(x => x.texto === m.t)) return;
      pu.p3.medidas.push({ texto: m.t, tipo: m.tipo }); el.classList.add('usada'); cambio();
      const c = $('#contenido'); if (c) { const sc = window.scrollY; render(); window.scrollTo(0, sc); ACT.biblioteca(); }
    },
    obsSugerida: () => { const pu = puestoActual(), c = EVAL.calcularPuesto(pu), nv = c.reba.max ? REBA.nivelDe(c.reba.max) : null; pu.p3.observaciones = P886.observacion(c.nivelPuesto || 1, nv && nv.riesgo); cambio(); render(); },

    // REBA
    nuevoExamen: () => {
      const pu = puestoActual();
      const t = pu.tareas.findIndex((x, i) => x && x.nombre && !pu.reba.some(e => e.tarea === i));
      const ex = REBA.examenVacio(t >= 0 ? pu.tareas[t].nombre : 'Postura ' + (pu.reba.length + 1));
      ex.tarea = t >= 0 ? t : 0;
      pu.reba.push(ex); S.exSel[pu.id] = ex.id; cambio(); render();
    },
    selExamen: el => { S.exSel[puestoActual().id] = el.dataset.id; render(); },
    duplicarExamen: () => {
      const pu = puestoActual(), ex = examenActual();
      const c = JSON.parse(JSON.stringify(ex)); c.id = uid('r'); c.nombre = ex.nombre + ' (2)';
      pu.reba.splice(pu.reba.indexOf(ex) + 1, 0, c); S.exSel[pu.id] = c.id; cambio(); render();
    },
    borrarExamen: () => {
      const pu = puestoActual(), ex = examenActual();
      if (!confirm('¿Eliminar el examen "' + ex.nombre + '"?')) return;
      pu.reba.splice(pu.reba.indexOf(ex), 1); delete S.exSel[pu.id]; cambio(); render();
    },
    opReba: el => {
      const ex = examenActual(), k = el.dataset.k, v = +el.dataset.v;
      ex.seg[k].op = v;
      const a = ANG[k];
      if (a && typeof ex.ang[a[0]] === 'number') {
        const prueba = { ang: { [a[0]]: ex.ang[a[0]] }, seg: JSON.parse(JSON.stringify(ex.seg)) };
        REBA.opsDesdeAngulos(prueba);
        if (prueba.seg[k].op !== v) { delete ex.ang[a[0]]; resetAngulo(a[0]); }
      }
      cambio(); refrescarReba();
    },
    rodReba: el => {
      const ex = examenActual(); ex.seg.piernas.rod = +el.dataset.v;
      if (typeof ex.ang.rodilla === 'number') { delete ex.ang.rodilla; resetAngulo('rodilla'); }
      cambio(); refrescarReba();
    },
    corrReba: el => { const ex = examenActual(), s = ex.seg[el.dataset.k]; s[el.dataset.c] = !s[el.dataset.c]; cambio(); if (el.dataset.c === 'sentado') { el.classList.toggle('on'); } refrescarReba(); },
    actReba: el => { const ex = examenActual(); ex.act[el.dataset.k] = ex.act[el.dataset.k] === el.dataset.v ? null : el.dataset.v; cambio(); $$('button', el.parentNode).forEach(b => b.classList.toggle('on', b.dataset.v === ex.act[el.dataset.k])); refrescarReba(); },
    lado: el => { examenActual().lado = el.dataset.v; cambio(); $$('button', el.parentNode).forEach(b => b.classList.toggle('on', b === el)); },
    borrarAngulo: el => { const ex = examenActual(); delete ex.ang[el.dataset.a]; resetAngulo(el.dataset.a); cambio(); refrescarReba(); },
    xlsReba: async () => {
      const pu = puestoActual(), ex = examenActual();
      const a = await archivoReba(pu, ex);
      avisoGuardado([await entregar(a.blob, a.nombre)], 1);
    },
    medir: () => abrirMedir(),
    fotoMedir: el => { const pu = puestoActual(); S.medir.img = pu.fotos[+el.dataset.i]; S.medir.pts = {}; S.medir.actual = 'oreja'; imgMedir = null; pintarMedir(); },
    puntoMedir: el => { S.medir.actual = el.dataset.k; pintarMedir(true); },
    miraMedir: el => { S.medir.mira = el.dataset.v === '←' ? -1 : 1; $$('button', el.parentNode).forEach(b => b.classList.toggle('on', b === el)); pintarMedir(true); },
    limpiarMedir: () => { S.medir.pts = {}; S.medir.actual = 'oreja'; pintarMedir(true); },
    aplicarMedir: () => {
      const M = S.medir, ex = examenActual();
      if (!M.img || Object.keys(M.pts).length < 2) { aviso('Marcá al menos cadera y hombro', { error: true }); return; }
      const mira = M.mira || REBA.adivinarMira(M.pts);
      const a = REBA.angulosDesdePuntos(M.pts, mira);
      ex.foto = { img: M.img, pts: M.pts, mira };
      Object.assign(ex.ang, a);
      REBA.opsDesdeAngulos(ex);
      cerrarCapa(); cambio(); render();
      aviso('Ángulos aplicados: ' + Object.keys(a).map(k => k + ' ' + a[k] + 'º').join(', '));
    },

    // exportar
    destino: el => { S.p.destino = el.dataset.v === 'Carpeta del Drive' ? 'drive' : 'descargas'; cambio(); render(); },
    elegirCarpeta: () => elegirCarpeta(),
    revelar: el => api('POST', '/api/revelar', { ruta: el.dataset.ruta }),
    exportP886: async el => { const a = await archivo886(puesto(el.dataset.id)); avisoGuardado([await entregar(a.blob, a.nombre)], 1); },
    exportP886Todos: async el => {
      el.disabled = true;
      try {
        const arch = []; for (const pu of S.p.puestos) arch.push(await archivo886(pu));
        if (S.p.destino === 'drive') { const rutas = []; for (const a of arch) rutas.push(await entregar(a.blob, a.nombre)); avisoGuardado(rutas, rutas.length); }
        else { const z = await zipDe(arch, nombreArchivo('Planillas 886-15 - ' + S.p.titulo) + '.zip'); await entregar(z.blob, z.nombre); aviso(arch.length + ' planillas en un .zip'); }
      } finally { el.disabled = false; }
    },
    exportRebaUno: async el => { const pu = puesto(el.dataset.pu), ex = pu.reba.find(e => e.id === el.dataset.ex); const a = await archivoReba(pu, ex); avisoGuardado([await entregar(a.blob, a.nombre)], 1); },
    exportRebaTodos: async el => {
      el.disabled = true;
      try {
        const arch = [];
        for (const pu of S.p.puestos) for (const ex of pu.reba) if (REBA.calcular(ex).completo) arch.push(await archivoReba(pu, ex));
        if (S.p.destino === 'drive') { const rutas = []; for (const a of arch) rutas.push(await entregar(a.blob, a.nombre)); avisoGuardado(rutas, rutas.length); }
        else { const z = await zipDe(arch, nombreArchivo('REBA - ' + S.p.titulo) + '.zip'); await entregar(z.blob, z.nombre); aviso(arch.length + ' exámenes REBA en un .zip'); }
      } finally { el.disabled = false; }
    },
    exportWord: async el => {
      el.disabled = true; const txt = el.innerHTML; el.textContent = 'Armando el informe…';
      try {
        await guardarYa();
        const fotosMedidas = {};
        if (!S.p.opciones || S.p.opciones.fotoMedida !== false) for (const pu of S.p.puestos) for (const ex of pu.reba) fotosMedidas[ex.id] = await fotoMedidaPNG(ex);
        const blob = await WORDGH.generarInforme(S.p, { fotosMedidas, intro: (S.p.textos && S.p.textos.intro) || textoIntro(S.p) });
        const nombre = nombreArchivo('INFORME DE ERGONOMIA ' + (S.p.titulo || '') + ' ' + anioInforme()) + '.docx';
        avisoGuardado([await entregar(blob, nombre)], 1);
      } finally { el.disabled = false; el.innerHTML = txt; }
    }
  };
  function resetAngulo(k) {
    const w = $(`[data-angwrap="${k}"]`); if (!w) return;
    w.classList.add('sin'); const o = $('output', w); if (o) o.textContent = 'sin medir'; const b = $('button', w); if (b) b.hidden = true;
  }
  function recordarAbiertos() {
    S.abiertos = S.abiertos || {};
    $$('details.factor').forEach(d => { S.abiertos[d.dataset.fac] = d.open; });
  }
  document.addEventListener('toggle', e => { if (e.target.matches && e.target.matches('details.factor')) { S.abiertos = S.abiertos || {}; S.abiertos[e.target.dataset.fac] = e.target.open; } }, true);

  window.GHAPP = { S, render, fotoMedidaPNG };
  GH.entrar().then(ir);
})();
