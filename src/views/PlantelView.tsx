import React, { useState } from 'react';
import { useGame } from '../context/useGame';
import { Jugador, AtributosJugador } from '../types';

// ==========================================
// FORMATEADORES AUXILIARES
// ==========================================
const formatearMoneda = (valor: number): string => {
  if (valor >= 1000000) {
    return `${(valor / 1000000).toFixed(1)} M€`;
  }
  return `${(valor / 1000).toFixed(0)} m€`;
};

// Emojis y etiquetas para la moral
const obtenerMoralDetalle = (moral: number): { emoji: string; texto: string; color: string } => {
  if (moral >= 90) return { emoji: '🤩', texto: 'Excelente', color: 'text-teal-400' };
  if (moral >= 75) return { emoji: '🙂', texto: 'Buena', color: 'text-emerald-400' };
  if (moral >= 50) return { emoji: '😐', texto: 'Aceptable', color: 'text-yellow-400' };
  return { emoji: '😞', texto: 'Baja', color: 'text-rose-400' };
};

// Helper para calcular dinámicamente los 3 mejores atributos de un jugador
const obtenerMejoresAtributos = (atributos: AtributosJugador, posicion: string): { nombre: string; valor: number }[] => {
  const nombresAmigables: Record<keyof AtributosJugador, string> = {
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
    determinacion: 'Det.',
    posicionamiento: 'Colocación',
    reflejos: 'Reflejos'
  };

  const lista = Object.keys(atributos).map((key) => {
    const attrKey = key as keyof AtributosJugador;
    return {
      nombre: nombresAmigables[attrKey] || key,
      valor: atributos[attrKey]
    };
  });

  // Omitimos reflejos para jugadores de campo para que no se sesgue el top técnico
  const filtrados = posicion === 'POR'
    ? lista
    : lista.filter(a => a.nombre !== 'Reflejos');

  return filtrados.sort((a, b) => b.valor - a.valor).slice(0, 3);
};

export const PlantelView: React.FC = () => {
  const { jugadores, equipoUsuarioId, equipoUsuario, renovarContrato, toggleIntransferible, toggleTransferible, designarCapitan } = useGame();
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState<Jugador | null>(null);
  const [jugadorARenovar, setJugadorARenovar] = useState<Jugador | null>(null);
  const [clausulaRenovacion, setClausulaRenovacion] = useState<number>(0);

  // Filtrar jugadores del equipo del usuario
  const jugadoresFiltrados = jugadores.filter(j => j.idEquipo === equipoUsuarioId);

  // Identificar el once inicial teórico (los 11 mejores por CA) para etiquetarlos
  const titularesIds = [...jugadoresFiltrados]
    .sort((a, b) => b.ca - a.ca)
    .slice(0, 11)
    .map(j => j.id);

  // ==========================================
  // RENDERIZADO DE LAS BARRAS DE PROGRESO DE ATRIBUTOS (1-20)
  // ==========================================
  const renderFilaAtributo = (nombre: string, valor: number) => {
    // Determinar color de barra en base al rango de FM
    let colorBarra = 'bg-rose-500'; // 1-10: Rojo
    let colorTexto = 'text-rose-400';

    if (valor >= 16) {
      colorBarra = 'bg-emerald-500'; // 16-20: Verde élite
      colorTexto = 'text-emerald-400 font-bold';
    } else if (valor >= 11) {
      colorBarra = 'bg-amber-500'; // 11-15: Amarillo/Ámbar bueno
      colorTexto = 'text-amber-400';
    }

    return (
      <div key={nombre} className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">{nombre}</span>
          <span className={colorTexto}>{valor}</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/30">
          <div
            style={{ width: `${(valor / 20) * 100}%` }}
            className={`h-full rounded-full transition-all duration-500 ${colorBarra}`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* Cabecera de la vista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Plantilla del Primer Equipo</h1>
          <p className="text-xs text-slate-400 mt-1">
            Visualización detallada de jugadores, variables de estado físico, valor de mercado y aptitudes tácticas.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            {jugadoresFiltrados.length} Futbolistas Inscritos
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* ==========================================
            TABLA PRINCIPAL DE JUGADORES
            ========================================== */}
        <div className="xl:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-3 py-3">Posición</th>
                  <th className="px-3 py-3 text-center">Edad</th>
                  <th className="px-3 py-3 text-center">Físico</th>
                  <th className="px-3 py-3 text-center">Moral</th>
                  <th className="px-3 py-3">Mejores Cualidades / CA</th>
                  <th className="px-3 py-3 text-center">Contrato</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {jugadoresFiltrados.map((jugador) => {
                  const esTitular = titularesIds.includes(jugador.id);
                  const moralDet = obtenerMoralDetalle(jugador.moral);
                  const mejoresAtributos = obtenerMejoresAtributos(jugador.atributos, jugador.posicion);

                  return (
                    <tr
                      key={jugador.id}
                      onClick={() => setJugadorSeleccionado(jugador)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition-colors duration-150 group ${jugadorSeleccionado?.id === jugador.id ? 'bg-slate-800/60 font-semibold' : ''
                        }`}
                    >
                      {/* Nombre y Estado Once Inicial */}
                      <td className="px-4 py-3.5 flex items-center gap-2">
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded leading-none ${esTitular ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'
                          }`}>
                          {esTitular ? 'ONCE' : 'RES'}
                        </span>
                        <div>
                          <div className="text-slate-200 group-hover:text-teal-400 transition-colors font-semibold flex items-center gap-1.5 flex-wrap">
                            {jugador.nombre}
                            {jugador.esCapitan && (
                              <span className="text-[8px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 tracking-wider uppercase flex items-center gap-0.5" title="Capitán de la plantilla">👑 Cap.</span>
                            )}
                            {jugador.intransferible && (
                              <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/25 text-amber-300 font-bold border border-amber-500/30 tracking-wider uppercase" title="Jugador marcado como intransferible (protegido)">🛡️ Prot.</span>
                            )}
                            {jugador.listaTransferibles && (
                              <span className="text-[8px] px-1 py-0.5 rounded bg-rose-500/20 text-rose-350 font-bold border border-rose-500/30 tracking-wider uppercase flex items-center gap-0.5" title="En lista de transferibles">💸 Transf.</span>
                            )}
                            {jugador.promesaMinutosActive && (
                              <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/25 text-amber-300 font-bold border border-amber-500/30 tracking-wider uppercase" title="Promesa de minutos activa">Promesa</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center flex-wrap gap-x-1.5 gap-y-0.5">
                            <span>{jugador.nacionalidad}</span>
                            <span>•</span>
                            <span className={`text-[9px] font-bold ${jugador.personalidad === 'Líder' ? 'text-cyan-400' :
                                jugador.personalidad === 'Ambicioso' ? 'text-amber-400' :
                                  jugador.personalidad === 'Profesional' ? 'text-emerald-400' :
                                    jugador.personalidad === 'Problemático' ? 'text-rose-400' :
                                      'text-fuchsia-400'
                              }`} title={`Personalidad: ${jugador.personalidad}`}>
                              {jugador.personalidad === 'Líder' ? '⭐ Líder' :
                                jugador.personalidad === 'Ambicioso' ? '⚡ Ambicioso' :
                                  jugador.personalidad === 'Profesional' ? '💼 Profesional' :
                                    jugador.personalidad === 'Problemático' ? '⚠️ Problemático' :
                                      '🛡️ Leal'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Posición con badges customizados */}
                      <td className="px-3 py-3.5">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded tracking-wide ${jugador.posicion === 'POR' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            jugador.posicion === 'DFC' || jugador.posicion === 'LI' || jugador.posicion === 'LD' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              jugador.posicion === 'MC' || jugador.posicion === 'MCO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                          {jugador.posicion}
                        </span>
                      </td>

                      {/* Edad */}
                      <td className="px-3 py-3.5 text-center text-slate-300 font-medium">
                        {jugador.edad}
                      </td>

                      {/* Forma Física */}
                      <td className="px-3 py-3.5 text-center font-mono">
                        <span className={`font-bold ${jugador.formaFisica >= 90 ? 'text-emerald-400' :
                            jugador.formaFisica >= 70 ? 'text-amber-500' :
                              'text-rose-500'
                          }`}>
                          {jugador.formaFisica}%
                        </span>
                      </td>

                      {/* Moral */}
                      <td className="px-3 py-3.5 text-center">
                        <span
                          title={`Moral: ${moralDet.texto} (${jugador.moral}%)`}
                          className={`inline-flex items-center gap-1 font-semibold ${moralDet.color}`}
                        >
                          <span className="text-sm">{moralDet.emoji}</span>
                          <span className="hidden sm:inline text-[10px]">{moralDet.texto}</span>
                        </span>
                      </td>

                      {/* CA + Top 3 Atributos */}
                      <td className="px-3 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Insignia CA */}
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-950 text-teal-400 border border-teal-500/20 font-mono">
                            {jugador.ca} CA
                          </span>
                          {/* Badges de Atributos */}
                          {mejoresAtributos.map((attr) => (
                            <span
                              key={attr.nombre}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/30"
                              title={`${attr.nombre}: ${attr.valor}`}
                            >
                              {attr.nombre} ({attr.valor})
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Contrato */}
                      <td className="px-3 py-3.5 text-center font-semibold font-mono">
                        {jugador.mesesContrato !== undefined ? (
                          <span className={
                            jugador.mesesContrato <= 6 ? 'text-rose-400 animate-pulse font-bold' :
                              jugador.mesesContrato <= 12 ? 'text-amber-400' :
                                'text-slate-400'
                          }>
                            {jugador.mesesContrato} meses
                          </span>
                        ) : '---'}
                      </td>

                      {/* Valor de Mercado */}
                      <td className="px-4 py-3.5 text-right font-extrabold text-slate-200">
                        {formatearMoneda(jugador.valorMercado)}
                      </td>

                      {/* Acciones: Renovar + Toggles */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setJugadorARenovar(jugador);
                              setClausulaRenovacion(Math.round((jugador.valorMercado * 1.5) / 1000) * 1000);
                            }}
                            className="px-1.5 py-1 bg-teal-600/20 hover:bg-teal-600 text-teal-400 hover:text-white border border-teal-500/30 rounded text-[9px] uppercase font-bold tracking-wider transition-all"
                            title="Renovar contrato"
                          >
                            Renovar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleIntransferible(jugador.id);
                            }}
                            title={jugador.intransferible ? 'Quitar protección: el jugador podrá ser vendido' : 'Marcar como intransferible (Proteger de ofertas)'}
                            className={`px-1.5 py-1 rounded text-[9px] font-bold tracking-wider border transition-all ${jugador.intransferible
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500 hover:text-black'
                                : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700 hover:text-slate-300'
                              }`}
                          >
                            {jugador.intransferible ? '🛡' : '🔓'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTransferible(jugador.id);
                            }}
                            title={jugador.listaTransferibles ? 'Quitar de la lista de transferibles' : 'Poner en lista de transferibles (Atraer ofertas)'}
                            className={`px-1.5 py-1 rounded text-[9px] font-bold tracking-wider border transition-all ${jugador.listaTransferibles
                                ? 'bg-rose-500/20 text-rose-350 border-rose-500/30 hover:bg-rose-500 hover:text-white'
                                : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700 hover:text-slate-300'
                              }`}
                          >
                            💸
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              designarCapitan(jugador.id);
                            }}
                            disabled={jugador.esCapitan}
                            title={jugador.esCapitan ? 'Este jugador es el capitán actual' : 'Designar como capitán del equipo'}
                            className={`px-1.5 py-1 rounded text-[9px] font-bold tracking-wider border transition-all ${jugador.esCapitan
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 cursor-default'
                                : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700 hover:text-slate-300'
                              }`}
                          >
                            👑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ==========================================
            FICHA LATERAL DE JUGADOR (Football Manager Style)
            ========================================== */}
        <div className="xl:col-span-1">
          {jugadorSeleccionado ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">

              {/* Botón para cerrar perfil móvil */}
              <button
                onClick={() => setJugadorSeleccionado(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-1"
                aria-label="Cerrar detalles"
              >
                ✕
              </button>

              {/* Cabecera / Identidad */}
              <div className="p-5 bg-slate-950 border-b border-slate-800">
                <div>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded tracking-wider leading-none ${jugadorSeleccionado.posicion === 'POR' ? 'bg-yellow-500/10 text-yellow-400' :
                      jugadorSeleccionado.posicion === 'DFC' || jugadorSeleccionado.posicion === 'LI' || jugadorSeleccionado.posicion === 'LD' ? 'bg-blue-500/10 text-blue-400' :
                        jugadorSeleccionado.posicion === 'MC' || jugadorSeleccionado.posicion === 'MCO' ? 'bg-emerald-500/10 text-emerald-400' :
                          'bg-rose-500/10 text-rose-400'
                    }`}>
                    {jugadorSeleccionado.posicion}
                  </span>

                  <h3 className="text-xl font-extrabold text-white mt-2 tracking-tight leading-tight">
                    {jugadorSeleccionado.nombre}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {jugadorSeleccionado.nacionalidad} · {jugadorSeleccionado.edad} años
                  </p>
                </div>

                {/* Calidades CA / PA */}
                <div className="grid grid-cols-2 gap-4 mt-5">
                  <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 text-center">
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Calidad Actual</span>
                    <span className="text-2xl font-black text-teal-400 font-mono block mt-0.5">{jugadorSeleccionado.ca}/100</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 text-center">
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Potencial (PA)</span>
                    <span className="text-2xl font-black text-slate-300 font-mono block mt-0.5">{jugadorSeleccionado.pa}/100</span>
                  </div>
                </div>

                {/* Personalidad del Vestuario */}
                <div className="mt-4 p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Personalidad del Vestuario</span>
                    <span className={`text-xs font-black block mt-0.5 ${jugadorSeleccionado.personalidad === 'Líder' ? 'text-cyan-400' :
                        jugadorSeleccionado.personalidad === 'Ambicioso' ? 'text-amber-400' :
                          jugadorSeleccionado.personalidad === 'Profesional' ? 'text-emerald-400' :
                            jugadorSeleccionado.personalidad === 'Problemático' ? 'text-rose-400' :
                              'text-fuchsia-400'
                      }`}>
                      {jugadorSeleccionado.personalidad === 'Líder' ? '⭐ Líder' :
                        jugadorSeleccionado.personalidad === 'Ambicioso' ? '⚡ Ambicioso' :
                          jugadorSeleccionado.personalidad === 'Profesional' ? '💼 Profesional' :
                            jugadorSeleccionado.personalidad === 'Problemático' ? '⚠️ Problemático' :
                              '🛡️ Leal'}
                    </span>
                  </div>
                  {(jugadorSeleccionado.partidosSeguidosBanco || 0) > 0 && (
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Banco Consecutivo</span>
                      <span className="text-xs font-mono font-bold text-amber-400 block mt-0.5">{jugadorSeleccionado.partidosSeguidosBanco} partidos</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Atributos Agrupados (Físicos, Técnicos, Mentales) */}
              <div className="p-5 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar">

                {/* CATEGORÍA 1: FÍSICOS */}
                <div className="space-y-3">
                  <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-850 pb-1 flex items-center gap-1.5">
                    <span>🏃‍♂️</span> Atributos Físicos
                  </h4>
                  <div className="space-y-2.5">
                    {renderFilaAtributo('Velocidad', jugadorSeleccionado.atributos.velocidad)}
                    {renderFilaAtributo('Aceleración', jugadorSeleccionado.atributos.aceleracion)}
                    {renderFilaAtributo('Resistencia', jugadorSeleccionado.atributos.resistencia)}
                    {renderFilaAtributo('Fuerza', jugadorSeleccionado.atributos.fuerza)}
                  </div>
                </div>

                {/* CATEGORÍA 2: TÉCNICOS */}
                <div className="space-y-3">
                  <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-850 pb-1 flex items-center gap-1.5">
                    <span>🎯</span> Atributos Técnicos
                  </h4>
                  <div className="space-y-2.5">
                    {renderFilaAtributo('Remate / Definición', jugadorSeleccionado.atributos.remate)}
                    {renderFilaAtributo('Pase', jugadorSeleccionado.atributos.pase)}
                    {renderFilaAtributo('Regate / Dribbling', jugadorSeleccionado.atributos.regate)}
                    {renderFilaAtributo('Defensa / Marcaje', jugadorSeleccionado.atributos.defensa)}
                    {renderFilaAtributo('Técnica / Control', jugadorSeleccionado.atributos.tecnica)}
                    {jugadorSeleccionado.posicion === 'POR' &&
                      renderFilaAtributo('Reflejos (Arquero)', jugadorSeleccionado.atributos.reflejos)
                    }
                  </div>
                </div>

                {/* CATEGORÍA 3: MENTALES */}
                <div className="space-y-3">
                  <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-850 pb-1 flex items-center gap-1.5">
                    <span>🧠</span> Atributos Mentales
                  </h4>
                  <div className="space-y-2.5">
                    {renderFilaAtributo('Visión de Juego', jugadorSeleccionado.atributos.vision)}
                    {renderFilaAtributo('Toma de Decisiones', jugadorSeleccionado.atributos.decisiones)}
                    {renderFilaAtributo('Determinación', jugadorSeleccionado.atributos.determinacion)}
                    {renderFilaAtributo('Colocación / Posicionamiento', jugadorSeleccionado.atributos.posicionamiento)}
                  </div>
                </div>

              </div>

              {/* Pie de Ficha Finanzas */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Valor de Mercado</div>
                  <div className="text-teal-400 font-extrabold font-mono mt-0.5">
                    {formatearMoneda(jugadorSeleccionado.valorMercado)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Salario</div>
                  <div className="text-slate-300 font-bold font-mono mt-0.5">
                    {formatearMoneda(jugadorSeleccionado.salarioSemanal)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Cláusula</div>
                  <div className="text-amber-500 font-bold font-mono mt-0.5">
                    {jugadorSeleccionado.clausulaRescision ? formatearMoneda(jugadorSeleccionado.clausulaRescision) : 'Sin cláusula'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Contrato</div>
                  <div className={`font-bold font-mono mt-0.5 ${jugadorSeleccionado.mesesContrato !== undefined && jugadorSeleccionado.mesesContrato <= 6 ? 'text-rose-400 animate-pulse' : 'text-slate-300'
                    }`}>
                    {jugadorSeleccionado.mesesContrato !== undefined ? `${jugadorSeleccionado.mesesContrato} meses` : '---'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Salud</div>
                  <div className={`font-bold mt-0.5 ${jugadorSeleccionado.lesionado ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                    {jugadorSeleccionado.lesionado ? '⚠️ Lesionado' : '🟢 OK'}
                  </div>
                </div>
              </div>

              {/* Promesas de Gestión */}
              {jugadorSeleccionado.promesas && jugadorSeleccionado.promesas.length > 0 && (
                <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
                  <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest pb-1 flex items-center gap-1.5 border-b border-slate-800/60 pb-1.5">
                    <span>🤝</span> Promesas de Gestión
                  </h4>
                  <div className="space-y-2">
                    {jugadorSeleccionado.promesas.map((promesa, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-xl border border-slate-850 text-[11px] gap-4">
                        <span className="text-slate-300 font-semibold">{promesa.descripcion}</span>
                        <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full select-none ${promesa.estado === 'Cumplida' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            promesa.estado === 'Incumplida' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse' :
                              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                          {promesa.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón de Acción Prominente */}
              <div className="p-4 bg-slate-900 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    setJugadorARenovar(jugadorSeleccionado);
                    setClausulaRenovacion(Math.round((jugadorSeleccionado.valorMercado * 1.5) / 1000) * 1000);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold rounded-lg text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all text-center"
                >
                  ✍️ Renovar Contrato
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl p-10 text-center text-slate-500 text-xs">
              <span className="text-2xl block mb-2">🔎</span>
              Hacé click en cualquier futbolista del listado de la plantilla para examinar sus cualidades detalladas de forma física y atributos (1-20).
            </div>
          )}
        </div>

      </div>

      {/* ==========================================
          MODAL DE RENOVACIÓN DE CONTRATO (FM STYLE)
          ========================================== */}
      {jugadorARenovar && (() => {
        // Exigencias del jugador
        const salarioExigido = Math.max(
          jugadorARenovar.salarioSemanal * 1.15,
          Math.round((jugadorARenovar.ca ** 2) * 35)
        );

        const handleAceptarRenovacion = () => {
          if (!clausulaRenovacion || clausulaRenovacion <= 0) {
            alert('Por favor, ingresa una cláusula de rescisión válida y obligatoria.');
            return;
          }
          renovarContrato(jugadorARenovar.id, salarioExigido, clausulaRenovacion);
          setJugadorARenovar(null);
          // Actualizar jugador seleccionado si es el que se renovó
          if (jugadorSeleccionado?.id === jugadorARenovar.id) {
            setJugadorSeleccionado(prev => prev ? {
              ...prev,
              salarioSemanal: salarioExigido,
              clausulaRescision: clausulaRenovacion,
              mesesContrato: 36,
              moral: 100
            } : null);
          }
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto text-left">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-fade-in my-8">

              {/* Header */}
              <div className="p-6 bg-slate-950 border-b border-slate-800 text-center relative border-t-4 border-t-teal-500">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Negociación de Contrato</span>
                <h3 className="text-xl font-extrabold text-white mt-1">{jugadorARenovar.nombre}</h3>
                <p className="text-xs text-slate-400 mt-1">{jugadorARenovar.posicion} · CA {jugadorARenovar.ca} · {jugadorARenovar.edad} años</p>
              </div>

              {/* Contenido / Oferta */}
              <div className="p-6 space-y-4 flex-1 bg-slate-950/20 text-xs">

                {/* Explicación de demanda */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <p className="text-slate-300 leading-relaxed font-medium">
                    🗣️ <strong>Representante:</strong> "Mi cliente está dispuesto a extender su permanencia en el club por <strong>36 meses</strong>, pero exige una compensación salarial justa acorde a su rendimiento y habilidades."
                  </p>
                </div>

                {/* Tabla de Comparativa */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-center">
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Salario Actual</span>
                    <span className="text-base font-bold text-slate-400 font-mono block mt-1">{formatearMoneda(jugadorARenovar.salarioSemanal)}/sem</span>
                  </div>
                  <div className="bg-slate-950/80 rounded-xl p-3 border border-teal-500/30 text-center">
                    <span className="text-[9px] uppercase font-bold text-teal-400 tracking-wider block">Salario Exigido</span>
                    <span className="text-base font-extrabold text-teal-400 font-mono block mt-1">{formatearMoneda(salarioExigido)}/sem</span>
                  </div>
                </div>

                {/* Campo de Cláusula de Rescisión */}
                <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Cláusula de Rescisión (€) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="50000"
                    value={clausulaRenovacion || ''}
                    onChange={(e) => setClausulaRenovacion(parseInt(e.target.value) || 0)}
                    placeholder="Ej. 10.000.000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-teal-500 transition-colors"
                  />
                  <p className="text-[10px] text-slate-500">
                    Establece un precio de rescisión. Si un club rival lo paga, el jugador podrá marcharse directamente sin que puedas evitarlo.
                  </p>
                </div>

                {/* Detalles de la Oferta */}
                <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duración del Contrato:</span>
                    <span className="font-semibold text-slate-300">36 meses (3 años)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Incremento Salarial:</span>
                    <span className="font-semibold text-rose-400 font-mono">
                      +{formatearMoneda(salarioExigido - jugadorARenovar.salarioSemanal)}/sem (+{Math.round((salarioExigido - jugadorARenovar.salarioSemanal) / jugadorARenovar.salarioSemanal * 100)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Impacto en Moral:</span>
                    <span className="font-bold text-emerald-400">Excelente (100%)</span>
                  </div>
                </div>

              </div>

              {/* Footer Acciones */}
              <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
                <button
                  onClick={() => setJugadorARenovar(null)}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg font-bold tracking-wide transition-all uppercase text-[10px]"
                >
                  Rechazar / Cancelar
                </button>
                <button
                  disabled={!clausulaRenovacion || clausulaRenovacion <= 0}
                  onClick={handleAceptarRenovacion}
                  className={`px-6 py-2.5 font-extrabold rounded-lg shadow-md transition-all uppercase text-[10px] tracking-wider ${!clausulaRenovacion || clausulaRenovacion <= 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                      : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white active:scale-95'
                    }`}
                >
                  Aceptar Términos
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
