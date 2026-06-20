# floci EC2 Console

A basic, AWS EC2-style management interface built with React. It talks to a local
[floci](https://github.com/floci-io/floci) AWS emulator and lets you launch, start,
stop, reboot, and terminate EC2 instances from the browser.

The browser calls the EC2 API through the Vite dev-server proxy (`/aws` →
`http://localhost:4566`), so there are no CORS issues and no AWS account is needed.

---

## Prerequisites

- **Docker** (floci launches real containers for EC2)
- **Node.js 18+**

---

## Run commands

### 1. Start floci

floci's EC2 service launches real Docker containers, so it needs the Docker socket.

Using the included compose file:

```bash
docker compose -f floci-compose.yaml up
```

Or with plain Docker:

```bash
docker run -d --name floci \
  -p 4566:4566 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -u root \
  floci/floci:latest
```

floci is now serving the AWS API at `http://localhost:4566`.

### 2. Run the console

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually **http://localhost:5173**).

---

## Using it

- The top bar shows whether the console reached floci.
- **Launch instance:** enter a name, an AMI id, pick a type and count, then Launch.
- The instances table auto-refreshes every 5 seconds. Use the row buttons to
  Start / Stop / Reboot / Terminate.

---

## Notes

- **Credentials:** floci accepts any non-empty credentials. This app sends
  `test` / `test` and region `us-east-1` — no real AWS keys involved.
- **AMI ids:** floci maps AMI ids to Linux container images. The default in the
  form (`ami-0abc1234`) is a placeholder — if a launch fails, check the floci EC2
  service docs (https://floci.io/floci/services/) for valid image ids.
- **Dev only:** the dummy credentials and dev-server proxy make this suitable for
  local development against floci, not for talking to real AWS.

---

## Project structure

```
floci-ec2-console/
├── floci-compose.yaml    # runs floci with Docker socket (for EC2)
├── index.html
├── package.json
├── vite.config.js        # proxies /aws -> localhost:4566
└── src/
    ├── ec2.js            # EC2 client + API helpers
    ├── App.jsx           # the console UI
    ├── main.jsx
    └── styles.css
```

## Where this fits in a bigger project

Right now the React app calls floci's EC2 API directly through the proxy. If you
later add your own backend (e.g. FastAPI), point the app at that backend instead,
and have the backend call EC2 — that gives you a place for auth, your own database,
and the monitoring/forecasting features.
