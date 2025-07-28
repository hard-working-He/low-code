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

/**
 * 获取首次内容绘制（FCP）
 * @param callback (fcp: number) => void
 */
export function getFCP(callback: (fcp: number) => void) {
  if (typeof PerformanceObserver === 'undefined') return;
  const observer = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        callback(entry.startTime);
        observer.disconnect();
        break;
      }
    }
  });
  try {
    observer.observe({ type: 'paint', buffered: true });
  } catch {}
}

/**
 * 获取首次绘制（FP）
 * @param callback (fp: number) => void
 */
export function getFP(callback: (fp: number) => void) {
  if (typeof PerformanceObserver === 'undefined') return;
  const observer = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      if (entry.name === 'first-paint') {
        callback(entry.startTime);
        observer.disconnect();
        break;
      }
    }
  });
  try {
    observer.observe({ type: 'paint', buffered: true });
  } catch {}
}

/**
 * 获取最大内容绘制（LCP）
 * @param callback (lcp: number) => void
 */
export function getLCP(callback: (lcp: number) => void) {
  if (typeof PerformanceObserver === 'undefined') return;
  const observer = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      callback(entry.startTime);
    }
  });
  try {
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}
  // 页面隐藏时断开，避免多余回调
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      observer.disconnect();
    }
  });
}

/**
 * 获取首次可交互时间（TTI，Time to Interactive）
 * @param callback (tti: number) => void
 */
export function getTTI(callback: (tti: number) => void) {
  if (typeof PerformanceObserver === 'undefined') return;

  let tti = 0;
  let lastLongTask = 0;
  let lastNetwork = 0;
  let fcp = 0;
  let timer: number | null = null;

  // 监听 FCP
  const fcpObserver = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        fcp = entry.startTime;
      }
    }
  });
  try {
    fcpObserver.observe({ type: 'paint', buffered: true });
  } catch {}

  // 监听长任务
  const longTaskObserver = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      lastLongTask = entry.startTime + entry.duration;
      scheduleCheck();
    }
  });
  try {
    longTaskObserver.observe({ type: 'longtask', buffered: true });
  } catch {}

  // 监听资源加载
  const resourceObserver = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      const resourceEntry = entry as PerformanceResourceTiming;
      lastNetwork = resourceEntry.responseEnd;
      scheduleCheck();
    }
  });
  try {
    resourceObserver.observe({ type: 'resource', buffered: true });
  } catch {}

  function scheduleCheck() {
    if (timer) {
      clearTimeout(timer);
    }
    // 2秒内无长任务和网络请求，判定为 TTI
    timer = window.setTimeout(() => {
      tti = Math.max(fcp, lastLongTask, lastNetwork, performance.now());
      callback(tti);
      disconnect();
    }, 2000);
  }

  function disconnect() {
    fcpObserver.disconnect();
    longTaskObserver.disconnect();
    resourceObserver.disconnect();
    if (timer) clearTimeout(timer);
  }

  // 页面隐藏时断开
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      disconnect();
    }
  });
}
