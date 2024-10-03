# OneFinity Token Transfer App

Une application React permettant de se connecter à MetaMask, de basculer vers le réseau **OneFinity Testnet**, et d'envoyer des tokens ONE via des transactions EVM. L'application supporte l'ajout automatique du réseau **OneFinity Testnet** à MetaMask si celui-ci n'est pas déjà configuré.

## Fonctionnalités

- Connexion à MetaMask
- Changement automatique vers le **OneFinity Testnet** (si non connecté)
- Ajout du **OneFinity Testnet** à MetaMask si non configuré
- Envoi de tokens ONE à une adresse EVM spécifiée
- Exécution automatique de transactions toutes les 10 secondes
- Affichage des informations sur la transaction et du solde de l'utilisateur

## Prérequis

- [Node.js](https://nodejs.org/) version 18+
- [MetaMask](https://metamask.io/) extension pour navigateur installée
- Compte de test sur le réseau **OneFinity Testnet**

## Installation

1. Clonez ce dépôt :

   ```bash
   git clone https://github.com/bdsalocin/Auto-send-onefinity-transaction.git
   ```

2. Accédez au répertoire du projet :

   ```bash
   cd Auto-send-onefinity-transaction
   ```

3. Installez les dépendances :
   ```bash
   npm install
   ```

## Configuration

L'application est configurée pour fonctionner avec le réseau **OneFinity Testnet**. Voici les détails du réseau :

- **Nom du réseau** : OneFinity Testnet
- **URL RPC** : `https://testnet-rpc.onefinity.network`
- **Chain ID** : `999987`
- **Symbole de la monnaie** : `ONE`
- **Block Explorer URL** : `https://testnet-explorer.onefinity.network/`

## Utilisation

1. Démarrez l'application React :

   ```bash
   npm start
   ```

2. Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur pour afficher l'application.

3. Suivez ces étapes dans l'interface utilisateur :
   - Cliquez sur **Connect Wallet** pour vous connecter à votre portefeuille MetaMask.
   - Si vous n'êtes pas sur le réseau **OneFinity Testnet**, l'application vous demandera de basculer ou d'ajouter ce réseau.
   - Entrez l'adresse EVM du destinataire dans le champ **Receiver Address**.
   - Cliquez sur **Start** pour envoyer des transactions périodiquement ou sur **Send Single Transaction** pour envoyer une transaction unique.

## Fonctionnalités supplémentaires

### Gestion du réseau

- Si MetaMask n'est pas connecté au réseau **OneFinity Testnet**, l'application demandera à l'utilisateur de basculer vers ce réseau ou de l'ajouter s'il n'existe pas encore.

### Informations sur la transaction

- Après chaque transaction, l'application affichera :
  - Le **hash** de la transaction
  - Le **gas utilisé**
  - Le **coût du gas** en ONE
  - Le **solde actuel** du compte connecté

## Dépendances

L'application utilise les dépendances suivantes :

- [React](https://reactjs.org/)
- [Web3.js](https://web3js.readthedocs.io/)
- [Ant Design](https://ant.design/) pour l'interface utilisateur
- [MetaMask](https://metamask.io/) pour la gestion du portefeuille

## Scripts npm

- **`npm start`** : Démarre l'application en mode développement
- **`npm run build`** : Génère les fichiers de production

## Problèmes connus

- Si MetaMask est installé mais ne fonctionne pas correctement, assurez-vous que l'extension est activée et que vous utilisez un navigateur compatible comme Chrome ou Firefox.

## Contributions

Les contributions à ce projet sont les bienvenues. Vous pouvez soumettre des pull requests ou ouvrir des issues pour signaler des bugs ou suggérer de nouvelles fonctionnalités.

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
