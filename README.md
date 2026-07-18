## Getting Started: docker compose up

```bash
cp .env.example .env
./gateway/gen-cert.sh
docker compose up --build
```

Health check through the gateway:

```bash
curl -k https://localhost:${GATEWAY_HTTPS_PORT:-443}/api/health
```
