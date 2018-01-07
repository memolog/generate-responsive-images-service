FROM tailor/docker-libvips:node-8.5

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV NODE_ENV production

COPY package.json /usr/src/app/
RUN npm install

WORKDIR /usr/src/app/server
RUN npm install

WORKDIR /usr/src/app
COPY . /usr/src/app

EXPOSE 3000

CMD [ "npm", "start" ]
