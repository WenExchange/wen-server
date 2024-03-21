

/**
 * 1. Fetch All Early User 
 * 2. (guests > 0)
 * 1-1 fetch ref-code early user - update invite_point , guests
 * 1-2 bridging_eth , bridging_dai -> eth * 25000, dai * 10
 */

 function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// 청크로 나눈 배열에 대해 비동기 작업을 수행하는 함수
async function processInChunks({earlyUsers, chunkSize, strapi}) {
  const chunks = chunkArray(earlyUsers, chunkSize);
 
  let count = 0
  for (const chunk of chunks) {
    console.log(`strat update - chunk count ${count + 1} / ${ chunks.length}`);
    const promises = chunk.map(earlyUser => {
      const {id, own_code, bridging_eth, bridging_dai} = earlyUser;
      return strapi.db.query("api::early-user.early-user").findMany({
        where: {
          ref_code: own_code
        },
      }).then(refEealyUsers => {
        const total_invite_point = refEealyUsers.reduce((accumulator, currentValue) => accumulator + currentValue.invite_point, 0);
        const guests = refEealyUsers.length;
        const ethPoint = bridging_eth ? bridging_eth * 25000 : 0;
        const daiPoint = bridging_dai ? bridging_dai * 10 : 0;
        const bridging_point = ethPoint + daiPoint;
        const updatedData = {
          total_invite_point,
          guests,
          bridging_point,
          isFinalized: true
        };
        console.log(`will updated - ${id}`);
        return strapi.entityService.update("api::early-user.early-user", id, {
          data: updatedData
        });
      });
    });
    // 현재 청크의 모든 프로미스가 완료될 때까지 기다림
    await Promise.all(promises);
    count += 1
  }
}



const updateEarlyUserPoint = async ({strapi}) => {
  const earlyUsers = await strapi.db.query("api::early-user.early-user").findMany({
    where: {
      $and: [
        {guests: {
          $eq: 0
        }},{isFinalized: {
          $null: true
        }}
      ]
    },
    orderBy: { createdAt: "DESC" }, // 가장최근 Data TODO
  });



  console.log("earlyUsers", earlyUsers.length);
  await processInChunks({earlyUsers, chunkSize: 100, strapi}).then(() => console.log('All chunks processed.'));
  
  
}

  module.exports = {
    updateEarlyUserPoint
  }


  