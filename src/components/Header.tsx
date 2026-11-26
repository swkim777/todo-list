import React from 'react';
import styles from './Header.module.css';

interface HeaderProps {
  total: number;
  completed: number;
  percentage: number;
}

export const Header: React.FC<HeaderProps> = ({ total, completed, percentage }) => {
  // 기기 로컬 날짜를 한국어로 표시 (예: 2026년 11월 26일 목요일)
  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(today);

  return (
    <header className={styles.header}>
      <div className={styles.titleGroup}>
        <span className={styles.date}>{formattedDate}</span>
        <h1 className={styles.title}>나의 할 일</h1>
        <p className={styles.subtitle}>작은 실천으로 채우는 하루</p>
      </div>

      <div className={styles.statsCard}>
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>전체</span>
            <span className={styles.statValue}>{total}</span>
          </div>
          <div className={styles.divider} aria-hidden="true" />
          <div className={styles.statItem}>
            <span className={styles.statLabel}>완료</span>
            <span className={styles.statValue}>{completed}</span>
          </div>
          <div className={styles.divider} aria-hidden="true" />
          <div className={styles.statItem}>
            <span className={styles.statLabel}>진행률</span>
            <span className={styles.statValue}>{percentage}%</span>
          </div>
        </div>

        <div className={styles.progressContainer}>
          <div
            className={styles.progressBar}
            role="progressbar"
            aria-label="할 일 진행률"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={styles.progressFill}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
