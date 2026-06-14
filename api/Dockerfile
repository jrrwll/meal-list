# Build context: parent dir
# Builds meal_list for x86_64-unknown-linux-musl on Apple Silicon via emulation

FROM --platform=linux/amd64 rust:1.95-alpine AS builder

RUN apk add --no-cache musl-dev gcc pkgconfig sqlite-dev sqlite-static

WORKDIR /build

# USTC crates mirror
RUN mkdir -p /root/.cargo && cat > /root/.cargo/config.toml <<'EOF'
[source.crates-io]
replace-with = 'ustc'

[source.ustc]
registry = "sparse+https://mirrors.ustc.edu.cn/crates.io-index/"

[registries.ustc]
index = "sparse+https://mirrors.ustc.edu.cn/crates.io-index/"
EOF

# Copy rexl workspace (meal-list/api depends on ../../rexl/rexl)
COPY rexl/Cargo.toml rexl/Cargo.lock rexl/
COPY rexl/rexl rexl/rexl
COPY rexl/rexl-macros rexl/rexl-macros
COPY rexl/rexl-matrix rexl/rexl-matrix

# Copy meal-list api project
COPY meal-list/api/Cargo.toml meal-list/api/Cargo.lock meal-list/api/
COPY meal-list/api/src meal-list/api/src
COPY meal-list/api/rustfmt.toml meal-list/api/

# Build dependencies only (cache layer)
RUN cargo build --release --manifest-path meal-list/api/Cargo.toml --target x86_64-unknown-linux-musl \
  && rm meal-list/api/target/x86_64-unknown-linux-musl/release/deps/meal_list*

# Touch src to invalidate cache and build the actual binary
RUN touch meal-list/api/src/main.rs \
  && cargo build --release --manifest-path meal-list/api/Cargo.toml --target x86_64-unknown-linux-musl
