from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os

# --- Configuration ---
basedir = os.path.abspath(os.path.dirname(__file__))
# static_url_path='' permet de charger directement /css/ au lieu de /static/css/
app = Flask(__name__, template_folder='../html', static_folder='../', static_url_path='')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'races.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# Sécurité : Utiliser une variable d'environnement en production
app.secret_key = os.environ.get('SECRET_KEY', 'cle_secrete_206rt_dev')

# --- Configuration de Sécurité ---
app.config['SESSION_COOKIE_HTTPONLY'] = True # Empêche l'accès au cookie via JavaScript (protection XSS)
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax' # Protection contre les failles CSRF
# app.config['SESSION_COOKIE_SECURE'] = True # À DÉCOMMENTER EN PRODUCTION : Force le cookie à n'être envoyé qu'en HTTPS

db = SQLAlchemy(app)

# --- Configuration du Rate Limiting ---
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"], # Limites globales par défaut
    storage_uri="memory://" # Stocke le comptage en mémoire vive (idéal pour commencer)
)

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

@app.route('/index.html')
def index_redirect():
    return redirect(url_for('index'), code=301) # 301 = Redirection Permanente (Bon pour le SEO)

@app.route('/equipe')
def equipe():
    return render_template('equipe.html')

@app.route('/equipe.html')
def equipe_redirect():
    return redirect(url_for('equipe'), code=301)

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/contact.html')
def contact_redirect():
    return redirect(url_for('contact'), code=301)

@app.route('/calendrier')
def calendrier():
    all_races = Race.query.order_by(Race.id).all()
    is_admin = session.get('is_admin', False)
    return render_template('calendrier.html', races=all_races, is_admin=is_admin)

@app.route('/calendrier.html')
def calendrier_redirect():
    return redirect(url_for('calendrier'), code=301)

# --- SEO : Sitemap et Robots.txt ---
@app.route('/sitemap.xml')
def sitemap():
    pages = ['index', 'equipe', 'contact', 'calendrier']
    base_url = request.host_url[:-1] # Récupère l'URL de base (ex: https://ton-site.com)
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for page in pages:
        xml += f'  <url>\n    <loc>{base_url}{url_for(page)}</loc>\n  </url>\n'
    xml += '</urlset>'
    return xml, 200, {'Content-Type': 'application/xml'}

@app.route('/robots.txt')
def robots():
    base_url = request.host_url[:-1]
    text = f"User-agent: *\nAllow: /\n\nSitemap: {base_url}/sitemap.xml"
    return text, 200, {'Content-Type': 'text/plain'}

# --- Sécurité : En-têtes HTTP ---
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    # HSTS : Force le navigateur à communiquer exclusivement en HTTPS
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# --- API Authentification (Mot de passe Admin) ---
@app.route('/api/login', methods=['POST'])
@limiter.limit("5 per minute") # Sécurité : Max 5 essais par minute par IP
def login():
    data = request.get_json()
    
    # Sécurité : On récupère le hash du mot de passe depuis l'environnement
    admin_password_hash = os.environ.get('ADMIN_PASSWORD_HASH')
    
    # Fallback pour le développement local si le hash n'est pas encore défini dans le .env
    if not admin_password_hash:
        old_password = os.environ.get('ADMIN_PASSWORD', 'enzo2026')
        admin_password_hash = generate_password_hash(old_password)
        
    if data and check_password_hash(admin_password_hash, data.get('password', '')):
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
    # Sécurité : Désactiver debug en production
    is_debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=is_debug, port=5001)
