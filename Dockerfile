FROM nginx:alpine-slim

# Upgrade existing packages to fix any lingering vulnerabilities in the base image
RUN apk update && apk upgrade --no-cache

# Copy the static website files
COPY . /usr/share/nginx/html

# EXPOSE 80
EXPOSE 80

# Run nginx as a non-root user for better security
USER nginx

CMD ["nginx", "-g", "daemon off;"]
