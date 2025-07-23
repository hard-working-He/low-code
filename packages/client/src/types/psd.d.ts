declare module 'psd.js' {
  export default class PSD {
    static fromBuffer(buffer: ArrayBuffer): PSD;
    parse(): void;
    tree(): PSDNode;
    header: {
      width: number;
      height: number;
    };
  }

  interface PSDNode {
    children(): PSDNode[];
    isGroup(): boolean;
    visible: boolean;
    name: string;
    type: string;
    left: number;
    top: number;
    width: number;
    height: number;
    opacity: number;
    text?: {
      value?: string;
      fontSize?: number;
      fontWeight?: string | number;
      fontStyle?: string;
      textDecoration?: string;
      color?: string;
      textAlign?: string;
      lineHeight?: number | string;
      letterSpacing?: number;
    };
    image?: {
      toBase64?: () => string;
    };
  }
} 