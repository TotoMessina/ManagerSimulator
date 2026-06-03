import React, { useState } from 'react';
import { useGame } from '../context/useGame';
import { PartidoCopa } from '../types';
import { equiposLaLiga, equiposPremier, equiposSerieA, equiposBundesliga } from '../data/initialData';

export const CopaInternacionalView: React.FC = () => {
  const { copaCampeones, copaEuropa, equipos, equipoUsuario } = useGame();
  const [activeCup, setActiveCup] = useState<'champions' | 'europa'>('champions');
  const [activeTab, setActiveTab] = useState<'grupos' | 'eliminatorias'>('grupos');
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState<number>(1);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<'A' | 'B' | 'C' | 'D'>('A');

  const activeCopa = activeCup === 'champions' ? copaCampeones : copaEuropa;

  if (!activeCopa) {
    return (
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center max-w-lg mx-auto mt-12 shadow-lg backdrop-blur-md">
        <span className="text-4xl block mb-4">🏆❌</span>
        <h3 className="text-lg font-bold text-slate-300 mb-2">Competencia Internacional No Activa</h3>
        <p className="text-slate-500 text-xs leading-relaxed">
          Este torneo internacional no está activo en este momento. Se sorteará al inicio de la próxima temporada.
        </p>
      </div>
    );
  }

  const obtenerNombreEquipo = (id: string): string => {
    return equipos.find(e => e.id === id)?.nombre || id;
  };

  const obtenerEscudoEquipo = (id: string): string => {
    return equipos.find(e => e.id === id)?.escudo || '👤';
  };

  const obtenerBanderaEquipo = (id: string): string => {
    if (equiposLaLiga.some(e => e.id === id)) return '🇪🇸';
    if (equiposPremier.some(e => e.id === id)) return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
    if (equiposSerieA.some(e => e.id === id)) return '🇮🇹';
    if (equiposBundesliga.some(e => e.id === id)) return '🇩🇪';
    return '🇪🇺';
  };

  const { grupos, faseActual, partidosGrupos, cuartos, semifinales, final, campeon } = activeCopa;

  // Filtrar los partidos del grupo seleccionado de la jornada seleccionada
  const partidosFiltrados = partidosGrupos.filter(
    jg => jg.jornada === jornadaSeleccionada && jg.grupoId === grupoSeleccionado
  );

  return (
    <div className="space-y-6">
      
      {/* Selector de Copa (FM-Style Sub-Tabs) */}
      <div className="flex justify-center gap-4 bg-slate-950 p-2 rounded-2xl border border-slate-850/80 mb-4 max-w-md mx-auto shadow-md">
        <button
          onClick={() => {
            setActiveCup('champions');
            setGrupoSeleccionado('A');
            setJornadaSeleccionada(1);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
            activeCup === 'champions'
              ? 'bg-gradient-to-r from-indigo-700 to-indigo-500 text-white shadow-lg shadow-indigo-900/30 border border-indigo-600'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
          }`}
        >
          🏆 Copa de Campeones
        </button>
        <button
          onClick={() => {
            setActiveCup('europa');
            setGrupoSeleccionado('A');
            setJornadaSeleccionada(1);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
            activeCup === 'europa'
              ? 'bg-gradient-to-r from-blue-700 to-cyan-500 text-white shadow-lg shadow-blue-900/30 border border-blue-600'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
          }`}
        >
          🇪🇺 Copa Continental
        </button>
      </div>

      {/* Continental Header Banner */}
      <div 
        className="rounded-2xl p-6 border relative overflow-hidden shadow-2xl"
        style={{
          background: activeCup === 'champions' 
            ? 'linear-gradient(135deg, rgba(30, 27, 75, 0.9) 0%, rgba(15, 12, 45, 0.95) 100%)' 
            : 'linear-gradient(135deg, rgba(15, 32, 67, 0.9) 0%, rgba(8, 17, 43, 0.95) 100%)',
          borderColor: activeCup === 'champions' ? '#4f46e544' : '#1e40af44'
        }}
      >
        {/* Glow decoration */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-extrabold tracking-widest uppercase ${
              activeCup === 'champions' 
                ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300' 
                : 'bg-blue-500/10 border-blue-500/25 text-blue-300'
            }`}>
              {activeCup === 'champions' ? '⭐ UEFA Copa de Campeones' : '🇪🇺 UEFA Copa Continental'}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-3">
              {activeCup === 'champions' ? 'LA ÉLITE DEL FÚTBOL CONTINENTAL' : 'EL DESAFÍO DE LA COPA CONTINENTAL'}
            </h1>
            <p className="text-xs text-slate-350 max-w-xl mt-1.5 leading-relaxed">
              {activeCup === 'champions' 
                ? 'Los 4 mejores clubes de España, Inglaterra, Italia y Alemania compiten en una batalla de poder a poder por levantar la máxima corona continental.'
                : 'Los equipos clasificados en puestos 5º a 8º disputan uno de los títulos continentales más codiciados del planeta. Batalla de alto nivel estratégico.'}
            </p>
          </div>

          {campeon && (
            <div className="bg-slate-900/80 border-2 border-yellow-500/40 rounded-2xl px-5 py-3 text-center shadow-lg shadow-yellow-950/10 backdrop-blur-md">
              <span className="text-3xl block">🏆</span>
              <span className="text-[9px] uppercase font-bold text-yellow-500 tracking-wider">Campeón Continental</span>
              <div className="text-sm font-black text-white mt-1 flex items-center gap-1.5 justify-center">
                <span>{obtenerEscudoEquipo(campeon)}</span>
                <span>{obtenerNombreEquipo(campeon)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex justify-start gap-2 border-b border-slate-850 pb-2.5">
        <button
          onClick={() => setActiveTab('grupos')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all uppercase ${
            activeTab === 'grupos' 
              ? (activeCup === 'champions' ? 'bg-indigo-650 text-white shadow-md shadow-indigo-900/25' : 'bg-blue-650 text-white shadow-md shadow-blue-900/25')
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📋 Fase de Grupos
        </button>
        <button
          onClick={() => setActiveTab('eliminatorias')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all uppercase flex items-center gap-1.5 ${
            activeTab === 'eliminatorias' 
              ? (activeCup === 'champions' ? 'bg-indigo-650 text-white shadow-md shadow-indigo-900/25' : 'bg-blue-650 text-white shadow-md shadow-blue-900/25')
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🌳 Eliminatorias Directas
        </button>
      </div>

      {/* ==========================================
          CONTENIDO: FASE DE GRUPOS
          ========================================== */}
      {activeTab === 'grupos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* TABLAS DE GRUPOS (COL-SPAN 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Selector de Grupo */}
            <div className="flex justify-between items-center bg-slate-900/40 border border-slate-800/80 p-3 rounded-xl backdrop-blur-sm">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pl-1">Seleccionar Grupo</span>
              <div className="flex gap-1.5">
                {(['A', 'B', 'C', 'D'] as const).map(gId => (
                  <button
                    key={gId}
                    onClick={() => setGrupoSeleccionado(gId)}
                    className={`w-10 h-10 rounded-lg text-xs font-extrabold transition-all border ${
                      grupoSeleccionado === gId
                        ? (activeCup === 'champions' 
                          ? 'bg-indigo-650 border-indigo-500 text-white font-black shadow-inner shadow-indigo-700' 
                          : 'bg-blue-650 border-blue-500 text-white font-black shadow-inner shadow-blue-700')
                        : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {gId}
                  </button>
                ))}
              </div>
            </div>

            {/* Standings Table for Selected Group */}
            {(() => {
              const grupoObj = grupos.find(g => g.id === grupoSeleccionado);
              if (!grupoObj) return null;

              const tablaOrdenada = [...grupoObj.tabla].sort((a, b) => {
                if (b.puntos !== a.puntos) return b.puntos - a.puntos;
                if (b.diferenciaGoles !== a.diferenciaGoles) return b.diferenciaGoles - a.diferenciaGoles;
                return b.golesFavor - a.golesFavor;
              });

              return (
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg backdrop-blur-md">
                  <div className="p-4 bg-slate-950/60 border-b border-slate-850 flex justify-between items-center">
                    <h3 className="text-xs font-extrabold text-slate-350 uppercase tracking-widest">
                      Tabla General · Grupo {grupoSeleccionado}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">Fase de Grupos en Progreso</span>
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950/30 border-b border-slate-850 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <th className="px-4 py-3 text-center w-12">Pos</th>
                        <th className="px-3 py-3">Club</th>
                        <th className="px-3 py-3 text-center w-12">PJ</th>
                        <th className="px-3 py-3 text-center w-10">G</th>
                        <th className="px-3 py-3 text-center w-10">E</th>
                        <th className="px-3 py-3 text-center w-10">P</th>
                        <th className="px-3 py-3 text-center w-14">DG</th>
                        <th className="px-4 py-3 text-center w-14">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                      {tablaOrdenada.map((team, idx) => {
                        const esUsuario = equipoUsuario && team.idEquipo === equipoUsuario.id;
                        return (
                          <tr 
                            key={team.idEquipo} 
                            className={`transition-colors duration-150 ${
                              esUsuario 
                                ? (activeCup === 'champions' ? 'bg-indigo-500/10 hover:bg-indigo-500/15' : 'bg-blue-500/10 hover:bg-blue-500/15') 
                                : 'hover:bg-slate-800/20'
                            }`}
                          >
                            <td className="px-4 py-3.5 text-center font-bold font-mono">
                               <span className={`inline-flex w-5 h-5 rounded-full items-center justify-center text-[10px] ${
                                 idx < 2 
                                   ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' 
                                   : 'bg-slate-950 text-slate-500 border border-slate-850'
                               }`}>
                                 {idx + 1}
                               </span>
                            </td>
                            <td className="px-3 py-3.5 font-bold text-slate-200">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{team.escudo}</span>
                                <span>{team.nombreEquipo}</span>
                                <span className="text-[10px]" title="Nacionalidad del club">
                                  {obtenerBanderaEquipo(team.idEquipo)}
                                </span>
                                {esUsuario && (
                                  <span className="text-[8px] bg-indigo-500 text-white font-extrabold uppercase px-1.5 py-0.5 rounded ml-1 animate-pulse">Tu Club</span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3.5 text-center font-semibold font-mono text-slate-400">{team.partidosJugados}</td>
                            <td className="px-3 py-3.5 text-center font-medium font-mono text-slate-400">{team.ganados}</td>
                            <td className="px-3 py-3.5 text-center font-medium font-mono text-slate-400">{team.empatados}</td>
                            <td className="px-3 py-3.5 text-center font-medium font-mono text-slate-400">{team.perdidos}</td>
                            <td className={`px-3 py-3.5 text-center font-semibold font-mono ${
                              team.diferenciaGoles > 0 ? 'text-emerald-400' : team.diferenciaGoles < 0 ? 'text-rose-400' : 'text-slate-500'
                            }`}>
                              {team.diferenciaGoles > 0 ? `+${team.diferenciaGoles}` : team.diferenciaGoles}
                            </td>
                            <td className="px-4 py-3.5 text-center font-extrabold font-mono text-slate-100 text-sm">{team.puntos}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  <div className="p-3.5 bg-slate-950/40 border-t border-slate-850 text-[10px] text-slate-500 flex justify-between">
                    <span>🟢 Los 2 primeros clasifican a Cuartos de Final</span>
                    <span>PJ: Partidos Jugados · DG: Diferencia de Goles</span>
                  </div>
                </div>
              );
            })()}

          </div>

          {/* FIXTURE Y RESULTADOS DE GRUPO (COL-SPAN 1) */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg backdrop-blur-md min-h-[300px]">
            <div>
              <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between border-b border-slate-800 pb-2">
                <span>📅 Calendario de Partidos</span>
                <span className="text-[10px] text-indigo-400 font-extrabold uppercase">Grupo {grupoSeleccionado}</span>
              </h3>

              {/* Selector de Jornada */}
              <div className="grid grid-cols-6 gap-1 mb-4 bg-slate-950 p-1 rounded-xl border border-slate-850">
                {Array.from({ length: 6 }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    onClick={() => setJornadaSeleccionada(num)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      jornadaSeleccionada === num 
                        ? (activeCup === 'champions' ? 'bg-indigo-650 text-white font-black' : 'bg-blue-650 text-white font-black') 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    J{num}
                  </button>
                ))}
              </div>

              {/* Lista de Partidos */}
              <div className="space-y-3">
                {partidosFiltrados.map(jfGroup => {
                  return jfGroup.partidos.map((partido, pIdx) => {
                    const localUsuario = equipoUsuario && partido.localId === equipoUsuario.id;
                    const visitanteUsuario = equipoUsuario && partido.visitanteId === equipoUsuario.id;
                    const esPartidoDT = localUsuario || visitanteUsuario;

                    return (
                      <div 
                        key={partido.id}
                        className={`p-3 rounded-xl border text-xs flex flex-col justify-between items-center transition-all ${
                          esPartidoDT 
                            ? 'bg-indigo-500/10 border-indigo-500/30' 
                            : 'bg-slate-950/40 border-slate-850'
                        }`}
                      >
                        <div className="text-[9px] text-slate-500 uppercase font-mono mb-1.5 flex justify-between w-full">
                          <span>Partido {pIdx + 1}</span>
                          <span>{jfGroup.fecha}</span>
                        </div>

                        <div className="flex items-center justify-between w-full font-bold">
                          {/* Local */}
                          <div className="w-5/12 flex items-center gap-1.5 truncate">
                            <span className="text-base select-none">{obtenerEscudoEquipo(partido.localId)}</span>
                            <span className="truncate text-slate-200">{obtenerNombreEquipo(partido.localId)}</span>
                          </div>

                          {/* Marcador */}
                          <div className="w-2/12 text-center">
                            {partido.jugado ? (
                              <span className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-0.5 rounded font-mono font-extrabold text-[11px] block">
                                {partido.golesLocal} - {partido.golesVisitante}
                              </span>
                            ) : (
                              <span className="bg-slate-950 text-slate-600 px-2 py-0.5 rounded font-mono text-[10px] block">
                                VS
                              </span>
                            )}
                          </div>

                          {/* Visitante */}
                          <div className="w-5/12 flex items-center justify-end gap-1.5 truncate text-right">
                            <span className="truncate text-slate-200">{obtenerNombreEquipo(partido.visitanteId)}</span>
                            <span className="text-base select-none">{obtenerEscudoEquipo(partido.visitanteId)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })}
              </div>
            </div>

            <div className="text-[10px] text-slate-500 border-t border-slate-850 pt-3 leading-normal mt-6 font-medium">
              💡 Los grupos juegan los miércoles intercalados. El DT usuario dirige sus partidos continentalmente cuando su club tiene cita internacional.
            </div>
          </div>

        </div>
      )}

      {/* ==========================================
          CONTENIDO: LLAVES DE ELIMINACIÓN DIRECTA
          ========================================== */}
      {activeTab === 'eliminatorias' && (
        <div className="space-y-8 py-4 overflow-x-auto">
          
          {/* Brackets Layout: 5 Columns (Cuartos -> Conector -> Semis -> Conector -> Final) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center min-w-[960px] max-w-6xl mx-auto relative px-4">
            
            {/* 1. CUARTOS DE FINAL */}
            <div className="space-y-4">
              <h3 className={`text-[10px] font-black uppercase tracking-widest text-center mb-3 pb-1 border-b ${
                activeCup === 'champions' ? 'text-indigo-400 border-indigo-500/20' : 'text-blue-400 border-blue-500/20'
              }`}>
                Cuartos de Final
              </h3>

              {cuartos ? (
                cuartos.partidos.map((partido, idx) => {
                  const esJugado = partido.jugado;
                  const localNombre = obtenerNombreEquipo(partido.localId);
                  const visitanteNombre = obtenerNombreEquipo(partido.visitanteId);
                  const localEscudo = obtenerEscudoEquipo(partido.localId);
                  const visitanteEscudo = obtenerEscudoEquipo(partido.visitanteId);
                  
                  const esLocalUsuario = equipoUsuario && partido.localId === equipoUsuario.id;
                  const esVisitanteUsuario = equipoUsuario && partido.visitanteId === equipoUsuario.id;
                  const esPartidoDT = esLocalUsuario || esVisitanteUsuario;

                  return (
                    <div 
                      key={partido.id}
                      className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 relative overflow-hidden transition-all ${
                        esPartidoDT 
                          ? 'bg-indigo-950/20 border-indigo-500/40 shadow-md' 
                          : 'bg-slate-900/40 border-slate-800 shadow-inner'
                      }`}
                    >
                      <div className="text-[8px] font-mono text-slate-550 flex justify-between items-center">
                        <span>Llave {idx + 1}</span>
                        <span>{cuartos.fecha}</span>
                      </div>

                      <div className="space-y-1.5">
                        {/* Local */}
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1 font-bold truncate">
                            <span className="text-base">{localEscudo}</span>
                            <span className="truncate text-slate-200 max-w-[100px]">{localNombre}</span>
                            {esLocalUsuario && <span className="text-[6px] bg-indigo-650 text-white font-extrabold px-1 rounded uppercase">DT</span>}
                          </div>
                          <span className="font-bold font-mono text-slate-100">
                            {esJugado ? partido.golesLocal : '-'}
                          </span>
                        </div>

                        {/* Visitante */}
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1 font-bold truncate">
                            <span className="text-base">{visitanteEscudo}</span>
                            <span className="truncate text-slate-200 max-w-[100px]">{visitanteNombre}</span>
                            {esVisitanteUsuario && <span className="text-[6px] bg-indigo-650 text-white font-extrabold px-1 rounded uppercase">DT</span>}
                          </div>
                          <span className="font-bold font-mono text-slate-100">
                            {esJugado ? partido.golesVisitante : '-'}
                          </span>
                        </div>
                      </div>

                      {esJugado && partido.penalesLocal !== undefined && partido.penalesVisitante !== undefined && (
                        <div className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-850 text-[9px] text-center font-bold text-indigo-400 font-mono">
                          Penales: {partido.penalesLocal} - {partido.penalesVisitante}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="bg-slate-900/30 border border-slate-850 border-dashed rounded-xl p-4 text-center text-slate-500 italic text-[11px] leading-relaxed">
                  Cuartos pendientes. Se jugarán tras la fase de grupos.
                </div>
              )}
            </div>

            {/* 2. CONECTOR GRÁFICO 1 */}
            <div className="hidden md:flex flex-col items-center justify-center text-indigo-600/40 text-xl font-black select-none pointer-events-none">
              <div>➔</div>
            </div>

            {/* 3. SEMIFINALES */}
            <div className="space-y-6">
              <h3 className={`text-[10px] font-black uppercase tracking-widest text-center mb-3 pb-1 border-b ${
                activeCup === 'champions' ? 'text-indigo-400 border-indigo-500/20' : 'text-blue-400 border-blue-500/20'
              }`}>
                Semifinales
              </h3>

              {semifinales ? (
                semifinales.partidos.map((partido, idx) => {
                  const esJugado = partido.jugado;
                  const localNombre = obtenerNombreEquipo(partido.localId);
                  const visitanteNombre = obtenerNombreEquipo(partido.visitanteId);
                  const localEscudo = obtenerEscudoEquipo(partido.localId);
                  const visitanteEscudo = obtenerEscudoEquipo(partido.visitanteId);
                  
                  const esLocalUsuario = equipoUsuario && partido.localId === equipoUsuario.id;
                  const esVisitanteUsuario = equipoUsuario && partido.visitanteId === equipoUsuario.id;
                  const esPartidoDT = esLocalUsuario || esVisitanteUsuario;

                  return (
                    <div 
                      key={partido.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 relative overflow-hidden transition-all ${
                        esPartidoDT 
                          ? 'bg-indigo-950/20 border-indigo-500/40 shadow-md' 
                          : 'bg-slate-900/40 border-slate-800 shadow-inner'
                      }`}
                    >
                      <div className="text-[8px] font-mono text-slate-550 flex justify-between items-center">
                        <span>Semi {idx + 1}</span>
                        <span>{semifinales.fecha}</span>
                      </div>

                      <div className="space-y-1.5">
                        {/* Local */}
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1 font-bold truncate">
                            <span className="text-base">{localEscudo}</span>
                            <span className="truncate text-slate-200 max-w-[100px]">{localNombre}</span>
                            {esLocalUsuario && <span className="text-[6px] bg-indigo-650 text-white font-extrabold px-1 rounded uppercase">DT</span>}
                          </div>
                          <span className="font-bold font-mono text-slate-100">
                            {esJugado ? partido.golesLocal : '-'}
                          </span>
                        </div>

                        {/* Visitante */}
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1 font-bold truncate">
                            <span className="text-base">{visitanteEscudo}</span>
                            <span className="truncate text-slate-200 max-w-[100px]">{visitanteNombre}</span>
                            {esVisitanteUsuario && <span className="text-[6px] bg-indigo-650 text-white font-extrabold px-1 rounded uppercase">DT</span>}
                          </div>
                          <span className="font-bold font-mono text-slate-100">
                            {esJugado ? partido.golesVisitante : '-'}
                          </span>
                        </div>
                      </div>

                      {esJugado && partido.penalesLocal !== undefined && partido.penalesVisitante !== undefined && (
                        <div className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-850 text-[9px] text-center font-bold text-indigo-400 font-mono">
                          Penales: {partido.penalesLocal} - {partido.penalesVisitante}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="bg-slate-900/30 border border-slate-850 border-dashed rounded-xl p-4 text-center text-slate-500 italic text-[11px] leading-relaxed">
                  Semifinales pendientes.
                </div>
              )}
            </div>

            {/* 4. CONECTOR GRÁFICO 2 */}
            <div className="hidden md:flex flex-col items-center justify-center text-indigo-600/40 text-xl font-black select-none pointer-events-none">
              <div>➔</div>
            </div>

            {/* 5. GRAN FINAL */}
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-center mb-3 pb-1 border-b border-amber-500/20 text-amber-500">
                Gran Final
              </h3>

              {final ? (
                (() => {
                  const partido = final.partido;
                  const esJugado = partido.jugado;
                  const localNombre = obtenerNombreEquipo(partido.localId);
                  const visitanteNombre = obtenerNombreEquipo(partido.visitanteId);
                  const localEscudo = obtenerEscudoEquipo(partido.localId);
                  const visitanteEscudo = obtenerEscudoEquipo(partido.visitanteId);
                  
                  const esLocalUsuario = equipoUsuario && partido.localId === equipoUsuario.id;
                  const esVisitanteUsuario = equipoUsuario && partido.visitanteId === equipoUsuario.id;
                  const esPartidoDT = esLocalUsuario || esVisitanteUsuario;

                  return (
                    <div 
                      className={`p-4 rounded-xl border-2 flex flex-col justify-between space-y-3 relative overflow-hidden transition-all ${
                        esPartidoDT 
                          ? 'bg-gradient-to-br from-indigo-950/20 via-slate-900 to-indigo-950/20 border-amber-500/60 shadow-lg shadow-amber-500/5' 
                          : 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-indigo-500/40 shadow-lg shadow-indigo-900/5'
                      }`}
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/5 rounded-full blur-xl pointer-events-none"></div>

                      <div className="text-[8px] font-mono text-slate-555 flex justify-between items-center">
                        <span className="font-extrabold text-amber-400 flex items-center gap-0.5">🏆 FINALE</span>
                        <span>{final.fecha}</span>
                      </div>

                      <div className="space-y-2">
                        {/* Local */}
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1 font-bold truncate">
                            <span className="text-lg">{localEscudo}</span>
                            <span className="truncate text-slate-200 max-w-[100px]">{localNombre}</span>
                            {esLocalUsuario && <span className="text-[6px] bg-indigo-650 text-white font-extrabold px-1 rounded uppercase">DT</span>}
                          </div>
                          <span className="font-bold font-mono text-slate-100 text-sm">
                            {esJugado ? partido.golesLocal : '-'}
                          </span>
                        </div>

                        {/* Visitante */}
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1 font-bold truncate">
                            <span className="text-lg">{visitanteEscudo}</span>
                            <span className="truncate text-slate-200 max-w-[100px]">{visitanteNombre}</span>
                            {esVisitanteUsuario && <span className="text-[6px] bg-indigo-650 text-white font-extrabold px-1 rounded uppercase">DT</span>}
                          </div>
                          <span className="font-bold font-mono text-slate-100 text-sm">
                            {esJugado ? partido.golesVisitante : '-'}
                          </span>
                        </div>
                      </div>

                      {esJugado && partido.penalesLocal !== undefined && partido.penalesVisitante !== undefined && (
                        <div className="bg-amber-950/20 px-2 py-0.5 rounded border border-amber-500/30 text-[9px] text-center font-bold text-amber-400 font-mono">
                          Penales: {partido.penalesLocal} - {partido.penalesVisitante}
                        </div>
                      )}

                      {esJugado && (
                        <div className="pt-2 border-t border-slate-850/80 text-center text-[10px] font-black text-white uppercase tracking-wider bg-slate-950/70 py-1 rounded border border-slate-900">
                          🏆 Campeón: {obtenerNombreEquipo(campeon!)}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="bg-slate-900/30 border border-slate-850 border-dashed rounded-xl p-4 text-center text-slate-500 italic text-[11px] leading-relaxed">
                  Final pendiente.
                </div>
              )}
            </div>

          </div>

          {/* Pedestal De Honor */}
          {campeon && (
            <div className="bg-gradient-to-r from-amber-500/5 via-yellow-500/10 to-amber-500/5 border border-yellow-500/25 max-w-xl mx-auto rounded-2xl p-6 text-center shadow-lg relative overflow-hidden animate-fade-in mt-8">
              <div className="absolute top-[-30px] right-[-30px] text-7xl opacity-5 select-none pointer-events-none">👑</div>
              <span className="text-4xl block mb-2">👑🏆👑</span>
              <h4 className="text-base font-extrabold text-white uppercase tracking-wide">
                ¡Rey Continental!
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                El club {obtenerNombreEquipo(campeon)} se ha consagrado monarca absoluto tras vencer en la gran final de la competencia.
              </p>
              
              <div className="mt-4 flex items-center justify-center gap-3 bg-slate-950/80 border border-slate-900 py-3 px-6 rounded-xl inline-flex">
                <span className="text-3xl">{obtenerEscudoEquipo(campeon)}</span>
                <span className="text-sm font-black text-white">{obtenerNombreEquipo(campeon)}</span>
                <span className="text-[10px] font-extrabold bg-amber-500/20 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/30 tracking-widest uppercase">CAMPEÓN</span>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
