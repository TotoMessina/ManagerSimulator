import React, { useState, useEffect } from 'react';
import { useGame } from '../context/useGame';
import { JugadorAgente } from '../types';

const fmt = (v: number) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1)} M€`
    : `${(v / 1_000).toFixed(0)} m€`;

const POS_COLORS: Record<string, string> = {
  POR: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  DFC: 'text-blue-400  bg-blue-400/10  border-blue-400/30',
  LD:  'text-blue-300  bg-blue-300/10  border-blue-300/30',
  LI:  'text-blue-300  bg-blue-300/10  border-blue-300/30',
  MC:  'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  MCO: 'text-emerald-300 bg-emerald-300/10 border-emerald-300/30',
  ED:  'text-orange-400 bg-orange-400/10 border-orange-400/30',
  EI:  'text-orange-400 bg-orange-400/10 border-orange-400/30',
  DC:  'text-rose-400  bg-rose-400/10  border-rose-400/30',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Ticker: React.FC<{ noticias: string[] }> = ({ noticias }) => {
  const msg = noticias.slice(0, 8).join('  ◆  ');
  return (
    <div className="w-full bg-red-600 flex items-center overflow-hidden h-9 border-b border-red-500">
      <div className="flex-shrink-0 bg-black text-red-400 font-black text-xs px-4 h-full flex items-center tracking-widest uppercase border-r border-red-500">
        🔴 LIVE
      </div>
      <div className="ticker-wrap flex-1 overflow-hidden h-full flex items-center">
        <div className="ticker-content whitespace-nowrap text-white font-semibold text-xs" style={{ animation: 'ticker 28s linear infinite' }}>
          {msg || 'DEADLINE DAY — El mercado de pases cierra hoy. ¡Actuá rápido!'}
        </div>
      </div>
    </div>
  );
};

const Countdown: React.FC<{ horas: number }> = ({ horas }) => {
  const critico = horas <= 3;
  const color = critico ? 'text-red-500' : 'text-cyan-400';
  const glow  = critico ? 'shadow-[0_0_40px_rgba(239,68,68,0.5)]' : 'shadow-[0_0_40px_rgba(34,211,238,0.3)]';
  const border = critico ? 'border-red-500/50' : 'border-cyan-500/30';

  return (
    <div className={`relative rounded-2xl border ${border} ${glow} bg-black/60 backdrop-blur p-6 text-center`}>
      {critico && (
        <div className="absolute inset-0 rounded-2xl animate-pulse bg-red-500/5" />
      )}
      <p className="text-xs text-slate-400 uppercase tracking-widest mb-2 font-bold">
        Tiempo restante
      </p>
      <div className={`font-black tabular-nums ${color} leading-none`}
        style={{ fontSize: '5rem', textShadow: critico ? '0 0 30px rgba(239,68,68,0.8)' : '0 0 20px rgba(34,211,238,0.7)', animation: critico ? 'pulse 1s ease-in-out infinite' : 'none' }}>
        {String(horas).padStart(2, '0')}
        <span className="text-slate-500 mx-1" style={{ fontSize: '3rem' }}>:</span>
        <span style={{ fontSize: '3rem' }}>00</span>
      </div>
      <p className={`text-xs font-bold mt-2 ${color} uppercase tracking-widest`}>
        {horas === 0 ? '⛔ MERCADO CERRADO' : critico ? '🚨 ÚLTIMAS HORAS' : 'horas : minutos'}
      </p>

      {/* Progress bar */}
      <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${critico ? 'bg-red-500' : 'bg-cyan-500'}`}
          style={{ width: `${(horas / 24) * 100}%` }}
        />
      </div>
      <p className="text-xs text-slate-600 mt-1">{24 - horas} de 24 horas transcurridas</p>
    </div>
  );
};

const AgenteCard: React.FC<{
  agente: JugadorAgente;
  onComprar: (id: string) => void;
  presupuesto: number;
}> = ({ agente, onComprar, presupuesto }) => {
  const [resultado, setResultado] = useState<string | null>(null);
  const puedeComprar = presupuesto >= agente.valorDescuento && !agente.comprado;
  const posColor = POS_COLORS[agente.posicion] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/30';

  const handleComprar = () => {
    onComprar(agente.id);
    setResultado('¡Fichaje completado!');
  };

  return (
    <div className={`relative rounded-xl border border-slate-700/60 bg-slate-900/70 p-4 transition-all duration-200 ${agente.comprado ? 'opacity-40' : 'hover:border-cyan-500/40 hover:bg-slate-800/70'}`}>
      {agente.comprado && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 z-10">
          <span className="text-green-400 font-black text-sm">✅ FICHADO</span>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${posColor}`}>
              {agente.posicion}
            </span>
            <span className="text-[10px] text-slate-500">{agente.edad} años · {agente.nacionalidad}</span>
          </div>
          <p className="font-bold text-sm text-white truncate">{agente.nombre}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-slate-400">CA <span className="font-bold text-cyan-400">{agente.ca}</span></span>
            <span className="text-xs text-slate-400">PA <span className="font-bold text-purple-400">{agente.pa}</span></span>
            <span className="text-[10px] text-slate-500">{agente.personalidad}</span>
          </div>
        </div>
        {/* Pricing */}
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-slate-500 line-through">{fmt(agente.valorMercado)}</p>
          <p className="text-base font-black text-green-400">{fmt(agente.valorDescuento)}</p>
          <div className="inline-flex items-center gap-1 bg-green-500/10 border border-green-500/30 rounded px-1.5 py-0.5 mt-0.5">
            <span className="text-[10px] font-bold text-green-400">-30%</span>
          </div>
        </div>
      </div>
      {resultado ? (
        <p className="text-xs text-green-400 font-bold mt-2 text-center">{resultado}</p>
      ) : (
        <button
          onClick={handleComprar}
          disabled={!puedeComprar}
          className={`w-full mt-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
            puedeComprar
              ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 hover:text-white'
              : 'bg-slate-800 border border-slate-700 text-slate-600 cursor-not-allowed'
          }`}
        >
          {puedeComprar ? `⚡ Fichar por ${fmt(agente.valorDescuento)}` : presupuesto < agente.valorDescuento ? '💸 Sin presupuesto' : '⏹ No disponible'}
        </button>
      )}
    </div>
  );
};

// ─── Main View ────────────────────────────────────────────────────────────────

export const DeadlineDayView: React.FC = () => {
  const {
    horasDeadline,
    jugadoresAgentes,
    noticias,
    avanzarHoraDeadline,
    comprarJugadorAgente,
    equipoUsuario,
    ofertaRecibidaActiva,
    aceptarOfertaRecibida,
    rechazarOfertaRecibida,
  } = useGame();

  const [avanzando, setAvanzando] = useState(false);
  const [pulso, setPulso] = useState(false);

  // Pulse effect on state change
  useEffect(() => {
    setPulso(true);
    const t = setTimeout(() => setPulso(false), 600);
    return () => clearTimeout(t);
  }, [horasDeadline]);

  const handleAvanzar = async () => {
    if (horasDeadline <= 0) return;
    setAvanzando(true);
    avanzarHoraDeadline();
    setTimeout(() => setAvanzando(false), 400);
  };

  const critico = horasDeadline <= 3;
  const presupuesto = equipoUsuario?.presupuestoFichajes ?? 0;

  return (
    <div className="min-h-screen bg-[#04060d] text-slate-100 flex flex-col overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Ticker ── */}
      <Ticker noticias={noticias} />

      {/* ── Header ── */}
      <div className="relative flex items-center justify-between px-8 py-5 border-b border-slate-800 bg-[#060a14]">
        {/* Glow BG */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: critico ? 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.08), transparent 70%)' : 'radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.06), transparent 70%)' }} />

        <div className="flex items-center gap-4 z-10">
          <div className={`text-4xl font-black tracking-tighter ${critico ? 'text-red-500' : 'text-cyan-400'}`}
            style={{ textShadow: critico ? '0 0 20px rgba(239,68,68,0.8)' : '0 0 20px rgba(34,211,238,0.6)' }}>
            DEADLINE DAY
          </div>
          <div className={`h-6 w-px ${critico ? 'bg-red-500/40' : 'bg-cyan-500/40'}`} />
          <div className="text-sm text-slate-400 font-semibold">
            Cierre de Mercado de Pases — Temporada 2026/27
          </div>
        </div>

        <div className="flex items-center gap-6 z-10">
          {/* Budget */}
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Presupuesto</p>
            <p className={`text-lg font-black ${presupuesto < 0 ? 'text-red-400' : 'text-white'}`}>
              {fmt(Math.abs(presupuesto))}
            </p>
          </div>
          <div className={`w-2 h-2 rounded-full ${critico ? 'bg-red-500 animate-ping' : 'bg-cyan-500 animate-pulse'}`} />
        </div>
      </div>

      {/* ── Offer Alert Banner ── */}
      {ofertaRecibidaActiva && (
        <div className="mx-6 mt-4 rounded-xl border border-amber-500/50 bg-amber-500/10 px-5 py-3 flex items-center justify-between gap-4"
          style={{ animation: 'slideDown 0.3s ease both' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">Oferta DESESPERADA recibida</p>
              <p className="text-sm text-white font-semibold">
                <span className="text-amber-300">{ofertaRecibidaActiva.clubCompradorEscudo} {ofertaRecibidaActiva.clubCompradorNombre}</span> ofrece{' '}
                <span className="text-green-400 font-black">{fmt(ofertaRecibidaActiva.montoOfrecido)}</span> por{' '}
                <span className="text-white">{ofertaRecibidaActiva.jugadorNombre}</span>
                <span className="text-xs text-amber-400 ml-2">(×{ofertaRecibidaActiva.multiplicador.toFixed(2)} valor mercado)</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={aceptarOfertaRecibida}
              className="px-4 py-1.5 rounded-lg bg-green-500/20 border border-green-500/50 text-green-300 text-xs font-bold hover:bg-green-500/30 transition-all">
              ✅ Aceptar
            </button>
            <button onClick={rechazarOfertaRecibida}
              className="px-4 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold hover:bg-rose-500/30 transition-all">
              ❌ Rechazar
            </button>
          </div>
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden min-h-0">

        {/* LEFT — Countdown + Advance */}
        <div className="col-span-3 flex flex-col gap-5">
          <Countdown horas={horasDeadline} />

          {/* Advance Button */}
          <button
            onClick={handleAvanzar}
            disabled={avanzando || horasDeadline <= 0}
            className={`relative w-full py-5 rounded-2xl font-black text-lg uppercase tracking-widest transition-all duration-200 overflow-hidden
              ${horasDeadline <= 0
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                : critico
                  ? 'bg-red-600 hover:bg-red-500 text-white border border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_50px_rgba(239,68,68,0.7)]'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-500 shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_50px_rgba(34,211,238,0.5)]'
              }
              ${avanzando ? 'scale-95' : 'scale-100'}
              ${pulso ? 'animate-pulse' : ''}
            `}
            style={{ animation: avanzando ? 'none' : undefined }}
          >
            {avanzando ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Procesando...
              </span>
            ) : horasDeadline <= 0 ? (
              '⛔ MERCADO CERRADO'
            ) : (
              <>
                ⏩ Avanzar 1 Hora
                <div className="absolute inset-0 bg-white/5 rounded-2xl" style={{ animation: 'shimmerBtn 2s infinite' }} />
              </>
            )}
          </button>

          {/* Stats */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Estado del mercado</p>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Agentes disponibles</span>
              <span className="font-bold text-cyan-400">{jugadoresAgentes.filter(a => !a.comprado).length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Horas transcurridas</span>
              <span className="font-bold text-white">{24 - horasDeadline} / 24</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Modo IA</span>
              <span className="font-bold text-amber-400">🔥 Agresiva +50%</span>
            </div>
          </div>
        </div>

        {/* CENTER — Free Agents */}
        <div className="col-span-5 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-white tracking-tight">
                📞 Agentes Ofreciendo Jugadores
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Jugadores sin club con 30% de descuento por cierre de ventana</p>
            </div>
            <div className="flex-shrink-0 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-bold uppercase tracking-wider">
              ↓ 30% OFF
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {jugadoresAgentes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <span className="text-4xl mb-3">📵</span>
                <p className="text-slate-400 text-sm">Los agentes aún no se han contactado.</p>
                <p className="text-slate-600 text-xs mt-1">Avanzá horas para que aparezcan jugadores disponibles.</p>
              </div>
            ) : (
              jugadoresAgentes.map(agente => (
                <AgenteCard
                  key={agente.id}
                  agente={agente}
                  onComprar={comprarJugadorAgente}
                  presupuesto={presupuesto}
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT — Live Feed */}
        <div className="col-span-4 flex flex-col gap-4 overflow-hidden">
          <div>
            <h2 className="text-base font-black text-white tracking-tight">
              🗞️ Feed en Tiempo Real
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Novedades del mercado hora a hora</p>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {noticias.slice(0, 20).map((n, i) => {
              const isDeadline = n.includes('DEADLINE') || n.includes('CIERRE') || n.includes('MERCADO');
              const isOffer = n.includes('oferta') || n.includes('DESESPERADA');
              const isAgent = n.includes('Agente') || n.includes('club se ofrece');
              const color = isDeadline ? 'border-red-500/30 bg-red-500/5' : isOffer ? 'border-amber-500/30 bg-amber-500/5' : isAgent ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-slate-700/50 bg-slate-800/20';
              return (
                <div key={i} className={`rounded-lg border ${color} px-3 py-2`} style={{ animation: i === 0 ? 'slideDown 0.3s ease both' : 'none' }}>
                  <p className="text-xs text-slate-300 leading-relaxed">{n}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerBtn {
          0%   { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(300%) skewX(-15deg); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>
    </div>
  );
};
