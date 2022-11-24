# 🚀 Express-Hotel

A REST API for managing hotel bookings.

## 📝 Description

⭐ **Guests Can Do The Following:**

- Search for room availability by dates, min and max price, room view, and if smoking or not.
- Request all room types and view the details of each one.

✴️ **Customer Accounts Can Do The Following:**

- Create a new customer account.
- Sign in.
- Update their profile.
- Update their password.
- Request a password reset URL if they forgot the password.
- Request all their bookings and view the details of each one.
- Make bookings with online payment.
- Customers have all the privileges of guests.

❇️ **Admin Accounts Can Do The Following:**

- Request all users.
- Request all bookings.
- Make bookings without online payment.
- Create, request, update, delete rooms.
- Create, request, update, delete units.
- Admins have all the privileges of guests and customers.

## 💎 Technologies

1. Nodejs / Express
2. MongoDB / Mongoose
3. Used `stripe` for processing online booking payments and webhooks to store bookings in the database.
4. Used fake SMTP service "Ethereal" for sending welcome emails and password reset emails. `nodemailer` is used to connect with the mail service.
5. Packages used for web security: `helmet`, `express-mongo-sanitize`, `express-rate-limit`, `jsonwebtoken`, `bcryptjs`, `validator`, `hpp`.
6. Packages used for web performance: `cors`, `compression`.

## ⚙️ Installation

**Step 1:** Install dependencies.

```shell
npm install
```

**Step 2:** [Create MongoDB Atlas account](https://docs.atlas.mongodb.com/getting-started/).

**Step 3:** Create a `.env` file in the root folder and add the required environment variables. Check `.env.sample` file to find all the required environment variables.

**Step 4:** Import the required datasets into the database.

```shell
node data/data.js --import
```

All other available options for importing and deleting data:

```shell
node data/data.js --import (all|users|rooms|units|bookings)

node data/data.js --delete (all|users|rooms|units|bookings)
```

**Step 5:** If you need predefined datasets, import files from `/data/exportedData/` folder by using the [`mongoimport` tool](https://docs.mongodb.com/database-tools/mongoimport/).

**Step 6:** Start the server.

```shell
# In a development environment.
npm run start-dev

# In a production environment.
npm run start-prod
```

## 🚥 API Design

### 1. Resources / Models

| #   | Resource | Model   |
| --- | -------- | ------- |
| 1   | Users    | User    |
| 2   | Rooms    | Room    |
| 3   | Units    | Unit    |
| 4   | Bookings | Booking |

### 2. Routes

#### 2.1. Public Routes

| #   | HTTP Method | URL                                                         | Controller            |
| --- | ----------- | ----------------------------------------------------------- | --------------------- |
| 1   | `POST`      | `/api/v1/users/signup`                                      | createOneUser         |
| 2   | `POST`      | `/api/v1/users/signin`                                      | authenOneUser         |
| 3   | `POST`      | `/api/v1/users/forgotPassword`                              | forgotPassword        |
| 4   | `PATCH`     | `/api/v1/users/resetPassword/:resetToken`                   | resetPassword         |
| 5   | `GET`       | `/api/v1/rooms`                                             | requestAllRooms       |
| 6   | `GET`       | `/api/v1/rooms/:id`                                         | requestOneRoom        |
| 7   | `GET`       | `/api/v1/units/search?start=&end=&min=&max=&view=&smoking=` | requestAvailableUnits |
| 8   | `POST`      | `/api/v1/webhook-checkout`                                  | webhookCheckout       |

#### 2.2. Private Routes

| #   | HTTP Method | URL                                 | Controller             |
| --- | ----------- | ----------------------------------- | ---------------------- |
| 1   | `GET`       | `/api/v1/users/:id`                 | requestOneUser         |
| 2   | `PATCH`     | `/api/v1/users/:id`                 | updateOneUser          |
| 3   | `DELETE`    | `/api/v1/users/:id`                 | deleteOneUser          |
| 4   | `PATCH`     | `/api/v1/users/updatePassword`      | updatePassword         |
| 5   | `POST`      | `/api/v1/bookings/checkout-session` | createCheckoutSession  |
| 6   | `GET`       | `/api/v1/bookings/:id`              | requestOneBooking      |
| 7   | `PATCH`     | `/api/v1/bookings/:id`              | updateOneBooking       |
| 8   | `DELETE`    | `/api/v1/bookings/:id`              | deleteOneBooking       |
| 9   | `GET`       | `/api/v1/bookings/users/:userId`    | requestAllUserBookings |

#### 2.3. Admin Only Routes

| #   | HTTP Method | URL                        | Controller         |
| --- | ----------- | -------------------------- | ------------------ |
| 1   | `GET`       | `/api/v1/users`            | requestAllUsers    |
| 2   | `POST`      | `/api/v1/rooms`            | createRooms        |
| 3   | `PATCH`     | `/api/v1/rooms/:id`        | updateOneRoom      |
| 4   | `DELETE`    | `/api/v1/rooms/:id`        | deleteOneRoom      |
| 5   | `POST`      | `/api/v1/units`            | createUnits        |
| 6   | `GET`       | `/api/v1/units`            | requestAllUnits    |
| 7   | `GET`       | `/api/v1/units/:id`        | requestOneUnit     |
| 8   | `PATCH`     | `/api/v1/units/:id`        | updateOneUnit      |
| 9   | `DELETE`    | `/api/v1/units/:id`        | deleteOneUnit      |
| 10  | `POST`      | `/api/v1/bookings`         | createOneBooking   |
| 11  | `GET`       | `/api/v1/bookings?status=` | requestAllBookings |

### 3. Controllers

#### 3.1. Users Controllers

1. createOneUser

   - Req:
     - HTTP: POST
     - data
   - Res:
     - results
     - status
     - message

2. requestAllUsers

   - Req:
     - HTTP: GET
     - authorization header
   - Res:
     - results
     - status
     - data
       - users

3. requestOneUser

   - Req:
     - HTTP: GET
     - authorization header
     - id parameter
   - Res:
     - results
     - status
     - data
       - user

4. updateOneUser

   - Req:
     - HTTP: PATCH
     - authorization header
     - id parameter
     - data
   - Res:
     - results
     - status
     - data
       - user

5. deleteOneUser

   - Req:
     - HTTP: DELETE
     - authorization header
     - id parameter
   - Res:
     - results
     - status

6. authenOneUser

   - Req:
     - HTTP: POST
     - data
   - Res:
     - results
     - status
     - data
       - user
       - token

7. updatePassword

   - Req:
     - HTTP: POST
     - authorization header
     - data
   - Res:
     - results
     - status
     - message

8. forgotPassword

   - Req:
     - HTTP: POST
     - data
   - Res:
     - results
     - status
     - message
     - data

9. resetPassword

   - Req:
     - HTTP: POST
     - resetToken parameter
     - data
   - Res:
     - results
     - status
     - message

#### 3.2. Rooms Controllers

1. createRooms

   - Req:
     - HTTP: POST
     - authorization header
     - data
   - Res:
     - results
     - status
     - data
       - rooms

2. requestAllRooms

   - Req:
     - HTTP: GET
   - Res:
     - results
     - status
     - data
       - rooms

3. requestOneRoom

   - Req:
     - HTTP: GET
     - id parameter
   - Res:
     - results
     - status
     - data
       - room

4. updateOneRoom

   - Req:
     - HTTP: PATCH
     - authorization header
     - id parameter
     - data
   - Res:
     - results
     - status
     - data
       - room

5. deleteOneRoom

   - Req:
     - HTTP: DELETE
     - authorization header
     - id parameter
   - Res:
     - results
     - status

#### 3.3. Units Controllers

1. createUnits

   - Req:
     - HTTP: POST
     - authorization header
     - data
   - Res:
     - results
     - status
     - data
       - units

2. requestAllUnits

   - Req:
     - HTTP: GET
     - authorization header
   - Res:
     - results
     - status
     - data
       - units

3. requestOneUnit

   - Req:
     - HTTP: GET
     - authorization header
     - id parameter
   - Res:
     - results
     - status
     - data
       - unit

4. updateOneUnit

   - Req:
     - HTTP: PATCH
     - authorization header
     - id parameter
     - data
   - Res:
     - results
     - status
     - data
       - unit

5. deleteOneUnit

   - Req:
     - HTTP: DELETE
     - authorization header
     - id parameter
   - Res:
     - results
     - status

6. requestAvailableUnits

   - Req:
     - HTTP: GET
     - query parameters
   - Res:
     - results
     - status
     - data
       - units

#### 3.4. Bookings Controllers

1. createCheckoutSession

   - Req:
     - HTTP: POST
     - authorization header
     - data
   - Res:
     - results
     - status
     - data
       - session

2. createOneBooking

   - Req:
     - HTTP: POST
     - authorization header
     - data
   - Res:
     - results
     - status
     - message
     - data

3. requestAllBookings

   - Req:
     - HTTP: GET
     - authorization header
   - Res:
     - results
     - status
     - data
       - bookings

4. requestOneBooking

   - Req:
     - HTTP: GET
     - authorization header
     - id parameter
   - Res:
     - results
     - status
     - data
       - booking

5. updateOneBooking

   - Req:
     - HTTP: PATCH
     - authorization header
     - id parameter
     - data
   - Res:
     - results
     - status
     - data
       - booking

6. deleteOneBooking

   - Req:
     - HTTP: DELETE
     - authorization header
     - id parameter
   - Res:
     - results
     - status

7. requestAllUserBookings

   - Req:
     - HTTP: GET
     - authorization header
     - userId parameter
   - Res:
     - results
     - status
     - data
       - bookings

8. webhookCheckout

   - Req:
     - HTTP: POST
   - Res:

#### 3.5. Error Response

##### 3.5.1. In Development

```js
{
  status: ...,
  message: error.message,
  error: { ...error, stack: error.stack }
}
```

##### 3.5.2. In Production

```js
{
  status: ...,
  message: error.message,
}
```

## 🗂️ Data Design

### 1. Rooms

#### 1.1. Types

| #   | Type               | No of Rooms | Balcony | View        |
| --- | ------------------ | ----------- | ------- | ----------- |
| 1   | Superior           | 8 rooms     | false   | Pool        |
| 2   | Deluxe             | 8 rooms     | true    | Pool        |
| 3   | Premier            | 8 rooms     | true    | Partial Sea |
| 4   | Signature          | 8 rooms     | true    | Sea         |
| 5   | Signature Plus     | 8 rooms     | true    | Sea         |
| 6   | Signature Panorama | 4 rooms     | true    | Sea         |
| --- | ------------------ | ----------- | ------- | ----------- |
|     | TOTAL              | 44 rooms    |         |             |

| #   | Type               | Room Numbers                                   |
| --- | ------------------ | ---------------------------------------------- |
| 1   | Superior           | 1003, 1004, 2003, 2004, 3003, 3004, 4003, 4004 |
| 2   | Deluxe             | 1002, 1005, 2002, 2005, 3002, 3005, 4002, 4005 |
| 3   | Premier            | 1001, 1006, 2001, 2006, 3001, 3006, 4001, 4006 |
| 4   | Signature          | 1008, 1009, 2008, 2009, 3009, 3010, 4009, 4010 |
| 5   | Signature Plus     | 1007, 1010, 2007, 2010, 3008, 3011, 4008, 4011 |
| 6   | Signature Panorama | 3007, 3012, 4007, 4012                         |

#### 1.2. Floors

| #   | Room Numbers      | Smoking Floor | Room Types                                     |
| --- | ----------------- | ------------- | ---------------------------------------------- |
| 1   | Rooms 1001 - 1010 | false         | 2 \* (Sup / Del / Pre / Sig / Sig-Pl)          |
| 2   | Rooms 2001 - 2010 | false         | 2 \* (Sup / Del / Pre / Sig / Sig-Pl)          |
| 3   | Rooms 3001 - 3012 | true          | 2 \* (Sup / Del / Pre / Sig / Sig-Pl / Sig-Pa) |
| 4   | Rooms 4001 - 4012 | true          | 2 \* (Sup / Del / Pre / Sig / Sig-Pl / Sig-Pa) |
