FROM node

WORKDIR /usr/src/app

COPY package*.json ./
COPY src .

RUN npm install

VOLUME ["/data"]

EXPOSE 3000
CMD [ "node", "--max-old-space-size=2048", "app.js" ]