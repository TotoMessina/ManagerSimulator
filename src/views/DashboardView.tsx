import React from 'react';
import { useGame } from '../context/useGame';
import { Equipo, Jornada } from '../types';
import { CentroDeMedios } from './CentroDeMedios';
import { FeedHinchada } from './FeedHinchada';
import { obtenerDebilidadEquipo } from '../engine/matchEngine';

// Formateador de dinero
const formatearMoneda = (valor: number): string => {
  if (valor >= 1000000) {
    return `${(valor / 1000000).toFixed(1)} M€`;
  }
  return `${(valor / 1000).toFixed(0)} m€`;
};

export const DashboardView: React.FC = () => {
  const {
    equipos,
    jugadores,
    fechaActual,
    equipoUsuario,
    avanzarDia,
    noticias,
    limpiarNoticias,
    ruedaPrensaActiva,
    charlaActiva,
    resolverCharla,
    fixture,
    liga,
    finalizarTemporada,
    copaCampeones,
    copaEuropa
  } = useGame();

  const totalPartidosTemporada = (liga.tabla.length - 1) * 2;
  const esFinDeTemporada = liga.tabla.length > 0 && liga.tabla[0].partidosJugados === totalPartidosTemporada;

  // --- DETECTAR PARTIDO DE COPA HOY ---
  let partidoCopaHoy: any = null;
  let grupoCopaHoyId: string | undefined = undefined;
  let tipoCopaHoy: 'champions' | 'europa' | null = null;

  const checkCopaHoy = (copa: typeof copaCampeones, tipo: 'champions' | 'europa') => {
    if (!copa || !equipoUsuario) return;
    if (copa.faseActual === 'grupos') {
      const jgHoyList = copa.partidosGrupos.filter(jg => jg.fecha === fechaActual);
      jgHoyList.forEach(jg => {
        const found = jg.partidos.find(p => p.localId === equipoUsuario.id || p.visitanteId === equipoUsuario.id);
        if (found) {
          partidoCopaHoy = found;
          grupoCopaHoyId = jg.grupoId;
          tipoCopaHoy = tipo;
        }
      });
    } else if (copa.faseActual === 'cuartos' && copa.cuartos && copa.cuartos.fecha === fechaActual) {
      const found = copa.cuartos.partidos.find(p => p.localId === equipoUsuario.id || p.visitanteId === equipoUsuario.id);
      if (found) {
        partidoCopaHoy = found;
        tipoCopaHoy = tipo;
      }
    } else if (copa.faseActual === 'semifinales' && copa.semifinales && copa.semifinales.fecha === fechaActual) {
      const found = copa.semifinales.partidos.find(p => p.localId === equipoUsuario.id || p.visitanteId === equipoUsuario.id);
      if (found) {
        partidoCopaHoy = found;
        tipoCopaHoy = tipo;
      }
    } else if (copa.faseActual === 'final' && copa.final && copa.final.fecha === fechaActual) {
      const p = copa.final.partido;
      if (p.localId === equipoUsuario.id || p.visitanteId === equipoUsuario.id) {
        partidoCopaHoy = p;
        tipoCopaHoy = tipo;
      }
    }
  };

  checkCopaHoy(copaCampeones, 'champions');
  if (!partidoCopaHoy) {
    checkCopaHoy(copaEuropa, 'europa');
  }

  const esDiaDeCopa = (copaCampeones && (
    (copaCampeones.faseActual === 'grupos' && copaCampeones.partidosGrupos.some(jg => jg.fecha === fechaActual)) ||
    (copaCampeones.faseActual === 'cuartos' && copaCampeones.cuartos?.fecha === fechaActual) ||
    (copaCampeones.faseActual === 'semifinales' && copaCampeones.semifinales?.fecha === fechaActual) ||
    (copaCampeones.faseActual === 'final' && copaCampeones.final?.fecha === fechaActual)
  )) || (copaEuropa && (
    (copaEuropa.faseActual === 'grupos' && copaEuropa.partidosGrupos.some(jg => jg.fecha === fechaActual)) ||
    (copaEuropa.faseActual === 'cuartos' && copaEuropa.cuartos?.fecha === fechaActual) ||
    (copaEuropa.faseActual === 'semifinales' && copaEuropa.semifinales?.fecha === fechaActual) ||
    (copaEuropa.faseActual === 'final' && copaEuropa.final?.fecha === fechaActual)
  ));

  if (!equipoUsuario) return null;

  // --- DETECTAR JORNADA Y ENCUENTROS ---
  const jornadaHoy = fixture.find(j => j.fecha === fechaActual);

  const partidoUsuarioHoy = jornadaHoy?.partidos.find(
    p => p.localId === equipoUsuario.id || p.visitanteId === equipoUsuario.id
  );

  // Calcular próximo partido si no hay partido hoy
  let proximoPartidoTexto = 'Ninguno programado';
  let proximaJornada: Jornada | null = null;
  
  if (!jornadaHoy) {
    const fechaActualDate = new Date(fechaActual + 'T12:00:00');
    const jornadasFuturas = fixture.filter(j => new Date(j.fecha + 'T12:00:00') > fechaActualDate);
    
    if (jornadasFuturas.length > 0) {
      proximaJornada = jornadasFuturas[0];
      const partFut = proximaJornada.partidos.find(p => p.localId === equipoUsuario.id || p.visitanteId === equipoUsuario.id);
      
      if (partFut) {
        const local = equipos.find(e => e.id === partFut.localId);
        const visitante = equipos.find(e => e.id === partFut.visitanteId);
        proximoPartidoTexto = `Jornada ${proximaJornada.numero} · contra ${
          partFut.localId === equipoUsuario.id ? `${visitante?.nombreCorto} (Local)` : `${local?.nombreCorto} (Visitante)`
        } el ${proximaJornada.fecha}`;
      }
    }
  }

  // Identificar rival de hoy si hay partido
  let rivalHoy: Equipo | null = null;
  let esLocal = true;

  if (partidoUsuarioHoy) {
    esLocal = partidoUsuarioHoy.localId === equipoUsuario.id;
    const rivalId = esLocal ? partidoUsuarioHoy.visitanteId : partidoUsuarioHoy.localId;
    rivalHoy = equipos.find(e => e.id === rivalId) || null;
  }

  // Identificar rival de hoy en Copa o Liga
  let rivalDeHoy: Equipo | null = null;
  if (jornadaHoy && rivalHoy) {
    rivalDeHoy = rivalHoy;
  } else if (partidoCopaHoy) {
    const esLocalCopa = partidoCopaHoy.localId === equipoUsuario.id;
    const rivalId = esLocalCopa ? partidoCopaHoy.visitanteId : partidoCopaHoy.localId;
    rivalDeHoy = equipos.find(e => e.id === rivalId) || null;
  }

  // Identificar rival futuro si no hay partido hoy
  let proximoRival: Equipo | null = null;
  if (!jornadaHoy && !partidoCopaHoy && proximaJornada) {
    const partFut = proximaJornada.partidos.find(p => p.localId === equipoUsuario.id || p.visitanteId === equipoUsuario.id);
    if (partFut) {
      const rivalId = partFut.localId === equipoUsuario.id ? partFut.visitanteId : partFut.localId;
      proximoRival = equipos.find(e => e.id === rivalId) || null;
    }
  }

  const rivalParaReporte = rivalDeHoy || proximoRival;

  const generarReporteRival = (rival: Equipo) => {
    const debilidad = obtenerDebilidadEquipo(rival.id, jugadores);
    
    let focoAtaque = "un 55% combinando transiciones rápidas";
    if (rival.formacion === '4-3-3' || rival.formacion === '3-5-2') {
      focoAtaque = "un 70% por las bandas buscando desborde";
    } else if (rival.formacion === '4-4-2') {
      focoAtaque = "un 60% por el centro con pases directos";
    } else if (rival.formacion === '5-3-2') {
      focoAtaque = "un 65% replegado apostando al contraataque";
    }

    const estilo = rival.estiloJuego || 'Equilibrado';

    let debilidadTexto = "";
    let recomendacion = "";
    if (debilidad === 'centrales_lentos') {
      debilidadTexto = "la lentitud de sus defensores centrales";
      recomendacion = "Configurá Tácticas de pases 'Largos al espacio' y córners 'Atacar el primer palo' en Táctica para obtener un bonus del +20% de efectividad de ataque.";
    } else if (debilidad === 'debilidad_aerea') {
      debilidadTexto = "su debilidad defensiva en el juego aéreo";
      recomendacion = "Alineá delanteros con buen juego aéreo y priorizá centros al área chica.";
    } else {
      debilidadTexto = "los espacios a espaldas de sus laterales cuando se proyectan";
      recomendacion = "Priorizá jugar con extremos rápidos que aprovechen las bandas.";
    }

    return {
      focoAtaque,
      estilo,
      debilidadTexto,
      recomendacion,
      debilidad
    };
  };

  return (
    <div className="space-y-6">
      
      {/* Cabecera / Identificación Finanzas del club */}
      <div 
        style={{
          background: `linear-gradient(135deg, ${equipoUsuario.colorPrincipal}22, ${equipoUsuario.colorSecundario}11)`,
          borderColor: `${equipoUsuario.colorPrincipal}44`
        }}
        className="rounded-2xl p-6 border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            Oficina de {equipoUsuario.nombre}
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Control de presupuestos, planificación de entrenamientos y fixture de la Superliga. Dirigí los hilos del vestuario rumbo al campeonato.
          </p>
        </div>
        
        {/* Presupuesto */}
        <div className="flex flex-wrap gap-4 text-xs font-semibold">
          <div className="bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Presupuesto de Fichajes</div>
            <div className="text-teal-400 font-bold text-sm mt-0.5">{formatearMoneda(equipoUsuario.presupuestoFichajes)}</div>
          </div>
          <div className="bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Masa Salarial Máxima</div>
            <div className="text-slate-300 font-bold text-sm mt-0.5">{formatearMoneda(equipoUsuario.presupuestoSalarialSemanal)} <span className="text-[9px] text-slate-500 font-normal">/sem</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ==========================================
            PANEL DE ACCIÓN Y NOTICIAS (COL-SPAN 2)
            ========================================== */}
        <div className="lg:col-span-2 space-y-6">
          {charlaActiva ? (
            /* INTERFAZ DE DIÁLOGO DE VESTUARIO */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col space-y-6 shadow-2xl backdrop-blur-md relative overflow-hidden animate-fade-in border-t-4 border-t-amber-500 text-left">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-amber-400 tracking-widest block">🗣️ Charla Privada en Oficina</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">El jugador {charlaActiva.jugadorNombre} exige explicaciones</h3>
                </div>
                <div className="bg-slate-950 border border-slate-800 text-[10px] uppercase font-bold text-slate-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-mono">
                  <span>Inactividad: {charlaActiva.consecutivos} partidos en banco</span>
                </div>
              </div>

              {/* Burbuja del Jugador */}
              <div className="flex gap-4 items-start bg-slate-950/60 border border-slate-800 p-5 rounded-xl">
                <div className="text-3xl bg-slate-900 border border-slate-800 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 select-none shadow-md">
                  🏃‍♂️
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{charlaActiva.jugadorNombre}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      charlaActiva.personalidad === 'Líder' ? 'bg-cyan-500/10 text-cyan-400' :
                      charlaActiva.personalidad === 'Ambicioso' ? 'bg-amber-500/10 text-amber-400' :
                      charlaActiva.personalidad === 'Profesional' ? 'bg-emerald-500/10 text-emerald-400' :
                      charlaActiva.personalidad === 'Problemático' ? 'bg-rose-500/10 text-rose-400' :
                      'bg-fuchsia-500/10 text-fuchsia-400'
                    }`}>
                      {charlaActiva.personalidad}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    {charlaActiva.personalidad === 'Líder' && `"Profe, como uno de los referentes del plantel, creo que es hora de volver a estar adentro de la cancha. Mi ausencia en los partidos resta peso al grupo y me preocupa que perdamos el rumbo."`}
                    {charlaActiva.personalidad === 'Ambicioso' && `"No vine a este club a ver los partidos sentado de brazos cruzados. Si no voy a ser titular de inmediato, exijo que me pongan en transferencia para buscar minutos en otro lado. Mi carrera no se va a estancar en tu banco."`}
                    {charlaActiva.personalidad === 'Profesional' && `"Entiendo las rotaciones tácticas, Profe, pero considero que me encuentro en mi mejor forma física y técnica para iniciar los encuentros. Necesito continuidad de minutos para mantener mi rendimiento."`}
                    {charlaActiva.personalidad === 'Problemático' && `"Mirá, me estoy cansando de que me dejes afuera. No me vas a tener comiendo banco mientras otros juegan en mi lugar. O juego el próximo partido, o te aseguro que esto no va a terminar bien para el vestuario."`}
                    {charlaActiva.personalidad === 'Leal' && `"Siempre he dado todo por esta camiseta, Profe, y respeto plenamente tus decisiones. Pero me duele no poder ayudar a mis compañeros en el campo. Te pido que consideres darme una oportunidad."`}
                  </p>
                </div>
              </div>

              {/* Opciones de respuesta del Director Técnico */}
              <div className="space-y-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Seleccioná tu Respuesta como DT:</span>
                
                {/* Opción A: Prometer */}
                <button
                  onClick={() => resolverCharla('prometer')}
                  className="w-full text-left p-4 rounded-xl border border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10 group transition-all duration-200"
                >
                  <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wide">
                    <span>🤝</span> Prometer titularidad en el próximo partido
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    "Tranquilo, vas a arrancar el próximo encuentro como titular."
                  </p>
                  <div className="text-[9px] text-slate-500 mt-2 font-bold flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-emerald-400/90">✓ Moral del jugador +25</span>
                    <span className="text-emerald-400/90">✓ Armonía del equipo +5</span>
                    <span className="text-rose-400/90 font-normal">(Riesgo: si no juega la próxima fecha, su moral caerá -35)</span>
                  </div>
                </button>

                {/* Opción B: Vender */}
                <button
                  onClick={() => resolverCharla('vender')}
                  className="w-full text-left p-4 rounded-xl border border-rose-500/25 bg-rose-500/5 hover:bg-rose-500/10 group transition-all duration-200"
                >
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wide">
                    <span>💸</span> Declarar transferible (Lista de Ventas)
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    "Si no estás a gusto con tus minutos, buscaremos una oferta para que salgas del club."
                  </p>
                  <div className="text-[9px] text-slate-500 mt-2 font-bold flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-rose-400/90">✗ Moral del jugador cae a 15</span>
                    <span className="text-rose-400/90">✗ Armonía del equipo -10</span>
                    <span className="text-emerald-400/90 font-normal">(Garantiza oferta del mercado en el próximo día tick)</span>
                  </div>
                </button>

                {/* Opción C: Sancionar */}
                <button
                  onClick={() => resolverCharla('sancionar')}
                  className="w-full text-left p-4 rounded-xl border border-red-500/25 bg-red-950/20 hover:bg-red-950/30 group transition-all duration-200"
                >
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wide">
                    <span>⚖️</span> Sancionar por indisciplina y reclamos públicos
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    "Ningún jugador está por encima de este club. Respetá las rotaciones o serás multado."
                  </p>
                  <div className="text-[9px] text-slate-500 mt-2 font-bold flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-rose-500">✗ Moral del jugador cae a 5 (Multa de sueldo)</span>
                    <span className="text-rose-500">✗ Armonía del equipo -15 (Tensión en vestuario)</span>
                  </div>
                </button>
              </div>
            </div>
          ) : ruedaPrensaActiva ? (
            <CentroDeMedios />
          ) : (
            /* Tarjeta de Acción */
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-lg backdrop-blur-md">
              <div>
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 border-b border-slate-800 pb-2">
                  ⚽ {partidoCopaHoy 
                    ? `${tipoCopaHoy === 'champions' ? 'Copa de Campeones' : 'Copa Continental'} · ${
                        (tipoCopaHoy === 'champions' ? copaCampeones : copaEuropa)!.faseActual === 'grupos' ? `Grupo ${grupoCopaHoyId}` :
                        (tipoCopaHoy === 'champions' ? copaCampeones : copaEuropa)!.faseActual === 'cuartos' ? 'Cuartos de Final' :
                        (tipoCopaHoy === 'champions' ? copaCampeones : copaEuropa)!.faseActual === 'semifinales' ? 'Semifinal' : 'Gran Final'
                      }`
                    : esDiaDeCopa 
                      ? 'Jornada Continental de Copa' 
                      : jornadaHoy 
                        ? `Jornada ${jornadaHoy.numero} de Liga` 
                        : esFinDeTemporada 
                          ? 'Temporada Concluida' 
                          : 'Día de Preparación Técnica'}
                </h3>
                
                {partidoCopaHoy ? (
                  <div className="mt-4 p-5 bg-indigo-950/20 border border-indigo-500/30 rounded-xl space-y-4 shadow-lg shadow-indigo-950/10">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="uppercase font-bold tracking-widest text-[9px] text-indigo-400">Próximo Partido Internacional</span>
                      <span>📅 Hoy ({fechaActual})</span>
                    </div>
                    
                    {/* Enfrentamiento visual */}
                    <div className="flex items-center justify-center gap-6 py-2">
                      <div className="text-center w-1/3">
                        <span className="text-4xl block mb-1">{equipoUsuario.escudo}</span>
                        <span className="text-xs font-bold block text-slate-200">{equipoUsuario.nombre}</span>
                        <span className="text-[9px] font-bold text-slate-500 block uppercase mt-0.5">
                          {partidoCopaHoy.localId === equipoUsuario.id ? 'Local' : 'Visitante'}
                        </span>
                      </div>
                      
                      <div className="text-center">
                        <span className="text-xs font-extrabold text-slate-350 uppercase tracking-widest px-3 py-1.5 rounded-lg bg-indigo-950 border border-indigo-850/60 block animate-pulse">VS</span>
                      </div>

                      {(() => {
                        const esLocalCopa = partidoCopaHoy.localId === equipoUsuario.id;
                        const rivalId = esLocalCopa ? partidoCopaHoy.visitanteId : partidoCopaHoy.localId;
                        const rival = equipos.find(e => e.id === rivalId);
                        if (!rival) return null;
                        return (
                          <div className="text-center w-1/3">
                            <span className="text-4xl block mb-1">{rival.escudo}</span>
                            <span className="text-xs font-bold block text-slate-200">{rival.nombre}</span>
                            <span className="text-[9px] font-bold text-slate-500 block uppercase mt-0.5">
                              {esLocalCopa ? 'Visitante' : 'Local'}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="text-center text-[10px] text-slate-400 font-medium">
                      Estadio: {partidoCopaHoy.localId === equipoUsuario.id ? equipoUsuario.estadio : (equipos.find(e => e.id === partidoCopaHoy.localId)?.estadio || 'Estadio Rival')}
                    </div>
                  </div>
                ) : esDiaDeCopa ? (
                  <div className="mt-4 p-5 bg-slate-950/60 border border-slate-800/80 border-dashed rounded-xl space-y-3">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Hoy se disputan encuentros de las Copas Internacionales. Tu equipo no tiene compromisos continentales para esta fecha, por lo que el plantel continuará con rutinas de entrenamiento táctico en el complejo.
                    </p>
                    <div className="text-xs text-indigo-400 font-bold flex items-center gap-1.5">
                      <span>🏆 Torneos Continentales:</span>
                      <span className="font-semibold text-slate-300">Fase de Grupos o Eliminatorias en progreso</span>
                    </div>
                  </div>
                ) : jornadaHoy && rivalHoy ? (
                  <div className="mt-4 p-5 bg-slate-950/60 border border-slate-800/60 rounded-xl space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="uppercase font-bold tracking-widest text-[9px] text-teal-400">Próximo Partido Oficial</span>
                      <span>📅 Hoy ({fechaActual})</span>
                    </div>
                    
                    {/* Enfrentamiento visual */}
                    <div className="flex items-center justify-center gap-6 py-2">
                      <div className="text-center w-1/3">
                        <span className="text-4xl block mb-1">{equipoUsuario.escudo}</span>
                        <span className="text-xs font-bold block text-slate-200">{equipoUsuario.nombre}</span>
                        <span className="text-[9px] font-bold text-slate-500 block uppercase mt-0.5">{esLocal ? 'Local' : 'Visitante'}</span>
                      </div>
                      
                      <div className="text-center">
                        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800/60 block">VS</span>
                      </div>

                      <div className="text-center w-1/3">
                        <span className="text-4xl block mb-1">{rivalHoy.escudo}</span>
                        <span className="text-xs font-bold block text-slate-200">{rivalHoy.nombre}</span>
                        <span className="text-[9px] font-bold text-slate-500 block uppercase mt-0.5">{esLocal ? 'Visitante' : 'Local'}</span>
                      </div>
                    </div>

                    <div className="text-center text-[10px] text-slate-500 font-medium">
                      Estadio: {esLocal ? equipoUsuario.estadio : rivalHoy.estadio} · Capacidad: {(esLocal ? equipoUsuario.capacidadEstadio : rivalHoy.capacidadEstadio).toLocaleString()} espectadores
                    </div>
                  </div>
                ) : esFinDeTemporada ? (
                  <div className="mt-4 p-5 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-3">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      La temporada ha finalizado. Todos los partidos de la Superliga han sido disputados. Hacé clic en <strong>Finalizar Temporada</strong> para procesar la jubilación de futbolistas mayores de 34 años, incorporar a los nuevos juveniles talentosos de la cantera, restablecer la tabla general de posiciones y sortear el calendario de la próxima temporada.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 p-5 bg-slate-950/40 border border-slate-800/40 border-dashed rounded-xl space-y-3">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      No hay partidos programados para la fecha actual en tu calendario. El plantel está entrenando para optimizar su estado físico. Aprovechá para avanzar de día y preparar el próximo encuentro.
                    </p>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <span className="text-slate-400">📅 Siguiente Rival:</span>
                      <span className="font-semibold text-slate-300">{proximoPartidoTexto}</span>
                    </div>
                  </div>
                )}

                {/* INFORME DE SCOUTING DEL RIVAL */}
                {rivalParaReporte && (
                  <div className="mt-4 p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 shadow-lg text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-teal-500/5 to-transparent pointer-events-none" />
                    <h4 className="text-[10px] font-black uppercase text-teal-400 tracking-wider flex items-center gap-1.5 mb-2">
                      📋 Informe del Rival (Analista de Scouting)
                    </h4>
                    {(() => {
                      const { focoAtaque, estilo, debilidadTexto, recomendacion } = generarReporteRival(rivalParaReporte);
                      return (
                        <>
                          <p className="text-xs text-slate-350 leading-relaxed">
                            El analista reporta: El <strong className="text-slate-200">{rivalParaReporte.nombre}</strong> ataca {focoAtaque} usando un estilo <strong className="text-slate-200">{estilo}</strong> y su punto débil es <strong className="text-teal-300 font-bold">{debilidadTexto}</strong>.
                          </p>
                          <div className="text-[10px] text-slate-500 border-t border-slate-800/80 mt-2.5 pt-2 flex items-start gap-1">
                            <span className="text-teal-400">💡</span>
                            <span>
                              <strong>Recomendación:</strong> {recomendacion}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Gran Botón de Acción Principal */}
              <div className="pt-4 border-t border-slate-850 flex justify-end">
                {esFinDeTemporada ? (
                  <button
                    onClick={finalizarTemporada}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-white font-extrabold text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 active:scale-[0.98] transform transition-all duration-200 animate-pulse"
                  >
                    🏆 Finalizar Temporada
                  </button>
                ) : partidoCopaHoy ? (
                  <button
                    onClick={avanzarDia}
                    className={`w-full sm:w-auto px-8 py-4 bg-gradient-to-r ${
                      tipoCopaHoy === 'champions' 
                        ? 'from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/30 border-indigo-500/20' 
                        : 'from-blue-600 via-cyan-600 to-blue-700 hover:from-blue-500 hover:to-cyan-500 shadow-blue-500/30 border-blue-500/20'
                    } text-white font-extrabold text-sm uppercase tracking-widest rounded-xl shadow-lg active:scale-[0.98] transform transition-all duration-200 animate-pulse border`}
                  >
                    🏆 Jugar {tipoCopaHoy === 'champions' ? 'Copa de Campeones' : 'Copa Continental'}
                  </button>
                ) : esDiaDeCopa ? (
                  <button
                    onClick={avanzarDia}
                    className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-sm uppercase tracking-widest rounded-xl shadow-md border border-slate-700 active:scale-[0.98] transform transition-all duration-150"
                  >
                    ⏭️ Simular Jornada Copa
                  </button>
                ) : jornadaHoy ? (
                  <button
                    onClick={avanzarDia}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-extrabold text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-teal-500/20 active:scale-[0.98] transform transition-all duration-200 animate-pulse"
                  >
                    ⚔️ Jugar Jornada {jornadaHoy.numero}
                  </button>
                ) : (
                  <button
                    onClick={avanzarDia}
                    className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-sm uppercase tracking-widest rounded-xl shadow-md border border-slate-700 active:scale-[0.98] transform transition-all duration-150"
                  >
                    ⏭️ Avanzar Día (Calendario)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Portal de Prensa y Noticias de los Entrenamientos */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-lg backdrop-blur-md">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                📰 Novedades de Prensa y Vestuario
              </h3>
              {noticias.length > 0 && (
                <button
                  onClick={limpiarNoticias}
                  className="text-[9px] uppercase font-black text-slate-500 hover:text-rose-400 transition-colors tracking-widest"
                >
                  Limpiar Registro
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar text-xs leading-relaxed">
              {noticias.length > 0 ? (
                noticias.map((noticia, i) => {
                  let borderStyle = 'border-slate-800/80 bg-slate-950/20';
                  let textColor = 'text-slate-400';
                  
                  if (noticia.includes('📈')) {
                    borderStyle = 'border-emerald-500/25 bg-emerald-500/5';
                    textColor = 'text-emerald-300';
                  } else if (noticia.includes('📉')) {
                    borderStyle = 'border-rose-500/25 bg-rose-500/5';
                    textColor = 'text-rose-400';
                  } else if (noticia.includes('🤝')) {
                    borderStyle = 'border-blue-500/25 bg-blue-500/5';
                    textColor = 'text-blue-300';
                  }

                  return (
                    <div 
                      key={i} 
                      className={`p-3 rounded-xl border leading-relaxed transition-all duration-200 animate-fade-in ${borderStyle} ${textColor}`}
                    >
                      {noticia}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-500 italic select-none">
                  No hay noticias recientes en la prensa del vestuario.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ==========================================
            COLUMNA DERECHA (FIXTURE Y FEED DE LA HINCHADA)
            ========================================== */}
        <div className="space-y-6">
          {/* ==========================================
              PANEL DE RESUMEN DEL FIXTURE DE LA LIGA
              ========================================== */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between shadow-lg backdrop-blur-md">
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                📅 Calendario de Partidos
              </h3>
              
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {fixture.map((jornada) => {
                  const esHoy = jornada.fecha === fechaActual;
                  
                  // Buscar partido del usuario en esta jornada
                  const part = jornada.partidos.find(p => p.localId === equipoUsuario.id || p.visitanteId === equipoUsuario.id);
                  if (!part) return null;

                  const localObj = equipos.find(e => e.id === part.localId);
                  const visitanteObj = equipos.find(e => e.id === part.visitanteId);

                  return (
                    <div 
                      key={jornada.numero}
                      className={`p-2.5 rounded-lg border text-xs flex justify-between items-center transition-all ${
                        esHoy 
                          ? 'bg-teal-500/10 border-teal-500/30 font-bold' 
                          : 'bg-slate-950/40 border-slate-800/60'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-350">Jornada {jornada.numero}</div>
                        <div className="text-[10px] text-slate-500">{jornada.fecha}</div>
                      </div>
                      
                      <div className="font-semibold text-slate-400 text-right">
                        {localObj?.escudo} {localObj?.nombreCorto} <span className="text-slate-650 font-bold px-1 text-[10px]">vs</span> {visitanteObj?.escudo} {visitanteObj?.nombreCorto}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-4 leading-normal mt-6">
              💡 Los partidos se juegan únicamente en las fechas programadas en el fixture. Avanzá los días para progresar en el calendario.
            </div>
          </div>

          {/* ==========================================
              FEED DE REACCIONES DE LA HINCHADA
              ========================================== */}
          <FeedHinchada />
        </div>

      </div>
    </div>
  );
};
