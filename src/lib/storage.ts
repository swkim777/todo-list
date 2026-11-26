import { CURRENT_SCHEMA_VERSION, STORAGE_KEY, TodoItem, TodoStorageSchema } from '../types/todo';

export interface StorageLoadResult {
  tasks: TodoItem[];
  error: string | null;
  corrupted: boolean;
  rawBackup?: string;
}

export function isValidTodoItem(item: unknown): item is TodoItem {
  if (!item || typeof item !== 'object') return false;
  const candidate = item as Partial<TodoItem>;
  if (typeof candidate.id !== 'string' || candidate.id.trim() === '') return false;
  if (typeof candidate.text !== 'string') return false;
  if (typeof candidate.completed !== 'boolean') return false;
  if (typeof candidate.createdAt !== 'string' || isNaN(Date.parse(candidate.createdAt))) return false;
  if (typeof candidate.updatedAt !== 'string' || isNaN(Date.parse(candidate.updatedAt))) return false;
  return true;
}

export function loadTodosFromStorage(storage: Storage = window.localStorage): StorageLoadResult {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return { tasks: [], error: null, corrupted: false };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {
        tasks: [],
        error: '저장된 데이터 형식이 올바르지 않습니다 (JSON 파싱 실패).',
        corrupted: true,
        rawBackup: raw,
      };
    }

    if (!parsed || typeof parsed !== 'object') {
      return {
        tasks: [],
        error: '저장된 데이터 구조가 올바르지 않습니다.',
        corrupted: true,
        rawBackup: raw,
      };
    }

    const schema = parsed as Partial<TodoStorageSchema>;

    if (typeof schema.schemaVersion !== 'number') {
      return {
        tasks: [],
        error: '스키마 버전 정보가 누락되었습니다.',
        corrupted: true,
        rawBackup: raw,
      };
    }

    if (schema.schemaVersion > CURRENT_SCHEMA_VERSION) {
      return {
        tasks: [],
        error: `지원하지 않는 상위 스키마 버전(${schema.schemaVersion})의 데이터입니다.`,
        corrupted: true,
        rawBackup: raw,
      };
    }

    if (!Array.isArray(schema.tasks)) {
      return {
        tasks: [],
        error: '할 일 목록 데이터가 배열 형태가 아닙니다.',
        corrupted: true,
        rawBackup: raw,
      };
    }

    const seenIds = new Set<string>();
    const validTasks: TodoItem[] = [];

    for (const task of schema.tasks) {
      if (!isValidTodoItem(task)) {
        return {
          tasks: [],
          error: '일부 할 일 데이터의 필수 필드가 누락되었거나 형식이 올바르지 않습니다.',
          corrupted: true,
          rawBackup: raw,
        };
      }
      if (seenIds.has(task.id)) {
        return {
          tasks: [],
          error: '할 일 데이터에 중복된 ID가 존재합니다.',
          corrupted: true,
          rawBackup: raw,
        };
      }
      seenIds.add(task.id);
      validTasks.push(task);
    }

    // createdAt 내림차순 정렬 (최신 순)
    validTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { tasks: validTasks, error: null, corrupted: false };
  } catch (err) {
    return {
      tasks: [],
      error: `저장소 접근 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      corrupted: false,
    };
  }
}

export function saveTodosToStorage(
  tasks: TodoItem[],
  storage: Storage = window.localStorage
): { success: boolean; error: string | null } {
  try {
    const payload: TodoStorageSchema = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      tasks,
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return { success: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : '스토리지 용량 초과 또는 권한 문제로 저장에 실패했습니다.';
    return { success: false, error: message };
  }
}

export function clearCorruptedStorage(storage: Storage = window.localStorage): void {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('스토리지 초기화 실패:', err);
  }
}
