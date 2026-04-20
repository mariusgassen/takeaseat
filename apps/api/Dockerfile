FROM golang:1.26-alpine AS builder
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
RUN go build -o api .

FROM alpine:3.23
WORKDIR /app
COPY --from=builder /app/api .
EXPOSE 8000
CMD ["./api"]
