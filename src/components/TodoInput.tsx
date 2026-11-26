import React, { useState, useRef, FormEvent, KeyboardEvent } from 'react';
import styles from './TodoInput.module.css';

interface TodoInputProps {
  onAdd: (text: string) => { success: boolean; error?: string };
}

export const TodoInput: React.FC<TodoInputProps> = ({ onAdd }) => {
  const [text, setText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = onAdd(text);
    if (!result.success) {
      setErrorMessage(result.error || '할 일을 입력해 주세요.');
      inputRef.current?.focus();
    } else {
      setText('');
      setErrorMessage(null);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // 한글 IME 조합 중 Enter인 경우 등록 방지
    if (e.nativeEvent.isComposing) {
      return;
    }
    if (e.key === 'Enter') {
      // 폼 서브밋이 트리거되도록 둠
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label htmlFor="new-todo-input" className="sr-only">
        새 할 일
      </label>
      <div className={styles.inputRow}>
        <div className={styles.inputWrapper}>
          <input
            id="new-todo-input"
            ref={inputRef}
            type="text"
            className={`${styles.input} ${errorMessage ? styles.inputError : ''}`}
            placeholder="어떤 일을 할 예정인가요?"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            maxLength={200}
            aria-describedby={errorMessage ? 'todo-input-error' : undefined}
            aria-invalid={Boolean(errorMessage)}
          />
          {text.length > 150 && (
            <span className={styles.charCount} aria-hidden="true">
              {text.length}/200
            </span>
          )}
        </div>
        <button
          type="submit"
          className={styles.submitButton}
          aria-label="할 일 추가"
        >
          추가
        </button>
      </div>

      {errorMessage && (
        <p id="todo-input-error" className={styles.errorMessage} role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );
};
