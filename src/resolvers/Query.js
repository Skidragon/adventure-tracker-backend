const { forwardTo } = require('prisma-binding');
const { getUserId } = require('../lib/utils');
const Query = {
  markers: forwardTo('db'),
  users: forwardTo('db'),
  async tripById(parent, args, ctx, info) {
    const tripExists = await ctx.db.exists.Trip({
      id: args.id
    });
    if (!tripExists) {
      throw new Error("A trip with that id doesn't exist.");
    }
    const trip = await ctx.db.query.trip(
      {
        where: {
          id: args.id
        }
      },
      info
    );
    return trip;
  },
  async myTrips(parent, args, ctx, info) {
    const userId = getUserId(ctx);
    // console.log(args);
    if (!userId) {
      throw new Error('You must be logged in to gather your trips.');
    }
    return await ctx.db.query.trips(
      {
        where: {
          user: {
            id: userId
          },
          archived: args.archived
        }
      },
      info
    );
  },
  async me(parent, args, ctx, info) {
    // check if there is a current user ID
    const userId = getUserId(ctx);
    if (!userId) {
      // returning null when a person is not logged in
      return null;
    }
    // found the user
    return await ctx.db.query.user(
      {
        where: { id: userId }
      },
      // info is the query that's coming from client side
      info
    );
  }
};

module.exports = Query;
