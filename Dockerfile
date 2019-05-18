#image for node 
FROM node:8.11.1

#create a working directory
WORKDIR usr/src/app

#Install app dependencies.
#A wildcard is used to ensure both packages.json AND package-lock.json are copied
#where it is available

COPY package.json .

RUN npm install

COPY . .

EXPOSE 9000

CMD ["node", "start.js"]

