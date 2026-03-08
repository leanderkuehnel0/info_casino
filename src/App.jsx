import React, { useState, useEffect, useRef } from 'react';
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Sound control flag
let soundsEnabled = true;

const API_URL = 'http://127.0.0.1:5000';

const apiFetch = (url, options = {}) => {
  const headers = {
    ...options.headers,
    'ngrok-skip-browser-warning': 'true',
  };
  return fetch(url, { ...options, headers });
};

const playSound = (type) => {
  if (!soundsEnabled) return;
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.connect(gain);
  gain.connect(audioContext.destination);

  const now = audioContext.currentTime;

  if (type === 'click') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'toggle') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'win') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  }
};

const StatusBar = () => (
  <div className="status-bar">
    <span>9:41</span>
    <div style={{ display: 'flex', gap: '8px' }}>
      <span>📶</span>
      <span>🔋</span>
    </div>
  </div>
);

const BottomNav = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'slots', label: 'Slots', icon: '🎰' },
    { id: 'blackjack', label: 'Blackjack', icon: '🃏' },
    { id: 'account', label: 'Account', icon: '👤' },
  ];

  return (
    <div className="bottom-nav">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => {
            playSound('click');
            setActiveTab(tab.id);
          }}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </div>
      ))}
    </div>
  );
};

const HomeScreen = ({ userData, setActiveTab, onClaimBonus }) => (
  <div className="screen-content">
    <div style={{ marginBottom: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Hello, {userData.firstName}</h1>
      <div style={{ color: 'var(--subtle)', fontSize: '14px', marginTop: '4px' }}>
        Current Balance: <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{userData.balance}</span>
      </div>
    </div>

    {userData.lastBonusClaim !== new Date().toISOString().slice(0, 10) && (
    <div className="glass-card" style={{ background: 'linear-gradient(45deg, var(--overlay), var(--surface))', marginBottom: '24px' }}>
      <h2 style={{ marginBottom: '8px' }}>Daily Bonus</h2>
      <p style={{ color: 'var(--text)', opacity: 1, fontSize: '14px', fontWeight: '500' }}>Claim your $5 chips now!</p>
      <button
        className="premium-button"
        style={{ marginTop: '16px', width: '100%' }}
        onClick={() => {
          playSound('win');
          onClaimBonus();
        }}
      >
        CLAIM NOW
      </button>
    </div>
    )}

    <h3 style={{ margin: '16px 0', fontSize: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      Popular Games
      <span style={{ fontSize: '12px' }}>See All</span>
    </h3>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {['Slots', 'Blackjack'].map((game, i) => (
        <div
          key={game}
          className="glass-card"
          style={{ textAlign: 'center', padding: '12px', cursor: 'pointer' }}
          onClick={() => {
            playSound('click');
            if (game === 'Slots') setActiveTab('slots');
            if (game === 'Blackjack') setActiveTab('blackjack');
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>{['🎰', '🃏'][i]}</div>
          <div style={{ fontWeight: '600' }}>{game}</div>
        </div>
      ))}
    </div>
  </div>
);

const SlotsScreen = ({ user, setUser }) => {
  const [bet, setBet] = useState(10);
  const [payout, setPayout] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [wheelRow, setWheelRow] = useState([5, 5, 5]);
  const [hasLanded, setHasLanded] = useState(true);

  const symbolMap = { 1: '💎', 2: '🍒', 3: '🔔', 4: '🍋', 5: '7️⃣' };
  const symbolList = ['💎', '🍒', '🔔', '🍋', '7️⃣'];

  // Add CSS keyframes for vertical spinning
  useEffect(() => {
    const styleId = 'slots-animation-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @keyframes slotSpin {
          0% { transform: translateY(0); }
          100% { transform: translateY(-700%); }
        }
        .slot-column {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .slot-column.spinning {
          animation: slotSpin 0.3s linear infinite;
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  const SlotReel = ({ result, isSpinning, index }) => {
    // Repeated symbols to create the infinite scroll effect
    const displaySymbols = [...symbolList, ...symbolList, ...symbolList, result ? symbolMap[result] : '❓'];
    return (
      <div className="glass-card" style={{ padding: 0, width: '80px', height: '120px', overflow: 'hidden', display: 'flex', justifyContent: 'center', backgroundColor: 'transparent' }}>
        <div className={`slot-column ${isSpinning ? 'spinning' : ''}`} style={{ marginTop: (!isSpinning && hasLanded) ? '0' : (isSpinning ? '0' : 'calc(-120px * 15)'), transition: isSpinning ? 'none' : 'margin-top 0.1s ease-out' }}>
          {!isSpinning && hasLanded ? (
            <div style={{ height: '120px', display: 'flex', alignItems: 'center', fontSize: '50px', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
              {result ? symbolMap[result] : '❓'}
            </div>
          ) : (
            displaySymbols.map((sym, i) => (
              <div key={i} style={{ height: '120px', display: 'flex', alignItems: 'center', fontSize: '50px', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
                {sym}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const handleSpin = async () => {
    if (bet <= 0) {
      alert("Bet must be greater than zero.");
      return;
    }
    if (user.balance < bet) {
      alert("Insufficient balance.");
      return;
    }

    setSpinning(true);
    setHasLanded(false);
    setUser(prev => ({ ...prev, balance: (prev.balance || 0) - bet }));

    const formData = new FormData();
    formData.append('username', user.username);
    formData.append('password_hash', user.password_hash);
    formData.append('bet', bet);

    try {
      const resp = await apiFetch(`${API_URL}/slots/play`, { method: 'POST', body: formData });

      if (!resp.ok) {
        const errorText = await resp.text();
        alert(errorText);
        // Restore balance on failure
        setUser(prev => ({ ...prev, balance: (prev.balance || 0) + bet }));
        setSpinning(false);
        setWheelRow([5, 5, 5]);
        setHasLanded(true);
        return;
      }

      const data = await resp.json();

      // Keep spinning for 1.5 seconds minimum for visual effect
      setTimeout(() => {
        setPayout(data.payout);
        setWheelRow(data.row || [5, 5, 5]);
        setSpinning(false);
        setHasLanded(true);
        if (data.payout) {
          setUser(prev => ({ ...prev, balance: (prev.balance || 0) + data.payout }));
          playSound('win');
        } else {
          playSound('click'); // simple tick on loss
        }
      }, 1500);

    } catch (e) {
      console.error('Spin failed', e);
      // Restore balance on error
      setUser(prev => ({ ...prev, balance: (prev.balance || 0) + bet }));
      setSpinning(false);
      setHasLanded(true);
    }
  };

  return (
    <div className="screen-content">
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Slots</h2>
      <div className="glass-card" style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid var(--rose)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[0, 1, 2].map((i) => (
            <SlotReel key={i} index={i} result={wheelRow[i]} isSpinning={spinning} />
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: '10px', width: '100%', textAlign: 'center', color: 'var(--foam)', fontWeight: 'bold' }}>
          JACKPOT: $1,240,500.00
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0' }}>
        <div className="glass-card" style={{ flex: 1, marginRight: '10px', textAlign: 'center', padding: '10px' }}>
          <div style={{ fontSize: '10px', color: 'var(--subtle)' }}>BET</div>
          <input type="number" value={bet} onChange={e => setBet(parseInt(e.target.value) || 0)} style={{ width: '100%', textAlign: 'center', background: 'var(--overlay)', border: '1px solid var(--glass-border)', color: 'var(--text)', padding: '5px' }} />
        </div>
        <div className="glass-card" style={{ flex: 1, textAlign: 'center', padding: '10px' }}>
          <div style={{ fontSize: '10px', color: 'var(--subtle)' }}>WIN</div>
          <div style={{ color: 'var(--foam)' }}>${payout !== null ? payout : 0}</div>
        </div>
      </div>
      <button
        className="premium-button"
        style={{ width: '100%', height: '60px', fontSize: '20px' }}
        onClick={handleSpin}
        disabled={spinning}
      >
        {spinning ? 'Spinning...' : 'SPIN'}
      </button>
    </div>
  );
};

const BlackjackScreen = ({ user, setUser }) => {
  const [bet, setBet] = useState(10);
  const [gameId, setGameId] = useState(null);
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [gameState, setGameState] = useState('idle'); // idle, active, won, lost, draw
  const [payout, setPayout] = useState(0);
  const [loading, setLoading] = useState(false);

  const startGame = async () => {
    if (bet <= 0) { alert('Bet must be greater than 0'); return; }
    if (user.balance < bet) { alert('Insufficient balance'); return; }
    setLoading(true);
    const formData = new FormData();
    formData.append('username', user.username);
    formData.append('password_hash', user.password_hash);
    formData.append('bet', bet);
    try {
      const resp = await apiFetch(`${API_URL}/blackjack/new_game`, { method: 'POST', body: formData });
      const data = await resp.json();
      setGameId(data.game_id);
      // Deduct bet locally after successful start
      setUser(prev => ({ ...prev, balance: (prev.balance || 0) - bet }));
      // initial deal
      await loop('');
    } catch (e) {
      console.error('Failed to start blackjack', e);
    }
    setLoading(false);
  };

  const loop = async (action) => {
    if (!gameId) return;
    const formData = new FormData();
    formData.append('game_id', gameId);
    formData.append('bet', bet);
    formData.append('username', user.username);
    formData.append('password_hash', user.password_hash);
    if (action) formData.append('action', action);
    try {
      const resp = await apiFetch(`${API_URL}/blackjack/loop`, { method: 'POST', body: formData });
      const data = await resp.json();
      if (Array.isArray(data)) {
        setPlayerCards(data);
        setGameState('active');
      } else if (data.game_state) {
        setGameState(data.game_state);
        setPayout(data.returned_money);
        setPlayerCards(data.player_cards || []);
        setDealerCards(data.dealer_cards || []);
        if (data.returned_money) {
          setUser(prev => ({ ...prev, balance: (prev.balance || 0) + data.returned_money }));
        }
      }
    } catch (e) {
      console.error('Blackjack loop error', e);
    }
  };

  useEffect(() => {
    if (gameId && gameState === 'idle') {
      // fetch initial cards after game created
      loop('');
    }
  }, [gameId]);

  const handleHit = async () => {
    await loop('hit');
    playSound('click');
  };
  const handleStand = async () => {
    await loop('stand');
    playSound('click');
  };

  const renderCards = (cards) => (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {cards.map((c, i) => (
        <div key={i} className="glass-card" style={{ width: '50px', height: '70px', background: 'white', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{c}</div>
      ))}
    </div>
  );

  return (
    <div className="screen-content">
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Blackjack</h2>
      {gameState === 'idle' && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '10px', color: 'var(--subtle)' }}>BET</div>
          <input type="number" value={bet} onChange={e => setBet(parseInt(e.target.value) || 0)} style={{ width: '100%', textAlign: 'center', background: 'var(--overlay)', border: '1px solid var(--glass-border)', color: 'var(--text)', padding: '5px' }} />
          <button className="premium-button" style={{ marginTop: '10px', width: '100%' }} onClick={startGame} disabled={loading}>
            {loading ? 'Starting...' : 'Start Game'}
          </button>
        </div>
      )}
      {gameId && (
        <>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--subtle)', marginBottom: '10px' }}>DEALER</div>
            {renderCards(gameState === 'active' ? [] : dealerCards)}
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <div style={{ marginBottom: '10px' }}>YOUR HAND</div>
            {renderCards(playerCards)}
          </div>
          {gameState === 'active' && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button style={{ flex: 1, padding: '15px', borderRadius: '12px', background: 'var(--overlay)', color: 'var(--text)', border: '1px solid var(--muted)', fontWeight: 'bold' }} onClick={handleHit}>HIT</button>
              <button style={{ flex: 1, padding: '15px', borderRadius: '12px', background: 'var(--love)', color: 'var(--base)', border: 'none', fontWeight: 'bold' }} onClick={handleStand}>STAND</button>
            </div>
          )}
          {gameState !== 'idle' && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <h3>{gameState.toUpperCase()}</h3>
              <p>Payout: ${payout}</p>
              {gameState !== 'active' && (
                <button className="premium-button" style={{ marginTop: '10px' }} onClick={() => {
                  // Reset game state for a new round
                  setGameId(null);
                  setPlayerCards([]);
                  setDealerCards([]);
                  setGameState('idle');
                  setPayout(0);
                }}>
                  PLAY AGAIN
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const SettingRow = ({ label, value, onClick }) => (
  <div
    style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', alignItems: 'center' }}
    onClick={() => {
      playSound('toggle');
      onClick();
    }}
  >
    <span>{label}</span>
    <span style={{ color: value === 'ON' || value === 'OFF' ? 'var(--rose)' : 'var(--foam)', fontWeight: 'bold' }}>{value}</span>
  </div>
);

const OTPInput = ({ value, onChange }) => {
  const inputs = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (isNaN(val)) return;

    const newValue = value.split('');
    newValue[index] = val.slice(-1); // Take only the last character entered
    const finalValue = newValue.join('');

    onChange(finalValue);

    // Auto-focus next input
    if (val && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/\D/g, '');
    if (pastedData) {
      onChange(pastedData.padEnd(6, ' ').slice(0, 6).replace(/ /g, ''));
      // Focus the last filled input or the first empty one
      const focusIndex = Math.min(pastedData.length, 5);
      inputs.current[focusIndex].focus();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
      {[...Array(6)].map((_, i) => (
        <React.Fragment key={i}>
          {i === 3 && <span style={{ display: 'flex', alignItems: 'center', fontSize: '20px', color: 'var(--subtle)' }}>-</span>}
          <input
            ref={el => inputs.current[i] = el}
            type="text"
            inputMode="numeric"
            value={(value || '')[i] || ''}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={handlePaste}
            style={{
              width: '36px',
              height: '48px',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              background: 'var(--overlay)',
              color: 'var(--text)',
              textAlign: 'center',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          />
        </React.Fragment>
      ))}
    </div>
  );
};

const LoginScreen = ({ setAuthView, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    playSound('click');
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const resp = await apiFetch(`${API_URL}/login`, { method: 'POST', body: formData });
      const data = await resp.text();
      if (resp.ok) {
        try {
          const result = JSON.parse(data);
          if (result.requires_2fa) {
            // Trigger OTP verification screen
            onLogin(result.username);
          } else {
            // Fallback for old flow (shouldn't happen with 2FA)
            onLogin(result);
          }
        } catch {
          setError('Invalid response from server');
        }
      } else {
        setError(data);
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  return (
    <div className="screen-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '60px', marginBottom: '16px' }}>🎰</div>
        <h1 style={{ fontSize: '32px', fontWeight: '800' }}>Rose Casino</h1>
        <p style={{ color: 'var(--subtle)' }}>Enter your credentials to play</p>
      </div>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ background: 'var(--overlay)', border: '1px solid var(--glass-border)', padding: '15px', borderRadius: '12px', color: 'var(--text)' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ background: 'var(--overlay)', border: '1px solid var(--glass-border)', padding: '15px', borderRadius: '12px', color: 'var(--text)' }}
        />
        {error && <p style={{ color: 'var(--love)', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
        <button type="submit" className="premium-button" style={{ height: '55px', marginTop: '10px' }}>LOGIN</button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--subtle)' }}>
        Don't have an account? <span style={{ color: 'var(--iris)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setAuthView('register')}>Register</span>
      </p>
    </div>
  );
};

const RegisterScreen = ({ setAuthView, onRegisterSuccess }) => {
  const [form, setForm] = useState({ username: '', password: '', email: '', date_of_birth: '', billing_address: '' });
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    playSound('click');
    const formData = new FormData();
    Object.keys(form).forEach(key => formData.append(key, form[key]));

    try {
      const resp = await apiFetch(`${API_URL}/register`, { method: 'POST', body: formData });
      if (resp.ok) {
        const data = await resp.json();
        // Trigger QR setup screen directly
        onRegisterSuccess(data);
      } else {
        const msg = await resp.text();
        setError(msg);
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  return (
    <div className="screen-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '20px' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '16px', textAlign: 'center' }}>Join the Club</h2>

      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input type="text" placeholder="Username" onChange={e => setForm({ ...form, username: e.target.value })} style={{ background: 'var(--overlay)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '10px', color: 'var(--text)' }} />
        <input type="password" placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} style={{ background: 'var(--overlay)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '10px', color: 'var(--text)' }} />
        <input type="email" placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} style={{ background: 'var(--overlay)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '10px', color: 'var(--text)' }} />
        <input type="date" placeholder="DOB" onChange={e => setForm({ ...form, date_of_birth: e.target.value })} style={{ background: 'var(--overlay)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '10px', color: 'var(--text)' }} />
        <input type="text" placeholder="Billing Address" onChange={e => setForm({ ...form, billing_address: e.target.value })} style={{ background: 'var(--overlay)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '10px', color: 'var(--text)' }} />
        {error && <p style={{ color: 'var(--love)', fontSize: '12px', textAlign: 'center' }}>{error}</p>}
        <button type="submit" className="premium-button" style={{ height: '50px', marginTop: '10px' }}>SIGN UP</button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '16px', color: 'var(--subtle)', fontSize: '14px' }}>
        Already have an account? <span style={{ color: 'var(--iris)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setAuthView('login')}>Login</span>
      </p>
    </div>
  );
};

const RegistrationSuccessScreen = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="screen-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '40px' }}>
      <div style={{ textAlign: 'center', color: 'var(--foam)' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
        <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>Registration Successful!</h3>
        <p style={{ color: 'var(--subtle)' }}>Redirecting to login...</p>
      </div>
    </div>
  );
};

const QRSetupScreen = ({ qrData, onComplete, username }) => {
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    const success = await onComplete(otpCode);
    if (!success) {
      setError('Invalid code. Please try again.');
      setOtpCode('');
    }
  };

  return (
    <div className="screen-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Set Up 2FA</h1>
        <p style={{ color: 'var(--subtle)', fontSize: '14px' }}>Scan this QR code with Google Authenticator</p>
      </div>

      <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
        {qrData && qrData.qr_code && (
          <img src={qrData.qr_code} alt="QR Code" style={{ width: '250px', height: '250px', margin: '0 auto' }} />
        )}
        <div style={{ marginTop: '20px', padding: '12px', background: 'var(--overlay)', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: 'var(--subtle)', marginBottom: '4px' }}>SECRET KEY</div>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>{qrData?.secret}</div>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--subtle)', marginTop: '16px', marginBottom: '16px' }}>
          Verify setup by entering the code from the app:
        </p>

        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
          <OTPInput value={(otpCode || '')} onChange={setOtpCode} />
        </div>
        {error && <p style={{ color: 'var(--love)', fontSize: '12px', textAlign: 'center', marginBottom: '12px' }}>{error}</p>}
      </div>

      <button
        className="premium-button"
        style={{ height: '55px', marginTop: '24px' }}
        onClick={handleVerify}
      >
        VERIFY & CONTINUE
      </button>
    </div>
  );
};

const OTPVerificationScreen = ({ username, onVerify, onBack }) => {
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    const success = await onVerify(otpCode);
    if (!success) {
      setError('Invalid code');
      setOtpCode('');
    }
  };

  return (
    <div className="screen-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '50px', marginBottom: '16px' }}>🛡️</div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Security Check</h1>
        <p style={{ color: 'var(--subtle)', fontSize: '14px' }}>Enter the code from Google Authenticator</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <OTPInput value={(otpCode || '')} onChange={setOtpCode} />
        </div>

        {error && <p style={{ color: 'var(--love)', fontSize: '14px', textAlign: 'center' }}>{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button type="submit" className="premium-button" style={{ height: '55px' }}>VERIFY</button>
          <button type="button" onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'var(--subtle)', fontSize: '14px', cursor: 'pointer' }}>Back to Login</button>
        </div>
      </form>
    </div>
  );
};

const DepositModal = ({ isOpen, onClose, onDeposit }) => {
  const [amount, setAmount] = useState('');

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '300px', padding: '24px', border: '1px solid var(--rose)' }}>
        <h3 style={{ marginBottom: '16px', textAlign: 'center' }}>Deposit Chips</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          {[50, 100, 500, 1000].map(val => (
            <button
              key={val}
              style={{ padding: '10px', background: 'var(--overlay)', color: 'var(--text)', border: '1px solid var(--glass-border)', borderRadius: '8px', fontWeight: 'bold' }}
              onClick={() => setAmount(val.toString())}
            >
              +${val}
            </button>
          ))}
        </div>
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ width: '100%', background: 'var(--overlay)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '10px', color: 'var(--text)', marginBottom: '20px', textAlign: 'center', fontSize: '18px' }}
        />
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ flex: 1, padding: '12px', background: 'transparent', color: 'var(--subtle)', border: 'none', fontWeight: 'bold' }} onClick={onClose}>CANCEL</button>
          <button
            className="premium-button"
            style={{ flex: 1, padding: '12px' }}
            onClick={() => {
              if (amount) onDeposit(parseFloat(amount));
            }}
          >
            DEPOSIT
          </button>
        </div>
      </div>
    </div>
  );
};

const UpdateModal = ({ isOpen, onClose, onUpdate, fieldType, currentValue }) => {
  const [otpCode, setOtpCode] = useState('');
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewValue('');
      setOtpCode('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!otpCode || !newValue) {
      setError('All fields are required');
      return;
    }

    const success = await onUpdate(otpCode, newValue);
    if (success) {
      setOtpCode('');
      setNewValue('');
      setError('');
      onClose();
    } else {
      setError('Invalid OTP code or update failed');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '350px', padding: '24px', border: '1px solid var(--rose)' }}>
        <h3 style={{ marginBottom: '16px', textAlign: 'center' }}>Update {fieldType === 'email' ? 'Email' : 'Billing Address'}</h3>
        <div style={{ marginBottom: '16px', fontSize: '12px', color: 'var(--subtle)' }}>
          Current: <span style={{ color: 'var(--text)' }}>{currentValue}</span>
        </div>
        <input
          type={fieldType === 'email' ? 'email' : 'text'}
          placeholder={`New ${fieldType === 'email' ? 'Email' : 'Billing Address'}`}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          style={{ width: '100%', background: 'var(--overlay)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '10px', color: 'var(--text)', marginBottom: '12px', textAlign: 'center', fontWeight: 'bold' }}
        />
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
          <OTPInput value={otpCode} onChange={setOtpCode} />
        </div>
        {error && <p style={{ color: 'var(--love)', fontSize: '12px', textAlign: 'center', marginBottom: '12px' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ flex: 1, padding: '12px', background: 'transparent', color: 'var(--subtle)', border: 'none', fontWeight: 'bold' }} onClick={() => {
            setOtpCode('');
            setNewValue('');
            setError('');
            onClose();
          }}>CANCEL</button>
          <button
            className="premium-button"
            style={{ flex: 1, padding: '12px' }}
            onClick={handleSubmit}
          >
            UPDATE
          </button>
        </div>
      </div>
    </div>
  );
};

const AccountScreen = ({ theme, setTheme, user, config, setConfig, onLogout, onOpenDeposit, onDeleteAccount, onOpenUpdate }) => (
  <div className="screen-content">
    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
      <div style={{ width: '80px', height: '80px', background: 'var(--iris)', borderRadius: '50%', margin: '0 auto 12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '40px' }}>👤</div>
      <h2 style={{ marginBottom: '4px' }}>{user.username}</h2>
      <p style={{ color: 'var(--subtle)' }}>Member since Jan 2024</p>
    </div>

    <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: '12px', color: 'var(--subtle)' }}>BALANCE</div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--gold)' }}>${user.balance?.toFixed(2) || '0.00'}</div>
      </div>
      <button className="premium-button" style={{ padding: '8px 16px' }} onClick={() => {
        playSound('click');
        onOpenDeposit();
      }}>DEPOSIT</button>
    </div>

    <div style={{ marginTop: '24px' }}>
      <h3 style={{ marginBottom: '16px' }}>Personal Details</h3>
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <SettingRow
          label="Email Address"
          value={user.email || 'N/A'}
          onClick={() => {
            playSound('click');
            onOpenUpdate('email', user.email);
          }}
        />
        <SettingRow
          label="Billing Address"
          value={user.billingAddress || user.billing_address || 'N/A'}
          onClick={() => {
            playSound('click');
            onOpenUpdate('billing', user.billingAddress || user.billing_address);
          }}
          isLast
        />
      </div>
    </div>

    <div style={{ marginTop: '24px' }}>
      <h3 style={{ marginBottom: '16px' }}>Settings</h3>
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <SettingRow
          label="Sound Effects"
          value={config.sounds ? 'ON' : 'OFF'}
          onClick={() => setConfig({ ...config, sounds: !config.sounds })}
        />
        <SettingRow
          label="Notifications"
          value={config.notifications ? 'ON' : 'OFF'}
          onClick={() => setConfig({ ...config, notifications: !config.notifications })}
        />
        <SettingRow
          label="Dark Mode"
          value={theme === 'dark' ? 'ON' : 'OFF'}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />
      </div>
    </div>

    <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <button
        style={{ width: '100%', background: 'transparent', color: 'var(--love)', border: '2px solid var(--love)', padding: '12px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        onClick={() => {
          playSound('click');
          if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            onDeleteAccount();
          }
        }}
      >
        🗑️ DELETE ACCOUNT
      </button>

      <button
        style={{ width: '100%', background: 'transparent', color: 'var(--text)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '12px', fontWeight: 'bold' }}
        onClick={() => {
          playSound('click');
          onLogout();
        }}
      >
        LOGOUT
      </button>
    </div>
  </div>
);

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [theme, setTheme] = useState('dark');
  const [config, setConfig] = useState({ sounds: true, notifications: true });
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updateField, setUpdateField] = useState('');
  const [updateCurrentValue, setUpdateCurrentValue] = useState('');
  const [qrData, setQrData] = useState(null);
  const [pendingUsername, setPendingUsername] = useState('');

  React.useEffect(() => {
    soundsEnabled = config.sounds;
  }, [config.sounds]);

  const handleDeposit = async (amount) => {
    const formData = new FormData();
    formData.append('username', user.username);
    formData.append('password_hash', user.password_hash);
    formData.append('amount', amount);

    try {
      const resp = await apiFetch(`${API_URL}/deposit`, { method: 'POST', body: formData });
      if (resp.ok) {
        const data = await resp.json();
        setUser({ ...user, balance: data.new_balance });
        setIsDepositOpen(false);
        playSound('win');
      }
    } catch (err) {
      console.error('Deposit failed', err);
    }
  };

  const handleDeleteAccount = async () => {
    const formData = new FormData();
    formData.append('username', user.username);
    formData.append('password_hash', user.password_hash);

    try {
      const resp = await apiFetch(`${API_URL}/delete_account`, { method: 'POST', body: formData });
      if (resp.ok) {
        setUser(null);
        setAuthView('login');
      }
    } catch (err) {
      console.error('Deletion failed', err);
    }
  };

  const handleClaimBonus = async () => {
    const formData = new FormData();
    formData.append('username', user.username);
    formData.append('password_hash', user.password_hash);

    try {
      const resp = await apiFetch(`${API_URL}/claim_bonus`, { method: 'POST', body: formData });
      if (resp.ok) {
        const data = await resp.json();
        setUser({ ...user, balance: data.new_balance, last_bonus_claim: new Date().toISOString().slice(0, 10) });
      }
    } catch (err) {
      console.error('Bonus claim failed', err);
    }
  };

  const handleOpenUpdate = (fieldType, currentValue) => {
    setUpdateField(fieldType);
    setUpdateCurrentValue(currentValue);
    setIsUpdateOpen(true);
  };

  const handleUpdate = async (otpCode, newValue) => {
    const formData = new FormData();
    formData.append('username', user.username);
    formData.append('otp_code', otpCode);

    const endpoint = updateField === 'email' ? '/update_email' : '/update_billing';
    const fieldKey = updateField === 'email' ? 'new_email' : 'new_billing';
    formData.append(fieldKey, newValue);

    try {
      const resp = await apiFetch(`${API_URL}${endpoint}`, { method: 'POST', body: formData });
      if (resp.ok) {
        const data = await resp.json();
        if (updateField === 'email') {
          setUser({ ...user, email: data.new_email });
        } else {
          setUser({ ...user, billing_address: data.new_billing, billingAddress: data.new_billing });
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Update failed', err);
      return false;
    }
  };

  const handleRegisterSuccess = async (registrationData) => {
    // Fetch QR code after successful registration
    const formData = new FormData();
    formData.append('username', registrationData.username);
    formData.append('totp_secret', registrationData.totp_secret);

    try {
      const resp = await apiFetch(`${API_URL}/get_qr_code`, { method: 'POST', body: formData });
      if (resp.ok) {
        const data = await resp.json();
        setQrData(data);
        setPendingUsername(registrationData.username);
        setAuthView('qr_setup');
      }
    } catch (err) {
      console.error('QR code generation failed', err);
    }
  };

  const handleQRSetupComplete = async (otpCode) => {
    const formData = new FormData();
    formData.append('username', pendingUsername);
    formData.append('otp_code', otpCode);

    try {
      const resp = await apiFetch(`${API_URL}/verify_otp`, { method: 'POST', body: formData });
      if (resp.ok) {
        setQrData(null);
        // Navigate to success screen instead of login directly
        setAuthView('registration_success');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Setup verification failed', err);
      return false;
    }
  };

  const handleLoginSuccess = (username) => {
    setPendingUsername(username);
    setAuthView('otp_verify');
  };

  const handleOTPVerify = async (otpCode) => {
    const formData = new FormData();
    formData.append('username', pendingUsername);
    formData.append('otp_code', otpCode);

    try {
      const resp = await apiFetch(`${API_URL}/verify_otp`, { method: 'POST', body: formData });
      if (resp.ok) {
        const userData = await resp.json();
        setUser(userData);
        setPendingUsername('');
        setAuthView('login');
        return true;
      }
      return false;
    } catch (err) {
      console.error('OTP verification failed', err);
      return false;
    }
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'home': return <HomeScreen userData={{ firstName: user.username, balance: `$${user.balance?.toFixed(2) || '0.00'}`, lastBonusClaim: user.last_bonus_claim }} setActiveTab={setActiveTab} onClaimBonus={handleClaimBonus} />;
      case 'slots': return <SlotsScreen user={user} setUser={setUser} />;
      case 'blackjack': return <BlackjackScreen user={user} setUser={setUser} />;
      case 'account': return (
        <AccountScreen
          theme={theme}
          setTheme={setTheme}
          user={user}
          config={config}
          setConfig={setConfig}
          onLogout={() => setUser(null)}
          onOpenDeposit={() => setIsDepositOpen(true)}
          onDeleteAccount={handleDeleteAccount}
          onOpenUpdate={handleOpenUpdate}
        />
      );
      default: return <HomeScreen userData={{ firstName: user.username, balance: `$${user.balance?.toFixed(2) || '0.00'}` }} setActiveTab={setActiveTab} />;
    }
  };

  if (!user) {
    return (
      <div className={`android-shell ${theme === 'light' ? 'light-theme' : ''}`}>
        <StatusBar />
        {authView === 'login' && <LoginScreen setAuthView={setAuthView} onLogin={handleLoginSuccess} />}
        {authView === 'register' && <RegisterScreen setAuthView={setAuthView} onRegisterSuccess={handleRegisterSuccess} />}
        {authView === 'qr_setup' && <QRSetupScreen qrData={qrData} onComplete={handleQRSetupComplete} username={pendingUsername} />}
        {authView === 'otp_verify' && <OTPVerificationScreen username={pendingUsername} onVerify={handleOTPVerify} onBack={() => { setPendingUsername(''); setAuthView('login'); }} />}
        {authView === 'registration_success' && <RegistrationSuccessScreen onComplete={() => { setPendingUsername(''); setAuthView('login'); }} />}
      </div>
    );
  }

  return (
    <div className={`android-shell ${theme === 'light' ? 'light-theme' : ''}`}>
      <StatusBar />
      <div className="content-area">
        {renderScreen()}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onDeposit={handleDeposit}
      />
      <UpdateModal
        isOpen={isUpdateOpen}
        onClose={() => setIsUpdateOpen(false)}
        onUpdate={handleUpdate}
        fieldType={updateField}
        currentValue={updateCurrentValue}
      />
    </div>
  );
}

export default App;
