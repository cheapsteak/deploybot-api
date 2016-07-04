FROM mhart/alpine-node

COPY package.json /src/

RUN cd /src; npm install --production

COPY dist /src

EXPOSE 5000
