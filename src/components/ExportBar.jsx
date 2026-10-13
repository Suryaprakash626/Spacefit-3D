import { useState } from 'react'
import { useStore } from '../store'
import { downloadCsv, exportPdf, buildShareUrl } from '../exporters'

export default function ExportBar() {
  const room = useStore((s) => s.room)
  const items = useStore((s) => s.items)
  const [msg, setMsg] = useState('')
  const say = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3500) }

  const pdf = async () => {
    try { await exportPdf(room, items); say('PDF saved') }
    catch (e) { say('PDF failed: ' + e.message) }
  }
  const copy = async () => {
    const url = buildShareUrl(room, items)
    try { await navigator.clipboard.writeText(url); say('Link copied') }
    catch { window.prompt('Copy this link:', url) }
  }

  return (
    <div className="card row exportbar">
      <strong>Export</strong>
      <button onClick={pdf}>Download PDF</button>
      <button onClick={() => downloadCsv(room, items)}>Download CSV</button>
      <button onClick={copy}>Copy share link</button>
      {msg && <span className="note">{msg}</span>}
    </div>
  )
}