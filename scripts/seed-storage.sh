#!/usr/bin/env bash
set -e
cd /mnt/c/Users/gialo/Desktop/APP/Tailor

KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

upload() {
  local path="$1"
  local file="$2"
  echo "Uploading $file -> $path"
  curl -s -f -X POST "http://127.0.0.1:54321/storage/v1/object/listing-photos/$path" \
    -H "Authorization: Bearer $KEY" \
    -H "apiKey: $KEY" \
    -H "Content-Type: image/webp" \
    --data-binary "@$file" || \
  curl -s -f -X PUT "http://127.0.0.1:54321/storage/v1/object/listing-photos/$path" \
    -H "Authorization: Bearer $KEY" \
    -H "apiKey: $KEY" \
    -H "Content-Type: image/webp" \
    --data-binary "@$file"
  echo ""
}

upload "c1000000-0000-0000-0000-000000000001/luna-1.webp" "public/images/cane-01.webp"
upload "c1000000-0000-0000-0000-000000000002/thor-1.webp" "public/images/cane-02.webp"
upload "c1000000-0000-0000-0000-000000000003/mia-1.webp" "public/images/gatto-01.webp"
upload "c1000000-0000-0000-0000-000000000004/rocky-1.webp" "public/images/cane-03.webp"
upload "c1000000-0000-0000-0000-000000000005/stella-1.webp" "public/images/cane-04.webp"
upload "c1000000-0000-0000-0000-000000000006/oliver-1.webp" "public/images/gatto-02.webp"
upload "c1000000-0000-0000-0000-000000000007/briciola-1.webp" "public/images/cane-05.webp"
upload "c1000000-0000-0000-0000-000000000008/cesare-1.webp" "public/images/cane-06.webp"

echo "All photos uploaded successfully!"
