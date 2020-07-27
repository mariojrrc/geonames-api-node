FROM node:12

WORKDIR /var/www/html

COPY package*.json ./

RUN npm install

# If you are building your code for production
# RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD [ "node", "index.js" ]
