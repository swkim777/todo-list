import React, { useState } from 'react';
import styles from './CorruptedAlert.module.css';

interface CorruptedAlertProps {
  error: string;
  rawBackup?: string;
  onReset: () => void;
}

export const CorruptedAlert: React.FC<CorruptedAlertProps> = ({
  error,
  rawBackup,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleCopy = async () => {
    if (!rawBackup) return;
    try {
      await navigator.clipboard.writeText(rawBackup);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 쓰기 실패 시 대체
    }
  };

  return (
    <div className={styles.container} role="alert" aria-live="assertive">
      <div className={styles.iconRow}>
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <h2 className={styles.title}>저장된 데이터를 읽지 못했어요</h2>
      </div>

      <p className={styles.message}>
        {error} 기존 데이터는 덮어쓰거나 삭제하지 않고 안전하게 보존되었습니다.
      </p>

      {rawBackup && (
        <div className={styles.backupBox}>
          <div className={styles.backupHeader}>
            <span className={styles.backupLabel}>보존된 원본 데이터:</span>
            <button
              type="button"
              className={styles.copyButton}
              onClick={handleCopy}
              aria-label="보존된 데이터 클립보드로 복사"
            >
              {copied ? '복사 완료!' : '복사하기'}
            </button>
          </div>
          <pre className={styles.backupCode}>{rawBackup}</pre>
        </div>
      )}

      <div className={styles.actions}>
        {!showConfirmReset ? (
          <button
            type="button"
            className={styles.resetButton}
            onClick={() => setShowConfirmReset(true)}
          >
            스토리지 초기화하고 새로 시작
          </button>
        ) : (
          <div className={styles.confirmBox}>
            <p className={styles.confirmText}>
              정말 초기화하시겠습니까? 보존된 원본을 복사해두셨는지 확인해 주세요.
            </p>
            <div className={styles.confirmButtons}>
              <button
                type="button"
                className={styles.cancelConfirmButton}
                onClick={() => setShowConfirmReset(false)}
              >
                취소
              </button>
              <button
                type="button"
                className={styles.dangerResetButton}
                onClick={onReset}
              >
                초기화 확인
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
