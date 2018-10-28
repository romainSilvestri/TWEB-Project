# Github Frequencies :

## Description 
Cette application permet d'observer la fréquence des commits d'un utilisateur en fonction du langage de chaque repo, et de comparer son score global aux autres utilisateurs ayant été recherchés au moins une fois sur l'application

## Utilisation 

1. Se rendre à l'adresse suivante afin de tester l'application directement : https://githubfrequenciesapi.herokuapp.com/

2. Tester l'application localement : 
Pour ce faire, cloner ce repo, puis dans le dossier serveur, créer un fichier .env, contenant la ligne OAUTH_TOKEN=xxx, en remplacant xxx par un token généré depuis github ( Settings -> developersettings -> Personal access tokens)  

Faire ensuite un `npm install` puis un `npm start` depuis le dossier serveur et un simple `npm start` depuis le dossier client.

## Bug connu  

Lors de la première recherche ou mis à jour d'un utilisateur, il peut arriver qu'aucune stats ne soit chargée, re-update les stats de l'utilisateur corrige ce problème.