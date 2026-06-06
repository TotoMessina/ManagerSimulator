export type Posicion =
  | 'POR'  // Portero (Goalkeeper)
  | 'DFC'  // Defensa Central (Center Back)
  | 'LD'   // Lateral Derecho (Right Back)
  | 'LI'   // Lateral Izquierdo (Left Back)
  | 'MC'   // Mediocampista Central (Central Midfielder)
  | 'MCO'  // Mediocampista Ofensivo (Attacking Midfielder)
  | 'ED'   // Extremo Derecho (Right Winger)
  | 'EI'   // Extremo Izquierdo (Left Winger)
  | 'DC';  // Delantero Centro (Striker)

export interface AtributosJugador {
  // --- TÉCNICOS ---
  remate: number;          // Finalización / Remate (1-20)
  pase: number;            // Habilidad de pase (1-20)
  regate: number;          // Regate / Dribbling (1-20)
  defensa: number;         // Entradas, marcaje y colocación defensiva (1-20)
  tecnica: number;         // Control de balón, técnica y primer toque (1-20)

  // --- FÍSICOS ---
  velocidad: number;       // Velocidad máxima (1-20)
  aceleracion: number;     // Rapidez para alcanzar velocidad máxima (1-20)
  resistencia: number;     // Fondo físico y aguante durante el partido (1-20)
  fuerza: number;          // Fortaleza física y juego aéreo (1-20)

  // --- MENTALES ---
  vision: number;          // Capacidad de ver pases y espacios (1-20)
  decisiones: number;      // Inteligencia al elegir la mejor opción (1-20)
  determinacion: number;   // Voluntad de ganar e ir ganando balones (1-20)
  posicionamiento: number; // Colocación táctica sin balón (1-20)

  // --- ARQUERO (Específico, relevante para POR) ---
  reflejos: number;        // Reflejos bajo los tres palos (1-20)
}

export type PersonalidadJugador = 'Líder' | 'Ambicioso' | 'Profesional' | 'Problemático' | 'Leal';

export interface PromesaGestion {
  id: string;
  descripcion: string;
  tipo: 'penales' | 'copa_internacional' | 'titular_indiscutido';
  estado: 'Cumplida' | 'En proceso' | 'Incumplida';
  partidosTranscurridos?: number;
}

// ==========================================
// REUNIÓN PRIVADA EN LA OFICINA DEL MÁNAGER
// ==========================================
export interface ReunionPrivada {
  jugadorId: string;
  jugadorNombre: string;
  posicion: string;
  edad: number;
  personalidad: PersonalidadJugador;
  moral: number;
  tienePromesaIncumplida: boolean;
  mensajeProblema: string; // Lo que dice el jugador al mánager
  tipoProblem: 'moral_baja' | 'promesa_incumplida';
}

export interface CharlaJugador {
  jugadorId: string;
  jugadorNombre: string;
  personalidad: PersonalidadJugador;
  consecutivos: number;
}

export interface Jugador {
  id: string;
  nombre: string;
  edad: number;
  nacionalidad: string;
  posicion: Posicion;
  idEquipo: string; // Relación con el Equipo
  personalidad: PersonalidadJugador; // Atributo de personalidad del vestuario
  partidosSeguidosBanco: number;    // Rastreador de inactividad
  promesaMinutosActive?: boolean;   // Control de promesas de minutos del DT
  transferidoForzado?: boolean;     // Control para forzar oferta de transferencia de la IA
  intransferible?: boolean;          // Marcado manualmente como no vendible por el DT
  esCapitan?: boolean;               // Indica si el jugador es el capitán actual
  listaTransferibles?: boolean;      // Indica si el jugador está listado para transferir
  rolTactico?: 'Hombre de Área' | 'Delantero Avanzado' | 'Pivote Defensivo' | 'Organizador' | null;
  entrenamientoIndividual?: keyof AtributosJugador | null;
  esPateadorPenales?: boolean;
  esPateadorTirosLibres?: boolean;
  esPateadorCorners?: boolean;
  promesas?: PromesaGestion[];
  promesaTitularPendiente?: boolean; // DT le prometió titularidad en el próximo partido
  amigosVestuarioIds?: string[];     // IDs de jugadores amigos (afectados por contagio de moral)

  // Calidad (1-100)
  ca: number; // Calidad Actual (Current Ability)
  pa: number; // Calidad Potencial (Potential Ability)

  // Atributos detallados (1-20)
  atributos: AtributosJugador;

  // Variables de Estado (1-100)
  formaFisica: number; // Estado físico actual (100% es óptimo, baja al jugar y sube al descansar)
  moral: number;       // Estado de ánimo actual (1-100)
  lesionado: boolean;
  semanasLesion?: number; // Semanas restantes si está lesionado
  semanasLesionado?: number; // Semanas de baja restantes
  mesesContrato?: number;   // Meses de contrato restantes
  titular?: boolean;    // ¿Está seleccionado en el once inicial?
  posicionTactica?: string | null; // Slot táctico ocupado en la cancha (ej. 'DEF-0')

  // Datos Financieros y Estadísticas
  valorMercado: number; // Valor estimado en Euros (€)
  salarioSemanal: number; // Salario en Euros (€)
  clausulaRescision?: number;
  preacuerdoClubId?: string | null;
  preacuerdoSalario?: number;
  preacuerdoClausula?: number;
  goles: number;
  asistencias: number;
  partidosJugados: number;
  calificacionMedia: number; // Calificación promedio de rendimiento (ej. 7.15)
  rasgos?: string[];
  golesHistoricos?: number;
  asistenciasHistoricos?: number;
  partidosHistoricos?: number;
  idAmigos?: string[];
  idRivales?: string[];
  quimicaPosicional?: Record<string, number>;
  manejoPresion?: number;
  crianzaEstilistica?: string;
}

export type EstiloJuego = 'Ofensivo' | 'Defensivo' | 'Equilibrado';
export type Formacion = '4-3-3' | '4-4-2' | '3-5-2' | '5-3-2';

export interface Tutoria {
  id: string;
  veteranoId: string;
  veteranoNombre: string;
  juvenilId: string;
  juvenilNombre: string;
  diasRestantes: number;
  diasTotales: number;
}

export interface ProyectoConstruccion {
  tipo: 'estadio' | 'clinica' | 'academia';
  diasRestantes: number;
  diasTotales: number;
  incremento?: number;
}

export interface Equipo {
  id: string;
  nombre: string;
  nombreCorto: string;
  escudo: string; // URL o clase CSS/Icono para representar el escudo
  colorPrincipal: string; // Color primario del club (Hex)
  colorSecundario: string; // Color secundario del club (Hex)
  presupuestoFichajes: number; // En Euros (€)
  presupuestoSalarialSemanal: number; // En Euros (€)
  reputacion: number; // Escala del 1 al 100 (prestigio del club)
  estadio: string;
  capacidadEstadio: number;
  formacion?: Formacion; // Táctica activa (ej. '4-3-3')
  estiloJuego?: EstiloJuego; // Estilo táctico (ej. 'Ofensivo')
  enfoqueEntrenamiento?: 'Físico' | 'Táctico' | 'Técnico';
  estrategiaCorner?: 'Atacar el primer palo' | 'Centro al área chica' | 'Jugar en corto';
  estrategiaPases?: 'Cortos' | 'Combinados' | 'Largos al espacio';
  quimicaVestuario?: number;         // Nivel de química del vestuario (0-100)
  semanaCharlaRealizada?: boolean;   // Cooldown de charla motivacional semanal
  semanaActividadRealizada?: boolean; // Cooldown de actividad de cohesión semanal
  sinEntrenador?: boolean;           // Indica si el club IA no tiene entrenador actual
  nivelInstalacionesMedicas?: number; // 1 a 5
  nivelAcademiaJuvenil?: number; // 1 a 5
  proyectosConstruccion?: ProyectoConstruccion[];
  tutorias?: Tutoria[];

  // --- FAIR PLAY FINANCIERO Y CRISIS ---
  ffpSueldosGastados?: number;
  ffpFichajesGastados?: number;
  ffpIngresosTotales?: number;
  ffpAdvertenciasConsecutivas?: number;
  ffpPenalizado?: boolean;
  ffpSancionPuntosPendiente?: boolean;
  enCrisisAcreedores?: boolean;
  sponsorMultiplicador?: number;
}

export interface TablaEquipo {
  idEquipo: string;
  nombreEquipo: string;
  partidosJugados: number;
  ganados: number;
  empatados: number;
  perdidos: number;
  golesFavor: number;
  golesContra: number;
  diferenciaGoles: number;
  puntos: number;
  forma: ('G' | 'E' | 'P')[]; // Últimos resultados (G = Ganado, E = Empatado, P = Perdido)
}

export interface Liga {
  id: string;
  nombre: string;
  pais: string;
  temporada: string;
  equipos: Equipo[];
  tabla: TablaEquipo[];
}

export interface PartidoFixture {
  localId: string;
  visitanteId: string;
  clima?: 'Soleado' | 'Lluvia Torrencial' | 'Nieve';
}

export interface Jornada {
  fecha: string;
  numero: number;
  partidos: PartidoFixture[];
}

export interface OpcionPrensa {
  id: string;
  texto: string;
  tipo: 'proteger' | 'critica' | 'evasiva';
  explicacionEfecto: string;
}

export interface RuedaPrensa {
  pregunta: string;
  jugadorId: string;
  jugadorNombre: string;
  opciones: OpcionPrensa[];
}

export interface OfertaRecibida {
  id: string;
  jugadorId: string;
  jugadorNombre: string;
  jugadorValorMercado: number;
  clubCompradorId: string;
  clubCompradorNombre: string;
  clubCompradorEscudo: string;
  clubCompradorReputacion: number;
  montoOfrecido: number;
  multiplicador: number;
  esClausula?: boolean;
}

export interface AcademiaReporte {
  retirados: { jugador: Jugador; edad: number; clubNombre: string; clubEscudo: string }[];
  promovidos: { jugador: Jugador; clubNombre: string; clubEscudo: string; esJoya: boolean }[];
}

export interface TablaCopa {
  idEquipo: string;
  nombreEquipo: string;
  escudo: string;
  partidosJugados: number;
  ganados: number;
  empatados: number;
  perdidos: number;
  golesFavor: number;
  golesContra: number;
  diferenciaGoles: number;
  puntos: number;
}

export interface PartidoCopa {
  id: string;
  localId: string;
  visitanteId: string;
  golesLocal?: number;
  golesVisitante?: number;
  penalesLocal?: number;
  penalesVisitante?: number;
  jugado: boolean;
  eventos?: string[];
  clima?: 'Soleado' | 'Lluvia Torrencial' | 'Nieve';
}

export interface GrupoCopa {
  id: string;
  equipos: string[];
  tabla: TablaCopa[];
}

// ==========================================
// EVENTOS ALEATORIOS DE VESTUARIO
// ==========================================

export type TipoEvento =
  | 'indisciplina'
  | 'presion_familiar'
  | 'conflicto_interno'
  | 'peticion_salarial'
  | 'critica_publica'
  | 'lesion_entrenamiento'
  | 'reclamo_capitania';

export interface EfectoOpcionEvento {
  // Efectos sobre un jugador específico (por jugadorId resuelto en tiempo de ejecución)
  jugadorMoral?: number;        // +/- moral del jugador protagonista
  jugadorForma?: number;        // +/- formaFisica del jugador protagonista
  jugadorPa?: number;           // +/- PA del jugador protagonista
  jugadorCa?: number;           // +/- CA del jugador protagonista
  // Efectos sobre el equipo / club
  moralEquipo?: number;         // +/- moral de todos los jugadores del equipo
  moralCapitan?: number;        // +/- moral del jugador con personalidad 'Líder'
  presupuesto?: number;         // +/- presupuesto de fichajes (en euros)
  confianzaDirectiva?: number;  // +/- confianza con la directiva
}

export interface OpcionEvento {
  id: string;
  icono: string;
  texto: string;                // Acción breve (ej: "Sancionar económicamente")
  descripcionEfecto: string;    // Texto descriptivo del efecto (ej: "Baja moral -20, sube disciplina del club")
  efecto: EfectoOpcionEvento;
}

export interface EventoVestuario {
  id: string;
  tipo: TipoEvento;
  titulo: string;
  descripcion: string;          // Narrativa completa de la situación
  jugadorId: string | null;     // ID del jugador protagonista (null si es genérico)
  jugadorNombre: string | null; // Nombre del protagonista para mostrar en UI
  opciones: OpcionEvento[];     // Exactamente 3 opciones
}

// ==========================================
// DEADLINE DAY — CIERRE DE MERCADO
// ==========================================

export interface JugadorAgente {
  id: string;
  nombre: string;
  posicion: Posicion;
  edad: number;
  nacionalidad: string;
  ca: number;
  pa: number;
  valorMercado: number;
  valorDescuento: number;        // 70% del valorMercado (30% de descuento)
  personalidad: PersonalidadJugador;
  atributos: AtributosJugador;
  salarioSemanal: number;
  comprado: boolean;
}

export interface CopaCampeones {
  participantes: string[];
  grupos: GrupoCopa[];
  faseActual: 'grupos' | 'cuartos' | 'semifinales' | 'final' | 'finalizada';
  partidosGrupos: {
    jornada: number;
    fecha: string;
    grupoId: string;
    partidos: PartidoCopa[];
  }[];
  cuartos: {
    fecha: string;
    partidos: PartidoCopa[];
  } | null;
  semifinales: {
    fecha: string;
    partidos: PartidoCopa[];
  } | null;
  final: {
    fecha: string;
    partido: PartidoCopa;
  } | null;
  campeon: string | null;
}

export interface SorteoCopaActivo {
  tipo: 'champions' | 'europa';
  fase: 'grupos' | 'cuartos';
  copa: CopaCampeones;
  participantes: string[];
}

export interface FanTweet {
  id: string;
  avatar: string;
  usuario: string;
  handle: string;
  color: string;
  mensaje: string;
  likes: number;
  retweets: number;
  hashtag: string;
  tiempo: string;
}

export interface HistoricoJugadorRecord {
  jugadorId: string;
  jugadorNombre: string;
  cantidad: number;
}

export interface RegistroPartidoRecord {
  rivalNombre: string;
  rivalEscudo: string;
  golesFavor: number;
  golesContra: number;
  fecha: string;
}

export interface RecordsClub {
  maxGoleador: HistoricoJugadorRecord;
  maxAsistente: HistoricoJugadorRecord;
  maxPartidos: HistoricoJugadorRecord;
  mayorGoleada: RegistroPartidoRecord;
  peorDerrota: RegistroPartidoRecord;
}

