import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { STORAGE_KEY } from '../types/todo';

describe('TodoList Edge Cases & Error Handling Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.open = false;
    });
  });

  it('필터가 "완료"인 상태에서 새 할 일을 추가하면 숨김 안내 배너와 전체 보기 동작이 제공된다', async () => {
    const user = userEvent.setup();
    render(<App />);

    // '완료' 필터로 변경
    await user.click(screen.getByRole('button', { name: '완료' }));

    // 새 할 일 추가 (미완료 상태로 추가되므로 완료 필터에서는 숨겨짐)
    const input = screen.getByPlaceholderText('어떤 일을 할 예정인가요?');
    await user.type(input, '새로운 미완료 작업{Enter}');

    // 안내 배너 확인
    expect(
      screen.getByText('할 일을 추가했어요. 현재 조건에서는 보이지 않습니다.')
    ).toBeInTheDocument();

    // '전체 보기' 클릭
    const viewAllBtn = screen.getByRole('button', { name: '전체 보기' });
    await user.click(viewAllBtn);

    // 전체 목록으로 복귀하여 항목이 보임
    expect(screen.getByText('새로운 미완료 작업')).toBeInTheDocument();
  });

  it('연속 삭제 시 최신 삭제 1건만 실행 취소 대상이 된다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByPlaceholderText('어떤 일을 할 예정인가요?');
    await user.type(input, '첫 번째 작업{Enter}');
    await user.type(input, '두 번째 작업{Enter}');

    // '첫 번째 작업' 삭제 후 '두 번째 작업' 연속 삭제
    await user.click(screen.getByRole('button', { name: '"첫 번째 작업" 삭제' }));
    await user.click(screen.getByRole('button', { name: '"두 번째 작업" 삭제' }));

    // 실행 취소 클릭 -> 가장 마지막에 삭제된 '두 번째 작업'만 복원됨
    const undoBtn = screen.getByRole('button', { name: '방금 삭제한 할 일 실행 취소' });
    await user.click(undoBtn);

    expect(screen.getByText('두 번째 작업')).toBeInTheDocument();
    expect(screen.queryByText('첫 번째 작업')).not.toBeInTheDocument();
  });

  it('스토리지 데이터가 손상되었을 때 안내 및 원본 보존, 초기화 옵션이 제공된다', async () => {
    const brokenData = '{"schemaVersion":1, "tasks": "invalid-tasks-type"}';
    localStorage.setItem(STORAGE_KEY, brokenData);

    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText('저장된 데이터를 읽지 못했어요')).toBeInTheDocument();
    expect(screen.getByText(brokenData)).toBeInTheDocument();

    // 초기화 버튼 클릭
    const resetBtn = screen.getByRole('button', { name: '스토리지 초기화하고 새로 시작' });
    await user.click(resetBtn);

    // 확인 버튼 클릭
    const confirmBtn = screen.getByRole('button', { name: '초기화 확인' });
    await user.click(confirmBtn);

    // 정상 빈 상태로 복귀
    expect(screen.queryByText('저장된 데이터를 읽지 못했어요')).not.toBeInTheDocument();
    expect(screen.getByText('아직 할 일이 없어요')).toBeInTheDocument();
  });

  it('200자 제한을 초과하는 입력은 차단된다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByPlaceholderText('어떤 일을 할 예정인가요?');
    // 250자 문자열
    const longText = '가'.repeat(250);
    await user.type(input, longText);

    // maxLength가 200이므로 200자로 잘림
    expect(input).toHaveValue('가'.repeat(200));
  });

  it('공백 없는 긴 영문 문자열이나 긴 한국어 텍스트도 정상 렌더링된다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const longWord = 'Supercalifragilisticexpialidocious'.repeat(5);
    const input = screen.getByPlaceholderText('어떤 일을 할 예정인가요?');
    await user.type(input, `${longWord.substring(0, 150)}{Enter}`);

    await waitFor(() => {
      expect(screen.getByText(longWord.substring(0, 150))).toBeInTheDocument();
    });
  });
});
