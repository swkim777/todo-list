---
name: todo-app-dev
description: 한국어 TodoList 웹앱의 개발, 테스트 및 디자인 시스템 검증을 위한 보조 스킬
---

# TodoList 개발 및 검증 스킬

본 스킬은 `todo-list` 프로젝트의 컴포넌트 아키텍처, 디자인 토큰 적용, 접근성 및 자동화 테스트 검증 워크플로를 안내합니다.

## 핵심 가이드라인
1. **디자인 토큰 준수**: `DESIGN.md`에 명시된 CSS Custom Properties를 단일 원천으로 사용합니다.
2. **접근성(a11y)**:
   - 최소 터치/클릭 영역 44px 이상 확보
   - 명암비 최소 4.5:1 준수
   - WAI-ARIA 속성 (`aria-pressed`, `aria-describedby`, `aria-invalid` 등) 준수
   - 네이티브 키보드 탐색 및 포커스 복귀 지원
3. **한글 입력(IME) 지원**: 한글 조합 중 Enter 등록 오작동을 방지하기 위해 `e.nativeEvent.isComposing` 상태를 반드시 처리합니다.
4. **로컬 스토리지 데이터 안정성**:
   - 스키마 버전 관리 (`todo-app:v1`)
   - 손상 데이터 복구 및 원본 보존 정책
   - 비동기 저장 실패 대응
