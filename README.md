# NUTRISPORT — site e-commerce premium

Site vitrine/e-commerce statique (HTML, CSS, JavaScript vanilla, aucune dépendance ni build) pour la marque de nutrition sportive NUTRISPORT.

## Lancer le site

Ouvrir `index.html` dans un navigateur, ou servir le dossier :

```bash
npx serve .        # ou : python3 -m http.server
```

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
