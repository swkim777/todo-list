import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { TodoItem } from '../types/todo';
import styles from './TodoItemComponent.module.css';

interface TodoItemProps {
  task: TodoItem;
  onToggle: (id: string) => void;
  onUpdate: (id: string, text: string) => { success: boolean; error?: string };
  onDelete: (id: string) => void;
  deleteButtonRef?: (el: HTMLButtonElement | null) => void;
}

export const TodoItemComponent: React.FC<TodoItemProps> = ({
  task,
  onToggle,
  onUpdate,
  onDelete,
  deleteButtonRef,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [editError, setEditError] = useState<string | null>(null);

  const editInputRef = useRef<HTMLInputElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);

  // 수정 모드 진입 시 입력창에 포커스
  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditText(task.text);
    setEditError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(task.text);
    setEditError(null);
    // 수정 버튼으로 포커스 복귀
    setTimeout(() => {
      editButtonRef.current?.focus();
    }, 0);
  };

  const handleSaveEdit = () => {
    const res = onUpdate(task.id, editText);
    if (!res.success) {
      setEditError(res.error || '내용을 입력해 주세요.');
      editInputRef.current?.focus();
    } else {
      setIsEditing(false);
      setEditError(null);
      setTimeout(() => {
        editButtonRef.current?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) {
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  return (
    <li className={`${styles.item} ${task.completed ? styles.itemCompleted : ''}`}>
      {isEditing ? (
        <div className={styles.editContainer}>
          <label htmlFor={`edit-input-${task.id}`} className="sr-only">
            할 일 내용 수정
          </label>
          <div className={styles.editInputWrapper}>
            <input
              id={`edit-input-${task.id}`}
              ref={editInputRef}
              type="text"
              className={`${styles.editInput} ${editError ? styles.editInputError : ''}`}
              value={editText}
              onChange={(e) => {
                setEditText(e.target.value);
                if (editError) setEditError(null);
              }}
              onKeyDown={handleKeyDown}
              maxLength={200}
              aria-describedby={editError ? `edit-error-${task.id}` : undefined}
              aria-invalid={Boolean(editError)}
            />
            {editError && (
              <span id={`edit-error-${task.id}`} className={styles.editErrorMessage} role="alert">
                {editError}
              </span>
            )}
          </div>
          <div className={styles.editActions}>
            <button
              type="button"
              className={styles.saveButton}
              onClick={handleSaveEdit}
              aria-label={`${task.text} 수정 내용 저장`}
            >
              저장
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleCancelEdit}
              aria-label={`${task.text} 수정 취소`}
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.viewContainer}>
          <label className={styles.checkLabel} htmlFor={`todo-check-${task.id}`}>
            <input
              id={`todo-check-${task.id}`}
              type="checkbox"
              className={styles.checkbox}
              checked={task.completed}
              onChange={() => onToggle(task.id)}
            />
            <span
              className={`${styles.text} ${task.completed ? styles.textCompleted : ''}`}
            >
              {task.text}
            </span>
          </label>

          <div className={styles.actions}>
            <button
              ref={editButtonRef}
              type="button"
              className={styles.actionButton}
              onClick={handleStartEdit}
              aria-label={`"${task.text}" 내용 수정`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
              <span className="sr-only">수정</span>
            </button>

            <button
              ref={deleteButtonRef}
              type="button"
              className={`${styles.actionButton} ${styles.deleteButton}`}
              onClick={() => onDelete(task.id)}
              aria-label={`"${task.text}" 삭제`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span className="sr-only">삭제</span>
            </button>
          </div>
        </div>
      )}
    </li>
  );
};
