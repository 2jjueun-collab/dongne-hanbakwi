# 동네 한 바퀴 — 하곰 탐험 MVP

경산 랜드마크를 반복 방문하고 매번 랜덤 지역 아이템과 포인트를 받아 **하곰**을 꾸미는 모바일 우선 웹앱입니다. 정적 파일만 사용하므로 GitHub에 올린 뒤 Vercel에서 별도 빌드 없이 배포할 수 있습니다.

## 적용된 기능

- 사용자가 제공한 하곰 캐릭터 이미지 적용
- 캐릭터 이름 `하곰`
- GPS, QR, 발표용 데모 방문 인증
- 동일 장소 반복 방문 가능
- 각 랜드마크마다 3종의 지역 아이템 보상
- 방문할 때마다 해당 장소 보상 중 1개를 무작위 지급
- 중복 아이템 누적 개수 표시
- 방문 및 미션 완료 시 포인트 획득
- 포인트 상점에서 일반 아이템 구매
- 포인트 전용 히든 아이템 뽑기
- 히든 아이템은 획득 전 이름과 모습 비공개
- 친구 공유 코드 생성 및 친구 목록 추가
- 친구의 현재 하곰 착용 모습 확인
- 친구 3명 이상 추가 시 숨겨진 우정 뱃지 획득
- 브라우저 저장 및 PWA 오프라인 캐시

## 실행 방법

정적 파일을 직접 열기보다 로컬 서버를 사용합니다.

```bash
python -m http.server 3000
```

브라우저에서 `http://localhost:3000`을 엽니다.

## GitHub 업로드

```bash
git init
git add .
git commit -m "feat: 하곰 친구와 랜덤 방문 보상 추가"
git branch -M main
git remote add origin https://github.com/사용자명/저장소명.git
git push -u origin main
```

## Vercel 배포

1. Vercel에서 **Add New → Project**를 선택합니다.
2. GitHub 저장소를 Import합니다.
3. Framework Preset은 `Other`로 선택합니다.
4. Build Command는 비워 둡니다.
5. Output Directory는 `.`으로 설정합니다.
6. Deploy를 누릅니다.

## 하곰 이미지

- 이미지 로딩 실패용 대체 파일: `assets/hagom-placeholder.svg`

이미지 경로와 캐릭터 이름은 `data.js`에서 변경할 수 있습니다.

```js
export const CHARACTER = {
  name: '하곰',
  image: './assets/hagom-front-stand-cutout.png',
  fallbackImage: HAGOM_CUTOUT_INLINE
};
```

## 랜드마크 랜덤 보상

`data.js`의 각 `LANDMARKS` 항목에 있는 `rewards` 배열을 수정합니다. 현재 모든 장소에 3개의 아이템이 들어 있습니다.

```js
rewards: [
  { id: 'yu-cap', name: '영대 학사모', emoji: '🎓', slot: 'hat' },
  { id: 'yu-jacket', name: '캠퍼스 점퍼', emoji: '🧥', slot: 'chest' },
  { id: 'yu-notebook', name: '탐험 노트', emoji: '📓', slot: 'hand' }
]
```

방문 처리 시 `app.js`의 `completeVisit()`가 해당 장소의 보상 중 하나를 무작위로 선택합니다. 같은 장소를 다시 방문해도 포인트와 랜덤 아이템이 지급됩니다.

## 히든 뽑기

- 뽑기 비용: `data.js`의 `HIDDEN_DRAW_COST`
- 아이템 목록과 확률 가중치: `HIDDEN_GACHA_ITEMS`

```js
export const HIDDEN_DRAW_COST = 250;

{ id: 'hidden-crown', name: '밤하늘 왕관', emoji: '💫', slot: 'hat', weight: 12 }
```

`weight` 값이 클수록 당첨 확률이 높습니다. 앱 화면에서는 획득 전 이름과 모습을 공개하지 않습니다. 정적 웹앱은 소스가 브라우저에 전달되므로 실제 운영 서비스에서는 서버에서 추첨을 처리해야 합니다.

## 친구 기능 방식

현재 버전은 데이터베이스 없이 실행되는 공모전용 MVP입니다.

1. 각 사용자가 자신의 하곰 공유 코드를 복사합니다.
2. 서로 코드를 교환해 친구 목록에 추가합니다.
3. 친구 목록에서 상대가 공유한 착용 상태를 확인합니다.
4. 친구가 꾸미기를 바꾸면 새 코드를 다시 입력해 정보를 갱신합니다.

로그인, 친구 요청·수락, 실시간 자동 갱신이 필요한 운영 버전은 Firebase 또는 Supabase 같은 인증·데이터베이스를 연결해야 합니다.

## 주요 데이터 수정 위치

- 랜드마크, QR, 위치, 랜덤 보상: `data.js`의 `LANDMARKS`
- 미션: `MISSIONS`
- 일반 상점: `SHOP_ITEMS`
- 히든 뽑기: `HIDDEN_GACHA_ITEMS`
- 우정 뱃지: `FRIENDSHIP_BADGE`

## 실제 운영 전 확인 사항

- 랜드마크 위도·경도와 GPS 반경 정확성
- QR 코드 실제 출력 및 현장 테스트
- 반복 방문 악용 방지를 위한 시간 제한 또는 일일 횟수 제한
- 실시간 친구 기능용 로그인·데이터베이스
- 개인정보 처리방침과 이용약관

## 하곰 이미지가 깨질 때


기존 배포에서 이미지가 계속 깨지면 Vercel 재배포 후 브라우저에서 `Ctrl + Shift + R`로 강력 새로고침하세요. 서비스 워커 캐시 버전도 함께 변경되어 다음 접속부터 자동 갱신됩니다.


## 하곰 이미지 적용 방식

- 웹페이지에 원본 이미지 전체를 붙이지 않습니다.
- 두 번째 캐릭터 설정 이미지의 **정면 차렷 자세만 누끼 처리한 투명 PNG**를 사용합니다.
- 실제 파일: `assets/hagom-front-stand-cutout.png`
- `data.js`에는 같은 투명 이미지를 예비 데이터로 포함해, 배포 과정에서 이미지 경로가 잘못되어도 캐릭터가 깨지지 않도록 했습니다.
- 하곰 꾸미기와 친구 캐릭터 미리보기에서도 동일한 정면 자세를 사용합니다.
