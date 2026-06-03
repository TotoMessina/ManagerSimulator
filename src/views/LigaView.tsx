import React, { useState } from 'react';
import { useGame } from '../context/useGame';
import { EstadisticasView } from './EstadisticasView';

export const LigaView: React.FC = () => {
  const { liga, equipos, equipoUsuario } = useGame();
  const [tab, setTab] = useState<'tabla' | 'estadisticas'>('tabla');

  if (!equipoUsuario) return null;

  // --- ORDENAR TABLA DINÁMICAMENTE ---
  const tablaOrdenada = [...liga.tabla].sort((a, b) => {
    if (b.puntos !== a.puntos) {
      return b.puntos - a.puntos;
    }
    if (b.diferenciaGoles !== a.diferenciaGoles) {
      return b.diferenciaGoles - a.diferenciaGoles;
    }
    return b.golesFavor - a.golesFavor;
  });

  return (
    <div className="space-y-6">
      
      {/* Cabecera de la liga */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Competición de la Liga</h1>
          <p className="text-xs text-slate-400 mt-1">
            Resultados, posiciones oficiales y estadísticas de la temporada {liga.temporada}.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold">
          <span className="text-slate-500 font-bold uppercase tracking-wider">Competición:</span>
          <span className="text-teal-400 font-bold uppercase tracking-widest">{liga.nombre}</span>
        </div>
      </div>

      {/* Selector de Pestañas (Tabs) */}
      <div className="flex gap-2 border-b border-slate-800 bg-slate-950/20 p-1 rounded-xl">
        <button
          onClick={() => setTab('tabla')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all duration-150 ${
            tab === 'tabla'
              ? 'bg-slate-900 border border-slate-800 text-teal-400 font-black shadow-md'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          🏆 Clasificación
        </button>
        <button
          onClick={() => setTab('estadisticas')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all duration-150 ${
            tab === 'estadisticas'
              ? 'bg-slate-900 border border-slate-800 text-teal-400 font-black shadow-md'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          📊 Estadísticas de Jugadores
        </button>
      </div>

      {/* ==========================================
          RENDERIZADO DE CONTENIDO SEGÚN TAB ACTIVA
          ========================================== */}
      {tab === 'tabla' ? (
        <>
          {/* TABLA DE CLASIFICACIÓN CLÁSICA */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5 text-center w-12">Pos</th>
                    <th className="px-4 py-3.5">Equipo</th>
                    <th className="px-3 py-3.5 text-center">PJ</th>
                    <th className="px-3 py-3.5 text-center">G</th>
                    <th className="px-3 py-3.5 text-center">E</th>
                    <th className="px-3 py-3.5 text-center">P</th>
                    <th className="px-3 py-3.5 text-center">GF</th>
                    <th className="px-3 py-3.5 text-center">GC</th>
                    <th className="px-3 py-3.5 text-center">DG</th>
                    <th className="px-3 py-3.5 text-center">Pts</th>
                    <th className="px-4 py-3.5 text-center">Forma (Últimos 5)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {tablaOrdenada.map((fila, index) => {
                    const esEquipoUsuario = fila.idEquipo === equipoUsuario.id;
                    const clubInfo = equipos.find(e => e.id === fila.idEquipo);
                    const pos = index + 1;

                    // Estilo decorativo para puestos de clasificación (ej. Campeón / Champions)
                    let borderDecoracion = 'border-l-4 border-transparent';
                    if (pos === 1) {
                      borderDecoracion = 'border-l-4 border-emerald-500'; // Campeón
                    } else if (pos <= 4) {
                      borderDecoracion = 'border-l-4 border-blue-500'; // Clasificados Copa de Campeones
                    }

                    return (
                      <tr
                        key={fila.idEquipo}
                        className={`transition-colors duration-150 ${
                          esEquipoUsuario 
                            ? 'bg-teal-500/10 font-bold border-l-4 border-teal-500' 
                            : 'hover:bg-slate-800/25'
                        }`}
                      >
                        {/* Posición con borde decorativo */}
                        <td className={`px-4 py-4 text-center font-extrabold text-slate-400 ${esEquipoUsuario ? '' : borderDecoracion}`}>
                          {pos}
                        </td>

                        {/* Logo/Nombre del Club */}
                        <td className="px-4 py-4 flex items-center gap-3">
                          <span className="text-2xl">{clubInfo?.escudo}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-100 font-semibold">{fila.nombreEquipo}</span>
                            {esEquipoUsuario && (
                              <span className="text-[9px] uppercase font-bold tracking-wider bg-teal-500 text-slate-950 px-1.5 py-0.5 rounded shadow-sm">
                                TU CLUB
                              </span>
                            )}
                          </div>
                        </td>

                        {/* PJ, G, E, P */}
                        <td className="px-3 py-4 text-center text-slate-300 font-semibold">{fila.partidosJugados}</td>
                        <td className="px-3 py-4 text-center text-slate-400">{fila.ganados}</td>
                        <td className="px-3 py-4 text-center text-slate-400">{fila.empatados}</td>
                        <td className="px-3 py-4 text-center text-slate-400">{fila.perdidos}</td>

                        {/* Goles a Favor / En Contra */}
                        <td className="px-3 py-4 text-center text-slate-500 font-mono">{fila.golesFavor}</td>
                        <td className="px-3 py-4 text-center text-slate-500 font-mono">{fila.golesContra}</td>

                        {/* Diferencia de goles */}
                        <td className={`px-3 py-4 text-center font-bold font-mono ${
                          fila.diferenciaGoles > 0 ? 'text-emerald-400' :
                          fila.diferenciaGoles < 0 ? 'text-rose-450 text-rose-400' :
                          'text-slate-500'
                        }`}>
                          {fila.diferenciaGoles > 0 ? `+${fila.diferenciaGoles}` : fila.diferenciaGoles}
                        </td>

                        {/* Puntos (Pilar central de clasificación) */}
                        <td className="px-3 py-4 text-center font-black text-slate-100 text-sm font-mono">
                          {fila.puntos}
                        </td>

                        {/* Forma Reciente (Burbujas G, E, P) */}
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
                            {fila.forma.length > 0 ? (
                              fila.forma.map((resultado, idx) => (
                                <span
                                  key={idx}
                                  className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[9px] leading-none select-none shadow-sm ${
                                    resultado === 'G' ? 'bg-emerald-500 text-slate-950' :
                                    resultado === 'E' ? 'bg-yellow-500 text-slate-950' :
                                    'bg-rose-500 text-white'
                                  }`}
                                  title={
                                    resultado === 'G' ? 'Ganado' :
                                    resultado === 'E' ? 'Empatado' :
                                    'Perdido'
                                  }
                                >
                                  {resultado}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-600 italic select-none">Sin disputar</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Leyenda */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-900/20 border border-slate-800/40 rounded-xl p-4 text-xs text-slate-500 justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-3 bg-emerald-500 rounded-full"></span>
                <span>1°: Campeón Oficial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-3 bg-blue-500 rounded-full"></span>
                <span>2° - 4°: Clasificación Copa de Campeones</span>
              </div>
            </div>
            <div className="italic">
              * Los empates en puntaje se resuelven por Diferencia de Goles (DG) y luego Goles a Favor (GF).
            </div>
          </div>
        </>
      ) : (
        <EstadisticasView />
      )}

    </div>
  );
};
