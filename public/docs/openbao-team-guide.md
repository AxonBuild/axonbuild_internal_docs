# OpenBao: team quick start

We use OpenBao to store project secrets and environment variables. Access is controlled by your account’s assigned policies.

**URL:** [openbao.abruntime.com](https://openbao.abruntime.com)

## 1. Sign in

Open the URL and select **Username / Userpass** as the authentication method. If asked for the auth path, use `userpass`.

Initial accounts are `bilal`, `shamoon`, and `shaff`. Get your temporary password directly from the administrator. Use your own account and change this password after your first login.

Our login method is **userpass** in both the browser and scripts. OpenBao manages a session token internally after login; you do not need to obtain or paste a token to sign in. See the [login documentation](https://openbao.org/docs/commands/login/).

## 2. Use the command line and change your password

With the [OpenBao CLI installed](https://openbao.org/docs/install/), run the following in your terminal. Replace `bilal` with your username:

```sh
export BAO_ADDR="https://openbao.abruntime.com"
export BAO_USER="bilal"
bao login -method=userpass -no-print username="$BAO_USER"
```

Enter your password at the hidden prompt. To set a new password without putting it in shell history, run this in **Bash**:

```bash
read -r -s -p 'New password: ' BAO_NEW_PASSWORD
printf '\n'
printf '%s' "$BAO_NEW_PASSWORD" | bao write \
  "auth/userpass/users/$BAO_USER/password" password=-
unset BAO_NEW_PASSWORD
```

Use a unique password, then log in again with it. If the password change returns `permission denied`, ask the administrator to check your account’s password-change permission. The command uses the [userpass password endpoint](https://openbao.org/api-docs/auth/userpass/) and [standard-input support](https://openbao.org/docs/commands/write/).

## 3. Find your project’s secrets

Secrets follow this layout:

```text
secret/<project>/<environment>

secret/shopsimply/dev
secret/shopsimply/prod
```

In the browser:

1. Open **Secrets**, then the `secret` engine.
2. Enter your project path, for example `shopsimply/`. Keep the trailing slash to list its environments.
3. Open the environment you need and view its values, subject to your permissions.

From the CLI:

```sh
# List environment names
bao kv list -mount=secret shopsimply/

# Read development secrets
bao kv get -mount=secret shopsimply/dev
```

These commands [list names](https://openbao.org/docs/commands/kv/list/) and [read values](https://openbao.org/docs/commands/kv/get/). Seeing an environment name does not necessarily grant access to its values.

## 4. Load secrets in your Python project

Copy the complete `bao_env_load.py` and optional `example_app.py` from the expandable sections below into your project. Install the dependencies below and place the three-setting `.env` in the directory where you run your app.

```sh
python3 -m pip install hvac python-dotenv
```

Create a local `.env` using the template below. These are the only three settings needed for the Python project integration:

<details>
<summary>.env — copy this template and set your credentials</summary>

```dotenv
ENV=dev
BAO_USER=bilal
BAO_PASS=<your-new-password>
```

</details>

Call the helper once at startup, before importing or initializing application settings:

```python
import os
from bao_env_load import load_env

load_env(project="shopsimply")

# Use the actual key names stored in your project's OpenBao secret.
database_url = os.environ["DATABASE_URL"]
api_key = os.environ["API_KEY"]
```

The helper reads `ENV`, `BAO_USER`, and `BAO_PASS`, signs in with the [HVAC userpass client](https://python-hvac.org/en/stable/usage/auth_methods/userpass.html), and fetches `secret/shopsimply/<ENV>` using the [KV v2 API](https://python-hvac.org/en/stable/source/hvac_api_secrets_engines.html#hvac.api.secrets_engines.KvV2.read_secret_version). It adds the fetched keys to `os.environ`; existing environment values take precedence. It does not write a secrets file to disk.

Set `ENV` to `dev`, `staging`, or `prod` as appropriate for an existing environment you can access. The project name is passed in code. The server URL is already configured in the helper, and HVAC handles the session internally, so no token or server-address variable is needed.

<details>
<summary>bao_env_load.py — complete HVAC environment loader</summary>

```python
"""Load project secrets into os.environ using OpenBao userpass authentication.

Install: python3 -m pip install hvac python-dotenv
Required environment variables (or local .env): ENV, BAO_USER, BAO_PASS.
Usage: load_env(project="shopsimply") before reading application settings.
"""

import os
from pathlib import Path
from typing import Optional

import hvac
from dotenv import load_dotenv

BAO_ADDR = "https://openbao.abruntime.com"


def load_env(project: str, env: Optional[str] = None) -> None:
    """Fetch secret/<project>/<env>; preserve existing environment values.

    Reads .env from the current working directory. An explicit env argument
    overrides ENV. Authentication and read errors propagate to the caller so
    the application does not silently start with missing secrets.
    """
    load_dotenv(dotenv_path=Path.cwd() / ".env")
    environment = env if env is not None else os.environ.get("ENV")
    username = os.environ.get("BAO_USER")
    password = os.environ.get("BAO_PASS")
    missing = [
        name
        for name, value in (
            ("ENV", environment), ("BAO_USER", username), ("BAO_PASS", password)
        )
        if not value
    ]
    if missing:
        raise ValueError("Set these in .env or the environment: " + ", ".join(missing))
    if not project or not project.strip():
        raise ValueError("Pass your OpenBao project name, e.g. 'shopsimply'.")

    client = hvac.Client(url=BAO_ADDR)
    client.auth.userpass.login(username=username, password=password)
    data = client.secrets.kv.v2.read_secret_version(
        path=f"{project}/{environment}",
        mount_point="secret",
        raise_on_deleted_version=True,
    )["data"]["data"]
    for k, v in data.items():
        os.environ.setdefault(k, str(v))
```

</details>

<details>
<summary>example_app.py — runnable project integration example</summary>

```python
"""Run from your project directory after creating .env from the guide's template."""

import os

from bao_env_load import load_env


def main() -> None:
    # Change this to your project's path in OpenBao.
    # ENV, BAO_USER, and BAO_PASS are read from .env or the process environment.
    load_env(project="shopsimply")

    # Your fetched secrets are now available as normal environment variables.
    # Use the actual key names stored in your project's secret:
    # database_url = os.environ["DATABASE_URL"]
    # api_key = os.environ["API_KEY"]
    # Initialize your app/database client here, after load_env().
    print(f"Configuration loaded for {os.environ['ENV']}.")


if __name__ == "__main__":
    main()
```

</details>

To try the sample, save both Python files together and run:

```sh
python3 example_app.py
```

The sample reports the selected environment without printing secrets. Missing configuration, failed login, or denied secret access stops startup with an error. Secrets are fetched at startup; restart the app to load updated values into a fresh process.

## 5. Upload an environment file, if you have write access

Expand `push_env.py` below and copy the code into a file with that name in your own working folder. It is standalone; you do not need the rest of this repository or the `bao` CLI. Use the dependencies and `.env` configuration from section 4.

Keep the application's secrets in a separate file, such as `envs/shopsimply/dev.env`, then upload it:

```sh
python3 push_env.py shopsimply dev envs/shopsimply/dev.env
```

This signs in using userpass and writes to `secret/shopsimply/dev`. It replaces the complete set of keys at that path with the file’s contents, creating a new version. Include every key you intend to keep, and confirm the target environment before uploading.

The uploader takes its target environment from the command argument (`dev` above); `ENV` is used by the project loader above. Upload the application's secrets file, not the `.env` holding your OpenBao login.

<details>
<summary>push_env.py — complete standalone uploader</summary>

```python
#!/usr/bin/env python3
"""
Push .env files into OpenBao.

    pip install hvac python-dotenv

    push_env.py myapp dev .env                 one file -> secret/myapp/dev
    push_env.py --dir envs/                    bulk: envs/<project>/<env>.env -> secret/<project>/<env>

Reads BAO_USER / BAO_PASS from .env (or the environment) and logs in via userpass.
Needs write access.
Each push replaces the key set in a new version. Older versions are subject
to the server's retention and deletion settings.
"""

import argparse
import os
import sys
from pathlib import Path

import hvac
from dotenv import dotenv_values, load_dotenv
from hvac.exceptions import VaultError

BAO_ADDR = "https://openbao.abruntime.com"
USER_VAR = "BAO_USER"
PASS_VAR = "BAO_PASS"


def connect() -> hvac.Client:
    load_dotenv()
    user, password = os.environ.get(USER_VAR), os.environ.get(PASS_VAR)
    if not (user and password):
        sys.exit(f"Set {USER_VAR} and {PASS_VAR} in .env or the environment.")
    c = hvac.Client(url=BAO_ADDR)
    try:
        c.auth.userpass.login(username=user, password=password)
    except VaultError as e:
        sys.exit(f"Login failed for {user}: {e}")
    if not c.is_authenticated():
        sys.exit(f"Login failed for {user}.")
    return c


def push(client: hvac.Client, project: str, env: str, file: Path) -> None:
    data = {k: v for k, v in dotenv_values(file).items() if v is not None}
    if not data:
        print(f"skip {file}: empty", file=sys.stderr)
        return
    client.secrets.kv.v2.create_or_update_secret(path=f"{project}/{env}", secret=data, mount_point="secret")
    print(f"secret/{project}/{env}  <- {file}  ({len(data)} keys)")


def main() -> None:
    p = argparse.ArgumentParser(description="Push .env files into OpenBao")
    p.add_argument("project", nargs="?")
    p.add_argument("env", nargs="?")
    p.add_argument("file", nargs="?", type=Path)
    p.add_argument("--dir", type=Path, help="bulk: directory laid out as <project>/<env>.env")
    a = p.parse_args()

    client = connect()

    if a.dir:
        files = sorted(a.dir.glob("*/*.env"))
        if not files:
            sys.exit(f"No <project>/<env>.env files under {a.dir}")
        for f in files:
            push(client, f.parent.name, f.stem, f)
    elif a.project and a.env and a.file:
        push(client, a.project, a.env, a.file)
    else:
        p.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
```

</details>

Keep credentials and secret-bearing `.env` files out of Git, shared docs, and chat. If access is denied, check the project/environment path and ask the administrator to review your permissions.
