const { prisma } = require("./common");
const { faker } = require("@faker-js/faker");

const seed = async () => {
  try {

    const numTrack = 20;
    const tracks = [];
    
    for(let i = 0 ; i < numTrack ; i++){
        const response = await prisma.track.create({
            data: {
                name: faker.music.album(),
            },
        });
        tracks.push(response);
    }

    console.log("tables populated");
  } catch (error) {
    console.error(error);
  }
};

seed();
