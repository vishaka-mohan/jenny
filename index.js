/**
1. create card objects
type = kessho, character, item
color = red, blue, green, black, yellow
char_name 
hp
damage
attacks = {req = {color : n}, attackPoint}
kessho 



2. create player object
name
health
hand = []
deck = []
active =
backup = []

shuffle deck 
first 5 in hand
while both not iswinner or game not stopped or deck size still not zero:
a. remove from deck top, add to hand - draw a card
b. display only kessho cards from hand - prompt which to choose. ask which card to apply to. active or backup. whichever card chosen, add kessho variable
c. display only character cards in hand - ask if want to include in bench
d. attack - check kessho req. show only those attack is feasible
e. choose attack. reduce opponent  health as per demage

 */


function Player(name, deck){
    this.name = name;
    this.health = 5;
    this.hand = [];
    this.deck = [...deck];
    this.active = {};
    this.backup = [];
    
}


Player.prototype = {

    shuffleDeck : function (){
        for (var i = this.deck.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = this.deck[i];
            this.deck[i] = this.deck[j];
            this.deck[j] = temp;
        }

    },
    drawCard : function (){

        //if there are no cards left to draw for a player, they lose
        if (this.deck.length === 0) {
            this.health = 0;
        } 
        else {
            //remove first element from deck and add card to hand
            var card = this.deck[0];
            this.deck.shift();
            this.hand.push(card);
            
        }
    },
    playCard: function (card, target){

    }
}

function Game(player1, player2) {
    this.activePlayer = Math.random() >= 0.5 ? player1 : player2;
    this.opponentPlayer = this.activePlayer === player1 ? player2 : player1;
    this.winner = undefined;
    this.firstTurn = 0;
    var activeChars = []
    var opponentChars = []

    for(var i = 0; i < 5; i++){
        if(this.activePlayer.deck[i].type == "Character" && this.activePlayer.deck[i].grade == 0){
            activeChars.push(this.activePlayer.deck[i]);
        }
        if(this.opponentPlayer.deck[i].type == "Character" && this.opponentPlayer.deck[i].grade == 0){
            opponentChars.push(this.opponentPlayer.deck[i]);
        }

    }
    var j = Math.floor(Math.random() * activeChars.length);
    var k = Math.floor(Math.random() * opponentChars.length);
    this.activePlayer.hand.push(activeChars[j]);
    this.opponentPlayer.hand.push(opponentChars[k]);

    this.activePlayer.deck = this.activePlayer.deck.filter(function(el) { return el.id != activeChars[j].id; }); 
    this.opponentPlayer.deck = this.opponentPlayer.deck.filter(function(el) { return el.id != opponentChars[k].id; }); 

    this.activePlayer.shuffleDeck();
    this.opponentPlayer.shuffleDeck();
    for (var i = 0; i < 2; i++) {
        this.activePlayer.drawCard();
        this.opponentPlayer.drawCard();
    }
    console.log(this.activePlayer.name + "'s hand")
    console.log(this.activePlayer.hand)
    console.log(this.opponentPlayer.name + "'s hand")
    console.log(this.opponentPlayer.hand)

    //CHANGE THIS TO FIRST PLAYER NOT ALLOWED TO ATTACK
    //this.opponentPlayer.drawCard(); // extra card to compensate for not playing first turn
}



Game.prototype = {
    start: function () {
        while (this.winner === undefined) {

            if(Object.keys(this.activePlayer.active).length === 0 || Object.keys(this.opponentPlayer.active).length === 0){
                console.log('begin turn: ')
                this.beginTurn();
            }
            
            this.playTurn();
            this.endTurn();
        }
    },

    beginTurn: function () {


            this.setActive(this.activePlayer);
            this.setBackup(this.activePlayer);
            console.log(this.activePlayer.name + " active: ");
            console.log(this.activePlayer.active)
            
            
            window.alert(this.opponentPlayer.name + ", your turn to set active players")

            this.setActive(this.opponentPlayer);
            this.setBackup(this.opponentPlayer);
            console.log(this.opponentPlayer.name + " active: ")
            console.log(this.opponentPlayer.active)
        
        
    },

    //STEPS 
    setActive : function (playy){

        var choices = [] 

        //ENTIRE CARD
        /*for(var i = 0; i < playy.hand.length; i++){
            var currCard = playy.hand[i]
            console.log(currCard)
            if(currCard.type == "Character" && currCard.grade == 0){
                choices.push(currCard)
            }

        }*/

        
        for(var i = 0; i < playy.hand.length; i++){
            var currCard = playy.hand[i]
            //console.log(currCard)
            if(currCard.type == "Character" && currCard.grade == 0){
                choices.push(currCard.id)
            }

        }

        //to show choices
        //document.getElementById('kessho-cards').innerHTML = choices

        /*str = ""
        for (var item of choices) {
            str += "<option value='" + item.id + "'>" + item.name + "</option>"
        }*/
        var choice = window.prompt(playy.name + ", choose your active player " + choices)
        //document.getElementById("activeplay").innerHTML = str;
        for(var i = 0; i < playy.hand.length; i++){
            var currCard = playy.hand[i]
            //console.log(currCard)
            if(currCard.id == choice){
                playy.active = currCard
                playy.hand.splice(i, 1)
                break;
            }

        }
        
          

    },
    setBackup : function (playy){
        var choices = [] 

        //ENTIRE CARD
        /*for(var i = 0; i < playy.hand.length; i++){
            var currCard = playy.hand[i]
            console.log(currCard)
            if(currCard.type == "Character" && currCard.grade == 0){
                choices.push(currCard)
            }

        }*/

        
        for(var i = 0; i < playy.hand.length; i++){
            var currCard = playy.hand[i]
            //console.log(currCard)
            if(currCard.type == "Character" && currCard.grade === 0 && currCard.id != playy.active.id){
                choices.push(currCard.id)
            }

        }

        //to show choices
        //document.getElementById('kessho-cards').innerHTML = choices

        /*str = ""
        for (var item of choices) {
            str += "<option value='" + item.id + "'>" + item.name + "</option>"
        }*/
        var choice = window.prompt(playy.name + ", choose your backup player(comma separated) " + choices)
        var toRemove = []
        if(choice){
            var ccs = choice.split(",").map(Number)
            //document.getElementById("activeplay").innerHTML = str;
            for(var j = 0; j < ccs.length; j++){
                for(var i = 0; i < playy.hand.length; i++){
                    var currCard = playy.hand[i]
                    //console.log(currCard)
                    if(currCard.id == ccs[j]){
                        playy.backup.push(currCard) 
                        toRemove.push(i)
                        break
                    
                    }
        
                }
            }

            var newHand = []

            for(k = 0; k < playy.hand.length; k++){
                if(!toRemove.includes(k)){
                    newHand.push(playy.hand[k])
                }
            }

            playy.hand = [...newHand]
            
        }
        
        
    },

    useKessho: function (){

        //check in hand if kessho available. if yes, show kessho cards. ask player to choose which kessho card to apply and to which player
        //character choices will be either active or backup.
        this.activePlayer.drawCard();

        var choices = [] 
        for(var i = 0; i < this.activePlayer.hand.length; i++){
            var currCard = this.activePlayer.hand[i]
            if(currCard.type == "Kessho"){
                choices.push(currCard.id)
            }

        }

        var choice = window.prompt(this.activePlayer.name + ", choose your kessho card. Or type 0 to skip: " + choices)
        
        //to show choices
        /*document.getElementById('kessho-cards').innerHTML = choices

        str = ""
        for (var item of choices) {
            str += "<option value='" + item.id + "'>" + item.color + "</option>"
        }
        document.getElementById("pickone").innerHTML = str;

        var currKessho = ""
        function getVal(){
            
            currKessho = document.getElementById("pickone").value;
           
        }
        
        //check how to get the kessho card
        document.getElementById("btn").addEventListener("click", getVal)*/



        //currKessho has current kessho. now remove it from hand
        var newHand = []
        for(var i = 0; i < this.activePlayer.hand.length; i++){
            if(this.activePlayer.hand[i].id === parseInt(choice)){
                continue
            }
            else{
                newHand.push(this.activePlayer.hand[i])
            }
        }
        this.activePlayer.hand = []
        this.activePlayer.hand = [...newHand]



        //choose which character to apply it on
        if(choice != 0){
            var charChoices = []
            for(var i = 0; i < this.activePlayer.backup.length; i++){
                charChoices.push(this.activePlayer.backup[i].id);
            } 
            charChoices.push(this.activePlayer.active.id);
            str = ""
           /* for (var item of charchoices) {
                str += "<option value='" + item.id + "'>" + item.name + "</option>"
            }
            document.getElementById("pickchar").innerHTML = str;
            
            //to show choices
            document.getElementById('kessho-cards').innerHTML = choices

            var currCharacter = ""
            function getChar(){
                
                currCharacter = document.getElementById("pickchar").value;
            
            }
            
            //check how to get the charcater card
            document.getElementById("btn1").addEventListener("click", getChar)*/
            var currCharacter = window.prompt(this.activePlayer.name + ", choose the character you want to apply it to." + charChoices)
            console.log(currCharacter + " curr character for kessho");

            //APPLY KESSHO TO CHARACTER CARD

            if(this.activePlayer.active.id === parseInt(currCharacter)){
                console.log(this.activePlayer.name + " applying to active")
                if(this.activePlayer.active.kesshos){

                    if(this.activePlayer.active.kesshos < this.activePlayer.active.attacks[this.activePlayer.active.attacks.length - 1].req){
                        this.activePlayer.active.kesshos += 1;
                    }
                    else{
                        window.alert('max kesshos already applied');
                    }


                }
                else{
                    this.activePlayer.active.kesshos = 1;
                }
                console.log("after kessho: ")
                console.log(this.activePlayer.active.kesshos)
            }
            else{

                for(var i = 0; i < this.activePlayer.backup.length; i++){
                    if(this.activePlayer.backup[i].id === parseInt(currCharacter)){
                        if(this.activePlayer.backup[i].hasOwnProperty('kesshos')){

                            if(this.activePlayer.backup[i].kesshos < this.activePlayer.backup[i].attacks[this.activePlayer.backup[i].attacks.length - 1].req){
                                this.activePlayer.backup[i].kesshos += 1;
                            }
                            else{
                                alert('max kesshos already applied');
                            }
            
                        }
                        else{
                            this.activePlayer.backup[i].kesshos = 1;
                        }
                        console.log("after kessho: ")
                        console.log(this.activePlayer.backup[i].kesshos)
                    }
                    
                }
            }
        }
        


    },
    useItem : function (){

        //show all items
        var availableItems = []
        var citem = {}
        for(var i = 0; i < this.activePlayer.hand.length; i++){
            if(this.activePlayer.hand[i].type === "Item"){
                availableItems.push(this.activePlayer.hand[i].id)
            }
        }
        var currItem = window.prompt(this.activePlayer.name + ", choose the item you want to use. Press 0 to skip.: " + availableItems)

        if(currItem != 0){

            for(var i = 0; i < this.activePlayer.hand.length; i++){
                if(this.activePlayer.hand[i].id === parseInt(currItem)){
                    citem = this.activePlayer.hand[i]
                    this.activePlayer.hand.splice(i,1)
                    break
                }
            }
    
            if(citem.function === "Draw"){
    
                for(var i = 0; i < citem.value; i++){
                    if(this.activePlayer.hand.length == 0){
                        break;
                    }
                    this.activePlayer.drawCard();
                }
                
            }
            else if(citem.function === "Increase"){
    
                var charChoices = []
                for(var i = 0; i < this.activePlayer.backup.length; i++){
                    charChoices.push(this.activePlayer.backup[i].id);
                } 
                charChoices.push(this.activePlayer.active.id);
                var currCharacter = window.prompt(this.activePlayer.name + ", choose the character you want to apply it to." + charChoices)
                console.log(currCharacter + " curr character for item");

                var cchar = {}
                if(this.activePlayer.active.id === parseInt(currCharacter)){

                    for(var i = 0; i < this.activePlayer.active.attacks.length; i++){
                        this.activePlayer.active.attacks[i].attack += citem.value
                    }
                }
                else{
                    for(var i = 0; i < this.activePlayer.backup.length; i++){

                        if(this.activePlayer.backup[i].id === parseInt(currCharacter)){
                            for(var i = 0; i < this.activePlayer.backup[i].attacks.length; i++){
                                this.activePlayer.backup[i].attacks[i].attack += citem.value
                            }
                            break;
                        }
                    }
                }
                
    
            }
            else if(citem.function === "Defense"){

                var charChoices = []
                for(var i = 0; i < this.activePlayer.backup.length; i++){
                    charChoices.push(this.activePlayer.backup[i].id);
                } 
                charChoices.push(this.activePlayer.active.id);
                var currCharacter = window.prompt(this.activePlayer.name + ", choose the character you want to apply it to." + charChoices)
                console.log(currCharacter + " curr character for item");

                var cchar = {}
                if(this.activePlayer.active.id === parseInt(currCharacter)){

                    this.activePlayer.active.defense += citem.value
                }
                else{
                    for(var i = 0; i < this.activePlayer.backup.length; i++){

                        if(this.activePlayer.backup[i].id === parseInt(currCharacter)){
                            this.activePlayer.backup[i].defense += citem.value
                            break;
                        }
                    }
                }

    
            }
            else if(citem.function === "Heal"){

                var charChoices = []
                for(var i = 0; i < this.activePlayer.backup.length; i++){
                    charChoices.push(this.activePlayer.backup[i].id);
                } 
                charChoices.push(this.activePlayer.active.id);
                var currCharacter = window.prompt(this.activePlayer.name + ", choose the character you want to apply it to." + charChoices)
                console.log(currCharacter + " curr character for item");

                var cchar = {}
                if(this.activePlayer.active.id === parseInt(currCharacter)){

                    if(this.activePlayer.active.damageTaken >= citem.value){
                        this.activePlayer.active.damageTaken -= citem.value
                        this.activePlayer.active.hp += citem.value
                    }
                    else{
                        
                        this.activePlayer.active.hp += damageTaken
                        this.activePlayer.active.damageTaken = 0
                    }

                }
                else{
                    for(var i = 0; i < this.activePlayer.backup.length; i++){

                        if(this.activePlayer.backup[i].id === parseInt(currCharacter)){
                            if(this.activePlayer.backup[i].damageTaken >= citem.value){
                                this.activePlayer.backup[i].damageTaken -= citem.value
                                this.activePlayer.backup[i].hp += citem.value
                            }
                            else{
                                
                                this.activePlayer.backup[i].hp += damageTaken
                                this.activePlayer.backup[i].damageTaken = 0
                            }
                            break;
                        }
                    }
                }
    
            }
            else if(citem.function === "Kessho"){

                var newDeck = []
                var k = {}
                //draw the first kessho card
                for(var i = 0; i < this.activePlayer.deck.length; i++){
                    if(this.activePlayer.deck[i].type === "Kessho"){
                        this.activePlayer.hand.push(this.activePlayer.deck[i])
                        k = this.activePlayer.deck[i]
                        break;
                    }
                    
                }
                //remove that card from deck
                for(var i = 0; i < this.activePlayer.deck.length; i++){
                    if(this.activePlayer.deck[i].id === k.id){
                        continue
                    }
                    else{
                        newDeck.push(this.activePlayer.deck[i])
                    }
                }
                this.activePlayer.deck = []
                this.activePlayer.deck = [...newDeck]

            }
        }
        



    },
    upgradeCharacter : function(){

        //current names in active + backup
        var currNames = []
        if(this.activePlayer.active.grade === 0){
            currNames.push(this.activePlayer.active.name)
        }
        for(var i = 0; i < this.activePlayer.backup.length; i++){

            if(this.activePlayer.backup[i].grade === 0){
                currNames.push(this.activePlayer.backup[i].name)
            }
 
        }

        console.log(currNames)

        //check hand
        //if grade 1 and predecessor in currNames
        var eligibleCards = []
        for(var i = 0; i < this.activePlayer.hand.length; i++){
            var cch = this.activePlayer.hand[i]
            console.log(cch.name)
            if(cch.grade === 1 && currNames.includes(cch.pred)){
                eligibleCards.push(cch.id)
            }
        }

        //choose card
        var upgradeChoice = window.prompt(this.activePlayer.name + ", choose the  grade 1 character you want to use upgrade with." + eligibleCards)
        var uchar = {}

        for(var i = 0; i < this.activePlayer.hand.length; i++){
            var cch = this.activePlayer.hand[i]
            if(cch.id === parseInt(upgradeChoice)){
                uchar = cch
                console.log("uchar: ")
                console.log(uchar)
                break
            }
        }


        if(upgradeChoice){
            //check which active/backup card is eligible for upgrade        
            var choices = []
            if(this.activePlayer.active.name === uchar.pred){

                choices.push(this.activePlayer.active.id)
                
            }
            

            for(var i = 0; i < this.activePlayer.backup.length; i++){

                if(this.activePlayer.backup[i].name === uchar.pred){
                    choices.push(this.activePlayer.backup[i].id)
                }

            }

            //choose which character to apply it to
            var upgradableChar = window.prompt(this.activePlayer.name + ", choose the character you want to apply upgrade to." + choices)

            
            //change the stats of the grade 0 character and upgrade with new grade 1 card. the damage taken remains regardless
            if(this.activePlayer.active.id === parseInt(upgradableChar)){

                this.activePlayer.active.name = uchar.name
                this.activePlayer.active.grade = uchar.grade
                this.activePlayer.active.hp = uchar.hp
                this.activePlayer.active.hp -= this.activePlayer.active.damageTaken
                this.activePlayer.active.damage = uchar.damage
                this.activePlayer.active.upgrade = "Yes"
                this.activePlayer.active.attacks = [...uchar.attacks]
                this.activePlayer.active.pred = uchar.pred

                console.log("after upgrade: ")
                console.log(this.activePlayer.active)

                
            }
            else{
                
                for(var i = 0; i < this.activePlayer.backup.length; i++){

                    if(this.activePlayer.backup[i].id === parseInt(upgradableChar)){
                        this.activePlayer.backup[i].name = uchar.name
                        this.activePlayer.backup[i].grade = uchar.grade
                        this.activePlayer.backup[i].hp = uchar.hp
                        this.activePlayer.backup[i].hp -= this.activePlayer.backup[i].damageTaken
                        this.activePlayer.backup[i].damage = uchar.damage
                        this.activePlayer.backup[i].upgrade = "Yes"
                        this.activePlayer.backup[i].attacks = [...uchar.attacks]
                        this.activePlayer.backup[i].pred = uchar.pred
                        console.log("after upgrade: ")
                        console.log(this.activePlayer.backup[i])
                        break;
                    }
        
                }
            }

            //remove this grade 1 character from hand
            var newHand = []
            for(var i = 0; i < this.activePlayer.hand.length; i++){
                if(this.activePlayer.hand[i].id === parseInt(upgradeChoice)){
                    continue
                }
                else{
                    newHand.push(this.activePlayer.hand[i])
                }
            }
            this.activePlayer.hand = []
            this.activePlayer.hand = [...newHand]
        }
       

        


    },
    attackOpponent : function (){


        if(this.firstTurn !== 0){
            var attackChoices = []
            
            var ch = window.prompt("Press 1 to attack or press 0 to let go of the turn");
            console.log(this.activePlayer.active.kesshos + " kesshos available currently ")
            if(ch == 1 && this.activePlayer.active.kesshos){

                var validAttacks = []
                for(var i = 0; i < this.activePlayer.active.attacks.length; i++){
                    var at = this.activePlayer.active.attacks[i]

                    if(this.activePlayer.active.kesshos && at.req <= this.activePlayer.active.kesshos){
                        //document.getElementById('curr-attackname').innerHTML = at.name
                        //document.getElementById('curr-attackpoints').innerHTML = at.attack
                        validAttacks.push(at.attack)
                    }
                    
                }
                console.log("atcckss " + validAttacks);
            
                var cch = window.prompt(this.activePlayer.name + ", choose an attack: " + validAttacks)
                
                this.opponentPlayer.active.hp -= parseInt(cch)
                this.opponentPlayer.active.hp += this.opponentPlayer.active.defense

                this.opponentPlayer.active.damageTaken += parseInt(cch)
                
                
                if(this.opponentPlayer.active.hp <= 0){
                    console.log(this.opponentPlayer.health + " opponent health before")
                    this.opponentPlayer.health -= this.activePlayer.active.damage
                    
                    if(this.opponentPlayer.backup.length == 0){
                        this.opponentPlayer.health = 0

                    }
                    else{
                        var potentialActive = []
                        for(var i = 0; i < this.opponentPlayer.backup.length; i++){
                            potentialActive.push(this.opponentPlayer.backup[i].id)
                        }
                        var cch = window.prompt(this.opponentPlayer.name + ", choose an active player: " + potentialActive)
                        
                        for(var i = 0; i < this.opponentPlayer.backup.length; i++){
                            if(this.opponentPlayer.backup[i].id === parseInt(cch)){
                                this.opponentPlayer.active = JSON.parse(JSON.stringify(this.opponentPlayer.backup[i]))
                                this.opponentPlayer.backup.splice(i, 1)
                                console.log(this.opponentPlayer.active + " new active")
                                break;
                            }
                            
                        }
                    }
                }
                console.log("attack: "+  this.opponentPlayer.active.hp)
                console.log("opponent health: " + this.opponentPlayer.health)
                console.log("opponent damage taken: " + this.opponentPlayer.active.damageTaken)
            }

        }
        else{
            this.firstTurn = 1;
        }

        
        

    },

    playTurn: function () {
        
        this.useKessho();
        this.useItem();
        this.setBackup(this.activePlayer);
        this.upgradeCharacter();
        this.attackOpponent();
        

    },

    endTurn: function () {
        if (this.opponentPlayer.health <= 0) {
            this.winner = this.activePlayer;
            window.confirm(this.winner.name + " wins!");
        } else {
            switchPlayers.call(this);
            window.alert(this.activePlayer.name + ", it's your turn.")
        }

        function switchPlayers() { // ECMA6: [activePlayer, opponentPlayer] = [opponentPlayer, activePlayer]
            var tmp = this.activePlayer;
            this.activePlayer = this.opponentPlayer;
            this.opponentPlayer = tmp;
        }
    }
}
;





//EXTRA CARDS

/*

,
            {
                id: 13,
                type : "Item",
                name : "Shine sword",
                function : "Increase",
                param : "hp",
                value : "30",
            },
            {
                id: 14,
                type : "Item",
                name : "Mint Extra",
                function : "Draw",
                value : "4"
            }



            ,
            {
                id: 6,
                type : "Item",
                name : "Dragon Dagger",
                function : "Increase",
                param : "hp",
                value : "20",
            },
            {
                id: 7,
                type : "Item",
                name : "Mint",
                function : "Draw",
                value : "2"
            }




            {

            }


*/
