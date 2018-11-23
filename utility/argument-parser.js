

class ArgumentParser {
    //args is expected to be an array, descriptor should be something like '--'
    static parse(args, descriptor) {
        try {
            let cmdLocations = []; 
            console.log(`args : ${args}`);
            for(var i = 0; i < args.length; i++) {
                if(args[i].indexOf(descriptor) == -1 ? false : true) {
                    if(cmdLocations.length > 0) {
                        cmdLocations[cmdLocations.length -1].end = i -1; 
                        cmdLocations.push({ 
                            'cmd' : args[i],
                            'start' : i + 1, 
                            'end' : null
                        });
                    }
                    if(cmdLocations.length == 0 ){
                        cmdLocations.push({
                            'cmd' : args[i], 
                            'start' : i + 1,
                            'end' : null
                        });
                    } 
                }
        }
        //finally we know that if we've iterated throughout the array the we can mark the command endpoint... 
        if(cmdLocations[cmdLocations.length -1] != null) {
            cmdLocations[cmdLocations.length -1].end = args.length -1; 
        }
        //cmdLocations[cmdLocations.length -1].end = args.length -1; 
        return this.generateResultList(cmdLocations, args);
        }catch(error) {
            console.log(error); 
        }
    }

    static generateResultList(cmdLocations, args){
        let cmds = {}; 
        cmdLocations.forEach((cmdL) => {
            var text = ''; 
            for(var i = cmdL.start; i <= cmdL.end; i++) {
                text += `${args[i]} `; 
            }   
            cmds[cmdL.cmd] = text.trim(); 
        }); 
        return cmds; 
    }
}

module.exports = ArgumentParser; 