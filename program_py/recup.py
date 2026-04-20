from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
import os

# --- Configuration ---
basedir = os.path.abspath(os.path.dirname(__file__))
# static_url_path='' permet de charger directement /css/ au lieu de /static/css/
app = Flask(__name__, template_folder='../html', static_folder='../', static_url_path='')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'races.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = 'cle_secrete_206rt' # Requis pour utiliser les sessions sécurisées

db = SQLAlchemy(app)

# --- Modèle de Données ---
class Race(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date,
            'name': self.name,
            'type': self.type
        }

def init_db():
    """Initialise automatiquement la base de données au lancement."""
    with app.app_context():
        db.create_all()
        if Race.query.first() is None:
            default_races = [
                Race(date="18 - 19 Avril", name="20ème Slalom des 3 Frontières", type="Slalom Régional"),
                Race(date="23 - 24 Mai", name="ASA Alsace de Steige", type="Course de Côte Régionale"),
                Race(date="20 - 21 Juin", name="6ème Slalom de Blamon", type="Slalom Régional"),
                Race(date="7 - 9 Août", name="41ème Rallye régional ASAPI", type="Rallye Régional"),
                Race(date="19 - 20 Septembre", name="20ème Rallye régional de l'Alsace Bossue", type="Rallye Régional"),
                Race(date="3 - 4 Octobre", name="13ème Slalom de Sausheim", type="Slalom Régional"),
                Race(date="10 - 11 Novembre", name="13ème Super Slalom de l'Anneau du Rhin", type="Slalom Régional"),
            ]
            db.session.bulk_save_objects(default_races)
            db.session.commit()

# --- Routes de l'application ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/equipe')
def equipe():
    return render_template('equipe.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/calendrier')
def calendrier():
    all_races = Race.query.order_by(Race.id).all()
    is_admin = session.get('is_admin', False)
    return render_template('calendrier.html', races=all_races, is_admin=is_admin)

# --- API Authentification (Mot de passe Admin) ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if data and data.get('password') == 'enzo2026': # Le mot de passe secret
        session['is_admin'] = True
        return jsonify({'success': True})
    return jsonify({'error': 'Mot de passe incorrect'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('is_admin', None)
    return jsonify({'success': True})

# --- API Endpoints ---
@app.route('/api/races', methods=['POST'])
def add_race():
    if not session.get('is_admin'):
        return jsonify({'error': 'Non autorisé'}), 403
    data = request.get_json()
    if not data or not all(k in data for k in ['name', 'date', 'type']):
        return jsonify({'error': 'Données manquantes'}), 400
    new_race = Race(name=data['name'], date=data['date'], type=data['type'])
    db.session.add(new_race)
    db.session.commit()
    return jsonify(new_race.to_dict()), 201

@app.route('/api/races/<int:id>', methods=['DELETE'])
def delete_race(id):
    if not session.get('is_admin'):
        return jsonify({'error': 'Non autorisé'}), 403
    race_to_delete = Race.query.get_or_404(id)
    db.session.delete(race_to_delete)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Course supprimée'}), 200

if __name__ == '__main__':
    init_db() # Exécute la création de la base de données automatiquement !
    app.run(debug=True, port=5001)
