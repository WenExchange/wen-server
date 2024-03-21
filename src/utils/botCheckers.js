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

          // if (`${error?.rawError?.code}` === "10007") {
          //   console.log(`${user.id} - invalid unknown id (will delete) `);
          //   return strapi.entityService.delete(
          //     "api::early-user.early-user",
          //     user.id
          //         ).then(res => {
          //           console.log(`${user.id} deleted`);
          //           return user.id
          //         })
          
          // } 


          console.log(`${user.id} - invalid member (rawError - ${JSON.stringify(error?.rawError)})`);
      
        }
        console.log(`${user.id} - invalid member (catch)`);
        return null
      
 
      })
    }))

    const filteredDeletedIds = results.filter(_ => _ !== null)
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

 

  // await Promise.all(willDeleteUserIds.map(id => {
  //   return strapi.entityService.delete(
  //     "api::early-user.early-user",
  //     id
  
  //   );
  // }))

  console.log("complete");


}


const checkIsValidTwitterUser = async ({strapi, start, limit}) => {
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

  const checkOGPass = async ({strapi}) => {
    try {
            const roleId = "1212065483596103792"

      const dm = DiscordManager.getInstance();
      const guild = await dm.getGuild("1205136052289806396")
      // console.log(333, "guild",guild);
    //   const options = {
    //     limit: 1000
    //   }
    //   const after = 0
    //   console.log(333,"start");
    //   const members =  await guild.members.fetch()

    //   const membersWithRole = []
    //   for (const [memberId, member] of members) {
    //     if (member.roles.cache.has(roleId)) {
    //         membersWithRole.push(member.user.id);
    //     }
    // }

    // console.log(555,membersWithRole, membersWithRole.length);
    const discordIds = [
      '311302533731844106',  '1009414571636818021', '973348343080173608',
      '901850062181785741',  '960052821305229312',  '756535931267448853',
      '710340567309090817',  '959390320590749778',  '906224974598115359',
      '1211398527759159337', '1193568911128547390', '1093646722980384830',
      '690568417719091270',  '1119477553237852200', '1073599001896693781',
      '919116576043708446',  '964580971393458256',  '849932743877197866',
      '906402093592616981',  '248102649289768960',  '1054800764054278164',
      '965935575012093974',  '936180790918778900',  '760895520830128189',
      '1105375520713101483', '703374014160306207',  '1006599996612812821',
      '932145897503076382',  '395001718796058625',  '1084942743555559435',
      '885236953417654303',  '1117689337530814464', '889209798543933450',
      '815484967752171530',  '699305767525679244',  '1184931199278403664',
      '925962513932251136',  '418308125058138112',  '973788280275476530',
      '979367045663703090',  '1184117824126472253', '1209782358757220397',
      '497207047566262293',  '688692413115400367',  '1034829390896443402',
      '817189566963515412',  '1178358877520146522', '125394432429129729',
      '842380824639832094',  '763687881231171594',  '1095146785783164979',
      '902907305299951706',  '1207120453890613268', '963935453491368016'
    ]


    const promises = discordIds.map(discord_id => {
      return strapi.entityService.findMany(
        "api::early-user.early-user",
        {
          filters: {
            "discord_id": discord_id
            
          }
        }
    
      ).then(earlyUser => {
        if (earlyUser.length > 0) {
          return earlyUser[0].id
        } else {
          return null
        }
      })
    })

    const result = await Promise.all(promises)
    console.log(555, result);

    const willUpdatedPromises = result.filter(_ => _ !== null).map(user_id => {
      return strapi.entityService.update(
        "api::early-user.early-user", user_id,
        {
        data: {
          is_wl: true
        }
        }
    
      )
    })

    const willUpdated = await Promise.all(willUpdatedPromises)

    console.log(555, willUpdated);




    } catch (error) {
      console.log(555,error.message)
    }
 
    
  }

  const checkOGPassWithWalletList = async ({strapi}) => {
    try {

      let walletsString = `0x0e5b9883fCC0A028B7c53Ad0B905c845d756Cb91
      0x7E392393C99BFA5405010B56476c4E14253872A6
      0xefAEceAcCf6D0FD80AcbCde265259Db604Ae30c7
      0x32e211E0F0Cf0a00b6903261e6E70d34727BfE98
      0x238f101E12cE63Dc475A1f8f079e3086d8c6c9ae
      0xb311Ba41B8F4ed74F5129ff7A306Bff6dB414c44
      0xabC81F048B5851A9Ce1dF28417695a6c02560a5A
      0x0b13734813Ae9B0947F94225F408f102A2cE6C61
      0x465e9172326a471C3953d946723d91fCE4F5c18B
      0xDe107dB2efec7a9C137021c4208954F885de5976
      0x21422d9f71F72812278860B6Df7dB4E34672052C
      0x8227CD1705c82917cF1dBb39443f3838DC8919FA
      0x670a33EA8c44f1eFd07272DEf910E39C889fb741
      0x4ab68d88c0eebe11c0e44d98a1a24279c8c1c66c
      0xDd9F8395b65D5195B4E2152dE3c803C8e3797d5C
      0xd16D23d7a0dAD6d15E6Bda2a20aa1d0652e93AE1
      0x822a89373775B09F6C49E638d727C5D979cFe79a
      0xd79f0CcB4526bCDB10e4CCD1224AAFD68BEf08A7
      0x4634AaA8A8948dE732eb298F6bfF3176697f7cC6
      0x9b0726e95e72eB6f305b472828b88D2d2bDD41C7
      0x271ae5A9e689ee106EeF2E70861122Aaf2A3135f
      0x95eE8B32AAC20a4Ca806D801774Fc5e31feCE7D4
      0x515299b1A2637181ec95a3EFEaa42A466195A40f
      0x7E4a82326dCb5f40851Dcf67b145a3ee68Fb1d19
      0x7EB6Dd4A0B074F405ac5D70aFd13C0d56CB497B7
      0xbC1eB4359ab755Af079F6EF77E3FaAc465e53EDA
      0xa165B3760030099bDcC5D5d54630e5016e042789
      0x13a1DB3301fE0dd554aA4Cd4fDA4e27fa1f63Bba
      0xD5fe8DF39fDbdbdb55fba0e2078306656aD706cB
      0xC4c55BA570B8aDd86Fe7b0232FAE76564aF4534b
      0x9f56120A293644f41dE630BABE0BEAD8841E155f
      0x532b7b0B8DcCCa7464A48548cFf76557d8aBe4F2
      0x34917580e0794e66f87A9b757f197EaAD49e3Af0
      0x0FE2D60C63DBCC370dB161eFCa18d0707821Ffa7
      0x41Fe7FfDed395592450B8fe2Ba814F292e027D63
      0x2B8190B5b7AD1434509D5ADa5550489782e0f688
      0xf2ccBc5A10C02168a0Fa16D684c5efedC95B24b9
      0x72BB00D97124D1Dd69C4257039d09dE9a5F6A540
      0xf961aBb718541610FC0c66383eBeA6C94E25C779
      0x053d8057C686FC1f21666f4905C40aFf7d8a3F70
      0xAb92B6636a2c9908c8420bEA1e2870Ec44C0BFC1
      0x5A2Bd24797101E46ef21fF507FFb215297FADAc4
      0x0a4129935D288ae3E3519551B75a93695647471F
      0x02597B9A2e32e173FB6A25708310655Ca5897939
      0xb39fc6A4a874F7da2E2289374d883Ac573158618
      0x18b32bc6C98d025DD1284628027F6369f1825829
      0x27195e6F105b5dA6177eB2eACce71f12e3d671e7
      0xbEe28e4AB9384e53A1F947c22aF802d3F4B4Cda3
      0x541c655fe515E4f23cEBA008aefE77f76C14704b
      0x3db035af1Db1063d26775165487bAB12EB292a9e
      0x35D2e8a8c9f0F6521a509287fD8c1d6a718D8806
      0x6E20Be7599064c75508ab8d863F9969fBb963441
      0xcCb7Fa057aB548fFAD11cf98738A73d528419633
      0xEA203b8FC8EEF6Ee84A68ecE3325348D2fbEB90E
      0x7344184F2254d15Fe99016c5bFf204580a2539bc
      0x35b327C99828F2B839649f8508d5b593df87eC77
      0x4E331616a6f65eA8012C9e4c0C81Bfe30EA7fa06
      0xafda992129426B1f17293D83830184E619b4cf39
      0xaD795f6422027911AfE3585b42207b93E88a85B9
      0xbC8744370bCb6D5AbF5dE8B4086ecfBB4C5629C3
      0xD9ee8208fA913A745E4AE3F272Ec3ef8083b5AcC
      0x53D295c7729b7E99769850ADA662902Fa4Cdc70E
      0x7Cc17CF03E2Dc72E33ccb67b654A8F098F2b62f0
      0xba8cde12f8bdcc15b50920de1b831d32a19ddf12
      0xB8A7eAF5E19Eb765fbc07862863ECEad20d72bE1
      0x4c47b0d65e56cbF97D88B778B7618967211e3b1C
      0xc8444F096E5e22A73F55C0193D303c893795a964
      0x73c752313f0af2B64099f48d63F97C5Aa98204B6
      0x879610D515dcF0533890c54821d9DC9A51e8258C
      0xa7A17E66C5147f05dC0f857535fA5909E63027da
      0x91ac1bdC61f290bC96a1112c0374acF53a96FccE
      0xfCDB55533F5910B2835645E3858fB210817faFfc
      0x9F600B1DD93a164da278BDC29E71B9c66d95CD06
      0xb48837fCf67C3E62874400096387926783f22A7F
      0x4359972843577C18a6f68c6Ab57e14113a841233
      0xc9C6916E899949DF86A7960f7868C618b911E0aB
      0x50B5669776B9ca50535a8d3b1Bf9E6ef489D475D
      0xF4B3bb871ddDf98f30EDfcF262DCfb75AAb81EA9
      0x50898DeB33abA4E9aC1b56F8b1800f8FAb81BF18
      0xEA3747F18f643123cC765C6CA1D3fcd79A258f0B
      0x951bf45B6e03a5e8881aDB916ae1308eaef7712a
      0x16D475E61136D3A342318193C98e67Bd0f52e8db
      0x8a4C88eF87448B4a353E87c4dfe7666e1d2F6462
      0xd2975983c4497FCD97d595E4555F357CDFB1c081
      0xbC2AA8833B1056458D0A09490aA2B516DCA9B312
      0x9C0d252CDBB4E92F77e43cEAb1FE82e9E11f7c14
      0x8eeD2038B792bC96F868E4C83d2641ed0914111c
      0xcD6E36e4113C1CAb188a236BcBDd4dE76F1c6040
      0x587dE2BDe0d59931CB29571d4A58E64958ACE620
      0x998404D5CD6e83d20d47D2D3259718Ca9Bad7291
      0xF685092F193139FbCD2861420F700E753997c33F
      0xEcd9a17d1bBDdDb1EE1A0a0458958EcF4B4bA65C
      0x1DFaB033cF5fe059fE8C5F91C68149A12Cd53a6d
      0xA80d3a17a6DbF3fBC472AC5Df75e025C579429Af
      0x69B06D523a16E061D3DE6e01c5830cb7444d4C4b
      0x2eB8aa11450E331ED1603097c1BEe5c97dBEd92f
      0xfD0c3443760d1Ce5c118E88F8787caEA2a08d155
      0x95d3bdB8Db905FB60472E5478B3b6282401ed08F
      0x7Ad5c4d0061c4a340D0845f653658F99C4c72fB7
      0xE02599474556684E9Cb7aaCe23af278E20ed24d6
      0xc6A5f2eaE335CEecF0673e3ff47acc9Ef4E3eC04
      0x3e0217808C781812Bd7301b7a8Ebf83a9e637A66
      0x8575e3B5c39e21634576113E97D8f52c714a5C67
      0x546a0ED69a7DC15f7b6A4Ce28550dbBAA9291Fb0
      0xe4CF60dC1Dde5CdfEBCc94656D496020658DFE47
      0x8eCbAD4833FFe28125fF23C9ed80F4C4765246DC
      0x4D03BB75b7982a7D424DE19d605FF769Df0E369b
      0x75ecD43B97165998da46E03c5E0c65344baaA322
      0xBA109a8caFb7F26bC311cE953C4901A883f90BCf
      0xC7688c95E1bEE0c7c31A6293075404E0AC0f5ec4
      0xb631Ec0870833Fa447AA45A2e4163f64449De39C
      0x8274238b08D444F0865706956D1f91B7121Aa924
      0x35e37Ca9e3e6988b208F6e58977516d1ee6E75bB
      0x332080ab72C5bF1259992e2c949A70427482c1C9
      0x353e24b8280dE2c13a8FEE1956AFB19D329B66e3`

      walletsString = JSON.stringify(walletsString).replace(/\s/g, "")
      walletsString = walletsString.replaceAll(`\\n`,',')	
      // console.log(444, "walletsString", walletsString);
      walletsString = JSON.stringify(walletsString).replace(/"/g, ``)
      walletsString = walletsString.replaceAll(`\\`,'')	
      console.log(444, "walletsString", walletsString);

      
    

      // console.log(444, "walletsString", walletsString.replaceAll(`\\n`,',')	 );

    const wallets = walletsString.split(`,`)
    console.log(444, wallets );


    // const users = await strapi.entityService.findMany(
    //   "api::early-user.early-user",
    //   {
    //     filters: {
    //       "$or": wallets.map(wallet => {
    //         return {
    //           wallet: {
    //            
    //           }
    //         }
    //       })
          
    //     }
    //   }
    // )

    let blocked = []
    const promises = wallets.map(wallet => {
      return strapi.entityService.findMany(
        "api::early-user.early-user",
        {
          filters: {
            "wallet": {
              "$eq":wallet
            }
            
          }
        }
    
      ).then(earlyUser => {
        if (earlyUser.length > 0) {
          return earlyUser[0].id
        } else {
          blocked.push(wallet)
          return null
        }
      })
    })

    const result = await Promise.all(promises)

    console.log(444, result);
    console.log(555, blocked);


    // const userIds = await Promise.all(users.map(user=> user.id))
    // console.log(555, userIds);

    // const willUpdatedPromises = userIds.map(user_id => {
    //   return strapi.entityService.update(
    //     "api::early-user.early-user", user_id,
    //     {
    //     data: {
    //       is_wl: true
    //     }
    //     }
    
    //   )
    // })

    // const willUpdated = await Promise.all(willUpdatedPromises)

    // console.log(555, willUpdated);




    } catch (error) {
      console.log(555,error.message)
    }
 
    
  }

  const checkOGPassWithTwitterId = async ({strapi}) => {
    try {


      const TwitterIds = []

  


    const users = await strapi.entityService.findMany(
      "api::early-user.early-user",
      {
        filters: {
          "$or": TwitterIds.map(TwitterId => {
            return {
              twitter_id: {
                "$eq":TwitterId
              }
            }
          })
          
        }
      }
    )

  


    const userIds = await Promise.all(users.map(user=> user.id))
    console.log(555, userIds);

    // const willUpdatedPromises = userIds.map(user_id => {
    //   return strapi.entityService.update(
    //     "api::early-user.early-user", user_id,
    //     {
    //     data: {
    //       is_wl: true
    //     }
    //     }
    
    //   )
    // })

    // const willUpdated = await Promise.all(willUpdatedPromises)

    // console.log(555, willUpdated);




    } catch (error) {
      console.log(555,error.message)
    }
 
    
  }

  module.exports = {
    checkIsValidTwitterUser,
    checkIsValidIDiscordUser,
    getEarlyUsers,
    findBots,
    checkOGPass,
    checkOGPassWithWalletList,
    checkOGPassWithTwitterId
  }


  