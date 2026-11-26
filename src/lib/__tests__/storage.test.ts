import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadTodosFromStorage,
  saveTodosToStorage,
  isValidTodoItem,
  clearCorruptedStorage,
} from '../storage';
import { CURRENT_SCHEMA_VERSION, STORAGE_KEY, TodoItem } from '../../types/todo';

describe('Storage Module', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const sampleTasks: TodoItem[] = [
    {
      id: 'task-1',
      text: '장보기',
      completed: false,
      createdAt: '2026-11-26T10:00:00.000Z',
      updatedAt: '2026-11-26T10:00:00.000Z',
    },
    {
      id: 'task-2',
      text: '운동하기',
      completed: true,
      createdAt: '2026-11-26T11:00:00.000Z',
      updatedAt: '2026-11-26T11:30:00.000Z',
    },
  ];

  it('빈 스토리지에서 기본값으로 빈 배열을 반환한다', () => {
    const result = loadTodosFromStorage();
    expect(result.tasks).toEqual([]);
    expect(result.error).toBeNull();
    expect(result.corrupted).toBe(false);
  });

  it('유효한 데이터를 정상적으로 저장하고 복원한다', () => {
    const saveResult = saveTodosToStorage(sampleTasks);
    expect(saveResult.success).toBe(true);

    const loadResult = loadTodosFromStorage();
    expect(loadResult.error).toBeNull();
    // 최신 순 정렬이므로 task-2가 먼저 옴
    expect(loadResult.tasks[0].id).toBe('task-2');
    expect(loadResult.tasks[1].id).toBe('task-1');
  });

  it('손상된 JSON이 들어있는 경우 원본을 덮어쓰지 않고 에러를 보고한다', () => {
    const corruptedJson = '{ invalid json string...';
    localStorage.setItem(STORAGE_KEY, corruptedJson);

    const loadResult = loadTodosFromStorage();
    expect(loadResult.corrupted).toBe(true);
    expect(loadResult.error).toContain('JSON 파싱 실패');
    expect(loadResult.rawBackup).toBe(corruptedJson);
    // 스토리지의 원본 데이터가 지워지지 않았는지 확인
    expect(localStorage.getItem(STORAGE_KEY)).toBe(corruptedJson);
  });

  it('스키마 버전이 현재 지원 버전보다 높으면 보호를 위해 거부한다', () => {
    const futureData = {
      schemaVersion: CURRENT_SCHEMA_VERSION + 1,
      tasks: sampleTasks,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(futureData));

    const loadResult = loadTodosFromStorage();
    expect(loadResult.corrupted).toBe(true);
    expect(loadResult.error).toContain('지원하지 않는 상위 스키마 버전');
  });

  it('필수 필드가 누락된 항목이 있으면 오류로 처리한다', () => {
    const invalidData = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      tasks: [{ id: '1', text: '테스트' }],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidData));

    const loadResult = loadTodosFromStorage();
    expect(loadResult.corrupted).toBe(true);
    expect(loadResult.error).toContain('필수 필드가 누락');
  });

  it('중복된 ID가 포함된 경우 오류로 처리한다', () => {
    const duplicateData = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      tasks: [
        {
          id: 'dup-id',
          text: '일 1',
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'dup-id',
          text: '일 2',
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(duplicateData));

    const loadResult = loadTodosFromStorage();
    expect(loadResult.corrupted).toBe(true);
    expect(loadResult.error).toContain('중복된 ID');
  });

  it('isValidTodoItem 유효성 검사기가 올바르게 동작한다', () => {
    expect(isValidTodoItem(null)).toBe(false);
    expect(isValidTodoItem({})).toBe(false);
    expect(isValidTodoItem({ id: '', text: 'a', completed: false, createdAt: '', updatedAt: '' })).toBe(false);
    expect(isValidTodoItem(sampleTasks[0])).toBe(true);
  });

  it('스토리지 저장 실패(예: QuotaExceededError) 시 에러를 정상 반환한다', () => {
    const mockStorage: Storage = {
      ...localStorage,
      setItem: () => {
        throw new Error('Quota exceeded');
      },
    };
    const res = saveTodosToStorage(sampleTasks, mockStorage);
    expect(res.success).toBe(false);
    expect(res.error).toBe('Quota exceeded');
  });

  it('clearCorruptedStorage를 호출하면 스토리지에서 데이터가 삭제된다', () => {
    localStorage.setItem(STORAGE_KEY, 'corrupted');
    clearCorruptedStorage();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
