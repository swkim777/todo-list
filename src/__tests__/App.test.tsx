import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { STORAGE_KEY } from '../types/todo';

describe('TodoList App Functional & Accessibility Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    // HTMLDialogElement mocking for jsdom
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.open = false;
    });
  });

  it('기본 렌더링 시 헤더, 진행률 0%, 빈 상태 안내를 올바르게 표시한다', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: '꼭 해야 할 일' })).toBeInTheDocument();
    expect(screen.getByText('작은 실천으로 채우는 하루')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: '할 일 진행률' })).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText('아직 할 일이 없어요')).toBeInTheDocument();
    expect(screen.getByText('이 브라우저에 자동 저장됩니다.')).toBeInTheDocument();
  });

  it('할 일을 정상적으로 추가하고 목록 맨 위에 표시한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByPlaceholderText('어떤 일을 할 예정인가요?');
    const addButton = screen.getByRole('button', { name: '할 일 추가' });

    await user.type(input, '첫 번째 할 일');
    await user.click(addButton);

    expect(screen.getByText('첫 번째 할 일')).toBeInTheDocument();
    expect(input).toHaveValue(''); // 입력창 초기화
    expect(input).toHaveFocus(); // 포커스 유지

    // 두 번째 추가
    await user.type(input, '두 번째 할 일');
    await user.keyboard('{Enter}');

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    // 최신 항목이 맨 위에 위치
    expect(items[0]).toHaveTextContent('두 번째 할 일');
    expect(items[1]).toHaveTextContent('첫 번째 할 일');
  });

  it('빈 문자열이나 공백만 입력 시 에러 메시지를 표시하고 등록을 차단한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByPlaceholderText('어떤 일을 할 예정인가요?');
    const addButton = screen.getByRole('button', { name: '할 일 추가' });

    // 공백만 입력
    await user.type(input, '   ');
    await user.click(addButton);

    expect(screen.getByRole('alert')).toHaveTextContent('할 일을 입력해 주세요.');
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);

    // 다시 타이핑하면 에러 메시지 해제
    await user.type(input, '새 작업');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('한글 IME 조합 중 Enter 시 의도치 않게 등록되지 않도록 방지한다', () => {
    render(<App />);
    const input = screen.getByPlaceholderText('어떤 일을 할 예정인가요?');

    fireEvent.change(input, { target: { value: '한글' } });

    // isComposing이 true인 상태에서 Enter 발생
    fireEvent.keyDown(input, {
      key: 'Enter',
      code: 'Enter',
      nativeEvent: { isComposing: true },
    });

    // 폼이 제출되지 않고 목록에 추가되지 않음
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('체크박스로 완료/미완료를 전환하고 진행률이 업데이트된다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByPlaceholderText('어떤 일을 할 예정인가요?');
    await user.type(input, '운동하기{Enter}');

    const checkbox = screen.getByRole('checkbox', { name: '운동하기' });
    expect(checkbox).not.toBeChecked();

    // 완료 처리
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');

    // 미완료로 다시 전환
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('내용 수정 및 취소(Esc)가 정상 동작한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByPlaceholderText('어떤 일을 할 예정인가요?');
    await user.type(input, '원래 내용{Enter}');

    const editBtn = screen.getByRole('button', { name: '"원래 내용" 내용 수정' });
    await user.click(editBtn);

    // 수정 입력창 나타남
    const editInput = screen.getByDisplayValue('원래 내용');
    expect(editInput).toHaveFocus();

    // 수정 입력 후 저장
    await user.clear(editInput);
    await user.type(editInput, '수정된 내용');
    await user.click(screen.getByRole('button', { name: '원래 내용 수정 내용 저장' }));

    expect(screen.getByText('수정된 내용')).toBeInTheDocument();
    expect(screen.queryByText('원래 내용')).not.toBeInTheDocument();

    // 다시 수정 시작 후 취소 (Esc)
    const newEditBtn = screen.getByRole('button', { name: '"수정된 내용" 내용 수정' });
    await user.click(newEditBtn);

    const editInput2 = screen.getByDisplayValue('수정된 내용');
    await user.type(editInput2, ' 변경 시도');
    await user.keyboard('{Escape}');

    expect(screen.getByText('수정된 내용')).toBeInTheDocument();
  });

  it('개별 삭제 및 실행 취소(Undo)가 올바르게 작동한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByPlaceholderText('어떤 일을 할 예정인가요?');
    await user.type(input, '작업 1{Enter}');
    await user.type(input, '작업 2{Enter}');

    // '작업 1' 삭제
    const deleteBtn = screen.getByRole('button', { name: '"작업 1" 삭제' });
    await user.click(deleteBtn);

    expect(screen.queryByText('작업 1')).not.toBeInTheDocument();
    // 실행 취소 알림 노출
    const undoToast = screen.getByRole('status', { name: '삭제 알림' });
    expect(undoToast).toHaveTextContent('할 일을 삭제했어요.');

    // 실행 취소 클릭
    const undoBtn = screen.getByRole('button', { name: '방금 삭제한 할 일 실행 취소' });
    await user.click(undoBtn);

    // '작업 1' 복원 확인
    expect(screen.getByText('작업 1')).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: '삭제 알림' })).not.toBeInTheDocument();
  });

  it('필터(전체/진행 중/완료) 및 검색 기능이 정상 동작한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByPlaceholderText('어떤 일을 할 예정인가요?');
    await user.type(input, '사과 구매{Enter}');
    await user.type(input, '바나나 구매{Enter}');

    // '사과 구매'를 완료 처리
    const appleCheck = screen.getByRole('checkbox', { name: '사과 구매' });
    await user.click(appleCheck);

    // 1. '진행 중' 필터 선택
    const activeFilterBtn = screen.getByRole('button', { name: '진행 중' });
    await user.click(activeFilterBtn);
    expect(screen.getByText('바나나 구매')).toBeInTheDocument();
    expect(screen.queryByText('사과 구매')).not.toBeInTheDocument();

    // 2. '완료' 필터 선택
    const completedFilterBtn = screen.getByRole('button', { name: '완료' });
    await user.click(completedFilterBtn);
    expect(screen.getByText('사과 구매')).toBeInTheDocument();
    expect(screen.queryByText('바나나 구매')).not.toBeInTheDocument();

    // 3. '전체' 필터 복귀
    await user.click(screen.getByRole('button', { name: '전체' }));

    // 4. 검색
    const searchInput = screen.getByPlaceholderText('할 일 검색');
    await user.type(searchInput, '바나나');
    expect(screen.getByText('바나나 구매')).toBeInTheDocument();
    expect(screen.queryByText('사과 구매')).not.toBeInTheDocument();
    expect(screen.getByText('검색 결과 1개')).toBeInTheDocument();

    // 5. 검색어 지우기
    const clearSearchBtn = screen.getByRole('button', { name: '검색어 지우기' });
    await user.click(clearSearchBtn);
    expect(screen.getByText('사과 구매')).toBeInTheDocument();
    expect(screen.getByText('바나나 구매')).toBeInTheDocument();
  });

  it('완료 항목 일괄 삭제 대화상자에서 취소 및 삭제가 올바르게 작동한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByPlaceholderText('어떤 일을 할 예정인가요?');
    await user.type(input, '완료할 일{Enter}');
    await user.type(input, '남겨둘 일{Enter}');

    await user.click(screen.getByRole('checkbox', { name: '완료할 일' }));

    const clearCompletedBtn = screen.getByRole('button', { name: '완료한 할 일 1개 일괄 삭제' });
    expect(clearCompletedBtn).toBeEnabled();

    // 일괄 삭제 클릭 -> 대화상자 열림
    await user.click(clearCompletedBtn);
    expect(screen.getByRole('heading', { name: '완료한 할 일을 삭제할까요?' })).toBeInTheDocument();
    expect(screen.getByText('완료한 할 일 1개가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.')).toBeInTheDocument();

    // 취소 클릭
    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.getByText('완료할 일')).toBeInTheDocument();

    // 다시 열어서 삭제 확인 클릭
    await user.click(clearCompletedBtn);
    await user.click(screen.getByRole('button', { name: '1개 삭제' }));

    expect(screen.queryByText('완료할 일')).not.toBeInTheDocument();
    expect(screen.getByText('남겨둘 일')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '완료한 할 일 0개 일괄 삭제' })).toBeDisabled();
  });

  it('localStorage에 저장된 데이터가 새로고침 시 안전하게 복원된다', async () => {
    const savedState = {
      schemaVersion: 1,
      tasks: [
        {
          id: 'test-1',
          text: '복원된 할 일',
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('복원된 할 일')).toBeInTheDocument();
    });
  });
});
