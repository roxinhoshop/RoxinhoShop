// Requer a configuração do banco de dados Prisma.
const { db: prisma } = require('../lib/db');

// Função assíncrona para inserir dados dos produtos no banco de dados.
async function POST(datas) {
    try {
        for (const data of datas) {
            const { title, price, description, avaliation, link, image } = data;
            await prisma.product.create({
                data: {
                    title: title,
                    price: price,
                    description: description,
                    avaliation: avaliation,
                    link: link,
                    image: image
                }
            });
        }

        console.log("NOVO PRODUTO"); 
    } catch (error) {
        console.error(error); 
    }
}


module.exports = {
    POST
};
