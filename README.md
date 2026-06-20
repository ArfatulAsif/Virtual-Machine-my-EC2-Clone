# Build a Lightweight Ubuntu VM and another is using DigitalOcean (requires 4 dollar/month)


<div align="center">

[![virtual-machine](https://img.shields.io/badge/Virtual%20Machine-Enabled-blue?logo=virtualbox&logoColor=white)](https://www.virtualbox.org/)
[![aws-ec2-clone](https://img.shields.io/badge/AWS%20EC2-g5.xlarge-FF9900?logo=amazonaws&logoColor=white)](https://aws.amazon.com/ec2/)

</div>




[![VM on Mac](https://img.shields.io/badge/AWS%20EC2-g5.xlarge-FF9900?logo=amazonaws&logoColor=white)](https://aws.amazon.com/ec2/)

## Run a Lightweight Ubuntu VM on Your Mac and Control It over SSH

A simple guide to creating a small virtual machine on macOS using **Multipass**, accessing it locally, and connecting to it over SSH from another computer on the same network.

---

## What you'll end up with

- A lightweight Ubuntu VM running on your Mac (1 CPU, 1 GB RAM, 5 GB disk).
- A shell into that VM from your Mac.
- SSH access into the VM from another PC on the same Wi-Fi/LAN. 
- When showing `RUMI sir`, make sure you connect both on **SUST WIFI**

---

## Prerequisites

- A Mac (Apple Silicon or Intel).
- [Homebrew](https://brew.sh) installed (optional but easiest).
- Another PC on the **same network** as the Mac (for the remote-SSH part).

---

## Step 1 — Install Multipass

Using Homebrew:

```bash
brew install --cask multipass
```

(No Homebrew? Download the installer from https://multipass.run instead.)

Verify it installed:

```bash
multipass version
```

---

## Step 2 — Create the VM

```bash
multipass launch --name vm1 --cpus 1 --memory 1G --disk 5G
```

This downloads Ubuntu (first time only) and boots a VM named `vm1`.

> Notes: 5 GB is about the smallest practical disk for the default image. Memory can go as low as `512M`, but `1G` is the comfortable minimum once you install software. CPU, memory, and disk are fixed at creation — to change them, delete and recreate.

---

## Step 3 — Control the VM locally

Open a shell directly inside the VM:

```bash
multipass shell vm1
```

You're now inside Ubuntu. Run any Linux commands you like. Type `exit` to leave the shell — the VM keeps running in the background.

---

## Step 4 — Access the VM over SSH from another PC

By default the VM is on a private internal network. To reach it from another computer, give it a real address on your LAN using **bridged networking**.

### 4a. Enable bridged networking

Find your Mac's network interface (Wi-Fi is usually `en0`):

```bash
multipass networks
```

Set it as the bridge, then recreate the VM in bridged mode:

```bash
multipass set local.bridged-network=en0
multipass delete vm1 && multipass purge
multipass launch --name vm1 --bridged --cpus 1 --memory 1G --disk 5G
```

### 4b. Set up a login

**Option A — password login (simplest):**

```bash
multipass exec vm1 -- sudo bash -c 'echo "ubuntu:MyPass123" | chpasswd'
multipass exec vm1 -- sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
multipass exec vm1 -- sudo systemctl restart ssh
```

**Option B — SSH key login (more secure):**
On the other PC, get its public key (`cat ~/.ssh/id_ed25519.pub`), then on the Mac:

```bash
multipass exec vm1 -- bash -c "echo 'PASTE_OTHER_PC_PUBLIC_KEY' >> /home/ubuntu/.ssh/authorized_keys"
```

### 4c. Find the VM's LAN IP

```bash
multipass info vm1
```

Look for the bridged IPv4 address, e.g. `192.168.1.42`.

### 4d. Connect from the other PC

```bash
ssh ubuntu@192.168.1.42
```

Enter the password (Option A) or connect key-only (Option B). You are now controlling the Mac-hosted VM from the other computer.

---

## Managing the VM

| Action | Command |
|---|---|
| List all VMs | `multipass list` |
| VM details / IP | `multipass info vm1` |
| Stop the VM | `multipass stop vm1` |
| Start the VM | `multipass start vm1` |
| Open a local shell | `multipass shell vm1` |
| Delete the VM | `multipass delete vm1 && multipass purge` |

---

## Troubleshooting

- **Can't SSH from the other PC:** confirm both machines are on the same Wi-Fi/LAN. Some routers have "client isolation" / "AP isolation" enabled — disable it or use a different network.
- **`disk too small` error on launch:** raise `--disk` to `5G` or more.
- **VM feels sluggish during installs:** give it more memory (`--memory 2G`) by recreating it.
- **Wrong interface name:** run `multipass networks` again and use the interface that shows your Wi-Fi or Ethernet connection.

---

## Quick reference (full flow)

```bash
# install
brew install --cask multipass

# bridged networking
multipass networks
multipass set local.bridged-network=en0

# create
multipass launch --name vm1 --bridged --cpus 1 --memory 1G --disk 5G

# enable password SSH
multipass exec vm1 -- sudo bash -c 'echo "ubuntu:MyPass123" | chpasswd'
multipass exec vm1 -- sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
multipass exec vm1 -- sudo systemctl restart ssh

# get IP, then connect from the other PC
multipass info vm1
# ssh ubuntu@<VM_IP>
```



---
---
---
---


<br>


[![VM using DigitalOcan](https://img.shields.io/badge/AWS%20EC2-g5.xlarge-FF9900?logo=amazonaws&logoColor=white)](https://aws.amazon.com/ec2/)
# Run a VM on DigitalOcean and Control It over SSH

A simple guide to creating a cloud virtual machine (a "Droplet") on DigitalOcean and connecting to it over SSH from any computer. 



This costs me around `4.00/month`.
Using a very basic setup of 512 mb ram, also `devstack` was extremely show to run

---

## What you'll end up with

- An Ubuntu VM running in DigitalOcean's cloud, with a **public IP address**.
- SSH access into it from **any computer, on any network** (not just your local LAN).

> Key difference from a local VM: because a Droplet has a public IP, you can SSH into it from anywhere in the world — no same-network requirement.

---

## Prerequisites

- A DigitalOcean account (signed in).
- A terminal on your computer (Terminal on macOS, PowerShell or Git Bash on Windows).

---

## Step 1 — Create an SSH key (skip if you already have one)

On your computer:

```bash
ssh-keygen -t ed25519 -C "my-droplet"
```

Press Enter through all prompts (default location, empty passphrase is fine). Then print the **public** key:

```bash
cat ~/.ssh/id_ed25519.pub
```

Copy the entire line it prints — it starts with `ssh-ed25519` and ends with your comment. That line is your public key.

> The matching private key (`id_ed25519`, no `.pub`) stays on your computer. Never share it.

---

## Step 2 — Add the SSH key to DigitalOcean

1. In the DigitalOcean console, go to **Settings → Security → SSH Keys**.
2. Click **Add SSH Key**.
3. Paste the `ssh-ed25519 ...` line into the **key content** box.
4. Give it a name (e.g. `laptop`) and save.

---

## Step 3 — Create the Droplet

1. Click **Create → Droplets**.
2. **Region:** choose the one closest to you (e.g. Bangalore for South Asia).
3. **Image:** Ubuntu → 24.04 (LTS) x64.
4. **Size:** Basic → Regular. For a basic SSH box, the smallest plan is fine; pick a larger size only if you'll run heavier workloads.
5. **Authentication:** select **SSH Key** and tick the key you added.
6. **Hostname:** e.g. `my-droplet`.
7. Click **Create Droplet**.

Wait until the Droplet shows a green **Active** status.

---

## Step 4 — Get the public IP

On the Droplet's page, copy its **public IPv4 address** (e.g. `203.0.113.45`).

---

## Step 5 — Connect over SSH

From any computer:

```bash
ssh root@203.0.113.45
```

The first time, type `yes` at the authenticity prompt. Because you used key authentication, it logs you straight in as `root` — no password. You're now controlling the cloud VM.

If your private key isn't the default name, point to it explicitly:

```bash
ssh -i ~/.ssh/id_ed25519 root@203.0.113.45
```

---

## Managing the Droplet

| Action | Where |
|---|---|
| Power on / off | Droplet page → **Power** |
| Take a snapshot (save its state) | Droplet page → **Snapshots** |
| Resize | Droplet page → **Resize** (power off first) |
| Destroy (delete permanently) | Droplet page → **Destroy** |

---

## Cost notes (important)

- **A powered-off Droplet still bills you** — DigitalOcean reserves its resources either way. To actually stop paying, take a **snapshot** (small per-GB monthly fee) and then **destroy** the Droplet. Recreate it from the snapshot when you need it again.
- Billing is **per-second with a monthly cap**, so you never pay more than the flat monthly rate.
- Destroy Droplets you're not using to avoid quietly draining any free credit.

---

## Troubleshooting

- **`Permission denied (publickey)`:** usually the wrong key (use `-i` to specify it), wrong username (it's `root`), or loose key permissions — fix with `chmod 600 ~/.ssh/id_ed25519`.
- **Connection times out:** the Droplet may still be booting, or a firewall is blocking port 22. Confirm the Droplet is Active and that any DigitalOcean Cloud Firewall allows inbound TCP 22.
- **Forgot to add an SSH key at creation:** recreate the Droplet and choose **Password** authentication instead; DigitalOcean emails/sets a root password you log in with.

---

## Quick reference (full flow)

```bash
# 1. create a key (once)
ssh-keygen -t ed25519 -C "my-droplet"
cat ~/.ssh/id_ed25519.pub      # paste this into DigitalOcean → SSH Keys

# 2. create the Droplet in the web console (Ubuntu 24.04, SSH key auth)

# 3. connect from anywhere
ssh root@<DROPLET_PUBLIC_IP>
```