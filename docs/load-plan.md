# 부하 테스트 계획

## 단계별 시나리오
- Low: 10~30 RPS, 안정성 확인 및 캐시 워밍
- Normal: 100~300 RPS, 평균 응답시간/CPU 사용률 관찰
- Peak: 목표 RPS 상회(예: 500~1000 RPS), 오류율·지연 발생 시 경고

## 메트릭 관측 대상
- RPS (Requests per second)
- 응답 시간(평균/95p)
- 오류율(HTTP 5xx, 타임아웃)
- CPU Usage (% Processor Time)
- Memory Consumption (Working Set / Available MBytes)

### 수집 방식
- 서버 미들웨어가 모든 요청(정적 포함)을 기록해 15초 이동 구간으로 RPS/평균 지연/오류율 계산(`systeminformation`으로 CPU/메모리 실측)
- `/api/metrics`/`/api/health` 폴링은 지표 계산에서 제외되어, 실제 부하 도구가 보낸 요청만 반영됨
- 리더보드: `/api/metrics` 호출 시 전달된 닉네임(쿼리/헤더)의 최고 RPS/최저 지연/오류율, 안정성 점수 업데이트

## 도구 옵션
- k6: 스크립트 기반 시나리오/바스팅, `k6 run script.js`
- Apache Bench: 단일 엔드포인트 빠른 바스팅, `ab -n 5000 -c 200 http://host/`
- JMeter: GUI/CLI 모두 가능, 복합 시나리오 작성

## 실행 예시 (k6)
```bash
k6 run -e TARGET_HOST=http://localhost:3000 scripts/basic.js
```
- 실행 중에 `/api/load/peak` 호출로 UI에 Peak 단계 알림
- k6 출력(JSON/CSV)을 서버가 읽어 `/api/metrics`에 반영하도록 추후 확장

## 발표용 구성 팁
- 프런트 페이지의 그래프와 함께 PerfMon/Task Manager 캡처를 병렬로 띄움
- 단계 전환 버튼 클릭 → k6/AB 실행 스크립트 트리거(향후 자동화 hook 추가 가능)
- Peak 도달 시 경고 배너, 노이즈(지연/오류) 강조
