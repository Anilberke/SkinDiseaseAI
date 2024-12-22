FROM node:14

WORKDIR /app/client

COPY . /app/client

WORKDIR /app/client

RUN npm install -g http-server

EXPOSE 8080

CMD ["http-server", "--port", "8080"]