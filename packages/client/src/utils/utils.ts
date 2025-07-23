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

/**
 * 简单的DOM选择器函数，类似jQuery的$选择器
 * @param selector - CSS选择器字符串或DOM元素
 * @returns 找到的DOM元素或null
 */
export function $(selector: string | Element): HTMLElement | null {
    if (typeof selector === 'string') {
        return document.querySelector(selector) as HTMLElement | null;
    }
    return selector as HTMLElement;
}

/**
 * 生成唯一ID
 * @param prefix - 可选前缀
 * @returns 唯一ID字符串
 */
export function generateId(prefix = ''): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `${prefix}${timestamp}-${random}`;
}
