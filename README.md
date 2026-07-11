# 동네 한 바퀴 — 경산 탐험 MVP

경산의 랜드마크를 방문하고, 장소별 아이템과 포인트를 모아 **흰곰 캐릭터**를 꾸미는 모바일 우선 위치 기반 웹앱 MVP입니다.

별도 서버·데이터베이스·유료 지도 API 없이 실행됩니다. 방문·구매 기록은 브라우저 `localStorage`에 저장되며, 실제 GPS 인증과 발표용 데모 인증을 모두 지원합니다.

## 구현 기능

- 경산 랜드마크 목록 및 카테고리 필터
- 브라우저 GPS 위치 확인 및 반경 기반 방문 인증
- 현장 QR 값 입력 인증
- 발표용 개별/전체 데모 해금
- 흰색 곰 캐릭터와 아이템 착용/해제
- 방문 및 미션 포인트 적립
- 포인트 상점, 잔액 차감, 구매 기록 저장
- 히든 코드 입력 및 전용 아이템 해금
- 방문 보상·상점·히든 아이템 통합 도감
- 단계별 미션과 제휴 쿠폰 해금
- Web Share API 또는 클립보드 공유
- 모바일 설치형 PWA 및 오프라인 캐시

## 바로 실행

```bash
python -m http.server 3000
```

브라우저에서 `http://localhost:3000`을 엽니다.

## GitHub 업로드

```bash
git init
git add .
git commit -m "feat: 흰곰 캐릭터와 포인트 상점 추가"
git branch -M main
git remote add origin https://github.com/사용자명/저장소명.git
git push -u origin main
```

## Vercel 배포

1. Vercel에서 **Add New → Project**를 선택합니다.
2. 이 프로젝트를 올린 GitHub 저장소를 Import합니다.
3. Framework Preset은 `Other`, Build Command는 비워 두고, Output Directory는 `.`로 둡니다.
4. Deploy를 누릅니다.

## 포인트 상점 수정

`data.js`의 `SHOP_ITEMS`에서 이름, 이모지, 착용 위치, 가격을 수정할 수 있습니다.

```js
{ id: 'red-scarf', name: '빨간 목도리', emoji: '🧣', slot: 'neck', price: 180 }
```

착용 위치는 `hat`, `hand`, `neck`, `chest` 중 하나입니다.

## 히든 아이템 코드

현재 시연용 히든 코드는 다음과 같습니다.

```text
YUKK-BEAR-26
```

코드를 다시 변경하려면 `data.js`의 아래 값을 수정하세요.

```js
export const HIDDEN_ITEM_CODE = 'YUKK-BEAR-26';
```

정적 웹앱의 코드는 브라우저에서 확인할 수 있으므로 실제 서비스의 비밀 코드 검증은 서버 또는 데이터베이스 함수에서 처리해야 합니다.

## 실제 운영 전 수정할 곳

`data.js`의 `LANDMARKS` 배열에서 아래 항목을 검증·수정하세요.

- `lat`, `lng`: 현장 인증 지점의 정확한 위도·경도
- `radius`: GPS 허용 반경(미터)
- `qrCode`: 현장에 게시할 QR 코드 문자열
- `reward`: 장소별 아이템
- `points`: 장소별 보상 포인트

현재 좌표는 MVP 시연용 근사값입니다.
