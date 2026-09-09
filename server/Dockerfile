# EstateHub API
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install -g npm@11.6.0
RUN npm install --omit=dev

COPY . .

EXPOSE 8080
CMD ["npm", "start"]
