import React, { useState } from 'react';
import { AcademiaReporte } from '../types';

interface AcademiaReportViewProps {
  reporte: AcademiaReporte;
  alCerrar: () => void;
}

export const AcademiaReportView: React.FC<AcademiaReportViewProps> = ({ reporte, alCerrar }) => {
  const [filtro, setFiltro] = useState<'todos' | 'joyas' | 'retiros'>('todos');

  const { retirados, promovidos } = reporte;

  const totalRetirados = retirados.length;
  const totalPromovidos = promovidos.length;
  const totalJoyas = promovidos.filter(p => p.esJoya).length;

  const filtradosPromovidos = filtro === 'joyas' ? promovidos.filter(p => p.esJoya) : promovidos;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 flex flex-col justify-between"
      style={{
        backgroundImage: 'radial-gradient(circle at top, rgba(30, 41, 59, 0.7) 0%, rgba(9, 13, 22, 0.99) 70%)'
      }}
    >
      {/* Decorative Blur Backdrops */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-16 flex-grow relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold text-xs tracking-widest uppercase mb-4 animate-pulse">
            📋 Informe de Cierre de Temporada
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            REPORTE DE LA ACADEMIA Y RETIROS
          </h1>
          <p className="max-w-2xl mx-auto text-sm text-slate-400 mt-2">
            El departamento de inteligencia deportiva ha completado la transición anual. Repasá los futbolistas retirados y los nuevos juveniles promovidos para el ciclo profesional.
          </p>
        </div>

        {/* Counter Badges / Quick Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center backdrop-blur-sm">
            <span className="text-2xl block">🏃‍♂️</span>
            <span className="text-2xl font-black text-slate-200 block mt-1">{totalRetirados}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Jugadores Retirados</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center backdrop-blur-sm">
            <span className="text-2xl block">🌱</span>
            <span className="text-2xl font-black text-teal-400 block mt-1">{totalPromovidos}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Nuevos Canteranos</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center backdrop-blur-sm border-amber-500/30">
            <span className="text-2xl block">💎</span>
            <span className="text-2xl font-black text-amber-400 block mt-1">{totalJoyas}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Joyas Mundiales (PA 85+)</span>
          </div>
        </div>

        {/* Filters Tabs */}
        <div className="flex justify-center gap-2 mb-8 border-b border-slate-850 pb-4">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filtro === 'todos' 
                ? 'bg-slate-800 text-white shadow-md border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📋 Todos los Cambios
          </button>
          <button
            onClick={() => setFiltro('joyas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filtro === 'joyas' 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-md shadow-amber-500/5' 
                : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            💎 Solo Joyas Mundiales
          </button>
          <button
            onClick={() => setFiltro('retiros')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filtro === 'retiros' 
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-md' 
                : 'text-slate-400 hover:text-rose-450'
            }`}
          >
            👴 Solo Retirados
          </button>
        </div>

        {/* Dynamic Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* PANEL 1: RETIROS */}
          {(filtro === 'todos' || filtro === 'retiros') && (
            <div className={`space-y-4 ${filtro === 'retiros' ? 'lg:col-span-2 max-w-4xl mx-auto w-full' : ''}`}>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-850 pb-2">
                👴 Jugadores Retirados ({totalRetirados})
              </h2>

              {retirados.length === 0 ? (
                <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-8 text-center text-slate-500 italic">
                  Ningún jugador ha colgado los botines en esta temporada.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                  {retirados.map(({ jugador, edad, clubNombre, clubEscudo }) => {
                    const esSuperstar = jugador.pa >= 80 || jugador.ca >= 76;
                    return (
                      <div 
                        key={jugador.id}
                        className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                          esSuperstar 
                            ? 'bg-rose-950/10 border-rose-500/25 shadow-lg shadow-rose-950/10' 
                            : 'bg-slate-900/40 border-slate-800/80'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 uppercase">
                              {jugador.posicion}
                            </span>
                            <h3 className="text-sm font-bold text-white mt-1.5">{jugador.nombre}</h3>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {jugador.nacionalidad} · {edad} años
                            </p>
                          </div>
                          
                          {/* Club Badge */}
                          <div className="flex flex-col items-center bg-slate-950/50 rounded-lg p-1.5 border border-slate-800/60" title={clubNombre}>
                            <span className="text-xl">{clubEscudo}</span>
                            <span className="text-[8px] text-slate-500 font-bold truncate max-w-[60px]">{clubNombre}</span>
                          </div>
                        </div>

                        {/* Stars or Legend details */}
                        <div className="mt-4 pt-3 border-t border-slate-850 flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] uppercase font-bold text-slate-500">Última CA:</span>
                            <span className="text-xs font-bold text-slate-300 font-mono">{jugador.ca}</span>
                          </div>
                          {esSuperstar ? (
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-350 border border-rose-500/30 animate-pulse">
                              🌟 Leyenda
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold uppercase text-slate-500">
                              Retirado
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PANEL 2: PROMOVIDOS (NEWGENS) */}
          {(filtro === 'todos' || filtro === 'joyas') && (
            <div className={`space-y-4 ${filtro === 'joyas' ? 'lg:col-span-2 max-w-4xl mx-auto w-full' : ''}`}>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-850 pb-2">
                🌱 Canteranos Promovidos ({filtradosPromovidos.length})
              </h2>

              {filtradosPromovidos.length === 0 ? (
                <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-8 text-center text-slate-500 italic">
                  Ningún canterano cumple con los filtros activos.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                  {filtradosPromovidos.map(({ jugador, clubNombre, clubEscudo, esJoya }) => {
                    return (
                      <div 
                        key={jugador.id}
                        className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                          esJoya 
                            ? 'bg-gradient-to-br from-indigo-950/20 via-slate-900 to-indigo-950/20 border-amber-500/60 shadow-lg shadow-amber-500/5' 
                            : 'bg-slate-900/40 border-slate-800/80'
                        }`}
                      >
                        {/* Glow indicator for Joya */}
                        {esJoya && (
                          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
                        )}

                        <div className="flex justify-between items-start relative z-10">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded leading-none ${
                                jugador.posicion === 'POR' ? 'bg-amber-500/10 text-amber-400' :
                                jugador.posicion === 'DFC' || jugador.posicion === 'LI' || jugador.posicion === 'LD' ? 'bg-blue-500/10 text-blue-400' :
                                jugador.posicion === 'MC' || jugador.posicion === 'MCO' ? 'bg-emerald-500/10 text-emerald-400' :
                                'bg-rose-500/10 text-rose-450'
                              }`}>
                                {jugador.posicion}
                              </span>
                              
                              {esJoya && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-350 border border-amber-500/30 flex items-center gap-0.5">
                                  💎 Joya Mundial
                                </span>
                              )}
                            </div>
                            
                            <h3 className="text-sm font-extrabold text-white mt-2 flex items-center gap-1">
                              {jugador.nombre}
                              <span className="text-[9px] text-teal-400 font-mono font-normal">({jugador.edad} años)</span>
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {jugador.nacionalidad}
                            </p>
                          </div>

                          {/* Club Badge */}
                          <div className="flex flex-col items-center bg-slate-950/60 rounded-lg p-1.5 border border-slate-800/60" title={clubNombre}>
                            <span className="text-xl">{clubEscudo}</span>
                            <span className="text-[8px] text-slate-450 font-bold truncate max-w-[70px] mt-0.5">{clubNombre}</span>
                          </div>
                        </div>

                        {/* Potentials & Stats */}
                        <div className="mt-4 pt-3 border-t border-slate-850/80 flex items-center justify-between relative z-10">
                          <div className="flex gap-4">
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] uppercase font-bold text-slate-500">CA:</span>
                              <span className="text-xs font-bold text-teal-400 font-mono">{jugador.ca}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] uppercase font-bold text-slate-500">PA:</span>
                              <span className={`text-xs font-black font-mono ${esJoya ? 'text-amber-400' : 'text-slate-300'}`}>
                                {jugador.pa}
                              </span>
                            </div>
                          </div>

                          <div className="text-[9px] text-slate-500 font-medium">
                            Contrato: {jugador.mesesContrato} meses
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Footer / Action Bar */}
      <div className="bg-slate-900/80 border-t border-slate-850/80 px-6 py-5 backdrop-blur-md relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <p className="text-xs text-slate-400">
            Los juveniles han sido agregados a los planteles correspondientes o declarados como agentes libres.
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Podrás buscarlos e intentar ficharlos desde el Mercado de Transferencias.
          </p>
        </div>
        
        <button
          onClick={alCerrar}
          className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 hover:from-teal-450 hover:to-emerald-500 text-white font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-teal-500/10 active:scale-[0.98] transform transition-all duration-200"
        >
          💼 Continuar a la Oficina
        </button>
      </div>
    </div>
  );
};
