


class User
{
    constructor(name, socket){
        this.name = name;
        this.socket = socket;
    }

    getName(){
        return this.name;
    }
    
    setName(name){
        this.name = name;
    }
    



}
module.exports = User;