export function deepCopy<T>(target: T): T {
    if (target === null || target === undefined) {
        return target;
    }
    
    if (typeof target === 'object') {
        if (Array.isArray(target)) {
            return target.map(item => deepCopy(item)) as unknown as T;
        }
        
        const result = {} as Record<string, any>;
        for (const key in target) {
            if (Object.prototype.hasOwnProperty.call(target, key)) {
                result[key] = deepCopy((target as Record<string, any>)[key]);
            }
        }
        
        return result as unknown as T;
    }
    
    return target;
}

export function swap<T>(arr: T[], i: number, j: number): T[] {
    const newArr = [...arr];
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    return newArr;
}
