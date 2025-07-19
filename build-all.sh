#!/bin/bash
set -e

echo "Building vite frontend..."
cd vite
npm install
npm run build

echo "Building next-api backend..."
cd ../next-api
npm install
npm run build

echo "Build finished. Frontend in vite/dist, backend in next-api/.next"
