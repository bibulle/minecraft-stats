FROM node as BUILDER

RUN apt-get update && apt-get install -y \
    git \
    && rm -fr /var/lib/pat/lists/*

WORKDIR /tmp/app
RUN git clone --progress --verbose https://github.com/bibulle/minecraft-stats.git .

RUN npm ci --only=production

FROM node

WORKDIR /usr/src/app

COPY --from=BUILDER /tmp/app/node_modules/ node_modules
COPY --from=BUILDER /tmp/app/src/ src

VOLUME ["/data"]
EXPOSE 3000

CMD [ "node", "--max-old-space-size=2048", "src/app.js" ]