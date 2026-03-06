import sqlite3
from backend import api
client = api.app.test_client()
# Register a user
resp = client.post('/register', data={
    'username':'alice',
    'password':'secret',
    'email':'alice@example.com',
    'date_of_birth':'1990-01-01',
    'billing_address':'123 St'
})
print('Register status', resp.status_code, resp.get_data(as_text=True))
# Retrieve password_hash from DB
conn = sqlite3.connect('backend/casino.db')
conn.row_factory = sqlite3.Row
cur = conn.execute('SELECT password_hash FROM users WHERE username=?', ('alice',))
row = cur.fetchone()
print('Password hash:', row['password_hash'])
# Test blackjack new_game
resp2 = client.post('/blackjack/new_game', data={'username':'alice','password_hash':row['password_hash'],'bet':10})
print('Blackjack new_game status', resp2.status_code, resp2.get_data(as_text=True))
