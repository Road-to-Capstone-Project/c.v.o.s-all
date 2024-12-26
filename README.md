# c.v.o.s-all

## Installation
### Prerequisites
- Node.js v20+ 
- Yarn
- PostgresSQL
### Steps
*1.*Fork the repository to your Github account 

*2.a* - Clone the forked repository and open the `c.v.o.s-all` directory in `VSCode`:
```bash
git clone https://github.com/your-GitHub-account/c.v.o.s-all.git
cd c.v.o.s-all
```

*2.b* - Create an empty database `c.v.o.s` in Postgres server   

*2.c* - Rename the `.env.template` file to `.env` & `.env.local.template` to `.env.local`

*3.*Create a new branch from `main` & then checkout it

*4.*Install dependencies **IN BOTH** `c.v.o.s-admin` & `c.v.o.s-storefront` directory:
``` bash
cd c.v.o.s-admin # or cd c.v.o.s-storefront
yarn 
```
*5.*Setup and seed the database:
```bash
npx medusa db:setup
yarn seed
npx medusa user --email <your-email> --password <your-password>
```
*6.*Start the `C.V.O.S` application (**IN BOTH** `c.v.o.s-admin` & `c.v.o.s-storefront` directory):
``` bash
cd c.v.o.s-admin # or cd c.v.o.s-storefront
yarn dev
```
## Contributing
<!---
Tham khảo cái này: https://github.com/medusajs/medusa/blob/develop/CONTRIBUTING.md
-->
... to be continued