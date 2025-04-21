# Talendee.io - Backend

# Requirement

-   node.js v18.16.0
-   yarn
-   mysql server

# Installation

-   Clone the repository:

```bash
    git clone git@github.com:NyFenitra/Talenteed-Back.git && cd Talenteed-Back
```

-   Install dependancies

```bash
    yarn install
```

-   Copy .example.env to .env and enter the correct configuration for the right access to db and mailer
-   Create the mysql db correspending to the .env configuration
-   Run:

```bash
    yarn typeorm:db:init
```

This will run migration and seed db

-   Run:

```bash
    yarn dev
```

This will start development server

-   Run:

```bash
    yarn build
```

This will start produxtion server
