import sqlite3
from backend import api
client = api.app.test_client()
# get alice hash and set balance high
conn = sqlite3.connect('casino.db')
conn.row_factory = sqlite3.Row
row = conn.execute('SELECT password_hash FROM users WHERE username=?', ('alice',)).fetchone()
hash_val = row['password_hash']
# Ensure balance 100
conn.execute('UPDATE users SET balance=? WHERE username=?', (100, 'alice'))
conn.commit()
# Play slots bet 20
resp = client.post('/slots/play', data={'username':'alice','password_hash':hash_val,'bet':20})
print('Slots resp:', resp.status_code, resp.get_data(as_text=True))
# Check balance after
bal = conn.execute('SELECT balance FROM users WHERE username=?', ('alice',)).fetchone()[0]
print('Balance after slots:', bal)
