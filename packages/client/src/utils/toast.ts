import { message } from 'antd';

type MessageType = 'success' | 'error' | 'info' | 'warning' | 'loading';

export default function toast(
  msg: string = '', 
  type: MessageType = 'info', 
  duration: number = 1500
): void {
  message[type](msg, duration / 1000);
}
