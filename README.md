# NUTRISPORT — site e-commerce premium

Site vitrine/e-commerce statique (HTML, CSS, JavaScript vanilla, sans étape de build ; Three.js est embarqué dans le dépôt) pour la marque de nutrition sportive NUTRISPORT.

## Lancer le site

Servir le dossier avec un petit serveur local (les pots 3D utilisent des modules JavaScript, qui ne se chargent pas en ouvrant directement `index.html` ; dans ce cas le site reste fonctionnel avec les pots en 2D) :

```bash
npx serve .        # ou : python3 -m http.server
```

## Mise en ligne sur Netlify (dépôt privé)

Le fichier `netlify.toml` configure le déploiement : pas de build, le dossier racine est publié tel quel.

1. Créer un compte sur https://app.netlify.com (connexion avec GitHub).
2. **Add new site → Import an existing project → GitHub**, autoriser l'accès au dépôt privé `KAMOULYYO/User`.
3. Choisir la branche `main`. Les champs de build se remplissent depuis `netlify.toml` (laisser vide la commande, dossier de publication `.`).
4. **Deploy**. Le site est en ligne sur `https://<nom>.netlify.app` ; le nom se change dans *Site configuration → Change site name*, et un domaine personnalisé s'ajoute dans *Domain management*.

Chaque push sur `main` redéploie automatiquement le site.

## Contenu

- **Hero immersif** : pot 3D au centre, texte géant en arrière-plan, objets flottants (scoop, glaçons, gélules, éclats d'énergie, fumée, particules canvas), tilt 3D à la souris, parallaxe au scroll, carrousel automatique de 5 produits avec changement de thème (PROTEIN, ISOLATE, CREATINE, ENERGY, GAINER).
- **Produits populaires** : cartes avec choix du goût et du format (prix et étiquette du pot mis à jour), ajout au panier avec animation vers l'icône panier.
- **Pourquoi NUTRISPORT**, **Bénéfices** (scroll horizontal épinglé sur desktop), **Témoignages** (défilement infini), **FAQ** (accordéon), newsletter, footer.
- **Panier** : tiroir latéral, quantités, barre de livraison offerte (60 €), sauvegarde dans `localStorage`.
- Responsive mobile/desktop, swipe sur le hero mobile, respect de `prefers-reduced-motion`.

## Effets « wow »

- **Pots 3D temps réel** (Three.js, embarqué dans `assets/vendor/three/`) : rotation à 360° au doigt ou à la souris avec inertie, étiquette avec tableau nutritionnel et conseils au dos, couleur du goût qui change en direct. Pot doré métallisé pour l'édition Gold. Repli automatique sur les pots SVG si WebGL n'est pas disponible.
- **Histoire au scroll** : le couvercle s'ouvre, la poudre explose en particules qui forment « 25G », puis tombe dans un shaker qui se remplit.
- **Quiz « Trouve ton stack »** : 3 questions, recommandation animée et pack à -15 % ajouté au panier (remise gérée dans le panier).
- **Le Lab** : calculateur de besoins en protéines (jauge animée) et simulateur de shaker (remplissage, poudre, secousse, mousse).
- **Édition Gold** avec compte à rebours jusqu'au drop.
- Traînée de poudre derrière le curseur, sons synthétisés (désactivés par défaut, bouton haut-parleur), préchargeur où le pot se remplit, rideau de transition entre les sections, menu qui passe en sombre sur les sections sombres.
- Version allégée sur mobile (moins de particules, rendu 3D moins coûteux, pas de traînée de curseur).

## Structure

```
index.html
assets/css/styles.css
assets/js/main.js   # catalogue produits, pots SVG, hero, panier, API partagée (window.NS)
assets/js/jar3d.js  # pots 3D Three.js (hero + Gold)
assets/js/story.js  # histoire au scroll (particules)
assets/js/lab.js    # quiz, calculateur, shaker
assets/js/fx.js     # traînée de poudre, rideau de transition, compte à rebours
assets/js/sfx.js    # sons WebAudio
assets/vendor/three # Three.js r170 (licence MIT)
```

Le catalogue (noms, goûts, formats, prix, couleurs des pots) se modifie dans l'objet `PRODUCTS` de `assets/js/main.js`.
