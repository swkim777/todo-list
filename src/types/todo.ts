export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
}

export type TodoFilter = 'all' | 'active' | 'completed';

export interface TodoStorageSchema {
  schemaVersion: number;
  tasks: TodoItem[];
}

export const CURRENT_SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'todo-app:v1';

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  corrupted?: boolean;
}
