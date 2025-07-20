/**
 * 事件总线 - 用于组件之间的通信
 * 实现了一个简单的发布-订阅模式，允许组件之间解耦通信
 */

// 事件监听器类型
type EventListener = (...args: any[]) => void;

// 事件总线类
class EventBus {
  private events: Record<string, EventListener[]>;

  constructor() {
    this.events = {};
  }

  /**
   * 订阅事件
   * @param eventName 事件名称
   * @param callback 回调函数
   */
  on(eventName: string, callback: EventListener): void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  /**
   * 取消订阅事件
   * @param eventName 事件名称
   * @param callback 回调函数，如果不提供则移除所有该事件的监听器
   */
  off(eventName: string, callback?: EventListener): void {
    if (!this.events[eventName]) return;
    
    if (callback) {
      this.events[eventName] = this.events[eventName].filter(
        listener => listener !== callback
      );
    } else {
      delete this.events[eventName];
    }
  }

  /**
   * 触发事件
   * @param eventName 事件名称
   * @param args 传递给事件监听器的参数
   */
  emit(eventName: string, ...args: any[]): void {
    if (!this.events[eventName]) return;
    
    this.events[eventName].forEach(callback => {
      callback(...args);
    });
  }

  /**
   * 一次性订阅事件，触发后自动解绑
   * @param eventName 事件名称
   * @param callback 回调函数
   */
  once(eventName: string, callback: EventListener): void {
    const onceCallback = (...args: any[]) => {
      callback(...args);
      this.off(eventName, onceCallback);
    };
    this.on(eventName, onceCallback);
  }
}

// 创建并导出事件总线实例
const eventBus = new EventBus();
export default eventBus; 