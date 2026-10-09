# NUTRISPORT — site e-commerce premium

Site vitrine/e-commerce statique (HTML, CSS, JavaScript vanilla, aucune dépendance ni build) pour la marque de nutrition sportive NUTRISPORT.

## Lancer le site

Ouvrir `index.html` dans un navigateur, ou servir le dossier :

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

- **Hero immersif** : pot 3D (SVG) au centre, texte géant en arrière-plan, objets flottants (scoop, glaçons, gélules, éclats d'énergie, fumée, particules canvas), tilt 3D à la souris, parallaxe au scroll, carrousel automatique de 5 produits avec changement de thème (PROTEIN, ISOLATE, CREATINE, ENERGY, GAINER).
- **Produits populaires** : cartes avec choix du goût et du format (prix et étiquette du pot mis à jour), ajout au panier avec animation vers l'icône panier.
- **Pourquoi NUTRISPORT**, **Bénéfices** (scroll horizontal épinglé sur desktop), **Témoignages** (défilement infini), **FAQ** (accordéon), newsletter, footer.
- **Panier** : tiroir latéral, quantités, barre de livraison offerte (60 €), sauvegarde dans `localStorage`.
- Responsive mobile/desktop, swipe sur le hero mobile, respect de `prefers-reduced-motion`.

## Structure

```
index.html
assets/css/styles.css
assets/js/main.js   # catalogue produits, rendu des pots SVG, animations, panier
```

Le catalogue (noms, goûts, formats, prix, couleurs des pots) se modifie dans l'objet `PRODUCTS` de `assets/js/main.js`.
