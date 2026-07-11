# 동네 한 바퀴 — 경산 탐험 MVP

경산의 랜드마크를 방문하고, 장소별 캐릭터 아이템을 수집하며, 지역 미션과 쿠폰을 경험하는 **모바일 우선 위치 기반 웹앱 MVP**입니다.

별도 서버·데이터베이스·유료 지도 API 없이 실행됩니다. 방문 기록은 브라우저 `localStorage`에 저장되며, 실제 GPS 인증과 발표용 데모 인증을 모두 지원합니다.

## 구현 기능

- 경산 랜드마크 목록 및 카테고리 필터
- 브라우저 GPS 위치 확인 및 반경 기반 방문 인증
- 현장 QR 값 입력 인증
- 발표용 개별/전체 데모 해금
- 장소별 캐릭터 아이템 수집
- 캐릭터 아이템 착용/해제
- 수집 도감 및 진행률
- 단계별 미션, 포인트, 제휴 쿠폰 해금
- Web Share API 또는 클립보드 공유
- 모바일 설치형 PWA 및 오프라인 캐시
- 브라우저 `localStorage` 기반 상태 저장

## 바로 실행

정적 파일이므로 `index.html`을 직접 열 수도 있지만, 위치 기능과 ES Module 사용을 위해 로컬 서버 실행을 권장합니다.

```bash
python -m http.server 3000
```

브라우저에서 `http://localhost:3000`을 엽니다.

## GitHub 업로드

```bash
git init
git add .
git commit -m "feat: 동네 한 바퀴 MVP"
git branch -M main
git remote add origin https://github.com/사용자명/저장소명.git
git push -u origin main
```

## Vercel 배포

1. Vercel에서 **Add New → Project**를 선택합니다.
2. 이 프로젝트를 올린 GitHub 저장소를 Import합니다.
3. Framework Preset은 `Other`, Build Command는 비워 두고, Output Directory는 `.`로 둡니다.
4. Deploy를 누릅니다.

이후 GitHub `main` 브랜치에 push할 때마다 자동 재배포됩니다.

## 실제 운영 전 수정할 곳

`data.js`의 `LANDMARKS` 배열에서 아래 항목을 검증·수정하세요.

- `lat`, `lng`: 현장 인증 지점의 정확한 위도·경도
- `radius`: GPS 허용 반경(미터)
- `qrCode`: 현장에 게시할 QR 코드 문자열
- `reward`: 장소별 아이템
- `points`: 장소별 보상 포인트

현재 좌표는 MVP 시연용 근사값입니다. 현장 운영 전 지도에서 정확한 인증 지점을 다시 확인해야 합니다.

## QR 운영 방법

QR 이미지에는 각 장소의 `qrCode` 값만 넣으면 됩니다. 예: 영남대학교는 `YU2026`.

사용자가 휴대전화 기본 카메라로 QR을 스캔해 표시된 값을 앱에 입력하는 단순 방식입니다. 다음 단계에서 웹 카메라 스캐너를 추가할 수 있습니다.

## 데이터 구조와 한계

현재 버전은 로그인과 서버 DB가 없어서 기록이 한 기기·한 브라우저에만 남습니다. 브라우저 데이터를 지우면 기록도 사라집니다. 실제 서비스 단계에서는 다음 구성이 적합합니다.

- 인증/DB: Supabase 또는 Firebase
- 관리자 페이지: 랜드마크, 미션, 쿠폰 CRUD
- 부정 인증 방지: GPS 정확도, 체류 시간, 일회용 QR, 서버 검증
- 지도: Kakao Maps 또는 Naver Maps API
- 분석: 익명 방문·전환 이벤트 집계

## 파일 구조

```text
.
├── index.html
├── styles.css
├── app.js
├── data.js
├── manifest.webmanifest
├── sw.js
├── vercel.json
└── assets/
    ├── favicon.svg
    └── app-icon.svg
```
