import { toast as notify } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type MessageType = 'success' | 'error' | 'info' | 'warning';

export default function toast(msg: string = '', type: MessageType = 'success') {
  notify[type](msg, { autoClose: 1500 });
}
