# DACN

1. tải file [docker-image](https://github.com/domino4820/DACN/releases/download/latest/dacn.tar) -> copy vào VPS

2. tải docker

    ```bash
    curl -fsSL https://get.docker.com | sh
    ```

3. chạy

    ```bash
    docker load -i dacn.tar
    CONTAINER_ID=$(docker create domino4820/dacn:latest)
    docker cp $CONTAINER_ID:/app/docker-compose.yml .
    docker rm $CONTAINER_ID
    docker compose up -d
    ```
