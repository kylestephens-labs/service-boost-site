"""CI-only isolated container/volume persistence check; never contacts SMTP."""
import subprocess
import uuid


def run(*args):
    return subprocess.check_output(['docker', *args], text=True).strip()


def main():
    name = 'sb-test-' + uuid.uuid4().hex
    volume = name + '-data'
    run('volume', 'create', volume)
    try:
        previous = None
        for _ in range(2):
            run('run', '-d', '--name', name, '--network', 'none', '--read-only',
                '--tmpfs', '/tmp', '-v', volume + ':/data', 'serviceboost-attribution-test')
            try:
                token = run('exec', name, 'python', 'attribution.py', 'issue', 'SB-999', 'agency', 'ci-test')
                if previous is not None:
                    assert token == previous, 'Reference did not survive recreation'
                previous = token
                run('exec', name, 'python', '-c',
                    "import urllib.request,time; time.sleep(1); assert urllib.request.urlopen('http://127.0.0.1:8080/health').status == 200")
            finally:
                run('rm', '-f', name)
    finally:
        run('volume', 'rm', volume)
    print('Container health and private volume persistence verified')


if __name__ == '__main__':
    main()
