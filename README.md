# Windows Server 2016 기반 동적 부하 처리 웹서비스

VMware 위의 Windows Server 2016 환경에서 TS 기반 웹서비스를 구축하고, 요청량 증가에 따른 서버 부하 변화를 시각화·실습할 수 있는 데모 프로젝트입니다. 로드 테스트(예: k6, Apache Bench, JMeter)를 통해 Peak 성능을 탐색하고, 후배/수강생이 직접 접속해 인터랙티브하게 실습하도록 설계합니다.

## 프로젝트 목표
- Windows Server 2016 환경에서 TypeScript 기반 웹서비스 구축(IIS 또는 Node.js/Express)
- 요청량 증가에 따른 RPS, CPU, 메모리, 응답 시간, 오류율 변화 확인
- 단계별 부하 시나리오(Low → Normal → Peak) 실습 및 경고 알림
- 성능 및 모니터링 지표를 실시간/근실시간으로 시각화

## 폴더 구조
```
.
├─ README.md              # 프로젝트 개요 및 실행 가이드
├─ package.json           # 의존성 및 스크립트 정의
├─ tsconfig.json          # 서버용 TS 설정
├─ tsconfig.client.json   # 클라이언트용 TS 설정
├─ docs/                  # 인프라/실습 문서
│  ├─ overview.md         # 시나리오, 핵심 기능 정리
│  ├─ windows-setup.md    # VMware + Windows Server 2016 세팅 가이드
│  └─ load-plan.md        # 부하 테스트 계획 및 메트릭 수집 방법
├─ src/
│  ├─ server/             # Express 서버 (API, 실시간 메트릭 수집/노출)
│  │  ├─ app.ts
│  │  └─ metrics.ts
│  └─ client/             # 프런트엔드 TS + 정적 리소스
│     ├─ index.html
│     ├─ styles.css
│     └─ main.ts
└─ public/
   └─ assets/             # 빌드된 클라이언트 JS/CSS 산출물 (tsconfig.client outDir)
```

## 실행 (개발용 예시)
```bash
npm install
npm run build       # 서버 + 클라이언트 TS 컴파일
npm start           # Express 서버 실행 (public 정적 파일 서빙)
```

### 주요 스크립트
- `npm run build:server` : `src/server` → `dist/server`
- `npm run build:client` : `src/client` → `public/assets`
- `npm run dev`          : ts-node 기반 서버 + 클라이언트 TS watch(간단 동시 실행)

## 프런트엔드 데모 개요
- 실시간/주기적 폴링으로 `/api/metrics` 수집 후 Chart.js(브라우저 CDN)로 시각화
- Low/Normal/Peak 버튼 → `/api/load/:level` 호출로 부하 단계 전환(실제 부하 도구 트리거 연결 가능)
- 응답 지연/오류율 상승 시 경고 배너 출력
- 브라우저 로컬에 임시 닉네임을 저장해 리더보드(최고 RPS, 최저 평균 지연, 오류율, 안정성 점수)로 실습자 경쟁

## 서버 데모 개요
- Express 정적 파일 서빙 + `/api/metrics`(실시간 지표) + `/api/load/:level`
- 요청마다 응답 시간/오류 여부를 기록하여 RPS·지연·오류율을 계산, CPU/메모리는 OS 실측(`systeminformation`)
- `/api/metrics` 호출 시 전달된 닉네임(쿼리/헤더)으로 리더보드 기록 업데이트
- 실제 부하 도구(k6/AB/JMeter)와 연동 시 `/api/metrics`에 실측 데이터 주입 가능하도록 확장

## API 개요
- `GET /api/metrics` : 실시간 메트릭 반환, 요청에 포함된 닉네임(`?name=` 또는 `x-user-name`)으로 리더보드 업데이트
- `POST /api/load/:level` : 부하 단계 전환 (low|normal|peak)
- `GET /api/identity` / `POST /api/identity` : 임시 닉네임 기본값 반환 / 유효성 체크
- `GET /api/leaderboard` : 최고 기록(peak RPS/지연/오류율/안정성) 상위 50명 조회

## Windows Server 2016 부하 프로필 (2GB RAM / 120GB Disk)
- `Low` → `Normal` → `Peak` → `Overload` 4단계. Windows Server 2016 VM(메모리 2GB, 디스크 120GB) 기준으로 튜닝.
- 각 단계마다 CPU 워커(Worker Threads)로 실제 연산 부하, 64~256MB 메모리 압박, temp 파일 IO 버스트를 발생시켜 Task Manager/PerfMon에서 즉시 체감.
- `/api/metrics` 응답에 현재 프로필(목표 RPS, 지연 범위, 오류율, CPU 워커 수, 메모리 압박량)이 포함되어 UI에 표시됩니다.

## 모니터링/실습 아이디어
- Windows Performance Monitor/Task Manager를 화면 공유하여 서버 리소스 추적
- 로드 테스트 도구를 원격 쉘이나 CI Job으로 실행해 실습자 요청 트리거
- Peak 시 응답 시간/오류율 threshold를 정해 경고 UI/Slack Webhook 연동

## 다음 단계
1) Windows Server 2016에 Node.js + IIS(또는 순수 Node) 설치, 본 리포 배포
2) k6/AB/JMeter 중 택1로 시나리오 작성 후 `/api/metrics`에 결과를 적재
3) Task Manager/PerfMon 카운터를 함께 캡처해 발표 자료 구성
