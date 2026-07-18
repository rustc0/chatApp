#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
CERT_DIR="${1:-$SCRIPT_DIR/certs}"

mkdir -p "$CERT_DIR"

openssl req -x509 -nodes -newkey rsa:2048 \
  -days 365 \
  -keyout "$CERT_DIR/selfsigned.key" \
  -out "$CERT_DIR/selfsigned.crt" \
  -subj "/CN=localhost"
