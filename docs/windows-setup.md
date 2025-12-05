# VMware + Windows Server 2016 세팅 가이드

## 1. VMware 상에 Windows Server 2016 설치
- VM 생성: 4vCPU, 4~8GB RAM, 40GB+ 디스크 권장
- 네트워크: NAT 또는 브리지, 고정 IP 확보(부하툴/실습자 접근 용이)
- Windows 업데이트 적용 및 재부팅

## 2. 필수 도구 설치
- Node.js LTS (예: 18.x)
- Git, PowerShell 5 이상
- 성능 모니터링: Task Manager, Performance Monitor(PerfMon)
- 선택: IIS 역할 추가(Express 앱을 역프록시/호스팅용)

## 3. 리포지토리 배포
```powershell
# 관리자 PowerShell
cd C:\inetpub\wwwroot  # 또는 D:\apps
git clone <repo-url> win2016-load-demo
cd win2016-load-demo
npm install
npm run build
npm start
```
- 방화벽: 인바운드 포트(기본 3000) 허용
- 서비스화: NSSM/pm2/SC.exe 등으로 Node 프로세스 서비스 등록 가능

## 4. IIS와 병행 운영(옵션)
- IIS에 URL Rewrite + ARR 설치 후 `http://server/` → `http://localhost:3000` 프록시
- 정적 파일 캐싱/압축 설정
- 인증/접속 제어는 IIS에서 관리, Express는 API/웹소켓 전담

## 5. 모니터링 뷰 마련
- PerfMon 카운터: `% Processor Time`, `Available MBytes`, `Network Interface Bytes Total/sec`
- Task Manager Performance 탭을 화면 공유 또는 OBS 캡처
- 부하 테스트 시점과 PerfMon 로그 시계열을 나란히 제시
