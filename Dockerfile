# Use an official Node.js runtime as a parent image
FROM node:22

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to work directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application's code
COPY /dist /app/dist
COPY /prisma /app/prisma

RUN npx prisma generate

# The application listens on port 4000. Adjust if your app uses a different port.
EXPOSE 4000

# Command to run the app
CMD ["node", "dist/server.js"]
