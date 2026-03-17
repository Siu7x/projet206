from flask import Flask, render_template
import requests
import bs4

app = Flask(__name__)

def get_rallyes():
    url = 'https://www.ffsa.org/calendrier-et-classements/calendrier-ffsa?discipline=rallye'
    headers = {'User-Agent': 'Mozilla/5.0'}
    res = requests.get(url, headers=headers)
    soup = bs4.BeautifulSoup(res.text, 'html.parser')
    
    rallyes = []
    
    # On cherche les lignes du calendrier (souvent des balises 'tr' ou des 'div' spécifiques)
    # Note : Il faut inspecter le site pour trouver la classe exacte. 
    # Imaginons que chaque rallye est dans une balise avec la classe 'event-row'
    items = soup.find_all('div', class_='event-card') # Exemple de classe
    
    for item in items:
        nom = item.find('h3').text.strip() if item.find('h3') else "Nom inconnu"
        date = item.find('span', class_='date').text.strip() if item.find('span', class_='date') else "Date inconnue"
        
        rallyes.append({'nom': nom, 'date': date})
    
    return rallyes

@app.route('/')
def home():
    # On récupère la liste des rallyes
    liste_rallyes = get_rallyes()
    # On l'envoie au fichier HTML
    return render_template('index.html', rallyes=liste_rallyes)

if __name__ == '__main__':
    app.run(debug=True)