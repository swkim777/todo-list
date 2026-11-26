import React, { useRef, useEffect } from 'react';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
  triggerElement: HTMLElement | null;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  count,
  onConfirm,
  onCancel,
  triggerElement,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
      // 열릴 때 기본 포커스를 '취소' 버튼에 설정
      setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 0);
    } else {
      if (dialog.open) {
        dialog.close();
      }
      // 닫힐 때 호출 버튼으로 포커스 복귀
      if (triggerElement && document.body.contains(triggerElement)) {
        if (!triggerElement.hasAttribute('disabled')) {
          triggerElement.focus();
        } else {
          // 호출 버튼이 disabled 되었으면 대체 포커스 대상(예: 메인 제목 또는 입력)
          document.getElementById('new-todo-input')?.focus();
        }
      }
    }
  }, [isOpen, triggerElement]);

  // Esc 키 또는 backdrop 클릭 처리
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onCancel();
    };

    const handleClick = (e: MouseEvent) => {
      // backdrop 클릭 시 닫기
      const rect = dialog.getBoundingClientRect();
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!isInDialog) {
        onCancel();
      }
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('click', handleClick);

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('click', handleClick);
    };
  }, [onCancel]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="dialog-title"
      aria-describedby="dialog-desc"
    >
      <div className={styles.container}>
        <h2 id="dialog-title" className={styles.title}>
          완료한 할 일을 삭제할까요?
        </h2>
        <p id="dialog-desc" className={styles.description}>
          완료한 할 일 {count}개가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
        </p>

        <div className={styles.buttonGroup}>
          <button
            ref={cancelBtnRef}
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            취소
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={onConfirm}
          >
            {count}개 삭제
          </button>
        </div>
      </div>
    </dialog>
  );
};
