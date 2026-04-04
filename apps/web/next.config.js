const fs = require('fs');
const path = require('path');
const { i18n } = require('./next-i18next.config');

// Monorepo (npm workspaces): React may be hoisted to the repo root while `styled-jsx`
// resolves `react` there. Force one physical copy for bundler + SSR or prerender fails
// with "Cannot read properties of null (reading 'useContext')".
const monorepoRoot = path.resolve(__dirname, '../..');
const rootModules = path.join(monorepoRoot, 'node_modules');
const localModules = path.join(__dirname, 'node_modules');

function resolvePkg(name) {
  const local = path.join(localModules, name);
  if (fs.existsSync(local)) return local;
  return path.join(rootModules, name);
}

const reactPath = resolvePkg('react');
const reactDomPath = resolvePkg('react-dom');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1',
  },
  webpack: (config) => {
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.join(__dirname, 'node_modules'),
      rootModules,
    ];
    config.resolve.alias = {
      ...config.resolve.alias,
      react: reactPath,
      'react-dom': reactDomPath,
      'react/jsx-runtime': path.join(reactPath, 'jsx-runtime.js'),
      'react/jsx-dev-runtime': path.join(reactPath, 'jsx-dev-runtime.js'),
    };
    return config;
  },
};

module.exports = nextConfig;
