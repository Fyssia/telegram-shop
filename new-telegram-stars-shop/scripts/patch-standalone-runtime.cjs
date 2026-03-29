#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const projectDir = path.resolve(__dirname, "..");
const standaloneDir = path.join(projectDir, ".next", "standalone");

function log(message) {
  console.log(`[patch-standalone-runtime] ${message}`);
}

function ensureExists(targetPath, description) {
  if (!fs.existsSync(targetPath)) {
    throw new Error(`${description} not found: ${targetPath}`);
  }
}

function findStandaloneAppDir(rootDir) {
  const queue = [rootDir];

  while (queue.length > 0) {
    const currentDir = queue.shift();
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    const hasServerEntrypoint = entries.some(
      (entry) => entry.isFile() && entry.name === "server.js",
    );
    const hasNextRuntime = fs.existsSync(
      path.join(currentDir, "node_modules", "next"),
    );

    if (hasServerEntrypoint && hasNextRuntime) {
      return currentDir;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === "node_modules") {
        continue;
      }

      queue.push(path.join(currentDir, entry.name));
    }
  }

  return null;
}

function replaceExact(filePath, from, to) {
  const current = fs.readFileSync(filePath, "utf8");

  if (current.includes(to)) {
    return false;
  }

  if (!current.includes(from)) {
    throw new Error(`Patch pattern not found in ${filePath}`);
  }

  fs.writeFileSync(filePath, current.replace(from, to));
  return true;
}

function syncDirectory(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    log(`skip missing directory ${sourceDir}`);
    return;
  }

  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });
}

function patchStandaloneRuntime(appDir) {
  const nextServerPath = path.join(
    appDir,
    "node_modules",
    "next",
    "dist",
    "server",
    "next-server.js",
  );
  const resolveRoutesPath = path.join(
    appDir,
    "node_modules",
    "next",
    "dist",
    "server",
    "lib",
    "router-utils",
    "resolve-routes.js",
  );

  ensureExists(nextServerPath, "standalone next-server runtime");
  ensureExists(resolveRoutesPath, "standalone resolve-routes runtime");

  replaceExact(
    nextServerPath,
    "        const initUrl = this.fetchHostname && this.port ? `${protocol}://${this.fetchHostname}:${this.port}${req.url}` : this.nextConfig.experimental.trustHostHeader ? `https://${req.headers.host || 'localhost'}${req.url}` : req.url;",
    [
      "        const forwardedHostHeader = req.headers['x-forwarded-host'];",
      "        const forwardedHost = Array.isArray(forwardedHostHeader) ? forwardedHostHeader[0] : forwardedHostHeader;",
      "        const requestHost = typeof forwardedHost === 'string' && forwardedHost ? forwardedHost.split(',', 1)[0].trim() : req.headers.host;",
      "        const initUrl = requestHost ? `${protocol}://${requestHost}${req.url}` : this.fetchHostname && this.port ? `${protocol}://${this.fetchHostname}:${this.port}${req.url}` : this.nextConfig.experimental.trustHostHeader ? `https://${req.headers.host || 'localhost'}${req.url}` : req.url;",
    ].join("\n"),
  );

  replaceExact(
    resolveRoutesPath,
    "        const initUrl = config.experimental.trustHostHeader ? `https://${req.headers.host || 'localhost'}${req.url}` : opts.port ? `${protocol}://${(0, _formathostname.formatHostname)(opts.hostname || 'localhost')}:${opts.port}${req.url}` : req.url || '';",
    [
      "        const forwardedHostHeader = req.headers['x-forwarded-host'];",
      "        const forwardedHost = Array.isArray(forwardedHostHeader) ? forwardedHostHeader[0] : forwardedHostHeader;",
      "        const requestHost = typeof forwardedHost === 'string' && forwardedHost ? forwardedHost.split(',', 1)[0].trim() : req.headers.host;",
      "        const initUrl = requestHost ? `${protocol}://${requestHost}${req.url}` : config.experimental.trustHostHeader ? `https://${req.headers.host || 'localhost'}${req.url}` : opts.port ? `${protocol}://${(0, _formathostname.formatHostname)(opts.hostname || 'localhost')}:${opts.port}${req.url}` : req.url || '';",
    ].join("\n"),
  );

  replaceExact(
    resolveRoutesPath,
    "                            resHeaders['x-middleware-rewrite'] = destination;",
    "                            delete resHeaders['x-middleware-rewrite'];",
  );
}

function main() {
  ensureExists(standaloneDir, "standalone build output");

  const standaloneAppDir = findStandaloneAppDir(standaloneDir);
  if (!standaloneAppDir) {
    throw new Error(`Unable to locate standalone app root in ${standaloneDir}`);
  }

  patchStandaloneRuntime(standaloneAppDir);

  syncDirectory(
    path.join(projectDir, "public"),
    path.join(standaloneAppDir, "public"),
  );
  syncDirectory(
    path.join(projectDir, ".next", "static"),
    path.join(standaloneAppDir, ".next", "static"),
  );

  log(`patched runtime in ${standaloneAppDir}`);
}

main();
