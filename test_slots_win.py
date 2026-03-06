import sqlite3
from backend import api
client = api.app.test_client()
conn = sqlite3.connect('casino.db')
conn.row_factory = sqlite3.Row
user = conn.execute('SELECT username, password_hash, balance FROM users WHERE username=?', ('alice',)).fetchone()
print('Initial balance', user['balance'])

bet = 10
wins = 0
for i in range(20):
    # deduct bet locally? frontend does before request, but our test simulates UI flow.
    # We'll just call backend directly, it will deduct bet.
    resp = client.post('/slots/play', data={'username':user['username'], 'password_hash':user['password_hash'], 'bet':bet})
    data = resp.get_json()
    payout = data['payout']
    print('Round', i, 'payout', payout)
    if payout:
        wins += 1
        break
print('Wins', wins)
# Check final balance
final_bal = conn.execute('SELECT balance FROM users WHERE username=?', (user['username'],)).fetchone()[0]
print('Final balance', final_bal)
