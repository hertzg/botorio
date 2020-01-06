FROM node:13

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --no-cache

ENV DISCORD_TOKEN="dd" \
 DIGITAL_OCEAN_TOKEN="" \
 DIGITAL_OCEAN_DROPLET_ID="" \
 FACTORIO_RCON_PORT="27018" \
 FACTORIO_RCON_HOST="127.0.0.1" \
 FACTORIO_RCON_PASSWORD="sOm3S3ri()us3!ySe(ret*P@\$\$w0rd" \
 FACTORIO_SSH_HOST="127.0.0.1" \
 FACTORIO_SSH_PORT="22" \
 FACTORIO_SSH_USER="user" \
 FACTORIO_SSH_IDENTITY="~/.ssh/id_rsa"

COPY . .

ENTRYPOINT 'yarn' 'run' 'start:ts'
