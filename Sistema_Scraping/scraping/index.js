// PRECISA do módulo puppeteer para controle do navegador e { POST } do arquivo addProduct.js para inserção no banco de dados
const puppeteer = require('puppeteer');
const { POST } = require('./api/addProduct.js');

const product = "notebook";
let pag = 1;
const listProduct = [];
const notAvaliation = 'Não foi avaliado.';
let search = 2; // CONTROLADOR DE QUANTAS PÁGINAS DESEJA GARIMPAR  -> 1 Pág = 20 produtos

(async () => {
    const browser = await puppeteer.launch({
        defaultViewport: { width: 1200, height: 800 } // PRECISA abrir a tela no minimo nessas dimensões, para não dar erro com layout
    });
    const page = await browser.newPage();
  
    await page.goto('https://www.kabum.com.br/');
    await page.waitForSelector('#input-busca');
    await page.type('#input-busca', product); 
    await Promise.all([ 
        page.waitForNavigation(),
        page.click('.sc-jSgvzq.sc-bkzYnD.bsIXwL.hzpqID')
    ]);
  
    const noProductFound = await page.$('.sc-9e19be64-0.bbNoJo') 
    if (noProductFound) {
      console.log("Nenhum produto encontrado com o INPUT de pesquisa passado.");
      await browser.close();
      return;
    }

    // Loop para navegar pelas páginas de produtos e coletar informações.
    let currentUrl = await page.evaluate(() => window.location.href); 
    while (pag <= search) { // AQUI DEFINE QUANTAS PAGINAS DESEJO GARIMPAR
      console.log('pagina', pag);
      const links = await page.$$eval('.sc-cdc9b13f-7.gHEmMz.productCard > a', el => el.map(link => link.href));

      for( const link of links ){
        await page.goto(link);
        await page.waitForSelector('.sc-fdfabab6-6.jNQQeD');
  
        // Extrai os detalhes do produto e trata exceções para campos que podem não estar presentes.
        const title = await page.$eval('.sc-fdfabab6-6.jNQQeD', el => el.innerText);
        const price = await page.$eval('.sc-5492faee-2.ipHrwP.finalPrice', el => el.innerText);
        let description, imageUrl;
        try {
          description = await page.$eval('#iframeContainer', el => el.innerText);
        } catch (e) {
          description = "Descrição não disponível.";
        }

        try {
          imageUrl = await page.$eval('.iiz__img', img => img.src);
        } catch (e) {
          imageUrl = "URL da imagem não disponível.";
        }

        const avaliation = await page.evaluate(() => { 
          const el = document.querySelector('.sc-57aea7be-1.gAjNhT')
          if(!el) return null;
          return el.innerText;
        })

        // Tira uma screenshot em cada página de produto, e salva na pasta "screenshots" com o titulo do produto.
        const screenshotPath = `screenshots/${title.replace(/[/\\?%*:|"<>]/g, '')}.png`; // Remove caracteres inválidos para o nome do arquivo
        await page.screenshot({path: screenshotPath});
        
        const obj = {};
        obj.title = title;
        obj.price = price;
        obj.description = description;
        obj.avaliation = avaliation ? avaliation : notAvaliation;
        obj.link = link;
        obj.image = imageUrl;

        
        if (!obj.title || !obj.price) {
          console.error("Erro: Título ou preço ausente no produto", obj.link);
          continue; 
        }

        listProduct.push(obj);
      }

      // A paginação só existe na tela principal de listagem de produtos, por isso, pego o URL e sempre que acabar uma página, vou para a página de listagem de produtos.
      await page.goto(currentUrl); 
      
      const hasNextPage = await page.$('.next');
      if (hasNextPage) {
        await Promise.all([
            page.waitForNavigation(),
            page.click('.next'),
            
        ]);
        currentUrl = await page.url();
        
        } else {
            break; 
        }
        pag++;
    }

    // Envia os dados coletados para inserção no banco de dados.
    await POST(listProduct);

    await browser.close();
})();
