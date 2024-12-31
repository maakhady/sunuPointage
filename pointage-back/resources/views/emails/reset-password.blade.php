<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Réinitialisation de mot de passe</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 10px; padding: 20px;">
        <h2 style="color: #333;">Réinitialisation de votre mot de passe</h2>
        
        <p>Bonjour {{ $user->prenom }},</p>
        
        <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour procéder :</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $resetLink }}" 
               style="background: #007bff; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Réinitialiser mon mot de passe
            </a>
        </div>
        
        <p>Ce lien expirera dans 5 minutes pour des raisons de sécurité.</p>
        
        <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="color: #666; font-size: 14px;">
            Ceci est un email automatique, merci de ne pas y répondre.
        </p>
    </div>
</body>
</html>