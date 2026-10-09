/* ==========================================================================
   NUTRISPORT — fiche entreprise (à compléter)
   --------------------------------------------------------------------------
   Toutes les pages légales (mentions légales, CGV, confidentialité) et les
   liens de contact du site lisent ces informations. Remplacez chaque valeur
   entre crochets « [À COMPLÉTER …] » par la vraie information.
   Tant qu'un champ commence par « [À », les pages légales affichent un
   bandeau « document provisoire ».
   ========================================================================== */
window.COMPANY = {
  // Identité du vendeur
  brand: "NUTRISPORT",
  name: "[À COMPLÉTER : raison sociale ou nom et prénom de l'entrepreneur]",
  legalForm: "[À COMPLÉTER : forme juridique, ex. SAS, SARL, entreprise individuelle (micro-entrepreneur)]",
  capital: "[À COMPLÉTER : capital social, ex. 1 000 € — à supprimer pour une entreprise individuelle]",
  address: "[À COMPLÉTER : adresse du siège social]",
  siret: "[À COMPLÉTER : n° SIRET]",
  rcs: "[À COMPLÉTER : ville d'immatriculation au RCS, ex. RCS Paris — ou « Dispensé d'immatriculation » pour un micro-entrepreneur]",
  vat: "[À COMPLÉTER : n° de TVA intracommunautaire — ou « TVA non applicable, art. 293 B du CGI »]",
  director: "[À COMPLÉTER : nom du directeur de la publication]",

  // Contact (affiché sur le site et dans les pages légales)
  email: "[À COMPLÉTER : e-mail de contact]",
  phone: "[À COMPLÉTER : téléphone]",

  // Médiateur de la consommation (obligatoire pour vendre à des particuliers)
  mediatorName: "[À COMPLÉTER : nom du médiateur de la consommation]",
  mediatorUrl: "[À COMPLÉTER : site web du médiateur]",

  // Hébergeur du site
  hostName: "Netlify, Inc.",
  hostAddress: "[À VÉRIFIER : adresse postale indiquée sur netlify.com/legal]",
  hostUrl: "https://www.netlify.com",

  // Livraison (reprise dans les CGV)
  shippingArea: "France métropolitaine",
  shippingFee: "4,90 €",
  freeShippingFrom: "60 €",
  shippingDelay: "[À COMPLÉTER : délai de livraison, ex. 2 à 4 jours ouvrés]",

  // Réseaux sociaux (laisser vide "" pour masquer l'icône)
  instagram: "",
  tiktok: "",
  youtube: "",
  strava: "",

  // Date de dernière mise à jour des documents légaux
  updated: "9 octobre 2026",
};

/* true if the value is still a placeholder */
window.COMPANY.isMissing = (v) => !v || /^\[À/.test(v);
