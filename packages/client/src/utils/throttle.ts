/**
 * 节流函数
 * @param func 需要节流的函数
 * @param delay 节流时间
 * @returns 节流后的函数
 */
export const throttle = (func: (...args: any[]) => void, delay: number) => {
    let timer: any = null;
    return (...args: any[]) => {
        if (!timer) {
            timer = setTimeout(() => {
                func(...args);
                timer = null;
            }, delay);
        }
    };
};