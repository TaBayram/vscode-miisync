//https://dmitripavlutin.com/how-to-compare-objects-in-javascript/#3-shallow-equality
export function shallowEqual(object1: any, object2: any) {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);

    if (keys1.length !== keys2.length) {
        return false;
    }
    for (let key of keys1) {
        if (object1[key] !== object2[key]) {
            return false;
        }
    }
    return true;
}

//https://dmitripavlutin.com/how-to-compare-objects-in-javascript/#4-deep-equality
export function deepEqual(object1: any, object2: any) {
    if (object1 == null && object2 == null) return true;
    else if ((object1 == null && object2 != null) || (object2 == null && object1 != null)) return false;
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);

    if (keys1.length !== keys2.length) {
        return false;
    }
    for (const key of keys1) {
        const val1 = object1[key];
        const val2 = object2[key];
        const areObjects = isObject(val1) && isObject(val2);
        if (
            areObjects && !deepEqual(val1, val2) ||
            !areObjects && val1 !== val2
        ) {
            return false;
        }
    }

    return true;
}

function isObject(object: any) {
    return object != null && typeof object === 'object';
}


/**
 * Shallow equal check, add to array if the values are not the same.
 * @returns array
 */
export function GetDifferentValuedKeys<T>(object1: T, object2: T): string[] {
    const keys = Object.keys(object1);
    let diffKeys = [];

    for (let key of keys) {
        if (object1[key] !== object2[key]) {
            diffKeys.push(key);
        }
    }
    return diffKeys;
}