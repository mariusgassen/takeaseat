FROM golang:1.26-alpine AS builder
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
RUN go build -o bin/api ./...

FROM alpine:3.21
WORKDIR /app
COPY --from=builder /app/bin/api .
EXPOSE 8000
CMD ["./api"]
