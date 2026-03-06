import sqlite3
from backend import api
client = api.app.test_client()
# get alice info
conn = sqlite3.connect('casino.db')
conn.row_factory = sqlite3.Row
row = conn.execute('SELECT username, password_hash, balance FROM users WHERE username=?', ('alice',)).fetchone()
user = {'username': row['username'], 'password_hash': row['password_hash'], 'balance': row['balance']}
print('Initial user balance', user['balance'])
bet = 10
# start game
resp = client.post('/blackjack/new_game', data={'username':user['username'],'password_hash':user['password_hash'],'bet':bet})
print('new_game response', resp.status_code, resp.get_json())
# UI deduct locally
user['balance'] = (user['balance'] or 0) - bet
print('After UI deduction balance', user['balance'])
# loop stand
game_id = resp.get_json()['game_id']
resp2 = client.post('/blackjack/loop', data={'game_id':game_id,'bet':bet,'username':user['username'],'password_hash':user['password_hash'],'action':'stand'})
print('loop response', resp2.get_json())
data = resp2.get_json()
if data.get('returned_money'):
    user['balance'] = (user['balance'] or 0) + data['returned_money']
print('Final UI balance', user['balance'])
# DB final
final_db = conn.execute('SELECT balance FROM users WHERE username=?', (user['username'],)).fetchone()[0]
print('DB final balance', final_db)
