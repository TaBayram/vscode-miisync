String.prototype.splice = function (start: number, deleteCount?: number, insert?: string) {
    if (start < 0) {
        start = Math.max(this.length + start, 0);
    }
    return this.slice(0, start) + (insert || "") + this.slice(start + (deleteCount || 0));
};

String.prototype.enclose = function (start: string, end?: string) {
    return start + this + (end ? end : start);
};

String.prototype.unicornFormat = function (...values: string[]) {
    let text = this.toString();
    if (values.length) {
        for (const key in values) {
            text = text.replace(new RegExp("\\{" + key + "\\}", "gi"), values[key]);
        }
    }
    return text;
};