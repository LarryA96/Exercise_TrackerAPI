const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


//User database will contain objects formatted {username, _id, count}
const users = [];

//Logs database will contain arrays formatted [{description, duration, date}}, using "id - 1" as indexes
const logs = [];

//Use post request to create new user and log record
app.post("/api/users", (req, res)=>{
    
	let user = {username : req.body.username, _id : String(users.length+1)};
	/*let existingUser = users.find(user => user.username === req.body.username);

    if (existingUser) {
        return res.json({ error: "username already exists" });
    }*/
	users.push(user);
	logs.push([]);
	console.log(users);
	res.json(user);
});

//Use get request to pull array of all users
app.get("/api/users", (req, res)=>{
	res.json(users);
});

//Add exercise data to users log
//Use post request to return user object with exercise field added
app.post('/api/users/:_id/exercises', (req, res)=>{
	
	//Process date and return error if invalid
	let date;
	if (!req.body.date){
		date = new Date();
	} else if (!/^\d{4}-\d{2}-\d{2}$/.test(req.body.date)){
		return res.json({error: "invalid date"});
	} else {
		date = new Date(req.body.date);
	}
	
	if (isNaN(date.getTime())){
		return res.json({error: "invalid date"});
	}
	
	//Grab index from id and create exercise object
	let index = parseInt(req.params._id) - 1;
	
	if (!users[index]) {
    return res.json({error: "user not found"});
}
	
	let exercises = {description: req.body.description,
					 duration: parseInt(req.body.duration),
					 date: date};
	
	//Add exercises to user log
	logs[index].push(exercises);
	
	//Combine and report exercise object
	let userExercise = {...users[index]};
	Object.assign(userExercise, exercises);
	userExercise.date = date.toDateString();
	console.log(`exercise date is ${userExercise.date}`)
	res.json(userExercise);
	
	console.log(userExercise);
});

//Get request to pull specific user logs
app.get("/api/users/:_id/logs", (req, res)=>{
	//Create index from user id
	let index = parseInt(req.params._id) - 1;
	if (!users[index]) {
    return res.json({error: "user not found"});
}
	
	//Create user log for display
	let log = logs[index].map(exercise => ({...exercise}));
	let count = log.length;
	
	//Create variables for the optional parameters
	let from = req.query.from;
	let to = req.query.to;
	let limit = parseInt(req.query.limit);
	
	console.log(from);
	
	
	if (from != undefined) {
    log = log.filter(e => formatDate(e.date) >= from);
}

if (to != undefined) {
    log = log.filter(e => formatDate(e.date) <= to);
}

if (!isNaN(limit)) {
    log = log.slice(0, limit);
}

log = log.map(exercise => ({
    ...exercise,
    date: exercise.date.toDateString()
}));

res.json({
    username: users[index].username,
    count: count,
    _id: users[index]._id,
    log
});
	
});


function formatDate(date){
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
