FROM node:8.11.4
WORKDIR /usr/src/app

COPY . .

RUN npm install

RUN npm install nodemon -g
RUN npm uninstall truffle
RUN npm install truffle@5.0.5
RUN npm install
RUN npm run deploy:contracts:__MYENV__
CMD npm run start-__MYENV__