

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