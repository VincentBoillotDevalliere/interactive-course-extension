# Interactive Course Extension

Une extension VS Code pour créer et suivre des cours interactifs de programmation, conçue spécialement pour les débutants.

## Fonctionnalités

Cette extension permet de :

- 📚 **Créer des cours de programmation** avec plusieurs modules progressifs
- 🔄 **Suivre la progression** de l'apprentissage à travers les modules
- ✅ **Valider automatiquement** les exercices via des tests unitaires
- 📝 **Fournir des explications** détaillées dans chaque leçon

L'extension génère pour chaque module :
- Un fichier `exercise.md` avec l'explication de la leçon
- Un fichier `main.js` ou `main.py` à compléter par l'apprenant
- Un fichier de tests unitaires qui vérifie la solution

![Aperçu de l'extension](images/preview.png)

## Comment utiliser cette extension

### Pour les formateurs

1. Ouvrez un dossier vide dans VS Code
2. Exécutez la commande "Create Interactive Course" depuis la palette de commandes
3. Donnez un nom à votre cours et choisissez le langage (JavaScript ou Python)
4. Personnalisez les fichiers générés pour adapter le contenu à vos besoins

### Pour les apprenants

1. Ouvrez le dossier du cours dans VS Code
2. Naviguez entre les modules via la vue "Course Explorer" dans la barre d'activité
3. Lisez les instructions dans le fichier `exercise.md`
4. Complétez le code dans le fichier `main.js` ou `main.py`
5. Exécutez les tests via la commande "Run Current Module Tests"
6. Une fois les tests réussis, vous débloquerez automatiquement le module suivant

## Structure des modules

Chaque module comprend :

- **exercise.md** : Explications, objectifs et instructions pour l'exercice
- **main.js/py** : Fichier de code à compléter par l'apprenant
- **tests.js/py** : Tests unitaires qui valident la solution

## Langages supportés

- JavaScript
- Python

D'autres langages pourront être ajoutés dans les versions futures.

## Prérequis

- Visual Studio Code v1.60.0 ou supérieur
- Node.js (pour les cours JavaScript)
- Python (pour les cours Python)

## Extension Settings

Cette extension contribue les paramètres suivants :

* `interactiveCourse.autoOpenNextModule`: Ouvre automatiquement le module suivant après avoir complété un module
* `interactiveCourse.enableAutoCompletion`: Active ou désactive les suggestions d'auto-complétion pour les débutants
