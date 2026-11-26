import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TodoFilter, TodoItem } from '../types/todo';
import {
  loadTodosFromStorage,
  saveTodosToStorage,
  clearCorruptedStorage,
} from '../lib/storage';

export interface UndoItem {
  task: TodoItem;
  deletedAt: number;
}

export interface UseTodosReturn {
  tasks: TodoItem[];
  filteredTasks: TodoItem[];
  filter: TodoFilter;
  setFilter: (f: TodoFilter) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  undoItem: UndoItem | null;
  storageError: string | null;
  corruptedError: string | null;
  rawBackup?: string;
  lastAddedHidden: boolean;
  clearLastAddedHidden: () => void;
  addTodo: (text: string) => { success: boolean; error?: string };
  toggleTodo: (id: string) => void;
  updateTodoText: (id: string, text: string) => { success: boolean; error?: string };
  deleteTodo: (id: string) => void;
  undoDelete: () => void;
  dismissUndo: () => void;
  clearCompleted: () => number;
  resetCorruptedData: () => void;
  retrySave: () => void;
  stats: {
    total: number;
    completed: number;
    remaining: number;
    percentage: number;
  };
}

export function useTodos(): UseTodosReturn {
  const [tasks, setTasks] = useState<TodoItem[]>([]);
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [undoItem, setUndoItem] = useState<UndoItem | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [corruptedError, setCorruptedError] = useState<string | null>(null);
  const [rawBackup, setRawBackup] = useState<string | undefined>(undefined);
  const [lastAddedHidden, setLastAddedHidden] = useState(false);

  const isInitialLoad = useRef(true);

  // 초기 스토리지 로드
  useEffect(() => {
    const loaded = loadTodosFromStorage();
    if (loaded.corrupted) {
      setCorruptedError(loaded.error);
      setRawBackup(loaded.rawBackup);
    } else if (loaded.error) {
      setStorageError(loaded.error);
    } else {
      setTasks(loaded.tasks);
    }
    isInitialLoad.current = false;
  }, []);

  // 상태 변경 시 스토리지 저장 (손상 데이터 미해결 시 덮어쓰기 방지)
  useEffect(() => {
    if (isInitialLoad.current) return;
    if (corruptedError) return; // 기존 손상 데이터 보호

    const res = saveTodosToStorage(tasks);
    if (!res.success) {
      setStorageError(res.error || '저장에 실패했습니다.');
    } else {
      setStorageError(null);
    }
  }, [tasks, corruptedError]);

  const clearLastAddedHidden = useCallback(() => {
    setLastAddedHidden(false);
  }, []);

  // 할 일 추가
  const addTodo = useCallback(
    (rawText: string) => {
      const text = rawText.trim();
      if (!text) {
        return { success: false, error: '할 일을 입력해 주세요.' };
      }
      if (text.length > 200) {
        return { success: false, error: '할 일은 최대 200자까지 입력할 수 있습니다.' };
      }

      const now = new Date().toISOString();
      const newTask: TodoItem = {
        id: `todo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        text,
        completed: false,
        createdAt: now,
        updatedAt: now,
      };

      setTasks((prev) => [newTask, ...prev]);

      // 현재 필터나 검색 조건에 의해 숨겨지는지 확인
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = query === '' || text.toLowerCase().includes(query);
      const matchesFilter = filter === 'all' || filter === 'active';

      if (!matchesSearch || !matchesFilter) {
        setLastAddedHidden(true);
      } else {
        setLastAddedHidden(false);
      }

      return { success: true };
    },
    [filter, searchQuery]
  );

  // 완료 상태 토글
  const toggleTodo = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, completed: !t.completed, updatedAt: new Date().toISOString() }
          : t
      )
    );
  }, []);

  // 내용 수정
  const updateTodoText = useCallback((id: string, rawText: string) => {
    const text = rawText.trim();
    if (!text) {
      return { success: false, error: '내용을 비워둘 수 없습니다.' };
    }
    if (text.length > 200) {
      return { success: false, error: '할 일은 최대 200자까지 입력할 수 있습니다.' };
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, text, updatedAt: new Date().toISOString() }
          : t
      )
    );
    return { success: true };
  }, []);

  // 개별 삭제
  const deleteTodo = useCallback(
    (id: string) => {
      const target = tasks.find((t) => t.id === id);
      if (!target) return;

      setTasks((prev) => prev.filter((t) => t.id !== id));
      setUndoItem({
        task: target,
        deletedAt: Date.now(),
      });
    },
    [tasks]
  );

  // 실행 취소
  const undoDelete = useCallback(() => {
    if (!undoItem) return;
    const { task } = undoItem;
    setTasks((prev) => {
      // 이미 같은 ID가 복원되어 있다면 중복 방지
      if (prev.some((t) => t.id === task.id)) return prev;
      const combined = [task, ...prev];
      // 원래 정렬 기준인 createdAt 내림차순 복원
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return combined;
    });
    setUndoItem(null);
  }, [undoItem]);

  const dismissUndo = useCallback(() => {
    setUndoItem(null);
  }, []);

  // 완료 항목 일괄 삭제
  const clearCompleted = useCallback(() => {
    let removedCount = 0;
    setTasks((prev) => {
      const remaining = prev.filter((t) => !t.completed);
      removedCount = prev.length - remaining.length;
      return remaining;
    });
    return removedCount;
  }, []);

  // 손상 데이터 초기화
  const resetCorruptedData = useCallback(() => {
    clearCorruptedStorage();
    setCorruptedError(null);
    setRawBackup(undefined);
    setTasks([]);
  }, []);

  // 수동 저장 재시도
  const retrySave = useCallback(() => {
    const res = saveTodosToStorage(tasks);
    if (!res.success) {
      setStorageError(res.error || '저장에 실패했습니다.');
    } else {
      setStorageError(null);
    }
  }, [tasks]);

  // 통계 계산
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const remaining = total - completed;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, remaining, percentage };
  }, [tasks]);

  // 필터 및 검색 적용
  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return tasks.filter((task) => {
      // 1. 상태 필터
      if (filter === 'active' && task.completed) return false;
      if (filter === 'completed' && !task.completed) return false;

      // 2. 검색어 필터
      if (query !== '' && !task.text.toLowerCase().includes(query)) {
        return false;
      }

      return true;
    });
  }, [tasks, filter, searchQuery]);

  return {
    tasks,
    filteredTasks,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    undoItem,
    storageError,
    corruptedError,
    rawBackup,
    lastAddedHidden,
    clearLastAddedHidden,
    addTodo,
    toggleTodo,
    updateTodoText,
    deleteTodo,
    undoDelete,
    dismissUndo,
    clearCompleted,
    resetCorruptedData,
    retrySave,
    stats,
  };
}
