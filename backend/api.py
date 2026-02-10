import flask
import sqlite3
import datetime
import pyotp
import qrcode
import io
import base64
from Crypto.Hash.SHA3_512 import SHA3_512_Hash
from flask_cors import CORS

app = flask.Flask(__name__)
CORS(app) # Enable CORS for frontend communication

@app.route('/')
def index():
    return 'this is a casino api. don`t try to access it using a normal browser.'

@app.route('/login', methods=['POST'])
def login():
    with sqlite3.connect('casino.db') as conn:
        conn.row_factory = sqlite3.Row
        form = flask.request.form.to_dict()

        username = form.get('username')
        password = form.get('password')
        
        if not username or not password:
            return 'Username and password required', 400

        password_hash = SHA3_512_Hash(password.encode(), update_after_digest=True).hexdigest()

        try:
            cur = conn.execute('SELECT * FROM users WHERE username = ? AND password_hash = ?', (username, password_hash))
            user = cur.fetchone()
            if user:
                # Return success but indicate 2FA is required
                return {"success": True, "requires_2fa": True, "username": username}, 200
            else:
                return 'Wrong username or password!', 401
        except sqlite3.Error as e:
            return str(e), 500

@app.route('/verify_otp', methods=['POST'])
def verify_otp():
    with sqlite3.connect('casino.db') as conn:
        conn.row_factory = sqlite3.Row
        form = flask.request.form.to_dict()
        
        username = form.get('username')
        otp_code = form.get('otp_code')
        
        if not username or not otp_code:
            return 'Username and OTP code required', 400
        
        try:
            cur = conn.execute('SELECT * FROM users WHERE username = ?', (username,))
            user = cur.fetchone()
            
            if user and user['totp_secret']:
                totp = pyotp.TOTP(user['totp_secret'])
                if totp.verify(otp_code, valid_window=1):
                    user_dict = dict(user)
                    return user_dict, 200
                else:
                    return 'Invalid OTP code', 401
            else:
                return 'User not found or 2FA not set up', 404
        except Exception as e:
            return str(e), 500

@app.route('/get_qr_code', methods=['POST'])
def get_qr_code():
    form = flask.request.form.to_dict()
    username = form.get('username')
    totp_secret = form.get('totp_secret')
    
    if not username or not totp_secret:
        return 'Username and TOTP secret required', 400
    
    # Generate provisioning URI for Google Authenticator
    totp = pyotp.TOTP(totp_secret)
    provisioning_uri = totp.provisioning_uri(name=username, issuer_name="Casino Demo")
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64 for easy transmission
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return {"qr_code": f"data:image/png;base64,{img_base64}", "secret": totp_secret}, 200

@app.route('/register', methods=['POST'])
def register():
    with sqlite3.connect('casino.db') as conn:
        form = flask.request.form.to_dict()

        try:
            dob_str = form.get('date_of_birth')
            if not dob_str:
                return 'Date of birth is required', 400
            
            dob = datetime.datetime.strptime(dob_str, '%Y-%m-%d').date()
            today = datetime.date.today()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            if age < 18:
                return 'You must be at least 18 years old to register.', 403

            # Generate TOTP secret for 2FA
            totp_secret = pyotp.random_base32()

            cur = conn.execute(
                '''INSERT INTO users
                       (username, password_hash, email, date_of_birth, billing_address, totp_secret)
                   VALUES (?, ?, ?, ?, ?, ?)''',
                (
                    form['username'],
                    SHA3_512_Hash(form['password'].encode(), update_after_digest=True).hexdigest(),
                    form['email'],
                    form['date_of_birth'],
                    form['billing_address'],
                    totp_secret
                )
            )
            return {"success": True, "user_id": cur.lastrowid, "totp_secret": totp_secret, "username": form['username']}, 201
        except sqlite3.IntegrityError:
            return 'Username already exists', 409
        except Exception as e:
            return str(e), 400

@app.route('/user_info', methods=['POST'])
def get_user_info():
    with sqlite3.connect('casino.db') as conn:
        conn.row_factory = sqlite3.Row
        form = flask.request.form.to_dict()

        username = form.get('username')
        password_hash = form.get('password_hash')

        cur = conn.execute('''SELECT * FROM users WHERE username = ? AND password_hash = ?''', (username, password_hash))
        user = cur.fetchone()
        if user:
            return dict(user)
        return 'Not found', 404

@app.route('/deposit', methods=['POST'])
def deposit():
    with sqlite3.connect('casino.db') as conn:
        conn.row_factory = sqlite3.Row
        form = flask.request.form.to_dict()
        
        username = form.get('username')
        password_hash = form.get('password_hash')
        amount = float(form.get('amount', 0))
        
        if amount <= 0:
            return 'Invalid amount', 400

        cur = conn.execute('UPDATE users SET balance = balance + ? WHERE username = ? AND password_hash = ?', (amount, username, password_hash))
        if cur.rowcount == 0:
            return 'Unauthorized', 401

        cur = conn.execute('SELECT balance FROM users WHERE username = ?', (username,))
        new_balance = cur.fetchone()[0]
        return {"success": True, "new_balance": new_balance}

@app.route('/delete_account', methods=['POST'])
def delete_account():
    with sqlite3.connect('casino.db') as conn:
        form = flask.request.form.to_dict()
        username = form.get('username')
        password_hash = form.get('password_hash')
        
        cur = conn.execute('DELETE FROM users WHERE username = ? AND password_hash = ?', (username, password_hash))
        if cur.rowcount > 0:
            return {"success": True}
        return 'Unauthorized', 401

@app.route('/claim_bonus', methods=['POST'])
def claim_bonus():
    with sqlite3.connect('casino.db') as conn:
        conn.row_factory = sqlite3.Row
        form = flask.request.form.to_dict()
        
        username = form.get('username')
        password_hash = form.get('password_hash')
        
        cur = conn.execute('SELECT * FROM users WHERE username = ? AND password_hash = ?', (username, password_hash))
        user = cur.fetchone()
        
        if user:
            new_balance = user['balance'] + 0.5
            conn.execute('UPDATE users SET balance = ? WHERE id = ?', (new_balance, user['id']))
            return {"success": True, "new_balance": new_balance}, 200
        return 'Unauthorized', 401

@app.route('/update_email', methods=['POST'])
def update_email():
    with sqlite3.connect('casino.db') as conn:
        conn.row_factory = sqlite3.Row
        form = flask.request.form.to_dict()
        
        username = form.get('username')
        otp_code = form.get('otp_code')
        new_email = form.get('new_email')
        
        if not otp_code or not new_email:
            return 'OTP code and new email are required', 400
        
        cur = conn.execute('SELECT * FROM users WHERE username = ?', (username,))
        user = cur.fetchone()
        
        if user and user['totp_secret']:
            totp = pyotp.TOTP(user['totp_secret'])
            if totp.verify(otp_code, valid_window=1):
                conn.execute('UPDATE users SET email = ? WHERE id = ?', (new_email, user['id']))
                return {"success": True, "new_email": new_email}, 200
        return 'Unauthorized', 401

@app.route('/update_billing', methods=['POST'])
def update_billing():
    with sqlite3.connect('casino.db') as conn:
        conn.row_factory = sqlite3.Row
        form = flask.request.form.to_dict()
        
        username = form.get('username')
        otp_code = form.get('otp_code')
        new_billing = form.get('new_billing')
        
        if not otp_code or not new_billing:
            return 'OTP code and new billing address are required', 400
        
        cur = conn.execute('SELECT * FROM users WHERE username = ?', (username,))
        user = cur.fetchone()
        
        if user and user['totp_secret']:
            totp = pyotp.TOTP(user['totp_secret'])
            if totp.verify(otp_code, valid_window=1):
                conn.execute('UPDATE users SET billing_address = ? WHERE id = ?', (new_billing, user['id']))
                return {"success": True, "new_billing": new_billing}, 200
        return 'Unauthorized', 401

if __name__ == '__main__':
    app.run(debug=True, port=5000)
