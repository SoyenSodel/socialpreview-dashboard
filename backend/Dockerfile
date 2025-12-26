# Builder stage
FROM messense/rust-musl-cross:x86_64-musl as builder
WORKDIR /app
COPY . .
# We use SQLX_OFFLINE=true to build without connecting to a live DB
ENV SQLX_OFFLINE=true
RUN cargo build --release --target x86_64-unknown-linux-musl

# Runtime stage
FROM scratch
COPY --from=builder /app/target/x86_64-unknown-linux-musl/release/socialpreview-backend /app
COPY --from=builder /app/.env /env
# Copy static frontend files (assumed to be built and present in context)
# In real prod, you might serve frontend via Nginx, but here we support the monolithic approach
# COPY --from=frontend-builder /app/dist /frontend/dist 

ENTRYPOINT ["/app"]
