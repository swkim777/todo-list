import React, { useRef } from 'react';
import { TodoFilter, TodoItem } from '../types/todo';
import { TodoItemComponent } from './TodoItemComponent';
import styles from './TodoList.module.css';

interface TodoListProps {
  tasks: TodoItem[];
  totalAllCount: number;
  filter: TodoFilter;
  searchQuery: string;
  lastAddedHidden: boolean;
  onClearLastAddedHidden: () => void;
  onResetFilter: () => void;
  onClearSearch: () => void;
  onToggle: (id: string) => void;
  onUpdate: (id: string, text: string) => { success: boolean; error?: string };
  onDelete: (id: string) => void;
  onFocusInput: () => void;
}

export const TodoList: React.FC<TodoListProps> = ({
  tasks,
  totalAllCount,
  filter,
  searchQuery,
  lastAddedHidden,
  onClearLastAddedHidden,
  onResetFilter,
  onClearSearch,
  onToggle,
  onUpdate,
  onDelete,
  onFocusInput,
}) => {
  const deleteBtnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleDeleteWithFocus = (id: string) => {
    // 삭제 대상의 인덱스를 찾아서 다음 또는 이전 요소 포커스 준비
    const currentIndex = tasks.findIndex((t) => t.id === id);
    const nextTask = tasks[currentIndex + 1] || tasks[currentIndex - 1];

    onDelete(id);

    setTimeout(() => {
      if (nextTask) {
        const targetBtn = deleteBtnRefs.current.get(nextTask.id);
        if (targetBtn) {
          targetBtn.focus();
          return;
        }
      }
      onFocusInput();
    }, 0);
  };

  // 1. 새 항목이 현재 조건으로 숨겨진 경우 알림 배너
  const renderHiddenBanner = () => {
    if (!lastAddedHidden) return null;
    return (
      <div className={styles.hiddenBanner} role="status">
        <span>할 일을 추가했어요. 현재 조건에서는 보이지 않습니다.</span>
        <button
          type="button"
          className={styles.bannerButton}
          onClick={() => {
            onResetFilter();
            onClearSearch();
            onClearLastAddedHidden();
          }}
        >
          전체 보기
        </button>
      </div>
    );
  };

  // 2. 빈 상태(Empty State) 분기
  if (tasks.length === 0) {
    let title = '';
    let description = '';
    let actionButton: React.ReactNode = null;

    if (searchQuery.trim() !== '') {
      title = '일치하는 할 일이 없어요';
      description = `"${searchQuery}" 검색 조건과 일치하는 할 일이 없습니다.`;
      actionButton = (
        <button
          type="button"
          className={styles.emptyAction}
          onClick={onClearSearch}
        >
          검색어 초기화
        </button>
      );
    } else if (totalAllCount === 0) {
      title = '아직 할 일이 없어요';
      description = '오늘 해야 할 일이나 목표를 자유롭게 등록해 보세요.';
      actionButton = (
        <button
          type="button"
          className={styles.emptyAction}
          onClick={onFocusInput}
        >
          첫 할 일 입력하기
        </button>
      );
    } else if (filter === 'active') {
      title = '진행 중인 할 일이 없어요';
      description = '모든 할 일을 완료했거나 등록된 진행 중 항목이 없습니다.';
    } else if (filter === 'completed') {
      title = '아직 완료한 할 일이 없어요';
      description = '할 일을 완료하고 체크박스를 눌러보세요.';
    } else {
      title = '이 조건에 맞는 할 일이 없어요';
      description = '다른 필터를 선택하거나 전체 목록을 확인해 보세요.';
      actionButton = (
        <button
          type="button"
          className={styles.emptyAction}
          onClick={onResetFilter}
        >
          전체 보기
        </button>
      );
    }

    return (
      <div className={styles.emptyContainer}>
        {renderHiddenBanner()}
        <div className={styles.emptyCard}>
          <p className={styles.emptyTitle}>{title}</p>
          <p className={styles.emptyDescription}>{description}</p>
          {actionButton}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.listContainer}>
      {renderHiddenBanner()}
      <ul className={styles.list} aria-label="할 일 목록">
        {tasks.map((task) => (
          <TodoItemComponent
            key={task.id}
            task={task}
            onToggle={onToggle}
            onUpdate={onUpdate}
            onDelete={handleDeleteWithFocus}
            deleteButtonRef={(el) => {
              if (el) {
                deleteBtnRefs.current.set(task.id, el);
              } else {
                deleteBtnRefs.current.delete(task.id);
              }
            }}
          />
        ))}
      </ul>
    </div>
  );
};
