/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Monorepo: tránh Turbopack chọn nhầm thư mục gốc → không resolve @tailwindcss/postcss
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
};

module.exports = nextConfig;
