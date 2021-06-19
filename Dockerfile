FROM denoland/deno:latest

COPY . /tmp/simple-test-server
RUN useradd \
      -MU \
      -s /usr/sbin/nologin \
      -d /home/simple-test-server \
      simple-test-server \
    && \
    mkdir /empty && \
    cd /tmp/simple-test-server && \
    deno compile \
      -o /simple-test-server \
      --allow-net \
      --unstable \
      index.ts

FROM scratch

COPY --from=0 /lib /lib
COPY --from=0 /lib64 /lib64
COPY --from=0 /simple-test-server /simple-test-server
COPY --from=0 /etc/passwd /etc/passwd
COPY --from=0 /empty /home/simple-test-server/.cache/deno/gen

ENTRYPOINT [ "/simple-test-server" ]
