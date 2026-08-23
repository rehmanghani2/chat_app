import cloudinary from "../lib/cloudinary.js";
import { generateStreamToken, upsertStreamUser } from "../lib/stream.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bycrypt from 'bcryptjs';

// Signup a new user
export const signup = async (request, response)=> {
    const {fullName, email, password, bio} = request.body;
    try {
        if(!fullName || !email || !password || !bio) {
            return response.json({success: false, message: 'Missing User Details...'});
        }
        const user = await User.findOne({email});
        if(user) {
            return response.json({succes: false, message: "Account already exists"})
        }
        const salt = await bycrypt.genSalt(10);
        const hashedPassword = await bycrypt.hash(password, salt);

        const newUser = await User.create({
            fullName, email, password: hashedPassword, bio
        });

        // Stream upsetter
        await upsertStreamUser({
            id: newUser._id.toString(),
            name: newUser.fullName,
            image: newUser.profilePic || "",
        });
        console.log(`Stream user created for ${newUser.fullName}`);
       
       

        const token = generateToken(newUser._id)

        // const streamToken = generateStreamToken(newUser._id);

        response.json({success: true, userData: newUser, token,// streamToken, 
             message: "Account created successfully"});
    } catch (error) {
        console.log(error.message);
        response.json({success: false, message: error.message});
    }
}

// Controller to login a user
export const login = async (req, res) => {
    try {
        const { email, password} = req.body;
        const userData = await User.findOne({email})

        const isPasswordCorrect = await bycrypt.compare(password, userData.password);

        if(!isPasswordCorrect) {
            return res.json({success: false, message: "Invalid Credentials"});
        }

        const token = generateToken(userData._id);
        
        
        
      //  const streamToken = generateStreamToken(userData._id);

        res.json({success: true, userData, token, message: "login successful"});

    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message});
    }
}
// Controller to check if user is authenticated
export const checkAuth = (req, res) => {
    res.json({success: true, user: req.user});
}

// Controller to update user profile details
export const updateProfile = async (req, res) => {
    try {
        const { profilePic, bio, fullName } = req.body;
        const userId = req.user._id;
        let updatedUser;

        if(!profilePic) {
           updatedUser = await User.findByIdAndUpdate(userId, {bio, fullName}, {new: true});
        } else {
            const upload = await cloudinary.uploader.upload(profilePic);

            updatedUser = await User.findByIdAndUpdate(userId, {profilePic: upload.secure_url, bio, fullName}, {new: true});
        }
        //also update stream user
        try {
            await upsertStreamUser({
            id: updatedUser._id.toString(),
            name: updatedUser.fullName,
            image: updatedUser.profilePic || ""
        });
        console.log(`Stream user updated after profile updation ${updatedUser.fullName}`);

        } catch (streamError) {
            console.log("Error updating Stream user during profile updation ", streamError.message);
        }
      

        res.json({ success: true, user: updatedUser });
    } catch (error) {
        console.log(error.message);
        res.json({ success: true, user: error.message });
    }
}

// Controller to block / unblock a user
export const toggleBlockUser = async (req, res) => {
    try {
        const { id: targetUserId } = req.params;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) return res.json({ success: false, message: "User not found" });

        const isBlocked = user.blockedUsers?.includes(targetUserId);
        if (isBlocked) {
            user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== targetUserId);
        } else {
            user.blockedUsers.push(targetUserId);
        }

        await user.save();
        res.json({ success: true, isBlocked: !isBlocked, blockedUsers: user.blockedUsers });
    } catch (error) {
        console.log("Error in toggleBlockUser:", error.message);
        res.json({ success: false, message: error.message });
    }
};