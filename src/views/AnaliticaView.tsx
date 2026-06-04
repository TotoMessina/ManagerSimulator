import React, { useState, useMemo } from 'react';
import { useGame } from '../context/useGame';
import { Jugador, Equipo, Posicion } from '../types';

// ==========================================
// AUXILIARES LOCALES
// ==========================================
const formatearMoneda = (valor: number): string => {
  if (valor >= 1000000) {
    return `${(valor / 1000000).toFixed(1)} M€`;
  }
  return `${(valor / 1000).toFixed(0)} m€`;
};

// Mapeo de posiciones para traducción amigable
const posNombre: Record<Posicion, string> = {
  POR: 'Portero',
  DFC: 'Defensa Central',
  LD: 'Lateral Derecho',
  LI: 'Lateral Izquierdo',
  MC: 'Mediocampista',
  MCO: 'Med. Ofensivo',
  ED: 'Extremo Derecho',
  EI: 'Extremo Izquierdo',
  DC: 'Delantero Centro'
};

// ==========================================
// CONFIGURACIÓN MATEMÁTICA DEL RADAR SVG
// ==========================================
const PILARES_KEYS = ['fisico', 'creacion', 'definicion', 'defensa', 'mental', 'estado'] as const;
const PILARES_LABELS = ['Físico 🏃', 'Creación 🪄', 'Definición ⚽', 'Defensa 🛡️', 'Mental 🧠', 'Estado ⚖️'];

const cx = 200;
const cy = 200;
const rMax = 120; // Radio máximo del círculo principal

const getCoordenadasPilar = (index: number, valor: number) => {
  // Rotar -90 grados para que el primer pilar (Físico) apunte perfectamente arriba
  const angle = (index * 2 * Math.PI) / 6 - Math.PI / 2;
  const x = cx + (valor / 100) * rMax * Math.cos(angle);
  const y = cy + (valor / 100) * rMax * Math.sin(angle);
  return { x, y };
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export const AnaliticaView: React.FC = () => {
  const { jugadores, equipos, equipoUsuarioId } = useGame();

  // --- ESTADOS DE SELECCIÓN HEAD-TO-HEAD ---
  const [jugadorAId, setJugadorAId] = useState<string>(() => {
    // Intentar inicializar con el mejor jugador del usuario
    const plantelUsuario = jugadores.filter(j => j.idEquipo === equipoUsuarioId);
    if (plantelUsuario.length > 0) {
      return [...plantelUsuario].sort((a, b) => b.ca - a.ca)[0].id;
    }
    return jugadores[0]?.id || '';
  });

  const [jugadorBId, setJugadorBId] = useState<string>(() => {
    // Intentar inicializar con la máxima estrella del rival principal (ej: real-madrid o barcelona)
    const plantelRival = jugadores.filter(j => j.idEquipo !== equipoUsuarioId);
    if (plantelRival.length > 0) {
      return [...plantelRival].sort((a, b) => b.ca - a.ca)[0].id;
    }
    return jugadores[1]?.id || '';
  });

  // Búsquedas textuales en los desplegables H2H
  const [buscarA, setBuscarA] = useState('');
  const [buscarB, setBuscarB] = useState('');
  
  // Dropdown open states
  const [showDropA, setShowDropA] = useState(false);
  const [showDropB, setShowDropB] = useState(false);

  // --- ESTADOS DEL FILTRO DE RENDIMIENTO / GANGAS ---
  const [filtroPosicion, setFiltroPosicion] = useState<string>('TODOS');
  const [busquedaGanga, setBusquedaGanga] = useState('');
  const [ordenGanga, setOrdenGanga] = useState<'eficiencia' | 'calificacion' | 'goles' | 'precio'>('eficiencia');

  // --- JUGADORES FILTRADOS PARA SELECTORES ---
  const jugadoresFiltradosA = useMemo(() => {
    if (!buscarA.trim()) return jugadores.slice(0, 10);
    const q = buscarA.toLowerCase();
    return jugadores
      .filter(j => j.nombre.toLowerCase().includes(q))
      .slice(0, 8);
  }, [jugadores, buscarA]);

  const jugadoresFiltradosB = useMemo(() => {
    if (!buscarB.trim()) return jugadores.slice(0, 10);
    const q = buscarB.toLowerCase();
    return jugadores
      .filter(j => j.nombre.toLowerCase().includes(q))
      .slice(0, 8);
  }, [jugadores, buscarB]);

  // --- OBJETOS DE JUGADORES SELECCIONADOS ---
  const jugadorA = useMemo(() => jugadores.find(j => j.id === jugadorAId) || null, [jugadores, jugadorAId]);
  const jugadorB = useMemo(() => jugadores.find(j => j.id === jugadorBId) || null, [jugadores, jugadorBId]);

  const clubA = useMemo(() => equipoUsuarioId ? equipos.find(e => e.id === jugadorA?.idEquipo) || null : null, [equipos, jugadorA]);
  const clubB = useMemo(() => equipoUsuarioId ? equipos.find(e => e.id === jugadorB?.idEquipo) || null : null, [equipos, jugadorB]);

  // --- CÁLCULO DE PILARES DE RADAR ---
  const calcularPilares = (j: Jugador) => {
    const rem = j.atributos.remate || 10;
    const pas = j.atributos.pase || 10;
    const reg = j.atributos.regate || 10;
    const def = j.atributos.defensa || 10;
    const tec = j.atributos.tecnica || 10;
    const vel = j.atributos.velocidad || 10;
    const ace = j.atributos.aceleracion || 10;
    const res = j.atributos.resistencia || 10;
    const fue = j.atributos.fuerza || 10;
    const vis = j.atributos.vision || 10;
    const dec = j.atributos.decisiones || 10;
    const det = j.atributos.determinacion || 10;
    const pos = j.atributos.posicionamiento || 10;
    const ref = j.atributos.reflejos || 1;

    return {
      fisico: Math.round(((vel + fue + ace + res) / 4) * 5),
      creacion: Math.round(((pas + vis + reg + tec) / 4) * 5),
      definicion: j.posicion === 'POR' ? Math.round(ref * 5) : Math.round(rem * 5),
      defensa: Math.round(((def + pos) / 2) * 5),
      mental: Math.round(((det + dec) / 2) * 5),
      estado: Math.round((j.formaFisica + j.moral) / 2)
    };
  };

  const pilaresA = useMemo(() => jugadorA ? calcularPilares(jugadorA) : null, [jugadorA]);
  const pilaresB = useMemo(() => jugadorB ? calcularPilares(jugadorB) : null, [jugadorB]);

  // Coordenadas de los polígonos
  const puntosA = useMemo(() => pilaresA ? PILARES_KEYS.map((k, i) => getCoordenadasPilar(i, pilaresA[k])) : [], [pilaresA]);
  const puntosB = useMemo(() => pilaresB ? PILARES_KEYS.map((k, i) => getCoordenadasPilar(i, pilaresB[k])) : [], [pilaresB]);

  // --- PROCESAR TABLA DE GANGAS ---
  const listaGangas = useMemo(() => {
    return jugadores.map(j => {
      const club = equipos.find(e => e.id === j.idEquipo);
      const calif = j.calificacionMedia || 6.5;
      const val = j.valorMercado || 1000000;
      
      // Índice de Inteligencia Deportiva: Calificación respecto a su coste
      // Los jugadores con buen rendimiento de partidos jugados y valor sensato encabezan la lista
      const eficiencia = Math.round((calif * calif * 12000000) / val);
      
      // Clasificación de gangas
      let gangaLabel = 'Rendimiento Estándar';
      let gangaColor = 'bg-slate-500/10 text-slate-400 border-slate-500/20';

      if (calif >= 7.00 && val <= 15000000) {
        gangaLabel = '🔥 Ganga Absoluta';
        gangaColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse';
      } else if (calif >= 7.30) {
        gangaLabel = '⭐ Rendimiento Top';
        gangaColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      } else if (j.edad <= 23 && (j.pa - j.ca) >= 7 && val <= 12000000) {
        gangaLabel = '💎 Joya Futura';
        gangaColor = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      }

      return {
        ...j,
        clubNombre: club?.nombre || 'Desconocido',
        clubEscudo: club?.escudo || '⚽',
        eficiencia,
        val,
        calif,
        gangaLabel,
        gangaColor
      };
    })
    .filter(j => {
      if (filtroPosicion !== 'TODOS' && j.posicion !== filtroPosicion) return false;
      if (busquedaGanga.trim() !== '') {
        const q = busquedaGanga.toLowerCase();
        return j.nombre.toLowerCase().includes(q) || j.clubNombre.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (ordenGanga === 'calificacion') return b.calif - a.calif;
      if (ordenGanga === 'goles') return (b.goles + b.asistencias) - (a.goles + a.asistencias);
      if (ordenGanga === 'precio') return a.val - b.val;
      return b.eficiencia - a.eficiencia;
    });
  }, [jugadores, equipos, filtroPosicion, busquedaGanga, ordenGanga]);

  return (
    <div className="space-y-6">
      
      {/* ── CABECERA PREMIUM ─────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-[-30%] right-[-10%] w-96 h-96 rounded-full bg-blue-500/10 blur-[90px] pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[-10%] w-96 h-96 rounded-full bg-teal-500/10 blur-[90px] pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="text-4xl">📊</div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-100 uppercase tracking-wide">
              Centro de Analítica e Inteligencia Deportiva
            </h2>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xl">
              Compará atributos detallados mediante el gráfico de radar dinámico y localizá gangas eficientes en el mercado comparando rendimiento de cancha vs valor financiero.
            </p>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN 1: COMPARADOR HEAD-TO-HEAD (H2H) ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Controles de Selección e Info (Lg: 4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 space-y-5">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2">
            ⚔️ Selección de Jugadores H2H
          </h3>

          {/* Selector Jugador A (Cian) */}
          <div className="space-y-2 relative">
            <label className="text-[10px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span> Jugador A (Azul/Cian)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={jugadorA ? `${jugadorA.nombre} (${jugadorA.posicion})` : 'Buscar jugador A...'}
                value={buscarA}
                onChange={(e) => { setBuscarA(e.target.value); setShowDropA(true); }}
                onFocus={() => setShowDropA(true)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-teal-500"
              />
              {showDropA && (
                <div className="absolute z-30 w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                  {jugadoresFiltradosA.map(j => (
                    <div
                      key={j.id}
                      onClick={() => {
                        setJugadorAId(j.id);
                        setBuscarA('');
                        setShowDropA(false);
                      }}
                      className="p-2.5 hover:bg-slate-900 cursor-pointer text-xs flex justify-between border-b border-slate-900/80"
                    >
                      <span className="font-bold text-slate-200">{j.nombre}</span>
                      <span className="text-[10px] text-teal-400 uppercase font-mono">{j.posicion}</span>
                    </div>
                  ))}
                  {jugadoresFiltradosA.length === 0 && (
                    <div className="p-2.5 text-xs text-slate-600">No se hallaron resultados</div>
                  )}
                </div>
              )}
            </div>
            {jugadorA && (
              <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-3 space-y-1 text-xs">
                <div className="font-bold text-white flex justify-between">
                  <span>{jugadorA.nombre}</span>
                  <span className="text-teal-400">{posNombre[jugadorA.posicion]}</span>
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>Club: <strong className="text-slate-400">{clubA?.nombre || 'IA'}</strong></span>
                  <span>Edad: <strong className="text-slate-400">{jugadorA.edad} años</strong></span>
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>Valor: <strong className="text-slate-300 font-mono">{formatearMoneda(jugadorA.valorMercado)}</strong></span>
                  <span>Calificación: <strong className="text-teal-400 font-mono">⭐ {jugadorA.calificacionMedia || '6.50'}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Selector Jugador B (Rojo) */}
          <div className="space-y-2 relative">
            <label className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span> Jugador B (Rojo/Rosa)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={jugadorB ? `${jugadorB.nombre} (${jugadorB.posicion})` : 'Buscar jugador B...'}
                value={buscarB}
                onChange={(e) => { setBuscarB(e.target.value); setShowDropB(true); }}
                onFocus={() => setShowDropB(true)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-rose-500"
              />
              {showDropB && (
                <div className="absolute z-30 w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                  {jugadoresFiltradosB.map(j => (
                    <div
                      key={j.id}
                      onClick={() => {
                        setJugadorBId(j.id);
                        setBuscarB('');
                        setShowDropB(false);
                      }}
                      className="p-2.5 hover:bg-slate-900 cursor-pointer text-xs flex justify-between border-b border-slate-900/80"
                    >
                      <span className="font-bold text-slate-200">{j.nombre}</span>
                      <span className="text-[10px] text-rose-400 uppercase font-mono">{j.posicion}</span>
                    </div>
                  ))}
                  {jugadoresFiltradosB.length === 0 && (
                    <div className="p-2.5 text-xs text-slate-600">No se hallaron resultados</div>
                  )}
                </div>
              )}
            </div>
            {jugadorB && (
              <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-3 space-y-1 text-xs">
                <div className="font-bold text-white flex justify-between">
                  <span>{jugadorB.nombre}</span>
                  <span className="text-rose-400">{posNombre[jugadorB.posicion]}</span>
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>Club: <strong className="text-slate-400">{clubB?.nombre || 'IA'}</strong></span>
                  <span>Edad: <strong className="text-slate-400">{jugadorB.edad} años</strong></span>
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>Valor: <strong className="text-slate-300 font-mono">{formatearMoneda(jugadorB.valorMercado)}</strong></span>
                  <span>Calificación: <strong className="text-rose-400 font-mono">⭐ {jugadorB.calificacionMedia || '6.50'}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Tips de Scouting */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-850 text-[10px] text-slate-500 leading-relaxed">
            💡 <strong className="text-slate-400">Scout Tip:</strong> Compará jugadores con posiciones similares para descubrir quién responde mejor a tu esquema. Un mediocampista con alto valor de **Creación** potenciará la posesión, mientras que uno con alta **Defensa** te dará un cerrojo sólido.
          </div>
        </div>

        {/* Cancha del Gráfico de Radar SVG (Lg: 4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 flex flex-col items-center justify-center min-h-[430px] shadow-2xl relative">
          <h3 className="absolute top-5 left-5 text-xs font-black text-slate-400 uppercase tracking-widest">
            📊 Gráfico de Radar H2H
          </h3>
          
          {jugadorA && jugadorB && pilaresA && pilaresB ? (
            <svg
              viewBox="0 0 400 400"
              className="w-full max-w-[300px] sm:max-w-[360px] aspect-square mt-6 flex-shrink-0 animate-fade-in relative z-10"
            >
              {/* Círculos y Polígonos de Fondo (Escalas del Radar 25%, 50%, 75%, 100%) */}
              {[25, 50, 75, 100].map((nivel) => {
                const puntosNivel = [0, 1, 2, 3, 4, 5].map(i => getCoordenadasPilar(i, nivel));
                return (
                  <polygon
                    key={nivel}
                    points={puntosNivel.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.07)"
                    strokeWidth="1"
                    strokeDasharray={nivel === 100 ? 'none' : '4, 4'}
                  />
                );
              })}

              {/* Líneas Radiales de Ejes */}
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const pOuter = getCoordenadasPilar(i, 100);
                return (
                  <line
                    key={i}
                    x1={cx}
                    y1={cy}
                    x2={pOuter.x}
                    y2={pOuter.y}
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Polígono Jugador A (Cian Translúcido) */}
              <polygon
                points={puntosA.map(p => `${p.x},${p.y}`).join(' ')}
                fill="rgba(20, 184, 166, 0.22)"
                stroke="#14b8a6"
                strokeWidth="2.5"
                className="transition-all duration-300"
              />

              {/* Polígono Jugador B (Rojo Translúcido) */}
              <polygon
                points={puntosB.map(p => `${p.x},${p.y}`).join(' ')}
                fill="rgba(244, 63, 94, 0.22)"
                stroke="#f43f5e"
                strokeWidth="2.5"
                className="transition-all duration-300"
              />

              {/* Etiquetas de Pilares en los Extremos */}
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
                const labelX = cx + (rMax + 24) * Math.cos(angle);
                const labelY = cy + (rMax + 14) * Math.sin(angle);
                
                let textAnchor: 'middle' | 'start' | 'end' = 'middle';
                if (Math.cos(angle) > 0.1) textAnchor = 'start';
                if (Math.cos(angle) < -0.1) textAnchor = 'end';

                return (
                  <text
                    key={i}
                    x={labelX}
                    y={labelY}
                    textAnchor={textAnchor}
                    dominantBaseline="middle"
                    className="text-[10px] font-black fill-slate-400 uppercase tracking-wide font-mono"
                  >
                    {PILARES_LABELS[i]}
                  </text>
                );
              })}

              {/* Nodos interactivos de Jugador A (Puntos Cian) */}
              {puntosA.map((p, i) => (
                <g key={`node-a-${i}`} className="group/dot relative">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4.5"
                    className="fill-teal-400 stroke-slate-950 stroke-[2px] cursor-pointer transition-all duration-150 hover:r-7"
                  />
                  <title>{`${PILARES_LABELS[i]} (Jugador A): ${Object.values(pilaresA)[i]}/100`}</title>
                </g>
              ))}

              {/* Nodos interactivos de Jugador B (Puntos Rojos) */}
              {puntosB.map((p, i) => (
                <g key={`node-b-${i}`} className="group/dot relative">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4.5"
                    className="fill-rose-500 stroke-slate-955 stroke-[2px] cursor-pointer transition-all duration-150 hover:r-7"
                  />
                  <title>{`${PILARES_LABELS[i]} (Jugador B): ${Object.values(pilaresB)[i]}/100`}</title>
                </g>
              ))}

              {/* Círculo central estético */}
              <circle cx={cx} cy={cy} r="3" fill="#ffffff" opacity="0.3" />
            </svg>
          ) : (
            <div className="text-center text-xs text-slate-500">Seleccioná dos jugadores para proyectar el radar comparativo.</div>
          )}

          {/* Leyenda del Radar */}
          {jugadorA && jugadorB && (
            <div className="flex gap-6 mt-4 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5 text-teal-400">
                <span className="w-2.5 h-2.5 rounded bg-teal-500/20 border border-teal-500"></span>
                <span>{jugadorA.nombre.split(' ').slice(-1)[0]}</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded bg-rose-500/20 border border-rose-500"></span>
                <span>{jugadorB.nombre.split(' ').slice(-1)[0]}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tabla Comparativa de Pilares (Lg: 4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 space-y-4 min-h-[430px]">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2">
            📊 Desglose de Índices de Radar
          </h3>

          {jugadorA && jugadorB && pilaresA && pilaresB ? (
            <div className="space-y-4 py-2">
              {PILARES_KEYS.map((k, idx) => {
                const valA = pilaresA[k];
                const valB = pilaresB[k];
                const ganador = valA > valB ? 'A' : valA < valB ? 'B' : 'E';

                return (
                  <div key={k} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-extrabold uppercase tracking-wide">
                      <span className={ganador === 'A' ? 'text-teal-400' : 'text-slate-400'}>{valA}</span>
                      <span className="text-slate-300 text-[10px]">{PILARES_LABELS[idx]}</span>
                      <span className={ganador === 'B' ? 'text-rose-400' : 'text-slate-400'}>{valB}</span>
                    </div>

                    {/* Barra de progreso H2H */}
                    <div className="h-2 w-full bg-slate-950 rounded-full border border-slate-850 overflow-hidden flex relative shadow-inner">
                      {/* Lado Izquierdo (Jugador A) */}
                      <div 
                        style={{ width: `${(valA / (valA + valB)) * 100}%` }}
                        className={`h-full transition-all duration-300 ${
                          ganador === 'A' ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.3)]' : 'bg-slate-700/60'
                        }`}
                      ></div>
                      {/* Divisor */}
                      <div className="w-[1.5px] bg-slate-950 h-full z-10"></div>
                      {/* Lado Derecho (Jugador B) */}
                      <div 
                        style={{ width: `${(valB / (valA + valB)) * 100}%` }}
                        className={`h-full transition-all duration-300 ${
                          ganador === 'B' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]' : 'bg-slate-700/60'
                        }`}
                      ></div>
                    </div>
                  </div>
                );
              })}
              
              <div className="border-t border-slate-850 pt-4 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Conclusión de los Analistas</span>
                <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3 text-[11px] text-slate-300 leading-relaxed font-mono shadow-inner">
                  {(() => {
                    const winsA = PILARES_KEYS.filter(k => pilaresA[k] > pilaresB[k]).length;
                    const winsB = PILARES_KEYS.filter(k => pilaresB[k] > pilaresA[k]).length;
                    
                    if (winsA > winsB) {
                      return `🎯 ${jugadorA.nombre.split(' ').slice(-1)[0]} domina en ${winsA} de los 6 pilares clave, perfilándose como una opción más decisiva en su rol.`;
                    } else if (winsB > winsA) {
                      return `🎯 ${jugadorB.nombre.split(' ').slice(-1)[0]} domina en ${winsB} de los 6 pilares clave, ofreciendo mayor solidez técnica global.`;
                    } else {
                      return `⚖️ Ambos jugadores muestran un equilibrio perfecto en sus pilares (empate ${winsA} a ${winsB}). La elección dependerá de las necesidades de tu esquema táctico.`;
                    }
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-xs text-slate-500 py-12">Proyectando datos detallados de comparación...</div>
          )}
        </div>

      </div>

      {/* ── SECCIÓN 2: FILTRO DE RENDIMIENTO ESCALONADO (BARGAIN HUNTER) ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* Controles del Listado */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
              🔍 Detector de Gangas e Inversión Inteligente
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Analizá la relación Calidad/Precio: Jugadores con calificaciones oficiales de partido altas y bajo valor de mercado.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Buscador */}
            <input
              type="text"
              placeholder="Buscar por nombre o club..."
              value={busquedaGanga}
              onChange={(e) => setBusquedaGanga(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-500 w-full md:w-56"
            />

            {/* Selector de Posición */}
            <select
              value={filtroPosicion}
              onChange={(e) => setFiltroPosicion(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-bold focus:outline-none focus:border-teal-500"
            >
              <option value="TODOS">Todas las Posiciones</option>
              <option value="POR">Porteros</option>
              <option value="DFC">Defensas Centrales</option>
              <option value="LD">Laterales Derechos</option>
              <option value="LI">Laterales Izquierdos</option>
              <option value="MC">Mediocampistas</option>
              <option value="MCO">Med. Ofensivos</option>
              <option value="ED">Extremos Derechos</option>
              <option value="EI">Extremos Izquierdos</option>
              <option value="DC">Delanteros</option>
            </select>

            {/* Selector de Ordenamiento */}
            <select
              value={ordenGanga}
              onChange={(e) => setOrdenGanga(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-bold focus:outline-none focus:border-teal-500"
            >
              <option value="eficiencia">Ordenar por Calidad/Precio</option>
              <option value="calificacion">Ordenar por Calificación Media</option>
              <option value="goles">Ordenar por Goles + Asistencias</option>
              <option value="precio">Ordenar por Menor Valor</option>
            </select>
          </div>
        </div>

        {/* Tabla de Dispersión / Rendimiento Escalonado */}
        <div className="overflow-x-auto pr-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="py-3 px-4">Jugador / Posición</th>
                <th className="py-3 px-2">Club</th>
                <th className="py-3 px-2 text-center">Partidos</th>
                <th className="py-3 px-2 text-center">Goles</th>
                <th className="py-3 px-2 text-center">Asistencias</th>
                <th className="py-3 px-2 text-center">Calificación</th>
                <th className="py-3 px-2 text-right">Valor de Mercado</th>
                <th className="py-3 px-4 text-center">Ratio Fichaje Inteligente</th>
                <th className="py-3 px-4 text-center">Recomendación Scout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60">
              {listaGangas.length > 0 ? (
                listaGangas.slice(0, 15).map(j => (
                  <tr key={j.id} className="hover:bg-slate-950/40 transition-colors">
                    {/* Nombre */}
                    <td className="py-3.5 px-4 font-bold text-slate-100">
                      <div className="flex flex-col">
                        <span className="text-slate-200">{j.nombre}</span>
                        <span className="text-[10px] text-slate-500 font-medium font-mono">{posNombre[j.posicion]}</span>
                      </div>
                    </td>
                    {/* Club */}
                    <td className="py-3.5 px-2 text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="text-base">{j.clubEscudo}</span>
                        <span className="truncate max-w-[100px]" title={j.clubNombre}>{j.clubNombre.split(' ').slice(0, 2).join(' ')}</span>
                      </span>
                    </td>
                    {/* Partidos */}
                    <td className="py-3.5 px-2 text-center font-mono font-medium text-slate-400">{j.partidosJugados || 0}</td>
                    {/* Goles */}
                    <td className="py-3.5 px-2 text-center font-mono font-medium text-slate-300">{j.goles || 0}</td>
                    {/* Asistencias */}
                    <td className="py-3.5 px-2 text-center font-mono font-medium text-slate-350">{j.asistencias || 0}</td>
                    {/* Calificación */}
                    <td className="py-3.5 px-2 text-center">
                      <span className="px-2 py-0.5 rounded font-mono font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        {j.calif.toFixed(2)}
                      </span>
                    </td>
                    {/* Valor de Mercado */}
                    <td className="py-3.5 px-2 text-right font-mono font-bold text-slate-300">
                      {formatearMoneda(j.val)}
                    </td>
                    {/* Ratio Fichaje Inteligente */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="h-1.5 w-24 bg-slate-950 rounded-full border border-slate-850 overflow-hidden shadow-inner flex">
                          <div 
                            style={{ width: `${Math.min(100, j.eficiencia)}%` }}
                            className={`h-full rounded-full ${
                              j.eficiencia >= 85 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                              j.eficiencia >= 50 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                              'bg-slate-700'
                            }`}
                          />
                        </div>
                        <span className="text-[9px] font-mono font-bold text-slate-400">{j.eficiencia} pts</span>
                      </div>
                    </td>
                    {/* Recomendación */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${j.gangaColor}`}>
                        {j.gangaLabel}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-slate-500">
                    No se hallaron jugadores que cumplan los criterios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
