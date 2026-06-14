#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
BUILD_CONTEXT="$(cd "$(dirname "$SCRIPT_DIR")/.." && pwd -P)" # cd to parent dir
IMAGE_TAG="meal-list-builder"
OUTPUT_DIR="$SCRIPT_DIR/target/x86_64-unknown-linux-musl/release"

echo "==> Building with Docker (context: $BUILD_CONTEXT)"
docker build \
  --platform linux/amd64 \
  -t "$IMAGE_TAG" \
  -f "$SCRIPT_DIR/Dockerfile" \
  "$BUILD_CONTEXT"

CONTAINER_ID=$(docker create "$IMAGE_TAG")

echo "==> Extracting binary from container..."
mkdir -p "$OUTPUT_DIR"
docker cp "$CONTAINER_ID:/build/meal-list/api/target/x86_64-unknown-linux-musl/release/meal_list" "$OUTPUT_DIR/meal_list"

docker rm "$CONTAINER_ID"

echo "==> Done: $OUTPUT_DIR/meal_list"
file "$OUTPUT_DIR/meal_list"
