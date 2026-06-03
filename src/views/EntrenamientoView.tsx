import React, { useState } from 'react';
import { useGame } from '../context/useGame';
import { Jugador, AtributosJugador } from '../types';

export const EntrenamientoView: React.FC = () => {
  const { 
    equipoUsuario, 
    establecerEnfoqueEntrenamiento, 
    jugadores, 
    establecerEntrenamientoIndividual,
    equipoUsuarioId 
  } = useGame();

  const [tabActiva, setTabActiva] = useState<'general' | 'individual'>('general');

  if (!equipoUsuario) return null;

  // Filtrar jugadores del club del usuario
  const jugadoresClub = jugadores.filter(j => j.idEquipo === equipoUsuarioId);

  // Obtener el enfoque actual del club
  const enfoqueActual = equipoUsuario.enfoqueEntrenamiento || 'Táctico';

  // Nombres amigables para los atributos entrenables
  const atributosTraducidos: Record<keyof AtributosJugador, string> = {
    remate: 'Remate',
    pase: 'Pase',
    regate: 'Regate',
    defensa: 'Defensa',
    tecnica: 'Técnica',
    velocidad: 'Velocidad',
    aceleracion: 'Aceleración',
    resistencia: 'Resistencia',
    fuerza: 'Fuerza',
    vision: 'Visión',
    decisiones: 'Decisiones',
    determinacion: 'Determinación',
    posicionamiento: 'Colocación',
    reflejos: 'Reflejos'
  };

  // Emojis para los atributos
  const atributosEmojis: Record<keyof AtributosJugador, string> = {
    remate: '⚽',
    pase: '🎯',
    regate: '⚡',
    defensa: '🛡️',
    tecnica: '🪄',
    velocidad: '🏃',
    aceleracion: '🏎️',
    resistencia: '🫁',
    fuerza: '💪',
    vision: '👁️',
    decisiones: '🧠',
    determinacion: '🔥',
    posicionamiento: '📍',
    reflejos: '🧤'
  };

  return (
    <div className="space-y-6">
      {/* Cabecera principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">🏋️ Planificación del Entrenamiento</h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestioná el desarrollo físico, técnico y táctico del plantel para maximizar el rendimiento y potenciar a los jóvenes.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold">
          <span className="text-slate-500 font-bold uppercase tracking-wider">Enfoque Semanal:</span>
          <span className={`font-black uppercase tracking-widest ${
            enfoqueActual === 'Físico' ? 'text-rose-400' :
            enfoqueActual === 'Táctico' ? 'text-teal-400' : 'text-blue-400'
          }`}>
            {enfoqueActual}
          </span>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="flex gap-2 border-b border-slate-800 bg-slate-950/20 p-1 rounded-xl">
        <button
          onClick={() => setTabActiva('general')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all duration-150 ${
            tabActiva === 'general'
              ? 'bg-slate-900 border border-slate-800 text-teal-400 font-black shadow-md'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          🛡️ Enfoque General (Club)
        </button>
        <button
          onClick={() => setTabActiva('individual')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all duration-150 ${
            tabActiva === 'individual'
              ? 'bg-slate-900 border border-slate-800 text-teal-400 font-black shadow-md'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          👤 Entrenamiento Individual (Jugadores)
        </button>
      </div>

      {/* Contenido según pestaña */}
      {tabActiva === 'general' ? (
        <div className="space-y-6">
          {/* Tarjeta Informativa General */}
          <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl shadow-lg backdrop-blur-md">
            <h2 className="text-lg font-bold text-white mb-2">¿Cómo influye el Enfoque Semanal?</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
              El enfoque semanal determina en qué área concentrará los esfuerzos el cuerpo técnico durante la semana de preparación. Cada enfoque tiene impactos mecánicos inmediatos en la plantilla, afectando el ritmo de recuperación y el desarrollo de atributos específicos cada lunes.
            </p>
          </div>

          {/* Grilla de 3 tarjetas de enfoque */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Tarjeta FÍSICO */}
            <div 
              onClick={() => establecerEnfoqueEntrenamiento('Físico')}
              className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 cursor-pointer group select-none ${
                enfoqueActual === 'Físico'
                  ? 'border-rose-500/50 bg-rose-950/10 shadow-[0_0_20px_rgba(239,68,68,0.08)]'
                  : 'border-slate-800 bg-slate-900/20 hover:border-slate-700 hover:bg-slate-900/30'
              }`}
            >
              {enfoqueActual === 'Físico' && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl"></div>
              )}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-xl">
                    🏃‍♂️
                  </div>
                  {enfoqueActual === 'Físico' && (
                    <span className="text-[9px] uppercase font-bold bg-rose-500 text-slate-950 px-2 py-0.5 rounded shadow-sm">
                      ACTIVO
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-extrabold text-white group-hover:text-rose-400 transition-colors mb-2">
                  Enfoque Físico
                </h3>
                <p className="text-xs text-slate-450 text-slate-450 text-slate-400 leading-relaxed mb-4">
                  Prioriza el desarrollo de la resistencia y velocidad de los futbolistas de la plantilla. Ideal para acondicionar al equipo y acelerar el crecimiento atlético de las jóvenes promesas.
                </p>

                {/* Efectos */}
                <div className="space-y-2 border-t border-slate-800/80 pt-4 mb-4 text-[11px]">
                  <div className="flex gap-2">
                    <span className="text-emerald-400">✔️</span>
                    <span className="text-slate-300">
                      <strong>+35% de probabilidad</strong> semanal (lunes) para jóvenes (<strong className="text-teal-400">edad &lt; 23</strong>) de aumentar su <strong className="text-slate-200">velocidad</strong> o <strong className="text-slate-200">resistencia</strong> en +1.
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-rose-400">⚠️</span>
                    <span className="text-slate-400 italic">
                      <strong>Penalización física:</strong> La fatiga en los entrenamientos reduce la recuperación diaria de forma (+1 para titulares y +5 para suplentes, en vez de +3/+10).
                    </span>
                  </div>
                </div>
              </div>

              <div className={`mt-2 py-2 w-full text-center rounded-xl text-xs font-bold transition-all ${
                enfoqueActual === 'Físico'
                  ? 'bg-rose-550 bg-rose-600 text-white'
                  : 'bg-slate-950/80 text-slate-400 group-hover:text-slate-200 border border-slate-850'
              }`}>
                {enfoqueActual === 'Físico' ? 'Enfoque Seleccionado' : 'Establecer Enfoque'}
              </div>
            </div>

            {/* Tarjeta TÁCTICO */}
            <div 
              onClick={() => establecerEnfoqueEntrenamiento('Táctico')}
              className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 cursor-pointer group select-none ${
                enfoqueActual === 'Táctico'
                  ? 'border-teal-500/50 bg-teal-950/10 shadow-[0_0_20px_rgba(20,184,166,0.08)]'
                  : 'border-slate-800 bg-slate-900/20 hover:border-slate-700 hover:bg-slate-900/30'
              }`}
            >
              {enfoqueActual === 'Táctico' && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl"></div>
              )}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-xl">
                    🧠
                  </div>
                  {enfoqueActual === 'Táctico' && (
                    <span className="text-[9px] uppercase font-bold bg-teal-500 text-slate-950 px-2 py-0.5 rounded shadow-sm">
                      ACTIVO
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-extrabold text-white group-hover:text-teal-400 transition-colors mb-2">
                  Enfoque Táctico
                </h3>
                <p className="text-xs text-slate-450 text-slate-400 leading-relaxed mb-4">
                  Perfecciona el entendimiento del plan de juego y la colocación en el campo. Excelente para afrontar partidos complejos donde se requiere concentración máxima.
                </p>

                {/* Efectos */}
                <div className="space-y-2 border-t border-slate-800/80 pt-4 mb-4 text-[11px]">
                  <div className="flex gap-2">
                    <span className="text-emerald-400">✔️</span>
                    <span className="text-slate-300">
                      <strong>Mental Boost:</strong> Todos los jugadores obtienen un <strong className="text-teal-400">+2 temporal</strong> en sus atributos mentales (<strong className="text-slate-200">Decisiones, Posicionamiento, Visión, Determinación</strong>) durante los partidos.
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-emerald-400">✔️</span>
                    <span className="text-slate-300">
                      <strong>Sin penalizaciones:</strong> Los futbolistas recuperan su estado físico a un ritmo estándar (+3 para titulares y +10 para suplentes diarios).
                    </span>
                  </div>
                </div>
              </div>

              <div className={`mt-2 py-2 w-full text-center rounded-xl text-xs font-bold transition-all ${
                enfoqueActual === 'Táctico'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-950/80 text-slate-400 group-hover:text-slate-200 border border-slate-850'
              }`}>
                {enfoqueActual === 'Táctico' ? 'Enfoque Seleccionado' : 'Establecer Enfoque'}
              </div>
            </div>

            {/* Tarjeta TÉCNICO */}
            <div 
              onClick={() => establecerEnfoqueEntrenamiento('Técnico')}
              className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 cursor-pointer group select-none ${
                enfoqueActual === 'Técnico'
                  ? 'border-blue-500/50 bg-blue-950/10 shadow-[0_0_20px_rgba(59,130,246,0.08)]'
                  : 'border-slate-800 bg-slate-900/20 hover:border-slate-700 hover:bg-slate-900/30'
              }`}
            >
              {enfoqueActual === 'Técnico' && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
              )}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl">
                    🪄
                  </div>
                  {enfoqueActual === 'Técnico' && (
                    <span className="text-[9px] uppercase font-bold bg-blue-500 text-slate-950 px-2 py-0.5 rounded shadow-sm">
                      ACTIVO
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-extrabold text-white group-hover:text-blue-400 transition-colors mb-2">
                  Enfoque Técnico
                </h3>
                <p className="text-xs text-slate-450 text-slate-400 leading-relaxed mb-4">
                  Centra las sesiones en pulir el control de balón, los pases, regates, la definición y los conceptos defensivos individuales. Ideal para refinar la calidad de la plantilla.
                </p>

                {/* Efectos */}
                <div className="space-y-2 border-t border-slate-800/80 pt-4 mb-4 text-[11px]">
                  <div className="flex gap-2">
                    <span className="text-emerald-400">✔️</span>
                    <span className="text-slate-300">
                      <strong>+35% de probabilidad</strong> semanal (lunes) para jóvenes (<strong className="text-teal-400">edad &lt; 23</strong>) de subir un atributo técnico al azar (<strong className="text-slate-200">Remate, Pase, Regate, Técnica, Defensa</strong>) en +1.
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-emerald-400">✔️</span>
                    <span className="text-slate-300">
                      <strong>Sin penalizaciones:</strong> Conserva el ritmo de recuperación física convencional (+3 titulares / +10 suplentes diarios).
                    </span>
                  </div>
                </div>
              </div>

              <div className={`mt-2 py-2 w-full text-center rounded-xl text-xs font-bold transition-all ${
                enfoqueActual === 'Técnico'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-950/80 text-slate-400 group-hover:text-slate-200 border border-slate-850'
              }`}>
                {enfoqueActual === 'Técnico' ? 'Enfoque Seleccionado' : 'Establecer Enfoque'}
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* Pestaña: Entrenamiento Individual */
        <div className="space-y-4">
          <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl shadow-lg backdrop-blur-md">
            <h2 className="text-lg font-bold text-white mb-2">Entrenamiento de Atributos Específicos</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
              Al asignar un entrenamiento individual a un jugador, forzarás al preparador a enfocar parte de la carga semanal en un único atributo. Cada lunes, habrá una probabilidad del <strong className="text-teal-400">40% para jóvenes (edad &lt; 23)</strong> y del <strong className="text-teal-400">20% para adultos (edad ≥ 23)</strong> de subir dicho atributo en +1 y aumentar su CA (Calidad Actual) en +1, siempre que no exceda su PA (Calidad Potencial).
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-3 py-3">Posición</th>
                    <th className="px-3 py-3 text-center">Edad</th>
                    <th className="px-4 py-3">Desarrollo (CA / PA)</th>
                    <th className="px-4 py-3">Enfoque Individual Activo</th>
                    <th className="px-4 py-3 text-right">Asignar Atributo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {jugadoresClub.map((jugador) => {
                    const esJoven = jugador.edad < 23;
                    const caPercent = jugador.ca;
                    const paPercent = jugador.pa;
                    
                    // Filtrar qué atributos se muestran según posición (Goalkeeper vs Outfield)
                    const esPOR = jugador.posicion === 'POR';
                    const clavesAtributos = Object.keys(jugador.atributos) as (keyof AtributosJugador)[];
                    const atributosFiltrados = esPOR
                      ? clavesAtributos.filter(attr => ['reflejos', 'pase', 'velocidad', 'aceleracion', 'resistencia', 'fuerza', 'decisiones', 'posicionamiento', 'determinacion'].includes(attr))
                      : clavesAtributos.filter(attr => attr !== 'reflejos');

                    return (
                      <tr 
                        key={jugador.id}
                        className="hover:bg-slate-800/25 transition-colors duration-150"
                      >
                        {/* Nombre del jugador */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200">{jugador.nombre}</span>
                            {esJoven && (
                              <span className="text-[8px] font-extrabold bg-teal-500/10 text-teal-400 border border-teal-500/20 px-1.5 py-0.5 rounded uppercase">
                                Joven
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {jugador.nacionalidad}
                          </div>
                        </td>

                        {/* Posición */}
                        <td className="px-3 py-3.5">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded tracking-wide ${
                            jugador.posicion === 'POR' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            jugador.posicion === 'DFC' || jugador.posicion === 'LI' || jugador.posicion === 'LD' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            jugador.posicion === 'MC' || jugador.posicion === 'MCO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {jugador.posicion}
                          </span>
                        </td>

                        {/* Edad */}
                        <td className={`px-3 py-3.5 text-center font-semibold ${esJoven ? 'text-teal-400' : 'text-slate-400'}`}>
                          {jugador.edad}
                        </td>

                        {/* Desarrollo CA/PA */}
                        <td className="px-4 py-3.5 w-64">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>CA: <strong className="text-slate-200">{jugador.ca}</strong></span>
                              <span>Potencial: <strong className="text-slate-200">{jugador.pa}</strong></span>
                            </div>
                            {/* Barra doble */}
                            <div className="h-2 w-full bg-slate-950 rounded-full relative overflow-hidden border border-slate-800">
                              {/* Barra PA (Fondo más claro) */}
                              <div 
                                style={{ width: `${paPercent}%` }}
                                className="h-full bg-slate-800 rounded-full absolute top-0 left-0"
                              />
                              {/* Barra CA (Frente coloreada) */}
                              <div 
                                style={{ width: `${caPercent}%` }}
                                className="h-full bg-teal-600 rounded-full absolute top-0 left-0"
                              />
                            </div>
                          </div>
                        </td>

                        {/* Enfoque Individual Activo */}
                        <td className="px-4 py-3.5">
                          {jugador.entrenamientoIndividual ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 font-medium">
                              <span>{atributosEmojis[jugador.entrenamientoIndividual]}</span>
                              <span className="capitalize">{atributosTraducidos[jugador.entrenamientoIndividual]}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">Ninguno</span>
                          )}
                        </td>

                        {/* Selector de Atributo */}
                        <td className="px-4 py-3.5 text-right">
                          <select
                            value={jugador.entrenamientoIndividual || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              establecerEntrenamientoIndividual(jugador.id, val ? val as keyof AtributosJugador : null);
                            }}
                            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500 hover:border-slate-700 cursor-pointer transition-all"
                          >
                            <option value="">🚫 Sin Entrenamiento Individual</option>
                            {atributosFiltrados.map((key) => (
                              <option key={key} value={key}>
                                {atributosEmojis[key]} {atributosTraducidos[key]} (Actual: {jugador.atributos[key]})
                              </option>
                            ))}
                          </select>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
