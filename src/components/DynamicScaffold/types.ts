export interface LogEntry {
    time: string;
    type: 'info' | 'error' | 'api' | 'cheat';
    message?: string;
    isCorrect?: boolean;
}
