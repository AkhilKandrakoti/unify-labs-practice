class Pet{
constructor(name,type){
this.name=name;
this.type=type;
this._health=80;
this.hunger=30;
this.energy=70;
this.xp=0;
this.level=1;
}

get health(){ return this._health; }

set health(value){
this._health=Math.max(0,Math.min(100,value));
}

feed(){
this.hunger-=15;
this.energy+=5;
this.health+=10;
this.gainXP(10);
this.normalize();
}

play(){
this.energy-=20;
this.hunger+=10;
this.health+=5;
this.gainXP(15);
this.normalize();
}

rest(){
this.energy+=25;
this.health+=5;
this.gainXP(5);
this.normalize();
}

gainXP(amount){
this.xp+=amount;
if(this.xp>=100){
this.level++;
this.xp=0;
}
}

normalize(){
this.hunger=Math.max(0,Math.min(100,this.hunger));
this.energy=Math.max(0,Math.min(100,this.energy));

if(this.hunger>80) this.health-=5;
if(this.energy<20) this.health-=5;
}

getStatus(){
return `
Name: ${this.name}
Type: ${this.type}
Level: ${this.level}
XP: ${this.xp}
Health: ${this.health}
Hunger: ${this.hunger}
Energy: ${this.energy}
`;
}

get mood(){
if(this.health<=0) return "💀 Dead";
if(this.health>80) return "😊 Happy";
if(this.hunger>70) return "🤒 Hungry";
if(this.energy<30) return "😴 Tired";
return "🙂 Normal";
}
}

let myPet=null;

function createPet(){
const name=document.getElementById("nameInput").value;
const type=document.getElementById("typeInput").value;
myPet=new Pet(name,type);
updateUI();
saveGame();
}

function feedPet(){ if(myPet){ myPet.feed(); animate("happy"); updateUI(); } }
function playPet(){ if(myPet){ myPet.play(); animate("happy"); updateUI(); } }
function restPet(){ if(myPet){ myPet.rest(); animate("idle"); updateUI(); } }

function updateUI(){
if(!myPet) return;

document.getElementById("petCharacter").textContent=myPet.type;
document.getElementById("petMood").textContent="Mood: "+myPet.mood;
document.getElementById("levelDisplay").textContent=
`Level: ${myPet.level} | XP: ${myPet.xp}`;

document.getElementById("healthBar").style.width=myPet.health+"%";
document.getElementById("hungerBar").style.width=myPet.hunger+"%";
document.getElementById("energyBar").style.width=myPet.energy+"%";

document.getElementById("statusOutput").textContent=myPet.getStatus();

if(myPet.health<=0){
document.getElementById("petCharacter").className="pet dead";
document.getElementById("gameOverScreen").classList.add("active");
localStorage.removeItem("petSave");
}

saveGame();
}

function animate(state){
const pet=document.getElementById("petCharacter");
pet.className="pet "+state;
}

function saveGame(){
localStorage.setItem("petSave",JSON.stringify(myPet));
}

function loadGame(){
const data=localStorage.getItem("petSave");
if(data){
const obj=JSON.parse(data);
myPet=Object.assign(new Pet(),obj);
updateUI();
}
}

function restartGame(){
localStorage.removeItem("petSave");
location.reload();
}

setInterval(()=>{
if(!myPet) return;
myPet.hunger+=3;
myPet.energy-=2;
myPet.normalize();
updateUI();
},4000);

loadGame();