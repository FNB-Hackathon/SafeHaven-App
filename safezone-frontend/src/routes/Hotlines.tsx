export default function Hotlines() {
  return (
    <div className="stack" style={{ alignItems:'stretch' }}>
      <h2>Emergency Hotlines (South Africa)</h2>
      <div className="card">
        <div className="card-title">Police Emergency (SAPS)</div>
        <div className="card-sub">10111</div>
      </div>
      <div className="card">
        <div className="card-title">Ambulance / Fire</div>
        <div className="card-sub">10177</div>
      </div>
      <div className="card">
        <div className="card-title">GBV Command Centre</div>
        <div className="card-sub">0800 428 428 (USSD: *120*7867#)</div>
      </div>
      <div className="card">
        <div className="card-title">Crime Stop (Anonymous)</div>
        <div className="card-sub">08600 10111</div>
      </div>
      <div className="card">
        <div className="card-title">Lifeline SA (Counselling)</div>
        <div className="card-sub">0861 322 322</div>
      </div>
      <p className="muted">Verify numbers for your region. In an emergency, call the official hotlines directly.</p>
    </div>
  )
}
