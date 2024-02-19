const { TwitterApi } = require("twitter-api-v2");

const twitterClient = () => {
    return new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
}



const getUser = async () => {
    const client = twitterClient()
    try {
        const user =  await client.v1.userFollowerIds({user_id: "1750532543798218752"})
        return user
    } catch (error) {
        console.log( error.message);
    }
 
}

module.exports = {
    twitterClient,
    getUser
  }