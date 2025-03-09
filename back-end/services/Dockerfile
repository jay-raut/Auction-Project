FROM node

WORKDIR /app

COPY auction/package.json ./auction/
COPY orders/package.json ./orders/
COPY notification/package.json ./notification/
COPY authentication/package.json ./authentication/
COPY jobs/package.json ./jobs/



RUN npm install -g env-cmd


WORKDIR /app/auction
RUN npm install

WORKDIR /app/orders
RUN npm install

WORKDIR /app/notification
RUN npm install

WORKDIR /app/authentication
RUN npm install

WORKDIR /app/jobs
RUN npm install

WORKDIR /app
COPY . .

COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 8081 4000 9000 6000

CMD ["/app/start.sh"]
