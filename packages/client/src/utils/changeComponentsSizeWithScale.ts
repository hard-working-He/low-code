import type { Component } from '@/stores/useEditorStore';
import { deepCopy } from './utils';

export default function changeComponentsSizeWithScale(
  scale: number, 
  componentData: Component[]
): Component[] {
  if (!componentData || componentData.length === 0) {
    return componentData;
  }
  
  const copyData = deepCopy(componentData);
  copyData.forEach(component => {
    if (component.style) {
      component.style.width = component.style.width && Number(component.style.width) * scale / 100;
      component.style.height = component.style.height && Number(component.style.height) * scale / 100;
      component.style.top = component.style.top && Number(component.style.top) * scale / 100;
      component.style.left = component.style.left && Number(component.style.left) * scale / 100;
      if (component.style.fontSize) {
        component.style.fontSize = Number(component.style.fontSize) * scale / 100;
      }
    }
  });
  
  return copyData;
} 