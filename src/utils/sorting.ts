import { Jugador } from '../types';

export type CriterioOrden =
  | 'ca'
  | 'pa'
  | 'valorMercado'
  | 'salarioSemanal'
  | 'posicion'
  | 'edad'
  | 'formaFisica'
  | 'moral'
  | 'goles'
  | 'asistencias'
  | 'partidosJugados'
  | 'calificacionMedia'
  | 'remate'
  | 'pase'
  | 'regate'
  | 'defensa'
  | 'tecnica'
  | 'velocidad'
  | 'aceleracion'
  | 'resistencia'
  | 'fuerza'
  | 'vision'
  | 'decisiones'
  | 'determinacion'
  | 'posicionamiento'
  | 'reflejos';

export type DireccionOrden = 'ASC' | 'DESC';

export const POSICION_ORDEN: Record<string, number> = {
  POR: 0,
  DFC: 1,
  LD: 2,
  LI: 3,
  MC: 4,
  MCO: 5,
  ED: 6,
  EI: 7,
  DC: 8
};

export const ordenarJugadores = (
  jugadoresList: Jugador[],
  criterio: CriterioOrden,
  direccion: DireccionOrden
): Jugador[] => {
  return [...jugadoresList].sort((a, b) => {
    let valA: any;
    let valB: any;

    if (criterio === 'posicion') {
      valA = POSICION_ORDEN[a.posicion] ?? 99;
      valB = POSICION_ORDEN[b.posicion] ?? 99;
    } else if (
      [
        'remate', 'pase', 'regate', 'defensa', 'tecnica',
        'velocidad', 'aceleracion', 'resistencia', 'fuerza',
        'vision', 'decisiones', 'determinacion', 'posicionamiento', 'reflejos'
      ].includes(criterio)
    ) {
      valA = a.atributos[criterio as keyof typeof a.atributos] ?? 0;
      valB = b.atributos[criterio as keyof typeof b.atributos] ?? 0;
    } else {
      valA = a[criterio as keyof Jugador] ?? 0;
      valB = b[criterio as keyof Jugador] ?? 0;
    }

    if (valA === undefined || valA === null) valA = 0;
    if (valB === undefined || valB === null) valB = 0;

    if (typeof valA === 'string') {
      return direccion === 'ASC'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    return direccion === 'ASC' ? valA - valB : valB - valA;
  });
};
