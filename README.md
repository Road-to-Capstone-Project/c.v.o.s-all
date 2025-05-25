<h1 align="center">
  <a href=""><img src="https://is3-ssl.mzstatic.com/image/thumb/Purple112/v4/ab/d0/0d/abd00d67-060e-c635-fc59-578ed9da57b8/AppIcon-1x_U007emarketing-0-7-0-85-220.png/1000x1000wa.png" alt="C.V.O.S" width="200" height="200"></a>
  <br>
  <br>
  Consoles & Video Games Online Shop
  <br>
</h1>

<p align="center">Your one-stop online shop for the latest consoles, video games, and accessories, offering unbeatable prices and fast delivery! Built with Medusa 2.0 & Next.js</p>

<p align="center">
  <a href="">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="PRs welcome!" />
  </a>
    
  <a href="https://discord.gg/xpCwq3Kfn8">
    <img src="https://img.shields.io/badge/chat-on%20LinkedIn-0077B5.svg" alt="Discord Chat" />
  </a>
</p>

## Table

- [Update](#update)
  - [Update packages](#update-packages)
  - [Run migrations](#run-migrations)
- [Resources](#resources)
      - [Learn more about Medusa](#learn-more-about-medusa)
      - [Learn more about Next.js](#learn-more-about-nextjs)
  - [Contributors](#contributors)

&nbsp;

## Prerequisites

⚠️ We have tested this repo with the below versions:

- ✅ Node 20
- ✅ Postgres 15
- ✅ Medusa 2.4
- ✅ Next.js 15

&nbsp;

## Overview

#### Core features
- **Promotions**. Customers can apply manual and automatic promotions to their cart.
- **Full ecommerce support**
  - Product Pages
  - Product Collections & Categories
  - Cart & Checkout
  - User Accounts
  - Order Details
- **Full Next.js 15 support**
  - App Router
  - Caching
  - Server components/actions
  - Streaming
  - Static Pre-Rendering

...
&nbsp;

#### Demo

...

&nbsp;

## Quickstart

#### Setup C.V.O.S project

```bash
# 1.Fork the repository to your Github account

# 2.a - Clone the forked repository and open the `c.v.o.s-all` directory in `VSCode`:
git clone https://github.com/your-GitHub-account/c.v.o.s-all.git
cd c.v.o.s-all

# 2.b - Create an empty database c.v.o.s in Postgres server

# 2.c - Rename the .env.template file to .env IN BOTH backend & storefront directory, then Assign value given by developers to the environment variables

# 3. Create a new branch from main & then checkout it

# 4. Install dependencies IN BOTH backend & storefront directory:
cd c.v.o.s-all/backend # or cd c.v.o.s-all/storefront
yarn install

# 5. Generate migration files
npx medusa db:generate related-product
npx medusa db:generate Review   

# 6. Setup the database:
npx medusa db:setup --db c.v.o.s

# 7. Start the C.V.O.S application (IN BOTH backend & storefront directory):
cd c.v.o.s-all/backend # or cd c.v.o.s-all/storefront
yarn dev

# 8. Seed the database with mock data (the backend must be started when seeding)
cd c.v.o.s-all/backend
yarn seed-business
yarn seed-AI
```

#### Setup publishable key (fix initial `storefront` error)

- ✅ Visit [Admin: Publishable Key](http://localhost:9000/app/settings/publishable-api-keys)
  - <b>Credentials</b>:
    - <b>email</b>: `21110785@student.hcmute.edu.vn`
    - <b>password</b>: `supersecret`
- ✅ Copy token key of "Webshop"
- ✅ Open file - `storefront/.env`
- ✅ Add token to this var - `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`

```
# Start storefront
yarn dev
```

Visit the following links to see the C.V.O.S storefront & admin

- [Admin](http://domain21110776.ddns.net:9000/app)
- [Storefront](http://domain21110776.ddns.net:8000/vn)

&nbsp;

# Update

Some general guidelines for when you're updating this Starter to a newer version.

## Update packages

Run `yarn install` in both projects to update you're packages to the latest versions.

## Run migrations

To reflect any changes made to data models, make sure to run `npx medusa db:migrate` in the backend project.

# Resources

#### Learn more about Medusa

- [Website](https://www.medusajs.com/)
- [GitHub](https://github.com/medusajs)
- [2.0 Documentation](https://docs.medusajs.com/v2)

#### Learn more about Next.js

- [Website](https://nextjs.org/)
- [GitHub](https://github.com/vercel/next.js)
- [Documentation](https://nextjs.org/docs)

&nbsp;

## Contributors

<a href = "https://github.com/Road-to-Capstone-Project/c.v.o.s-all/graphs/contributors">
  <img src = "https://contrib.rocks/image?repo=Road-to-Capstone-Project/c.v.o.s-all"/>
</a>
