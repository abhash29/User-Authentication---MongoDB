const express = require('express')
const jwt = require('jsonwebtoken')
require("dotenv").config();
const app = express()
const mongoose = require('mongoose');
const port = 3000


app.use(express.json());

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

//ADMIN
//Middleware for admin
const authenticateAdmin = async (req, res, next) => {
    const {username, password} = req.headers;
    const admin = await Admin.find({username, password});
    if(admin){
        next();
    }
    else{
        res.status(403).json({message: "Authentication fails"});
    }
};
//1. SignUp
app.post("/admin/signup", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Please enter username and password" });
    }

    const admin = await Admin.findOne({ username });

    if (admin) {
        return res.status(404).json({ message: "Admin already exists" });
    } else {
        const obj = { username, password };
        const newAdmin = new Admin(obj);
        await newAdmin.save();
        const token = jwt.sign({ username }, SECRET, { expiresIn: "1h" });

        return res.status(200).json({ message: "Admin created successfully", token });
    }
});

//Admin get req
app.get('/admins', async (req, res) => {
    const admin = await Admin.find({});
    res.json({admin});
});

//3. Login -> JWT
app.post('/admin/login', authenticateAdmin, async (req, res) => {
    const {username} = req.headers;
    try {
        const token = jwt.sign({ username, role: 'admin' }, SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: "Admin login successful", token });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

//4. Post - courses
app.post('/admin/course', async (req, res) => {
    const newCourse = new Course(req.body);
    await newCourse.save();
    res.status(200).json({message: "Course added successfully"});
});

//5. Get Course
app.get('/admin/courses', async (req, res) => {
    const courses = await Course.find({});
    res.json({courses});
});

//5. Put 
app.put('/admin/courses/:courseId', async (req, res) => {
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
//Middleware for user
const authenticateUser = async (req, res, next) => {
    const {username, password} = req.headers;
    const user = User.find({username, password});
    if(user){
        next();
    }
    else{
        res.status(403).json({message: "Authentication fails"});
    }
};
//1. SignUp
app.post("/user/signup", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Please enter username and password" });
    }
    const user = await User.findOne({ username });

    if (user) {
        return res.status(404).json({ message: "User already exists" });
    } else {
        const obj = { username, password };
        const newUser = new User(obj);
        await newUser.save();

        const token = jwt.sign({ username }, SECRET, { expiresIn: "1h" });
        return res.status(200).json({ message: "User created successfully", token });
    }
});

//2. user get req
app.get('/users', async (req, res) => {
    const user = await User.find({});
    res.json({user});
});
//3. Login -> JWT
app.post('/user/login', authenticateUser, async (req, res) => {
    const {username, password} = req.headers;
    try {
        const user = await User.findOne({ username, password }); // Use await to resolve the promise

        if (user) {
            const token = jwt.sign({ username }, SECRET, { expiresIn: "1h" });
            res.status(200).json({ message: "User login successful", token });
        } else {
            res.status(404).json({ message: "Authentication failed" });
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

//4. Courses
app.get('/user/courses', async (req, res) => {
    const course = await Course.find({});
    res.json({course});
});

//5. My purchased courses -. thoda doubt h working pe
app.post('/user/courses/:id', async (req, res) => {
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

//6 Get the purchased courses -> not working
app.get('/user/purchasedCourses', async (req, res) => {
    const user = await User.find({username: req.user.username}).populate('purchasedCourses');
    if(user){
        res.json({purchasedCourses: user.purchasedCourses || []});
    }
    else{
        res.status(403).json({message: "user not found"});
    }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

//Debug and update the each code according to mongodb
//Merge it with mongodb
//Connect with frontend