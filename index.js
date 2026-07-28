const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

//Import body parser for post requests
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())


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
	users.push(user);
	logs.push([]);
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
	if (req.body.date == ""){
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
	let exercises = {description: req.body.description,
					 duration: parseInt(req.body.duration),
					 date: date};
	
	//Add exercises to user log
	logs[index].push(exercises);
	
	//Combine and report exercise object
	let userExercise = {...users[index]};
	Object.assign(userExercise, exercises);
	userExercise.date = date.toDateString();
	res.json(userExercise);
});

app.get("/api/users/:_id/logs", (req, res)=>{
	//Create index from user id
	let index = parseInt(req.params._id) - 1;
	
	//Create user log for display
	let log = logs[index].map(exercise => ({...exercise}));
	let userObject = {...users[index]};
	
	//Create variables for the optional parameters
	let from = req.query.from;
	let to = req.query.to;
	let limit = parseInt(req.query.limit);
	const hasLimit = !isNaN(limit);
	
	
	if (from) {
    log = log.filter(e => formatDate(e.date) >= from);
}

if (to) {
    log = log.filter(e => formatDate(e.date) <= to);
}

if (!isNaN(limit)) {
    log = log.slice(0, limit);
}

for (const exercise of log) {
    exercise.date = exercise.date.toDateString();
}

res.json({
    ...users[index],
    count: log.length,
    log
});
	
});


function formatDate(date){
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
