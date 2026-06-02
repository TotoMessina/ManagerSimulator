import React from 'react';
import { useGame } from '../context/useGame';

export const CentroDeMedios: React.FC = () => {
  const { ruedaPrensaActiva, responderRuedaPrensa, equipoUsuario } = useGame();

  if (!ruedaPrensaActiva) return null;

  return (
    <div 
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-fade-in border-t-4 border-t-teal-500"
      style={{
        background: `linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(9, 13, 22, 0.98))`
      }}
    >
      {/* Luces de flashes y decoraciones simuladas */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Cabecera de la Sala de Prensa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 font-extrabold text-[10px] tracking-widest uppercase">
            🎙️ Centro de Medios
          </div>
          <h2 className="text-xl font-extrabold text-white mt-2 tracking-tight">
            Sala de Rueda de Prensa Oficial
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Los periodistas de los principales medios deportivos han tomado sus asientos. Tus declaraciones afectarán la moral del vestuario y el apoyo de la directiva.
          </p>
        </div>
        
        {/* Badge del Club */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 self-start sm:self-center">
          <span className="text-2xl">{equipoUsuario?.escudo}</span>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider leading-none">Club</span>
            <span className="text-xs font-bold text-slate-350 mt-0.5">{equipoUsuario?.nombreCorto} Press Room</span>
          </div>
        </div>
      </div>

      {/* Panel de Preguntas */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 mb-6 relative">
        {/* Efecto Flash */}
        <div className="absolute top-3 right-3 text-slate-600 animate-pulse text-xs select-none">
          📸 FLASH ACTIVE
        </div>
        
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg flex-shrink-0">
            🎤
          </div>
          <div>
            <h4 className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">Pregunta de la Prensa</h4>
            <p className="text-slate-200 font-semibold text-sm leading-relaxed mt-1.5 italic">
              {ruedaPrensaActiva.pregunta}
            </p>
          </div>
        </div>
      </div>

      {/* Opciones de Respuesta */}
      <div className="space-y-4">
        <h4 className="text-[10px] uppercase font-extrabold text-slate-500 tracking-widest pl-1 mb-2">
          Seleccioná tu Respuesta
        </h4>
        
        <div className="grid grid-cols-1 gap-4">
          {ruedaPrensaActiva.opciones.map((opcion) => {
            let borderStyle = 'border-slate-800 hover:border-slate-700 hover:bg-slate-850/40';
            let colorOpcion = 'text-slate-400';
            let badgeStyle = 'bg-slate-900 border-slate-800 text-slate-400';
            let badgeText = '';

            if (opcion.tipo === 'proteger') {
              borderStyle = 'border-slate-800 hover:border-teal-500/30 hover:bg-teal-500/5';
              colorOpcion = 'text-teal-400 group-hover:text-teal-350';
              badgeStyle = 'bg-teal-500/10 border-teal-500/20 text-teal-400';
              badgeText = 'Proteger Plantel';
            } else if (opcion.tipo === 'critica') {
              borderStyle = 'border-slate-800 hover:border-rose-500/30 hover:bg-rose-500/5';
              colorOpcion = 'text-rose-400 group-hover:text-rose-350';
              badgeStyle = 'bg-rose-500/10 border-rose-500/20 text-rose-400';
              badgeText = 'Crítica Dura';
            } else {
              borderStyle = 'border-slate-800 hover:border-blue-500/30 hover:bg-blue-500/5';
              colorOpcion = 'text-blue-400 group-hover:text-blue-350';
              badgeStyle = 'bg-blue-500/10 border-blue-500/20 text-blue-400';
              badgeText = 'Evasiva Corporativa';
            }

            return (
              <button
                key={opcion.id}
                onClick={() => responderRuedaPrensa(opcion.tipo)}
                className={`w-full text-left p-4 rounded-xl border ${borderStyle} transition-all duration-200 group flex items-start justify-between gap-4`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${badgeStyle} uppercase`}>
                      {badgeText}
                    </span>
                  </div>
                  <p className="text-slate-100 font-bold text-xs leading-relaxed group-hover:text-white mt-2">
                    "{opcion.texto.substring(opcion.texto.indexOf(':') + 1).trim()}"
                  </p>
                  <p className="text-[10px] text-slate-500 italic mt-1 font-mono">
                    {opcion.explicacionEfecto}
                  </p>
                </div>

                <div className="w-6 h-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-extrabold text-[10px] text-slate-400 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-500 transition-colors flex-shrink-0 mt-0.5 font-mono">
                  →
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
