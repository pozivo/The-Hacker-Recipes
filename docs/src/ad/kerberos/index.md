---
authors: pozivonpm
category: ad, kerberos
---

# Attacchi Kerberos

Kerberos è un protocollo di autenticazione che consente agli utenti di  autenticarsi e accedere ai servizi su una rete potenzialmente non  sicura. Grazie a Kerberos, un utente non ha bisogno di digitare costantemente la  propria password e il server non avrà bisogno di conoscere la password  di ogni utente. Kerberos utilizza la porta 88 per impostazione predefinita ed è il protocollo di autenticazione predefinito per gli account di dominio a partire da  Windows 2000.

Kerberos è un protocollo di autenticazione stateless basato su ticket. Separa  efficacemente le credenziali di un utente dalle sue richieste alle  risorse consumabili, garantendo che la password non venga trasmessa  sulla rete. Si tratta di un protocollo [di prova a conoscenza zero](https://en.wikipedia.org/wiki/Zero-knowledge_proof). Il [Centro distribuzione chiavi Kerberos (KDC)](https://docs.microsoft.com/en-us/windows/win32/secauthn/key-distribution-center) non registra le transazioni precedenti; al contrario, il servizio di `concessione ticket` Kerberos (`TGS`) si basa su un `ticket di concessione` ticket (`TGT`) valido. Si presume che se un utente dispone di un TGT valido, deve aver dimostrato la propria identità.

Prima di Kerberos, l'autenticazione avveniva su `SMB`/`NTLM` e l'hash dell'utente veniva archiviato in memoria al momento  dell'autenticazione. Se un computer di destinazione veniva compromesso e l'hash NTLM veniva rubato, l'utente malintenzionato poteva accedere a `qualsiasi cosa` a cui l'account utente aveva accesso tramite un attacco `Pass-The-Hash`. Questo è il motivo per cui esiste il [problema del doppio hop](https://posts.specterops.io/offensive-lateral-movement-1744ae62b14f?gi=f925425e7a42) quando si accede alle macchine in remoto tramite `WinRM`. Quando si utilizza un protocollo non Kerberos per accedere a un  computer in modalità remota, è possibile utilizzare tale connessione per accedere ad altri computer come utente senza richiedere nuovamente  l'autenticazione perché l'hash della password `NTLM` è legato a tale sessione. Con l'autenticazione Kerberos, le credenziali devono essere specifiche per ogni computer a cui si desidera accedere  perché non esiste una password.

In un contesto Kerberos, quando un utente desidera accedere a un servizio, sono presenti tre entità: `l'utente`, il `servizio` e il server di autenticazione, noto anche come `Centro distribuzione` chiavi o KDC. Il KDC è l'entità che conosce le credenziali di tutti gli account.

L'accesso a un servizio avviene in **tre fasi** e sono denominate come segue:

- Richiesta TGT: Servizio di autenticazione (AS)
- Richiesta TGS: Servizio di Ticket-Granting (TGS)
- Richiesta di servizio: Richiesta di applicazione (AP)

## Servizio di autenticazione (AS) - Richiesta (AS-REQ)

L'utente effettua una richiesta TGT (o carta d'identità), questa richiesta è denominata `AS-REQ` ma per ricevere il TGT, devono essere in grado di dimostrare la loro identità. Per dimostrare la propria identità, l'utente invierà un `autenticatore`. È il timestamp corrente che l'utente crittograferà con la propria  chiave. Il nome utente viene anche inviato in chiaro in modo che il KDC  possa sapere con chi ha a che fare.

Dopo aver ricevuto questa richiesta, il KDC recupererà il nome utente,  cercherà la chiave associata nella sua directory e tenterà di  decrittografare l'autenticatore. Se ha esito positivo, significa che  l'utente ha utilizzato la stessa chiave di quella registrata nel suo  database, quindi è autenticato. In caso contrario, l'autenticazione non riesce.

Questo passaggio, chiamato `pre-autenticazione`, non è obbligatorio, ma tutti gli account devono eseguirlo `per impostazione predefinita`. Tuttavia, va notato che un amministratore può disabilitare la  preautenticazione. In questo caso, il client non deve più inviare un  autenticatore. Il KDC invierà il TGT qualunque cosa accada.

### Risposta (AS-REP)

Il KDC, quindi, ha ricevuto la richiesta del cliente di un TGT; se il KDC decrittografa correttamente l'autenticatore (o se la preautenticazione è disabilitata per il client), invia all'utente una risposta denominata `AS-REP`.

Per proteggere il resto degli exchange, il KDC genererà una `chiave di sessione temporanea` prima di rispondere all'utente. Il cliente utilizzerà questa chiave per ulteriori scambi. Il KDC evita di crittografare tutte le informazioni  con la chiave dell'utente. In precedenza è stato affermato che Kerberos è un protocollo senza stato, quindi il KDC non memorizzerà questa chiave  di sessione da nessuna parte.

Ci sono due elementi che troveremo nella risposta AS-REP:

1. Innanzitutto, stiamo aspettando il `TGT` richiesto dall'utente. Contiene tutte le informazioni dell'utente ed è  protetto con la chiave del KDC, in modo che l'utente non possa  manometterlo. Contiene anche una `copia` della chiave di `sessione generata`.
2. La seconda è la `chiave di sessione`, ma questa volta `protetta` con la `chiave dell'utente`.

Pertanto, questa chiave di sessione viene duplicata nella risposta: una versione è protetta con la chiave del KDC e un'altra è protetta con la chiave  dell'utente.

## Servizio di Concessione Ticket (TGS)

Quando un utente o un computer richiede un ticket di servizio, la richiesta  viene inviata al componente TGS del KDC, che verifica l'identità  dell'utente o del computer e verifica la sua autorizzazione ad accedere  alla risorsa richiesta prima di emettere un ticket di servizio che può  essere utilizzato per accedere alla risorsa.

### Richiesta (TGS-REQ)

Il client dispone ora di una risposta dal server alla relativa richiesta  TGT. Questa risposta contiene il TGT, protetto dalla chiave del KDC, e  una chiave di sessione, protetta dalla chiave del client/utente. Può  quindi decrittografare queste informazioni per estrarre questa chiave di sessione temporanea.

Il passo successivo per l'utente consiste nel richiedere un ticket di servizio `ST` o `TGS` con un messaggio `TGS-REQ`. Per fare ciò, trasmetteranno tre cose al KDC:

1. Il nome del servizio a cui desiderano accedere (SERVICE/HOST, che è la rappresentazione del nome dell'entità servizio (SPN))
2. Il TGT ricevuto in precedenza, contenente le informazioni e una copia della chiave di sessione
3. Un autenticatore, che verrà crittografato utilizzando la chiave di sessione in questo momento

### Risposta (TGS-REP)

Il KDC riceve questa richiesta TGS, ma Kerberos è un protocollo senza  stato. Pertanto, il KDC non ha idea di quali informazioni siano state  scambiate in precedenza. Deve comunque verificare che la richiesta TGS  sia valida. A tale scopo, è necessario verificare che l'autenticatore sia stata crittografata con la chiave di sessione corretta. E come fa il KDC a sapere se la chiave di sessione utilizzata è corretta? Bisogna tener presente che nel TGT era presente una copia della chiave di sessione. Il KDC decrittograferà il TGT (verificandone l'autenticità lungo il percorso) ed estrarrà la chiave di sessione. Con questa chiave di  sessione, sarà in grado di verificare la validità dell'autenticatore. Se tutto ciò viene fatto correttamente, il KDC deve solo leggere il servizio richiesto e rispondere all'utente con un messaggio `TGS-REP`.

Ecco tutti gli elementi inviati dal KDC:

Un ticket di servizio o ticket TGS composto da tre elementi:

1. Il nome del servizio richiesto (il relativo SPN).
2. Una copia delle informazioni sull'utente presenti nel TGT. Il servizio  leggerà queste informazioni per determinare se l'utente ha o meno il  diritto di utilizzarle.
3. Una copia della chiave di sessione.

## Richiesta di applicazione (AP)

### Richiesta (AP-REQ)

L'utente può ora decrittografare questa risposta per estrarre la chiave della  sessione utente/servizio e il ticket TGS, ma il ticket TGS è protetto con la chiave del servizio. L'utente non può modificare questo ticket  TGS, quindi non può modificare i propri diritti, proprio come con il TGT. L'utente trasmetterà solo questo ticket TGS al servizio e, proprio come per la  richiesta TGS, viene aggiunto un autenticatore. Con cosa l'utente  crittograferà questo autenticatore? Hai indovinato, con la chiave della  sessione utente/servizio appena estratta. Il processo è molto simile  alla precedente richiesta TGS.

### Risposta (AP-REP)

Il servizio riceve infine il ticket TGS e un autenticatore crittografato  con la chiave di sessione utente/servizio generata dal KDC. Questo  ticket TGS è protetto con la chiave del servizio in modo che possa  decrittografarlo. Ricorda che una copia della chiave di sessione  utente/servizio è incorporata all'interno del ticket TGS, in modo che  possa estrarla e verificare la validità dell'autenticatore con questa  chiave di sessione.

Se tutto va correttamente, il servizio può finalmente leggere le  informazioni sull'utente, compresi i gruppi a cui appartengono, e in  base alle sue regole di accesso, concedergli o negargli l'accesso al  servizio. Se l'autenticazione ha esito positivo, il servizio risponde al client con un messaggio `AP-REP` crittografando il timestamp con la chiave di sessione estratta. Il  client può quindi verificare che il messaggio provenga dal servizio e  iniziare a inviare richieste di servizio.

>[!TIP]
> Come si può notare, l'intero processo si basa su chiavi condivise ed è un  processo a tre entità. Protegge gli utenti e i servizi dal furto e dal  replay dei ticket, poiché gli aggressori non conoscerebbero le chiavi per emettere autenticatori validi.
> Se si desidera esplorare ulteriori spiegazioni sul protocollo Kerberos, il suo funzionamento e i suoi componenti, è possibile rivedere i post di [ATTL4S](https://twitter.com/DaniLJ94) sul suo [blog](https://attl4s.github.io/) e sul video del canale YouTube: [You Do (Non) Understand Kerberos](https://www.youtube.com/watch?v=4LDpb1R3Ghg&list=PLwb6et4T42wyb8dx-LQAA0PzLjw6ZlrXh).
