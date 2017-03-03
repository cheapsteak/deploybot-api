FROM mhart/alpine-node

RUN apk add --update curl && \
    rm -rf /var/cache/apk/*

COPY package.json /src/

RUN cd /src; npm install --production

COPY dist /src

EXPOSE 5000
