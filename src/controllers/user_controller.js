import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user_model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser=asyncHandler(async (req,res)=>{
    //get user details from frontend
    const {fullName,username,email,password}=req.body;
    console.log(fullName,username,email,password);
    //validation(check for empty values)
    if(fullName===""){
        throw new ApiError(400,"FullName is required")
    }if(email===""){
        throw new ApiError(400,"Email is required")
    }if(username===""){
        throw new ApiError(400,"Username is required")
    }if(password===""){
        throw new ApiError(400,"Password is required")
    }
    //check if user already exists(check using username or email)
    const existedUser=User.findOne({
        $or:[{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username already exists");
    }
    //check for images,check for avatar
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required");
    }
    //upload them to cloudinary,avatar
    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new ApiError(400,"Avatar file is required");
    }
    // create user object -create entry in db
    //remove password and refresh token field from response
    //check for user creation
    const newUser=await User.create({
        fullName,
        avatar: avatar.url,
        coverImage:coverImage?.url||"",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser =await User.findById(newUser._id).select("-password -refreshToken");
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Successfully")
    )

})

export {registerUser}