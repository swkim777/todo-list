import React from 'react';
import styles from './Footer.module.css';

interface FooterProps {
  remainingCount: number;
  completedCount: number;
  storageError: string | null;
  onClearCompletedClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onRetrySave: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  remainingCount,
  completedCount,
  storageError,
  onClearCompletedClick,
  onRetrySave,
}) => {
  return (
    <footer className={styles.footer}>
      <div className={styles.actionRow}>
        <span className={styles.remaining}>남은 할 일 {remainingCount}개</span>

        <button
          type="button"
          className={styles.clearCompletedButton}
          onClick={onClearCompletedClick}
          disabled={completedCount === 0}
          aria-label={`완료한 할 일 ${completedCount}개 일괄 삭제`}
        >
          완료 항목 삭제
        </button>
      </div>

      <div className={styles.noticeRow}>
        {storageError ? (
          <div className={styles.errorNotice} role="alert">
            <span>
              변경 내용을 이 브라우저에 저장하지 못했어요. 창을 닫으면 사라질 수 있습니다.
            </span>
            <button
              type="button"
              className={styles.retryButton}
              onClick={onRetrySave}
            >
              다시 시도
            </button>
          </div>
        ) : (
          <span className={styles.saveNotice}>
            이 브라우저에 자동 저장됩니다.
          </span>
        )}
      </div>
    </footer>
  );
};
