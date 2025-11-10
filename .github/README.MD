# DACN

## db setup

### bật fzf

1. install extension (init):

    ```bash
    pnpm prisma migrate dev --create-only --name init
    ```

2. mở file `migration.sql` trong `prisma/migrations/`, sửa như bên dưới:

    ```sql
    -- enable pg_trgm(thêm dòng này vào đầu file nha)
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    ```

3. apply migration:

    ```bash
    pnpm prisma migrate reset
    ```

4. Tạo GIN index:

    ```sql
    -- Tạo index cho roadmap
    CREATE INDEX IF NOT EXISTS idx_roadmap_name_gin ON roadmap USING gin (name gin_trgm_ops);

    -- Tạo index cho group
    CREATE INDEX IF NOT EXISTS idx_group_name_gin ON "group" USING gin (name gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_group_description_gin ON "group" USING gin (description gin_trgm_ops);

    -- Tạo index cho topic
    CREATE INDEX IF NOT EXISTS idx_topic_name_gin ON topic USING gin (name gin_trgm_ops);
    ```

5. Ví dụ:

    ```typescript
    // Tìm kiếm roadmap
    const roadmapResults = await prisma.$queryRaw`
      SELECT *, similarity(name, ${term}) as sml
      FROM roadmap
      WHERE name % ${term}
      ORDER BY sml DESC
      LIMIT 10
    `;

    // Tìm kiếm group
    const groupResults = await prisma.$queryRaw`
      SELECT *, similarity(name, ${term}) as sml
      FROM "group"
      WHERE name % ${term} OR description % ${term}
      ORDER BY sml DESC
      LIMIT 10
    `;

    // Tìm kiếm topic
    const topicResults = await prisma.$queryRaw`
      SELECT *, similarity(name, ${term}) as sml
      FROM topic
      WHERE name % ${term}
      ORDER BY sml DESC
      LIMIT 10
    `;
    ```

## deploy

```bash
curl -fsSL https://get.docker.com | sh
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```
