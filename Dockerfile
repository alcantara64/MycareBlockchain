FROM node:8.11.4
WORKDIR /usr/src/app

COPY . .

RUN npm install

RUN npm install nodemon -g
RUN npm run deploy:contracts

CMD npm start --host 0.0.0.0
