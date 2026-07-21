FROM node:22-alpine AS client-build
WORKDIR /build/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:22-alpine AS server-dependencies
WORKDIR /build/server
COPY server/package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine
ENV NODE_ENV=production PORT=5000 STATIC_DIR=/opt/mikenium/public
RUN apk add --no-cache tini
WORKDIR /opt/mikenium/server
COPY --from=server-dependencies /build/server/node_modules ./node_modules
COPY server/ ./
COPY database/ /opt/mikenium/database/
COPY --from=client-build /build/client/dist/ /opt/mikenium/public/
RUN mkdir -p uploads backups && chown -R node:node /opt/mikenium
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:5000/api/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
ENTRYPOINT ["/sbin/tini","--"]
CMD ["sh","-c","node scripts/init-db.js && exec node src.js"]
