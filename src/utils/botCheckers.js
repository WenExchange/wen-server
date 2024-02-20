const { TwitterApi } = require("twitter-api-v2");

const twitterClient = () => {
    return new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
}


const getEarlyUsers = async ({strapi,start, limit}) => {
  const earlyUsers = await strapi.entityService.findMany(
    "api::early-user.early-user",
    {
      start,
    limit
    }
  );

  return earlyUsers
}

const checkIsValidTwitterUser = async ({strapi, start, limit}) => {
  console.log(333, "checkIsValidTwitterUser");
  const users = await getEarlyUsers({strapi,start, limit})

  const _twitterClient = twitterClient()

  let errorUsers = []
  const batchUnit = 50
  for (let i = 0; i < users.length; i+= batchUnit) {
    const user = users[i];

    const batchUsers = users.slice(i, i + batchUnit)

    const batchUserIds = batchUsers.map(user => user.twitter_id)
    // console.log(111, "batchUserIds", batchUserIds);
    const twitterUsers =  await _twitterClient.v2.users(batchUserIds)
    const _errorUsers = twitterUsers.errors

   if(Array.isArray(_errorUsers))     errorUsers = [...errorUsers,..._errorUsers ]


   


  }

  console.log(555, errorUsers);

  const errorTwitterUserIds = errorUsers.map(errorData => errorData.value)
  await deleteBotUsersByTwitterIds({strapi, twitter_ids: errorTwitterUserIds})

}

const findBots = async (strapi, isTwitter = true) => {

    const earlyUsers = await strapi.entityService.findMany(
      "api::early-user.early-user",
  
    );
  
    let countInfo = {
  
    }
  
    for (let i = 0; i < earlyUsers.length; i++) {
      const earlyUser = earlyUsers[i];
      if (countInfo[earlyUser[isTwitter ? "twitter_id" :"discord_id"]]) {
        countInfo[earlyUser[isTwitter ? "twitter_id" :"discord_id"]] += 1
      } else {
        countInfo[earlyUser[isTwitter ? "twitter_id" :"discord_id"]] = 1
      }
      
  
      
    }
  
    Object.keys(countInfo).map(id => {
      const count = countInfo[id] 
      if (count <= 5) delete countInfo[id]
    })
  
  
  
    console.log(countInfo);
  
  
  }
  
  const deleteBotUsersByTwitterIds = async ({strapi, twitter_ids}) => {
    // const twitter_id = "2888060375"
    const twitter_id = "1750518424303005696"
  
    
    const earlyUsers = await strapi.entityService.findMany(
      "api::early-user.early-user",
      {
        filters: {
          "$or": twitter_ids.map(twitter_id => {
            return {
              twitter_id: {
                "$eq":twitter_id
              }
            }
          })
          
        }
      }
  
    );
    const willDeleteUserIds = await earlyUsers.map((user, index) => user.id)
    console.log( 333, "willDeleteUserIds", willDeleteUserIds);
  
   
  
    // await Promise.all(willDeleteUserIds.map(id => {
    //   return strapi.entityService.delete(
    //     "api::early-user.early-user",
    //     id
    
    //   );
    // }))
  
    console.log("complete");
  
  
  }

  module.exports = {
    checkIsValidTwitterUser,
    getEarlyUsers,
    findBots,
  }