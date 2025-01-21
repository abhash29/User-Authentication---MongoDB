const express = require('express')
const jwt = require('jsonwebtoken')
const app = express()
const mongoose = require('mongoose');
var cors = require('cors')
const port = 3000


app.use(express.json());
app.use(cors())

app.get('/', (req, res) => {
  res.send('Hello World!')
})


const SECRET = "ABHASHKUMARDAS";

//Define Schemas
const adminsSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    token: {
        type: String
    }
});

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    purchasedCourses: [
        {type: mongoose.Schema.Types.ObjectId, ref: 'Course'}
    ]
});

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    }
});
const Admin = mongoose.model('Admin', adminsSchema);
const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);

mongoose.connect('mongodb+srv://abhashkumardas29:Abhash29@authentication.1vp14.mongodb.net/Courses', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

//Middleware
const authenticateJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(authHeader){
        const token = authHeader.split(' ')[1];
        jwt.verify(token, SECRET, (err, user) => {
            if(err){
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    }
    else{
        res.sendStatus(401);
    }
};

//Working from frontend

//Admin
//1. SignUp -> working
app.post("/admin/signup", async (req, res) => {
    const { username, password } = req.body;
    console.log(req.body);

    const admin = await Admin.findOne({ username });

    if (admin) {
        return res.status(404).json({ message: "Admin already exists" });
    } else {
        const obj = { username, password };
        const newAdmin = new Admin(obj);
        newAdmin.save();
        const token = jwt.sign({ username, role: 'admin' }, SECRET, { expiresIn: "1h" });
        res.status(200).json({ message: "Admin created successfully", token });
    }
});

//Admin get req  
app.get('/admins', async (req, res) => {
    const admin = await Admin.find({});
    res.json({admin});
});

//3. Login -> JWT  -> working from postman
app.post("/admin/login", async (req, res) => {
    const {username, password} = req.headers;
    const admin = await Admin.findOne({username, password});
    if(admin){
        const token = jwt.sign({username, role: 'admin'}, SECRET, {expiresIn: '1h'});
        res.json({message: "Login successful", token});
    }
    else{
        res.status(401).json({message: 'Invalid username or password'});
    }
});

//4. Post - courses   -> working from postman
app.post('/admin/course', authenticateJwt, async (req, res) => {
    const newCourse = new Course(req.body);
    await newCourse.save();
    res.status(200).json({message: "Course added successfully"});
});

//5. Get Course
app.get('/admin/courses', async (req, res) => {
    const courses = await Course.find({});
    res.json({courses});
});

//5. Put -> working from postman
app.put('/admin', async (req, res) => {
    const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, {new:true});
    if(course){
        res.status(200).json({message: "Course updated successfully"});
    }
    else{
        res.status(404).json({message: "Course not found"});
    }
});
//6. Delete 
app.delete('/admin/course/:id', async (req, res) => {
    const course = await Course.findByIdAndDelete(req.params.id);
    if(course){
        res.status(200).json({message: "Course deleted successfully"});
    }
    else{
        res.status(404).json({message: "Course not found"});
    }
});


//USER
//1. SignUp -> working from postman
app.post("/user/signup", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({username});

    if (!username || !password) {
        return res.status(400).json({ message: "Please enter username and password" });
    }
    if (user) {
        res.status(404).json({ message: "User already exists" });
    } else {
        const newUser = new User({ username, password });
        await newUser.save();
        const token = jwt.sign({ username, role: 'user' }, SECRET, { expiresIn: "1h" });
        res.status(200).json({ message: "User created successfully", token });
    }
});

//2. user get req
app.get('/users', async (req, res) => {
    const user = await User.find({});
    res.json({user});
});
//3. Login -> JWT -> working from postman
app.post('/user/login', async (req, res) => {
    const {username, password} = req.headers;
    const user = await User.findOne({username, password});
    if(user){
        const token = jwt.sign({username, role: 'user'}, SECRET, {expiresIn: '1h'});
        res.json({message: "Logged in successful", token});
    }
    else{
        res.status(403).json({message: "Invalid username or password"});
    }
});

//4. Courses -> working from postman
app.get('/user/courses', authenticateJwt, async (req, res) => {
    const courses = await Course.find({});
    res.json({courses});
});

//5. My purchased courses -. thoda doubt h working pe
app.post('/user/courses/:id', authenticateJwt, async (req, res) => {
    const course = await Course.findById(req.params.courseId);
    if(course){
        const user = await User.findOne({username: req.user.username});
        if(user){
            user.purchasedCourses.push(course);
            await user.save();
            res.json({message: "Course purchased successfully"});
        }
        else{
            res.status(403).json({message: "User not found"});
        }
    }
    else{
        res.status(404).json({message: "Course not found"});
    }
});

//6 Get the purchased courses -> working
app.get('/user/purchasedCourses', authenticateJwt, async (req, res) => {
    const user = await User.findOne({username: req.user.username}).populate('purchasedCourses');
    if(user){
        res.json({purchasedCourses: user.purchasedCourses || []});
    }
    else{
        res.status(403).json({message: "user not found"});
    }
})

//Me route
app.get('/admin/me' , authenticateJwt, (req, res) => {
    res.json({
        username: req.user.username
    })
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

