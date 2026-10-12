from pathlib import Path
import tempfile, subprocess
source = Path('scripts/deploy-host.sh').read_text().split("<<'PRUNE'\n", 1)[1].split('\nPRUNE', 1)[0]
with tempfile.TemporaryDirectory() as directory:
    root = Path(directory)
    code = source.replace("Path('/var/www/sporto-releases')", repr(root.as_posix()))
    code = code.replace('root = '+repr(root.as_posix()), 'root = Path('+repr(root.as_posix())+')')
    names = ['sporto-20260930-100000','sporto-20260930-110000','sporto-20260930-120000','sporto-20260930-130000']
    def make(name, healthy=False):
        p = root/name
        (p/'.next/standalone').mkdir(parents=True)
        (p/'.next/standalone/server.js').touch()
        if healthy: (p/'.deploy-healthy').touch()
        return p
    old, previous, active, failed = [make(n, True) for n in names]
    (failed/'.deploy-healthy').unlink()
    unknown = root/'uploads'; unknown.mkdir()
    subprocess.run(['python3','-c',code,str(active/'.next/standalone'),''],check=True)
    assert active.exists() and previous.exists() and unknown.exists()
    assert not old.exists() and not failed.exists()
    new = make('sporto-20260930-140000',True)
    subprocess.run(['python3','-c',code,str(active/'.next/standalone'),str(new)],check=True)
    assert new.exists() and active.exists() and not previous.exists()
    subprocess.run(['python3','-c',code,'/unmanaged/service',''],check=True)
    assert new.exists() and active.exists() and unknown.exists()
print('PASS: active + rollback preserved; failed/old removed; unknown paths preserved.')
