# Smart Quote API

This is the API backend for the Smart Quote application, built with Ruby on Rails 8.

## Prerequisites

- Ruby 3.4.5
- PostgreSQL
- Docker (for deployment with Kamal)

## Setup

1. **Install dependencies:**

   ```bash
   bundle install
   ```

2. **Database Setup:**

   Ensure PostgreSQL is running, then create and migrate the database:

   ```bash
   bin/rails db:prepare
   ```

## Running the Application

Start the Rails server:

```bash
bin/rails server
```

The API will be available at `http://localhost:3000`.

## Testing

Run the test suite:

```bash
bin/rails test
```

## Code Quality & Security

- **Linting:** Run `bin/rubocop` to check for code style issues.
- **Security:** Run `bin/brakeman` to scan for security vulnerabilities.

## Deployment

This application is configured for deployment using [Kamal](https://kamal-deploy.org/).

1. **Setup Kamal:**

   ```bash
   kamal setup
   ```

2. **Deploy:**

   ```bash
   kamal deploy
   ```
