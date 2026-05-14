#!/bin/bash
set -euo pipefail

export PATH="$PATH:/usr/bin:/usr/local/bin:/usr/sbin"
export DEBIAN_FRONTEND=noninteractive

APP_DIR="/opt/syncro"
REPO_URL="https://github.com/tejesh-ip/syncro.git"
BRANCH="main"

echo "Starting VM setup..."

dpkg --configure -a || true

apt-get update
apt-get install -y ca-certificates curl gnupg git lsb-release

install -m 0755 -d /etc/apt/keyrings

if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
  curl -fsSL https://download.docker.com/linux/debian/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
fi

chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl restart docker

if [ -d "$APP_DIR/.git" ]; then
  echo "Repo exists, pulling latest..."
  cd "$APP_DIR"
  git fetch origin
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
else
  echo "Cloning repo..."
  rm -rf "$APP_DIR"
  git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "Looking for compose file..."
COMPOSE_FILE=""
for f in docker-compose.yml docker-compose.yaml compose.yml compose.yaml; do
  if [ -f "$APP_DIR/$f" ]; then
    COMPOSE_FILE="$APP_DIR/$f"
    break
  fi
done

if [ -z "$COMPOSE_FILE" ]; then
  echo "No docker compose file found in $APP_DIR"
  exit 1
fi

echo "Using compose file: $COMPOSE_FILE"

echo "Stopping old stack if present..."
docker compose -f "$COMPOSE_FILE" down || true

echo "Starting stack..."
docker compose -f "$COMPOSE_FILE" up --build -d

echo "Docker containers:"
docker ps

echo "Startup complete."