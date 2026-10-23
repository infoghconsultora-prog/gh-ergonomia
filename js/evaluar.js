/* Encadena el protocolo: respuestas de la Planilla 2 → resultado por factor → nivel de riesgo por tarea
 * en la Planilla 1 (usando el REBA de esa tarea cuando hace falta evaluar) → nivel del puesto. */
(function () {
  const ESTADOS = {
    pendiente: { t: 'Sin completar', c: 'gris' },
    tolerable: { t: 'Tolerable', c: 'verde' },
    evaluar: { t: 'Requiere evaluación de riesgos', c: 'amarillo' },
    no_tolerable: { t: 'No tolerable', c: 'rojo' }
  };

  function resultadoBloque(b, r) {
    r = r || {};
    const p1 = r.paso1 || [], p2 = r.paso2 || [];
    const p1ok = b.paso1.every((_, i) => p1[i] === 'SI' || p1[i] === 'NO');
    if (!p1ok) return { estado: 'pendiente', paso: 1 };
    if (b.paso1.every((_, i) => p1[i] === 'NO')) return { estado: 'tolerable', paso: 1 };
    if (b.critico >= 0 && p1[b.critico] === 'SI') return { estado: 'no_tolerable', paso: 1, motivo: 'Pregunta ' + (b.critico + 1) + ' del paso 1 en SI' };
    const p2ok = b.paso2.every((_, i) => p2[i] === 'SI' || p2[i] === 'NO');
    if (!p2ok) return { estado: 'pendiente', paso: 2 };
    if (b.paso2.every((_, i) => p2[i] === 'NO')) return { estado: 'tolerable', paso: 2 };
    if (b.critico2 != null && p2[b.critico2] === 'SI') return { estado: 'no_tolerable', paso: 2, motivo: 'Esfuerzo superior a 7 en la escala de Borg' };
    return { estado: 'evaluar', paso: 2 };
  }

  const PESO = { pendiente: 0, tolerable: 1, evaluar: 2, no_tolerable: 3 };
  function resultadoFactor(f, pu) {
    const res = f.bloques.map(b => resultadoBloque(b, (pu.p2 || {})[b.id]));
    if (res.some(r => r.estado === 'pendiente') && !res.some(r => r.estado === 'no_tolerable' || r.estado === 'evaluar')) {
      return Object.assign({ bloques: res }, res.find(r => r.estado === 'pendiente'));
    }
    const peor = res.reduce((a, r) => PESO[r.estado] > PESO[a.estado] ? r : a, res[0]);
    return Object.assign({ bloques: res }, peor);
  }

  function rebaDe(pu) {
    const porTarea = [null, null, null];
    let max = null;
    (pu.reba || []).forEach(ex => {
      const r = REBA.calcular(ex);
      if (!r.completo) return;
      const t = ex.tarea == null ? 0 : ex.tarea;
      if (porTarea[t] == null || r.reba > porTarea[t]) porTarea[t] = r.reba;
      if (max == null || r.reba > max) max = r.reba;
    });
    return { porTarea, max };
  }

  const tieneTarea = (pu, t) => !!((pu.tareas || [])[t] && pu.tareas[t].nombre);

  function calcularPuesto(pu) {
    const rb = rebaDe(pu);
    const p1 = {};
    let nivelPuesto = null;
    const avisos = [];
    P886.FACTORES.forEach(f => {
      const d = (pu.p1 || {})[f.id] || {};
      const res = resultadoFactor(f, pu);
      const presente = (d.tareas || []).some(Boolean);
      const niveles = [0, 1, 2].map(t => {
        if (!tieneTarea(pu, t)) return null;
        const manual = (d.nivel || [])[t];
        if (manual === '-' ) return null;
        if (typeof manual === 'number') return manual;
        if (!(d.tareas || [])[t]) return null;
        if (res.estado === 'tolerable') return 1;
        if (res.estado === 'no_tolerable') return 3;
        if (res.estado === 'evaluar') {
          const sc = rb.porTarea[t] != null ? rb.porTarea[t] : rb.max;
          if (f.usaReba && sc != null) return REBA.nivel886(sc);
          return 2;
        }
        return null;
      });
      niveles.forEach(n => { if (n != null && (nivelPuesto == null || n > nivelPuesto)) nivelPuesto = n; });
      if (!presente && (res.estado === 'evaluar' || res.estado === 'no_tolerable')) avisos.push('El factor "' + f.nombre + '" da riesgo en la Planilla 2 pero no está marcado en la Planilla 1.');
      if (presente && res.estado === 'pendiente') avisos.push('Falta completar la Planilla 2.' + f.id + ' (' + f.nombre + ').');
      if (presente && res.estado === 'evaluar' && f.usaReba && rb.max == null) avisos.push('"' + f.nombre + '" requiere evaluación de riesgos: cargá un examen REBA.');
      p1[f.id] = { resultado: res, presente, niveles };
    });
    if (nivelPuesto == null && rb.max != null) nivelPuesto = REBA.nivel886(rb.max);
    return { p1, reba: rb, nivelPuesto, avisos, avance: avance(pu, p1, rb) };
  }

  function avance(pu, p1, rb) {
    const ident = !!(pu.nombre && (pu.tareas || []).some(t => t && t.nombre) && P886.FACTORES.some(f => ((pu.p1 || {})[f.id] || {}).tareas && pu.p1[f.id].tareas.some(Boolean)));
    const eval2 = P886.FACTORES.every(f => p1[f.id].resultado.estado !== 'pendiente');
    const reba = (pu.reba || []).length > 0 && (pu.reba || []).every(ex => REBA.calcular(ex).completo);
    const m = pu.p3 || {};
    const medidas = (m.generales || []).filter(Boolean).length === 3 && (m.medidas || []).some(x => x && x.texto);
    const pasos = [ident, eval2, reba, medidas];
    return { pasos, hechos: pasos.filter(Boolean).length, total: 4 };
  }

  window.EVAL = { ESTADOS, resultadoBloque, resultadoFactor, calcularPuesto, rebaDe };
})();
