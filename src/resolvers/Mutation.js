const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getUserId, hashPassword } = require('../lib/utils');
const tokenExpiration = 1000 * 60 * 60 * 24 * 365;
const Mutations = {
  async signup(parent, args, ctx, info) {
    const userExists = await ctx.db.exists.User({
      email: args.email
    });

    if (userExists) {
      throw new Error(`Sorry, user with ${args.email} already exists.`);
    }
    if (args.password !== args.password2) {
      throw new Error('Passwords do not match!');
    }
    args.email = args.email.toLowerCase();
    const password = await hashPassword(args.password);
    const user = await ctx.db.mutation.createUser({
      data: {
        name: args.name,
        email: args.email,
        password
      },
      // info is what is returned to the client
      info
    });

    // We just signed up - so go ahead and log the new user in!
    // create the JWT
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // we set the jwt as a cookie on the response
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: tokenExpiration
    });
    // Return the user to the browser
    return user;
  },
  async signin(parent, { email, password }, ctx, info) {
    // check if there is a user with that email
    const user = await ctx.db.query.user({ where: { email } });
    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }
    // check if their password is correct
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid Password');
    }
    // generate the JWT Token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // set the cookie with the token
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: tokenExpiration
    });
    // return the user
    return user;
  },
  async createTrip(parent, args, ctx, info) {
    if (!ctx.request.userId) {
      throw new Error('You must be logged in to do that!');
    }
    // console.log(JSON.stringify(args.markers[0]));
    const trip = await ctx.db.mutation.createTrip(
      {
        data: {
          // This is how to create a relationship between the Trip and the User
          user: {
            connect: {
              id: ctx.request.userId
            }
          },
          markers: {
            // https://www.prisma.io/docs/prisma-client/basic-data-access/writing-data-JAVASCRIPT-rsc6/
            create: args.markers[0].create
          },
          title: args.title,
          startDate: args.startDate,
          endDate: args.endDate,
          archived: args.archived,
          image: args.image,
          lat: args.lat,
          lng: args.lng
        }
      },
      info
    );
    return trip;
  },
  async updateTrip(parent, args, ctx, info) {
    // console.log(JSON.stringify(args));
    const userId = getUserId(ctx);
    if (!userId) {
      throw new Error("Can't update trip if not logged in");
    }
    const tripExists = await ctx.db.exists.Trip({
      id: args.id,
      user: {
        id: userId
      }
    });
    if (!tripExists) {
      throw new Error('Either the trip does not exist or you are not the author of this trip.');
    }
    return ctx.db.mutation.updateTrip(
      {
        where: {
          id: args.id
        },
        data: args.data
      },
      info
    );
  }
};

module.exports = Mutations;

//   async createOrder(parent, args, ctx, info) {
//     // 1. Query the current user and make sure they are signed in
//     const { userId } = ctx.request;
//     if (!userId) throw new Error('You must be signed in to complete this order.');

//     // Query current user
//     const user = await ctx.db.query.user(
//       { where: { id: userId } },
//       `
//         {
//           id
//           name
//           email
//         }
//       `
//     );

//     // 2. Calculate total price
//     const amount = 999;

//     // 3. Create the stripe charge (turn token into money)
//     const charge = await stripe.charges.create({
//       amount,
//       currency: 'USD',
//       source: args.token
//     });

//     // 4. Create the order
//     const order = await ctx.db.mutation.createOrder({
//       data: {
//         price: charge.amount, // comes back from Stripe
//         charge: charge.id, // given by Stripe
//         user: { connect: { id: userId } }
//       }
//     });

//     // 5. Return the Order to the client
//     return order;
//   }
// };

// module.exports = Mutations;
