import React from 'react';
import { useGame } from '../context/useGame';

export const EstadisticasView: React.FC = () => {
  const { jugadores, equipos } = useGame();

  // Obtener goleadores ordenador de mayor a menor y tomar el top 10
  const topGoleadores = [...jugadores]
    .sort((a, b) => {
      if ((b.goles || 0) !== (a.goles || 0)) {
        return (b.goles || 0) - (a.goles || 0);
      }
      return (a.partidosJugados || 0) - (b.partidosJugados || 0); // Desempate por menos partidos
    })
    .slice(0, 10);

  // Obtener asistidores ordenados de mayor a menor y tomar el top 10
  const topAsistidores = [...jugadores]
    .sort((a, b) => {
      if ((b.asistencias || 0) !== (a.asistencias || 0)) {
        return (b.asistencias || 0) - (a.asistencias || 0);
      }
      return (a.partidosJugados || 0) - (b.partidosJugados || 0);
    })
    .slice(0, 10);

  // Helper para buscar los datos del club del jugador
  const obtenerClub = (idEquipo: string) => {
    return equipos.find(e => e.id === idEquipo);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-fade-in">
      
      {/* ==========================================
          TABLA 1: MÁXIMOS GOLEADORES
          ========================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚽</span>
            <h3 className="font-extrabold uppercase text-xs tracking-wider text-slate-200">Máximos Goleadores</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bota de Oro</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 uppercase font-extrabold text-[10px] text-slate-500 tracking-wider">
                <th className="px-4 py-3 text-center w-12">Pos</th>
                <th className="px-4 py-3">Jugador</th>
                <th className="px-4 py-3 text-center">Posición</th>
                <th className="px-4 py-3 text-center">PJ</th>
                <th className="px-4 py-3 text-right">Goles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {topGoleadores.map((j, index) => {
                const club = obtenerClub(j.idEquipo);
                const pos = index + 1;
                return (
                  <tr key={`gol-${j.id}`} className="hover:bg-slate-800/25 transition-colors">
                    {/* Posición */}
                    <td className="px-4 py-3.5 text-center font-extrabold text-slate-400 font-mono">
                      {pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : pos}
                    </td>

                    {/* Jugador e info del club */}
                    <td className="px-4 py-3.5 flex items-center gap-3">
                      <span className="text-xl">{club?.escudo}</span>
                      <div>
                        <div className="font-bold text-slate-200">{j.nombre}</div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase">{club?.nombreCorto}</div>
                      </div>
                    </td>

                    {/* Posición */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-slate-800 bg-slate-950/40 text-slate-400 font-mono">
                        {j.posicion}
                      </span>
                    </td>

                    {/* Partidos Jugados */}
                    <td className="px-4 py-3.5 text-center font-bold text-slate-400 font-mono">
                      {j.partidosJugados || 0}
                    </td>

                    {/* Goles */}
                    <td className="px-4 py-3.5 text-right font-black text-teal-400 text-sm font-mono">
                      {j.goles || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          TABLA 2: MÁXIMOS ASISTIDORES
          ========================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <h3 className="font-extrabold uppercase text-xs tracking-wider text-slate-200">Máximos Asistidores</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Líderes de Pase</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 uppercase font-extrabold text-[10px] text-slate-500 tracking-wider">
                <th className="px-4 py-3 text-center w-12">Pos</th>
                <th className="px-4 py-3">Jugador</th>
                <th className="px-4 py-3 text-center">Posición</th>
                <th className="px-4 py-3 text-center">PJ</th>
                <th className="px-4 py-3 text-right">Asistencias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {topAsistidores.map((j, index) => {
                const club = obtenerClub(j.idEquipo);
                const pos = index + 1;
                return (
                  <tr key={`ast-${j.id}`} className="hover:bg-slate-800/25 transition-colors">
                    {/* Posición */}
                    <td className="px-4 py-3.5 text-center font-extrabold text-slate-400 font-mono">
                      {pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : pos}
                    </td>

                    {/* Jugador e info del club */}
                    <td className="px-4 py-3.5 flex items-center gap-3">
                      <span className="text-xl">{club?.escudo}</span>
                      <div>
                        <div className="font-bold text-slate-200">{j.nombre}</div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase">{club?.nombreCorto}</div>
                      </div>
                    </td>

                    {/* Posición */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-slate-800 bg-slate-950/40 text-slate-400 font-mono">
                        {j.posicion}
                      </span>
                    </td>

                    {/* Partidos Jugados */}
                    <td className="px-4 py-3.5 text-center font-bold text-slate-400 font-mono">
                      {j.partidosJugados || 0}
                    </td>

                    {/* Asistencias */}
                    <td className="px-4 py-3.5 text-right font-black text-teal-400 text-sm font-mono">
                      {j.asistencias || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
