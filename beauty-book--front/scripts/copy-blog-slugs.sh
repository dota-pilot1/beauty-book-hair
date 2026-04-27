#!/bin/bash
# 빌드 후 실행: DB에서 공개된 블로그 슬러그를 가져와 __placeholder__ 디렉토리를 복사
set -e

KEY="배포 가이드/hibot-d-server-key.pem"
HOST="ubuntu@13.209.195.64"
PLACEHOLDER="out/blog/__placeholder__"

if [ ! -d "$PLACEHOLDER" ]; then
  echo "❌ out/blog/__placeholder__ 없음. 빌드 먼저 실행하세요."
  exit 1
fi

SLUGS=$(ssh -i "../$KEY" -o StrictHostKeyChecking=no "$HOST" \
  "docker exec beauty-book-postgres psql -U postgres -d beauty_book -t -c \
  \"SELECT slug FROM blog_posts WHERE status='PUBLISHED';\"" \
  | tr -d ' ' | grep -v '^$')

if [ -z "$SLUGS" ]; then
  echo "ℹ️  공개된 블로그 포스트 없음"
  exit 0
fi

for SLUG in $SLUGS; do
  TARGET="out/blog/$SLUG"
  if [ ! -d "$TARGET" ]; then
    cp -r "$PLACEHOLDER" "$TARGET"
    echo "✅ 복사: $SLUG"
  else
    echo "⏭️  이미 존재: $SLUG"
  fi
done

echo "🎉 블로그 슬러그 처리 완료"
