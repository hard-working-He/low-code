import type { Component } from './useEditorStore';

export const DiffType = {
  ADD: 'add',
  DELETE: 'delete',
  MODIFY: 'modify'
} as const;

export type DiffTypeValue = typeof DiffType[keyof typeof DiffType];

export interface BaseDiffOperation {
  componentId: string;
  type: DiffTypeValue;
}

export interface AddOperation extends BaseDiffOperation {
  type: typeof DiffType.ADD;
  data: Component;
  index: number;
}

export interface DeleteOperation extends BaseDiffOperation {
  type: typeof DiffType.DELETE;
  index: number;
  data: Component;
}

export interface ModifyOperation extends BaseDiffOperation {
  type: typeof DiffType.MODIFY;
  data: {
    keys: string[];
    oldValues: any[];
    newValues: any[];
  };
}

export type DiffOperation = AddOperation | DeleteOperation | ModifyOperation;

export interface SnapShotState {
  snapshots: DiffOperation[][];
  snapshotIndex: number;
  isRecording: boolean;
  get snapshotData(): DiffOperation[][];
}

export interface SnapShotActions {
  undo: () => void;
  redo: () => void;
  recordSnapshot: () => void;
} 