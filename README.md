# Crackchester AGM Online Voting Platform
By Ryan Harrison

This system works by launching a docker stack containing three services:

* Web frontend (voting platform) - built in Node.JS
* Reverse proxy (Traefik)
* Container monitoring web frontend on tcp/9000 (Portainer)


## Configuration

The web frontend requires two sets of credentials in order to work. [`nodeapp/config/keys.js'](./nodeapp/config/keys.js) should look like this:

```javascript
module.exports = {
    mongoURI: "<mongodb-database-connection-string>",
    smtpAuth: {
        user: "Amazon SES SMTP username",
        pass: "Amazon SES SMTP password"
    }
}
```

## SSL Certificates

If you are deploying this in amazon, you will likely need to request SSL certificates from LetsEncrypt. A good guide to doing that can be found [here](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/SSL-on-amazon-linux-2.html#letsencrypt). The domain you'll want to request certificates from will likely be a wildcard cert for `*.crackchester.cc` or some subdomain of `crackchester.cc`. 

When you have the certificate and key for the SSL certs, you should change the path specified in the reverse-proxy service in [docker-compose.yml](docker-compose.yml).

## Running

Simply running `docker-compose up -d` should do the trick. If the web frontend has errors, run a single instance to install the packages with `docker-compose run --rm web npm install .` and that should do it.

If you haven't installed docker on the Amazon EC2 instance yet, a good guide for doing so can be found [here](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/docker-basics.html) for docker and [here](https://gist.github.com/npearce/6f3c7826c7499587f00957fee62f8ee9) for docker-compose.