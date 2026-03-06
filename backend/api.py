import flask
import sqlite3
import datetime
import pyotp
import qrcode
import io
import base64
from Crypto.Hash.SHA3_512 import SHA3_512_Hash
from flask_cors import CORS
import random


class Blackjack:
    # self.kartenself.werte
    def __init__(self):
        self.name = "Blackjack"
        self.description = "Blackjack ist ein beliebtes Karten-Glücksspiel, das an einem halbkreisförmigen Tisch gespielt wird. Ziel des Spiels ist es, mit zwei oder mehr self.karten näher an 21 Punkten heranzukommen als der Croupier, ohne den Wert von 21 zu überschreiten."
        self.max_players = 1
        self.max_bet = 500

        self.deck = list()
        self.dealer_hand = list()
        self.player_hand = list()

        self.karten = [
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "J",
            "Q",
            "K",
            "A",
        ] * 4
        random.shuffle(self.karten)

        self.werte = {
            "2": 2,
            "3": 3,
            "4": 4,
            "5": 5,
            "6": 6,
            "7": 7,
            "8": 8,
            "9": 9,
            "10": 10,
            "J": 10,
            "Q": 10,
            "K": 10,
            "A": 11,
        }

    def reset_cards(self):
        self.karten = [
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "J",
            "Q",
            "K",
            "A",
        ] * 4
        random.shuffle(self.karten)

    def kartenwert(self, hand):
        # Wert einer Hand
        wert = sum(self.werte[karte] for karte in hand)
        # Asse von 11 auf 1, falls nötig
        anzahl_asse = hand.count("A")
        while wert > 21 and anzahl_asse > 0:
            wert -= 10
            anzahl_asse -= 1
        return wert

    def karte_ziehen(self):
        c = self.karten[0]
        self.karten.pop(0)
        return c

    def game_loop(self, data: dict, action=""):
        bet = int(data["bet"])
        player_cards = data["player_cards"]
        dealer_cards = data["dealer_cards"]

        if player_cards == [] and dealer_cards == []:
            data["player_cards"] = [self.karte_ziehen(), self.karte_ziehen()]
            data["dealer_cards"] = [self.karte_ziehen(), self.karte_ziehen()]
            return {"game_state": "active", "returned_money": 0}
        elif isinstance(player_cards, list) and isinstance(dealer_cards, list):
            if action == "hit":
                player_cards.append(self.karte_ziehen())
                if self.kartenwert(player_cards) > 21:
                    return {
                        "game_state": "lost",
                        "returned_money": 0,
                        "player_cards": player_cards,
                        "dealer_cards": dealer_cards,
                    }

                else:
                    return {"game_state": "active", "returned_money": 0}

            elif action == "stand":
                while self.kartenwert(dealer_cards) < 17:
                    dealer_cards.append(self.karte_ziehen())

                player_points = self.kartenwert(player_cards)
                dealer_points = self.kartenwert(dealer_cards)

                if dealer_points > 21 or player_points > dealer_points:
                    return {
                        "game_state": "won",
                        "returned_money": bet * 2,
                        "player_cards": player_cards,
                        "dealer_cards": dealer_cards,
                    }
                elif player_points == dealer_points:
                    return {
                        "game_state": "draw",
                        "returned_money": bet,
                        "player_cards": player_cards,
                        "dealer_cards": dealer_cards,
                    }
                else:
                    return {
                        "game_state": "lost",
                        "returned_money": 0,
                        "player_cards": player_cards,
                        "dealer_cards": dealer_cards,
                    }

    def play(self, bet):
        print("Willkommen bei Blackjack!")

        self.reset_cards()

        # Startself.karten
        spieler = [self.karte_ziehen(), self.karte_ziehen()]
        dealer = [self.karte_ziehen(), self.karte_ziehen()]

        print(f"Deine Karten: {spieler} (Wert: {self.kartenwert(spieler)})")
        print(f"Karte des Dealers: {dealer[0]}")

        # Spielerzug
        while True:
            aktion = input("Möchtest du eine Karte ziehen? (j/n): ").lower()
            if aktion == "j":
                spieler.append(self.karte_ziehen())
                print(f"Du ziehst: {spieler[-1]}")
                print(f"Deine Karten: {spieler} (Wert: {self.kartenwert(spieler)})")
                if self.kartenwert(spieler) > 21:
                    print("Du bist über 21! Verloren.")
                    return
            else:
                break

        # Dealerzug
        print(f"Dealer deckt auf: {dealer} (Wert: {self.kartenwert(dealer)})")
        while self.kartenwert(dealer) < 17:
            dealer.append(self.karte_ziehen())
            print(f"Dealer zieht: {dealer[-1]}")
            print(f"Dealer hat jetzt: {dealer} (Wert: {self.kartenwert(dealer)})")

        # Ergebnis
        spieler_wert = self.kartenwert(spieler)
        dealer_wert = self.kartenwert(dealer)

        if dealer_wert > 21 or spieler_wert > dealer_wert:
            return bet * 2
        elif spieler_wert == dealer_wert:
            return 0
        else:
            return 0


app = flask.Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

games = []


@app.route("/")
def index():
    return "this is a casino api. don`t try to access it using a normal browser."


@app.route("/login", methods=["POST"])
def login():
    with sqlite3.connect("casino.db") as conn:
        conn.row_factory = sqlite3.Row
        form = flask.request.form.to_dict()

        username = form.get("username")
        password = form.get("password")

        if not username or not password:
            return "Username and password required", 400

        password_hash = SHA3_512_Hash(
            password.encode(), update_after_digest=True
        ).hexdigest()

        try:
            cur = conn.execute(
                "SELECT * FROM users WHERE username = ? AND password_hash = ?",
                (username, password_hash),
            )
            user = cur.fetchone()
            if user:
                # Return success but indicate 2FA is required
                return {
                    "success": True,
                    "requires_2fa": True,
                    "username": username,
                }, 200
            else:
                return "Wrong username or password!", 401
        except sqlite3.Error as e:
            return str(e), 500


@app.route("/verify_otp", methods=["POST"])
def verify_otp():
    with sqlite3.connect("casino.db") as conn:
        conn.row_factory = sqlite3.Row
        form = flask.request.form.to_dict()

        username = form.get("username")
        otp_code = form.get("otp_code")

        if not username or not otp_code:
            return "Username and OTP code required", 400

        try:
            cur = conn.execute("SELECT * FROM users WHERE username = ?", (username,))
            user = cur.fetchone()

            if user and user["totp_secret"]:
                totp = pyotp.TOTP(user["totp_secret"])
                if totp.verify(otp_code, valid_window=1):
                    user_dict = dict(user)
                    return user_dict, 200
                else:
                    return "Invalid OTP code", 401
            else:
                return "User not found or 2FA not set up", 404
        except Exception as e:
            return str(e), 500


@app.route("/get_qr_code", methods=["POST"])
def get_qr_code():
    form = flask.request.form.to_dict()
    username = form.get("username")
    totp_secret = form.get("totp_secret")

    if not username or not totp_secret:
        return "Username and TOTP secret required", 400

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
    img.save(buffer, format="PNG")
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.getvalue()).decode()

    return {
        "qr_code": f"data:image/png;base64,{img_base64}",
        "secret": totp_secret,
    }, 200


@app.route("/register", methods=["POST"])
def register():
    with sqlite3.connect("casino.db") as conn:
        form = flask.request.form.to_dict()

        try:
            dob_str = form.get("date_of_birth")
            if not dob_str:
                return "Date of birth is required", 400

            dob = datetime.datetime.strptime(dob_str, "%Y-%m-%d").date()
            today = datetime.date.today()
            age = (
                today.year
                - dob.year
                - ((today.month, today.day) < (dob.month, dob.day))
            )
            if age < 18:
                return "You must be at least 18 years old to register.", 403

            # Generate TOTP secret for 2FA
            totp_secret = pyotp.random_base32()

            cur = conn.execute(
                """INSERT INTO users
                       (username, password_hash, email, date_of_birth, billing_address, totp_secret)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    form["username"],
                    SHA3_512_Hash(
                        form["password"].encode(), update_after_digest=True
                    ).hexdigest(),
                    form["email"],
                    form["date_of_birth"],
                    form["billing_address"],
                    totp_secret,
                ),
            )
            return {
                "success": True,
                "user_id": cur.lastrowid,
                "totp_secret": totp_secret,
                "username": form["username"],
            }, 201
        except sqlite3.IntegrityError:
            return "Username already exists", 409
        except Exception as e:
            return str(e), 400


@app.route("/user_info", methods=["POST"])
def get_user_info():
    with sqlite3.connect("casino.db") as conn:
        conn.row_factory = sqlite3.Row
        form = flask.request.form.to_dict()

        username = form.get("username")
        password_hash = form.get("password_hash")

        cur = conn.execute(
            """SELECT * FROM users WHERE username = ? AND password_hash = ?""",
            (username, password_hash),
        )
        user = cur.fetchone()
        if user:
            return dict(user)
        return "Not found", 404


@app.route("/deposit", methods=["POST"])
def deposit():
    with sqlite3.connect("casino.db") as conn:
        conn.row_factory = sqlite3.Row
        form = flask.request.form.to_dict()

        username = form.get("username")
        password_hash = form.get("password_hash")
        amount = float(form.get("amount", 0))

        if amount <= 0:
            return "Invalid amount", 400

        cur = conn.execute(
            "UPDATE users SET balance = balance + ? WHERE username = ? AND password_hash = ?",
            (amount, username, password_hash),
        )
        if cur.rowcount == 0:
            return "Unauthorized", 401

        cur = conn.execute("SELECT balance FROM users WHERE username = ?", (username,))
        new_balance = cur.fetchone()[0]
        return {"success": True, "new_balance": new_balance}


@app.route("/delete_account", methods=["POST"])
def delete_account():
    with sqlite3.connect("casino.db") as conn:
        form = flask.request.form.to_dict()
        username = form.get("username")
        password_hash = form.get("password_hash")

        cur = conn.execute(
            "DELETE FROM users WHERE username = ? AND password_hash = ?",
            (username, password_hash),
        )
        if cur.rowcount > 0:
            return {"success": True}
        return "Unauthorized", 401


@app.route("/claim_bonus", methods=["POST"])
def claim_bonus():
    with sqlite3.connect("casino.db") as conn:
        conn.row_factory = sqlite3.Row
        form = flask.request.form.to_dict()

        username = form.get("username")
        password_hash = form.get("password_hash")

        cur = conn.execute(
            "SELECT * FROM users WHERE username = ? AND password_hash = ?",
            (username, password_hash),
        )
        user = cur.fetchone()

        if user:
            new_balance = user["balance"] + 0.5
            conn.execute(
                "UPDATE users SET balance = ? WHERE id = ?", (new_balance, user["id"])
            )
            return {"success": True, "new_balance": new_balance}, 200
        return "Unauthorized", 401


@app.route("/update_email", methods=["POST"])
def update_email():
    with sqlite3.connect("casino.db") as conn:
        conn.row_factory = sqlite3.Row
        form = flask.request.form.to_dict()

        username = form.get("username")
        otp_code = form.get("otp_code")
        new_email = form.get("new_email")

        if not otp_code or not new_email:
            return "OTP code and new email are required", 400

        cur = conn.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cur.fetchone()

        if user and user["totp_secret"]:
            totp = pyotp.TOTP(user["totp_secret"])
            if totp.verify(otp_code, valid_window=1):
                conn.execute(
                    "UPDATE users SET email = ? WHERE id = ?", (new_email, user["id"])
                )
                return {"success": True, "new_email": new_email}, 200
        return "Unauthorized", 401


@app.route("/update_billing", methods=["POST"])
def update_billing():
    with sqlite3.connect("casino.db") as conn:
        conn.row_factory = sqlite3.Row
        form = flask.request.form.to_dict()

        username = form.get("username")
        otp_code = form.get("otp_code")
        new_billing = form.get("new_billing")

        if not otp_code or not new_billing:
            return "OTP code and new billing address are required", 400

        cur = conn.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cur.fetchone()

        if user and user["totp_secret"]:
            totp = pyotp.TOTP(user["totp_secret"])
            if totp.verify(otp_code, valid_window=1):
                conn.execute(
                    "UPDATE users SET billing_address = ? WHERE id = ?",
                    (new_billing, user["id"]),
                )
                return {"success": True, "new_billing": new_billing}, 200
        return "Unauthorized", 401


@app.route("/blackjack/new_game", methods=["POST"])
def play_blackjack():
    form = flask.request.form.to_dict()
    # Expected fields: username, password_hash, bet
    username = form.get("username")
    password_hash = form.get("password_hash")
    bet = int(form.get("bet", 0))

    if not username or not password_hash:
        return "Username and password required", 400

    # Verify user and balance
    with sqlite3.connect("casino.db") as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.execute(
            "SELECT * FROM users WHERE username = ? AND password_hash = ?",
            (username, password_hash),
        )
        user = cur.fetchone()
        if not user:
            return "Unauthorized", 401
        if user["balance"] < bet:
            return "Insufficient balance", 400
        # Deduct bet
        new_balance = user["balance"] - bet
        conn.execute(
            "UPDATE users SET balance = ? WHERE id = ?", (new_balance, user["id"])
        )

    game = Blackjack()
    if len(games) == 0:
        game_id = 0
    else:
        game_id = games[len(games) - 1]["id"] + 1

    # Store bet and user id for later payout
    games.append(
        {
            "id": game_id,
            "type": "blackjack",
            "game": game,
            "player_cards": [],
            "dealer_cards": [],
            "bet": bet,
            "user_id": user["id"],
        }
    )

    return {"game_id": game_id}


@app.route("/blackjack/loop", methods=["POST"])
def blackjack_loop():
    form = flask.request.form.to_dict()
    # Expected fields: username, password_hash, game_id, optional action
    username = form.get("username")
    password_hash = form.get("password_hash")
    if not username or not password_hash:
        return "Username and password required", 400

    data = games[int(form["game_id"])]
    game = data["game"]

    # Verify user and match stored user_id
    with sqlite3.connect("casino.db") as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.execute(
            "SELECT id FROM users WHERE username = ? AND password_hash = ?",
            (username, password_hash),
        )
        user_row = cur.fetchone()
        if not user_row:
            return "Unauthorized", 401
        if user_row["id"] != data.get("user_id"):
            return "User mismatch", 403

    try:
        action = form["action"]
    except KeyError:
        action = ""

    state = game.game_loop(data, action)
    games[int(form["game_id"])] = data

    if state["game_state"] == "active":
        return data["player_cards"]
    else:
        # Add payout (returned_money) to user's balance
        payout = state.get("returned_money", 0)
        if payout:
            user_id = data.get("user_id")
            if user_id is not None:
                with sqlite3.connect("casino.db") as conn:
                    conn.row_factory = sqlite3.Row
                    cur = conn.execute(
                        "SELECT balance FROM users WHERE id = ?", (user_id,)
                    )
                    current_balance = cur.fetchone()[0]
                    new_balance = current_balance + payout
                    conn.execute(
                        "UPDATE users SET balance = ? WHERE id = ?",
                        (new_balance, user_id),
                    )
        return state


@app.route("/slots/play", methods=["POST"])
def play_slots():
    form = flask.request.form.to_dict()
    # Expected fields: username, password_hash, bet
    username = form.get("username")
    password_hash = form.get("password_hash")
    bet = int(form.get("bet", 0))

    if not username or not password_hash:
        return "Username and password required", 400

    # Verify user and balance
    with sqlite3.connect("casino.db") as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.execute(
            "SELECT * FROM users WHERE username = ? AND password_hash = ?",
            (username, password_hash),
        )
        user = cur.fetchone()
        if not user:
            return "Unauthorized", 401
        if user["balance"] < bet:
            return "Insufficient balance", 400
        # Deduct bet
        new_balance = user["balance"] - bet
        conn.execute(
            "UPDATE users SET balance = ? WHERE id = ?", (new_balance, user["id"])
        )

    row = [random.randint(1, 5) for i in range(3)]

    payout = 0
    winning_symbol = None

    if row[0] == row[1] == row[2]:
        winning_symbol = row[0]

    if not winning_symbol:
        final_payout = 0
    else:
        if winning_symbol == 1:
            payout = bet * 6
        elif winning_symbol == 2:
            payout = bet * 7
        elif winning_symbol == 3:
            payout = bet * 9
        elif winning_symbol == 4:
            payout = bet * 11
        elif winning_symbol == 5:
            payout = bet * 15
        final_payout = payout

    # Add payout to balance
    with sqlite3.connect("casino.db") as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.execute("SELECT balance FROM users WHERE id = ?", (user["id"],))
        current_balance = cur.fetchone()[0]
        updated_balance = current_balance + final_payout
        conn.execute(
            "UPDATE users SET balance = ? WHERE id = ?", (updated_balance, user["id"])
        )

    # Return both payout and the row numbers for UI rendering
    return {"payout": final_payout, "row": row}


if __name__ == "__main__":
    app.run(debug=True, port=5000)
