FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json pnpm-lock.yaml* ./

RUN pnpm install

COPY . .

RUN pnpm exec prisma generate

RUN pnpm exec prisma migrate

EXPOSE 7000

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm run dev"]