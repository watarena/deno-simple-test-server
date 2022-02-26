FROM denoland/deno:1.19.0

COPY . /tmp/simple-test-server
RUN deno compile \
      -o /simple-test-server \
      --allow-net \
      --allow-read \
      --allow-write \
      --unstable \
      /tmp/simple-test-server/server.ts && \
    chmod 755 /simple-test-server

FROM scratch

WORKDIR /gen
ENV DENO_DIR=/

COPY --from=0 /lib /lib
COPY --from=0 /lib64 /lib64
COPY --from=0 /simple-test-server /simple-test-server

ENTRYPOINT [ "/simple-test-server" ]
USER 1000:1000
