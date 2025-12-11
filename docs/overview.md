# 프로젝트 개요 (Windows Server 2016 기반 동적 부하 처리 웹서비스 - 실측)

## 배경
- VMware 상의 Windows Server 2016에 TypeScript(Express) 웹서비스 구축
- 로드 테스트(k6/Apache Bench/JMeter)로 요청량을 단계별(Low→Normal→Peak→Overload) 상승
- 서버 리소스(CPU/RAM/디스크 IO)와 서비스 품질(RPS/응답시간/오류율)을 실시간으로 시각화해 교육·발표

## 핵심 기능
- `/api/metrics`: 실시간 수집 메트릭(RPS, CPU, 메모리, 디스크 IO, 응답시간, 오류율) — 전부 실측 값
- 요청 종료 시 응답 시간/오류 여부 기록 → 이동 평균 RPS/지연/오류율 계산, CPU·메모리·디스크는 OS 실측(`systeminformation`)
- `/api/load/:level`: Low/Normal/Peak/Overload 단계 전환(프로필은 CPU 워커·메모리 압박·IO 버스트만 변경, RPS/지연은 실제 요청 기반)
- 정적 페이지(`src/client/index.html`): 실시간 그래프, 경고 배너, 단계 전환 버튼
- 리더보드: 브라우저에 임시 저장된 닉네임을 전송해 최고 RPS/최저 지연/오류율/안정성 점수로 순위 노출

## 기술 스택 제안
- 서버: Node.js + Express (TS)
- 프런트: HTML + TS(컴파일 후 브라우저), Chart.js CDN
- 로드 테스트: k6 또는 Apache Bench(간단), JMeter(시나리오 기반)
- 모니터링: Windows Task Manager + Performance Monitor 카운터(Processor Time, Memory)

## 확장 아이디어
- `/api/metrics`에 실제 k6/AB/JMeter 출력값 push
- Peak 임계값 초과 시 Slack/Webhook 알림
- PerfMon CSV/TSV를 파싱해 프런트 그래프에 추가
- IIS 역방향 프록시 설정으로 Node 앱과 공존
