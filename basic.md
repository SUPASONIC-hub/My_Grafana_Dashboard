회사의 보안과 데이터를 지키면서 면접관에게 완벽한 대시보드를 보여줄 수 있는 최고의 선택입니다.
그라파나 클라우드를 새로 파실 필요 전혀 없습니다. 본인 컴퓨터(로컬)나 면접관 컴퓨터에서 명령어 한 줄로 그라파나가 실행되고, 가짜 데이터가 알아서 흐르며, 내가 만든 대시보드가 즉시 팝업되도록 패키징하는 방법을 가장 쉽게 단계별로 알려드릴게요.
------------------------------
## 전체 흐름도

   1. [회사] 대시보드를 JSON 파일로 백업받기
   2. [내 컴퓨터] 텍스트 에디터로 JSON 파일 내의 DB 연결 정보 지우기
   3. [내 컴퓨터] Docker 구성 파일(docker-compose.yml) 만들기
   4. [내 컴퓨터] 깃허브(GitHub)에 올려서 완성하기

------------------------------
## 1단계: 회사 그라파나에서 대시보드 JSON 백업하기
먼저 회사 서버에 있는 대시보드의 '뼈대(구조)'를 가져와야 합니다.

   1. 회사 그라파나 대시보드에 접속합니다.
   2. 우측 상단의 Share (공유) 아이콘을 클릭합니다.
   3. Export 탭을 누른 뒤, 아래 Save to file 버튼을 클릭합니다.
   4. my-dashboard.json 같은 파일이 다운로드됩니다. 이 파일을 개인 컴퓨터로 가져옵니다.

------------------------------
## 2단계: JSON 파일에서 '가짜 데이터(TestData)'로 연결 바꾸기
현재 JSON 파일은 회사의 닫힌 DB를 바라보고 있습니다. 이를 그라파나 자체 가짜 데이터 엔진(TestData DB)으로 교체해 줍니다.

   1. 다운로드한 JSON 파일을 메모장이나 VS Code 같은 텍스트 에디터로 엽니다.
   2. 단축키 Ctrl + F (맥은 Cmd + F)를 눌러 "datasource"를 찾습니다.
   3. 기존 DB 이름이나 UID로 되어 있는 부분을 다음과 같이 수정합니다. (전체 바꾸기 기능을 쓰면 편합니다)
   * 수정 전 (예시): "datasource": { "type": "mysql", "uid": "abc123xyz" }
      * 수정 후: "datasource": { "type": "testdata", "uid": "grafana-testdata-datasource" }
   4. 파일을 dashboard.json이라는 이름으로 저장합니다.

------------------------------
## 3단계: 내 컴퓨터에 깃허브에 올릴 폴더 구조 만들기
컴퓨터에 아무 곳에나 새 폴더를 하나 만듭니다 (폴더명 예시: grafana-portfolio).
그 폴더 안에 아래와 같이 똑같이 구조를 만듭니다.

grafana-portfolio/
├── docker-compose.yml
├── provisioning/
│   ├── dashboards/
│   │   ├── dashboard.yaml
│   │   └── dashboard.json  <-- (2단계에서 수정한 파일 넣기)
│   └── datasources/
│       └── datasource.yaml

각 파일의 위치에 맞게 아래의 텍스트 내용을 그대로 복사해서 붙여넣고 저장하세요.
## ① datasource.yaml (TestData DB를 자동 등록하는 설정)
경로: provisioning/datasources/datasource.yaml

apiVersion: 1datasources:
  - name: TestData
    type: testdata
    uid: grafana-testdata-datasource
    access: proxy
    isDefault: true

## ② dashboard.yaml (JSON 파일을 대시보드로 자동 로드하는 설정)
경로: provisioning/dashboards/dashboard.yaml

apiVersion: 1providers:
  - name: 'My Portfolio Dashboards'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    editable: true
    options:
      path: /etc/grafana/provisioning/dashboards

## ③ docker-compose.yml (그라파나를 실행하는 핵심 마스터 파일)
경로: grafana-portfolio/docker-compose.yml (최상위 폴더 바로 아래)

version: '3.8'
services:
  grafana:
    image: grafana/grafana:latest
    container_name: portfolio-grafana
    ports:
      - "3000:3000"
    volumes:
      - ./provisioning:/etc/grafana/provisioning
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
    restart: unless-stopped

꿀팁 설정: GF_AUTH_ANONYMOUS_ENABLED=true를 넣어두었기 때문에, 면접관이 로그인(admin/admin 입력)할 필요 없이 사이트 접속하자마자 최고 권한으로 대시보드를 바로 볼 수 있습니다.

------------------------------
## 4단계: 내 로컬에서 먼저 테스트해보기
깃허브에 올리기 전에 내 컴퓨터에서 잘 작동하는지 확인합니다. (컴퓨터에 Docker Desktop이 설치되어 있어야 합니다.)

   1. 터미널(또는 CMD)을 열고 grafana-portfolio 폴더로 이동합니다.
   2. 아래 명령어를 입력합니다.
   
   docker-compose up -d
   
   3. 인터넷 창을 열고 http://localhost:3000에 접속합니다.
   4. 로그인 창 없이 바로 그라파나가 열리며, 좌측 메뉴 Dashboards로 가시면 내가 회사에서 만든 대시보드가 그대로 나타납니다! 데이터도 깨지지 않고 가짜 시계열 데이터가 실시간으로 출렁이며 움직이는 것을 볼 수 있습니다. 확인 후 터미널에 docker-compose down을 치면 꺼집니다.

------------------------------
## 5단계: 깃허브(GitHub)에 올리고 포트폴리오 다듬기
성공했다면 이 grafana-portfolio 폴더 전체를 본인 깃허브 저장소(Public)에 올립니다.
마지막으로 깃허브 리포지토리 메인 화면에 보일 README.md 파일을 작성합니다. 면접관은 코드를 보기 전 이 설명 글을 먼저 읽습니다. 아래 양식을 복사해서 채워보세요.

# 📊 가상 시계열 데이터를 활용한 인프라 모니터リング 대시보드 포트폴리오
이 프로젝트는 현업에서 설계하고 운영했던 그라파나(Grafana) 대시보드의 구조와 시각화 아키텍처를 보여주기 위한 데모 인스턴스입니다. 보안을 위해 실제 데이터베이스 연결 대신 그라파나 내장 `TestData DB` 엔진을 활용하여 실시간 동적 그래프를 구현했습니다.
## 🚀 1분 만에 실행 확인하기본 프로젝트는 Docker 환경에서 즉시 구동 가능하도록 패키징되어 있습니다.
```bash
# 1. 저장소 복제
git clone https://github.com
cd 리포지토리명

# 2. 그라파나 컨테이너 구동
docker-compose up -d
```

구동 후 브라우저에서 **http://localhost:3000** 으로 접속하시면 로그인 없이 즉시 대시보드를 확인할 수 있습니다.
## 💡 대시보드 설계 포인트* **메트릭 아키텍처**: 현업에서 발생했던 인프라 병목 현상을 모니터링하기 위해 CPU/Memory 및 네트워크 트래픽 변화율을 한눈에 보게 설계했습니다.* **사용자 경험(UX)**: 대형 모니터 관제(Wall Dashboard) 환경을 고려하여 시인성이 높은 색상 배치와 경고(Alerting) 임계치 시각화를 적용했습니다.

------------------------------
혹시 4단계 테스트 과정에서 도커(Docker) 설치나 명령어 실행 중 막히는 부분이 있거나, 수정한 대시보드에서 특정 그래프가 여전히 깨져서 출력되는 현상이 있다면 언제든 말씀해 주세요! 쿼리 수정법을 더 보완해 드리겠습니다.

