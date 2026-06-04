import React from 'react';
import { useGame } from '../context/useGame';
import { Jugador } from '../types';

export const SalonDeLaFamaView: React.FC = () => {
  const { recordsClub, historialTitulos, jugadores, equipoUsuario } = useGame();

  // Helper to find player details if they are in the current squad
  const obtenerDetallesJugador = (id: string): Jugador | undefined => {
    return jugadores.find((j) => j.id === id);
  };

  // Helper to format large numbers/values
  const formatearFecha = (fechaStr: string) => {
    if (!fechaStr) return 'Fecha desconocida';
    return fechaStr;
  };

  // Render a FUT-styled Golden Legend Card
  const renderTarjetaLeyenda = (
    tituloRecord: string,
    recordData: { jugadorId: string; jugadorNombre: string; cantidad: number },
    tipoRecord: 'goles' | 'asistencias' | 'partidos'
  ) => {
    const jugadorActivo = obtenerDetallesJugador(recordData.jugadorId);
    const esJugadorActivo = !!jugadorActivo;

    // Define colors and icons based on record type
    const configuracion = {
      goles: {
        icono: '⚽',
        etiqueta: 'Goles',
        badgeColor: 'from-amber-500 to-red-500',
        valorDetalle: `${recordData.cantidad} Goles`,
      },
      asistencias: {
        icono: '👟',
        etiqueta: 'Asistencias',
        badgeColor: 'from-amber-500 to-emerald-500',
        valorDetalle: `${recordData.cantidad} Asistencias`,
      },
      partidos: {
        icono: '🏃‍♂️',
        etiqueta: 'Partidos',
        badgeColor: 'from-amber-500 to-blue-500',
        valorDetalle: `${recordData.cantidad} Partidos`,
      },
    }[tipoRecord];

    return (
      <div className="relative group w-full max-w-[280px] mx-auto transition-all duration-300 transform hover:-translate-y-2">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-400 via-yellow-300 to-amber-600 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />

        {/* FUT Card Outer Shell */}
        <div className="relative h-[380px] w-full bg-slate-950 border-2 border-amber-500/40 rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl p-4 transition-all duration-300 group-hover:border-amber-400/80">
          
          {/* Card Shine Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
          
          {/* Top Header Badge */}
          <div className="w-full flex items-center justify-between border-b border-amber-500/20 pb-2">
            <span className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase">
              {tituloRecord}
            </span>
            <span className="text-xs">🏆</span>
          </div>

          {/* Card Middle: Profile and Stat */}
          <div className="flex flex-col items-center justify-center flex-1 py-4 space-y-3">
            {/* Legend avatar / Badge */}
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-700 p-0.5 shadow-lg shadow-amber-500/10 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-4xl select-none">
                {configuracion.icono}
              </div>
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                LEG
              </span>
            </div>

            {/* Player Name */}
            <div className="text-center">
              <h4 className="text-base font-extrabold text-slate-100 group-hover:text-amber-300 transition-colors tracking-tight line-clamp-1">
                {recordData.jugadorNombre}
              </h4>
              <p className="text-[10px] text-slate-500 font-medium">
                {esJugadorActivo ? 'Jugador del Plantel' : 'Leyenda Histórica'}
              </p>
            </div>

            {/* Giant Stat Display */}
            <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-2xl px-5 py-2 text-center w-full max-w-[200px] shadow-inner">
              <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider text-[9px]">
                Récord Club
              </span>
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 block font-mono">
                {recordData.cantidad}
              </span>
            </div>
          </div>

          {/* Card Footer: Player Info / Status */}
          <div className="border-t border-amber-500/20 pt-2.5 flex items-center justify-between text-[10px]">
            {esJugadorActivo && jugadorActivo ? (
              <>
                <div className="flex flex-col">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Posición</span>
                  <span className="text-teal-400 font-extrabold">{jugadorActivo.posicion}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Edad</span>
                  <span className="text-slate-350 font-extrabold font-mono">{jugadorActivo.edad}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Habilidad</span>
                  <span className="text-emerald-400 font-extrabold font-mono">{jugadorActivo.ca} CA</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Rol</span>
                  <span className="text-amber-400 font-extrabold uppercase">Leyenda</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Estado</span>
                  <span className="text-amber-400 font-extrabold">Retirado</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Clase</span>
                  <span className="text-amber-400 font-extrabold uppercase">Especial</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* 1. ENCABEZA PREMIUM */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        {/* Glow behind header */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            <span>🏆</span> Salón de la Fama
          </h1>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Consagrá a las leyendas de tu club y visualizá los mayores hitos logrados durante tu gestión.
            Los récords sobreviven a los cambios de temporada y marcan la historia eterna de la institución.
          </p>
        </div>
        
        {/* Managed club badge/details */}
        {equipoUsuario && (
          <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl px-5 py-3 relative z-10 shrink-0 self-start md:self-auto">
            <div 
              style={{ backgroundColor: equipoUsuario.colorPrincipal + '15', borderColor: equipoUsuario.colorPrincipal + '40' }}
              className="w-12 h-12 rounded-xl border flex items-center justify-center text-2xl shadow-inner"
            >
              {equipoUsuario.escudo || '🛡️'}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block">Club Actual</span>
              <h2 className="text-sm font-extrabold text-slate-200">{equipoUsuario.nombre}</h2>
              <span className="text-[10px] text-slate-400 block font-medium">Reputación: {equipoUsuario.reputacion}/100</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. VITRINA DE TROFEOS DEL MÁNAGER */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-white tracking-tight">Vitrina de Trofeos del Mánager</h3>
            <p className="text-xs text-slate-500 mt-0.5">Títulos oficiales acumulados a lo largo de tu trayectoria profesional.</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm">
            <span>🏆</span>
            <span>{historialTitulos.length} Títulos</span>
          </div>
        </div>

        {historialTitulos.length === 0 ? (
          /* Empty Trophy Cabinet Glass Shelf Placeholder */
          <div className="relative border border-dashed border-slate-800 rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-4 bg-slate-950/20">
            <div className="w-16 h-16 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center text-2xl shadow-inner text-slate-500">
              🔒
            </div>
            <div className="space-y-1">
              <h4 className="text-slate-350 text-sm font-bold">Vitrina de Trofeos Vacía</h4>
              <p className="text-slate-500 text-[11px] max-w-sm leading-relaxed mx-auto">
                No hay trofeos registrados en este club todavía. ¡Coronate campeón de la Superliga o gana copas internacionales para llenar la vitrina de gloria!
              </p>
            </div>
          </div>
        ) : (
          /* Elegant Trophy Cabinet Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 pt-2">
            {historialTitulos.map((titulo, idx) => {
              const tituloLower = titulo.toLowerCase();
              let icon = '🏆';
              let gradient = 'from-amber-600/20 to-yellow-600/5 border-amber-500/35';
              let badgeColor = 'text-amber-400 bg-amber-500/15 border-amber-500/20';

              if (tituloLower.includes('continental')) {
                icon = '🌌';
                gradient = 'from-blue-600/20 to-cyan-600/5 border-blue-500/35';
                badgeColor = 'text-blue-400 bg-blue-500/15 border-blue-500/20';
              } else if (tituloLower.includes('campeones')) {
                icon = '👑';
                gradient = 'from-indigo-600/25 to-amber-600/5 border-indigo-400/35';
                badgeColor = 'text-indigo-400 bg-indigo-500/15 border-indigo-500/20';
              } else if (tituloLower.includes('superliga')) {
                icon = '🛡️';
                gradient = 'from-slate-500/20 to-slate-700/5 border-slate-400/35';
                badgeColor = 'text-slate-300 bg-slate-500/15 border-slate-500/20';
              }

              return (
                <div 
                  key={idx}
                  className={`group relative bg-gradient-to-b ${gradient} border rounded-2xl p-4 flex flex-col items-center justify-between text-center transition-all duration-300 hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-2xl`}
                >
                  {/* Glass Shelf Shine */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/2 to-transparent rounded-2xl pointer-events-none" />
                  
                  {/* Trophy Icon */}
                  <div className="w-16 h-16 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center text-3xl shadow-inner mb-3 group-hover:scale-110 transition-transform duration-300">
                    {icon}
                  </div>

                  {/* Title Name & Season */}
                  <div className="space-y-1 w-full">
                    <span className={`inline-block text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor}`}>
                      Campeón
                    </span>
                    <h4 className="text-xs font-black text-slate-100 line-clamp-2 tracking-tight group-hover:text-amber-400 transition-colors">
                      {titulo.split(' ').slice(0, -1).join(' ') || titulo}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-500 font-mono">
                      {titulo.split(' ').pop()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. TARJETAS DORADAS DE LEYENDAS (RECORD DE JUGADORES) */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-lg font-extrabold text-white tracking-tight">Récords de Leyendas del Vestuario</h3>
          <p className="text-xs text-slate-500 mt-0.5">Los jugadores históricos que marcaron la diferencia en goles, asistencias y presencias.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2 justify-center">
          {/* A. Máximo Goleador */}
          {renderTarjetaLeyenda('Máximo Goleador', recordsClub.maxGoleador, 'goles')}

          {/* B. Máximo Asistente */}
          {renderTarjetaLeyenda('Máximo Asistente', recordsClub.maxAsistente, 'asistencias')}

          {/* C. Más Partidos Jugados */}
          {renderTarjetaLeyenda('Más Partidos', recordsClub.maxPartidos, 'partidos')}
        </div>
      </div>

      {/* 4. MURO DEL RECUERDO: PARTIDOS HISTÓRICOS (GOLEADAS Y DERROTAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Mayor Goleada */}
        <div className="bg-slate-900/40 border border-slate-800/85 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-6 flex flex-col justify-between relative overflow-hidden group">
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <span className="text-2xl">🔥</span>
              <div>
                <h4 className="text-base font-extrabold text-slate-100 tracking-tight">Mayor Goleada Histórica</h4>
                <p className="text-[11px] text-slate-500 font-medium">Nuestra victoria más aplastante en competiciones oficiales.</p>
              </div>
            </div>

            {recordsClub.mayorGoleada && recordsClub.mayorGoleada.golesFavor > 0 ? (
              <div className="flex items-center justify-between py-2 gap-4">
                {/* User club */}
                <div className="text-center w-1/3 space-y-1">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl mx-auto shadow-inner">
                    🛡️
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 block tracking-tight truncate">
                    {equipoUsuario?.nombreCorto || 'Nosotros'}
                  </span>
                </div>

                {/* Score badge */}
                <div className="text-center flex-1 space-y-1.5">
                  <div className="inline-flex items-center bg-emerald-500/10 border border-emerald-500/25 px-5 py-2.5 rounded-2xl text-2xl font-black text-emerald-400 font-mono tracking-wider shadow-inner group-hover:scale-105 transition-transform duration-300">
                    {recordsClub.mayorGoleada.golesFavor} - {recordsClub.mayorGoleada.golesContra}
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">
                    Victoria
                  </span>
                </div>

                {/* Rival club */}
                <div className="text-center w-1/3 space-y-1">
                  <div 
                    className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl mx-auto shadow-inner text-2xl"
                    title={recordsClub.mayorGoleada.rivalNombre}
                  >
                    {recordsClub.mayorGoleada.rivalEscudo || '🛡️'}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 block tracking-tight truncate">
                    {recordsClub.mayorGoleada.rivalNombre}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-6 font-medium">No hay registros de victorias históricas todavía.</p>
            )}
          </div>

          {recordsClub.mayorGoleada && recordsClub.mayorGoleada.golesFavor > 0 && (
            <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <span>Hazaña</span>
              <span className="font-mono text-slate-400">{formatearFecha(recordsClub.mayorGoleada.fecha)}</span>
            </div>
          )}
        </div>

        {/* Peor Derrota */}
        <div className="bg-slate-900/40 border border-slate-800/85 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-6 flex flex-col justify-between relative overflow-hidden group">
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-full pointer-events-none" />
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <span className="text-2xl">💀</span>
              <div>
                <h4 className="text-base font-extrabold text-slate-100 tracking-tight">Peor Derrota Histórica</h4>
                <p className="text-[11px] text-slate-500 font-medium">Nuestra caída más dura sufrida ante rivales oficiales.</p>
              </div>
            </div>

            {recordsClub.peorDerrota && recordsClub.peorDerrota.golesContra > 0 ? (
              <div className="flex items-center justify-between py-2 gap-4">
                {/* User club */}
                <div className="text-center w-1/3 space-y-1">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl mx-auto shadow-inner">
                    🛡️
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 block tracking-tight truncate">
                    {equipoUsuario?.nombreCorto || 'Nosotros'}
                  </span>
                </div>

                {/* Score badge */}
                <div className="text-center flex-1 space-y-1.5">
                  <div className="inline-flex items-center bg-rose-500/10 border border-rose-500/25 px-5 py-2.5 rounded-2xl text-2xl font-black text-rose-400 font-mono tracking-wider shadow-inner group-hover:scale-105 transition-transform duration-300">
                    {recordsClub.peorDerrota.golesFavor} - {recordsClub.peorDerrota.golesContra}
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">
                    Derrota
                  </span>
                </div>

                {/* Rival club */}
                <div className="text-center w-1/3 space-y-1">
                  <div 
                    className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl mx-auto shadow-inner text-2xl"
                    title={recordsClub.peorDerrota.rivalNombre}
                  >
                    {recordsClub.peorDerrota.rivalEscudo || '🛡️'}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 block tracking-tight truncate">
                    {recordsClub.peorDerrota.rivalNombre}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-6 font-medium">No hay registros de derrotas históricas todavía.</p>
            )}
          </div>

          {recordsClub.peorDerrota && recordsClub.peorDerrota.golesContra > 0 && (
            <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <span>Fecha fatídica</span>
              <span className="font-mono text-slate-400">{formatearFecha(recordsClub.peorDerrota.fecha)}</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
