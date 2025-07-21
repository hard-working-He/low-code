/**
 * 用于下载任意类型文件的通用函数
 * @param data - 文件内容（字符串、Blob、ArrayBuffer 等）
 * @param fileName - 下载文件的名称
 * @param mimeType - 文件的 MIME 类型（默认值："application/octet-stream"）
 * @returns void
 */
export function downloadFile(data: any, fileName: string, mimeType: string = "application/octet-stream"): void {
  // 创建具有适当 mime 类型的 blob
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  
  // 创建下载链接
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = fileName;
  
  // 触发下载并清理
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  
  // 释放 blob URL
  URL.revokeObjectURL(downloadLink.href);
}

/**
 * 将数据导出为浏览器可下载的 JSON 文件
 * @param data - 要导出的数据（可以是字符串或对象）
 * @param fileName - 可选的文件名（默认：export-[时间戳].json）
 * @returns void
 */
export function exportJsonFile(data: any, fileName?: string): void {
  // 如果数据是对象，则转换为 JSON 字符串
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  
  // 使用通用下载函数并指定 JSON mime 类型
  downloadFile(
    jsonString, 
    fileName || `export-${new Date().getTime()}.json`, 
    "application/json"
  );
} 