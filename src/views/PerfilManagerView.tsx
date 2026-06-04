import React from 'react';
import { useGame } from '../context/useGame';
import { equiposLaLiga, equiposPremier, equiposSerieA, equiposBundesliga } from '../data/initialData';

export const PerfilManagerView: React.FC = () => {
  const {
    equipos,
    nombreManager,
    reputacionManager,
    historialTitulos,
    equipoUsuario,
    aceptarOfertaEmpleo
  } = useGame();

  const obtenerDatosLiga = (equipoId: string): { pais: string; bandera: string; ligaNombre: string } => {
    if (equiposLaLiga.some(e => e.id === equipoId)) {
      return { pais: 'España', bandera: '🇪🇸', ligaNombre: 'La Liga EA Sports' };
    }
    if (equiposPremier.some(e => e.id === equipoId)) {
      return { pais: 'Inglaterra', bandera: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', ligaNombre: 'Premier League' };
    }
    if (equiposSerieA.some(e => e.id === equipoId)) {
      return { pais: 'Italia', bandera: '🇮🇹', ligaNombre: 'Serie A' };
    }
    return { pais: 'Alemania', bandera: '🇩🇪', ligaNombre: 'Bundesliga' };
  };

  const formatearMoneda = (valor: number): string => {
    if (valor >= 1000000) {
      return `${(valor / 1000000).toFixed(1)} M€`;
    }
    return `${(valor / 1000).toFixed(0)} m€`;
  };

  const getLicencia = (rep: number): string => {
    if (rep <= 20) return 'Licencia Nacional C (Amateur)';
    if (rep <= 40) return 'Licencia Nacional B (Semi-Pro)';
    if (rep <= 60) return 'Licencia Nacional A (Profesional)';
    if (rep <= 80) return 'Licencia Continental Pro (Elite)';
    return 'Licencia Mundial Oro (Leyenda)';
  };

  // Filtrar clubes vacantes
  const clubesVacantes = equipos.filter(e => e.sinEntrenador);

  // Ofertas de trabajo válidas: reputación del club <= reputacionManager + 5
  let ofertasTrabajo = clubesVacantes.filter(e => e.reputacion <= reputacionManager + 5);

  // Si no hay ninguna oferta disponible, garantizamos al menos una oferta del club vacante con menor reputación para no bloquear la partida.
  if (ofertasTrabajo.length === 0 && clubesVacantes.length > 0) {
    const clubMenorRep = [...clubesVacantes].sort((a, b) => a.reputacion - b.reputacion)[0];
    ofertasTrabajo = [clubMenorRep];
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Encabezado de Perfil */}
      <div className="relative bg-slate-900/40 backdrop-blur-md rounded-2xl p-8 border border-slate-800/80 flex flex-col md:flex-row items-center gap-6 overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-teal-500/10 blur-[80px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none"></div>

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-650 flex items-center justify-center text-4xl shadow-xl border border-teal-400/20 font-black">
            👔
          </div>
          <div className="absolute -bottom-2 -right-2 bg-slate-950 border border-slate-800 text-[10px] text-teal-400 font-bold px-2.5 py-0.5 rounded-full shadow">
            NIVEL {Math.floor(reputacionManager / 10) + 1}
          </div>
        </div>

        {/* Info Manager */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <h1 className="text-3xl font-black text-white tracking-tight">{nombreManager}</h1>
            <span className="px-3 py-1 rounded-full bg-slate-950/80 border border-slate-850 text-slate-400 text-xs font-bold font-mono">
              {equipoUsuario ? `Director Técnico de ${equipoUsuario.nombre} ${equipoUsuario.escudo}` : '🏆 Mánager Desempleado'}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{getLicencia(reputacionManager)}</p>

          {/* Reputación Gauge */}
          <div className="pt-2 max-w-md mx-auto md:mx-0">
            <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-500 mb-1.5">
              <span>Reputación del Manager</span>
              <span className="text-teal-400 font-mono font-extrabold">{reputacionManager}%</span>
            </div>
            <div className="h-3 w-full bg-slate-950/80 rounded-full border border-slate-850 overflow-hidden">
              <div 
                style={{ width: `${reputacionManager}%` }}
                className="h-full bg-gradient-to-r from-teal-500 via-emerald-450 to-indigo-500 rounded-full transition-all duration-1000"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Historial de Títulos & Ofertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Historial de Títulos */}
        <div className="lg:col-span-1 bg-slate-900/30 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 flex flex-col">
          <h2 className="text-lg font-black text-slate-200 mb-4 flex items-center gap-2">
            <span>🏆</span> Vitrina de Trofeos
          </h2>
          {historialTitulos.length === 0 ? (
            <div className="flex-1 py-12 text-center border-2 border-dashed border-slate-800/60 rounded-xl bg-slate-950/30 p-4 flex flex-col items-center justify-center">
              <span className="text-4xl block mb-2 opacity-40">🏆</span>
              <p className="text-xs font-semibold text-slate-400">Sin títulos ganados aún</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Ganá ligas o copas continentales para llenar esta vitrina de trofeos.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {historialTitulos.map((titulo, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-950/50 border border-slate-850 rounded-xl shadow-sm">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="text-xs font-extrabold text-slate-200">{titulo}</p>
                    <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">Campeón</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ofertas de Empleo */}
        <div className="lg:col-span-2 bg-slate-900/30 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80">
          <h2 className="text-lg font-black text-slate-200 mb-2 flex items-center gap-2">
            <span>💼</span> Ofertas de Empleo Disponibles
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Clubes sin director técnico que buscan tu perfil. Con tu reputación del <strong className="text-teal-400 font-mono font-bold">{reputacionManager}%</strong> podés postular a equipos de hasta <strong className="text-indigo-400 font-mono font-bold">{reputacionManager + 5}%</strong> de prestigio.
          </p>

          {ofertasTrabajo.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-800/60 rounded-xl bg-slate-950/30">
              <span className="text-4xl block mb-2">👔📭</span>
              <p className="text-xs font-semibold text-slate-400">No hay ofertas de empleo en este momento</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Los clubes suelen cambiar de entrenador al finalizar la temporada de su respectiva liga.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-1">
              {ofertasTrabajo.map((equipo) => {
                const ligaInfo = obtenerDatosLiga(equipo.id);
                const estrellas = '⭐'.repeat(Math.round(equipo.reputacion / 20));

                return (
                  <div 
                    key={equipo.id}
                    className="p-4 rounded-xl border border-slate-850 bg-slate-950/40 hover:bg-slate-950/70 transition-all flex flex-col justify-between group relative overflow-hidden"
                    style={{ borderTop: `3px solid ${equipo.colorPrincipal}` }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-3xl transition-transform group-hover:scale-110 duration-200">{equipo.escudo}</span>
                          <div>
                            <h4 className="text-xs font-extrabold text-white truncate max-w-[120px]">{equipo.nombre}</h4>
                            <p className="text-[9px] text-slate-500 font-medium">
                              {ligaInfo.bandera} {ligaInfo.ligaNombre}
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          {equipo.nombreCorto}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[10px] border-t border-slate-900 pt-3 mb-4">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Reputación Club:</span>
                          <span className="text-amber-500 font-semibold">{estrellas} <span className="text-slate-400 font-mono">({equipo.reputacion}%)</span></span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Presupuesto Fichajes:</span>
                          <span className="text-teal-400 font-mono font-bold">{formatearMoneda(equipo.presupuestoFichajes)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Estadio:</span>
                          <span className="text-slate-400 text-right truncate max-w-[110px]" title={equipo.estadio}>{equipo.estadio}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mt-2">
                      {equipoUsuario && (
                        <p className="text-[9px] text-rose-400 font-medium text-center">
                          ⚠️ Rescindirá tu contrato en {equipoUsuario.nombre}
                        </p>
                      )}
                      <button
                        onClick={() => aceptarOfertaEmpleo(equipo.id)}
                        className="w-full py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                      >
                        ✍️ Firmar Contrato
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
