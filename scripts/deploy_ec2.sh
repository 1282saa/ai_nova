#!/usr/bin/env bash
# EC2 인스턴스에서 초기 세팅(최초 1회) + 애플리케이션 배포까지 자동화하는 스크립트입니다.
# Amazon Linux 2 / Ubuntu 22.04 LTS 기준으로 작성되었습니다.
# -------------------------------------------------------------
# 사용법
#   1) EC2 인스턴스에 ssh 접속
#   2) git clone <YOUR_REPO_URL> && cd <REPO_DIR>
#   3) chmod +x scripts/deploy_ec2.sh
#   4) ./scripts/deploy_ec2.sh
# -------------------------------------------------------------

set -euo pipefail

# ----- 설정 영역 (필요 시 수정) --------------------------------
EC2_USER=${EC2_USER:-"$(whoami)"}
PROJECT_NAME="ainova"
COMPOSE_FILE="docker-compose.prod.yml"
APP_PORT=80   # 외부 포트 (로드밸런서/직접 접속 시)
# --------------------------------------------------------------

_echo() {
  echo -e "[deploy_ec2] $1"
}

install_docker() {
  if ! command -v docker &> /dev/null; then
    _echo "Docker 미설치. 설치를 진행합니다."
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker "$EC2_USER"
    _echo "Docker 설치 완료. ($EC2_USER 그룹 추가)"
    # 새로운 그룹 반영 (현재 세션에는 적용 안 될 수 있음)
  else
    _echo "Docker 이미 설치됨."
  fi

  if ! docker compose version &> /dev/null; then
    _echo "Docker Compose V2 미설치. 설치를 진행합니다."
    DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
    mkdir -p "$DOCKER_CONFIG/cli-plugins"
    curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) \
      -o "$DOCKER_CONFIG/cli-plugins/docker-compose"
    chmod +x "$DOCKER_CONFIG/cli-plugins/docker-compose"
  fi
}

build_and_run() {
  _echo "컨테이너 이미지 빌드 및 실행"
  docker compose -f "$COMPOSE_FILE" pull || true
  docker compose -f "$COMPOSE_FILE" build --no-cache
  docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
  _echo "애플리케이션이 배포되었습니다. 포트: $APP_PORT"
}

main() {
  install_docker
  build_and_run
  _echo "로그 확인: docker compose logs -f"
}

main "$@" 