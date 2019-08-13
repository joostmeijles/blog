+++
title = "JWTs in Sitecore XC9 🔐"
date = "2019-08-13"
tags = ["Identity", "XC9"]
+++

Sitecore XC9 uses JSON Web Tokens (JWTs) for authentication & authorization. JWTs are well explained [here](https://jwt.io/introduction/).
In this blog post we investigate how JWTs are configured and handled in the Sitecore Identity Server and Commerce Engine.
<!--more--> 

In this [article](http://jonnekats.nl/2019/sitecore-commerce-security-explained/) Jonne Kats gives a nice overview of how authentication and authorization works in XC9.
The Bearer token authentication variant uses a token: a JSON Web Token (JWT).

# Obtain and inspect JWT
A token is retrieved from the Identity Server using the https://identity/connect/token endpoint by providing approriate username and password credentials (assuming you use the `password` grant type). An example JWT looks like:
```
{
    "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjZFQjhFMDg3NjhBNjg2M0VCMUIzMTQ3NTEwMjdDMjVEQzhFMDYwOUQiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJicmpnaDJpbWhqNnhzeFIxRUNmQ1hjamdZSjAifQ.eyJuYmYiOjE1NjU2MzMzNjQsImV4cCI6MTU2NTYzNjk2NCwiaXNzIjoiaHR0cHM6Ly9pZGVudGl0eSIsImF1ZCI6WyJodHRwczovL2lkZW50aXR5L3Jlc291cmNlcyIsIkVuZ2luZUFQSSIsInBvc3RtYW5fYXBpIl0sImNsaWVudF9pZCI6InBvc3RtYW4tYXBpIiwic3ViIjoiZTI3ZGYyMTVhMTBiNGQ0ZTg2ZWUzYTJhNjc1MzljYTkiLCJhdXRoX3RpbWUiOjE1NjU2MzMzNjQsImlkcCI6ImxvY2FsIiwibmFtZSI6InNpdGVjb3JlXFxBZG1pbiIsImVtYWlsIjoiIiwicm9sZSI6WyJzaXRlY29yZVxcQ29tbWVyY2UgQWRtaW5pc3RyYXRvciIsInNpdGVjb3JlXFxDdXN0b21lciBTZXJ2aWNlIFJlcHJlc2VudGF0aXZlIEFkbWluaXN0cmF0b3IiLCJzaXRlY29yZVxcQ3VzdG9tZXIgU2VydmljZSBSZXByZXNlbnRhdGl2ZSIsInNpdGVjb3JlXFxDb21tZXJjZSBCdXNpbmVzcyBVc2VyIiwic2l0ZWNvcmVcXFByaWNlciBNYW5hZ2VyIiwic2l0ZWNvcmVcXFByaWNlciIsInNpdGVjb3JlXFxQcm9tb3Rpb25lciBNYW5hZ2VyIiwic2l0ZWNvcmVcXFByb21vdGlvbmVyIiwic2l0ZWNvcmVcXE1lcmNoYW5kaXNlciIsInNpdGVjb3JlXFxSZWxhdGlvbnNoaXAgQWRtaW5pc3RyYXRvciJdLCJzY29wZSI6WyJvcGVuaWQiLCJFbmdpbmVBUEkiLCJwb3N0bWFuX2FwaSJdLCJhbXIiOlsicHdkIl19.kwsUFFkIByy3jTC3vr7gmlCdbtH9tt4A9pz0mBDzCr8t1CawW9owDCxjgAXEPsydFAPXEcebiVnldqf1bgVMOhHBhi14lhBH2lbsXx-GuwSBE5wbIrCf3DcO-cFQDixQAsU0GeUuLV3_okmY84em-Se_dicsLcPs65L-L75DRw5JgdkRZgUrzAjsnny8aLNrfMR2F8VYviHMpB5p-76OiIuIVr2KWmsa5qvZSX1LeFRr6xzACE276rl4cH-fb56PwOS-EW8i_Tdr4QIZUiOAIvdbpBUTQvZiA-RFKqFFGcNMqBooKWvIQcqMlo4FH2SrthO-hRvEAPvBSgvS52c56Q",
    "expires_in": 3600,
    "token_type": "Bearer"
}
```

The JWT contains an `access_token` with the `<header>.<payload>.<signature>` format. You can use [https://jwt.io](https://jwt.io/#debugger-io?token=eyJhbGciOiJSUzI1NiIsImtpZCI6IjZFQjhFMDg3NjhBNjg2M0VCMUIzMTQ3NTEwMjdDMjVEQzhFMDYwOUQiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJicmpnaDJpbWhqNnhzeFIxRUNmQ1hjamdZSjAifQ.eyJuYmYiOjE1NjU2MzMzNjQsImV4cCI6MTU2NTYzNjk2NCwiaXNzIjoiaHR0cHM6Ly9pZGVudGl0eSIsImF1ZCI6WyJodHRwczovL2lkZW50aXR5L3Jlc291cmNlcyIsIkVuZ2luZUFQSSIsInBvc3RtYW5fYXBpIl0sImNsaWVudF9pZCI6InBvc3RtYW4tYXBpIiwic3ViIjoiZTI3ZGYyMTVhMTBiNGQ0ZTg2ZWUzYTJhNjc1MzljYTkiLCJhdXRoX3RpbWUiOjE1NjU2MzMzNjQsImlkcCI6ImxvY2FsIiwibmFtZSI6InNpdGVjb3JlXFxBZG1pbiIsImVtYWlsIjoiIiwicm9sZSI6WyJzaXRlY29yZVxcQ29tbWVyY2UgQWRtaW5pc3RyYXRvciIsInNpdGVjb3JlXFxDdXN0b21lciBTZXJ2aWNlIFJlcHJlc2VudGF0aXZlIEFkbWluaXN0cmF0b3IiLCJzaXRlY29yZVxcQ3VzdG9tZXIgU2VydmljZSBSZXByZXNlbnRhdGl2ZSIsInNpdGVjb3JlXFxDb21tZXJjZSBCdXNpbmVzcyBVc2VyIiwic2l0ZWNvcmVcXFByaWNlciBNYW5hZ2VyIiwic2l0ZWNvcmVcXFByaWNlciIsInNpdGVjb3JlXFxQcm9tb3Rpb25lciBNYW5hZ2VyIiwic2l0ZWNvcmVcXFByb21vdGlvbmVyIiwic2l0ZWNvcmVcXE1lcmNoYW5kaXNlciIsInNpdGVjb3JlXFxSZWxhdGlvbnNoaXAgQWRtaW5pc3RyYXRvciJdLCJzY29wZSI6WyJvcGVuaWQiLCJFbmdpbmVBUEkiLCJwb3N0bWFuX2FwaSJdLCJhbXIiOlsicHdkIl19.kwsUFFkIByy3jTC3vr7gmlCdbtH9tt4A9pz0mBDzCr8t1CawW9owDCxjgAXEPsydFAPXEcebiVnldqf1bgVMOhHBhi14lhBH2lbsXx-GuwSBE5wbIrCf3DcO-cFQDixQAsU0GeUuLV3_okmY84em-Se_dicsLcPs65L-L75DRw5JgdkRZgUrzAjsnny8aLNrfMR2F8VYviHMpB5p-76OiIuIVr2KWmsa5qvZSX1LeFRr6xzACE276rl4cH-fb56PwOS-EW8i_Tdr4QIZUiOAIvdbpBUTQvZiA-RFKqFFGcNMqBooKWvIQcqMlo4FH2SrthO-hRvEAPvBSgvS52c56QeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c) to decode the JWT. After decoding the header and payload of the JWT are visible, a decoded example payload:
```
{
  "nbf": 1565633364,
  "exp": 1565636964,
  "iss": "https://identity",
  "aud": [
    "https://identity/resources",
    "EngineAPI",
    "postman_api"
  ],
  "client_id": "postman-api",
  "sub": "e27df215a10b4d4e86ee3a2a67539ca9",
  "auth_time": 1565633364,
  "idp": "local",
  "name": "sitecore\\Admin",
  "email": "",
  "role": [
    "sitecore\\Commerce Administrator",
    "sitecore\\Customer Service Representative Administrator",
    "sitecore\\Customer Service Representative",
    "sitecore\\Commerce Business User",
    "sitecore\\Pricer Manager",
    "sitecore\\Pricer",
    "sitecore\\Promotioner Manager",
    "sitecore\\Promotioner",
    "sitecore\\Merchandiser",
    "sitecore\\Relationship Administrator"
  ],
  "scope": [
    "openid",
    "EngineAPI",
    "postman_api"
  ],
  "amr": [
    "pwd"
  ]
}
```

The above payload contains information that was issued by the Identity Server, e.g. `amr` for the used authentication method and `role` for the roles assigned to the user.

# Verify JWT
The public key to verify the JWT is defined using a JSON Web Key Set ([JWKS](https://auth0.com/docs/jwks)). The Identity Server exposes a JWKS at https://identity/.well-known/openid-configuration/jwks. The public key (e.g. certificate) is available in the `x5c` field.

To verify a JWT the Commerce Engine uses the public key from the JWKS.

In C# code JWT authentication is configured in `Startup.cs` of the Commerce Engine:
```
public void ConfigureServices(IServiceCollection services)
{
    ...

    services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddIdentityServerAuthentication(options =>
    {
        options.Authority = this.Configuration.GetSection("AppSettings:SitecoreIdentityServerUrl").Value;
        options.RequireHttpsMetadata = false;
        options.EnableCaching = false;
        options.ApiName = "EngineAPI";
        options.ApiSecret = "secret";
    });

    ...
}
```

Note that `AddIdentityServerAuthentication` is an extension method and contains (see [here](https://github.com/IdentityServer/IdentityServer4.AccessTokenValidation/blob/946f39c76ddf3af4d47a5f0d55802aab1d6fa045/src/IdentityServerAuthenticationExtensions.cs#L52)) the configuration that is described in the Identity Server documentation: http://docs.identityserver.io/en/latest/topics/apis.html

Furthermore it seems that the default Commerce Engine implementation,  which only uses JWT tokens and not Reference tokens, defines some unused settings (e.g. `ApiSecret`): https://sitecore.stackexchange.com/questions/20445/should-i-harden-commerce-engine-apisecret

# Verify JWT
A JWT can verified online at https://jwt.io/. You need to supply a public and private key.

The public key can be obtained from the JWKS or directly from the PFX certificate:
```
openssl pkcs12 -in <filename>.pfx -clcerts -nokeys -out cert.pem
```

The private key has to be extracted from the PFX file:
```
openssl pkcs12 -in <filename>.pfx  -nocerts -out key.pem
```

Copy-paste the public and private keys from the `x5c` property (or `cert.pem`) and `key.pem` into the verify `RSASHA256` signature fields in https://jwt.io/.

If everything went well you should see a Valid Signature message.

# Identity Server Configuration
The certificate to use for JWT signing is defined in `Config/production/Sitecore.IdentityServer.Host.xml`. 

It contains, amongst other settings, the certificate to use for signing e.g:
```
<Settings>
  <Sitecore>
    <IdentityServer>
      <CertificateThumbprint>6EB8E08768A6863EB1B314751027C25DC8E0609D</CertificateThumbprint>
      <CertificateStoreLocation>LocalMachine</CertificateStoreLocation>
      <CertificateStoreName>My</CertificateStoreName>
      ...
    </IdentityServer>
  </Sitecore>
</Settings>
```

NB. the certificate thumbprint corresponds with the `kid` (key id) in the JWKS.
