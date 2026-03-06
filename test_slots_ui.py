import sqlite3
from backend import api
client = api.app.test_client()
conn = sqlite3.connect('casino.db')
conn.row_factory = sqlite3.Row
user = conn.execute('SELECT username, password_hash, balance FROM users WHERE username=?', ('alice',)).fetchone()
bet=10
resp = client.post('/slots/play', data={'username':user['username'],'password_hash':user['password_hash'],'bet':bet})
print('Response JSON:', resp.get_json())
# Map numbers to symbols
symbol_map = {1:'💎',2:'🍒',3:'🔔',4:'🍋',5:'7️⃣'}
row = resp.get_json().get('row')
if row:
    symbols = [symbol_map[n] for n in row]
    print('Symbols:', symbols)
