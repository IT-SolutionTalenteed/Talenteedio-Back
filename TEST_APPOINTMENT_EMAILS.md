# Test des Emails d'Entretien

## Configuration

Avant de tester, assurez-vous que votre fichier `.env` contient les bonnes configurations SMTP :

```env
MAILHOST=smtp.example.com
MAILPORT=587
MAILUSER=noreply@talenteed.io
MAILPWD=your_password
TEST_EMAIL=votre-email@example.com  # Email où recevoir les tests
```

## Tester les Emails

### 1. Email de Confirmation

```bash
npx ts-node test-appointment-emails.ts confirmed
```

Cet email est envoyé lorsqu'une entreprise confirme un entretien. Il contient :
- Les détails de l'entretien (date, heure, entreprise)
- Les notes optionnelles de l'entreprise
- Des conseils pour préparer l'entretien

### 2. Email de Rejet

```bash
npx ts-node test-appointment-emails.ts rejected
```

Cet email est envoyé lorsqu'une entreprise rejette un entretien. Il contient :
- La raison du rejet fournie par l'entreprise
- Un message d'encouragement
- Un lien vers la plateforme pour découvrir d'autres opportunités

### 3. Email de Rappel

```bash
npx ts-node test-appointment-emails.ts reminder
```

Cet email est envoyé automatiquement 30 minutes avant l'entretien. Il contient :
- Les détails de l'entretien
- Une checklist de dernières vérifications
- Un message de motivation

## Personnaliser les Tests

Vous pouvez modifier le fichier `test-appointment-emails.ts` pour personnaliser :
- Le nom du candidat
- L'email de destination
- Le nom de l'entreprise
- La date et l'heure de l'entretien
- Les notes ou raisons

## Vérifier les Templates

Les templates Handlebars sont situés dans :
```
src/helpers/mailer/mail-templates/
├── appointment-confirmed.handlebars
├── appointment-rejected.handlebars
└── appointment-reminder.handlebars
```

## Troubleshooting

### L'email n'est pas reçu

1. Vérifiez les logs de la console pour les erreurs
2. Vérifiez votre dossier spam
3. Vérifiez les configurations SMTP dans `.env`
4. Testez avec un service comme Mailtrap pour le développement

### Erreur de connexion SMTP

```
Error: connect ECONNREFUSED
```

Solution : Vérifiez que `MAILHOST` et `MAILPORT` sont corrects.

### Erreur d'authentification

```
Error: Invalid login
```

Solution : Vérifiez `MAILUSER` et `MAILPWD`.

## Utiliser Mailtrap pour le Développement

Pour éviter d'envoyer de vrais emails pendant le développement :

1. Créez un compte sur [Mailtrap.io](https://mailtrap.io)
2. Créez une inbox
3. Utilisez les credentials Mailtrap dans votre `.env` :

```env
MAILHOST=smtp.mailtrap.io
MAILPORT=2525
MAILUSER=your_mailtrap_username
MAILPWD=your_mailtrap_password
```

Tous les emails seront capturés par Mailtrap et vous pourrez les visualiser dans leur interface.
