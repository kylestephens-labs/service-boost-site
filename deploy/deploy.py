"""Run from the repo root in the protected GitHub Actions environment."""
import os
from ipaddress import ip_address
from pathlib import Path
import re
import subprocess
import tarfile
import tempfile


def main():
    host = os.environ['DEPLOY_HOST']
    user = os.environ['DEPLOY_USER']
    origins = os.environ['ALLOWED_ORIGINS']
    exempt = os.environ.get('RATE_LIMIT_EXEMPT_IP', '').strip()
    if exempt:
        exempt = str(ip_address(exempt))
    if not re.fullmatch(r'[a-zA-Z0-9.-]+', host) or not re.fullmatch(r'[a-z_][a-z0-9_-]*', user):
        raise ValueError('Invalid deployment destination')
    if '\n' in origins or '\r' in origins or not origins.startswith('https://'):
        raise ValueError('Invalid origins')
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        key = tmp / 'key'
        key.write_text(os.environ['DEPLOY_SSH_KEY'] + '\n')
        key.chmod(0o600)
        known = tmp / 'known_hosts'
        known.write_text(os.environ['DEPLOY_KNOWN_HOSTS'] + '\n')
        config = tmp / '.env'
        config.write_text('ALLOWED_ORIGINS=' + origins + '\nRATE_LIMIT_EXEMPT_IP=' + exempt + '\n')
        config.chmod(0o600)
        archive = tmp / 'backend.tar.gz'
        with tarfile.open(archive, 'w:gz') as bundle:
            for name in ['backend/app.py', 'backend/attribution.py', 'backend/gunicorn.conf.py', 'backend/requirements.txt', 'backend/Dockerfile', 'compose.yaml']:
                bundle.add(name, arcname=name)
            bundle.add(config, arcname='.env')
        options = ['-i', str(key), '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o', f'UserKnownHostsFile={known}']
        destination = f'{user}@{host}'
        subprocess.run(['scp', *options, str(archive), destination + ':/opt/serviceboost/backend.tar.gz'], check=True)
        subprocess.run(['ssh', *options, destination, 'cd /opt/serviceboost && umask 077 && tar xzf backend.tar.gz && rm backend.tar.gz && chmod 600 .env && docker compose up -d --build && curl --fail --retry 10 --retry-connrefused --retry-delay 2 http://127.0.0.1:8137/health'], check=True)


if __name__ == '__main__':
    main()
