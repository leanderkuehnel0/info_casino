import sqlite3
from backend import api
client = api.app.test_client()
# Get alice's password_hash
conn = sqlite3.connect('casino.db')
conn.row_factory = sqlite3.Row
row = conn.execute('SELECT password_hash FROM users WHERE username=?', ('alice',)).fetchone()
password_hash = row['password_hash']
# Attempt to start blackjack with bet 10 (balance 0) should fail insufficient balance
resp = client.post('/blackjack/new_game', data={'username':'alice','password_hash':password_hash,'bet':10})
print('Blackjack start (insufficient):', resp.status_code, resp.get_data(as_text=True))
# Update alice balance manually for test
conn.execute('UPDATE users SET balance=? WHERE username=?', (100, 'alice'))
conn.commit()
# Now start game
resp2 = client.post('/blackjack/new_game', data={'username':'alice','password_hash':password_hash,'bet':10})
print('Blackjack start (ok):', resp2.status_code, resp2.get_data(as_text=True))
# Extract game_id
if resp2.status_code == 200:
    game_id = resp2.get_json()['game_id']
    # hit
    resp3 = client.post('/blackjack/loop', data={'game_id':game_id,'bet':10,'username':'alice','password_hash':password_hash,'action':'hit'})
    print('Hit response:', resp3.status_code, resp3.get_data(as_text=True))
    # stand
    resp4 = client.post('/blackjack/loop', data={'game_id':game_id,'bet':10,'username':'alice','password_hash':password_hash,'action':'stand'})
    print('Stand response:', resp4.status_code, resp4.get_data(as_text=True))
    # Check final balance
    bal = conn.execute('SELECT balance FROM users WHERE username=?', ('alice',)).fetchone()[0]
    print('Final balance:', bal)
