# Build Stage 
FROM node:22 AS build 

WORKDIR /frontend-server

ARG VITE_CLIENT_ID
ARG VITE_REDIRECT_URI 
ARG VITE_AUTH_URL 
ARG VITE_API_URL 

ENV VITE_CLIENT_ID=$VITE_CLIENT_ID 
ENV VITE_REDIRECT_URI=$VITE_REDIRECT_URI 
ENV VITE_AUTH_URL=$VITE_AUTH_URL 
ENV VITE_API_URL=$VITE_API_URL 

COPY package*.json ./ 

RUN npm install 

COPY . . 

RUN npm run build 

# Production Stage 
FROM nginx:alpine 

COPY --from=build /frontend-server/dist /usr/share/nginx/html 

COPY nginx.conf /etc/nginx/conf.d/default.conf 

CMD ["nginx", "-g", "daemon off;"]