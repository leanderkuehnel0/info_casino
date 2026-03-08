import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Modal, SafeAreaView, Platform, Vibration, Dimensions, Animated, Easing, Alert, Image } from 'react-native';

const SOUNDS = {
  click: () => Vibration.vibrate(50),
  toggle: () => Vibration.vibrate(50),
  win: () => Vibration.vibrate([0, 100, 50, 200]),
};

let soundsEnabled = true;

const playSound = (type) => {
  if (soundsEnabled && SOUNDS[type]) SOUNDS[type]();
};

const API_URL = Platform.OS === 'android' ? 'https://sloth-allowed-uniformly.ngrok-free.app' : 'http://127.0.0.1:5000';

const apiFetch = (url, options = {}) => {
  const headers = {
    ...options.headers,
    'ngrok-skip-browser-warning': 'true',
  };
  return fetch(url, { ...options, headers });
};

const COLORS = {
  base: '#191724',
  surface: '#1f1d2e',
  overlay: '#26233a',
  muted: '#6e6a86',
  subtle: '#908caa',
  text: '#e0def4',
  love: '#eb6f92',
  gold: '#f6c177',
  rose: '#ebbcba',
  foam: '#9ccfd8',
  iris: '#c4a7e7',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.base },
  contentArea: { flex: 1, padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  subHeader: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  text: { color: COLORS.text },
  subtleText: { color: COLORS.subtle },
  glassCard: {
    backgroundColor: 'rgba(42, 39, 63, 0.7)',
    borderColor: COLORS.glassBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  premiumButton: {
    backgroundColor: COLORS.iris, // Simple fallback for gradient
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumButtonText: { color: COLORS.base, fontWeight: 'bold', fontSize: 16 },
  input: {
    backgroundColor: COLORS.overlay,
    borderColor: COLORS.glassBorder,
    borderWidth: 1,
    padding: 15,
    borderRadius: 12,
    color: COLORS.text,
    marginBottom: 12,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  navItem: { alignItems: 'center', justifyContent: 'center' },
});

const BottomNav = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'slots', label: 'Slots', icon: '🎰' },
    { id: 'blackjack', label: 'Blackjack', icon: '🃏' },
    { id: 'account', label: 'Account', icon: '👤' },
  ];

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.navItem}
          onPress={() => {
            playSound('click');
            setActiveTab(tab.id);
          }}
        >
          <Text style={{ fontSize: 24 }}>{tab.icon}</Text>
          <Text style={{ fontSize: 10, color: activeTab === tab.id ? COLORS.rose : COLORS.subtle }}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const OTPInput = ({ value, onChange }) => {
  return (
    <TextInput
      style={[styles.input, { textAlign: 'center', fontSize: 20, letterSpacing: 8 }]}
      keyboardType="numeric"
      maxLength={6}
      value={value}
      onChangeText={onChange}
      placeholder="000000"
      placeholderTextColor={COLORS.subtle}
    />
  );
};

const LoginScreen = ({ setAuthView, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
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
            onLogin(result.username);
          } else {
            onLogin(result);
          }
        } catch { setError('Invalid response'); }
      } else { setError(data); }
    } catch (err) { setError('Connection error'); }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 40 }}>
      <Text style={{ fontSize: 60, textAlign: 'center', marginBottom: 16 }}>🎰</Text>
      <Text style={styles.header}>Rose Casino</Text>
      <Text style={[styles.subtleText, { marginBottom: 30, textAlign: 'center' }]}>Enter your credentials to play</Text>
      <TextInput style={styles.input} placeholder="Username" placeholderTextColor={COLORS.subtle} value={username} onChangeText={setUsername} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor={COLORS.subtle} value={password} onChangeText={setPassword} secureTextEntry />
      {!!error && <Text style={{ color: COLORS.love, textAlign: 'center', marginVertical: 8 }}>{error}</Text>}
      <TouchableOpacity style={styles.premiumButton} onPress={handleLogin}>
        <Text style={styles.premiumButtonText}>LOGIN</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setAuthView('register')} style={{ marginTop: 20 }}>
        <Text style={{ color: COLORS.subtle, textAlign: 'center' }}>Don't have an account? <Text style={{ color: COLORS.iris, fontWeight: 'bold' }}>Register</Text></Text>
      </TouchableOpacity>
    </View>
  );
};

const RegisterScreen = ({ setAuthView, onRegisterSuccess }) => {
  const [form, setForm] = useState({ username: '', password: '', email: '', date_of_birth: '', billing_address: '' });
  const [error, setError] = useState('');

  const handleRegister = async () => {
    playSound('click');
    const formData = new FormData();
    Object.keys(form).forEach(key => formData.append(key, form[key]));

    try {
      const resp = await apiFetch(`${API_URL}/register`, { method: 'POST', body: formData });
      if (resp.ok) {
        const data = await resp.json();
        onRegisterSuccess(data);
      } else { setError(await resp.text()); }
    } catch (err) { setError('Connection error'); }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={styles.header}>Join the Club</Text>
      <TextInput style={styles.input} placeholder="Username" placeholderTextColor={COLORS.subtle} onChangeText={t => setForm({ ...form, username: t })} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor={COLORS.subtle} onChangeText={t => setForm({ ...form, password: t })} secureTextEntry />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor={COLORS.subtle} onChangeText={t => setForm({ ...form, email: t })} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="DOB (YYYY-MM-DD)" placeholderTextColor={COLORS.subtle} onChangeText={t => setForm({ ...form, date_of_birth: t })} />
      <TextInput style={styles.input} placeholder="Billing Address" placeholderTextColor={COLORS.subtle} onChangeText={t => setForm({ ...form, billing_address: t })} />
      {!!error && <Text style={{ color: COLORS.love, textAlign: 'center', marginVertical: 8 }}>{error}</Text>}
      <TouchableOpacity style={styles.premiumButton} onPress={handleRegister}>
        <Text style={styles.premiumButtonText}>SIGN UP</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setAuthView('login')} style={{ marginTop: 20 }}>
        <Text style={{ color: COLORS.subtle, textAlign: 'center' }}>Already have an account? <Text style={{ color: COLORS.iris, fontWeight: 'bold' }}>Login</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const QRSetupScreen = ({ qrData, onComplete, username }) => {
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (otpCode.length !== 6) { setError('Please enter 6-digit code'); return; }
    const success = await onComplete(otpCode);
    if (!success) { setError('Invalid code. Try again.'); setOtpCode(''); }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={styles.header}>Set Up 2FA</Text>
      <Text style={[styles.subtleText, { marginBottom: 20 }]}>Scan this QR code with Google Authenticator</Text>
      <View style={[styles.glassCard, { alignItems: 'center' }]}>
        {qrData && qrData.qr_code && <Image source={{ uri: qrData.qr_code }} style={{ width: 250, height: 250, marginBottom: 20 }} />}
        <View style={{ backgroundColor: COLORS.overlay, padding: 12, borderRadius: 8, width: '100%', marginBottom: 16 }}>
          <Text style={{ fontSize: 10, color: COLORS.subtle, marginBottom: 4 }}>SECRET KEY</Text>
          <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, color: COLORS.text }}>{qrData?.secret}</Text>
        </View>
        <OTPInput value={otpCode} onChange={setOtpCode} />
        {!!error && <Text style={styles.errorText}>{error}</Text>}
      </View>
      <TouchableOpacity style={styles.premiumButton} onPress={handleVerify}><Text style={styles.premiumButtonText}>VERIFY & CONTINUE</Text></TouchableOpacity>
    </ScrollView>
  );
};

const OTPVerificationScreen = ({ username, onVerify, onBack }) => {
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (otpCode.length !== 6) { setError('Please enter 6-digit code'); return; }
    const success = await onVerify(otpCode);
    if (!success) { setError('Invalid code'); setOtpCode(''); }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 40 }}>
      <Text style={{ fontSize: 50, textAlign: 'center', marginBottom: 16 }}>🛡️</Text>
      <Text style={styles.headerLg}>Security Check</Text>
      <Text style={[styles.subtleText, { marginBottom: 40 }]}>Enter code from Google Authenticator</Text>
      <OTPInput value={otpCode} onChange={setOtpCode} />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
      <TouchableOpacity style={[styles.premiumButton, { marginTop: 20 }]} onPress={handleSubmit}><Text style={styles.premiumButtonText}>VERIFY</Text></TouchableOpacity>
      <TouchableOpacity style={{ marginTop: 20 }} onPress={onBack}><Text style={styles.subtleText}>Back to Login</Text></TouchableOpacity>
    </View>
  );
};

const HomeScreen = ({ userData, setActiveTab, onClaimBonus }) => (
  <ScrollView style={styles.contentArea}>
    <View style={{ marginBottom: 24 }}>
      <Text style={styles.header}>Hello, {userData.firstName}</Text>
      <Text style={styles.subtleText}>Current Balance: <Text style={{ color: COLORS.gold, fontWeight: 'bold', fontSize: 18 }}>{userData.balance}</Text></Text>
    </View>

    <Text style={styles.subHeader}>Popular Games</Text>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
      <TouchableOpacity style={[styles.glassCard, { flex: 1, marginRight: 10, alignItems: 'center' }]} onPress={() => setActiveTab('slots')}>
        <Text style={{ fontSize: 40, marginBottom: 8 }}>🎰</Text>
        <Text style={styles.text}>Slots</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.glassCard, { flex: 1, marginLeft: 10, alignItems: 'center' }]} onPress={() => setActiveTab('blackjack')}>
        <Text style={{ fontSize: 40, marginBottom: 8 }}>🃏</Text>
        <Text style={styles.text}>Blackjack</Text>
      </TouchableOpacity>
    </View>

    {userData.lastBonusClaim !== new Date().toISOString().slice(0, 10) && (
    <View style={styles.glassCard}>
      <Text style={styles.subHeader}>Daily Bonus</Text>
      <Text style={[styles.subtleText, { textAlign: 'left', marginBottom: 12 }]}>Claim your free daily $5 bonus chips!</Text>
      <TouchableOpacity style={styles.premiumButton} onPress={() => { playSound('click'); onClaimBonus(); }}>
        <Text style={styles.premiumButtonText}>CLAIM BONUS</Text>
      </TouchableOpacity>
    </View>
    )}
  </ScrollView>
);
const ITEM_HEIGHT = 120;
const SYMBOL_LIST = ['🍒', '🍋', '🔔', '💎', '7️⃣'];
const SYMBOL_MAP = { 1: '🍒', 2: '🍋', 3: '🔔', 4: '💎', 5: '7️⃣' };

// Single-animation slot reel: triggered by spinKey changing.
// Builds a long strip of random symbols ending on the target, then
// animates from top to bottom with easeOut so it decelerates to land.
const SlotReel = ({ targetResult, spinKey, index }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [strip, setStrip] = useState([SYMBOL_MAP[5] || '7️⃣']);
  const prevSpinKey = useRef(spinKey);

  useEffect(() => {
    if (spinKey !== prevSpinKey.current && targetResult !== null) {
      prevSpinKey.current = spinKey;
      const targetSymbol = SYMBOL_MAP[targetResult] || '❓';
      // Build a long strip of random symbols, ending on the target
      const totalItems = 25 + index * 8; // stagger: more items per reel
      const items = [];
      for (let i = 0; i < totalItems; i++) {
        items.push(SYMBOL_LIST[Math.floor(Math.random() * SYMBOL_LIST.length)]);
      }
      items.push(targetSymbol);
      setStrip(items);
      animatedValue.setValue(0);
      const finalOffset = -ITEM_HEIGHT * (items.length - 1);
      Animated.timing(animatedValue, {
        toValue: finalOffset,
        duration: 1800 + index * 500, // reel 0 ~1.8s, reel 1 ~2.3s, reel 2 ~2.8s
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [spinKey, targetResult]);

  return (
    <View style={[styles.glassCard, { width: 80, height: ITEM_HEIGHT, padding: 0, overflow: 'hidden', alignItems: 'center', backgroundColor: 'transparent' }]}>
      <Animated.View style={{ transform: [{ translateY: animatedValue }] }}>
        {strip.map((sym, i) => (
          <View key={i} style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 40 }}>{sym}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

const SlotsScreen = ({ user, setUser }) => {
  const [bet, setBet] = useState(10);
  const [wheelRow, setWheelRow] = useState([5, 5, 5]);
  const [spinning, setSpinning] = useState(false);
  const [payout, setPayout] = useState(0);
  const [spinKey, setSpinKey] = useState(0); // bumped each spin to trigger animation

  const handleSpin = async () => {
    if (bet <= 0) { Alert.alert('Invalid', 'Bet must be > 0'); return; }
    if (user.balance < bet) { Alert.alert('Invalid', 'Insufficient balance'); return; }
    setSpinning(true); setUser(prev => ({ ...prev, balance: (prev.balance || 0) - bet })); playSound('toggle');
    const formData = new FormData();
    formData.append('username', user.username); formData.append('password_hash', user.password_hash); formData.append('bet', bet.toString());
    try {
      const resp = await apiFetch(`${API_URL}/slots/play`, { method: 'POST', body: formData });
      if (!resp.ok) {
        Alert.alert('Error', await resp.text()); setUser(prev => ({ ...prev, balance: (prev.balance || 0) + bet })); setSpinning(false); return;
      }
      const data = await resp.json();
      // Set result + bump spinKey together → triggers the single animation
      setWheelRow(data.row || [5, 5, 5]);
      setSpinKey(prev => prev + 1);
      // Wait for the longest reel animation to finish (~2.8s for reel 2)
      setTimeout(() => {
        setPayout(data.payout); setSpinning(false);
        if (data.payout) { setUser(prev => ({ ...prev, balance: (prev.balance || 0) + data.payout })); playSound('win'); } else playSound('click');
      }, 3200);
    } catch (e) { setUser(prev => ({ ...prev, balance: (prev.balance || 0) + bet })); setSpinning(false); }
  };

  return (
    <ScrollView style={styles.contentArea}>
      <Text style={styles.header}>Slots</Text>
      <View style={[styles.glassCard, { height: 300, justifyContent: 'center', alignItems: 'center', borderColor: COLORS.rose, overflow: 'hidden' }]}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[0, 1, 2].map(i => <SlotReel key={i} index={i} targetResult={wheelRow[i]} spinKey={spinKey} />)}
        </View>
        <Text style={{ position: 'absolute', bottom: 10, color: COLORS.foam, fontWeight: 'bold' }}>JACKPOT: $1,240,500.00</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 }}>
        <View style={[styles.glassCard, { flex: 1, marginRight: 10, alignItems: 'center' }]}>
          <Text style={styles.subtleText}>BET</Text>
          <TextInput style={[styles.input, { width: '100%', textAlign: 'center' }]} keyboardType="numeric" value={bet.toString()} onChangeText={t => setBet(parseInt(t) || 0)} />
        </View>
        <View style={[styles.glassCard, { flex: 1, marginLeft: 10, alignItems: 'center' }]}>
          <Text style={styles.subtleText}>WIN</Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.foam }}>${payout}</Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.premiumButton, { height: 60, marginBottom: 40 }]} onPress={handleSpin} disabled={spinning}>
        <Text style={styles.premiumButtonText}>{spinning ? 'SPINNING...' : 'SPIN'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const BlackjackScreen = ({ user, setUser }) => {
  const [bet, setBet] = useState(10); const [gameId, setGameId] = useState(null);
  const [playerCards, setPlayerCards] = useState([]); const [dealerCards, setDealerCards] = useState([]);
  const [gameState, setGameState] = useState('idle'); const [payout, setPayout] = useState(0);
  const [loading, setLoading] = useState(false);

  const loop = async (action) => {
    if (!gameId) return;
    const formData = new FormData(); formData.append('game_id', gameId); formData.append('bet', bet.toString()); formData.append('username', user.username); formData.append('password_hash', user.password_hash);
    if (action) formData.append('action', action);
    try {
      const resp = await apiFetch(`${API_URL}/blackjack/loop`, { method: 'POST', body: formData });
      const data = await resp.json();
      if (Array.isArray(data)) { setPlayerCards(data); setGameState('active'); }
      else if (data.game_state) {
        setGameState(data.game_state); setPayout(data.returned_money); setPlayerCards(data.player_cards || []); setDealerCards(data.dealer_cards || []);
        if (data.returned_money) setUser(prev => ({ ...prev, balance: (prev.balance || 0) + data.returned_money }));
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (gameId && gameState === 'idle') loop(''); }, [gameId]);

  const startGame = async () => {
    if (bet <= 0) { Alert.alert('Invalid', 'Bet must be > 0'); return; }
    if (user.balance < bet) { Alert.alert('Invalid', 'Insufficient balance'); return; }
    setLoading(true); const formData = new FormData(); formData.append('username', user.username); formData.append('password_hash', user.password_hash); formData.append('bet', bet.toString());
    try {
      const resp = await apiFetch(`${API_URL}/blackjack/new_game`, { method: 'POST', body: formData });
      const data = await resp.json(); setGameId(data.game_id); setUser(prev => ({ ...prev, balance: (prev.balance || 0) - bet }));
      await loop('');
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const renderCards = (cards) => (
    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
      {cards.map((c, i) => <View key={i} style={[styles.glassCard, { width: 45, height: 65, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', padding: 0 }]}><Text style={{ color: 'black', fontWeight: 'bold' }}>{c}</Text></View>)}
    </View>
  );

  return (
    <ScrollView style={styles.contentArea}>
      <Text style={styles.header}>Blackjack</Text>
      {gameState === 'idle' && (
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.subtleText}>BET</Text>
          <TextInput style={[styles.input, { width: '100%', textAlign: 'center' }]} keyboardType="numeric" value={bet.toString()} onChangeText={t => setBet(parseInt(t) || 0)} />
          <TouchableOpacity style={styles.premiumButton} onPress={startGame} disabled={loading}><Text style={styles.premiumButtonText}>{loading ? 'Starting...' : 'Start Game'}</Text></TouchableOpacity>
        </View>
      )}
      {gameId && (
        <View>
          <Text style={[styles.subtleText, { marginBottom: 10 }]}>DEALER</Text>
          {renderCards(gameState === 'active' ? [] : dealerCards)}
          <Text style={[styles.subtleText, { marginVertical: 10 }]}>YOUR HAND</Text>
          {renderCards(playerCards)}
          {gameState === 'active' && (
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity style={[styles.premiumButton, { flex: 1, backgroundColor: COLORS.overlay }]} onPress={() => { playSound('click'); loop('hit'); }}><Text style={styles.text}>HIT</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.premiumButton, { flex: 1, backgroundColor: COLORS.love }]} onPress={() => { playSound('click'); loop('stand'); }}><Text style={styles.premiumButtonText}>STAND</Text></TouchableOpacity>
            </View>
          )}
          {gameState !== 'idle' && (
            <View style={{ marginTop: 20, alignItems: 'center' }}>
              <Text style={styles.header}>{gameState.toUpperCase()}</Text>
              <Text style={styles.text}>Payout: ${payout}</Text>
              {gameState !== 'active' && <TouchableOpacity style={styles.premiumButton} onPress={() => { setGameId(null); setPlayerCards([]); setDealerCards([]); setGameState('idle'); setPayout(0); }}><Text style={styles.premiumButtonText}>PLAY AGAIN</Text></TouchableOpacity>}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const AccountScreen = ({ user, setUser, onLogout }) => {
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) { Alert.alert('Invalid', 'Enter a valid amount'); return; }
    setDepositLoading(true);
    const formData = new FormData();
    formData.append('username', user.username);
    formData.append('password_hash', user.password_hash);
    formData.append('amount', amount.toString());
    try {
      const resp = await apiFetch(`${API_URL}/deposit`, { method: 'POST', body: formData });
      if (resp.ok) {
        const data = await resp.json();
        setUser(prev => ({ ...prev, balance: data.new_balance }));
        setShowDeposit(false); setDepositAmount('');
        Alert.alert('Success', `Deposited $${amount.toFixed(2)}`);
      } else { Alert.alert('Error', await resp.text()); }
    } catch (e) { Alert.alert('Error', 'Connection failed'); }
    setDepositLoading(false);
  };

  return (
    <ScrollView style={styles.contentArea}>
      <View style={{ alignItems: 'center', marginBottom: 30 }}>
        <View style={{ width: 80, height: 80, backgroundColor: COLORS.iris, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}><Text style={{ fontSize: 40 }}>👤</Text></View>
        <Text style={styles.header}>{user.username}</Text>
        <Text style={styles.subtleText}>Member since Jan 2024</Text>
      </View>
      <View style={[styles.glassCard, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View><Text style={{ fontSize: 12, color: COLORS.subtle }}>BALANCE</Text><Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.gold }}>${user.balance?.toFixed(2) || '0.00'}</Text></View>
        <TouchableOpacity style={styles.premiumButton} onPress={() => setShowDeposit(!showDeposit)}><Text style={styles.premiumButtonText}>DEPOSIT</Text></TouchableOpacity>
      </View>
      {showDeposit && (
        <View style={styles.glassCard}>
          <Text style={[styles.subtleText, { marginBottom: 8 }]}>DEPOSIT AMOUNT</Text>
          <TextInput style={[styles.input, { textAlign: 'center', fontSize: 20 }]} keyboardType="numeric" placeholder="100" placeholderTextColor={COLORS.subtle} value={depositAmount} onChangeText={setDepositAmount} />
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            {[50, 100, 500, 1000].map(amt => (
              <TouchableOpacity key={amt} style={{ flex: 1, backgroundColor: COLORS.overlay, padding: 10, borderRadius: 8, alignItems: 'center' }} onPress={() => setDepositAmount(amt.toString())}>
                <Text style={styles.text}>${amt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[styles.premiumButton, { backgroundColor: COLORS.foam }]} onPress={handleDeposit} disabled={depositLoading}>
            <Text style={styles.premiumButtonText}>{depositLoading ? 'PROCESSING...' : 'CONFIRM DEPOSIT'}</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity style={[styles.premiumButton, { backgroundColor: 'transparent', borderColor: COLORS.glassBorder, borderWidth: 1 }]} onPress={onLogout}><Text style={styles.text}>LOGOUT</Text></TouchableOpacity>
    </ScrollView>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [qrData, setQrData] = useState(null);
  const [pendingUsername, setPendingUsername] = useState('');

  const handleRegisterSuccess = async (registrationData) => {
    const formData = new FormData();
    formData.append('username', registrationData.username);
    formData.append('totp_secret', registrationData.totp_secret);
    try {
      const resp = await apiFetch(`${API_URL}/get_qr_code`, { method: 'POST', body: formData });
      if (resp.ok) {
        setQrData(await resp.json()); setPendingUsername(registrationData.username); setAuthView('qr_setup');
      }
    } catch (err) { console.error(err); }
  };

  const handleQRSetupComplete = async (otpCode) => {
    const formData = new FormData(); formData.append('username', pendingUsername); formData.append('otp_code', otpCode);
    try {
      const resp = await apiFetch(`${API_URL}/verify_otp`, { method: 'POST', body: formData });
      if (resp.ok) {
        setQrData(null); setAuthView('login'); alert('Registration successful! Please login.'); return true;
      }
      return false;
    } catch (err) { return false; }
  };

  const handleOTPVerify = async (otpCode) => {
    const formData = new FormData(); formData.append('username', pendingUsername); formData.append('otp_code', otpCode);
    try {
      const resp = await apiFetch(`${API_URL}/verify_otp`, { method: 'POST', body: formData });
      if (resp.ok) {
        setUser(await resp.json()); setPendingUsername(''); setAuthView('login'); return true;
      }
      return false;
    } catch (err) { return false; }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        {authView === 'login' && <LoginScreen setAuthView={setAuthView} onLogin={(u) => { if (typeof u === 'string') { setPendingUsername(u); setAuthView('otp_verify'); } else { setUser(u); } }} />}
        {authView === 'register' && <RegisterScreen setAuthView={setAuthView} onRegisterSuccess={handleRegisterSuccess} />}
        {authView === 'qr_setup' && <QRSetupScreen qrData={qrData} onComplete={handleQRSetupComplete} username={pendingUsername} />}
        {authView === 'otp_verify' && <OTPVerificationScreen username={pendingUsername} onVerify={handleOTPVerify} onBack={() => { setPendingUsername(''); setAuthView('login'); }} />}
      </SafeAreaView>
    );
  }

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
    } catch (err) { console.error(err); }
  };

  return (
    <SafeAreaView style={styles.container}>
      {(() => {
        switch (activeTab) {
          case 'slots': return <SlotsScreen user={user} setUser={setUser} />;
          case 'blackjack': return <BlackjackScreen user={user} setUser={setUser} />;
          case 'account': return <AccountScreen user={user} setUser={setUser} onLogout={() => setUser(null)} />;
          case 'home':
          default:
            return <HomeScreen userData={{ firstName: user.username, balance: `$${user.balance?.toFixed(2) || '0.00'}`, lastBonusClaim: user.last_bonus_claim }} setActiveTab={setActiveTab} onClaimBonus={handleClaimBonus} />;
        }
      })()}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </SafeAreaView>
  );
}
