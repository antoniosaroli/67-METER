export interface AudioContextRef {
    ctx: AudioContext | null;
    gain: GainNode | null;
}

export enum MeterStatus {
    SAFE = 'SAFE',
    WARNING = 'WARNING',
    DANGER = 'DANGER',
    CRITICAL = 'CRITICAL'
}
