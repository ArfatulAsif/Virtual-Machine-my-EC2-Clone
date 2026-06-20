import { useEffect, useState, useCallback } from 'react'
import {
  listInstances,
  launchInstance,
  startInstance,
  stopInstance,
  rebootInstance,
  terminateInstance,
} from './ec2'

const INSTANCE_TYPES = ['t2.micro', 't2.small', 't3.micro', 't3.small', 'm5.large']

const STATE_CLASS = {
  running: 'running',
  pending: 'pending',
  'shutting-down': 'pending',
  stopping: 'pending',
  stopped: 'stopped',
  terminated: 'terminated',
}

function StatePill({ state }) {
  return <span className={`pill ${STATE_CLASS[state] ?? 'stopped'}`}>{state ?? 'unknown'}</span>
}

export default function App() {
  const [instances, setInstances] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [connected, setConnected] = useState(null)

  const [name, setName] = useState('')
  const [imageId, setImageId] = useState('ami-0abc1234')
  const [instanceType, setInstanceType] = useState('t2.micro')
  const [count, setCount] = useState(1)
  const [launching, setLaunching] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listInstances()
      setInstances(data)
      setConnected(true)
      setError(null)
    } catch (e) {
      setConnected(false)
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 5000)
    return () => clearInterval(t)
  }, [refresh])

  async function onLaunch(e) {
    e.preventDefault()
    setLaunching(true)
    setError(null)
    try {
      await launchInstance({
        imageId,
        instanceType,
        name: name.trim() || undefined,
        count: Number(count),
      })
      setName('')
      await refresh()
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setLaunching(false)
    }
  }

  async function act(fn, id) {
    setError(null)
    try {
      await fn(id)
      await refresh()
    } catch (e) {
      setError(e.message || String(e))
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="puff" aria-hidden="true" />
          <span className="brand-name">
            AIA EC2 Clone<span className="brand-dim"> · ec2 console</span>
          </span>
        </div>
        <div className="conn">
          <span className={`dot ${connected === null ? '' : connected ? 'ok' : 'bad'}`} />
          <span>
            {connected === null
              ? 'connecting…'
              : connected
                ? 'connected · localhost:4566'
                : 'not connected'}
          </span>
          <button className="ghost" onClick={refresh} disabled={loading}>
            {loading ? 'refreshing…' : 'refresh'}
          </button>
        </div>
      </header>

      <main className="main">
        <section className="panel">
          <h2>Launch instance</h2>
          <form onSubmit={onLaunch} className="launch-form">
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="web-1" />
            </label>
            <label>
              AMI (image id)
              <input
                value={imageId}
                onChange={(e) => setImageId(e.target.value)}
                placeholder="ami-…"
                required
              />
            </label>
            <label>
              Type
              <select value={instanceType} onChange={(e) => setInstanceType(e.target.value)}>
                {INSTANCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Count
              <input
                type="number"
                min="1"
                max="10"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </label>
            <button className="primary" disabled={launching}>
              {launching ? 'launching…' : 'Launch'}
            </button>
          </form>
          <p className="hint">
            AMI ids map to Linux container images in floci. If a launch fails, check the floci EC2
            docs for valid image ids.
          </p>
        </section>

        {error && (
          <div className="error" role="alert">
            <strong>Something went wrong.</strong> {error}
          </div>
        )}

        <section className="panel">
          <div className="panel-head">
            <h2>
              Instances <span className="count">{instances.length}</span>
            </h2>
          </div>
          {instances.length === 0 ? (
            <div className="empty">No instances yet. Launch one above to see it here.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Instance ID</th>
                    <th>Type</th>
                    <th>State</th>
                    <th>Public IP</th>
                    <th>Private IP</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {instances.map((i) => (
                    <tr key={i.id}>
                      <td>{i.name || <span className="muted">—</span>}</td>
                      <td className="mono">{i.id}</td>
                      <td className="mono">{i.type}</td>
                      <td>
                        <StatePill state={i.state} />
                      </td>
                      <td className="mono">{i.publicIp || <span className="muted">—</span>}</td>
                      <td className="mono">{i.privateIp || <span className="muted">—</span>}</td>
                      <td className="actions">
                        {i.state === 'stopped' && (
                          <button onClick={() => act(startInstance, i.id)}>Start</button>
                        )}
                        {i.state === 'running' && (
                          <button onClick={() => act(stopInstance, i.id)}>Stop</button>
                        )}
                        {i.state === 'running' && (
                          <button onClick={() => act(rebootInstance, i.id)}>Reboot</button>
                        )}
                        {i.state !== 'terminated' && (
                          <button className="danger" onClick={() => act(terminateInstance, i.id)}>
                            Terminate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
