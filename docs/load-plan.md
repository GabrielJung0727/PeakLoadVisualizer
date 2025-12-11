# 부하 테스트 계획

## 단계별 시나리오 (실측 기반)
- Low: 워밍업, 기준선 확인. RPS/지연은 들어오는 실제 요청량에 비례(시나리오 도구가 결정).
- Normal: CPU 워커 1개 + 메모리 64MB 압박. 일반 트래픽 상태를 가정.
- Peak: CPU 워커 추가 + 메모리 128MB 압박 + 디스크 IO 버스트. PerfMon/Task Manager에서 스파이크 관찰.
- Overload: CPU 워커 최대(프로필 내 설정), 메모리 256MB 압박, IO 버스트 간격 단축. 포화 상태를 고의로 재현.

## 메트릭 관측 대상
- RPS (Requests per second)
- 응답 시간(평균/95p)
- 오류율(HTTP 5xx, 타임아웃)
- CPU Usage (% Processor Time)
- Memory Consumption (Working Set / Available MBytes)

### 수집 방식
- 서버 미들웨어가 모든 실제 요청(정적 포함)을 기록해 15초 이동 구간으로 RPS/평균 지연/오류율 계산(`systeminformation`으로 CPU/메모리/디스크 실측)
- `/api/metrics`/`/api/health` 폴링은 지표 계산에서 제외되어, k6/AB/JMeter 등 실제 부하 도구가 보낸 요청만 반영됨
- 리더보드: `/api/metrics` 호출 시 전달된 닉네임(쿼리/헤더)의 최고 RPS/최저 지연/오류율, 안정성 점수 업데이트

## 도구 옵션
- k6: 스크립트 기반 시나리오/바스팅, `k6 run script.js`
- Apache Bench: 단일 엔드포인트 빠른 바스팅, `ab -n 5000 -c 200 http://host/`
- JMeter: GUI/CLI 모두 가능, 복합 시나리오 작성

## 실행 예시 (k6)
```bash
k6 run -e TARGET_HOST=http://localhost:3000 scripts/basic.js
```
- 실행 중에 `/api/load/peak` 또는 `/api/load/overload` 호출로 자원 압박을 전환
- k6 출력(JSON/CSV)을 서버가 읽어 `/api/metrics`에 반영하도록 추후 확장 가능

## 발표용 구성 팁
- 프런트 페이지의 그래프와 함께 PerfMon/Task Manager 캡처를 병렬로 띄움
- 단계 전환 버튼 클릭 → k6/AB 실행 스크립트 트리거(향후 자동화 hook 추가 가능)
- Peak 도달 시 경고 배너, 노이즈(지연/오류) 강조
