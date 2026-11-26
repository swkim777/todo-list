import React from 'react';
import styles from './UndoToast.module.css';

interface UndoToastProps {
  onUndo: () => void;
  onDismiss: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({ onUndo, onDismiss }) => {
  return (
    <div
      className={styles.toast}
      role="status"
      aria-live="polite"
      aria-label="삭제 알림"
    >
      <div className={styles.content}>
        <span className={styles.message}>할 일을 삭제했어요.</span>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.undoButton}
            onClick={onUndo}
            aria-label="방금 삭제한 할 일 실행 취소"
          >
            실행 취소
          </button>
          <button
            type="button"
            className={styles.dismissButton}
            onClick={onDismiss}
            aria-label="알림 닫기"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
