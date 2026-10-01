#!/bin/bash
set -x
dnf install -y docker git
systemctl enable --now docker
git clone ${repo_url} /opt/app
cd /opt/app/app
docker build -t reservas-api .
docker run -d --name reservas-api --restart unless-stopped -p ${app_port}:${app_port} \
  -e PORT=${app_port} \
  -e DB_HOST=${db_host} \
  -e DB_PORT=5432 \
  -e DB_NAME=${db_name} \
  -e DB_USER=${db_user} \
  -e DB_PASSWORD=${db_password} \
  reservas-api
