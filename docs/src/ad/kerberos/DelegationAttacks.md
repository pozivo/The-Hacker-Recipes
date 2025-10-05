---
authors: pozivonpm
category: ad, kerberos
---
[La delega Kerberos](https://blog.netwrix.com/2021/11/30/what-is-kerberos-delegation-an-overview-of-kerberos-delegation) consente a un servizio di rappresentare un utente per accedere a  un'altra risorsa. L'autenticazione viene delegata e la risorsa finale risponde al servizio come se disponesse dei diritti del primo utente. Esistono diversi tipi di delega, ognuno con punti deboli che possono consentire a un utente malintenzionato di impersonare utenti (a volte  arbitrari) per sfruttare altri servizi. Tratteremo i seguenti attacchi che abusano di Kerberos: `unconstrained delegation`, `constrained delegation` e `resource-based constrained delegation`.
