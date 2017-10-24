var fs = require('fs');


 const warpCore = require('@warp-works/core');
 var dom = warpCore.getDomainByName('MyShop');


 fs.writeFile("C:/Users/FIM3BE/Documents/openApi.json",dom.getOpenApi(), function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
}); 	



