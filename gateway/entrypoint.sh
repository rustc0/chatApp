#!/bin/sh

# Create the directory for the certificates if it doesn't exist
mkdir -p /etc/nginx/conf

# Check if the SSL certificate already exists
if [ ! -f /etc/nginx/conf/server.crt ]; then
    echo "SSL certificates not found. Generating self-signed certificates with OpenSSL..."
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/conf/server.key \
        -out /etc/nginx/conf/server.crt \
        -subj "/C=MA/ST=Marrakesh-Safi/L=Ben Guerir/O=My Local Dev/CN=localhost"
        
    echo "Certificates generated successfully."
else
    echo "SSL certificates already exist. Skipping generation."
fi

exec "$@"