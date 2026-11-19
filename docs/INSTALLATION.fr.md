# Installer Innkeep sur votre ordinateur

_English version: [INSTALL.md](INSTALL.md)_

Ce guide s’adresse aux personnes qui n’ont jamais installé un programme de
cette façon. Aucune connaissance technique n’est nécessaire. Comptez environ
20 minutes la première fois.

Innkeep fonctionne sur votre propre ordinateur. Vos réservations et vos
tarifs restent dans un dossier de cet ordinateur et ne sont envoyés à
personne.

## Ce qu’il vous faut

- Un Mac ou un ordinateur Windows.
- Le navigateur Google Chrome (Edge, Brave et Arc conviennent aussi).
- Vos comptes hôte Airbnb et Booking.com.

## Étape 1 : installer Node.js

Node.js est un programme gratuit dont Innkeep a besoin pour fonctionner. Vous
l’installez une fois et vous ne l’ouvrez jamais vous-même.

1. Allez sur <https://nodejs.org>.
2. Cliquez sur le gros bouton de téléchargement (la version marquée **LTS**).
3. Ouvrez le fichier téléchargé et cliquez sur **Continuer** / **Suivant**
   jusqu’à la fin. Gardez tous les réglages proposés.

## Étape 2 : télécharger Innkeep

1. Allez sur <https://github.com/jetaix/Innkeep>.
2. Cliquez sur le bouton vert **Code**, puis sur **Download ZIP**.
3. Ouvrez le fichier ZIP téléchargé. Vous obtenez un dossier `Innkeep-main`.
4. Déplacez ce dossier à un endroit où vous le retrouverez, par exemple votre
   dossier **Documents**. Ne le laissez pas dans Téléchargements.

## Étape 3 : démarrer Innkeep

Ouvrez le dossier `Innkeep-main`.

**Sur Mac :** double-cliquez sur `start.command`.

- La première fois, macOS peut refuser parce que le fichier vient d’Internet.
  Dans ce cas, faites un clic droit sur le fichier (ou Contrôle + clic),
  choisissez **Ouvrir**, puis de nouveau **Ouvrir**.

**Sur Windows :** double-cliquez sur `start.bat`.

- Si une fenêtre bleue « Windows a protégé votre ordinateur » apparaît,
  cliquez sur **Informations complémentaires**, puis sur **Exécuter quand
  même**.

Une fenêtre noire ou blanche remplie de texte s’ouvre. Le premier démarrage
prend quelques minutes, le temps qu’Innkeep se prépare ; les suivants prennent
quelques secondes. Quand tout est prêt, votre navigateur s’ouvre tout seul sur
Innkeep. Sinon, tapez ceci dans la barre d’adresse du navigateur :
`http://localhost:3000`

**Gardez cette fenêtre de texte ouverte** tant que vous utilisez Innkeep. La
fermer arrête Innkeep. Vos données sont conservées ; relancez-le de la même
façon.

## Étape 4 : ajouter votre logement

1. Dans Innkeep, cliquez sur **Logements** dans le menu de gauche, donnez un
   nom à votre logement et cliquez sur **Ajouter le logement**.
2. Sur la page qui s’ouvre, chaque plateforme a une case qui demande son
   **lien de calendrier**. Pour trouver ces liens :
   - **Airbnb :** Calendrier → Disponibilités → Connecter les calendriers →
     _Exporter le calendrier_. Copiez le lien.
   - **Booking.com :** Extranet → Tarifs et disponibilités → Synchroniser les
     calendriers → _Exporter_. Copiez le lien.
3. Collez chaque lien dans la case correspondante d’Innkeep et cliquez sur
   **Enregistrer les réglages Airbnb** (ou **Booking.com**).

Vos dates réservées apparaissent maintenant dans le **Calendrier**.

> **Pour éviter les doubles réservations**, reliez aussi les deux plateformes
> entre elles : dans l’écran « Connecter les calendriers » d’Airbnb, importez
> le lien Booking.com ; dans l’écran « Synchroniser les calendriers » de
> Booking.com, importez le lien Airbnb. Innkeep, installé sur votre
> ordinateur, ne peut pas le faire à votre place : les plateformes ne peuvent
> pas joindre un programme qui ne tourne que chez vous.

## Étape 5 : ajouter l’extension de navigateur

Les liens de calendrier ne contiennent que des dates. Une petite extension de
navigateur lit le reste sur vos propres pages Airbnb et Booking.com : noms des
voyageurs, versements, tarifs, avis.

Dans Innkeep, cliquez sur le bouton **Ajouter l’extension de navigateur** en
bas à droite de l’écran. Il ouvre un guide en quatre étapes courtes, avec un
bouton **Copier** pour tout ce qu’il faut coller. En résumé :

1. Dans Chrome, ouvrez la page des extensions et activez le **Mode
   développeur**.
2. Cliquez sur **Charger l’extension non empaquetée** et choisissez le
   dossier `extension` qui se trouve dans `Innkeep-main`.
3. Cliquez sur la nouvelle icône Innkeep Companion, ouvrez **Settings**,
   collez l’adresse et le jeton qu’Innkeep vous affiche, puis cliquez sur
   **Save and test**.

Connectez-vous ensuite à Airbnb et à Booking.com dans le même navigateur,
revenez sur Innkeep et cliquez sur **Tout mettre à jour**. Un onglet parcourt
vos pages tout seul pendant quelques minutes, puis revient sur Innkeep avec
vos données.

## Utiliser Innkeep au quotidien

- **Pour démarrer :** double-cliquez sur `start.command` (Mac) ou `start.bat`
  (Windows).
- **Pour arrêter :** fermez la fenêtre de texte.
- **À l’ouverture,** Innkeep vous signale si vos données ont plus d’un jour et
  propose un bouton **Mettre à jour**.
- **Langue et mode sombre :** en bas du menu de gauche.

## Facultatif : des conseils rédigés par Claude

Innkeep peut demander à Claude, un assistant IA conçu par Anthropic, des
conseils fondés sur vos propres chiffres. Il faut un compte Anthropic, et
chaque demande coûte quelques centimes. Cliquez sur **Assistant** dans le menu
de gauche et suivez ses trois étapes.

## Protéger vos données

Tout ce qu’Innkeep sait se trouve dans le dossier `data`, à l’intérieur de
`Innkeep-main`.

- **Pour faire une sauvegarde,** copiez le dossier `data` sur une clé USB ou
  un espace de stockage en ligne.
- **Ne supprimez jamais** le dossier `data` ni le fichier `.env.local`, sauf
  si vous voulez repartir de zéro.

## Mettre à jour Innkeep

1. Fermez Innkeep (fermez la fenêtre de texte).
2. Téléchargez le nouveau ZIP comme à l’étape 2 et ouvrez-le.
3. Copiez le dossier `data` et le fichier `.env.local` de votre ancien
   dossier `Innkeep-main` dans le nouveau. (`.env.local` peut être masqué :
   sur Mac, appuyez sur Commande + Maj + . dans le Finder pour afficher les
   fichiers masqués ; sur Windows, cochez **Éléments masqués** dans le menu
   Affichage.)
4. Démarrez Innkeep depuis le nouveau dossier.
5. Dans la page des extensions de Chrome, supprimez l’ancienne Innkeep
   Companion et chargez le dossier `extension` de la nouvelle version.

## En cas de problème

| Ce que vous voyez                                               | Ce qu’il faut faire                                                                                        |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| « Innkeep needs Node.js »                                       | Faites l’étape 1, puis relancez.                                                                           |
| « Something is already running at http://localhost:3000 »       | Innkeep est sans doute déjà démarré : ouvrez cette adresse dans votre navigateur.                          |
| Le navigateur affiche « Ce site est inaccessible »              | La fenêtre de texte a été fermée. Relancez Innkeep.                                                        |
| « That step failed » dans la fenêtre de texte                   | Copiez le texte de la fenêtre et envoyez-le à la personne qui vous a partagé Innkeep.                      |
| La mise à jour ignore une plateforme                            | Vous n’y êtes pas connecté. Connectez-vous à Airbnb ou à Booking.com dans le même navigateur et réessayez. |
| Le bouton de l’extension dans Innkeep indique « Mettre à jour » | Dans la page des extensions de Chrome, appuyez sur la flèche ronde d’Innkeep Companion.                    |

Les messages de la fenêtre de texte et de l’extension sont en anglais ;
Innkeep lui-même est en français.

## À savoir avant de vous y fier

- **Innkeep ne fonctionne que lorsque votre ordinateur est allumé et que sa
  fenêtre est ouverte.** C’est un tableau de bord pour vous, pas un service qui
  tourne jour et nuit.
- **Il ne peut rien modifier sur Airbnb ni sur Booking.com.** Les tarifs, les
  textes d’annonce et les réponses aux voyageurs se modifient toujours sur
  chaque plateforme.
- **Lire vos pages avec l’extension relève de votre décision.** Les conditions
  d’Airbnb et de Booking.com restreignent la collecte automatisée de données.
  L’extension ne lit que vos propres pages, dans votre navigateur, quand vous
  le demandez.
- **Innkeep lui-même n’a pas de mot de passe.** Toute personne qui peut
  utiliser votre ordinateur peut l’ouvrir. Ne le mettez pas en ligne sans
  aide.
