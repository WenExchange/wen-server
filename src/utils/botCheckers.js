const { TwitterApi } = require("twitter-api-v2");
const DiscordManager = require("../discord/DiscordManager");

const twitterClient = () => {
    return new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
}


const getEarlyUsers = async ({strapi,start, limit}) => {
  const earlyUsers = await strapi.entityService.findMany(
    "api::early-user.early-user",
    {
      sort: {createdAt: "asc"},
      start,
    limit
    }
  );

  return earlyUsers
}

const checkIsValidIDiscordUser = async ({strapi, start, limit}) => {
  const dm = DiscordManager.getInstance();
  const guild = await dm.getGuild("1205136052289806396")

  const users = await getEarlyUsers({strapi,start, limit})

  let errorUsers = []
  const batchUnit = 100
  for (let i = 0; i < users.length; i+= batchUnit) {
    console.log(i);
    const user = users[i];

    const batchUsers = users.slice(i, i + batchUnit)

    const batchUserDiscordIds = batchUsers.map(user => user.discord_id)
    console.log(111, "batchUserDiscordIds", batchUserDiscordIds);

    const results = await Promise.all(batchUsers.map(user => {
      return dm.getMember({guild, userId: user.discord_id}).then(member => {
        console.log(`${user.id} - valid member`);
        return null
      }).catch(error => {
        if (error?.rawError?.code) {
          if (`${error?.rawError?.code}` === "10013") {
            console.log(`${user.id} - invalid not found (will delete) `);
            return strapi.entityService.delete(
              "api::early-user.early-user",
              user.id
                  ).then(res => {
                    console.log(`${user.id} deleted`);
                    return user.id
                  })
          
          } 
          if (`${error?.rawError?.code}` === "50035") {
            console.log(`${user.id} - invalid discord id (will delete) `);
            return strapi.entityService.delete(
              "api::early-user.early-user",
              user.id
                  ).then(res => {
                    console.log(`${user.id} deleted`);
                    return user.id
                  })
          
          } 

          if (`${error?.rawError?.code}` === "10007") {
            console.log(`${user.id} - invalid unknown id (will delete) `);
            return strapi.entityService.delete(
              "api::early-user.early-user",
              user.id
                  ).then(res => {
                    console.log(`${user.id} deleted`);
                    return user.id
                  })
          
          } 


          console.log(`${user.id} - invalid member (rawError - ${JSON.stringify(error?.rawError)})`);
      
        }
        console.log(`${user.id} - invalid member (catch)`);
        return null
      
 
      })
    }))

    const filteredDeletedIds = results.filter(_ => _ !== null)
    console.log(333, "filteredDeletedIds",filteredDeletedIds);

  //   const deletedUsers = await Promise.all(filteredErrorUserIds.map(deleteUserId => {
  //     return strapi.entityService.delete(
  // "api::early-user.early-user",
  // deleteUserId
      // )
// }))

// console.log(333, `${deletedUsers.length} deleted`);

  }

}

const deleteBotUsersByDiscordIds = async ({strapi, discord_ids}) => {

  
  const earlyUsers = await strapi.entityService.findMany(
    "api::early-user.early-user",
    {
      filters: {
        "$or": discord_ids.map(discord_id => {
          return {
            discord_id: {
              "$eq":discord_id
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


const checkIsValidTwitterUser = async ({strapi, start, limit}) => {
  console.log(333, "checkIsValidTwitterUser");
  const users = await getEarlyUsers({strapi,start, limit})

  const _twitterClient = twitterClient()

  let errorUsers = []
  const batchUnit = 100
  for (let i = 0; i < users.length; i+= batchUnit) {
    console.log(i);
    const user = users[i];

    const batchUsers = users.slice(i, i + batchUnit)

    const batchUserIds = batchUsers.map(user => user.twitter_id)
    console.log(111, "batchUserIds", batchUserIds);
    const twitterUser =  await _twitterClient.v2.user(batchUserIds[0])
    return 
    const twitterUsers =  await _twitterClient.v2.users(batchUserIds)
    // console.log(111, "twitterUsers", twitterUsers);
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
    checkIsValidIDiscordUser,
    getEarlyUsers,
    findBots,
  }