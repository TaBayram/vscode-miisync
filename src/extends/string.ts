String.prototype.splice = function (start: number, deleteCount?: number, insert?: string) {
    if (start < 0) {
        start = Math.max(this.length + start, 0);
    }
    return this.slice(0, start) + (insert || "") + this.slice(start + (deleteCount || 0));
};

String.prototype.enclose = function (start: string, end?: string) {
    return start + this + (end ? end : start);
};