# Recuperação de senha

O fluxo envia links de redefinição pelo Resend. Para habilitá-lo:

1. Execute `migrations/002_password_reset_tokens.sql` no PostgreSQL.
2. Verifique um domínio de envio no Resend e gere uma API key.
3. Configure estas variáveis no ambiente da aplicação:
   - `RESEND_API_KEY`: chave privada do Resend.
   - `EMAIL_FROM`: remetente autorizado no Resend, por exemplo `Salad Days <conta@seudominio.com>`.
   - `APP_BASE_URL`: origem HTTPS do site em produção, por exemplo `https://salad-days-seven.vercel.app`.
4. Faça um novo deploy para aplicar as variáveis e a migration.

O endpoint responde com a mesma mensagem para e-mails existentes e inexistentes. O token enviado por e-mail é aleatório, armazenado no banco apenas como hash, expira em 30 minutos e só pode ser usado uma vez.

O remetente precisa usar um domínio verificado no Resend para que a entrega funcione em produção. Nunca configure a API key no código do navegador nem no repositório.
