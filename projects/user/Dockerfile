FROM node:22-alpine
WORKDIR /usr/src/app

ENV CI=true \
    PNPM_HOME=/root/.local/share/pnpm \
    PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@10.21.0 --activate

COPY pnpm-lock.yaml ./
COPY package.json nx.json tsconfig.base.json ./

RUN pnpm fetch

COPY . .

RUN pnpm install -r --offline --frozen-lockfile

CMD ["node", "-v"]
