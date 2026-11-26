import React, { useRef } from 'react';
import { TodoFilter } from '../types/todo';
import styles from './FilterAndSearch.module.css';

interface FilterAndSearchProps {
  filter: TodoFilter;
  onFilterChange: (filter: TodoFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalFiltered: number;
}

export const FilterAndSearch: React.FC<FilterAndSearchProps> = ({
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  totalFiltered,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filters: { key: TodoFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'active', label: '진행 중' },
    { key: 'completed', label: '완료' },
  ];

  const handleClearSearch = () => {
    onSearchChange('');
    searchInputRef.current?.focus();
  };

  return (
    <div className={styles.container}>
      <div className={styles.controlsRow}>
        {/* 필터 탭 */}
        <div className={styles.filterGroup} role="group" aria-label="할 일 상태 필터">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`${styles.filterButton} ${
                filter === f.key ? styles.filterButtonActive : ''
              }`}
              aria-pressed={filter === f.key}
              onClick={() => onFilterChange(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 검색 입력 */}
        <div className={styles.searchWrapper}>
          <label htmlFor="todo-search-input" className="sr-only">
            할 일 검색
          </label>
          <div className={styles.searchInputContainer}>
            <svg
              className={styles.searchIcon}
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
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="todo-search-input"
              ref={searchInputRef}
              type="search"
              className={styles.searchInput}
              placeholder="할 일 검색"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={handleClearSearch}
                aria-label="검색어 지우기"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 검색어 또는 특정 필터 적용 시 결과 안내 보조 텍스트 */}
      <div className={styles.metaRow}>
        <span className={styles.resultCount} aria-live="polite">
          {searchQuery
            ? `검색 결과 ${totalFiltered}개`
            : filter !== 'all'
            ? `${filter === 'active' ? '진행 중' : '완료'} 항목 ${totalFiltered}개`
            : null}
        </span>
      </div>
    </div>
  );
};
