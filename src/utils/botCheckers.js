

const findBots = async (strapi) => {

    const earlyUsers = await strapi.entityService.findMany(
      "api::early-user.early-user",
  
    );
  
    let twitterCountInfo = {
  
    }
  
    for (let i = 0; i < earlyUsers.length; i++) {
      const earlyUser = earlyUsers[i];
      if (twitterCountInfo[earlyUser.discord_id]) {
        twitterCountInfo[earlyUser.discord_id] += 1
      } else {
        twitterCountInfo[earlyUser.discord_id] = 1
      }
      
  
      
    }
  
    Object.keys(twitterCountInfo).map(discord_id => {
      const count = twitterCountInfo[discord_id] 
      if (count <= 5) delete twitterCountInfo[discord_id]
    })
  
  
  
    console.log(twitterCountInfo);
  
  
  }
  
  const deleteBotUsers = async strapi => {
    // const twitter_id = "2888060375"
    const twitter_id = "1750518424303005696"
  
    
    const earlyUsers = await strapi.entityService.findMany(
      "api::early-user.early-user",
      {
        filters: {
         twitter_id: {
           "$eq": twitter_id
         }
        }
      }
  
    );
    const willDeleteUserIds = await earlyUsers.map((user, index) => user.id)
    console.log( willDeleteUserIds);
  
   
  
    await Promise.all(willDeleteUserIds.map(id => {
      return strapi.entityService.delete(
        "api::early-user.early-user",
        id
    
      );
    }))
  
    console.log("complete");
  
  
  }

  module.exports = {
    findBots,
    deleteBotUsers
  }