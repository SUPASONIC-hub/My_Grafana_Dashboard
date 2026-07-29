# YOZM Wedding Customer Behavior Analytics Dashboard Portfolio

Grafana에서 Export한 `dashboard-1785303972836.json`을 기반으로 만든 포트폴리오용 인터랙티브 웹 대시보드입니다. 원본 대시보드는 ClickHouse 기반 고객 행동 분석 패널로 구성되어 있었기 때문에, 실제 운영 데이터와 DB 연결 정보는 사용하지 않고 브라우저에서 생성되는 가짜 데이터로 동일한 분석 흐름을 재현했습니다.

## 데모 방향

- 원본 Grafana의 다크모드 관제 경험을 웹 포트폴리오 형태로 재구성
- 플랫폼별 세션, 체류시간, 페이지 성과, 검색어, CTA 클릭, 스크랩, 기기 환경 지표 제공
- `Search_UserID` 검색, 기간 선택, 새 데이터 생성, 자동 갱신 인터랙션 제공
- `Profile.jpg`를 로고, 프로필 이미지, 파비콘으로 사용
- 외부 데이터베이스나 인증 없이 정적 사이트로 실행 가능

## 파일 구성

```text
.
├── index.html
├── styles.css
├── app.js
├── render.yaml
├── Profile.jpg
├── basic.md
└── dashboard-1785303972836.json
```

## 로컬 확인

별도 빌드 과정 없이 `index.html`을 브라우저에서 열면 바로 확인할 수 있습니다.

간단한 로컬 서버로 확인하려면 아래 명령을 사용할 수 있습니다.

```bash
python -m http.server 3000
```

그다음 브라우저에서 `http://localhost:3000`으로 접속합니다.

## Render 배포

Render 공식 문서 기준 Static Site는 GitHub 저장소를 연결하면 push마다 자동 배포할 수 있습니다. 이 저장소에는 Blueprint용 `render.yaml`이 포함되어 있어 Render에서 Blueprint 또는 Static Site로 연결할 수 있습니다.

권장 설정:

- Service type: Static Site
- Build Command: `echo "Static portfolio site ready"`
- Publish Directory: `.`
- Rewrite: `/*` -> `/index.html`

## 포트폴리오 설명

이 프로젝트는 회사 운영 데이터나 내부 DB 접속 없이도 실제로 설계했던 고객 행동 분석 대시보드의 구조와 UX 의도를 보여주기 위한 데모입니다. 원본 SQL과 데이터소스 연결은 실행 대상이 아니며, 패널 구성과 분석 목적을 웹 기반 시각화로 변환했습니다.

핵심 설계 포인트:

- Executive Summary에서 플랫폼별 세션 점유율, 평균 체류시간, 세션당 PV를 빠르게 파악
- 고객 유형별 파이프라인과 회원 상태를 통해 고객 세그먼트 변화를 추적
- 페이지별 조회, 진입/이탈, 스크롤 깊이로 콘텐츠 성과를 분석
- 검색어, 무결과율, CTA/상품 클릭, 스크랩 상태로 행동 전환 흐름을 확인
- 웹, iOS, AOS 및 기기 환경별 세션 분포로 UX 점검 포인트를 도출

## 보안 처리

운영 데이터베이스, 실제 사용자 정보, 내부 테이블 구조는 포트폴리오 사이트에서 호출하지 않습니다. 표시되는 모든 수치는 브라우저에서 생성되는 합성 데이터이며, 검토자가 인터랙션과 대시보드 설계 역량을 확인할 수 있도록 구성했습니다.
