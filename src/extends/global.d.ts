declare interface String {
    splice(start: number, deleteCount?: number, insert?: string): string;
    enclose(start: string, end: string): string;
    enclose(text: string): string;
}
